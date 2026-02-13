import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const response = await api.get('/auth/profile');
                setUser(response.data.user);
            } catch (error) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    };

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
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
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
        'inventory:create': ['admin', 'supervisor'],
        'inventory:edit': ['admin', 'supervisor'],
        'inventory:delete': ['admin'],
        'inventory:update_location': ['admin', 'supervisor', 'foreman'],
        'inventory:view_history': ['admin', 'supervisor', 'foreman'],
        'locations:manage': ['admin'],
        'locations:view': ['admin', 'supervisor', 'foreman', 'worker', 'personnel'],
        'transactions:checkout': ['admin', 'supervisor', 'foreman', 'worker'],
        'transactions:checkin': ['admin', 'supervisor', 'foreman', 'worker'],
        'users:manage': ['admin'],
        'audit_logs:view': ['admin', 'supervisor']
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
