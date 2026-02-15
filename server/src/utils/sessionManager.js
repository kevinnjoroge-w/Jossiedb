const logger = require('../utils/logger');
const { SessionLog } = require('../models');

/**
 * Session management utilities
 * Provides helpers for session cleanup, validation, and monitoring
 */

/**
 * Clean up expired sessions from the database
 * This runs periodically to remove stale session records
 */
const cleanupExpiredSessions = async () => {
    try {
        const result = await SessionLog.deleteMany({
            expiresAt: { $lt: new Date() }
        });
        logger.info(`Session cleanup completed: ${result.deletedCount} sessions removed`);
    } catch (error) {
        logger.error('Session cleanup error:', error);
    }
};

/**
 * Detect suspicious login patterns
 * Alerts if multiple logins from different IPs in short time
 */
const detectSuspiciousActivity = async (userId) => {
    try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const recentSessions = await SessionLog.find({
            userId,
            loginTime: { $gt: fiveMinutesAgo },
            status: 'active'
        });

        if (recentSessions.length > 1) {
            const uniqueIPs = new Set(recentSessions.map(s => s.ipAddress));
            if (uniqueIPs.size > 1) {
                logger.warn(`Suspicious activity detected for user ${userId}:`, {
                    multipleLocations: true,
                    locations: Array.from(uniqueIPs),
                    sessionCount: recentSessions.length
                });
                return true;
            }
        }
        return false;
    } catch (error) {
        logger.error('Error detecting suspicious activity:', error);
        return false;
    }
};

/**
 * Enforce session limit per user
 * Optionally revoke oldest sessions if limit exceeded
 */
const enforceSessionLimit = async (userId, maxSessions = 5) => {
    try {
        const activeSessions = await SessionLog.getActiveSessions(userId);
        
        if (activeSessions.length > maxSessions) {
            // Sort by login time and revoke oldest
            const sessionsToRevoke = activeSessions
                .sort((a, b) => a.loginTime - b.loginTime)
                .slice(0, activeSessions.length - maxSessions);

            for (const session of sessionsToRevoke) {
                await SessionLog.revokeSession(session.sessionId, userId);
            }
            
            logger.info(`Session limit enforced for user ${userId}:`, {
                revokedCount: sessionsToRevoke.length
            });
        }
    } catch (error) {
        logger.error('Error enforcing session limit:', error);
    }
};

/**
 * Get detailed session report
 */
const getSessionReport = async (userId) => {
    try {
        const activeSessions = await SessionLog.getActiveSessions(userId);
        const stats = await SessionLog.getSessionStats(userId);

        // Group by device
        const deviceMap = {};
        activeSessions.forEach(session => {
            const device = session.deviceInfo || 'Unknown Device';
            if (!deviceMap[device]) {
                deviceMap[device] = [];
            }
            deviceMap[device].push(session);
        });

        return {
            summary: stats,
            activeCount: activeSessions.length,
            deviceBreakdown: Object.keys(deviceMap).map(device => ({
                device,
                count: deviceMap[device].length,
                sessions: deviceMap[device]
            }))
        };
    } catch (error) {
        logger.error('Error generating session report:', error);
        throw error;
    }
};

/**
 * Middleware for session activity logging
 * Tracks every request with active session
 */
const sessionActivityLogger = async (req, res, next) => {
    if (req.session && req.session.userId) {
        try {
            await SessionLog.updateActivity(req.sessionID);
        } catch (error) {
            logger.error('Error updating session activity:', error);
        }
    }
    next();
};

/**
 * Middleware for session activity timeout
 * Logs out user if inactive for specified time
 */
const sessionInactivityTimeout = (maxInactiveMs = 30 * 60 * 1000) => {
    return (req, res, next) => {
        if (req.session && req.session.userId) {
            const now = new Date();
            const lastActivity = req.session.lastActivity || now;
            const inactiveTime = now - new Date(lastActivity);

            if (inactiveTime > maxInactiveMs) {
                req.session.destroy(err => {
                    if (err) logger.error('Session destruction error:', err);
                    return res.status(401).json({
                        error: 'Session expired due to inactivity'
                    });
                });
            } else {
                req.session.lastActivity = now.toISOString();
            }
        }
        next();
    };
};

/**
 * Middleware to prevent concurrent sessions from same IP to different users
 * Useful for preventing account hijacking
 */
const preventConcurrentIPHijacking = async (req, res, next) => {
    if (req.session && req.session.userId) {
        try {
            const userIP = req.ip;
            const recentSessions = await SessionLog.find({
                ipAddress: userIP,
                status: 'active',
                expiresAt: { $gt: new Date() }
            }).populate('userId');

            const uniqueUsers = new Set(
                recentSessions.map(s => s.userId.toString())
            );

            if (uniqueUsers.size > 3) {
                logger.warn(`Multiple user accounts detected from IP ${userIP}`, {
                    userCount: uniqueUsers.size
                });
            }
        } catch (error) {
            logger.error('Error checking concurrent sessions:', error);
        }
    }
    next();
};

/**
 * Initialize periodic session cleanup
 */
const initializeSessionCleanup = () => {
    // Run cleanup every hour
    setInterval(() => {
        cleanupExpiredSessions();
    }, 60 * 60 * 1000);

    // Initial cleanup
    cleanupExpiredSessions();

    logger.info('Session cleanup scheduler initialized');
};

module.exports = {
    cleanupExpiredSessions,
    detectSuspiciousActivity,
    enforceSessionLimit,
    getSessionReport,
    sessionActivityLogger,
    sessionInactivityTimeout,
    preventConcurrentIPHijacking,
    initializeSessionCleanup
};
