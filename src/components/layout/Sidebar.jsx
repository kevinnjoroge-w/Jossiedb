import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Package,
    ArrowRightLeft,
    Wrench,
    FolderKanban,
    BarChart3,
    FileText,
    Users,
    MapPin,
    Bell,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
    const { isAdmin, isSupervisor } = useAuth();
    const [collapsed, setCollapsed] = useState(false);

    const navItems = [
        { path: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['all'] },
        { path: '/notifications', icon: Bell, label: 'Notifications', roles: ['all'] },
        { path: '/inventory', icon: Package, label: 'Inventory', roles: ['all'] },
        { path: '/transfers', icon: ArrowRightLeft, label: 'Transfers', roles: ['all'] },
        { path: '/maintenance', icon: Wrench, label: 'Maintenance', roles: ['all'] },
        { path: '/projects', icon: FolderKanban, label: 'Projects', roles: ['all'] },
        { path: '/analytics', icon: BarChart3, label: 'Analytics', roles: ['admin'] },
        { path: '/locations', icon: MapPin, label: 'Locations', roles: ['admin', 'supervisor'] },
        { path: '/audit-logs', icon: FileText, label: 'Audit Logs', roles: ['admin', 'supervisor'] },
        { path: '/users', icon: Users, label: 'Users', roles: ['admin'] },
    ];

    const canAccessRoute = (roles) => {
        if (roles.includes('all')) return true;
        if (roles.includes('admin') && isAdmin()) return true;
        if (roles.includes('supervisor') && isSupervisor()) return true;
        return false;
    };

    return (
        <motion.aside
            initial={{ width: 256 }}
            animate={{ width: collapsed ? 80 : 256 }}
            transition={{ duration: 0.3 }}
            className="sticky top-16 h-[calc(100vh-4rem)] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-hidden"
        >
            <div className="flex flex-col h-full">
                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {navItems.map((item) => {
                        if (!canAccessRoute(item.roles)) return null;

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${isActive
                                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
                                        <AnimatePresence>
                                            {!collapsed && (
                                                <motion.span
                                                    initial={{ opacity: 0, width: 0 }}
                                                    animate={{ opacity: 1, width: 'auto' }}
                                                    exit={{ opacity: 0, width: 0 }}
                                                    className="font-medium whitespace-nowrap overflow-hidden"
                                                >
                                                    {item.label}
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Collapse Toggle */}
                <div className="p-3 border-t border-slate-200 dark:border-slate-800">
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
                    >
                        {collapsed ? (
                            <ChevronRight className="w-5 h-5" />
                        ) : (
                            <>
                                <ChevronLeft className="w-5 h-5" />
                                <span className="text-sm font-medium">Collapse</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </motion.aside>
    );
};

export default Sidebar;
