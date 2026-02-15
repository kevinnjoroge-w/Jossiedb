# Session Handling Implementation Guide

## Overview

This document describes the comprehensive session handling system implemented for Jossiedb. The system provides both stateless (JWT) and stateful (session-based) authentication with proper security measures.

## Architecture

### Components

1. **Session Middleware** (`config/session.js`)
   - Configures express-session with MongoDB store
   - Implements secure cookie settings
   - Handles session lifecycle

2. **Auth Middleware** (`middlewares/authMiddleware.js`)
   - Supports dual authentication (JWT + Session)
   - Validates and enriches request user data
   - Provides authorization checks

3. **SessionLog Model** (`models/SessionLog.js`)
   - Tracks session metadata and audit trail
   - Manages active sessions per user
   - Supports session analytics

4. **Auth Service** (`services/AuthService.js`)
   - Handles login/logout with session creation
   - Manages multi-device sessions
   - Provides session analytics

5. **Auth Routes** (`routes/authRoutes.js`)
   - RESTful endpoints for auth operations
   - Session management endpoints
   - Device management

## Security Features

### 1. Secure Cookies
```javascript
cookie: {
    secure: true,      // HTTPS only (production)
    httpOnly: true,    // Not accessible from JavaScript
    sameSite: 'strict' // CSRF protection
}
```

### 2. Dual Authentication
Supports both:
- **JWT**: Stateless, good for APIs and Mobile apps
- **Sessions**: Stateful, good for Web apps with credentials

### 3. Session Persistence
- MongoDB store with automatic TTL cleanup
- Session logs for audit trails
- Activity tracking

### 4. Device Management
- Track active sessions per device
- Logout from specific devices
- "Logout from all devices" capability

## API Endpoints

### Authentication

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
    "username": "john_doe",
    "password": "password123"
}
```

Response:
```json
{
    "user": { "id": "...", "username": "...", "role": "..." },
    "token": "jwt-token",
    "sessionId": "session-id",
    "message": "Login successful"
}
```

#### Logout
```http
POST /api/v1/auth/logout
```

### Session Management

#### Verify Session
```http
GET /api/v1/auth/verify-session
```

#### Get Active Sessions
```http
GET /api/v1/auth/sessions
Authorization: Bearer <jwt-token>
```

Response:
```json
{
    "activeSessions": [
        {
            "sessionId": "...",
            "loginTime": "2026-02-16T10:00:00Z",
            "lastActivityTime": "2026-02-16T11:00:00Z",
            "userAgent": "Mozilla/5.0...",
            "ipAddress": "192.168.1.1",
            "deviceInfo": "Chrome"
        }
    ],
    "currentSessionId": "..."
}
```

#### Revoke Specific Session
```http
DELETE /api/v1/auth/sessions/:sessionId
Authorization: Bearer <jwt-token>
```

#### Logout from All Devices
```http
POST /api/v1/auth/logout-all
Authorization: Bearer <jwt-token>
```

#### Get Session Statistics
```http
GET /api/v1/auth/session-stats
Authorization: Bearer <jwt-token>
```

## Usage Examples

### Frontend Integration

#### Login with Session
```javascript
const login = async (username, password) => {
    const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        credentials: 'include', // Important: include cookies
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    });
    return response.json();
};
```

#### Verify Active Session
```javascript
const verifySession = async () => {
    const response = await fetch('/api/v1/auth/verify-session', {
        credentials: 'include'
    });
    return response.json();
};
```

#### View Active Devices
```javascript
const getActiveSessions = async (token) => {
    const response = await fetch('/api/v1/auth/sessions', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return response.json();
};
```

#### Logout from All Devices
```javascript
const logoutAll = async (token) => {
    const response = await fetch('/api/v1/auth/logout-all', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return response.json();
};
```

## Configuration

### Environment Variables

Required variables in `.env`:

```env
# Session
SESSION_SECRET=your-secure-random-string
SESSION_CRYPTO_SECRET=another-secure-random-string
SESSION_MAX_AGE=86400000

# JWT
JWT_SECRET=jwt-secure-random-string
JWT_EXPIRES_IN=24h

# Database
MONGODB_URI=mongodb://localhost:27017/jossiedb

# CORS
CORS_ORIGIN=http://localhost:3000

# Environment
NODE_ENV=development
PORT=3002
```

### Custom Session Configuration

Edit `server/src/config/session.js`:

```javascript
const sessionConfig = {
    secret: process.env.SESSION_SECRET,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'strict'
    },
    // ... other options
};
```

## Session Flow

```
1. User Login
   ├─ Validate credentials
   ├─ Generate JWT token
   ├─ Create express-session
   ├─ Create SessionLog entry
   └─ Return token + sessionId

2. Protected Route Access
   ├─ Check session OR JWT token
   ├─ Validate user permissions
   ├─ Update session activity
   └─ Allow/Deny access

3. Logout
   ├─ Mark session as logged out
   ├─ Update SessionLog
   ├─ Destroy express-session
   └─ Clear session cookie

4. Session Expiration
   ├─ MongoDB TTL cleanup
   ├─ Session automatically expires
   └─ User must login again
```

## Database Schema

### SessionLog Collection

```javascript
{
    userId: ObjectId,
    sessionId: String (unique),
    userAgent: String,
    ipAddress: String,
    deviceInfo: String,
    status: String, // 'active', 'expired', 'revoked', 'logout'
    loginTime: Date,
    lastActivityTime: Date,
    expiresAt: Date,
    location: {
        country: String,
        city: String,
        coordinates: { latitude, longitude }
    },
    createdAt: Date,
    updatedAt: Date
}
```

## Best Practices

### 1. Always Use Credentials
```javascript
fetch('/api/v1/auth/login', {
    credentials: 'include' // Always for session-based auth
});
```

### 2. Handle Token Refresh
```javascript
// Implement token refresh logic
const axiosInstance = axios.create();
axiosInstance.interceptors.response.use(
    response => response,
    async error => {
        if (error.response?.status === 401) {
            // Redirect to login or refresh token
        }
    }
);
```

### 3. Validate on Every Request
The middleware automatically validates sessions on each request and updates the activity timestamp.

### 4. Secure Secret Management
Never commit secrets to version control:
```bash
# Generate secure secrets
openssl rand -hex 32
```

### 5. Monitor Session Activity
Regularly check:
- Active session count
- Last activity time
- Suspicious login patterns

## Troubleshooting

### Sessions Not Persisting
- Check MongoDB connection `MONGODB_URI`
- Verify `SESSION_SECRET` is set
- Ensure `credentials: 'include'` in frontend requests

### CORS Issues
- Set `CORS_ORIGIN` to match frontend URL
- Ensure `credentials: true` in CORS config

### Cookies Not Working
- Check `secure: true` (requires HTTPS in production)
- Verify `httpOnly: true`
- Check browser domain settings

### Session TTL Cleanup Not Working
- MongoDB TTL index requires `expireAfterSeconds: 0` on the `expiresAt` field
- Collections are created automatically on first use

## Migration from Old System

If migrating from JWT-only authentication:

1. Both JWT and sessions work simultaneously
2. Existing JWT tokens continue to work
3. New logins create sessions automatically
4. Gradually migrate to session-based auth

## Performance Considerations

- Session store queries are indexed by `sessionId` and `userId`
- TTL index automatically removes expired sessions
- `touchAfter` configuration reduces database writes
- Activity logging is asynchronous

## Support and Issues

For issues related to session handling:
1. Check logs in `logs/` directory
2. Verify environment configuration
3. Test with `/api/v1/auth/verify-session`
4. Review database connectivity

---

**Last Updated**: February 16, 2026
