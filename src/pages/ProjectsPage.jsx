import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Calendar, MapPin, Briefcase, X } from 'lucide-react';
import { projectService } from '../services/projectService';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';

const ProjectsPage = () => {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        location: '',
        start_date: '',
        end_date: '',
        status: 'planning'
    });

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const data = await projectService.getAllProjects();
            setProjects(data);
        } catch (error) {
            toast.error('Failed to load projects');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await projectService.createProject(formData);
            toast.success('Project created successfully');
            setIsModalOpen(false);
            fetchProjects();
            setFormData({ name: '', description: '', location: '', start_date: '', end_date: '', status: 'planning' });
        } catch (error) {
            toast.error('Failed to create project');
        }
    };

    const statusColors = {
        planning: 'bg-blue-500/10 text-blue-400',
        active: 'bg-green-500/10 text-green-400',
        completed: 'bg-purple-500/10 text-purple-400',
        on_hold: 'bg-yellow-500/10 text-yellow-400',
        cancelled: 'bg-red-500/10 text-red-400'
    };

    const isAdmin = user?.role === 'admin' || user?.role === 'supervisor';

    const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Projects</h1>
                {isAdmin && (
                    <Button onClick={() => setIsModalOpen(true)} icon={Plus}>
                        New Project
                    </Button>
                )}
            </div>

            <div className="glass p-4 rounded-xl">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700 text-white pl-10 pr-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map(project => (
                    <motion.div key={project.id} layout className="glass p-6 rounded-xl hover:bg-slate-800/50 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-slate-800 rounded-lg">
                                <Briefcase className="w-6 h-6 text-primary-400" />
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${statusColors[project.status] || 'bg-slate-700 text-slate-400'}`}>
                                {project.status.replace('_', ' ')}
                            </span>
                        </div>

                        <h3 className="text-lg font-bold text-white mb-2">{project.name}</h3>
                        <p className="text-sm text-slate-400 mb-4 line-clamp-2">{project.description}</p>

                        <div className="space-y-3 text-sm text-slate-300">
                            <div className="flex items-center space-x-2">
                                <MapPin className="w-4 h-4 text-slate-500" />
                                <span>{project.location || 'No location set'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-slate-500" />
                                <span>{project.start_date ? new Date(project.start_date).toLocaleDateString() : 'TBD'}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white">Create Project</h2>
                                <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-white" /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <Input label="Project Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                                <Input label="Location" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Start Date" type="date" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} />
                                    <Input label="End Date" type="date" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
                                    <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500">
                                        <option value="planning">Planning</option>
                                        <option value="active">Active</option>
                                        <option value="on_hold">On Hold</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                                    <textarea
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500 h-24 resize-none"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                    <Button type="submit">Create Project</Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProjectsPage;
