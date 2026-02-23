import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

// Helper to safely parse stored user
const getStoredUser = () => {
    try {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    // Initialize user instantly from localStorage — no network wait
    const [user, setUser] = useState(() => {
        const token = localStorage.getItem('token');
        if (!token) return null;
        return getStoredUser();
    });
    const [loading, setLoading] = useState(() => {
        // Only show loading if we have a token but need to validate it
        const token = localStorage.getItem('token');
        return !!token;
    });

    const clearAuth = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    }, []);

    // Background validation — doesn't block the UI
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        // Validate token in the background
        api.get('/auth/profile')
            .then((response) => {
                const freshUser = response.data.user;
                setUser(freshUser);
                localStorage.setItem('user', JSON.stringify(freshUser));
            })
            .catch((error) => {
                // Only clear auth on 401 (expired/invalid token), not on network errors
                if (error.response?.status === 401) {
                    clearAuth();
                }
                // For other errors (network, server), keep user logged in - they may retry
            })
            .finally(() => {
                setLoading(false);
            });
    }, [clearAuth]);

    const login = async (username, password) => {
        try {
            const response = await api.post('/auth/login', { username, password });
            const { token, user: userData } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);

            toast.success(`Welcome back, ${userData.full_name || userData.username}!`);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Login failed' };
        }
    };

    const logout = () => {
        clearAuth();
        toast.success('Logged out successfully');
    };

    const hasRole = (roles) => {
        if (!user) return false;
        if (Array.isArray(roles)) {
            return roles.includes(user.role);
        }
        return user.role === roles;
    };

    const isAdmin = () => hasRole('admin');
    const isSupervisor = () => hasRole(['admin', 'supervisor']);
    const isForeman = () => hasRole(['admin', 'supervisor', 'foreman']);

    const permissions = {
        'inventory:create': ['admin'],
        'inventory:edit': ['admin'],
        'inventory:delete': ['admin'],
        'inventory:update_location': ['admin'],
        'inventory:view_history': ['admin', 'supervisor', 'foreman'],
        'locations:manage': ['admin'],
        'locations:view': ['admin', 'supervisor', 'foreman', 'worker', 'personnel'],
        'transactions:checkout': ['admin', 'supervisor', 'foreman', 'worker'],
        'transactions:checkin': ['admin', 'supervisor', 'foreman', 'worker'],
        'users:manage': ['admin'],
        'audit_logs:view': ['admin']
    };

    const hasPermission = (permission) => {
        if (!user) return false;
        const allowedRoles = permissions[permission];
        return allowedRoles ? allowedRoles.includes(user.role) : false;
    };

    const value = {
        user,
        loading,
        login,
        logout,
        hasRole,
        isAdmin,
        isSupervisor,
        isForeman,
        hasPermission,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
