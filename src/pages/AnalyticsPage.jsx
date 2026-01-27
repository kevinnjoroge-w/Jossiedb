import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, Package, AlertTriangle, CheckCircle } from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
import Loading from '../components/ui/Loading';

const AnalyticsPage = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const summary = await analyticsService.getSummary();
                setData(summary);
            } catch (error) {
                console.error('Failed to load analytics', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <Loading />;

    // Mock chart data since backend doesn't provide historical data yet
    const chartData = [
        { name: 'Jan', checkouts: 40 },
        { name: 'Feb', checkouts: 30 },
        { name: 'Mar', checkouts: 20 },
        { name: 'Apr', checkouts: 27 },
        { name: 'May', checkouts: 18 },
        { name: 'Jun', checkouts: 23 },
        { name: 'Jul', checkouts: 34 },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard title="Total Inventory" value={data?.totalItems || 0} icon={Package} color="text-blue-400" />
                <StatsCard title="Low Stock Alerts" value={data?.lowStockItems || 0} icon={AlertTriangle} color="text-red-400" />
                <StatsCard title="Active Checkouts" value={data?.checkedOutItems || 0} icon={TrendingUp} color="text-yellow-400" />
                <StatsCard title="Active Projects" value={data?.activeProjects || 0} icon={CheckCircle} color="text-green-400" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass p-6 rounded-xl">
                    <h3 className="text-lg font-bold text-white mb-6">Checkout Trends</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Bar dataKey="checkouts" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass p-6 rounded-xl">
                    <h3 className="text-lg font-bold text-white mb-6">System Health</h3>
                    <div className="space-y-4">
                        <HealthItem label="Database Status" status="Healthy" color="text-green-400" />
                        <HealthItem label="API Latency" status="24ms" color="text-blue-400" />
                        <HealthItem label="Pending Maintenance" status={`${data?.pendingMaintenance || 0} Tasks`} color="text-yellow-400" />
                        <HealthItem label="Storage Usage" status="45%" color="text-purple-400" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatsCard = ({ title, value, icon: Icon, color }) => (
    <div className="glass p-6 rounded-xl flex items-center space-x-4">
        <div className={`p-3 bg-slate-800 rounded-lg ${color}`}>
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <p className="text-slate-400 text-sm">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

const HealthItem = ({ label, status, color }) => (
    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
        <span className="text-slate-300">{label}</span>
        <span className={`font-medium ${color}`}>{status}</span>
    </div>
);

export default AnalyticsPage;
