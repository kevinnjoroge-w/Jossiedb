import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Shield, User, Clock, Download } from 'lucide-react';
import { auditService } from '../services/auditService';
import Loading from '../components/ui/Loading';
import toast from 'react-hot-toast';

const getReadableLogMessage = (log) => {
    const user = log.User?.full_name ? `**${log.User.full_name}**` : 'The **System**';
    const entity = `${log.entity_type.toLowerCase()} record (ID: ${log.entity_id.substring(0, 8)}...)`;
    const details = log.details || {};

    const formatReason = (r) => r && r.trim() ? `Reason provided: "${r}"` : 'No specific reason provided.';

    switch (log.action) {
        case 'CREATE_TRANSFER':
            return `A request was made to transfer ${details.quantity || 'some'} units. ${formatReason(details.reason)}`;
        case 'APPROVE_TRANSFER':
            return `A pending transfer request was reviewed and officially approved.`;
        case 'REJECT_TRANSFER':
            return `A pending transfer request was reviewed and rejected. ${formatReason(details.reason)}`;
        case 'COMPLETE_TRANSFER':
            return `A transfer was physically completed, successfully moving ${details.quantityMoved || 'all requested'} units to their destination.`;

        case 'ASSIGN_FOREMAN':
            return `A new foreman was assigned to oversee a location.`;
        case 'UNASSIGN_FOREMAN':
            return `A foreman was removed from their location assignment.`;

        case 'CHECKOUT':
            return `Equipment was checked out from inventory. ${details.quantity ? '(' + details.quantity + ' units)' : ''}`;
        case 'CHECKOUT_AUTHORIZATION':
            return `An equipment checkout request was ${details.action || 'authorized'}.`;
        case 'CHECKIN':
            return `Equipment was successfully returned to inventory. logged condition: ${details.condition || 'No condition explicitly reported'}.`;

        case 'CREATE_ITEM':
            return `A new item was added to the equipment inventory.`;
        case 'UPDATE_ITEM':
            return `Details for an inventory item were modified.`;
        case 'DELETE_ITEM':
            return `An item was permanently removed from the system.`;

        case 'SCHEDULE_MAINTENANCE':
            return `A new maintenance job was scheduled.`;
        case 'COMPLETE_MAINTENANCE':
            return `A scheduled maintenance job was marked as completed.`;

        default:
            // Graceful fallback for unknown actions
            const genericAction = log.action.replace(/_/g, ' ').toLowerCase();
            return `Performed a system operation logs as "${genericAction}" on a ${entity}.`;
    }
};

const AuditLogsPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const data = await auditService.getLogs({ limit: 50 });
            setLogs(data);
        } catch (error) {
            toast.error('Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.User?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const exportToCSV = () => {
        if (filteredLogs.length === 0) return toast.error('No logs to export');

        const headers = ['Timestamp', 'Action Code', 'User', 'Entity Type', 'Entity ID', 'Event Description'];

        const csvRows = filteredLogs.map(log => {
            const timestamp = new Date(log.createdAt).toLocaleString();
            const action = log.action;
            const user = log.User?.full_name || 'System';
            const entityType = log.entity_type;
            const entityId = log.entity_id;
            // Clean markdown formatting (**) from the readable message for CSV
            const description = getReadableLogMessage(log).replace(/\*\*/g, '');

            // Escape quotes and wrap in quotes to handle commas within the data
            return [
                `"${timestamp}"`,
                `"${action}"`,
                `"${user}"`,
                `"${entityType}"`,
                `"${entityId}"`,
                `"${description.replace(/"/g, '""')}"`
            ].join(',');
        });

        const csvString = [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Logs exported successfully');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">System Audit Logs</h1>
                <button
                    onClick={exportToCSV}
                    disabled={filteredLogs.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-semibold transition-colors border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download className="w-4 h-4" /> Export CSV
                </button>
            </div>

            <div className="glass p-4 rounded-xl">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by action, user, or entity..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700 text-white pl-10 pr-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
            </div>

            <div className="glass rounded-xl overflow-hidden bg-slate-800/95">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-700/50 bg-slate-900/50">
                                <th className="p-4 text-slate-100 font-medium w-1/5">Timestamp</th>
                                <th className="p-4 text-slate-100 font-medium w-1/6">User</th>
                                <th className="p-4 text-slate-100 font-medium">Event Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.map((log) => (
                                <tr key={log.id} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                                    <td className="p-4 text-sm text-slate-100 whitespace-nowrap">
                                        <div className="flex items-center space-x-2">
                                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                                            <span>{new Date(log.createdAt).toLocaleString(undefined, {
                                                year: 'numeric', month: 'short', day: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center space-x-2">
                                            <div className="p-1.5 bg-slate-700 rounded-full">
                                                <User className="w-3.5 h-3.5 text-slate-300" />
                                            </div>
                                            <span className="text-sm font-semibold text-white">{log.User?.full_name || 'System'}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] uppercase font-black text-primary-400 tracking-wider">
                                                {log.action.replace(/_/g, ' ')}
                                            </span>
                                            <p className="text-sm text-slate-200 leading-relaxed">
                                                {getReadableLogMessage(log)}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredLogs.length === 0 && !loading && (
                        <div className="p-8 text-center text-slate-500">
                            No logs found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuditLogsPage;
