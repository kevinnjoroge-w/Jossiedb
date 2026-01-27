// User roles
export const USER_ROLES = {
    ADMIN: 'admin',
    SUPERVISOR: 'supervisor',
    FOREMAN: 'foreman',
    WORKER: 'worker',
    PERSONNEL: 'personnel',
};

// Item statuses
export const ITEM_STATUS = {
    ACTIVE: 'active',
    UNDER_MAINTENANCE: 'under_maintenance',
    RETIRED: 'retired',
    DAMAGED: 'damaged',
};

// Item conditions
export const ITEM_CONDITION = {
    EXCELLENT: 'excellent',
    GOOD: 'good',
    FAIR: 'fair',
    POOR: 'poor',
};

// Checkout statuses
export const CHECKOUT_STATUS = {
    CHECKED_OUT: 'checked_out',
    OVERDUE: 'overdue',
    RETURNED: 'returned',
};

// Maintenance types
export const MAINTENANCE_TYPE = {
    PREVENTIVE: 'preventive',
    CORRECTIVE: 'corrective',
    INSPECTION: 'inspection',
};

// Maintenance statuses
export const MAINTENANCE_STATUS = {
    SCHEDULED: 'scheduled',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
};

// Project statuses
export const PROJECT_STATUS = {
    PLANNING: 'planning',
    IN_PROGRESS: 'in_progress',
    ON_HOLD: 'on_hold',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
};

// Audit log actions
export const AUDIT_ACTIONS = {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    CHECKOUT: 'CHECKOUT',
    CHECKIN: 'CHECKIN',
    MAINTENANCE: 'MAINTENANCE',
};

// Status colors
export const STATUS_COLORS = {
    [ITEM_STATUS.ACTIVE]: 'success',
    [ITEM_STATUS.UNDER_MAINTENANCE]: 'warning',
    [ITEM_STATUS.RETIRED]: 'gray',
    [ITEM_STATUS.DAMAGED]: 'danger',
    [CHECKOUT_STATUS.CHECKED_OUT]: 'info',
    [CHECKOUT_STATUS.OVERDUE]: 'danger',
    [CHECKOUT_STATUS.RETURNED]: 'success',
    [MAINTENANCE_STATUS.SCHEDULED]: 'info',
    [MAINTENANCE_STATUS.IN_PROGRESS]: 'warning',
    [MAINTENANCE_STATUS.COMPLETED]: 'success',
    [MAINTENANCE_STATUS.CANCELLED]: 'gray',
    [PROJECT_STATUS.PLANNING]: 'info',
    [PROJECT_STATUS.IN_PROGRESS]: 'primary',
    [PROJECT_STATUS.ON_HOLD]: 'warning',
    [PROJECT_STATUS.COMPLETED]: 'success',
    [PROJECT_STATUS.CANCELLED]: 'gray',
};

// Pagination
export const ITEMS_PER_PAGE = 10;
export const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

// Date formats
export const DATE_FORMAT = 'MMM dd, yyyy';
export const DATETIME_FORMAT = 'MMM dd, yyyy HH:mm';
export const TIME_FORMAT = 'HH:mm';

// API endpoints
export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        PROFILE: '/auth/profile',
    },
    ITEMS: '/items',
    CATEGORIES: '/categories',
    SUPPLIERS: '/suppliers',
    LOCATIONS: '/locations',
    USERS: '/users',
    CHECKOUTS: '/checkouts',
    MAINTENANCE: '/maintenance',
    PROJECTS: '/projects',
    ANALYTICS: '/analytics',
    AUDIT_LOGS: '/audit-logs',
};
