# Session Handling Deployment Checklist

## Pre-Deployment

### 1. Environment Configuration
- [ ] Generate strong `SESSION_SECRET` (32+ hex characters)
- [ ] Generate strong `SESSION_CRYPTO_SECRET` (32+ hex characters)
- [ ] Generate strong `JWT_SECRET` (32+ hex characters)
- [ ] Set `NODE_ENV=production`
- [ ] Configure `CORS_ORIGIN` with production frontend URL
- [ ] Set `MONGODB_URI` to production database
- [ ] Set `SESSION_MAX_AGE` appropriate for your use case
- [ ] Document all environment variables

### 2. Database Preparation
- [ ] MongoDB connection verified
- [ ] Create indexes on SessionLog collection:
  ```bash
  db.session_logs.createIndex({ userId: 1, expiresAt: 1 })
  db.session_logs.createIndex({ sessionId: 1 }, { unique: true })
  db.session_logs.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
  ```
- [ ] Verify session store collection exists
- [ ] Test TTL cleanup works properly

### 3. HTTPS Configuration
- [ ] Install SSL certificate
- [ ] Configure HTTPS redirect
- [ ] Set `secure: true` in session cookies (enforced in production)
- [ ] Update CORS to use `https://`
- [ ] Test HTTPS connection

### 4. Security Hardening
- [ ] Enable rate limiting on auth routes:
  ```javascript
  // Add rate limiter
  const rateLimit = require('express-rate-limit');
  const loginLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5 // 5 requests per 15 minutes
  });
  ```
- [ ] Enable request logging and monitoring
- [ ] Set up security headers (helmet already configured)
- [ ] Configure password policies
- [ ] Enable email verification (optional)
- [ ] Set up 2FA (optional but recommended)

### 5. Monitoring and Logging
- [ ] Set up session activity logging
- [ ] Configure suspicious activity alerts
- [ ] Create monitoring dashboard for:
  - Active sessions count
  - Login attempts
  - Failed auth attempts
  - Session expirations
- [ ] Enable server logs to external service (ELK, DataDog, etc.)

### 6. Testing
- [ ] Run full test suite: `npm test`
- [ ] Test session creation on login
- [ ] Test session validation on protected routes
- [ ] Test session expiration
- [ ] Test logout and session destruction
- [ ] Test multi-device sessions
- [ ] Test CORS with credentials
- [ ] Test in production environment

### 7. Frontend Updates
- [ ] Configure axios/fetch to use `credentials: 'include'`
- [ ] Update CORS_ORIGIN in .env
- [ ] Test login flow end-to-end
- [ ] Test session persistence on page reload
- [ ] Test logout functionality
- [ ] Test session timeout warning (recommended)
- [ ] Test multi-tab session sync

## During Deployment

### 1. Backup
- [ ] Backup production database
- [ ] Document current configuration
- [ ] Have rollback plan ready

### 2. Deployment
- [ ] Deploy updated server code
- [ ] Install new dependencies: `npm install`
- [ ] Run migrations if any: `npm run migrate`
- [ ] Set environment variables in production
- [ ] Restart server
- [ ] Verify server is running: `GET /health`

### 3. Verification
- [ ] Check server logs for errors
- [ ] Test login endpoint
- [ ] Test session endpoints
- [ ] Verify database connections
- [ ] Check session store is operational
- [ ] Monitor error rates

## Post-Deployment

### 1. Monitoring
- [ ] Monitor session creation rate
- [ ] Watch for failed login attempts
- [ ] Track session errors in logs
- [ ] Review suspicious activity logs
- [ ] Monitor database performance

### 2. User Communication
- [ ] Notify users about new session features
- [ ] Document new logout options
- [ ] Provide device management guide
- [ ] Create help documentation

### 3. Performance Optimization
- [ ] Tune session cleanup schedule if needed
- [ ] Adjust `touchAfter` value based on load
- [ ] Monitor MongoDB performance
- [ ] Optimize queries if slow

### 4. Security Auditing
- [ ] Review session logs for anomalies
- [ ] Check for unusual login patterns
- [ ] Verify rate limiting is working
- [ ] Test security headers
- [ ] Validate HTTPS configuration

## Ongoing Maintenance

### Weekly
- [ ] Review authentication logs
- [ ] Monitor session metrics
- [ ] Check for failed logins
- [ ] Verify cleanup job ran

### Monthly
- [ ] Review and update security policies
- [ ] Audit active sessions
- [ ] Check for inactive accounts
- [ ] Update dependencies

### Quarterly
- [ ] Rotate secrets if necessary
- [ ] Review session timeout settings
- [ ] Audit access logs
- [ ] Performance review

### Annually
- [ ] Security audit
- [ ] Compliance review
- [ ] Architecture review
- [ ] Update documentation

## Troubleshooting Guide

### Issue: Sessions Not Persisting
**Symptoms**: Users logged out after refresh
**Solution**:
- Verify MongoDB connection
- Check `credentials: 'include'` in frontend
- Verify session store is initialized
- Check session cookie is being set

### Issue: Excessive Database Queries
**Symptoms**: High MongoDB load
**Solution**:
- Increase `touchAfter` value
- Reduce session validation frequency
- Implement caching layer
- Monitor query performance

### Issue: CORS Errors
**Symptoms**: CORS block in browser console
**Solution**:
- Verify `CORS_ORIGIN` matches frontend
- Ensure `credentials: true` in CORS config
- Check preflight requests
- Test with `curl -v`

### Issue: Security Warnings
**Symptoms**: Browser warns about insecure cookies
**Solution**:
- Verify HTTPS is enabled
- Set `secure: true` in cookies
- Check certificate validity
- Test with security headers

## Rollback Plan

If issues arise:

1. **Stop deployment**
   ```bash
   npm stop
   ```

2. **Revert to previous version**
   ```bash
   git revert <commit>
   npm install
   ```

3. **Restore settings**
   - Use backed up environment variables
   - Restore previous MongoDB documents if needed

4. **Test**
   - Run smoke tests
   - Verify login works
   - Check logs

5. **Communicate**
   - Notify team
   - Update status page
   - Document incident

## Support Contacts

- **Database Issues**: MongoDB DBA Team
- **Security**: Security Team
- **Performance**: DevOps Team
- **Frontend Integration**: Frontend Lead

## Sign-Off

- [ ] Project Manager: ________________
- [ ] DevOps: ________________
- [ ] Security: ________________
- [ ] QA Lead: ________________

---

**Deployment Date**: ________________
**Version**: 1.0.0
**Status**: Ready for deployment
