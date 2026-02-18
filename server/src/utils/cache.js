const redis = require('redis');
const logger = require('./logger');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CACHE_ENABLED = process.env.CACHE_ENABLED !== 'false';

// Default TTLs (in seconds)
const DEFAULT_TTL = {
    ITEMS: 300,              // 5 minutes
    ITEMS_DETAIL: 600,       // 10 minutes
    CATEGORIES: 600,         // 10 minutes
    LOCATIONS: 600,          // 10 minutes
    WEBHOOKS: 300,           // 5 minutes
    WEBHOOKS_ACTIVE: 600,    // 10 minutes
    ANALYTICS: 900,          // 15 minutes
    USERS: 600,              // 10 minutes
    SESSIONS: 1800,          // 30 minutes
    LOW_STOCK: 300,          // 5 minutes
    DEFAULT: 300             // 5 minutes
};

let client = null;
let isConnected = false;

/**
 * Initialize Redis connection
 */
async function initializeRedis() {
    if (!CACHE_ENABLED) {
        logger.info('Caching disabled - set CACHE_ENABLED=true to enable');
        return null;
    }

    try {
        client = redis.createClient({
            url: REDIS_URL,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        logger.error('Redis reconnection failed after 10 attempts');
                        return new Error('Redis reconnection failed');
                    }
                    return retries * 100;
                }
            }
        });

        client.on('error', (err) => {
            logger.error('Redis error:', err);
            isConnected = false;
        });

        client.on('connect', () => {
            logger.info('Connected to Redis');
            isConnected = true;
        });

        await client.connect();
        isConnected = true;
        logger.info('Redis cache initialized');
        return client;
    } catch (error) {
        logger.error('Failed to initialize Redis:', error);
        isConnected = false;
        return null;
    }
}

/**
 * Get value from cache
 */
async function get(key) {
    if (!isConnected || !client) return null;

    try {
        const value = await client.get(key);
        if (value) {
            logger.debug(`Cache HIT: ${key}`);
            return JSON.parse(value);
        }
        logger.debug(`Cache MISS: ${key}`);
        return null;
    } catch (error) {
        logger.error(`Cache get error for ${key}:`, error);
        return null;
    }
}

/**
 * Set value in cache with TTL
 */
async function set(key, value, ttl = DEFAULT_TTL.DEFAULT) {
    if (!isConnected || !client) return false;

    try {
        await client.setEx(key, ttl, JSON.stringify(value));
        logger.debug(`Cache SET: ${key} (TTL: ${ttl}s)`);
        return true;
    } catch (error) {
        logger.error(`Cache set error for ${key}:`, error);
        return false;
    }
}

/**
 * Delete key from cache
 */
async function del(key) {
    if (!isConnected || !client) return false;

    try {
        await client.del(key);
        logger.debug(`Cache DELETE: ${key}`);
        return true;
    } catch (error) {
        logger.error(`Cache delete error for ${key}:`, error);
        return false;
    }
}

/**
 * Delete multiple keys (pattern matching)
 */
async function delPattern(pattern) {
    if (!isConnected || !client) return 0;

    try {
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
            await client.del(keys);
            logger.debug(`Cache DELETE PATTERN: ${pattern} (${keys.length} keys)`);
            return keys.length;
        }
        return 0;
    } catch (error) {
        logger.error(`Cache delete pattern error for ${pattern}:`, error);
        return 0;
    }
}

/**
 * Flush entire cache
 */
async function flush() {
    if (!isConnected || !client) return false;

    try {
        await client.flushDb();
        logger.warn('Cache flushed');
        return true;
    } catch (error) {
        logger.error('Cache flush error:', error);
        return false;
    }
}

/**
 * Get multiple values at once
 */
async function mget(keys) {
    if (!isConnected || !client) return [];

    try {
        const values = await client.mGet(keys);
        return values.map(v => v ? JSON.parse(v) : null);
    } catch (error) {
        logger.error('Cache mget error:', error);
        return [];
    }
}

/**
 * Set multiple values at once
 */
async function mset(pairs, ttl = DEFAULT_TTL.DEFAULT) {
    if (!isConnected || !client) return false;

    try {
        const pipeline = client.multi();
        
        for (const [key, value] of Object.entries(pairs)) {
            pipeline.setEx(key, ttl, JSON.stringify(value));
        }
        
        await pipeline.exec();
        logger.debug(`Cache MSET: ${Object.keys(pairs).length} keys`);
        return true;
    } catch (error) {
        logger.error('Cache mset error:', error);
        return false;
    }
}

/**
 * Check if key exists
 */
async function exists(key) {
    if (!isConnected || !client) return false;

    try {
        return await client.exists(key) === 1;
    } catch (error) {
        logger.error(`Cache exists error for ${key}:`, error);
        return false;
    }
}

/**
 * Get cache statistics
 */
async function getStats() {
    if (!isConnected || !client) {
        return {
            enabled: false,
            connected: false
        };
    }

    try {
        const info = await client.info();
        const dbsize = await client.dbSize();
        
        return {
            enabled: true,
            connected: isConnected,
            keysCount: dbsize,
            info: info
        };
    } catch (error) {
        logger.error('Cache stats error:', error);
        return {
            enabled: true,
            connected: false,
            error: error.message
        };
    }
}

/**
 * Close Redis connection
 */
async function close() {
    if (client) {
        try {
            await client.quit();
            isConnected = false;
            logger.info('Redis connection closed');
        } catch (error) {
            logger.error('Error closing Redis connection:', error);
        }
    }
}

/**
 * Get cache key with prefix
 */
function getCacheKey(prefix, id) {
    return `jossie:${prefix}:${id}`;
}

/**
 * Get list cache key with parameters
 */
function getListCacheKey(prefix, params = {}) {
    const paramStr = Object.entries(params)
        .sort()
        .map(([k, v]) => `${k}=${v}`)
        .join('|');
    
    return `jossie:${prefix}:list${paramStr ? ':' + paramStr : ''}`;
}

module.exports = {
    initializeRedis,
    get,
    set,
    del,
    delPattern,
    flush,
    mget,
    mset,
    exists,
    getStats,
    close,
    getCacheKey,
    getListCacheKey,
    DEFAULT_TTL,
    isConnected: () => isConnected,
    getClient: () => client
};
