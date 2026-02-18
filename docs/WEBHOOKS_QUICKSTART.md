# Webhook Quick Start

## 5-Minute Setup

### 1. Create Your Webhook Endpoint
Create an HTTPS endpoint that accepts POST requests:

```javascript
// Node.js Express
app.post('/webhook', express.json(), (req, res) => {
    // Respond immediately
    res.json({ ok: true });
    
    // Process async
    console.log(`Event: ${req.body.eventType}`);
});
```

### 2. Subscribe to Events
```bash
curl -X POST http://localhost:3002/api/v1/webhooks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-domain.com/webhook",
    "events": ["low-stock-alert", "transfer-approval-needed"]
  }'
```

**Response:**
```json
{
  "webhook": {
    "id": "webhook_abc123",
    "secret": "whsec_def456...",
    "events": ["low-stock-alert", "transfer-approval-needed"]
  }
}
```

**⚠️ IMPORTANT: Save the secret! You'll need it to verify signatures.**

### 3. Verify Webhook Signature
Add signature verification to your endpoint:

```javascript
const crypto = require('crypto');

app.post('/webhook', express.json(), (req, res) => {
    const signature = req.headers['x-webhook-signature'];
    const secret = process.env.WEBHOOK_SECRET;
    
    // Create expected signature
    const payload = JSON.stringify(req.body.data);
    const expected = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
    
    // Verify
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
        return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // Valid webhook!
    res.json({ received: true });
});
```

### 4. Handle Events
```javascript
app.post('/webhook', express.json(), (req, res) => {
    res.json({ received: true }); // Always respond first
    
    const { eventType, data } = req.body;
    
    switch(eventType) {
        case 'low-stock-alert':
            console.log(`⚠️ LOW STOCK: ${data.name} (${data.currentStock}/${data.minStock})`);
            // Send email, Slack message, etc.
            break;
            
        case 'transfer-approval-needed':
            console.log(`📦 TRANSFER: ${data.quantity} items need approval`);
            // Send notification
            break;
            
        case 'item-checkout':
            console.log(`🔴 CHECKOUT: Item checked out by ${data.userId}`);
            break;
    }
});
```

## Event Reference

### Low Stock Alert
```json
{
    "eventType": "low-stock-alert",
    "data": {
        "itemId": "item-123",
        "name": "Hydraulic Pump",
        "currentStock": 2,
        "minStock": 5,
        "location_id": "loc-456"
    }
}
```

### Transfer Approval Needed
```json
{
    "eventType": "transfer-approval-needed",
    "data": {
        "transferId": "transfer-789",
        "itemId": "item-123",
        "quantity": 10,
        "fromLocation": "loc-001",
        "toLocation": "loc-002"
    }
}
```

### Item Checkout
```json
{
    "eventType": "item-checkout",
    "data": {
        "checkoutId": "checkout-101",
        "itemId": "item-123",
        "quantity": 5,
        "userId": "user-456"
    }
}
```

### User Login
```json
{
    "eventType": "user-login",
    "data": {
        "userId": "user-456",
        "username": "john.doe",
        "ipAddress": "192.168.1.100"
    }
}
```

## Common Tasks

### List Your Webhooks
```bash
curl http://localhost:3002/api/v1/webhooks \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Check Delivery Status
```bash
curl http://localhost:3002/api/v1/webhooks/:id/events \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Your Webhook
```bash
curl -X POST http://localhost:3002/api/v1/webhooks/:id/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### View Statistics
```bash
curl http://localhost:3002/api/v1/webhooks/:id/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update Webhook
```bash
curl -X PUT http://localhost:3002/api/v1/webhooks/:id \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "events": ["low-stock-alert"],
    "active": true
  }'
```

### Delete Webhook
```bash
curl -X DELETE http://localhost:3002/api/v1/webhooks/:id \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Deployment Checklist

- [ ] Create public HTTPS webhook endpoint
- [ ] Add signature verification
- [ ] Test webhook locally (`npm test -- tests/webhooks.test.js`)
- [ ] Deploy endpoint to production server
- [ ] Create webhooks via API with correct URL
- [ ] Test with `POST /api/v1/webhooks/:id/test`
- [ ] Monitor delivery stats
- [ ] Set up alerts for failed deliveries

## Troubleshooting

### "Webhook not being called"
1. Verify URL is publicly accessible: `curl https://your-domain.com/webhook`
2. Check webhook is active: `GET /api/v1/webhooks/:id`
3. View delivery attempts: `GET /api/v1/webhooks/:id/events?status=failed`
4. Test webhook: `POST /api/v1/webhooks/:id/test`

### "Signature verification failing"
1. Check you're using the correct secret
2. Verify you're hashing `req.body.data` (not entire request)
3. Compare using `timingSafeEqual` (not `===`)

### "Retry failed"
1. Check endpoint is returning 2xx status
2. Verify timeout isn't exceeded (default 30s)
3. Check for network/firewall issues
3. Retry manually: `POST /api/v1/webhooks/:id/events/:eventId/retry`

## Implementation Examples

### Python Flask
```python
from flask import Flask, request
import hmac
import hashlib

app = Flask(__name__)
SECRET = 'your_webhook_secret'

@app.route('/webhook', methods=['POST'])
def webhook():
    # Verify signature
    signature = request.headers.get('X-Webhook-Signature')
    payload = request.get_data()
    expected = hmac.new(SECRET.encode(), payload, hashlib.sha256).hexdigest()
    
    if not hmac.compare_digest(signature, expected):
        return {'error': 'Invalid signature'}, 401
    
    data = request.json
    print(f"Received {data['eventType']}")
    return {'ok': True}
```

### PHP
```php
<?php
$secret = getenv('WEBHOOK_SECRET');
$signature = $_SERVER['HTTP_X_WEBHOOK_SIGNATURE'] ?? '';
$payload = file_get_contents('php://input');

$expected = hash_hmac('sha256', $payload, $secret);
if (!hash_equals($signature, $expected)) {
    http_response_code(401);
    exit('Invalid signature');
}

$data = json_decode($payload);
echo json_encode(['ok' => true]);
?>
```

### Go
```go
package main

import (
    "crypto/hmac"
    "crypto/sha256"
    "encoding/hex"
    "net/http"
)

func handleWebhook(w http.ResponseWriter, r *http.Request) {
    signature := r.Header.Get("X-Webhook-Signature")
    payload, _ := ioutil.ReadAll(r.Body)
    
    expected := hex.EncodeToString(
        hmac.New(sha256.New, []byte(secret)).Sum(payload),
    )
    
    if signature != expected {
        w.WriteHeader(http.StatusUnauthorized)
        return
    }
    
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]bool{"ok": true})
}
```

## Pro Tips

1. **Use a Service**: Services like Slack, Zapier, or Make.com can receive webhooks
2. **Async Processing**: Always respond quickly, process events in background
3. **Idempotency**: Store event IDs to handle duplicate deliveries
4. **Rate Limiting**: Implement rate limiting on your webhook endpoint
5. **Payload Validation**: Validate event data before processing

## Need More Help?

- Full docs: [WEBHOOKS_GUIDE.md](WEBHOOKS_GUIDE.md)
- Implementation details: [WEBHOOKS_IMPLEMENTATION.md](WEBHOOKS_IMPLEMENTATION.md)
- API reference: [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

---

**Ready? Create your first webhook now!** 🚀
