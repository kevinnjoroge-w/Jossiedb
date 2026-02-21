import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Package, Edit2, Trash2, X, MapPin } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import { transferService } from '../services/transferService';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';
import { ArrowRightLeft } from 'lucide-react';

const InventoryPage = () => {
    const { hasPermission } = useAuth();
    const [items, setItems] = useState([]);
    const [locations, setLocations] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        description: '',
        quantity: 0,
        min_quantity: 5,
        category_id: '',
        location_id: '',
        status: 'available'
    });
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [transferFormData, setTransferFormData] = useState({
        item_id: '',
        from_location_id: '',
        to_location_id: '',
        quantity: 1,
        reason: ''
    });

    const [isLocUpdateModalOpen, setIsLocUpdateModalOpen] = useState(false);
    const [locUpdateFormData, setLocUpdateFormData] = useState({
        item_id: '',
        location_id: '',
        notes: ''
    });

    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [history, setHistory] = useState([]);
    const [historyItem, setHistoryItem] = useState(null);

    useEffect(() => {
        fetchItems();
        fetchLocations();
    }, []);

    const fetchItems = async () => {
        try {
            const data = await inventoryService.getAllItems();
            setItems(data);
        } catch (error) {
            toast.error('Failed to load inventory');
        }
    };

    const fetchLocations = async () => {
        try {
            const data = await inventoryService.getLocations();
            setLocations(data);
        } catch (error) {
            console.error('Failed to load locations', error);
        }
    };



    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (currentItem) {
                await inventoryService.updateItem(currentItem.id, formData);
                toast.success('Item updated');
            } else {
                await inventoryService.createItem(formData);
                toast.success('Item created');
            }
            setIsModalOpen(false);
            fetchItems();
            fetchLocations(); // Refresh datalist suggestions
            resetForm();
        } catch (error) {
            toast.error('Operation failed');
        }
    };

    const handleTransferRequest = async (e) => {
        e.preventDefault();
        try {
            await transferService.createTransferRequest(transferFormData);
            toast.success('Transfer request submitted');
            setIsTransferModalOpen(false);
            setTransferFormData({
                item_id: '',
                from_location_id: '',
                to_location_id: '',
                quantity: 1,
                reason: ''
            });
        } catch (error) {
            toast.error('Transfer request failed');
        }
    };

    const handleLocationUpdate = async (e) => {
        e.preventDefault();
        try {
            await inventoryService.updateItemLocation(locUpdateFormData.item_id, {
                location_id: locUpdateFormData.location_id,
                notes: locUpdateFormData.notes
            });
            toast.success('Location updated');
            setIsLocUpdateModalOpen(false);
            fetchItems();
        } catch (error) {
            toast.error('Update failed');
        }
    };

    const viewHistory = async (item) => {
        try {
            const data = await inventoryService.getLocationHistory(item.id);
            setHistory(data);
            setHistoryItem(item);
            setIsHistoryModalOpen(true);
        } catch (error) {
            toast.error('Failed to load history');
        }
    };

    const resetForm = () => {
        setCurrentItem(null);
        setFormData({
            name: '', sku: '', description: '', quantity: 0, min_quantity: 5, location_name: '', status: 'available'
        });
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.Location?.name && item.Location.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Inventory</h1>
                {hasPermission('inventory:create') && (
                    <Button onClick={() => { resetForm(); setIsModalOpen(true); }} icon={Plus}>
                        Add Item
                    </Button>
                )}
            </div>

            <div className="glass p-4 rounded-xl flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search items, SKU, or locations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700 text-white pl-10 pr-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item, idx) => (
                    <motion.div key={item.id || item._id || idx} layout className="glass p-6 rounded-xl relative group bg-slate-800/95">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-slate-800 rounded-lg">
                                <Package className="w-6 h-6 text-primary-400" />
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${item.quantity <= item.min_quantity ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
                                    }`}>
                                    {item.quantity} in stock
                                </span>
                                {item.Location && (
                                    <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                                        <MapPin className="w-3 h-3 text-primary-500" />
                                        {item.Location.name}
                                    </span>
                                )}
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-white mb-1">{item.name}</h3>
                        <p className="text-sm text-slate-100 mb-4">{item.sku}</p>

                        <div className="space-y-2 text-sm text-slate-100">
                            <div className="justify-between flex">
                                <span>Status</span>
                                <span className="capitalize font-semibold text-white">{item.status.replace('_', ' ')}</span>
                            </div>
                        </div>

                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <button onClick={() => {
                                setTransferFormData({
                                    item_id: item.id,
                                    from_location_id: item.location_id,
                                    to_location_id: '',
                                    quantity: 1,
                                    reason: ''
                                });
                                setIsTransferModalOpen(true);
                            }} title="Request Transfer" className="p-2 bg-slate-700 rounded hover:bg-slate-600 text-white">
                                <ArrowRightLeft className="w-4 h-4" />
                            </button>
                            {hasPermission('inventory:update_location') && (
                                <button onClick={() => {
                                    setLocUpdateFormData({
                                        item_id: item.id,
                                        location_id: item.location_id || '',
                                        notes: ''
                                    });
                                    setIsLocUpdateModalOpen(true);
                                }} title="Update Location" className="p-2 bg-primary-600 rounded hover:bg-primary-500 text-white">
                                    <MapPin className="w-4 h-4" />
                                </button>
                            )}
                            {hasPermission('inventory:view_history') && (
                                <button onClick={() => viewHistory(item)} title="View History" className="p-2 bg-slate-700 rounded hover:bg-slate-600 text-white text-xs">
                                    H
                                </button>
                            )}
                            {hasPermission('inventory:edit') && (
                                <button onClick={() => {
                                    setCurrentItem(item);
                                    setFormData({
                                        ...item,
                                        location_name: item.Location?.name || ''
                                    });
                                    setIsModalOpen(true);
                                }} className="p-2 bg-slate-700 rounded hover:bg-slate-600 text-white">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            )}
                            {hasPermission('inventory:delete') && (
                                <button onClick={async () => {
                                    if (window.confirm('Delete item?')) {
                                        try {
                                            await inventoryService.deleteItem(item.id);
                                            toast.success('Item deleted');
                                            fetchItems();
                                        } catch (error) {
                                            toast.error('Delete failed');
                                        }
                                    }
                                }} className="p-2 bg-red-500/80 rounded hover:bg-red-600 text-white">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white">{currentItem ? 'Edit Item' : 'Add Item'}</h2>
                                <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-white" /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <Input label="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                                <Input label="SKU" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} />

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Location / Site</label>
                                        <input
                                            type="text"
                                            list="location-list"
                                            placeholder="Type or select site..."
                                            value={formData.location_name || ''}
                                            onChange={e => setFormData({ ...formData, location_name: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                        <datalist id="location-list">
                                            {locations.map((loc, idx) => (
                                                <option key={loc.id || loc._id || idx} value={loc.name} />
                                            ))}
                                        </datalist>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input label="Quantity" type="number" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })} />
                                        <Input label="Min Qty" type="number" value={formData.min_quantity} onChange={e => setFormData({ ...formData, min_quantity: parseInt(e.target.value) || 0 })} />
                                    </div>
                                </div>



                                <div className="flex justify-end gap-3 mt-6">
                                    <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                    <Button type="submit">Save</Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isTransferModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white">Request Equipment Transfer</h2>
                                <button onClick={() => setIsTransferModalOpen(false)}><X className="text-slate-400 hover:text-white" /></button>
                            </div>
                            <form onSubmit={handleTransferRequest} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Destination Location</label>
                                    <select
                                        value={transferFormData.to_location_id}
                                        onChange={e => setTransferFormData({ ...transferFormData, to_location_id: e.target.value })}
                                        required
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="">Select destination...</option>
                                        {locations
                                            .filter(loc => loc.id !== transferFormData.from_location_id)
                                            .map((loc, idx) => (
                                                <option key={loc.id || loc._id || idx} value={loc.id}>{loc.name}</option>
                                            ))}
                                    </select>
                                </div>

                                <Input
                                    label="Quantity"
                                    type="number"
                                    value={transferFormData.quantity}
                                    onChange={e => setTransferFormData({ ...transferFormData, quantity: parseInt(e.target.value) || 1 })}
                                    required
                                />

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Reason for Transfer</label>
                                    <textarea
                                        value={transferFormData.reason}
                                        onChange={e => setTransferFormData({ ...transferFormData, reason: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500 h-24"
                                        placeholder="Explain why this transfer is needed..."
                                        required
                                    ></textarea>
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <Button type="button" variant="secondary" onClick={() => setIsTransferModalOpen(false)}>Cancel</Button>
                                    <Button type="submit">Submit Request</Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Manual Location Update Modal (Scenario 1) */}
            <AnimatePresence>
                {isLocUpdateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white">Update Location</h2>
                                <button onClick={() => setIsLocUpdateModalOpen(false)}><X className="text-slate-400 hover:text-white" /></button>
                            </div>
                            <form onSubmit={handleLocationUpdate} className="space-y-4">
                                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                                    <p className="text-sm text-slate-400 font-medium">Item: {items.find(i => i.id === locUpdateFormData.item_id)?.name}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">New Location</label>
                                    <select
                                        value={locUpdateFormData.location_id}
                                        onChange={e => setLocUpdateFormData({ ...locUpdateFormData, location_id: e.target.value })}
                                        required
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="">Select location...</option>
                                        {locations.map((loc, idx) => (
                                            <option key={loc.id || loc._id || idx} value={loc.id}>{loc.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Change Notes</label>
                                    <textarea
                                        value={locUpdateFormData.notes}
                                        onChange={e => setLocUpdateFormData({ ...locUpdateFormData, notes: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500 h-24"
                                        placeholder="Reason for manual location update..."
                                        required
                                    ></textarea>
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <Button type="button" variant="secondary" onClick={() => setIsLocUpdateModalOpen(false)}>Cancel</Button>
                                    <Button type="submit">Update Location</Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Location History Modal */}
            <AnimatePresence>
                {isHistoryModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl p-6 max-h-[80vh] overflow-hidden flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Location History</h2>
                                    <p className="text-sm text-slate-400">{historyItem?.name}</p>
                                </div>
                                <button onClick={() => setIsHistoryModalOpen(false)}><X className="text-slate-400 hover:text-white" /></button>
                            </div>

                            <div className="overflow-y-auto pr-2 space-y-4">
                                {history.length === 0 ? (
                                    <p className="text-center py-8 text-slate-500 italic">No movement history recorded yet.</p>
                                ) : (
                                    history.map((entry, idx) => (
                                        <div key={entry.id || entry._id || idx} className="relative pl-8 pb-6 border-l border-slate-700 last:pb-0">
                                            <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-slate-400 tabular-nums">{new Date(entry.changed_at).toLocaleString()}</span>
                                                    <span className={`text-[10px] uppercase font-black px-1.5 py-0.5 rounded ${entry.change_type === 'checkout' ? 'bg-blue-500/20 text-blue-400' :
                                                        entry.change_type === 'checkin' ? 'bg-green-500/20 text-green-400' :
                                                            'bg-purple-500/20 text-purple-400'
                                                        }`}>
                                                        {entry.change_type}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-white">
                                                    <span className="font-medium">{entry.from_location?.name || 'Unknown'}</span>
                                                    <ArrowRightLeft className="w-3 h-3 text-slate-500" />
                                                    <span className="font-bold text-primary-400">{entry.to_location?.name || 'Unknown'}</span>
                                                </div>
                                                {entry.notes && <p className="text-sm text-slate-400 mt-1 italic">"{entry.notes}"</p>}
                                                <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                                    Changed by: <span className="text-slate-300">{entry.changer?.full_name || 'System'}</span>
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InventoryPage;
