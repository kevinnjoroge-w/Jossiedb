const logger = require('../utils/logger');

/**
 * Simple in-memory rate limiter
 * For production, consider using redis-based rate limiting
 */
class RateLimiter {
    constructor(windowMs = 15 * 60 * 1000, maxRequests = 5) {
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;
        this.requests = new Map();
    }

    middleware() {
        return (req, res, next) => {
            const key = `${req.ip}:${req.path}`;
            const now = Date.now();

            // Clean up old entries
            if (!this.requests.has(key)) {
                this.requests.set(key, []);
            }

            let times = this.requests.get(key);
            times = times.filter(t => now - t < this.windowMs);

            if (times.length >= this.maxRequests) {
                logger.warn(`Rate limit exceeded for ${key}`);
                return res.status(429).json({
                    error: 'Too many requests, please try again later'
                });
            }

            times.push(now);
            this.requests.set(key, times);
            next();
        };
    }
}

// Create auth-specific rate limiter (stricter)
const authLimiter = new RateLimiter(15 * 60 * 1000, 5); // 5 requests per 15 minutes

module.exports = {
    RateLimiter,
    authLimiter
};
