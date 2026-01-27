import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Shield, User, Clock, FileText } from 'lucide-react';
import { auditService } from '../services/auditService';
import Loading from '../components/ui/Loading';
import toast from 'react-hot-toast';

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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">System Audit Logs</h1>
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

            <div className="glass rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-700/50 bg-slate-800/30">
                                <th className="p-4 text-slate-400 font-medium">Action</th>
                                <th className="p-4 text-slate-400 font-medium">Entity</th>
                                <th className="p-4 text-slate-400 font-medium">Changed By</th>
                                <th className="p-4 text-slate-400 font-medium">Timestamp</th>
                                <th className="p-4 text-slate-400 font-medium">Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.map((log) => (
                                <tr key={log.id} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                                    <td className="p-4">
                                        <span className="font-medium text-white">{log.action}</span>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 rounded bg-slate-700 text-xs text-slate-300">
                                            {log.entity_type}
                                        </span>
                                        <span className="ml-2 text-sm text-slate-400">#{log.entity_id.split('-')[0]}</span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center space-x-2">
                                            <User className="w-4 h-4 text-slate-500" />
                                            <span className="text-sm text-white">{log.User?.full_name || 'System'}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-slate-400">
                                        <div className="flex items-center space-x-2">
                                            <Clock className="w-3 h-3" />
                                            <span>{new Date(log.createdAt).toLocaleString()}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {log.details && (
                                            <div className="max-w-xs truncate text-xs text-slate-500 bg-slate-900/50 p-1 rounded">
                                                {JSON.stringify(log.details)}
                                            </div>
                                        )}
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
