import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CheckOutManager from './features/CheckOutManager';
import MaintenanceTracker from './features/MaintenanceTracker';
import AuditLogViewer from './features/AuditLogViewer';
import ProjectManager from './features/ProjectManager';
import AnalyticsDashboard from './features/AnalyticsDashboard';

function EnhancedDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('inventory');
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const results = await Promise.allSettled([
        axios.get('/api/items'),
        axios.get('/api/locations'),
        axios.get('/api/categories'),
        axios.get('/api/suppliers'),
        axios.get('/api/analytics/low-stock-alerts'),
      ]);

      // Handle partial failures gracefully
      if (results[0].status === 'fulfilled') setItems(results[0].value.data);
      if (results[1].status === 'fulfilled') setLocations(results[1].value.data);
      if (results[2].status === 'fulfilled') setCategories(results[2].value.data);
      if (results[3].status === 'fulfilled') setSuppliers(results[3].value.data);
      if (results[4].status === 'fulfilled') setLowStockAlerts(results[4].value.data);

      // Log any failed requests
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.warn(`Failed to load data source ${index}:`, result.reason);
        }
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'inventory', label: 'Inventory', icon: '📦' },
    { id: 'checkout', label: 'Check-In/Out', icon: '📤' },
    { id: 'maintenance', label: 'Maintenance', icon: '🔧' },
    { id: 'projects', label: 'Projects', icon: '📋' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    ...(user.role === 'admin' || user.role === 'supervisor' ? [{ id: 'audit', label: 'Audit Log', icon: '📝' }] : []),
  ];

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="text-4xl">🏗️</div>
              <div>
                <h1 className="text-2xl font-bold text-white">Construction Inventory</h1>
                <p className="text-sm text-slate-400">Equipment Management System</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user.full_name || user.username}</p>
                <span className="inline-block px-3 py-1 mt-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                  {user.role.toUpperCase()}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="btn-danger"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Low Stock Alerts Banner */}
      {lowStockAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-red-900 to-red-800 border-b border-red-700 px-4 py-4 shadow-md">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚠️</span>
              <p className="text-red-100 font-medium">
                {lowStockAlerts.length} item(s) below minimum stock threshold
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-slate-800 border-b border-slate-700 sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-2 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-all ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-400 bg-slate-700/50'
                    : 'border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'
                  }`}
              >
                <span className="mr-2">{tab.icon}</span>{tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {activeTab === 'inventory' && (
          <InventoryTab items={items} locations={locations} categories={categories} suppliers={suppliers} user={user} onRefresh={loadData} />
        )}
        {activeTab === 'checkout' && <CheckOutManager user={user} locations={locations} onRefresh={loadData} />}
        {activeTab === 'maintenance' && <MaintenanceTracker user={user} items={items} onRefresh={loadData} />}
        {activeTab === 'projects' && <ProjectManager user={user} items={items} onRefresh={loadData} />}
        {activeTab === 'analytics' && <AnalyticsDashboard user={user} />}
        {activeTab === 'audit' && user.role !== 'worker' && <AuditLogViewer user={user} />}
      </main>
    </div>
  );
}

function InventoryTab({ items, locations, categories, suppliers, user, onRefresh }) {
  const [filterLocation, setFilterLocation] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const filteredItems = items.filter(item => {
    if (filterLocation && item.location?.name !== filterLocation) return false;
    if (filterStatus && item.status !== filterStatus) return false;
    if (filterCategory && item.category?.name !== filterCategory) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Filters */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4 text-white">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
            <select
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500"
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
            >
              <option value="">All Locations</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.name}>{loc.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
            <select
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
            <select
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="under_maintenance">Under Maintenance</option>
              <option value="retired">Retired</option>
              <option value="damaged">Damaged</option>
            </select>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700 bg-slate-800">
          <h3 className="text-lg font-semibold text-white">
            Inventory Items ({filteredItems.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800 border-b border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Condition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-white">{item.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{item.category?.name}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`font-semibold ${item.quantity < 10 ? 'text-red-400' : 'text-green-400'}`}>
                      {item.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">{item.location?.name}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`badge ${item.status === 'active' ? 'badge-success' :
                        item.status === 'under_maintenance' ? 'badge-warning' :
                          item.status === 'damaged' ? 'badge-danger' :
                            'badge-info'
                      }`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">{item.condition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default EnhancedDashboard;
