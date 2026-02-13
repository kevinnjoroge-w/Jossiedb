import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { transferService } from '../services/transferService';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';
import { ArrowRightLeft, Clock, CheckCircle, XCircle, Package, MapPin, User as UserIcon } from 'lucide-react';

const TransferRequestsPage = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const data = await transferService.getTransferRequests();
            setRequests(data);
        } catch (error) {
            toast.error('Failed to load transfer requests');
        } finally {
            setLoading(false);
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

    const filteredRequests = requests.filter(req => req.status === filter || filter === 'all');

    const isAdmin = user?.role === 'admin';
    const isSupervisor = user?.role === 'supervisor';
    const canApprove = isAdmin || isSupervisor;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Transfer Requests</h1>
                <div className="flex gap-2 bg-slate-800/50 p-1 rounded-lg border border-slate-700">
                    {['pending', 'approved', 'completed', 'rejected', 'all'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${filter === s ? 'bg-primary-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
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
                    <h3 className="text-lg font-medium text-white mb-1">No requests found</h3>
                    <p className="text-slate-400">There are no transfer requests with status "{filter}"</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredRequests.map((req) => (
                        <motion.div
                            key={req.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass p-6 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all group"
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
                                            <span>{req.FromLocation?.name}</span>
                                        </div>
                                        <ArrowRightLeft className="w-4 h-4 text-primary-500" />
                                        <div className="flex items-center gap-2 text-slate-300">
                                            <MapPin className="w-4 h-4 text-slate-500" />
                                            <span>{req.ToLocation?.name}</span>
                                        </div>
                                    </div>

                                    <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                        <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Reason</p>
                                        <p className="text-sm text-slate-300">{req.reason}</p>
                                    </div>

                                    {req.status === 'rejected' && req.rejection_reason && (
                                        <div className="p-3 bg-red-500/5 rounded-lg border border-red-500/20">
                                            <p className="text-xs text-red-400 uppercase font-semibold mb-1">Rejection Reason</p>
                                            <p className="text-sm text-red-300">{req.rejection_reason}</p>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <UserIcon className="w-3 h-3" />
                                        <span>Requested by: {req.Requester?.full_name || req.Requester?.username}</span>
                                        {req.Approver && (
                                            <span className="flex items-center gap-2 ml-4">
                                                <CheckCircle className="w-3 h-3 text-green-500" />
                                                Approved by: {req.Approver?.full_name || req.Approver?.username}
                                            </span>
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
        </div>
    );
};

export default TransferRequestsPage;
