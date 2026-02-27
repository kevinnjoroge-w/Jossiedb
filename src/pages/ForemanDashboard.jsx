import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, ArrowRightLeft, Search, Building2, AlertTriangle, Plus, CheckCircle2, X, Clock } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import { transferService } from '../services/transferService';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

const ForemanDashboard = () => {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchForemanData = async () => {
            try {
                const [invData, transData] = await Promise.all([
                    inventoryService.getAllItems(),
                    transferService.getAllTransfers()
                ]);

                // Group inventory by name for the foreman view
                const grouped = Object.values(invData.reduce((acc, item) => {
                    if (!acc[item.name]) {
                        acc[item.name] = { ...item, total_quantity: 0 };
                    }
                    acc[item.name].total_quantity += item.quantity || 0;
                    return acc;
                }, {}));

                setItems(grouped);

                // Filter transfers relevant to this foreman
                setTransfers(transData.filter(t =>
                    t.requested_by?._id === user?.id || t.requested_by?.id === user?.id || t.status === 'pending'
                ).slice(0, 5)); // Just show recent 5

            } catch (error) {
                toast.error('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchForemanData();
    }, [user?.id]);

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(search.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20 md:pb-6">
            <div className="glass p-6 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-primary-500/20 rounded-xl">
                        <Building2 className="w-6 h-6 text-primary-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Foreman Dashboard</h1>
                        <p className="text-slate-400 text-sm">Welcome back, {user?.full_name}</p>
                    </div>
                </div>
            </div>

            <div className="glass p-4 rounded-xl flex items-center gap-3">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                    type="text"
                    placeholder="Search site inventory..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-transparent text-white outline-none placeholder:text-slate-500"
                />
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Package className="w-5 h-5 text-slate-400" /> My Site Inventory
                    </h2>
                </div>

                {filteredItems.length === 0 ? (
                    <div className="text-center py-10 glass rounded-xl border border-slate-800">
                        <Package className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400 font-medium">No items found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {filteredItems.slice(0, 10).map(item => (
                            <div key={item._id || item.id} className="glass p-4 rounded-xl flex justify-between items-center border border-slate-700/50">
                                <div>
                                    <h3 className="font-bold text-white">{item.name}</h3>
                                    {item.sku && <p className="text-[10px] text-slate-500 font-mono mt-0.5">{item.sku}</p>}
                                </div>
                                <div className="text-right">
                                    <p className={`text-xl font-black ${item.total_quantity <= item.min_quantity ? 'text-red-400' : 'text-primary-400'}`}>
                                        {item.total_quantity}
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Qty</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex justify-between items-center px-1">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <ArrowRightLeft className="w-5 h-5 text-slate-400" /> Recent Transfers
                    </h2>
                </div>

                {transfers.length === 0 ? (
                    <div className="text-center py-8 text-sm text-slate-500 glass rounded-xl border border-slate-800">
                        No recent transfers
                    </div>
                ) : (
                    <div className="space-y-3">
                        {transfers.map(transfer => (
                            <div key={transfer._id} className="glass p-4 rounded-xl flex justify-between items-center border border-slate-700/50">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${transfer.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                                        transfer.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                                            'bg-yellow-500/10 text-yellow-400'
                                        }`}>
                                        {transfer.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> :
                                            transfer.status === 'rejected' ? <X className="w-4 h-4" /> :
                                                <Clock className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white line-clamp-1">{transfer.item_id?.name || 'Item'}</p>
                                        <p className="text-[11px] text-slate-400 uppercase font-semibold">Qty: {transfer.quantity}</p>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end gap-1">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider border ${transfer.status === 'completed' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                        transfer.status === 'rejected' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                            'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                        }`}>
                                        {transfer.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForemanDashboard;
