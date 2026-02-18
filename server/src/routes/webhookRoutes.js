const express = require('express');
const router = express.Router();
const WebhookService = require('../services/WebhookService');
const { authenticate } = require('../middlewares/authMiddleware');
const Joi = require('joi');
const logger = require('../utils/logger');

router.use(authenticate);

/**
 * Create webhook subscription
 * POST /api/v1/webhooks
 */
router.post('/', async (req, res, next) => {
    try {
        const schema = Joi.object({
            url: Joi.string().uri().required(),
            events: Joi.array().items(
                Joi.string().valid(
                    'low-stock-alert',
                    'transfer-approval-needed',
                    'transfer-approved',
                    'transfer-rejected',
                    'item-checkout',
                    'item-checkin',
                    'user-login',
                    'user-logout',
                    'item-created',
                    'item-updated',
                    'item-deleted'
                )
            ).min(1).required(),
            filters: Joi.object({
                locations: Joi.array().items(Joi.string()),
                categories: Joi.array().items(Joi.string()),
                minStockThreshold: Joi.number().positive()
            }).optional(),
            headers: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
            retryPolicy: Joi.object({
                maxRetries: Joi.number().default(3),
                retryDelay: Joi.number().default(5000)
            }).optional(),
            timeout: Joi.number().default(30000)
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const webhook = await WebhookService.createWebhook(req.user.id, value);
        res.status(201).json({
            webhook: {
                id: webhook._id,
                url: webhook.url,
                events: webhook.events,
                active: webhook.active,
                secret: webhook.secret,
                createdAt: webhook.createdAt
            },
            message: 'Webhook created successfully. Save the secret for signature verification.'
        });
    } catch (err) {
        logger.error('Error creating webhook:', err);
        next(err);
    }
});

/**
 * Get user's webhooks
 * GET /api/v1/webhooks
 */
router.get('/', async (req, res, next) => {
    try {
        const active = req.query.active ? req.query.active === 'true' : null;
        const webhooks = await WebhookService.getUserWebhooks(req.user.id, active);
        
        res.json({
            webhooks: webhooks.map(w => ({
                id: w._id,
                url: w.url,
                events: w.events,
                active: w.active,
                filters: w.filters,
                statistics: w.statistics,
                createdAt: w.createdAt,
                updatedAt: w.updatedAt
            }))
        });
    } catch (err) {
        logger.error('Error fetching webhooks:', err);
        next(err);
    }
});

/**
 * Get webhook by ID
 * GET /api/v1/webhooks/:id
 */
router.get('/:id', async (req, res, next) => {
    try {
        const webhook = await WebhookService.getWebhookById(req.params.id);
        
        // Check authorization
        if (webhook.userId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        res.json({
            webhook: {
                id: webhook._id,
                url: webhook.url,
                events: webhook.events,
                active: webhook.active,
                filters: webhook.filters,
                headers: webhook.headers,
                retryPolicy: webhook.retryPolicy,
                timeout: webhook.timeout,
                statistics: webhook.statistics,
                createdAt: webhook.createdAt,
                updatedAt: webhook.updatedAt
            }
        });
    } catch (err) {
        logger.error('Error fetching webhook:', err);
        if (err.message === 'Webhook not found') {
            return res.status(404).json({ error: err.message });
        }
        next(err);
    }
});

/**
 * Update webhook
 * PUT /api/v1/webhooks/:id
 */
router.put('/:id', async (req, res, next) => {
    try {
        const webhook = await WebhookService.getWebhookById(req.params.id);
        
        // Check authorization
        if (webhook.userId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const schema = Joi.object({
            url: Joi.string().uri(),
            events: Joi.array().items(Joi.string().valid(
                'low-stock-alert',
                'transfer-approval-needed',
                'transfer-approved',
                'transfer-rejected',
                'item-checkout',
                'item-checkin',
                'user-login',
                'user-logout',
                'item-created',
                'item-updated',
                'item-deleted'
            )).min(1),
            filters: Joi.object(),
            headers: Joi.object().pattern(Joi.string(), Joi.string()),
            retryPolicy: Joi.object(),
            timeout: Joi.number(),
            active: Joi.boolean()
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const updated = await WebhookService.updateWebhook(req.params.id, value);

        res.json({
            webhook: {
                id: updated._id,
                url: updated.url,
                events: updated.events,
                active: updated.active,
                filters: updated.filters,
                statistics: updated.statistics,
                updatedAt: updated.updatedAt
            },
            message: 'Webhook updated successfully'
        });
    } catch (err) {
        logger.error('Error updating webhook:', err);
        if (err.message === 'Webhook not found') {
            return res.status(404).json({ error: err.message });
        }
        next(err);
    }
});

/**
 * Delete webhook
 * DELETE /api/v1/webhooks/:id
 */
router.delete('/:id', async (req, res, next) => {
    try {
        const webhook = await WebhookService.getWebhookById(req.params.id);
        
        // Check authorization
        if (webhook.userId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        await WebhookService.deleteWebhook(req.params.id);
        res.status(204).send();
    } catch (err) {
        logger.error('Error deleting webhook:', err);
        if (err.message === 'Webhook not found') {
            return res.status(404).json({ error: err.message });
        }
        next(err);
    }
});

/**
 * Get webhook events
 * GET /api/v1/webhooks/:id/events
 */
router.get('/:id/events', async (req, res, next) => {
    try {
        const webhook = await WebhookService.getWebhookById(req.params.id);
        
        // Check authorization
        if (webhook.userId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const skip = parseInt(req.query.skip) || 0;
        const limit = parseInt(req.query.limit) || 50;
        const status = req.query.status || null;

        const { events, total } = await WebhookService.getWebhookEvents(req.params.id, {
            skip,
            limit,
            status
        });

        res.json({
            events: events.map(e => ({
                id: e._id,
                eventType: e.eventType,
                data: e.data,
                deliveryStatus: e.deliveryStatus,
                deliveryAttempts: e.deliveryAttempts,
                lastAttempt: e.lastAttempt,
                nextRetry: e.nextRetry,
                httpResponse: e.httpResponse,
                error: e.error,
                createdAt: e.createdAt
            })),
            total,
            skip,
            limit
        });
    } catch (err) {
        logger.error('Error fetching webhook events:', err);
        if (err.message === 'Webhook not found') {
            return res.status(404).json({ error: err.message });
        }
        next(err);
    }
});

/**
 * Retry webhook event
 * POST /api/v1/webhooks/:id/events/:eventId/retry
 */
router.post('/:id/events/:eventId/retry', async (req, res, next) => {
    try {
        const webhook = await WebhookService.getWebhookById(req.params.id);
        
        // Check authorization
        if (webhook.userId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const event = await WebhookService.retryWebhookEvent(req.params.eventId);
        res.json({
            event: {
                id: event._id,
                eventType: event.eventType,
                deliveryStatus: event.deliveryStatus,
                deliveryAttempts: event.deliveryAttempts,
                message: 'Event retry initiated'
            }
        });
    } catch (err) {
        logger.error('Error retrying webhook event:', err);
        if (err.message.includes('not found')) {
            return res.status(404).json({ error: err.message });
        }
        next(err);
    }
});

/**
 * Get webhook statistics
 * GET /api/v1/webhooks/:id/stats
 */
router.get('/:id/stats', async (req, res, next) => {
    try {
        const webhook = await WebhookService.getWebhookById(req.params.id);
        
        // Check authorization
        if (webhook.userId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const stats = await WebhookService.getWebhookStats(req.params.id);
        res.json({ stats });
    } catch (err) {
        logger.error('Error fetching webhook stats:', err);
        if (err.message === 'Webhook not found') {
            return res.status(404).json({ error: err.message });
        }
        next(err);
    }
});

/**
 * Test webhook delivery
 * POST /api/v1/webhooks/:id/test
 */
router.post('/:id/test', async (req, res, next) => {
    try {
        const webhook = await WebhookService.getWebhookById(req.params.id);
        
        // Check authorization
        if (webhook.userId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const result = await WebhookService.testWebhook(req.params.id);
        res.json(result);
    } catch (err) {
        logger.error('Error testing webhook:', err);
        if (err.message === 'Webhook not found') {
            return res.status(404).json({ error: err.message });
        }
        next(err);
    }
});

module.exports = router;
