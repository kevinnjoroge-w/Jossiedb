import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, X, Shield, User, Lock, Mail } from 'lucide-react';
import { userService } from '../services/userService';
import api from '../utils/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null); // For edit mode

    // Form State
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        full_name: '',
        role: 'worker',
        assigned_location_ids: []
    });

    useEffect(() => {
        fetchUsers();
        fetchLocations();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await userService.getAllUsers();
            setUsers(data);
        } catch (error) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const fetchLocations = async () => {
        try {
            const res = await api.get('/locations');
            setLocations(res.data);
        } catch (error) {
            console.error('Failed to load locations', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (currentUser) {
                await userService.updateUser(currentUser._id || currentUser.id, formData);
                toast.success('User updated successfully');
            } else {
                await userService.createUser(formData);
                toast.success('User created successfully');
            }
            setIsModalOpen(false);
            resetForm();
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await userService.deleteUser(id);
                toast.success('User deleted successfully');
                fetchUsers();
            } catch (error) {
                toast.error('Failed to delete user');
            }
        }
    };

    const openEditModal = (user) => {
        setCurrentUser(user);
        setFormData({
            username: user.username,
            email: user.email,
            password: '', // Leave empty if not changing
            full_name: user.full_name,
            role: user.role,
            assigned_location_ids: (user.assigned_locations || []).map(loc => loc._id || loc.id)
        });
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setCurrentUser(null);
        setFormData({
            username: '',
            email: '',
            password: '',
            full_name: '',
            role: 'worker',
            assigned_location_ids: []
        });
    };

    const toggleLocation = (locId) => {
        setFormData(prev => {
            const current = prev.assigned_location_ids || [];
            if (current.includes(locId)) {
                return { ...prev, assigned_location_ids: current.filter(id => id !== locId) };
            } else {
                return { ...prev, assigned_location_ids: [...current, locId] };
            }
        });
    };

    const filteredUsers = users.filter(user =>
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">User Management</h1>
                <Button onClick={() => { resetForm(); setIsModalOpen(true); }} icon={Plus}>
                    Add New User
                </Button>
            </div>

            {/* Search Bar */}
            <div className="glass p-4 rounded-xl">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700 text-white pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="glass rounded-xl overflow-hidden bg-slate-800/95">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-700/50 bg-slate-900/50">
                                <th className="p-4 text-slate-100 font-medium">User</th>
                                <th className="p-4 text-slate-100 font-medium">Role</th>
                                <th className="p-4 text-slate-100 font-medium">Assigned Locations</th>
                                <th className="p-4 text-slate-100 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user._id || user.id} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold">
                                                {user.full_name?.charAt(0) || user.username.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{user.full_name || user.username}</p>
                                                <p className="text-sm text-slate-100">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize
                      ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                                user.role === 'supervisor' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                    'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-1">
                                            {user.assigned_locations?.length > 0 ? (
                                                user.assigned_locations.map(loc => (
                                                    <span key={loc._id || loc.id} className="px-2 py-0.5 bg-slate-700 text-white rounded text-xs font-medium">
                                                        {loc.name}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-slate-300 text-xs italic">
                                                    {user.role === 'admin' || user.role === 'supervisor' ? 'All Locations' : 'No Locations'}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end space-x-2">
                                            <button onClick={() => openEditModal(user)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-100 hover:text-white transition-colors">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(user._id || user.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-slate-100 hover:text-red-500 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredUsers.length === 0 && !loading && (
                        <div className="p-8 text-center text-slate-500">
                            No users found matching your search.
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                        >
                            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-white">
                                    {currentUser ? 'Edit User' : 'Create New User'}
                                </h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                                <Input
                                    label="Full Name"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    icon={User}
                                    required
                                />
                                <Input
                                    label="Username"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    icon={Shield}
                                    required
                                />
                                <Input
                                    label="Email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    icon={Mail}
                                    required
                                />
                                <Input
                                    label={currentUser ? "New Password (leave empty to keep current)" : "Password"}
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    icon={Lock}
                                    required={!currentUser}
                                />

                                <div>
                                    <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Role</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="admin">Admin</option>
                                        <option value="supervisor">Supervisor</option>
                                        <option value="foreman">Foreman</option>
                                        <option value="worker">Worker</option>
                                        <option value="personnel">Personnel</option>
                                    </select>
                                </div>

                                {formData.role !== 'admin' && formData.role !== 'supervisor' && (
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                                            Assign Locations
                                        </label>
                                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-3 bg-slate-800 rounded-lg border border-slate-700 custom-scrollbar">
                                            {locations.map(loc => (
                                                <label key={loc._id || loc.id} className="flex items-center space-x-2 cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.assigned_location_ids?.includes(loc._id || loc.id)}
                                                        onChange={() => toggleLocation(loc._id || loc.id)}
                                                        className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-primary-500 focus:ring-primary-500 focus:ring-offset-slate-900"
                                                    />
                                                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                                                        {loc.name}
                                                    </span>
                                                </label>
                                            ))}
                                            {locations.length === 0 && (
                                                <p className="text-slate-500 text-sm col-span-2">No locations available</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 flex justify-end space-x-3 sticky bottom-0 bg-slate-900 border-t border-slate-800 -mx-6 px-6 pb-2 mt-4">
                                    <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit">
                                        {currentUser ? 'Save Changes' : 'Create User'}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UsersPage;
