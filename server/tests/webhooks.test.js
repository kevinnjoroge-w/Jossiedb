const request = require('supertest');
const crypto = require('crypto');
const { User, Webhook, WebhookEvent, Item, Category, Location } = require('../models');

// Mock app for testing (assumes app is exported from app.js)
const app = require('../app');

describe('Webhook Service Tests', () => {
    let userId, webhookId, itemId, categoryId, locationId;
    let authToken;

    beforeAll(async () => {
        // Create test user
        const user = await User.create({
            username: 'webhook-test-user',
            email: 'webhook@test.com',
            password: 'Test123!@',
            full_name: 'Webhook Tester',
            role: 'admin'
        });
        userId = user._id;

        // Generate token
        const AuthService = require('../services/AuthService');
        const { token } = AuthService.generateToken(user);
        authToken = token;

        // Create test category and location
        const category = await Category.create({ name: 'Test Category' });
        categoryId = category._id;

        const location = await Location.create({ name: 'Test Location' });
        locationId = location._id;
    });

    describe('POST /api/v1/webhooks - Create Webhook', () => {
        it('should create a webhook subscription', async () => {
            const response = await request(app)
                .post('/api/v1/webhooks')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    url: 'https://webhook.example.com/events',
                    events: ['low-stock-alert', 'item-updated'],
                    filters: {
                        locations: [locationId],
                        minStockThreshold: 5
                    }
                });

            expect(response.status).toBe(201);
            expect(response.body.webhook).toHaveProperty('id');
            expect(response.body.webhook).toHaveProperty('secret');
            expect(response.body.webhook.events).toContain('low-stock-alert');
            webhookId = response.body.webhook.id;
        });

        it('should validate webhook URL', async () => {
            const response = await request(app)
                .post('/api/v1/webhooks')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    url: 'invalid-url',
                    events: ['low-stock-alert']
                });

            expect(response.status).toBe(400);
        });

        it('should require at least one event', async () => {
            const response = await request(app)
                .post('/api/v1/webhooks')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    url: 'https://webhook.example.com/events',
                    events: []
                });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/v1/webhooks - List Webhooks', () => {
        it('should list all user webhooks', async () => {
            const response = await request(app)
                .get('/api/v1/webhooks')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.webhooks)).toBe(true);
            expect(response.body.webhooks.length).toBeGreaterThan(0);
        });

        it('should filter active webhooks', async () => {
            const response = await request(app)
                .get('/api/v1/webhooks?active=true')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            response.body.webhooks.forEach(webhook => {
                expect(webhook.active).toBe(true);
            });
        });
    });

    describe('PUT /api/v1/webhooks/:id - Update Webhook', () => {
        it('should update webhook configuration', async () => {
            const response = await request(app)
                .put(`/api/v1/webhooks/${webhookId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    url: 'https://new-webhook.example.com/events',
                    active: false
                });

            expect(response.status).toBe(200);
            expect(response.body.webhook.active).toBe(false);
        });
    });

    describe('GET /api/v1/webhooks/:id/events - Webhook Events', () => {
        it('should retrieve webhook events', async () => {
            const response = await request(app)
                .get(`/api/v1/webhooks/${webhookId}/events`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('events');
            expect(response.body).toHaveProperty('total');
        });

        it('should filter events by status', async () => {
            const response = await request(app)
                .get(`/api/v1/webhooks/${webhookId}/events?status=failed`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            response.body.events.forEach(event => {
                expect(event.deliveryStatus).toBe('failed');
            });
        });

        it('should support pagination', async () => {
            const response = await request(app)
                .get(`/api/v1/webhooks/${webhookId}/events?skip=0&limit=10`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.skip).toBe(0);
            expect(response.body.limit).toBe(10);
        });
    });

    describe('POST /api/v1/webhooks/:id/test - Test Webhook', () => {
        it('should test webhook delivery', async () => {
            const response = await request(app)
                .post(`/api/v1/webhooks/${webhookId}/test`)
                .set('Authorization', `Bearer ${authToken}`);

            // Will fail because webhook URL is fake, but should return appropriate response
            expect([200, 400, 401, 502, 503]).toContain(response.status);
        });
    });

    describe('GET /api/v1/webhooks/:id/stats - Webhook Statistics', () => {
        it('should return webhook statistics', async () => {
            const response = await request(app)
                .get(`/api/v1/webhooks/${webhookId}/stats`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.stats).toHaveProperty('totalEvents');
            expect(response.body.stats).toHaveProperty('successfulDeliveries');
            expect(response.body.stats).toHaveProperty('failedDeliveries');
            expect(response.body.stats).toHaveProperty('successRate');
        });
    });

    describe('Webhook Trigger Tests', () => {
        beforeAll(async () => {
            // Re-activate webhook for testing
            await Webhook.findByIdAndUpdate(webhookId, { active: true });
        });

        it('should trigger low-stock-alert on inventory update', async () => {
            const item = await Item.create({
                name: 'Test Item',
                sku: 'TEST-001',
                quantity: 2,
                min_quantity: 5,
                category_id: categoryId,
                location_id: locationId
            });
            itemId = item._id;

            // Update item to trigger low-stock alert
            await request(app)
                .put(`/api/v1/items/${itemId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    quantity: 2
                });

            // Check if webhook event was created
            const events = await WebhookEvent.find({
                webhookId,
                eventType: 'low-stock-alert'
            });

            expect(events.length).toBeGreaterThan(0);
        });

        it('should trigger item-updated on item change', async () => {
            await request(app)
                .put(`/api/v1/items/${itemId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Updated Item Name'
                });

            const events = await WebhookEvent.find({
                webhookId,
                eventType: 'item-updated'
            });

            expect(events.length).toBeGreaterThan(0);
        });

        it('should trigger item-deleted on item deletion', async () => {
            await request(app)
                .delete(`/api/v1/items/${itemId}`)
                .set('Authorization', `Bearer ${authToken}`);

            const events = await WebhookEvent.find({
                webhookId,
                eventType: 'item-deleted'
            });

            expect(events.length).toBeGreaterThan(0);
        });
    });

    describe('Security Tests', () => {
        it('should verify webhook signature', () => {
            const WebhookService = require('../services/WebhookService');
            const secret = 'test-secret';
            const payload = JSON.stringify({ test: 'data' });
            
            const signature = crypto
                .createHmac('sha256', secret)
                .update(payload)
                .digest('hex');

            expect(WebhookService.verifySignature(payload, signature, secret)).toBe(true);
        });

        it('should reject invalid signature', () => {
            const WebhookService = require('../services/WebhookService');
            const secret = 'test-secret';
            const payload = JSON.stringify({ test: 'data' });
            const invalidSignature = 'invalid-sig';

            expect(() => {
                WebhookService.verifySignature(payload, invalidSignature, secret);
            }).toThrow();
        });

        it('should prevent unauthorized webhook access', async () => {
            const otherUser = await User.create({
                username: 'other-user',
                email: 'other@test.com',
                password: 'Test123!@',
                full_name: 'Other User',
                role: 'worker'
            });

            const AuthService = require('../services/AuthService');
            const { token: otherToken } = AuthService.generateToken(otherUser);

            const response = await request(app)
                .get(`/api/v1/webhooks/${webhookId}`)
                .set('Authorization', `Bearer ${otherToken}`);

            expect(response.status).toBe(403);
        });
    });

    describe('DELETE /api/v1/webhooks/:id - Delete Webhook', () => {
        it('should delete webhook subscription', async () => {
            const response = await request(app)
                .delete(`/api/v1/webhooks/${webhookId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(204);

            // Verify deletion
            const deleted = await Webhook.findById(webhookId);
            expect(deleted).toBeNull();
        });
    });

    afterAll(async () => {
        // Cleanup
        await User.deleteMany({ username: /webhook-test-user|other-user/ });
        await Webhook.deleteMany({ userId });
        await WebhookEvent.deleteMany({ webhookId });
        await Item.deleteMany({ _id: itemId });
        await Category.deleteMany({ _id: categoryId });
        await Location.deleteMany({ _id: locationId });
    });
});
