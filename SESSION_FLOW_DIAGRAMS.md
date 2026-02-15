# Session Handling Flow Diagrams

## 1. Login Flow with Session Creation

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. POST /auth/login
       │    {username, password}
       ▼
┌──────────────────┐
│   Express App    │
└────────┬─────────┘
         │
         │ 2. Validate credentials
         ▼
    ┌─────────┐
    │ Database│
    └────┬────┘
         │ 3. Return user object
         ▼
    ┌──────────────┐
    │ AuthService  │ → Generate JWT
    └────┬─────────┘
         │ → Create Session
         │ → Log Session Activity
         ▼
    ┌─────────────┐
    │ MongoDB     │ Store session & log
    └────┬────────┘
         │
         │ 4. Response
         ▼
    ┌──────────────────┐
    │ Browser Response │
    │ {token, sessionId}
    │ Set-Cookie: sessionId
    └───────┬──────────┘
            │
            ▼
      ┌──────────┐
      │ Local &  │
      │ Cookies  │
      └──────────┘
```

## 2. Authentication & Session Validation Flow

```
┌──────────────┐
│   Request    │
└──────┬───────┘
       │
       ▼
    ┌─────────────────────┐
    │ Session Middleware  │
    │ Check session cookie│
    └──────┬──────────────┘
           │
       ┌───┴────┐
       ▼        ▼
    Active   None/Invalid
       │        │
       │        ▼
       │    ┌──────────────┐
       │    │ Check JWT    │
       │    │ (fallback)   │
       │    └──────┬───────┘
       │           │
       │       ┌───┴────┐
       │       ▼        ▼
       │    Valid    Invalid
       │       │        │
       │       ▼        ▼
       │    Auth OK  401 Error
       │       │
       └───────┴─────────┐
               │         │
               ▼ YES     ▼ NO
           ┌────────────────┐
           │ Update Activity│
           │ in SessionLog  │
           └───────┬────────┘
                   │
                   ▼
            ┌────────────────┐
            │  Allow Request │
            │  Process Route │
            └────────────────┘
```

## 3. Multi-Device Session Management Flow

```
┌──────────────────┐
│     User         │
│   Logged In      │
└────────┬─────────┘
         │
         ├─ Device 1: Browser (Session ID: sess_a123)
         │
         ├─ Device 2: Mobile App (JWT Token)
         │
         └─ Device 3: Browser (Session ID: sess_b456)
         
    Active Sessions List:
    ├─ Session A123
    │  ├─ Device: Chrome on Windows
    │  ├─ IP: 192.168.1.100
    │  └─ Last Active: 5 min ago
    │
    └─ Session B456
       ├─ Device: Safari on iPhone
       ├─ IP: 203.0.113.42
       └─ Last Active: 10 min ago

User Actions:
│
├─ Revoke "Device 2" Browser
│  └─ DELETE /auth/sessions/sess_b456
│     → SessionLog.status = "revoked"
│     → Device 2 logout
│
└─ Logout All
   └─ POST /auth/logout-all
      → All sessions marked "revoked"
      → User logged out everywhere
```

## 4. Session Lifecycle & Cleanup

```
User Login → Session Created (Active)
      │
      │ Normal Usage
      ▼
  Session Active
  (touching on each request)
      │
      ├─ User Logout
      │  └─ Status = "logout"
      │     → Session destroyed
      │     → Cookie cleared
      │
      ├─ Explicit Revoke
      │  └─ Status = "revoked"
      │     → Session marked invalid
      │     → Next request fails
      │
      └─ Inactivity/TTL Expire
         └─ ExpiresAt < Now
            → MongoDB TTL removes
            → Automatic cleanup
```

## 5. Database Collections

```
┌────────────────┐
│    MongoDB     │
└────────┬───────┘
         │
         ├─ sessions (express-session store)
         │  ├─ _id
         │  ├─ expires
         │  └─ session (JSON serialized)
         │
         ├─ session_logs (audit trail)
         │  ├─ _id
         │  ├─ userId (link to User)
         │  ├─ sessionId (unique)
         │  ├─ userAgent
         │  ├─ ipAddress
         │  ├─ status: active|revoked|logout
         │  ├─ loginTime
         │  ├─ lastActivityTime
         │  └─ expiresAt (TTL index)
         │
         └─ users (existing)
            ├─ _id
            ├─ username
            ├─ password
            └─ last_login
```

## 6. Security Layers

```
Request
   │
   ▼
┌────────────────┐
│   Helmet       │ Security Headers
└────────┬───────┘
         ▼
┌────────────────┐
│     CORS       │ Origin Validation
└────────┬───────┘
         ▼
┌────────────────┐
│ Express Log    │ Request Logging
└────────┬───────┘
         ▼
┌────────────────┐
│  Session Auth  │ Session/JWT Validation
│  Middleware    │ + Activity Logging
└────────┬───────┘
         │
     ┌───┴───┐
     ▼       ▼
  Valid   Invalid
     │       │
     ▼       ▼
  Continue 401 Response
```

## 7. Complete Request Flow

```
START
  │
  ├─ Browser Sends Request
  │  ├─ Headers: Authorization: Bearer <token>
  │  ├─ Cookies: sessionId=<session_id>
  │  └─ With credentials: true
  │
  ├─ Server Receives
  │  ├─ Middleware Chain:
  │  │  ├─ Helmet (security)
  │  │  ├─ CORS (origins)
  │  │  ├─ Session (load session)
  │  │  ├─ validateSession (check)
  │  │  └─ sessionActivityLogger (track)
  │  │
  │  ├─ Route Handler
  │  │  ├─ authenticate middleware
  │  │  │  ├─ Check session first
  │  │  │  ├─ Fall back to JWT
  │  │  │  └─ Set req.user
  │  │  │
  │  │  └─ authorize (roles)
  │  │
  │  ├─ Business Logic
  │  │  └─ Process request
  │  │
  │  └─ Send Response
  │
  ├─ Update SessionLog
  │  └─ lastActivityTime
  │
  └─ Browser Receives Response
     ├─ Store token if login
     ├─ Keep session cookie
     └─ Use for next request
```

## 8. Error Handling Paths

```
Request
  │
  ├─ No Auth Provided
  │  └─ 401 Unauthorized
  │
  ├─ Invalid Token
  │  └─ 401 Invalid or expired token
  │
  ├─ Session Expired
  │  └─ 401 Session not found
  │
  ├─ Insufficient Permissions
  │  └─ 403 Forbidden: Insufficient permissions
  │
  ├─ Invalid Credentials (Login)
  │  └─ 401 Invalid credentials
  │
  └─ Server Error
     └─ 500 Internal Server Error
```

## 9. Session Cleanup Schedule

```
Server Start
   │
   ▼
Initialize SessionCleanup
   │
   └─ Every 60 minutes
      │
      ├─ Find expired sessions
      │  └─ expiresAt < now()
      │
      ├─ Delete from DB
      │  └─ SessionLog.deleteMany()
      │
      └─ Log cleanup stats
         └─ Sessions removed: N
```

---

## Component Interactions Summary

| Component | Role | Interacts With |
|-----------|------|----------------|
| Session Middleware | Creates/validates sessions | MongoDB session store |
| Auth Middleware | Validates credentials | Session + JWT |
| AuthService | Business logic | Database, SessionLog |
| SessionLog Model | Audit trail | MongoDB, analytics |
| Session Manager | Cleanup/utilities | SessionLog, logger |
| Auth Routes | API endpoints | AuthService, middleware |

---

**Note**: All diagrams represent the flow with security best practices implemented.
