import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, X, MapPin, Package } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import { userService } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';
import { Users, AlertTriangle } from 'lucide-react';

const LocationsPage = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const isSupervisor = user?.role === 'supervisor' || isAdmin;
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentLocation, setCurrentLocation] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        type: 'warehouse',
        address: '',
        capacity: 0,
        is_active: true
    });
    const [foremen, setForemen] = useState([]);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedLocationForForeman, setSelectedLocationForForeman] = useState(null);
    const [selectedForemanId, setSelectedForemanId] = useState('');

    useEffect(() => {
        fetchLocations();
        if (isAdmin) {
            fetchForemen();
        }
    }, [isAdmin]);

    const fetchForemen = async () => {
        try {
            const allUsers = await userService.getAllUsers();
            setForemen(allUsers.filter(u => u.role === 'foreman'));
        } catch (error) {
            console.error('Failed to fetch foremen:', error);
        }
    };

    const fetchLocations = async () => {
        try {
            setLoading(true);
            const data = await inventoryService.getLocations();
            setLocations(data);
        } catch (error) {
            toast.error('Failed to load locations');
        } finally {
            setLoading(false);
        }
    };



    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (currentLocation) {
                await inventoryService.updateLocation(currentLocation.id, formData);
                toast.success('Location updated');
            } else {
                await inventoryService.createLocation(formData);
                toast.success('Location created');
            }
            setIsModalOpen(false);
            fetchLocations();
            resetForm();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this location? This will fail if items are at this location.')) return;
        try {
            await inventoryService.deleteLocation(id);
            toast.success('Location deleted');
            fetchLocations();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Delete failed');
        }
    };

    const handleAssignForeman = async (e) => {
        e.preventDefault();
        try {
            if (!selectedForemanId) return;
            await inventoryService.assignForeman(selectedLocationForForeman.id, selectedForemanId);
            toast.success('Foreman assigned');
            setIsAssignModalOpen(false);
            setSelectedForemanId('');
            fetchLocations();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Assignment failed');
        }
    };

    const handleUnassignForeman = async (locationId, userId) => {
        try {
            await inventoryService.unassignForeman(locationId, userId);
            toast.success('Foreman unassigned');
            fetchLocations();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Unassignment failed');
        }
    };

    const resetForm = () => {
        setCurrentLocation(null);
        setFormData({
            name: '',
            type: 'warehouse',
            address: '',
            capacity: 0,
            is_active: true
        });
    };

    const filteredLocations = locations.filter(loc =>
        loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loc.type?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isSupervisor) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-400">You don't have permission to manage locations.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Location Management</h1>
                <Button onClick={() => { resetForm(); setIsModalOpen(true); }} icon={Plus}>
                    Add Location
                </Button>
            </div>

            <div className="glass p-4 rounded-xl flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search locations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700 text-white pl-10 pr-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLocations.map((location, idx) => (
                    <motion.div key={location.id || location._id || idx} layout className="glass p-6 rounded-xl relative group bg-slate-800/95">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-slate-800 rounded-lg">
                                <MapPin className="w-6 h-6 text-primary-400" />
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${location.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                    }`}>
                                    {location.is_active ? 'Active' : 'Inactive'}
                                </span>
                                {location.item_count !== undefined && (
                                    <span className="flex items-center gap-1 text-xs text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                                        <Package className="w-3 h-3" />
                                        {location.item_count} items
                                    </span>
                                )}
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-white mb-1">{location.name}</h3>
                        <p className="text-sm text-slate-100 mb-4 capitalize">{location.type}</p>

                        {location.address && (
                            <p className="text-sm text-slate-100 mb-2">{location.address}</p>
                        )}

                        {location.capacity > 0 && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-slate-100">
                                    <span>Occupancy</span>
                                    <span className="font-semibold text-white">{location.current_occupancy || 0} / {location.capacity}</span>
                                </div>
                                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className={`h-full ${location.occupancy_percentage > 90 ? 'bg-red-500' : location.occupancy_percentage > 70 ? 'bg-yellow-500' : 'bg-primary-500'}`}
                                        style={{ width: `${Math.min(location.occupancy_percentage || 0, 100)}%` }}
                                    ></div>
                                </div>
                                {location.occupancy_percentage > 100 && (
                                    <p className="text-[10px] text-red-400 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" /> Over capacity
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-slate-700/50">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-xs font-semibold text-slate-100 flex items-center gap-1">
                                    <Users className="w-3 h-3" /> Foremen
                                </h4>
                                {isAdmin && (
                                    <button
                                        onClick={() => { setSelectedLocationForForeman(location); setIsAssignModalOpen(true); }}
                                        className="text-[10px] text-primary-400 hover:text-primary-300 transition-colors"
                                    >
                                        + Assign
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {location.foremen?.length > 0 ? (
                                    location.foremen.map((foreman, idx) => (
                                        <div key={foreman.id || foreman._id || idx} className="flex items-center gap-1 px-2 py-0.5 bg-slate-800/80 border border-slate-700 rounded text-[10px] text-slate-300">
                                            {foreman.full_name || foreman.username}
                                            {isAdmin && (
                                                <button
                                                    onClick={() => handleUnassignForeman(location.id || location._id, foreman.id || foreman._id)}
                                                    className="hover:text-red-400 transition-colors"
                                                >
                                                    <X className="w-2.5 h-2.5" />
                                                </button>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <span className="text-[10px] text-slate-500 italic">No foremen assigned</span>
                                )}
                            </div>
                        </div>

                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <button onClick={() => {
                                setCurrentLocation(location);
                                setFormData({
                                    name: location.name,
                                    type: location.type || 'warehouse',
                                    address: location.address || '',
                                    capacity: location.capacity || 0,
                                    is_active: location.is_active
                                });
                                setIsModalOpen(true);
                            }} className="p-2 bg-slate-700 rounded hover:bg-slate-600 text-white">
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(location.id)} className="p-2 bg-red-500/80 rounded hover:bg-red-600 text-white">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white">{currentLocation ? 'Edit Location' : 'Add Location'}</h2>
                                <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-white" /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <Input label="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="warehouse">Warehouse</option>
                                        <option value="site">Site</option>
                                        <option value="office">Office</option>
                                        <option value="vehicle">Vehicle</option>
                                    </select>
                                </div>

                                <Input label="Address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                                <Input label="Capacity" type="number" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })} />

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={formData.is_active}
                                        onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="w-4 h-4 rounded bg-slate-800 border-slate-700"
                                    />
                                    <label htmlFor="is_active" className="text-sm text-slate-300">Active</label>
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
                {isAssignModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white">Assign Foreman to {selectedLocationForForeman?.name}</h2>
                                <button onClick={() => setIsAssignModalOpen(false)}><X className="text-slate-400 hover:text-white" /></button>
                            </div>
                            <form onSubmit={handleAssignForeman} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Select Foreman</label>
                                    <select
                                        value={selectedForemanId}
                                        onChange={e => setSelectedForemanId(e.target.value)}
                                        required
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="">Choose a foreman...</option>
                                        {foremen
                                            .filter(f => !selectedLocationForForeman?.foremen?.some(existing => existing.id === f.id))
                                            .map((f, idx) => (
                                                <option key={f.id || f._id || idx} value={f.id || f._id}>{f.full_name} ({f.username})</option>
                                            ))}
                                    </select>
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <Button type="button" variant="secondary" onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
                                    <Button type="submit">Assign</Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LocationsPage;
