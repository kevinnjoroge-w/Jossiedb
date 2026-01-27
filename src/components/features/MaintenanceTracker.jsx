import React, { useState, useEffect } from 'react';
import axios from 'axios';

function MaintenanceTracker({ user, items, onRefresh }) {
  const [maintenance, setMaintenance] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState(null);

  useEffect(() => {
    loadMaintenance();
  }, []);

  const loadMaintenance = async () => {
    try {
      const res = await axios.get('/api/maintenance');
      setMaintenance(res.data);
    } catch (error) {
      console.error('Error loading maintenance:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeMaintenance = async (id, notes, cost) => {
    setCompletingId(id);
    try {
      await axios.put(`/api/maintenance/${id}/complete`, { notes, cost });
      alert('Maintenance marked as complete');
      loadMaintenance();
      onRefresh();
    } catch (error) {
      console.error('Error completing maintenance:', error);
    } finally {
      setCompletingId(null);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-96">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-slate-400">Loading maintenance records...</p>
    </div>
  </div>;

  const activeMaintenance = maintenance.filter(m => m.status !== 'completed' && m.status !== 'cancelled');
  const completedMaintenance = maintenance.filter(m => m.status === 'completed');

  const getStatusColor = (status) => {
    switch(status) {
      case 'scheduled': return 'badge-warning';
      case 'in_progress': return 'badge-info';
      case 'completed': return 'badge-success';
      default: return 'badge-primary';
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'preventive': return '🔧';
      case 'corrective': return '🔨';
      case 'inspection': return '🔍';
      default: return '⚙️';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Maintenance Tracking</h2>
          <p className="text-slate-400 text-sm mt-1">Schedule and track equipment maintenance</p>
        </div>
        {user.role === 'admin' && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary"
          >
            {showForm ? '✕ Cancel' : '➕ Schedule'}
          </button>
        )}
      </div>

      {/* Maintenance Form */}
      {showForm && user.role === 'admin' && (
        <MaintenanceForm items={items} onSubmit={() => { setShowForm(false); loadMaintenance(); onRefresh(); }} onCancel={() => setShowForm(false)} />
      )}

      {/* Active Maintenance Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>⏳</span> Active Maintenance
            {activeMaintenance.length > 0 && <span className="badge badge-warning ml-2">{activeMaintenance.length}</span>}
          </h3>
          {activeMaintenance.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-3xl mb-3">✓</p>
              <p className="text-slate-400">No active maintenance schedules</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {activeMaintenance.map(m => (
                <div key={m.id} className="card p-6 border-l-4 border-yellow-500 hover:bg-slate-700/50 transition-colors">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getTypeIcon(m.maintenance_type)}</span>
                        <div>
                          <h4 className="text-lg font-semibold text-white">{m.item?.name}</h4>
                          <p className="text-slate-400 text-sm">{m.description}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-300">
                        <span>📅 Scheduled: {new Date(m.scheduled_date).toLocaleDateString()}</span>
                        <span className={`badge ${getStatusColor(m.status)}`}>
                          {m.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="badge badge-primary">{m.maintenance_type}</span>
                      </div>
                    </div>
                    {user.role === 'admin' && (
                      <button
                        onClick={() => {
                          const notes = prompt('Completion notes (optional):');
                          const cost = prompt('Cost (optional):');
                          completeMaintenance(m.id, notes, cost);
                        }}
                        disabled={completingId === m.id}
                        className="btn-success whitespace-nowrap"
                      >
                        {completingId === m.id ? '⏳ Completing...' : '✓ Complete'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Completed Maintenance Section */}
      {completedMaintenance.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>✓</span> Completed Maintenance
            <span className="badge badge-success ml-2">{completedMaintenance.length}</span>
          </h3>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Item</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Completed</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {completedMaintenance.map(m => (
                    <tr key={m.id} className="hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-white">{m.item?.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        <span className="flex items-center gap-2">
                          <span>{getTypeIcon(m.maintenance_type)}</span>
                          {m.maintenance_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {m.completion_date ? new Date(m.completion_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-emerald-400">
                        {m.cost ? `$${m.cost}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MaintenanceForm({ items, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    item_id: '',
    scheduled_date: '',
    maintenance_type: 'preventive',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post('/api/maintenance', formData);
      alert('Maintenance scheduled successfully');
      onSubmit();
    } catch (error) {
      console.error('Error scheduling maintenance:', error);
      alert('Error scheduling maintenance');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6 bg-gradient-to-br from-slate-800 to-slate-700 border-blue-600">
      <h3 className="text-lg font-bold text-white mb-6">Schedule Maintenance</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">📦 Equipment</label>
          <select
            required
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500"
            value={formData.item_id}
            onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
          >
            <option value="">Select Equipment</option>
            {items.map(item => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">🔧 Type</label>
          <select
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500"
            value={formData.maintenance_type}
            onChange={(e) => setFormData({ ...formData, maintenance_type: e.target.value })}
          >
            <option value="preventive">Preventive</option>
            <option value="corrective">Corrective</option>
            <option value="inspection">Inspection</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-slate-300 mb-2">📅 Scheduled Date</label>
          <input
            type="date"
            required
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500"
            value={formData.scheduled_date}
            onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-300 mb-2">📝 Description</label>
        <textarea
          required
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500 resize-none"
          rows="4"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the maintenance work to be done..."
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 btn-primary disabled:opacity-50"
        >
          {submitting ? '⏳ Scheduling...' : '✓ Schedule Maintenance'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 btn-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default MaintenanceTracker;
