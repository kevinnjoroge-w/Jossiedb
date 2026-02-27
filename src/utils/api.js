import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
    baseURL: `http://${window.location.hostname}:3002/api/v1`,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000 // 15 second timeout to prevent hanging requests
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

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
                const originalRequest = error.config;
                const isAuthCheck = originalRequest.url?.includes('/auth/profile');

                if (!originalRequest._retry && !isAuthCheck && localStorage.getItem('refreshToken')) {
                    if (isRefreshing) {
                        return new Promise(function (resolve, reject) {
                            failedQueue.push({ resolve, reject });
                        }).then(token => {
                            originalRequest.headers['Authorization'] = 'Bearer ' + token;
                            return api(originalRequest);
                        }).catch(err => {
                            return Promise.reject(err);
                        });
                    }

                    originalRequest._retry = true;
                    isRefreshing = true;

                    return new Promise(function (resolve, reject) {
                        api.post('/auth/refresh', { refreshToken: localStorage.getItem('refreshToken') })
                            .then(({ data }) => {
                                localStorage.setItem('token', data.token);
                                localStorage.setItem('refreshToken', data.refreshToken);
                                api.defaults.headers.common['Authorization'] = 'Bearer ' + data.token;
                                originalRequest.headers['Authorization'] = 'Bearer ' + data.token;
                                processQueue(null, data.token);
                                resolve(api(originalRequest));
                            })
                            .catch((err) => {
                                processQueue(err, null);
                                localStorage.removeItem('token');
                                localStorage.removeItem('refreshToken');
                                localStorage.removeItem('user');
                                window.location.href = '/login';
                                toast.error('Session expired. Please login again.');
                                reject(err);
                            })
                            .finally(() => {
                                isRefreshing = false;
                            });
                    });
                } else if (!isAuthCheck) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('user');
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
