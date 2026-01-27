import React, { useState, useEffect } from 'react';
import axios from 'axios';

function CheckOutManager({ user, locations, onRefresh }) {
  const [checkouts, setCheckouts] = useState([]);
  const [overdueCheckouts, setOverdueCheckouts] = useState([]);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCheckouts();
  }, []);

  const loadCheckouts = async () => {
    try {
      const [activeRes, overdueRes] = await Promise.all([
        axios.get('/api/checkouts'),
        axios.get('/api/checkouts/overdue'),
      ]);
      setCheckouts(activeRes.data);
      setOverdueCheckouts(overdueRes.data);
    } catch (error) {
      console.error('Error loading checkouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkinItem = async (checkoutId, quantityReturned) => {
    try {
      await axios.put(`/api/checkouts/${checkoutId}/checkin`, { quantity_returned: quantityReturned });
      alert('Item checked in successfully');
      loadCheckouts();
      onRefresh();
    } catch (error) {
      console.error('Error checking in item:', error);
      alert('Error checking in item');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-96">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-slate-400">Loading checkouts...</p>
    </div>
  </div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Overdue Items Alert */}
      {overdueCheckouts.length > 0 && (
        <div className="card border-red-600 bg-gradient-to-r from-red-900/20 to-red-800/20 p-6">
          <div className="flex items-start gap-4">
            <span className="text-3xl">⚠️</span>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-200 mb-4">Overdue Items ({overdueCheckouts.length})</h3>
              <div className="grid gap-3">
                {overdueCheckouts.map(checkout => (
                  <div key={checkout.id} className="bg-slate-700/50 p-4 rounded-lg border border-red-600/50 flex justify-between items-center">
                    <div className="flex-1">
                      <p className="text-white font-semibold">{checkout.item?.name}</p>
                      <p className="text-slate-400 text-sm mt-1">
                        📋 {checkout.checked_out_to_user?.full_name} • 
                        📅 Due: {new Date(checkout.due_date).toLocaleDateString()} • 
                        📦 Qty: {checkout.quantity}
                      </p>
                    </div>
                    <button
                      onClick={() => checkinItem(checkout.id, checkout.quantity)}
                      className="btn-success ml-4"
                    >
                      Return Now
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Active Check-Outs</h2>
          <p className="text-slate-400 text-sm mt-1">{checkouts.length} items currently checked out</p>
        </div>
        {(user.role === 'foreman' || user.role === 'admin') && (
          <button
            onClick={() => setShowCheckoutForm(!showCheckoutForm)}
            className="btn-primary"
          >
            {showCheckoutForm ? '✕ Cancel' : '➕ New Check-Out'}
          </button>
        )}
      </div>

      {/* Checkout Form */}
      {showCheckoutForm && (user.role === 'foreman' || user.role === 'admin') && (
        <CheckOutForm onSubmit={() => { setShowCheckoutForm(false); loadCheckouts(); onRefresh(); }} onCancel={() => setShowCheckoutForm(false)} />
      )}

      {/* Active Checkouts Table */}
      {checkouts.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Item</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Person</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Qty</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Check Out</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Due Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {checkouts.map(checkout => (
                  <tr key={checkout.id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-white">{checkout.item?.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{checkout.checked_out_to_user?.full_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-300 font-semibold">{checkout.quantity}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{new Date(checkout.checkout_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{new Date(checkout.due_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`badge ${
                        checkout.status === 'overdue' ? 'badge-danger' :
                        checkout.status === 'checked_out' ? 'badge-info' :
                        'badge-success'
                      }`}>
                        {checkout.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => checkinItem(checkout.id, checkout.quantity)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 rounded text-sm text-white font-medium transition-colors"
                      >
                        Return
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <p className="text-3xl mb-3">📦</p>
          <p className="text-slate-400">No active check-outs</p>
        </div>
      )}
    </div>
  );
}

function CheckOutForm({ onSubmit, onCancel }) {
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    item_id: '',
    checked_out_to: '',
    quantity: 1,
    due_date: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadFormData();
  }, []);

  const loadFormData = async () => {
    try {
      const [itemsRes, usersRes] = await Promise.all([
        axios.get('/api/items'),
        axios.get('/api/users'),
      ]);
      setItems(itemsRes.data);
      setUsers(usersRes.data.data || usersRes.data);
    } catch (error) {
      console.error('Error loading form data:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post('/api/checkouts', formData);
      alert('Item checked out successfully');
      onSubmit();
    } catch (error) {
      console.error('Error checking out item:', error);
      alert('Error checking out item: ' + error.response?.data?.error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6 bg-gradient-to-br from-slate-800 to-slate-700 border-blue-600">
      <h3 className="text-lg font-bold text-white mb-6">Create New Check-Out</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">📦 Item</label>
          <select
            required
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500"
            value={formData.item_id}
            onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
          >
            <option value="">Select Item</option>
            {items.map(item => (
              <option key={item.id} value={item.id}>{item.name} (Available: {item.quantity})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">👤 Check Out To</label>
          <select
            required
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500"
            value={formData.checked_out_to}
            onChange={(e) => setFormData({ ...formData, checked_out_to: e.target.value })}
          >
            <option value="">Select User</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">📊 Quantity</label>
          <input
            type="number"
            min="1"
            required
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">📅 Due Date</label>
          <input
            type="date"
            required
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-300 mb-2">📝 Notes</label>
        <textarea
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500 resize-none"
          rows="3"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Add any notes about this checkout..."
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 btn-primary disabled:opacity-50"
        >
          {submitting ? '⏳ Processing...' : '✓ Check Out'}
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

export default CheckOutManager;
