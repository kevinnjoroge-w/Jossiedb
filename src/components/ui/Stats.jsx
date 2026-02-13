import React from 'react';
import { motion } from 'framer-motion';
import Card from './Card';

const Stats = ({
    title,
    value,
    icon: Icon,
    trend,
    trendValue,
    color = 'primary',
    loading = false
}) => {
    const colorClasses = {
        primary: 'from-primary-500 to-primary-600',
        success: 'from-green-500 to-green-600',
        warning: 'from-yellow-500 to-yellow-600',
        danger: 'from-red-500 to-red-600',
        info: 'from-blue-500 to-blue-600',
    };

    if (loading) {
        return (
            <Card className="p-6">
                <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                    <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                </div>
            </Card>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card className="stat-card">
                <div className="flex items-start justify-between relative z-10">
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            {title}
                        </p>
                        <p className="text-3xl font-bold text-slate-950 dark:text-white">
                            {value}
                        </p>
                        {trend && (
                            <div className="flex items-center gap-1 mt-2">
                                <span className={`text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    {trend === 'up' ? '↑' : '↓'} {trendValue}
                                </span>
                                <span className="text-xs text-slate-600 dark:text-slate-400">vs last month</span>
                            </div>
                        )}
                    </div>
                    {Icon && (
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} text-white shadow-lg`}>
                            <Icon className="w-6 h-6" />
                        </div>
                    )}
                </div>
            </Card>
        </motion.div>
    );
};

export default Stats;
