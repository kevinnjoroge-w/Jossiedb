const cache = require('../utils/cache');
const logger = require('../utils/logger');

/**
 * Cache middleware for GET requests
 * Usage: app.get('/endpoint', cacheMiddleware(TTL), handler)
 */
function cacheMiddleware(ttl = 300) {
    return async (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Skip cache if requested
        if (req.query.skipCache === 'true' || req.headers['cache-control'] === 'no-cache') {
            return next();
        }

        // Generate cache key from URL and query params
        const cacheKey = generateCacheKey(req);

        try {
            // Try to get from cache
            const cachedData = await cache.get(cacheKey);
            if (cachedData) {
                logger.debug(`Cache HIT for ${req.path}`);
                return res.json(cachedData);
            }
        } catch (err) {
            logger.error(`Cache retrieve error: ${err.message}`);
            // Continue without cache
        }

        // Store original res.json
        const originalJson = res.json.bind(res);

        // Override res.json to cache the response
        res.json = function(data) {
            // Cache the response
            cache.set(cacheKey, data, ttl).catch(err => {
                logger.error(`Cache set error: ${err.message}`);
            });

            return originalJson(data);
        };

        next();
    };
}

/**
 * Generate deterministic cache key from request
 */
function generateCacheKey(req) {
    const userId = req.user?.id || 'anonymous';
    const query = new URLSearchParams(req.query)
        .toString()
        .split('&')
        .sort()
        .join('&');

    return `jossie:api:${userId}:${req.path}:${query}`;
}

/**
 * Clear related caches (useful for invalidation patterns)
 */
async function clearItemCaches() {
    await cache.delPattern('jossie:api:*:*/items*');
    await cache.delPattern('jossie:api:*:*/analytics*');
}

async function clearUserCaches() {
    await cache.delPattern('jossie:api:*:*/users*');
}

async function clearTransferCaches() {
    await cache.delPattern('jossie:api:*:*/transfers*');
}

async function clearCheckoutCaches() {
    await cache.delPattern('jossie:api:*:*/checkouts*');
}

module.exports = {
    cacheMiddleware,
    clearItemCaches,
    clearUserCaches,
    clearTransferCaches,
    clearCheckoutCaches
};
