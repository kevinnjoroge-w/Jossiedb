import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

function AnalyticsDashboard({ user }) {
  const [summary, setSummary] = useState(null);
  const [byLocation, setByLocation] = useState([]);
  const [byCategory, setByCategory] = useState([]);
  const [mostUsed, setMostUsed] = useState([]);
  const [costAnalysis, setCostAnalysis] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [summaryRes, locationRes, categoryRes, usedRes, costRes] = await Promise.all([
        api.get('/analytics/summary'),
        api.get('/analytics/by-location'),
        api.get('/analytics/by-category'),
        api.get('/analytics/most-used'),
        api.get('/analytics/cost-analysis'),
      ]);
      setSummary(summaryRes.data);
      setByLocation(locationRes.data);
      setByCategory(categoryRes.data);
      setMostUsed(usedRes.data);
      setCostAnalysis(costRes.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-96">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-slate-300">Loading analytics...</p>
    </div>
  </div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
        <p className="text-slate-300 text-sm mt-1">Equipment inventory and usage analytics</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-6 bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-600">
            <p className="text-slate-300 text-sm font-medium">📦 Total Items</p>
            <p className="text-4xl font-bold text-blue-400 mt-2">{summary.totalItems}</p>
          </div>
          <div className="card p-6 bg-gradient-to-br from-emerald-900/20 to-emerald-800/20 border-emerald-600">
            <p className="text-slate-300 text-sm font-medium">💰 Total Value</p>
            <p className="text-4xl font-bold text-emerald-400 mt-2">${summary.totalValue?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="card p-6 bg-gradient-to-br from-red-900/20 to-red-800/20 border-red-600">
            <p className="text-slate-300 text-sm font-medium">⚠️ Low Stock</p>
            <p className="text-4xl font-bold text-red-400 mt-2">{summary.lowStockCount}</p>
          </div>
          <div className="card p-6 bg-gradient-to-br from-purple-900/20 to-purple-800/20 border-purple-600">
            <p className="text-slate-300 text-sm font-medium">📊 Status Breakdown</p>
            <div className="mt-3 space-y-1">
              {summary.itemsByStatus?.map(status => (
                <p key={status.status} className="text-xs text-slate-300">
                  <span className="font-semibold text-purple-400">{status.count}</span> {status.status}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* By Location */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-white mb-4">📍 Inventory by Location</h3>
        {byLocation.length === 0 ? (
          <p className="text-slate-300 text-center py-8">No location data available</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {byLocation.map((loc, idx) => (
              <div key={idx} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-slate-500 transition-colors">
                <p className="text-slate-300 font-semibold">{loc.location?.name || 'Unknown'}</p>
                <p className="text-3xl font-bold text-cyan-400 mt-2">{loc.total_quantity}</p>
                <p className="text-sm text-slate-300 mt-1">📦 {loc.item_count} type(s)</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* By Category */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-white mb-4">🏷️ Inventory by Category</h3>
        {byCategory.length === 0 ? (
          <p className="text-slate-300 text-center py-8">No category data available</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {byCategory.map((cat, idx) => (
              <div key={idx} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-slate-500 transition-colors">
                <p className="text-slate-300 font-semibold">{cat.category?.name || 'Unknown'}</p>
                <p className="text-3xl font-bold text-violet-400 mt-2">{cat.total_quantity}</p>
                <p className="text-sm text-slate-300 mt-1">📦 {cat.item_count} item(s)</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Most Used Items */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-white mb-4">🔥 Most Used Items</h3>
        {mostUsed.length === 0 ? (
          <p className="text-slate-300 text-center py-8">No usage data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Equipment</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Check-Outs</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Total Used</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {mostUsed.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-white">{item.item?.name}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="badge badge-info">{item.checkout_count}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-orange-400 font-semibold">{item.total_quantity_used}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cost Analysis */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-white mb-4">💵 Cost Analysis by Category</h3>
        {costAnalysis.length === 0 ? (
          <p className="text-slate-300 text-center py-8">No cost data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Item Count</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Total Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {costAnalysis.map((cat, idx) => {
                  const totalValue = parseFloat(cat.total_value || 0);
                  return (
                    <tr key={idx} className="hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-white">{cat.category?.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">{cat.item_count}</td>
                      <td className="px-6 py-4 text-sm font-bold text-emerald-400">${totalValue.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
