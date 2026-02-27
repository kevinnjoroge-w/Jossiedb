import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, X, Wrench, Calendar, CheckCircle2,
    Clock, AlertTriangle, ClipboardList, Trash2, ChevronDown, Users
} from 'lucide-react';
import { maintenanceService } from '../services/maintenanceService';
import { inventoryService } from '../services/inventoryService';
import { userService } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';

// ── helpers ──────────────────────────────────────────────────────────────────
const TYPE_LABELS = { preventive: 'Preventive', corrective: 'Corrective', inspection: 'Inspection' };
const TYPE_COLORS = {
    preventive: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    corrective: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    inspection: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
};
const STATUS_COLORS = {
    scheduled: 'bg-yellow-500/15 text-yellow-400',
    in_progress: 'bg-blue-500/15 text-blue-400',
    completed: 'bg-green-500/15 text-green-400',
    cancelled: 'bg-slate-500/15 text-slate-400',
};
const STATUS_ICON = {
    scheduled: Clock,
    in_progress: Wrench,
    completed: CheckCircle2,
    cancelled: X,
};

function isOverdue(record) {
    return (
        record.status === 'scheduled' &&
        new Date(record.scheduled_date) < new Date()
    );
}

// ─────────────────────────────────────────────────────────────────────────────
const MaintenancePage = () => {
    const { hasPermission, isAdmin } = useAuth();
    const [records, setRecords] = useState([]);
    const [items, setItems] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('active');
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'workload'

    // modals
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const [isCompleteOpen, setIsCompleteOpen] = useState(false);
    const [targetRecord, setTargetRecord] = useState(null);
    const [completeNotes, setCompleteNotes] = useState('');

    const [formData, setFormData] = useState({
        item_id: '',
        technician_id: '',
        type: 'preventive',
        description: '',
        scheduled_date: ''
    });

    const [isRecurring, setIsRecurring] = useState(false);
    const [frequencyDays, setFrequencyDays] = useState(30);

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [recs, itms] = await Promise.all([
                maintenanceService.getAll(),
                inventoryService.getAllItems(),
            ]);
            // deduplicate items by name for the dropdown
            const seen = new Set();
            const uniqueItems = itms.filter(i => {
                if (seen.has(i.name)) return false;
                seen.add(i.name);
                return true;
            });
            setRecords(recs);
            setItems(uniqueItems);

            // fetch users separately – graceful fail
            try {
                const u = await userService.getAllUsers();
                setUsers(u);
            } catch (_) { }
        } catch {
            toast.error('Failed to load maintenance data');
        } finally {
            setLoading(false);
        }
    };

    // ── derived ──
    const active = records.filter(r => r.status === 'scheduled' || r.status === 'in_progress');
    const completed = records.filter(r => r.status === 'completed');
    const overdue = records.filter(r => isOverdue(r));

    const displayed = records.filter(r => {
        const matchStatus =
            statusFilter === 'active' ? (r.status === 'scheduled' || r.status === 'in_progress') :
                statusFilter === 'completed' ? r.status === 'completed' :
                    statusFilter === 'overdue' ? isOverdue(r) :
                        true;
        const matchSearch =
            (r.item?.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (r.description || '').toLowerCase().includes(search.toLowerCase()) ||
            (r.technician?.full_name || '').toLowerCase().includes(search.toLowerCase());
        return matchSearch;
    });

    // Compute workload
    const workloadData = users.map(user => {
        const userRecords = records.filter(r => r.technician && (r.technician._id === user.id || r.technician.id === user.id));
        const userActive = userRecords.filter(r => r.status === 'scheduled' || r.status === 'in_progress');
        const userOverdue = userRecords.filter(r => isOverdue(r));
        const userCompleted = userRecords.filter(r => r.status === 'completed');
        return {
            user,
            activeCount: userActive.length,
            overdueCount: userOverdue.length,
            completedCount: userCompleted.length,
            totalCount: userRecords.length
        };
    }).sort((a, b) => b.activeCount - a.activeCount);

    const unassignedRecords = records.filter(r => !r.technician);
    const unassignedActive = unassignedRecords.filter(r => r.status === 'scheduled' || r.status === 'in_progress');
    const unassignedOverdue = unassignedRecords.filter(r => isOverdue(r));

    // ── handlers ──────────────────────────────────────────────────────────────
    const handleSchedule = async (e) => {
        e.preventDefault();
        try {
            const dataToSubmit = { ...formData };
            if (isRecurring) {
                dataToSubmit.recurring = {
                    enabled: true,
                    frequency_days: Number(frequencyDays)
                };
            }

            await maintenanceService.schedule(dataToSubmit);
            toast.success('Maintenance scheduled');
            setIsScheduleOpen(false);
            setFormData({ item_id: '', technician_id: '', type: 'preventive', description: '', scheduled_date: '' });
            setIsRecurring(false);
            setFrequencyDays(30);
            fetchAll();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to schedule');
        }
    };

    const handleStatusChange = async (record, newStatus) => {
        if (newStatus === 'completed') {
            setTargetRecord(record);
            setCompleteNotes('');
            setIsCompleteOpen(true);
            return;
        }
        try {
            await maintenanceService.updateStatus(record._id || record.id, { status: newStatus });
            toast.success(`Marked as ${newStatus.replace('_', ' ')}`);
            fetchAll();
        } catch {
            toast.error('Update failed');
        }
    };

    const handleComplete = async (e) => {
        e.preventDefault();
        try {
            await maintenanceService.updateStatus(targetRecord._id || targetRecord.id, {
                status: 'completed',
                technician_notes: completeNotes,
                completed_date: new Date().toISOString(),
            });
            toast.success('Marked as completed');
            setIsCompleteOpen(false);
            fetchAll();
        } catch {
            toast.error('Failed to complete');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this maintenance record?')) return;
        try {
            await maintenanceService.delete(id);
            toast.success('Deleted');
            fetchAll();
        } catch {
            toast.error('Delete failed');
        }
    };

    // ── render ────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-white">Maintenance</h1>
                    <div className="flex bg-slate-800/50 p-1 rounded-lg border border-slate-700">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-1.5 rounded-md text-sm font-semibold flex items-center gap-2 transition-all ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <ClipboardList className="w-4 h-4" /> List
                        </button>
                        <button
                            onClick={() => setViewMode('workload')}
                            className={`px-3 py-1.5 rounded-md text-sm font-semibold flex items-center gap-2 transition-all ${viewMode === 'workload' ? 'bg-primary-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <Users className="w-4 h-4" /> Workload
                        </button>
                    </div>
                </div>
                {isAdmin() && (
                    <Button onClick={() => setIsScheduleOpen(true)} icon={Plus}>
                        Schedule Maintenance
                    </Button>
                )}
            </div>

            {viewMode === 'workload' ? (
                <div className="space-y-6">
                    <h2 className="text-lg font-bold text-white">Technician Workload</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Unassigned Work */}
                        <div className="glass p-6 rounded-xl bg-slate-800/95 border border-slate-700/50">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-lg bg-slate-700/50">
                                        <AlertTriangle className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold">Unassigned</h3>
                                        <p className="text-xs text-slate-400">Needs technician</p>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-4 text-center">
                                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                                    <p className="text-2xl font-black text-blue-400">{unassignedActive.length}</p>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">Active</p>
                                </div>
                                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                                    <p className="text-2xl font-black text-red-400">{unassignedOverdue.length}</p>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">Overdue</p>
                                </div>
                            </div>
                        </div>

                        {/* Assignees Work */}
                        {workloadData.map(({ user, activeCount, overdueCount, completedCount, totalCount }) => (
                            <div key={user.id} className="glass p-6 rounded-xl bg-slate-800/95 border border-slate-700/50">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 rounded-lg bg-blue-500/10">
                                            <Wrench className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-bold truncate max-w-[150px]" title={user.full_name}>{user.full_name}</h3>
                                            <p className="text-xs text-slate-400">{user.role}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3 mt-4 text-center">
                                    <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
                                        <p className="text-xl font-black text-blue-400">{activeCount}</p>
                                        <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">Active</p>
                                    </div>
                                    <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
                                        <p className="text-xl font-black text-red-400">{overdueCount}</p>
                                        <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">Overdue</p>
                                    </div>
                                    <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
                                        <p className="text-xl font-black text-green-400">{completedCount}</p>
                                        <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">Done</p>
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-between items-center text-xs text-slate-400 border-t border-slate-700/50 pt-4">
                                    <span>Total Assigned: {totalCount}</span>
                                    {activeCount === 0 && overdueCount === 0 ? (
                                        <span className="text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Available</span>
                                    ) : (
                                        <span className="text-blue-400">Busy</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    {/* Stats row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Active', value: active.length, color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Wrench },
                            { label: 'Overdue', value: overdue.length, color: 'text-red-400', bg: 'bg-red-500/10', icon: AlertTriangle },
                            { label: 'Completed', value: completed.length, color: 'text-green-400', bg: 'bg-green-500/10', icon: CheckCircle2 },
                            { label: 'Total', value: records.length, color: 'text-slate-300', bg: 'bg-slate-700/50', icon: ClipboardList },
                        ].map(({ label, value, color, bg, icon: Icon }) => (
                            <div key={label} className="glass p-4 rounded-xl flex items-center gap-4 bg-slate-800/80">
                                <div className={`p-3 rounded-lg ${bg}`}>
                                    <Icon className={`w-5 h-5 ${color}`} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">{label}</p>
                                    <p className={`text-2xl font-black ${color}`}>{value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Filters */}
                    <div className="glass p-4 rounded-xl flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search by item, description, or technician..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full bg-slate-800/50 border border-slate-700 text-white pl-10 pr-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                            />
                        </div>
                        <div className="flex gap-2 bg-slate-800/50 p-1 rounded-lg border border-slate-700">
                            {[
                                { key: 'active', label: 'Active' },
                                { key: 'overdue', label: 'Overdue' },
                                { key: 'completed', label: 'Done' },
                                { key: 'all', label: 'All' },
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setStatusFilter(key)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${statusFilter === key ? 'bg-primary-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    {label}
                                    {key === 'overdue' && overdue.length > 0 && (
                                        <span className="ml-1.5 bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{overdue.length}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Records list */}
                    {loading ? (
                        <div className="flex justify-center py-16">
                            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : displayed.length === 0 ? (
                        <div className="glass p-14 rounded-2xl text-center">
                            <Wrench className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                            <p className="text-white font-semibold">No maintenance records found</p>
                            <p className="text-slate-400 text-sm mt-1">Try adjusting your filters or schedule a new job.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {displayed.map(record => {
                                const overdueFlag = isOverdue(record);
                                const StatusIcon = STATUS_ICON[record.status] || Clock;
                                const id = record._id || record.id;
                                return (
                                    <motion.div
                                        key={id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`glass p-6 rounded-xl bg-slate-800/95 border transition-all ${overdueFlag ? 'border-red-500/40' : 'border-slate-700/50 hover:border-slate-600'}`}
                                    >
                                        <div className="flex flex-col md:flex-row gap-4">
                                            {/* Left */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                    {/* Type badge */}
                                                    <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded border ${TYPE_COLORS[record.type] || 'bg-slate-600/30 text-slate-400'}`}>
                                                        {TYPE_LABELS[record.type] || record.type}
                                                    </span>
                                                    {/* Status badge */}
                                                    <span className={`flex items-center gap-1 text-[10px] uppercase font-black px-2 py-0.5 rounded ${STATUS_COLORS[record.status]}`}>
                                                        <StatusIcon className="w-3 h-3" />
                                                        {record.status.replace('_', ' ')}
                                                    </span>
                                                    {overdueFlag && (
                                                        <span className="flex items-center gap-1 text-[10px] uppercase font-black px-2 py-0.5 rounded bg-red-500/20 text-red-400">
                                                            <AlertTriangle className="w-3 h-3" /> Overdue
                                                        </span>
                                                    )}
                                                </div>

                                                <h3 className="text-lg font-bold text-white truncate">
                                                    {record.item?.name || 'Unknown Item'}
                                                </h3>
                                                <p className="text-sm text-slate-300 mt-1 line-clamp-2">{record.description}</p>

                                                <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-400">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        Scheduled: <span className={`font-semibold ${overdueFlag ? 'text-red-400' : 'text-slate-200'}`}>{new Date(record.scheduled_date).toLocaleDateString()}</span>
                                                    </span>
                                                    {record.technician && (
                                                        <span className="flex items-center gap-1">
                                                            <Wrench className="w-3.5 h-3.5" />
                                                            Technician: <span className="font-semibold text-slate-200">{record.technician.full_name}</span>
                                                        </span>
                                                    )}
                                                    {record.status === 'completed' && record.completed_date && (
                                                        <span className="flex items-center gap-1">
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                                            Completed: <span className="font-semibold text-green-400">{new Date(record.completed_date).toLocaleDateString()}</span>
                                                        </span>
                                                    )}
                                                </div>

                                                {record.technician_notes && (
                                                    <p className="mt-3 text-xs text-slate-400 italic bg-slate-700/40 px-3 py-2 rounded-lg border border-slate-700">
                                                        "{record.technician_notes}"
                                                    </p>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex md:flex-col gap-2 shrink-0 justify-end">
                                                {record.status === 'scheduled' && (
                                                    <button
                                                        onClick={() => handleStatusChange(record, 'in_progress')}
                                                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 transition-all whitespace-nowrap"
                                                    >
                                                        Start Work
                                                    </button>
                                                )}
                                                {(record.status === 'scheduled' || record.status === 'in_progress') && (
                                                    <button
                                                        onClick={() => handleStatusChange(record, 'completed')}
                                                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 transition-all whitespace-nowrap"
                                                    >
                                                        Complete
                                                    </button>
                                                )}
                                                {record.status === 'scheduled' && (
                                                    <button
                                                        onClick={() => handleStatusChange(record, 'cancelled')}
                                                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 border border-slate-600 transition-all whitespace-nowrap"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                                {isAdmin() && (
                                                    <button
                                                        onClick={() => handleDelete(id)}
                                                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {/* ── Schedule Modal ── */}
            <AnimatePresence>
                {isScheduleOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white">Schedule Maintenance</h2>
                                <button onClick={() => setIsScheduleOpen(false)}><X className="text-slate-400 hover:text-white" /></button>
                            </div>

                            <form onSubmit={handleSchedule} className="space-y-4">
                                {/* Item */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Equipment / Item</label>
                                    <select
                                        required
                                        value={formData.item_id}
                                        onChange={e => setFormData({ ...formData, item_id: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="">-- Select item --</option>
                                        {items.map(item => (
                                            <option key={item.id} value={item.id}>{item.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Type + Date */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
                                        <select
                                            value={formData.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500"
                                        >
                                            <option value="preventive">Preventive</option>
                                            <option value="corrective">Corrective</option>
                                            <option value="inspection">Inspection</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Scheduled Date</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.scheduled_date}
                                            onChange={e => setFormData({ ...formData, scheduled_date: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                </div>

                                {/* Technician */}
                                {users.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Assign Technician <span className="text-slate-500">(optional)</span></label>
                                        <select
                                            value={formData.technician_id}
                                            onChange={e => setFormData({ ...formData, technician_id: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500"
                                        >
                                            <option value="">-- Unassigned --</option>
                                            {users.map(u => (
                                                <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Recurring Configuration */}
                                <div className="p-4 rounded-lg border border-slate-700/50 bg-slate-800/30">
                                    <div className="flex items-center gap-2 mb-3">
                                        <input
                                            type="checkbox"
                                            id="recurring"
                                            checked={isRecurring}
                                            onChange={(e) => setIsRecurring(e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-primary-500 focus:ring-primary-500 focus:ring-offset-slate-900"
                                        />
                                        <label htmlFor="recurring" className="text-sm font-bold text-white cursor-pointer select-none">
                                            Make this a recurring schedule
                                        </label>
                                    </div>

                                    {isRecurring && (
                                        <div className="flex items-center gap-3 ml-6 mt-2">
                                            <label className="text-sm text-slate-300">Repeat every</label>
                                            <input
                                                type="number"
                                                min="1"
                                                required={isRecurring}
                                                value={frequencyDays}
                                                onChange={(e) => setFrequencyDays(e.target.value)}
                                                className="w-20 bg-slate-800 border border-slate-600 text-white rounded px-2 py-1 outline-none focus:border-primary-500 text-center"
                                            />
                                            <label className="text-sm text-slate-300">days</label>
                                        </div>
                                    )}
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                                    <textarea
                                        required
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        placeholder="Describe the work to be done..."
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <Button type="button" variant="secondary" onClick={() => setIsScheduleOpen(false)}>Cancel</Button>
                                    <Button type="submit">Schedule</Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Complete Modal ── */}
            <AnimatePresence>
                {isCompleteOpen && targetRecord && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-white">Mark as Completed</h2>
                                <button onClick={() => setIsCompleteOpen(false)}><X className="text-slate-400 hover:text-white" /></button>
                            </div>
                            <p className="text-sm text-slate-400 mb-4">
                                Completing maintenance for <span className="font-semibold text-white">{targetRecord.item?.name}</span>
                            </p>
                            <form onSubmit={handleComplete} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Technician Notes <span className="text-slate-500">(optional)</span></label>
                                    <textarea
                                        rows={3}
                                        value={completeNotes}
                                        onChange={e => setCompleteNotes(e.target.value)}
                                        placeholder="What was done, parts used, observations..."
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                    />
                                </div>
                                <div className="flex justify-end gap-3">
                                    <Button type="button" variant="secondary" onClick={() => setIsCompleteOpen(false)}>Cancel</Button>
                                    <Button type="submit" icon={CheckCircle2}>Confirm Complete</Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MaintenancePage;
