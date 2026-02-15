const mongoose = require('mongoose');

/**
 * Session Schema for tracking user sessions
 * Complements express-session's MongoDB store with additional metadata
 */
const sessionLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        sessionId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        userAgent: {
            type: String,
            default: null
        },
        ipAddress: {
            type: String,
            default: null
        },
        deviceInfo: {
            type: String,
            default: null
        },
        status: {
            type: String,
            enum: ['active', 'expired', 'revoked', 'logout'],
            default: 'active',
            index: true
        },
        loginTime: {
            type: Date,
            default: Date.now,
            index: true
        },
        lastActivityTime: {
            type: Date,
            default: Date.now
        },
        expiresAt: {
            type: Date,
            required: true,
            index: true
        },
        location: {
            country: String,
            city: String,
            coordinates: {
                latitude: Number,
                longitude: Number
            }
        }
    },
    {
        timestamps: true,
        collection: 'session_logs'
    }
);

// TTL index for automatic session log cleanup
sessionLogSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);

/**
 * Create new session log entry
 */
sessionLogSchema.statics.createSessionLog = async function(sessionData) {
    try {
        const sessionLog = await this.create(sessionData);
        return sessionLog;
    } catch (error) {
        throw new Error(`Failed to create session log: ${error.message}`);
    }
};

/**
 * Get active sessions for a user
 */
sessionLogSchema.statics.getActiveSessions = async function(userId) {
    try {
        return await this.find({
            userId,
            status: 'active',
            expiresAt: { $gt: new Date() }
        }).sort({ lastActivityTime: -1 });
    } catch (error) {
        throw new Error(`Failed to fetch active sessions: ${error.message}`);
    }
};

/**
 * Mark session as revoked
 */
sessionLogSchema.statics.revokeSession = async function(sessionId, userId) {
    try {
        return await this.findOneAndUpdate(
            { sessionId, userId },
            {
                status: 'revoked',
                expiresAt: new Date() // Immediate expiration
            },
            { new: true }
        );
    } catch (error) {
        throw new Error(`Failed to revoke session: ${error.message}`);
    }
};

/**
 * Mark session as logged out
 */
sessionLogSchema.statics.logoutSession = async function(sessionId) {
    try {
        return await this.findOneAndUpdate(
            { sessionId },
            {
                status: 'logout',
                expiresAt: new Date()
            },
            { new: true }
        );
    } catch (error) {
        throw new Error(`Failed to logout session: ${error.message}`);
    }
};

/**
 * Update session activity
 */
sessionLogSchema.statics.updateActivity = async function(sessionId) {
    try {
        return await this.findOneAndUpdate(
            { sessionId },
            { lastActivityTime: new Date() },
            { new: true }
        );
    } catch (error) {
        throw new Error(`Failed to update session activity: ${error.message}`);
    }
};

/**
 * Revoke all user sessions (logout everywhere)
 */
sessionLogSchema.statics.revokeAllUserSessions = async function(userId) {
    try {
        return await this.updateMany(
            { userId, status: 'active' },
            { status: 'revoked', expiresAt: new Date() }
        );
    } catch (error) {
        throw new Error(`Failed to revoke all sessions: ${error.message}`);
    }
};

/**
 * Get session statistics
 */
sessionLogSchema.statics.getSessionStats = async function(userId) {
    try {
        const stats = await this.aggregate([
            { $match: { userId: mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: '$userId',
                    totalSessions: { $sum: 1 },
                    activeSessions: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ['$status', 'active'] },
                                        { $gt: ['$expiresAt', new Date()] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    lastLogin: { $max: '$loginTime' }
                }
            }
        ]);
        return stats[0] || { totalSessions: 0, activeSessions: 0, lastLogin: null };
    } catch (error) {
        throw new Error(`Failed to get session stats: ${error.message}`);
    }
};

const SessionLog = mongoose.model('SessionLog', sessionLogSchema);

module.exports = SessionLog;
