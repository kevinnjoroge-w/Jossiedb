import React from 'react';
import { motion } from 'framer-motion';
import { HardHat, LogOut, Bell, Moon, Sun } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { notificationService } from '../../services/notificationService';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

const Header = () => {
    const { user, logout } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const [unreadCount, setUnreadCount] = React.useState(0);

    React.useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const count = await notificationService.getUnreadCount();
                setUnreadCount(count);
            } catch (error) {
                console.error('Failed to fetch unread count:', error);
            }
        };

        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    const getRoleBadgeColor = (role) => {
        const colors = {
            admin: 'danger',
            supervisor: 'primary',
            foreman: 'success',
            worker: 'info',
            personnel: 'gray',
        };
        return colors[role] || 'gray';
    };

    return (
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo and Title */}
                    <motion.div
                        className="flex items-center gap-3"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg shadow-lg">
                            <HardHat className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                                Jossie<span className="text-primary-600">DB</span>
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Inventory System</p>
                        </div>
                    </motion.div>

                    {/* Right Section */}
                    <div className="flex items-center gap-4">
                        {/* Notifications */}
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <NavLink
                                to="/notifications"
                                className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors block"
                            >
                                <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </NavLink>
                        </motion.div>

                        {/* Theme Toggle */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={toggleTheme}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            {isDarkMode ? (
                                <Sun className="w-5 h-5 text-amber-500" />
                            ) : (
                                <Moon className="w-5 h-5 text-slate-600" />
                            )}
                        </motion.button>

                        {/* User Info */}
                        <div className="flex items-center gap-3 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full text-white text-sm font-semibold">
                                {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                    {user?.full_name || user?.username}
                                </p>
                                <Badge variant={getRoleBadgeColor(user?.role)} className="text-xs">
                                    {user?.role?.toUpperCase()}
                                </Badge>
                            </div>
                        </div>

                        {/* Logout Button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={logout}
                            icon={LogOut}
                        >
                            <span className="hidden sm:inline">Logout</span>
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
