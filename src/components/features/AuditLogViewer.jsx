import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

function AuditLogViewer({ user }) {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({
    entity_type: '',
    action: '',
    startDate: '',
    endDate: '',
  });
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ limit: 50, offset: 0 });

  const loadAuditLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        limit: pagination.limit,
        offset: pagination.offset,
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
      });
      const res = await axios.get(`/api/audit-logs?${params}`);
      setLogs(res.data.data);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination]);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  if (loading) return <div className="flex justify-center items-center h-96">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-slate-400">Loading audit logs...</p>
    </div>
  </div>;

  const getActionColor = (action) => {
    switch(action) {
      case 'CREATE': return 'badge-success';
      case 'UPDATE': return 'badge-info';
      case 'DELETE': return 'badge-danger';
      case 'CHECKOUT': return 'badge-warning';
      case 'CHECKIN': return 'badge-success';
      default: return 'badge-primary';
    }
  };

  const getEntityIcon = (type) => {
    switch(type) {
      case 'Item': return '📦';
      case 'CheckOut': return '📤';
      case 'Maintenance': return '🔧';
      case 'Project': return '📋';
      default: return '📄';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Audit Log</h2>
        <p className="text-slate-400 text-sm mt-1">Track all system changes and activities</p>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🔍 Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Entity Type</label>
            <select
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500"
              value={filters.entity_type}
              onChange={(e) => { setFilters({ ...filters, entity_type: e.target.value }); setPagination({ ...pagination, offset: 0 }); }}
            >
              <option value="">All Types</option>
              <option value="Item">Item</option>
              <option value="CheckOut">Check Out</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Project">Project</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Action</label>
            <select
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500"
              value={filters.action}
              onChange={(e) => { setFilters({ ...filters, action: e.target.value }); setPagination({ ...pagination, offset: 0 }); }}
            >
              <option value="">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="CHECKOUT">Check Out</option>
              <option value="CHECKIN">Check In</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Start Date</label>
            <input
              type="date"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500"
              value={filters.startDate}
              onChange={(e) => { setFilters({ ...filters, startDate: e.target.value }); setPagination({ ...pagination, offset: 0 }); }}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">End Date</label>
            <input
              type="date"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500"
              value={filters.endDate}
              onChange={(e) => { setFilters({ ...filters, endDate: e.target.value }); setPagination({ ...pagination, offset: 0 }); }}
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800 border-b border-slate-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Timestamp</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Action</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Entity</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-300">
                      📅 {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      👤 {log.user?.full_name || log.user?.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`badge ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      <span>{getEntityIcon(log.entity_type)}</span> {log.entity_type} #{log.entity_id}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {log.changes && (
                        <details className="cursor-pointer">
                          <summary className="text-blue-400 hover:text-blue-300 font-medium">View Changes</summary>
                          <pre className="text-xs bg-slate-700 p-3 mt-2 rounded overflow-auto max-h-40 border border-slate-600">
                            {JSON.stringify(log.changes, null, 2)}
                          </pre>
                        </details>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-2">
        <button
          onClick={() => setPagination({ ...pagination, offset: Math.max(0, pagination.offset - pagination.limit) })}
          disabled={pagination.offset === 0}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
        >
          ← Previous
        </button>
        <span className="px-4 py-2 bg-slate-800 rounded-lg text-slate-300 font-medium">
          Page {Math.floor(pagination.offset / pagination.limit) + 1}
        </span>
        <button
          onClick={() => setPagination({ ...pagination, offset: pagination.offset + pagination.limit })}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

export default AuditLogViewer;
