import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, AlertTriangle, Package, Edit2, Trash2, X, MapPin } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';

const InventoryPage = () => {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        description: '',
        quantity: 0,
        min_quantity: 5,
        unit_cost: 0,
        category_id: '',
        location_id: '',
        status: 'available'
    });

    useEffect(() => {
        fetchItems();
        fetchLocations();
    }, []);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const data = await inventoryService.getAllItems();
            setItems(data);
        } catch (error) {
            toast.error('Failed to load inventory');
        } finally {
            setLoading(false);
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

    const isAdmin = user?.role === 'admin';

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

    const resetForm = () => {
        setCurrentItem(null);
        setFormData({
            name: '', sku: '', description: '', quantity: 0, min_quantity: 5, unit_cost: 0, location_name: '', status: 'available'
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
                {isAdmin && (
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
                {filteredItems.map(item => (
                    <motion.div key={item.id} layout className="glass p-6 rounded-xl relative group">
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
                                    <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-slate-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                                        <MapPin className="w-3 h-3 text-primary-500" />
                                        {item.Location.name}
                                    </span>
                                )}
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-white mb-1">{item.name}</h3>
                        <p className="text-sm text-slate-400 mb-4">{item.sku}</p>

                        <div className="space-y-2 text-sm text-slate-300">
                            <div className="flex justify-between">
                                <span>Status</span>
                                <span className="capitalize">{item.status.replace('_', ' ')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Value</span>
                                <span>${item.unit_cost}</span>
                            </div>
                        </div>

                        {isAdmin && (
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
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
                                <button onClick={() => { if (window.confirm('Delete item?')) { inventoryService.deleteItem(item.id); window.location.reload(); } }} className="p-2 bg-red-500/80 rounded hover:bg-red-600 text-white">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
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
                                            {locations.map(loc => (
                                                <option key={loc.id} value={loc.name} />
                                            ))}
                                        </datalist>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input label="Quantity" type="number" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) })} />
                                        <Input label="Min Qty" type="number" value={formData.min_quantity} onChange={e => setFormData({ ...formData, min_quantity: parseInt(e.target.value) })} />
                                    </div>
                                </div>

                                <Input label="Unit Cost" type="number" value={formData.unit_cost} onChange={e => setFormData({ ...formData, unit_cost: parseFloat(e.target.value) })} />

                                <div className="flex justify-end gap-3 mt-6">
                                    <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                    <Button type="submit">Save</Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InventoryPage;
