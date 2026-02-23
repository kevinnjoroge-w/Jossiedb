import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
    baseURL: 'http://localhost:3002/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000 // 15 second timeout to prevent hanging requests
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            const { status, data } = error.response;

            // Handle specific error codes
            if (status === 401) {
                // Don't redirect/toast for background auth checks (e.g. /auth/profile)
                const isAuthCheck = error.config?.url?.includes('/auth/profile');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                if (!isAuthCheck) {
                    window.location.href = '/login';
                    toast.error('Session expired. Please login again.');
                }
            } else if (status === 403) {
                toast.error('You do not have permission to perform this action.');
            } else if (status === 404) {
                toast.error('Resource not found.');
            } else if (status === 500) {
                toast.error('Server error. Please try again later.');
            } else {
                toast.error(data.error || data.message || 'An error occurred');
            }
        } else if (error.request) {
            toast.error('Network error. Please check your connection.');
        } else {
            toast.error('An unexpected error occurred.');
        }

        return Promise.reject(error);
    }
);

export default api;
