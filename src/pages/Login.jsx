import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HardHat, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const Login = () => {
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(formData.username, formData.password);

        if (!result.success) {
            setError(result.error);
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const quickLogins = [
        { role: 'Admin', username: 'admin', password: 'adminpass', color: 'from-purple-500 to-purple-600' },
        { role: 'Supervisor', username: 'supervisor1', password: 'supervisorpass', color: 'from-blue-500 to-blue-600' },
        { role: 'Foreman', username: 'foreman1', password: 'foremanpass', color: 'from-green-500 to-green-600' },
        { role: 'Worker', username: 'worker1', password: 'workerpass', color: 'from-orange-500 to-orange-600' },
    ];

    const handleQuickLogin = (username, password) => {
        setFormData({ username, password });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Logo and Title */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-2xl shadow-primary-500/50 mb-4"
                    >
                        <HardHat className="w-10 h-10 text-white" />
                    </motion.div>
                    <h1 className="text-4xl font-bold text-white mb-2">
                        Jossie<span className="text-primary-500">DB</span>
                    </h1>
                    <p className="text-slate-400">Construction Inventory Management</p>
                </div>

                {/* Login Card */}
                <div className="glass rounded-2xl shadow-2xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="alert-danger"
                            >
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="text-sm">{error}</p>
                            </motion.div>
                        )}

                        <Input
                            label="Username"
                            name="username"
                            type="text"
                            value={formData.username}
                            onChange={handleChange}
                            icon={User}
                            placeholder="Enter your username"
                            required
                        />

                        <Input
                            label="Password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            icon={Lock}
                            placeholder="Enter your password"
                            required
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full"
                            loading={loading}
                        >
                            Sign In
                        </Button>
                    </form>

                    {/* Quick Login Section */}
                    <div className="mt-8 pt-6 border-t border-slate-700">
                        <p className="text-sm text-slate-400 text-center mb-4">Quick Login (Demo)</p>
                        <div className="grid grid-cols-2 gap-3">
                            {quickLogins.map((account) => (
                                <motion.button
                                    key={account.role}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleQuickLogin(account.username, account.password)}
                                    className={`p-3 rounded-lg bg-gradient-to-br ${account.color} text-white text-sm font-medium shadow-lg hover:shadow-xl transition-shadow`}
                                >
                                    {account.role}
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-slate-500 text-sm mt-6">
                    © 2026 JossieDB. All rights reserved.
                </p>
            </motion.div>
        </div>
    );
};

export default Login;
