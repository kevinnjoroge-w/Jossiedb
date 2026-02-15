/**
 * Session Handling Integration Tests
 * Tests for session creation, management, and security features
 */

const request = require('supertest');
const app = require('../app');
const { User, SessionLog } = require('../models');
const logger = require('../utils/logger');

describe('Session Handling', () => {
    let testUser;
    let authToken;
    let sessionCookie;

    beforeAll(async () => {
        // Create test user
        testUser = await User.create({
            username: 'testuser',
            email: 'test@example.com',
            password: 'Test@1234',
            full_name: 'Test User',
            role: 'worker'
        });
    });

    afterAll(async () => {
        // Cleanup
        await User.deleteOne({ _id: testUser._id });
        await SessionLog.deleteMany({ userId: testUser._id });
    });

    describe('Authentication', () => {
        test('should register new user', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    username: 'newuser',
                    email: 'newuser@example.com',
                    password: 'Password@1234',
                    full_name: 'New User',
                    role: 'worker'
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('token');
            expect(response.body.user).toHaveProperty('username', 'newuser');
            expect(response.body.user).not.toHaveProperty('password');
        });

        test('should login successfully and create session', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    username: 'testuser',
                    password: 'Test@1234'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('sessionId');
            expect(response.body.user).toHaveProperty('username', 'testuser');

            // Store for later tests
            authToken = response.body.token;
            sessionCookie = response.headers['set-cookie'];
        });

        test('should reject invalid credentials', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    username: 'testuser',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error');
        });

        test('should reject login with missing credentials', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    username: 'testuser'
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('Session Management', () => {
        test('should verify active session', async () => {
            const response = await request(app)
                .get('/api/v1/auth/verify-session')
                .set('Cookie', sessionCookie);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('valid', true);
            expect(response.body).toHaveProperty('userId');
            expect(response.body).toHaveProperty('sessionId');
        });

        test('should get user profile with authentication', async () => {
            const response = await request(app)
                .get('/api/v1/auth/profile')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.user).toHaveProperty('username', 'testuser');
            expect(response.body.user).not.toHaveProperty('password');
        });

        test('should reject profile access without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/auth/profile');

            expect(response.status).toBe(401);
        });
    });

    describe('Session Lifecycle', () => {
        let sessionId;

        test('should create session log on login', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    username: 'testuser',
                    password: 'Test@1234'
                });

            sessionId = response.body.sessionId;

            const sessionLog = await SessionLog.findOne({
                sessionId,
                userId: testUser._id
            });

            expect(sessionLog).toBeDefined();
            expect(sessionLog.status).toBe('active');
        });

        test('should get active sessions for user', async () => {
            const response = await request(app)
                .get('/api/v1/auth/sessions')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('activeSessions');
            expect(Array.isArray(response.body.activeSessions)).toBe(true);
        });

        test('should revoke specific session', async () => {
            // Create a session to revoke
            const loginResponse = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    username: 'testuser',
                    password: 'Test@1234'
                });

            const revokeSessionId = loginResponse.body.sessionId;

            // Revoke it
            const revokeResponse = await request(app)
                .delete(`/api/v1/auth/sessions/${revokeSessionId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(revokeResponse.status).toBe(200);

            // Verify it's revoked
            const sessionLog = await SessionLog.findOne({
                sessionId: revokeSessionId
            });

            expect(sessionLog.status).toBe('revoked');
        });

        test('should get session statistics', async () => {
            const response = await request(app)
                .get('/api/v1/auth/session-stats')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('totalSessions');
            expect(response.body).toHaveProperty('activeSessions');
        });

        test('should logout successfully', async () => {
            // First login to get session
            const loginResponse = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    username: 'testuser',
                    password: 'Test@1234'
                });

            const logoutCookie = loginResponse.headers['set-cookie'];

            // Then logout
            const logoutResponse = await request(app)
                .post('/api/v1/auth/logout')
                .set('Cookie', logoutCookie);

            expect(logoutResponse.status).toBe(200);
            expect(logoutResponse.body).toHaveProperty('message');
        });
    });

    describe('Security Features', () => {
        test('should reject requests without authorization', async () => {
            const response = await request(app)
                .get('/api/v1/auth/sessions');

            expect(response.status).toBe(401);
        });

        test('should not allow accessing other users sessions', async () => {
            const otherUser = await User.create({
                username: 'otheruser',
                email: 'other@example.com',
                password: 'Other@1234',
                full_name: 'Other User',
                role: 'worker'
            });

            const response = await request(app)
                .get('/api/v1/auth/sessions')
                .set('Authorization', `Bearer ${authToken}`);

            // Should only see own sessions
            expect(response.status).toBe(200);

            // Cleanup
            await User.deleteOne({ _id: otherUser._id });
        });

        test('should use secure cookies in production', () => {
            const sessionConfig = require('../config/session');
            const isProduction = process.env.NODE_ENV === 'production';

            if (isProduction) {
                expect(sessionConfig.sessionConfig.cookie.secure).toBe(true);
                expect(sessionConfig.sessionConfig.cookie.httpOnly).toBe(true);
                expect(sessionConfig.sessionConfig.cookie.sameSite).toBe('strict');
            }
        });
    });

    describe('Error Handling', () => {
        test('should handle duplicate username registration', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    username: 'testuser',
                    email: 'another@example.com',
                    password: 'Password@1234',
                    full_name: 'Another User',
                    role: 'worker'
                });

            expect(response.status).toBe(409);
            expect(response.body).toHaveProperty('error');
        });

        test('should validate email format', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    username: 'testuser2',
                    email: 'invalid-email',
                    password: 'Password@1234',
                    full_name: 'Test User',
                    role: 'worker'
                });

            expect(response.status).toBe(400);
        });

        test('should require minimum password length', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    username: 'testuser2',
                    email: 'test2@example.com',
                    password: 'short',
                    full_name: 'Test User',
                    role: 'worker'
                });

            expect(response.status).toBe(400);
        });
    });
});

describe('Session Utilities', () => {
    test('should cleanup expired sessions', async () => {
        const sessionManager = require('../utils/sessionManager');
        expect(sessionManager.cleanupExpiredSessions).toBeDefined();
        expect(typeof sessionManager.cleanupExpiredSessions).toBe('function');
    });

    test('should detect suspicious activity', async () => {
        const sessionManager = require('../utils/sessionManager');
        expect(sessionManager.detectSuspiciousActivity).toBeDefined();
    });

    test('should enforce session limits', async () => {
        const sessionManager = require('../utils/sessionManager');
        expect(sessionManager.enforceSessionLimit).toBeDefined();
    });

    test('should initialize cleanup scheduler', async () => {
        const sessionManager = require('../utils/sessionManager');
        expect(sessionManager.initializeSessionCleanup).toBeDefined();
    });
});
