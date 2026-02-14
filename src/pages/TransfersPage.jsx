import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, X, Package, MapPin, Clock, CheckCircle, XCircle, User as UserIcon, ArrowRightLeft } from 'lucide-react';
import { transferService } from '../services/transferService';
import { inventoryService } from '../services/inventoryService';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';

const TransfersPage = () => {
    const { isAdmin, isSupervisor } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('pending');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [locations, setLocations] = useState([]);

    const [formData, setFormData] = useState({
        item_id: '',
        from_location_id: '',
        to_location_id: '',
        quantity: 1,
        reason: '',
        notes: ''
    });

    const socket = useSocket();

    useEffect(() => {
        fetchRequests();
        fetchDropdowns();
    }, []);

    useEffect(() => {
        if (socket) {
            const handleUpdate = () => {
                fetchRequests();
            };
            socket.on('TRANSFER_UPDATED', handleUpdate);
            return () => socket.off('TRANSFER_UPDATED', handleUpdate);
        }
    }, [socket]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const data = await transferService.getTransferRequests();
            setRequests(data);
        } catch (error) {
            toast.error('Failed to load transfers');
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdowns = async () => {
        try {
            const [itemsData, locationsData] = await Promise.all([
                inventoryService.getAllItems(),
                inventoryService.getLocations()
            ]);
            setItems(itemsData);
            setLocations(locationsData);
        } catch (error) {
            console.error('Failed to load dropdowns', error);
        }
    };

    const handleCreateRequest = async (e) => {
        e.preventDefault();
        try {
            await transferService.createTransferRequest(formData);
            toast.success('Transfer request submitted');
            setIsModalOpen(false);
            fetchRequests();
            setFormData({ item_id: '', from_location_id: '', to_location_id: '', quantity: 1, reason: '', notes: '' });
        } catch (error) {
            toast.error(error.response?.data?.error || 'Request failed');
        }
    };

    const handleApprove = async (id) => {
        try {
            await transferService.approveTransfer(id);
            toast.success('Transfer approved');
            fetchRequests();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Approval failed');
        }
    };

    const handleReject = async (id) => {
        const reason = window.prompt('Reason for rejection:');
        if (reason === null) return;
        try {
            await transferService.rejectTransfer(id, reason);
            toast.success('Transfer rejected');
            fetchRequests();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Rejection failed');
        }
    };

    const handleComplete = async (id) => {
        try {
            await transferService.completeTransfer(id);
            toast.success('Transfer completed');
            fetchRequests();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Completion failed');
        }
    };

    const filteredRequests = requests.filter(req => {
        const matchesFilter = filter === 'all' || req.status === filter;
        const itemName = req.Item?.name || '';
        const matchesSearch = itemName.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const canApprove = isAdmin() || isSupervisor();

    const handleItemChange = (itemId) => {
        const selectedItem = items.find(i => i.id === itemId);
        setFormData({
            ...formData,
            item_id: itemId,
            from_location_id: selectedItem?.location_id || ''
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Location Transfers</h1>
                <Button onClick={() => setIsModalOpen(true)} icon={Plus}>
                    New Transfer Request
                </Button>
            </div>

            <div className="glass p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by item name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700 text-white pl-10 pr-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
                <div className="flex gap-2 bg-slate-800/50 p-1 rounded-lg border border-slate-700 overflow-x-auto w-full md:w-auto">
                    {['pending', 'approved', 'completed', 'rejected', 'all'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${filter === s ? 'bg-primary-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
            ) : filteredRequests.length === 0 ? (
                <div className="glass p-12 text-center rounded-2xl">
                    <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-1">No transfers found</h3>
                    <p className="text-slate-400">There are no transfer requests matching your criteria</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredRequests.map((req) => (
                        <motion.div
                            key={req.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass p-6 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all"
                        >
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary-500/10 rounded-lg text-primary-400">
                                                <Package className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white leading-none mb-1">
                                                    {req.Item?.name}
                                                    <span className="ml-2 text-sm text-slate-400 font-normal">({req.quantity} units)</span>
                                                </h3>
                                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> Requested {new Date(req.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${req.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                                            req.status === 'approved' ? 'bg-blue-500/10 text-blue-500' :
                                                req.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                                                    'bg-red-500/10 text-red-500'
                                            }`}>
                                            {req.status}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-2 text-slate-300">
                                            <MapPin className="w-4 h-4 text-slate-500" />
                                            <span className="text-xs text-slate-500 uppercase font-semibold">From:</span>
                                            <span>{req.from_location?.name}</span>
                                        </div>
                                        <ArrowRightLeft className="w-4 h-4 text-primary-500" />
                                        <div className="flex items-center gap-2 text-slate-300">
                                            <MapPin className="w-4 h-4 text-slate-500" />
                                            <span className="text-xs text-slate-500 uppercase font-semibold">To:</span>
                                            <span>{req.to_location?.name}</span>
                                        </div>
                                    </div>

                                    {(req.reason || req.notes) && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {req.reason && (
                                                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                                    <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Reason</p>
                                                    <p className="text-sm text-slate-300">{req.reason}</p>
                                                </div>
                                            )}
                                            {req.notes && (
                                                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                                    <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Internal Notes</p>
                                                    <p className="text-sm text-slate-300">{req.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4 text-xs text-slate-400">
                                        <div className="flex items-center gap-1">
                                            <UserIcon className="w-3 h-3" />
                                            <span>Requested by: {req.requester?.full_name || req.requester?.username}</span>
                                        </div>
                                        {req.approver && (
                                            <div className="flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3 text-green-500" />
                                                <span>Approved by: {req.approver?.full_name || req.approver?.username}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex md:flex-col justify-end gap-2 shrink-0">
                                    {req.status === 'pending' && canApprove && (
                                        <>
                                            <Button size="sm" onClick={() => handleApprove(req.id)} icon={CheckCircle}>Approve</Button>
                                            <Button size="sm" variant="secondary" onClick={() => handleReject(req.id)} icon={XCircle}>Reject</Button>
                                        </>
                                    )}
                                    {req.status === 'approved' && (
                                        <Button size="sm" onClick={() => handleComplete(req.id)} icon={Package}>Complete Transfer</Button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white">Request Item Transfer</h2>
                                <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-white transition-colors" /></button>
                            </div>
                            <form onSubmit={handleCreateRequest} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Select Item</label>
                                    <select
                                        value={formData.item_id}
                                        onChange={e => handleItemChange(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                        required
                                    >
                                        <option value="">-- Choose Item --</option>
                                        {items.map(item => (
                                            <option key={item.id} value={item.id}>{item.name} (Qty: {item.quantity})</option>
                                        ))}
                                    </select>
                                </div>

                                {formData.from_location_id && (
                                    <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                        <p className="text-xs text-slate-400 uppercase font-semibold">Current Location</p>
                                        <p className="text-white font-medium">{locations.find(l => l.id === formData.from_location_id)?.name}</p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Destination Location</label>
                                    <select
                                        value={formData.to_location_id}
                                        onChange={e => setFormData({ ...formData, to_location_id: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                        required
                                    >
                                        <option value="">-- Select Destination --</option>
                                        {locations.map(loc => (
                                            <option key={loc.id} value={loc.id} disabled={loc.id === formData.from_location_id}>{loc.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <Input
                                    label="Quantity"
                                    type="number"
                                    min="1"
                                    value={formData.quantity}
                                    onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                                    required
                                />

                                <Input
                                    label="Reason for Transfer"
                                    value={formData.reason}
                                    onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                    placeholder="Brief explanation"
                                    required
                                />

                                <div className="flex justify-end gap-3 mt-6">
                                    <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                    <Button type="submit">Submit Request</Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TransfersPage;
