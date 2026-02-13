import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, X, Package } from 'lucide-react';
import { transactionService } from '../services/transactionService';
import { inventoryService } from '../services/inventoryService';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';

const CheckoutsPage = () => {
    const { hasPermission } = useAuth();
    const [checkouts, setCheckouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [locations, setLocations] = useState([]);
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [selectedCheckout, setSelectedCheckout] = useState(null);

    const [returnFormData, setReturnFormData] = useState({
        location_id: '',
        location_note: '',
        notes: ''
    });

    const [formData, setFormData] = useState({
        item_id: '',
        project_id: '',
        quantity: 1,
        expected_return_date: '',
        destination_location_id: '',
        location_note: '',
        notes: ''
    });

    useEffect(() => {
        fetchCheckouts();
        // Pre-fetch items and locations for the modal selector
        fetchDropdowns();
    }, []);

    const fetchCheckouts = async () => {
        setLoading(true);
        try {
            const data = await transactionService.getCheckouts();
            setCheckouts(data);
        } catch (error) {
            toast.error('Failed to load checkouts');
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdowns = async () => {
        try {
            const [itemsData, locationsData] = await Promise.all([
                inventoryService.getAllItems({ status: 'available' }),
                inventoryService.getLocations()
            ]);
            setItems(itemsData);
            setLocations(locationsData);
        } catch (error) {
            console.error('Failed to load dropdowns', error);
        }
    };

    const handleCheckout = async (e) => {
        e.preventDefault();
        try {
            await transactionService.checkoutItem(formData);
            toast.success('Item checked out successfully');
            setIsModalOpen(false);
            fetchCheckouts();
            setFormData({ item_id: '', project_id: '', quantity: 1, expected_return_date: '', destination_location_id: '', location_note: '', notes: '' });
        } catch (error) {
            toast.error(error.response?.data?.error || 'Checkout failed');
        }
    };

    const handleReturnClick = (checkout) => {
        setSelectedCheckout(checkout);
        setReturnFormData({
            location_id: checkout.Item?.location_id || '',
            location_note: '',
            notes: ''
        });
        setIsReturnModalOpen(true);
    };

    const handleReturnSubmit = async (e) => {
        e.preventDefault();
        try {
            await transactionService.checkinItem(selectedCheckout.id, returnFormData);
            toast.success('Item returned successfully');
            setIsReturnModalOpen(false);
            fetchCheckouts();
        } catch (error) {
            toast.error('Return failed');
        }
    };

    const filteredCheckouts = checkouts.filter(c =>
        c.Item?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.borrower?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Checkouts & Returns</h1>
                {hasPermission('transactions:checkout') && (
                    <Button onClick={() => setIsModalOpen(true)} icon={Plus}>
                        New Checkout
                    </Button>
                )}
            </div>

            <div className="glass p-4 rounded-xl">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by item or borrower..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700 text-white pl-10 pr-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
            </div>

            <div className="glass rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-700/50 bg-slate-800/30">
                                <th className="p-4 text-slate-400 font-medium">Item</th>
                                <th className="p-4 text-slate-400 font-medium">Borrower</th>
                                <th className="p-4 text-slate-400 font-medium">Date Out</th>
                                <th className="p-4 text-slate-400 font-medium">Status</th>
                                <th className="p-4 text-slate-400 font-medium text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCheckouts.map((checkout) => (
                                <tr key={checkout.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                                    <td className="p-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-slate-700 rounded-lg">
                                                <Package className="w-5 h-5 text-primary-400" />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{checkout.Item?.name}</p>
                                                <p className="text-xs text-slate-400">Qty: {checkout.quantity}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-300">{checkout.borrower?.full_name}</td>
                                    <td className="p-4 text-slate-400 text-sm">
                                        {new Date(checkout.checkout_date).toLocaleDateString()}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${checkout.status === 'active' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-green-500/10 text-green-500'
                                            }`}>
                                            {checkout.status === 'active' ? 'Checked Out' : 'Returned'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        {checkout.status === 'active' && hasPermission('transactions:checkin') && (
                                            <Button size="sm" variant="secondary" onClick={() => handleReturnClick(checkout)}>
                                                Return
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white">Checkout Item</h2>
                                <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-white" /></button>
                            </div>
                            <form onSubmit={handleCheckout} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Select Item</label>
                                    <select
                                        value={formData.item_id}
                                        onChange={e => setFormData({ ...formData, item_id: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500"
                                        required
                                    >
                                        <option value="">-- Choose Item --</option>
                                        {items.map(item => (
                                            <option key={item.id} value={item.id}>{item.name} (Qty: {item.quantity})</option>
                                        ))}
                                    </select>
                                </div>

                                <Input label="Quantity" type="number" min="1" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })} required />

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Destination Location</label>
                                    <select
                                        value={formData.destination_location_id}
                                        onChange={e => setFormData({ ...formData, destination_location_id: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="">-- Select Destination (Optional) --</option>
                                        {locations.map(loc => (
                                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <Input label="Expected Return Date" type="date" value={formData.expected_return_date} onChange={e => setFormData({ ...formData, expected_return_date: e.target.value })} />
                                <Input label="Notes / Project" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Project name or notes" />

                                <div className="flex justify-end gap-3 mt-6">
                                    <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                    <Button type="submit">Complete Checkout</Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Return Modal (Scenario 3) */}
            <AnimatePresence>
                {isReturnModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white">Return Item</h2>
                                <button onClick={() => setIsReturnModalOpen(false)}><X className="text-slate-400 hover:text-white" /></button>
                            </div>
                            <form onSubmit={handleReturnSubmit} className="space-y-4">
                                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 mb-4">
                                    <p className="text-sm text-slate-400">Returning:</p>
                                    <p className="text-lg font-bold text-white">{selectedCheckout?.Item?.name}</p>
                                    <p className="text-xs text-slate-500 mt-1">Checked out to: {selectedCheckout?.borrower?.full_name}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Confirm/Update Current Location</label>
                                    <select
                                        value={returnFormData.location_id}
                                        onChange={e => setReturnFormData({ ...returnFormData, location_id: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500"
                                        required
                                    >
                                        <option value="">-- Select Current Location --</option>
                                        {locations.map(loc => (
                                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <Input
                                    label="Location Notes"
                                    value={returnFormData.location_note}
                                    onChange={e => setReturnFormData({ ...returnFormData, location_note: e.target.value })}
                                    placeholder="Any notes about the item's condition or specific placement"
                                />

                                <Input
                                    label="General Notes"
                                    value={returnFormData.notes}
                                    onChange={e => setReturnFormData({ ...returnFormData, notes: e.target.value })}
                                    placeholder="General return notes"
                                />

                                <div className="flex justify-end gap-3 mt-6">
                                    <Button type="button" variant="secondary" onClick={() => setIsReturnModalOpen(false)}>Cancel</Button>
                                    <Button type="submit">Complete Return</Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CheckoutsPage;
