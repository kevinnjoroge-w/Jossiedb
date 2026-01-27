import { format, formatDistance, formatDistanceToNow, parseISO } from 'date-fns';

// Format date to readable string
export const formatDate = (date, formatStr = 'MMM dd, yyyy') => {
    if (!date) return 'N/A';
    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        return format(dateObj, formatStr);
    } catch (error) {
        return 'Invalid date';
    }
};

// Format date with time
export const formatDateTime = (date) => {
    return formatDate(date, 'MMM dd, yyyy HH:mm');
};

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (date) => {
    if (!date) return 'N/A';
    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        return formatDistanceToNow(dateObj, { addSuffix: true });
    } catch (error) {
        return 'Invalid date';
    }
};

// Format currency
export const formatCurrency = (amount, currency = 'USD') => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

// Format number with commas
export const formatNumber = (number) => {
    if (number === null || number === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US').format(number);
};

// Format percentage
export const formatPercentage = (value, decimals = 1) => {
    if (value === null || value === undefined) return 'N/A';
    return `${value.toFixed(decimals)}%`;
};

// Capitalize first letter
export const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
};

// Format status text (replace underscores with spaces and capitalize)
export const formatStatus = (status) => {
    if (!status) return '';
    return status
        .split('_')
        .map(word => capitalize(word))
        .join(' ');
};

// Truncate text
export const truncate = (text, maxLength = 50) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

// Get initials from name
export const getInitials = (name) => {
    if (!name) return '?';
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
};
