import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Package,
    ArrowRightLeft,
    Wrench,
    TrendingUp,
    Clock
} from 'lucide-react';
import api from '../utils/api';
import { formatNumber, formatRelativeTime } from '../utils/formatters';
import Stats from '../components/ui/Stats';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Loading from '../components/ui/Loading';
import Alert from '../components/ui/Alert';
import { STATUS_COLORS } from '../utils/constants';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const { isAdmin } = useAuth();
    const [stats, setStats] = useState(null);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [recentCheckouts, setRecentCheckouts] = useState([]);
    const [upcomingMaintenance, setUpcomingMaintenance] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [
                analyticsRes,
                lowStockRes,
                checkoutsRes,
                maintenanceRes
            ] = await Promise.all([
                api.get('/analytics/summary'),
                api.get('/analytics/low-stock-alerts'),
                api.get('/checkouts?limit=5'),
                api.get('/maintenance?status=scheduled&limit=5'),
            ]);

            setStats(analyticsRes.data);
            setLowStockItems(lowStockRes.data);
            setRecentCheckouts(checkoutsRes.data);
            setUpcomingMaintenance(maintenanceRes.data);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Loading text="Loading dashboard..." />;
    }

    return (
        <div className="space-y-6 animate-in">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    Dashboard
                </h1>
                <p className="text-slate-700 dark:text-slate-300">
                    Welcome back! Here's what's happening with your inventory.
                </p>
            </div>

            {/* Low Stock Alert */}
            {lowStockItems.length > 0 && (
                <Alert variant="warning" title="Low Stock Alert">
                    {lowStockItems.length} item(s) are below minimum stock threshold.
                    <a href="/inventory" className="ml-2 underline font-medium">
                        View items
                    </a>
                </Alert>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Stats
                    title="Total Items"
                    value={formatNumber(stats?.totalItems || 0)}
                    icon={Package}
                    color="primary"
                    trend="up"
                    trendValue="12%"
                />
                <Stats
                    title="Active Checkouts"
                    value={formatNumber(stats?.activeCheckouts || 0)}
                    icon={ArrowRightLeft}
                    color="info"
                />
                <Stats
                    title="Maintenance Due"
                    value={formatNumber(stats?.maintenanceDue || 0)}
                    icon={Wrench}
                    color="warning"
                />
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Checkouts */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                Recent Checkouts
                            </h3>
                            <a
                                href="/checkouts"
                                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                            >
                                View all
                            </a>
                        </div>
                    </CardHeader>
                    <CardBody>
                        {recentCheckouts.length === 0 ? (
                            <p className="text-center text-slate-500 py-8">No recent checkouts</p>
                        ) : (
                            <div className="space-y-4">
                                {recentCheckouts.map((checkout) => (
                                    <motion.div
                                        key={checkout.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-900 dark:text-white">
                                                {checkout.item?.name}
                                            </p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                Checked out to {checkout.checked_out_to_user?.full_name || checkout.checked_out_to_user?.username}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant={STATUS_COLORS[checkout.status]}>
                                                {checkout.status.replace('_', ' ')}
                                            </Badge>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                                {formatRelativeTime(checkout.checkout_date)}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>

                {/* Upcoming Maintenance */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                Upcoming Maintenance
                            </h3>
                            <a
                                href="/maintenance"
                                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                            >
                                View all
                            </a>
                        </div>
                    </CardHeader>
                    <CardBody>
                        {upcomingMaintenance.length === 0 ? (
                            <p className="text-center text-slate-500 py-8">No upcoming maintenance</p>
                        ) : (
                            <div className="space-y-4">
                                {upcomingMaintenance.map((maintenance) => (
                                    <motion.div
                                        key={maintenance.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <div className="flex items-center justify-center w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                                            <Wrench className="w-5 h-5 text-yellow-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-900 dark:text-white">
                                                {maintenance.item?.name}
                                            </p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                {maintenance.maintenance_type} - {maintenance.description}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                                                <Clock className="w-4 h-4" />
                                                {formatRelativeTime(maintenance.scheduled_date)}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Quick Actions
                    </h3>
                </CardHeader>
                <CardBody>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {isAdmin() && (
                            <QuickActionButton
                                href="/inventory"
                                icon={Package}
                                label="Add Item"
                                color="from-blue-500 to-blue-600"
                            />
                        )}
                        <QuickActionButton
                            href="/checkouts"
                            icon={ArrowRightLeft}
                            label="Check Out"
                            color="from-green-500 to-green-600"
                        />
                        <QuickActionButton
                            href="/maintenance"
                            icon={Wrench}
                            label="Schedule Maintenance"
                            color="from-yellow-500 to-yellow-600"
                        />
                        {isAdmin() && (
                            <QuickActionButton
                                href="/analytics"
                                icon={TrendingUp}
                                label="View Analytics"
                                color="from-purple-500 to-purple-600"
                            />
                        )}
                    </div>
                </CardBody>
            </Card>
        </div>
    );
};

const QuickActionButton = ({ href, icon: Icon, label, color }) => (
    <motion.a
        href={href}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-br ${color} text-white shadow-lg hover:shadow-xl transition-shadow`}
    >
        <Icon className="w-8 h-8 mb-2" />
        <span className="text-sm font-medium text-center">{label}</span>
    </motion.a>
);

export default Dashboard;
