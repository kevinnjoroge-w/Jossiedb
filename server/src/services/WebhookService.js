const crypto = require('crypto');
const axios = require('axios');
const { Webhook, WebhookEvent } = require('../models');
const logger = require('../utils/logger');
const cache = require('../utils/cache');

class WebhookService {
    /**
     * Create a new webhook subscription
     */
    static async createWebhook(userId, webhookData) {
        try {
            const secret = crypto.randomBytes(32).toString('hex');
            const webhook = new Webhook({
                userId,
                url: webhookData.url,
                events: webhookData.events,
                filters: webhookData.filters || {},
                secret,
                headers: webhookData.headers || {},
                retryPolicy: webhookData.retryPolicy || {},
                timeout: webhookData.timeout
            });

            await webhook.save();
            
            // Invalidate webhook cache
            await cache.del(cache.getCacheKey('webhooks', 'active'));
            
            logger.info(`Webhook created for user ${userId}:`, webhook.id);
            return webhook;
        } catch (err) {
            logger.error('Error creating webhook:', err);
            throw err;
        }
    }

    /**
     * Get user's webhooks
     */
    static async getUserWebhooks(userId, active = true) {
        try {
            const query = { userId };
            if (active !== null) {
                query.active = active;
            }
            return await Webhook.find(query);
        } catch (err) {
            logger.error('Error fetching webhooks:', err);
            throw err;
        }
    }

    /**
     * Get webhook by ID
     */
    static async getWebhookById(webhookId) {
        try {
            const webhook = await Webhook.findById(webhookId);
            if (!webhook) {
                throw new Error('Webhook not found');
            }
            return webhook;
        } catch (err) {
            logger.error('Error fetching webhook:', err);
            throw err;
        }
    }

    /**
     * Update webhook
     */
    static async updateWebhook(webhookId, updates) {
        try {
            // Don't allow updating the secret
            delete updates.secret;

            const webhook = await Webhook.findByIdAndUpdate(
                webhookId,
                { ...updates, updatedAt: new Date() },
                { new: true, runValidators: true }
            );

            if (!webhook) {
                throw new Error('Webhook not found');
            }

            // Invalidate webhook cache
            await cache.del(cache.getCacheKey('webhooks', 'active'));

            logger.info(`Webhook ${webhookId} updated`);
            return webhook;
        } catch (err) {
            logger.error('Error updating webhook:', err);
            throw err;
        }
    }

    /**
     * Delete webhook
     */
    static async deleteWebhook(webhookId) {
        try {
            const webhook = await Webhook.findByIdAndDelete(webhookId);
            if (!webhook) {
                throw new Error('Webhook not found');
            }
            
            // Also delete all events for this webhook
            await WebhookEvent.deleteMany({ webhookId });
            
            // Invalidate webhook cache
            await cache.del(cache.getCacheKey('webhooks', 'active'));
            
            logger.info(`Webhook ${webhookId} deleted`);
            return webhook;
        } catch (err) {
            logger.error('Error deleting webhook:', err);
            throw err;
        }
    }

    /**
     * Trigger webhook event
     */
    static async triggerWebhookEvent(eventType, data, filters = {}) {
        try {
            // Try to get cached webhooks first
            const cacheKey = cache.getCacheKey('webhooks', 'active');
            let webhooks = await cache.get(cacheKey);
            
            if (!webhooks) {
                // Find matching webhooks
                const query = {
                    active: true,
                    events: eventType
                };

                webhooks = await Webhook.find(query);
                
                // Cache the results
                await cache.set(cacheKey, webhooks, cache.DEFAULT_TTL.WEBHOOKS_ACTIVE);
            }

            for (const webhook of webhooks) {
                // Check if webhook matches filters
                if (!this._matchesFilters(webhook, filters)) {
                    continue;
                }

                // Create event record
                const event = new WebhookEvent({
                    webhookId: webhook._id,
                    eventType,
                    data,
                    deliveryStatus: 'pending'
                });

                await event.save();

                // Queue for delivery
                this._queueDelivery(webhook, event);
            }

            logger.info(`Webhook event triggered: ${eventType} for ${webhooks.length} subscribers`);
        } catch (err) {
            logger.error('Error triggering webhook event:', err);
            throw err; // Propagate error to caller
        }
    }

    /**
     * Check if webhook filters match the data
     */
    static _matchesFilters(webhook, filters) {
        // Location filter
        if (webhook.filters.locations && webhook.filters.locations.length > 0) {
            if (filters.locationId) {
                const locationMatch = webhook.filters.locations.some(
                    loc => loc.toString() === filters.locationId.toString()
                );
                if (!locationMatch) return false;
            }
        }

        // Category filter
        if (webhook.filters.categories && webhook.filters.categories.length > 0) {
            if (filters.categoryId) {
                const categoryMatch = webhook.filters.categories.some(
                    cat => cat.toString() === filters.categoryId.toString()
                );
                if (!categoryMatch) return false;
            }
        }

        // Stock threshold filter
        if (webhook.filters.minStockThreshold) {
            if (filters.currentStock !== undefined) {
                if (filters.currentStock >= webhook.filters.minStockThreshold) {
                    return false; // Stock not low enough
                }
            }
        }

        return true;
    }

    /**
     * Queue webhook delivery with retry logic
     */
    static _queueDelivery(webhook, event) {
        // Deliver immediately with retry on failure
        setTimeout(async () => {
            await this._deliverWebhook(webhook, event);
        }, 0);
    }

    /**
     * Deliver webhook with retry logic
     */
    static async _deliverWebhook(webhook, event) {
        try {
            const signature = this._generateSignature(JSON.stringify(event.data), webhook.secret);
            
            const config = {
                method: 'POST',
                url: webhook.url,
                data: {
                    id: event._id,
                    eventType: event.eventType,
                    data: event.data,
                    timestamp: new Date().toISOString(),
                    attempt: event.deliveryAttempts + 1
                },
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Signature': signature,
                    'X-Webhook-ID': webhook._id.toString(),
                    'X-Event-Type': event.eventType,
                    ...webhook.headers
                },
                timeout: webhook.timeout
            };

            const response = await axios(config);

            // Success
            event.deliveryStatus = 'success';
            event.httpResponse = {
                statusCode: response.status,
                body: JSON.stringify(response.data)
            };
            event.lastAttempt = new Date();
            await event.save();

            // Update webhook statistics
            webhook.statistics.successfulDeliveries += 1;
            webhook.statistics.lastDelivery = new Date();
            webhook.statistics.totalEvents += 1;
            await webhook.save();

            logger.info(`Webhook ${webhook._id} delivered successfully`);
        } catch (err) {
            event.deliveryAttempts += 1;
            event.lastAttempt = new Date();
            event.error = err.message;

            // Check if should retry
            if (event.deliveryAttempts < webhook.retryPolicy.maxRetries) {
                event.deliveryStatus = 'pending';
                event.nextRetry = new Date(Date.now() + webhook.retryPolicy.retryDelay);
                logger.warn(`Webhook ${webhook._id} failed, scheduling retry ${event.deliveryAttempts}/${webhook.retryPolicy.maxRetries}`);
            } else {
                event.deliveryStatus = 'failed';
                logger.error(`Webhook ${webhook._id} failed after ${webhook.retryPolicy.maxRetries} retries`);

                // Update webhook statistics
                webhook.statistics.failedDeliveries += 1;
                webhook.statistics.lastFailure = new Date();
                await webhook.save();
            }

            await event.save();

            // Retry if needed
            if (event.deliveryStatus === 'pending') {
                setTimeout(() => {
                    this._deliverWebhook(webhook, event);
                }, webhook.retryPolicy.retryDelay);
            }
        }
    }

    /**
     * Generate HMAC signature
     */
    static _generateSignature(payload, secret) {
        return crypto
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');
    }

    /**
     * Verify webhook signature
     */
    static verifySignature(payload, signature, secret) {
        const expectedSignature = this._generateSignature(payload, secret);
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    }

    /**
     * Get webhook events for a webhook
     */
    static async getWebhookEvents(webhookId, options = {}) {
        try {
            const skip = options.skip || 0;
            const limit = options.limit || 50;
            const status = options.status || null;

            const query = { webhookId };
            if (status) {
                query.deliveryStatus = status;
            }

            const events = await WebhookEvent.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const total = await WebhookEvent.countDocuments(query);

            return { events, total };
        } catch (err) {
            logger.error('Error fetching webhook events:', err);
            throw err;
        }
    }

    /**
     * Retry failed webhook delivery
     */
    static async retryWebhookEvent(eventId) {
        try {
            const event = await WebhookEvent.findById(eventId);
            if (!event) {
                throw new Error('Event not found');
            }

            const webhook = await Webhook.findById(event.webhookId);
            if (!webhook) {
                throw new Error('Webhook not found');
            }

            event.deliveryAttempts = 0;
            event.deliveryStatus = 'pending';
            event.nextRetry = null;
            await event.save();

            await this._deliverWebhook(webhook, event);

            logger.info(`Webhook event ${eventId} retry initiated`);
            return event;
        } catch (err) {
            logger.error('Error retrying webhook event:', err);
            throw err;
        }
    }

    /**
     * Get webhook statistics
     */
    static async getWebhookStats(webhookId) {
        try {
            const webhook = await Webhook.findById(webhookId);
            if (!webhook) {
                throw new Error('Webhook not found');
            }

            const successCount = await WebhookEvent.countDocuments({
                webhookId,
                deliveryStatus: 'success'
            });

            const failedCount = await WebhookEvent.countDocuments({
                webhookId,
                deliveryStatus: 'failed'
            });

            const pendingCount = await WebhookEvent.countDocuments({
                webhookId,
                deliveryStatus: 'pending'
            });

            return {
                ...webhook.statistics.toObject(),
                successCount,
                failedCount,
                pendingCount,
                successRate: webhook.statistics.totalEvents > 0 
                    ? ((webhook.statistics.successfulDeliveries / webhook.statistics.totalEvents) * 100).toFixed(2)
                    : 0
            };
        } catch (err) {
            logger.error('Error fetching webhook stats:', err);
            throw err;
        }
    }

    /**
     * Test webhook
     */
    static async testWebhook(webhookId) {
        try {
            const webhook = await Webhook.findById(webhookId);
            if (!webhook) {
                throw new Error('Webhook not found');
            }

            const testData = {
                id: 'test-' + Date.now(),
                eventType: 'test',
                data: {
                    message: 'This is a test webhook delivery',
                    timestamp: new Date().toISOString()
                },
                timestamp: new Date().toISOString(),
                attempt: 1
            };

            const signature = this._generateSignature(JSON.stringify(testData.data), webhook.secret);

            const response = await axios.post(webhook.url, testData, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Signature': signature,
                    'X-Webhook-ID': webhook._id.toString(),
                    'X-Event-Type': 'test',
                    ...webhook.headers
                },
                timeout: webhook.timeout
            });

            logger.info(`Webhook ${webhookId} test successful`);
            return {
                success: true,
                statusCode: response.status,
                message: 'Test webhook delivered successfully'
            };
        } catch (err) {
            logger.error(`Webhook ${webhookId} test failed:`, err);
            return {
                success: false,
                error: err.message,
                message: 'Test webhook failed'
            };
        }
    }
}

module.exports = WebhookService;
