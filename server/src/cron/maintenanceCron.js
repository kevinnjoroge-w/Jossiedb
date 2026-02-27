const cron = require('node-cron');
const { Maintenance } = require('../models');
const logger = require('../utils/logger');
const AuditService = require('../services/AuditService');

const startMaintenanceCron = () => {
    // Run daily at midnight
    logger.info('Initializing maintenance recurring cron job (daily at 00:00)');

    cron.schedule('0 0 * * *', async () => {
        logger.info('Running recurring maintenance checks...');
        try {
            // Find all completed maintenance jobs that have recurring enabled
            const recurringJobs = await Maintenance.find({
                status: 'completed',
                'recurring.enabled': true,
                'recurring.frequency_days': { $exists: true, $gt: 0 }
            });

            const now = new Date();
            let createdCount = 0;

            for (const job of recurringJobs) {
                const completionDate = job.completed_date || job.updatedAt;

                // Calculate next due date
                const nextDueDate = new Date(completionDate);
                nextDueDate.setDate(nextDueDate.getDate() + job.recurring.frequency_days);

                // If the next due date is in the past or today, we need to schedule a new one
                if (nextDueDate <= now) {
                    // Check if an active instance already exists to avoid duplicates
                    const existingActive = await Maintenance.findOne({
                        item_id: job.item_id,
                        type: job.type,
                        status: { $in: ['scheduled', 'in_progress'] },
                        'recurring.enabled': true
                    });

                    if (!existingActive) {
                        const newMaintenance = await Maintenance.create({
                            item_id: job.item_id,
                            technician_id: job.technician_id, // keep the same technician by default
                            type: job.type,
                            description: `[Recurring] ${job.description}`,
                            status: 'scheduled',
                            scheduled_date: nextDueDate, // Schedule it for today or its exact due date
                            recurring: {
                                enabled: true,
                                frequency_days: job.recurring.frequency_days
                            }
                        });

                        await AuditService.logAction('SCHEDULE_MAINTENANCE', 'Maintenance', newMaintenance._id, null, {
                            note: 'Auto-generated from recurring schedule'
                        });

                        // Disable recurring on the OLD completed job so it doesn't spawn again tomorrow
                        // The chain is continued by the NEW active maintenance job
                        job.recurring.enabled = false;
                        await job.save();

                        createdCount++;
                    }
                }
            }

            logger.info(`Recurring maintenance check completed. Created ${createdCount} new scheduled tasks.`);
        } catch (error) {
            logger.error('Error running maintenance cron job: ', error);
        }
    });
};

module.exports = { startMaintenanceCron };
