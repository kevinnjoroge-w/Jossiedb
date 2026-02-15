# Session Handling Quick Reference

## 🚀 Quick Start

```bash
# 1. Install dependencies
cd server && npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your settings

# 3. Start server
npm run dev
```

## 📝 Environment Variables

```env
SESSION_SECRET=your-secret-here
SESSION_CRYPTO_SECRET=your-crypto-secret
JWT_SECRET=your-jwt-secret
MONGODB_URI=mongodb://localhost:27017/jossiedb
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
PORT=3002
```

## 🔐 Authentication Methods

### Method 1: Session-Based (Recommended for Web Apps)
```javascript
// Login
const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    credentials: 'include', // ✅ Important!
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
});

// Session cookie stored automatically
// Use same 'credentials: include' for subsequent requests
```

### Method 2: JWT Token (Recommended for APIs/Mobile)
```javascript
// Login
const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
});
const { token } = await response.json();

// Store and use token
localStorage.setItem('token', token);
// Add to headers: Authorization: Bearer <token>
```

### Method 3: Both (Recommended)
```javascript
// Use both simultaneously
// Frontend gets token + session cookie
const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    credentials: 'include', // Session
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
});

// Store token for API calls
const { token } = await response.json();
localStorage.setItem('token', token);
```

## 📚 API Endpoints Reference

### Authentication
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/auth/register` | POST | Register new user | No |
| `/auth/login` | POST | Login & create session | No |
| `/auth/logout` | POST | Logout & destroy session | Session |
| `/auth/profile` | GET | Get user profile | JWT/Session |

### Session Management
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/auth/verify-session` | GET | Check if session valid | Session |
| `/auth/sessions` | GET | List active sessions | JWT/Session |
| `/auth/sessions/:id` | DELETE | Revoke specific session | JWT/Session |
| `/auth/logout-all` | POST | Logout everywhere | JWT/Session |
| `/auth/session-stats` | GET | Session statistics | JWT/Session |

## 💻 Frontend Integration

### React Example

```javascript
// 1. Create API client
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3002/api/v1',
    withCredentials: true // ✅ For sessions
});

// 2. Login
const handleLogin = async (username, password) => {
    const response = await api.post('/auth/login', {
        username, password
    });
    localStorage.setItem('token', response.data.token);
};

// 3. Protected Request
const getProfile = async () => {
    return await api.get('/auth/profile', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
};

// 4. Logout
const handleLogout = async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
};
```

## 🔍 Testing

```bash
# Run tests
npm test

# Run specific test file
npm test session.test.js

# Test with coverage
npm test -- --coverage
```

## 🛠️ Common Tasks

### Check Active Sessions
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3002/api/v1/auth/sessions
```

### Logout from Specific Device
```bash
curl -X DELETE \
  -H "Authorization: Bearer <token>" \
  http://localhost:3002/api/v1/auth/sessions/<sessionId>
```

### Logout Everywhere
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  http://localhost:3002/api/v1/auth/logout-all
```

### Verify Session Valid
```bash
curl http://localhost:3002/api/v1/auth/verify-session
```

## 🚨 Security Checklist

- ✅ Use HTTPS in production
- ✅ Set strong secrets in `.env`
- ✅ Enable `credentials: true` in requests
- ✅ Use `httpOnly` cookies (automatic)
- ✅ Enable CSRF protection with `sameSite` (automatic)
- ✅ Set correct CORS origin
- ✅ Keep dependencies updated
- ✅ Monitor session logs
- ✅ Implement rate limiting (recommended)
- ✅ Enable 2FA (optional but recommended)

## ⚙️ Configuration Options

### Session Timeout
```env
# 24 hours (default)
SESSION_MAX_AGE=86400000

# 1 hour
SESSION_MAX_AGE=3600000

# 7 days
SESSION_MAX_AGE=604800000
```

### Cookie Domain
```env
# Development
SESSION_COOKIE_DOMAIN=localhost

# Production
SESSION_COOKIE_DOMAIN=yourdomain.com
```

## 🐛 Troubleshooting

### "Invalid or expired token"
- Check token hasn't expired
- Regenerate JWT_SECRET? (existing tokens will be invalid)
- Verify token format: `Bearer <token>`

### "Session not found"
- Check `credentials: 'include'` in request
- Verify session cookie is being set
- Check SESSION_SECRET is set

### "CORS blocked"
- Update CORS_ORIGIN in .env
- Ensure it matches frontend URL exactly
- Restart server after changing

### Sessions persisting after logout
- Clear browser cookies
- Verify logout route is called
- Check server logs for errors

## 📊 Monitoring

```javascript
// Get session statistics
const stats = await api.get('/auth/session-stats');
// Returns: totalSessions, activeSessions, lastLogin

// Check active sessions
const sessions = await api.get('/auth/sessions');
// Returns array of active sessions with device info
```

## 📖 Documentation Files

- **[SESSION_HANDLING.md](SESSION_HANDLING.md)** - Comprehensive guide
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - What was built
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Before going live
- **[SESSION_FLOW_DIAGRAMS.md](SESSION_FLOW_DIAGRAMS.md)** - Visual flows

## 🎯 Next Steps

1. ✅ Dependencies installed
2. ✅ Session system configured
3. ✅ Routes created
4. 📝 **Update frontend to use new auth endpoints**
5. 📝 **Add rate limiting to auth routes**
6. 📝 **Set up monitoring/alerts**
7. 📝 **Train team on new features**
8. 📝 **Deploy to production**

## 📞 Support

- API Issues → Check SESSION_HANDLING.md
- Configuration → Check .env.example
- Deployment → Check DEPLOYMENT_CHECKLIST.md
- Debugging → Check troubleshooting section
- Code examples → Check IMPLEMENTATION_SUMMARY.md

## 🔄 Session Flow One-Liner

```
Login → Session Created → Stored in MongoDB → 
Validated on Request → Activity Tracked → 
AutoClean on Expiry → User Stays Logged In
```

---

**Pro Tips:**
- ✨ Enable "Remember Me" by extending SESSION_MAX_AGE
- 🔐 Implement 2FA for admin users
- 📱 Support WebAuthn for passwordless login
- 🚀 Use Redis session store for high-traffic apps
- 📊 Set up session analytics dashboard

**Version**: 1.0.0  
**Last Updated**: February 16, 2026
