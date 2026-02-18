# Webhook Implementation Guide

## Overview

Webhooks have been integrated into Jossiedb to enable real-time event notifications for critical business events. This allows you to subscribe to events and receive HTTP POST notifications when they occur.

## Features

- **Event-driven architecture**: Subscribe to specific events
- **Automatic retry logic**: Failed deliveries are automatically retried
- **HMAC signature verification**: Secure webhook delivery with SHA256 signatures
- **Event filtering**: Filter webhooks by location and category
- **Delivery tracking**: Monitor webhook delivery success/failure
- **Event history**: Keep detailed logs of all webhook deliveries

## Supported Events

### Inventory Events
- `item-created` - When a new item is created
- `item-updated` - When an item is modified
- `item-deleted` - When an item is deleted
- `low-stock-alert` - When item stock falls below minimum threshold

### Transfer Events
- `transfer-approval-needed` - When a transfer request is created (awaiting approval)
- `transfer-approved` - When a transfer is approved
- `transfer-rejected` - When a transfer is rejected

### Checkout Events
- `item-checkout` - When an item is checked out
- `item-checkin` - When a checked-out item is returned

### User Events
- `user-login` - When a user logs in
- `user-logout` - When a user logs out

## API Endpoints

### Create Webhook Subscription
```
POST /api/v1/webhooks
Authorization: Bearer <token>

Body:
{
    "url": "https://your-api.com/webhooks/inventory",
    "events": ["low-stock-alert", "item-updated"],
    "filters": {
        "locations": ["locationId1", "locationId2"],
        "categories": ["categoryId1"],
        "minStockThreshold": 5
    },
    "headers": {
        "X-Custom-Header": "value"
    },
    "retryPolicy": {
        "maxRetries": 3,
        "retryDelay": 5000
    },
    "timeout": 30000
}

Response:
{
    "webhook": {
        "id": "webhookId",
        "url": "https://your-api.com/webhooks/inventory",
        "events": ["low-stock-alert", "item-updated"],
        "active": true,
        "secret": "webhook_secret_xyz...",
        "createdAt": "2026-02-18T..."
    },
    "message": "Webhook created successfully. Save the secret for signature verification."
}
```

### Get All Webhooks
```
GET /api/v1/webhooks
GET /api/v1/webhooks?active=true

Response:
{
    "webhooks": [
        {
            "id": "webhookId",
            "url": "https://your-api.com/webhooks/inventory",
            "events": ["low-stock-alert"],
            "active": true,
            "statistics": {
                "totalEvents": 15,
                "successfulDeliveries": 14,
                "failedDeliveries": 1
            }
        }
    ]
}
```

### Get Webhook Details
```
GET /api/v1/webhooks/:webhookId

Response:
{
    "webhook": {
        "id": "webhookId",
        "url": "https://your-api.com/webhooks/inventory",
        "events": ["low-stock-alert", "item-updated"],
        "active": true,
        "filters": { ... },
        "headers": { ... },
        "retryPolicy": { ... },
        "timeout": 30000,
        "statistics": { ... }
    }
}
```

### Update Webhook
```
PUT /api/v1/webhooks/:webhookId
Authorization: Bearer <token>

Body:
{
    "url": "https://new-url.com/webhook",
    "events": ["low-stock-alert"],
    "active": false
}

Response:
{
    "webhook": { ... },
    "message": "Webhook updated successfully"
}
```

### Delete Webhook
```
DELETE /api/v1/webhooks/:webhookId

Response: 204 No Content
```

### Get Webhook Events (Delivery History)
```
GET /api/v1/webhooks/:webhookId/events
GET /api/v1/webhooks/:webhookId/events?skip=0&limit=50&status=failed

Response:
{
    "events": [
        {
            "id": "eventId",
            "eventType": "low-stock-alert",
            "data": { ... },
            "deliveryStatus": "success",
            "deliveryAttempts": 1,
            "lastAttempt": "2026-02-18T...",
            "httpResponse": {
                "statusCode": 200,
                "body": "{...}"
            }
        }
    ],
    "total": 150,
    "skip": 0,
    "limit": 50
}
```

### Retry Failed Event
```
POST /api/v1/webhooks/:webhookId/events/:eventId/retry

Response:
{
    "event": {
        "id": "eventId",
        "eventType": "low-stock-alert",
        "deliveryStatus": "pending",
        "message": "Event retry initiated"
    }
}
```

### Get Webhook Statistics
```
GET /api/v1/webhooks/:webhookId/stats

Response:
{
    "stats": {
        "totalEvents": 100,
        "successfulDeliveries": 98,
        "failedDeliveries": 2,
        "successCount": 98,
        "failedCount": 2,
        "pendingCount": 0,
        "successRate": "98.00",
        "lastDelivery": "2026-02-18T...",
        "lastFailure": "2026-02-18T..."
    }
}
```

### Test Webhook
```
POST /api/v1/webhooks/:webhookId/test

Response:
{
    "success": true,
    "statusCode": 200,
    "message": "Test webhook delivered successfully"
}
```

## Webhook Payload Format

All webhook payloads are sent as JSON with the following structure:

```javascript
{
    "id": "unique-event-id",
    "eventType": "low-stock-alert",
    "data": {
        // Event-specific data
    },
    "timestamp": "2026-02-18T12:34:56.789Z",
    "attempt": 1
}
```

### Example Payloads

#### low-stock-alert
```json
{
    "id": "event-123",
    "eventType": "low-stock-alert",
    "data": {
        "itemId": "item-123",
        "name": "Hydraulic Pump",
        "sku": "HP-001",
        "currentStock": 2,
        "minStock": 5,
        "location_id": "loc-456",
        "category_id": "cat-789",
        "alert": "Item Hydraulic Pump stock is critically low!"
    },
    "timestamp": "2026-02-18T12:34:56Z",
    "attempt": 1
}
```

#### transfer-approval-needed
```json
{
    "id": "event-124",
    "eventType": "transfer-approval-needed",
    "data": {
        "transferId": "transfer-123",
        "itemId": "item-456",
        "quantity": 10,
        "fromLocation": "loc-001",
        "toLocation": "loc-002",
        "requestedBy": "user-789",
        "reason": "Warehouse reorganization",
        "status": "pending"
    },
    "timestamp": "2026-02-18T12:34:56Z",
    "attempt": 1
}
```

#### item-checkout
```json
{
    "id": "event-125",
    "eventType": "item-checkout",
    "data": {
        "checkoutId": "checkout-123",
        "itemId": "item-789",
        "quantity": 5,
        "userId": "user-123",
        "status": "active",
        "destinationLocation": "loc-003",
        "projectId": "project-456"
    },
    "timestamp": "2026-02-18T12:34:56Z",
    "attempt": 1
}
```

#### user-login
```json
{
    "id": "event-126",
    "eventType": "user-login",
    "data": {
        "userId": "user-123",
        "username": "john.doe",
        "email": "john@example.com",
        "role": "supervisor",
        "userAgent": "Mozilla/5...",
        "ipAddress": "192.168.1.100",
        "deviceInfo": "Chrome",
        "timestamp": "2026-02-18T12:34:56Z"
    }
}
```

## Security

### Signature Verification

Every webhook includes an `X-Webhook-Signature` header with an HMAC-SHA256 signature of the payload. Verify it using your webhook secret:

```javascript
// Node.js example
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload.data))
        .digest('hex');
    
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}

// In your webhook receiver
app.post('/webhook', (req, res) => {
    const signature = req.headers['x-webhook-signature'];
    const payload = req.body;
    
    if (!verifySignature(payload, signature, process.env.WEBHOOK_SECRET)) {
        return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // Process webhook...
});
```

### Headers Included in All Requests
- `X-Webhook-Signature` - HMAC-SHA256 signature
- `X-Webhook-ID` - Webhook subscription ID
- `X-Event-Type` - Event type name
- `Content-Type` - application/json
- Plus any custom headers configured

## Retry Policy

Failed deliveries are automatically retried with exponential backoff:

Default configuration:
- **Max Retries**: 3
- **Retry Delay**: 5000ms (5 seconds)
- **Timeout**: 30000ms (30 seconds)

### Retry Behavior
1. Webhook delivery fails
2. System waits for `retryDelay` milliseconds
3. Retry attempt is made
4. If total attempts reach `maxRetries`, webhook is marked failed
5. Failed webhooks can be manually retried via API

## Best Practices

1. **Response Quickly**: Return a 2xx status code immediately. Don't process the webhook synchronously.
   ```javascript
   app.post('/webhook', async (req, res) => {
       res.status(200).json({ received: true }); // Send immediately
       
       // Process asynchronously
       handleWebhookAsync(req.body).catch(err => logger.error(err));
   });
   ```

2. **Verify Signatures**: Always verify the webhook signature before processing.

3. **Handle Duplicates**: Implement idempotency using the event ID.
   ```javascript
   // Store processed event IDs
   app.post('/webhook', async (req, res) => {
       const eventId = req.body.id;
       
       if (await isProcessed(eventId)) {
           return res.status(200).json({ received: true });
       }
       
       await processEvent(req.body);
       await markProcessed(eventId);
       res.json({ received: true });
   });
   ```

4. **Use Specific Events**: Subscribe only to events you need to reduce noise.

5. **Monitor Delivery**: Regularly check webhook statistics and retry failed events.

6. **Test Webhooks**: Use the test endpoint to validate your webhook URL.

## Implementation Examples

### Python Flask
```python
from flask import Flask, request
import hmac
import hashlib
import json

app = Flask(__name__)
WEBHOOK_SECRET = 'your_webhook_secret'

def verify_signature(payload, signature):
    expected = hmac.new(
        WEBHOOK_SECRET.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(signature, expected)

@app.route('/webhook', methods=['POST'])
def handle_webhook():
    signature = request.headers.get('X-Webhook-Signature')
    payload = request.get_data()
    
    if not verify_signature(payload, signature):
        return {'error': 'Invalid signature'}, 401
    
    data = request.json
    print(f"Received {data['eventType']} event")
    
    return {'received': True}
```

### JavaScript Express
```javascript
const express = require('express');
const crypto = require('crypto');

const app = express();
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

app.post('/webhook', express.json(), (req, res) => {
    const signature = req.headers['x-webhook-signature'];
    const payload = JSON.stringify(req.body.data);
    
    const expectedSignature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');
    
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        return res.status(401).json({ error: 'Invalid signature' });
    }
    
    console.log(`Received ${req.body.eventType} event`);
    res.json({ received: true });
});
```

## Troubleshooting

### Webhooks Not Being Delivered
1. Check webhook is active: `GET /api/v1/webhooks/:id`
2. Verify URL is correct and accessible externally
3. Check event filters match your data
4. Review delivery attempts: `GET /api/v1/webhooks/:id/events?status=failed`

### Signature Verification Failing
1. Ensure you're using the exact webhook secret (save it securely)
2. Verify you're hashing the correct payload data
3. Check that your HMAC algorithm is SHA256

### Webhooks Stuck in "Pending"
1. Check webhook timeout setting
2. Verify your endpoint is responding with 2xx status
3. Review server logs for errors

## Webhook URL Requirements

- Must be publicly accessible (https:// for production)
- Should respond within configured timeout (default 30s)
- Must return 2xx status code for successful delivery
- Should handle retries gracefully (idempotency)
- Should verify signature before processing

## Limits

- Request timeout: 5s - 60s (configurable)
- Max custom headers: 50
- Max events stored: 30 days (auto-deleted)
- Max retries: 1 - 10
- Retry delay: 100ms - 60s

## Migration from Polling

If you're currently polling the API, webhooks provide these benefits:

| Aspect | Polling | Webhooks |
|--------|---------|----------|
| Latency | High (1-5 min delay) | Low (near real-time) |
| Server Load | High (constant requests) | Low (event-driven) |
| Bandwidth | High (many empty responses) | Low (only on events) |
| Complexity | Simple | More robust |
| Cost | Higher | Lower |

## Monitoring

Monitor webhook health via:

1. **Dashboard**: Check statistics for each webhook
2. **Failed Events**: Query failed deliveries regularly
3. **Success Rate**: Monitor `POST /api/v1/webhooks/:id/stats`
4. **Logs**: Review delivery attempts and errors

## Support

For webhooks help:
- Check delivery history: `GET /api/v1/webhooks/:id/events`
- Test webhook: `POST /api/v1/webhooks/:id/test`
- Verify signature implementation
- Review retry policy configuration

---

**Created**: February 18, 2026  
**Status**: Ready for Production
