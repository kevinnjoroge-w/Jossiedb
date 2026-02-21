import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Trash2, Calendar, Info, AlertTriangle, Clock, Search } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { formatRelativeTime } from '../utils/formatters';
import Card, { CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import Badge from '../components/ui/Badge';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, unread
    const [searchTerm, setSearchTerm] = useState('');

    const socket = useSocket();

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(prev => (notifications.length === 0 ? true : prev));
            // Note: In a real app, 'user' would come from useAuth
            const data = await notificationService.getAll();
            setNotifications(data);
        } catch (error) {
            toast.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    }, [notifications.length]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    useEffect(() => {
        if (socket) {
            const handleUpdate = () => {
                fetchNotifications();
            };
            socket.on('NEW_NOTIFICATION', handleUpdate);
            socket.on('TRANSFER_UPDATED', handleUpdate);
            return () => {
                socket.off('NEW_NOTIFICATION', handleUpdate);
                socket.off('TRANSFER_UPDATED', handleUpdate);
            };
        }
    }, [socket, fetchNotifications]);

    const handleMarkAsRead = async (id) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(notifications.map(n =>
                n.id === id ? { ...n, is_read: true } : n
            ));
        } catch (error) {
            toast.error('Failed to update notification');
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
            toast.success('All notifications marked as read');
        } catch (error) {
            toast.error('Failed to update notifications');
        }
    };

    const handleDelete = async (id) => {
        try {
            await notificationService.delete(id);
            setNotifications(notifications.filter(n => n.id !== id));
            toast.success('Notification deleted');
        } catch (error) {
            toast.error('Failed to delete notification');
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'low_stock': return <AlertTriangle className="w-5 h-5 text-red-500" />;
            case 'maintenance': return <Calendar className="w-5 h-5 text-blue-500" />;
            case 'transfer_request': return <Clock className="w-5 h-5 text-purple-500" />;
            default: return <Info className="w-5 h-5 text-slate-400" />;
        }
    };

    const filteredNotifications = notifications.filter(n =>
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && notifications.length === 0) {
        return <Loading text="Loading notifications..." />;
    }

    return (
        <div className="space-y-6 animate-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                        Notifications
                        <Badge variant="primary" className="text-sm">
                            {notifications.filter(n => !n.is_read).length} Unread
                        </Badge>
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Stay updated with the latest alerts and system activities.
                    </p>
                </div>
                {notifications.some(n => !n.is_read) && (
                    <Button
                        variant="secondary"
                        size="sm"
                        icon={CheckCheck}
                        onClick={handleMarkAllRead}
                    >
                        Mark all as read
                    </Button>
                )}
            </div>

            <Card>
                <CardBody className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search notifications..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary-500 transition-all outline-none text-slate-900 dark:text-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === 'all'
                                    ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setFilter('unread')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === 'unread'
                                    ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                Unread
                            </button>
                        </div>
                    </div>
                </CardBody>
            </Card>

            <div className="space-y-4">
                {filteredNotifications.length === 0 ? (
                    <Card>
                        <CardBody className="py-20 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                <Bell className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">
                                No notifications found
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                You're all caught up! There are no {filter === 'unread' ? 'unread' : ''} notifications to show.
                            </p>
                        </CardBody>
                    </Card>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {filteredNotifications.map((notif) => (
                            <motion.div
                                key={notif.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`relative group p-4 rounded-xl border transition-all ${notif.is_read
                                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-75'
                                    : 'bg-primary-50/50 dark:bg-primary-900/10 border-primary-100 dark:border-primary-900/30 ring-1 ring-primary-100 dark:ring-primary-900/20 shadow-sm'
                                    }`}
                            >
                                <div className="flex gap-4">
                                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${notif.is_read ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-white dark:bg-slate-800 shadow-sm'
                                        }`}>
                                        {getIcon(notif.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className={`text-sm font-semibold truncate ${notif.is_read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                                                {notif.title}
                                            </h4>
                                            <span className="text-xs text-slate-500 whitespace-nowrap ml-2">
                                                {formatRelativeTime(notif.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                                            {notif.message}
                                        </p>
                                        <div className="mt-3 flex items-center gap-3">
                                            {!notif.is_read && (
                                                <button
                                                    onClick={() => handleMarkAsRead(notif.id)}
                                                    className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
                                                >
                                                    Mark as read
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(notif.id)}
                                                className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
