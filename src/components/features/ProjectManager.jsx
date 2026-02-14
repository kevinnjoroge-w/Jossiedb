import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ProjectManager({ user, items, onRefresh }) {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectItems, setProjectItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadProjectItems(selectedProject.id);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const res = await axios.get('/api/projects');
      setProjects(res.data);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectItems = async (projectId) => {
    try {
      const res = await axios.get(`/api/projects/${projectId}/items`);
      setProjectItems(res.data);
    } catch (error) {
      console.error('Error loading project items:', error);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-96">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-slate-400">Loading projects...</p>
    </div>
  </div>;

  const activeProjects = projects.filter(p => p.status !== 'completed' && p.status !== 'cancelled');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Projects</h2>
          <p className="text-slate-400 text-sm mt-1">Manage construction projects and equipment allocation</p>
        </div>
        {user.role === 'admin' && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary"
          >
            {showForm ? '✕ Cancel' : '➕ New Project'}
          </button>
        )}
      </div>

      {showForm && user.role === 'admin' && (
        <ProjectForm onSubmit={() => { setShowForm(false); loadProjects(); }} onCancel={() => setShowForm(false)} />
      )}

      {activeProjects.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-3xl mb-3">📋</p>
          <p className="text-slate-400">No active projects</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeProjects.map(project => (
            <div
              key={project.id}
              onClick={() => setSelectedProject(project)}
              className={`card p-6 cursor-pointer transition-all border-l-4 ${selectedProject?.id === project.id
                  ? 'border-l-blue-500 bg-slate-700 ring-2 ring-blue-500'
                  : 'border-l-slate-600 hover:bg-slate-700/50'
                }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-white">{project.name}</h3>
                  <p className="text-slate-400 text-sm mt-1">{project.location}</p>
                </div>
                <span className={`badge ${project.status === 'in_progress' ? 'badge-info' :
                    project.status === 'planning' ? 'badge-warning' :
                      project.status === 'on_hold' ? 'badge-primary' :
                        'badge-success'
                  }`}>
                  {project.status.replace('_', ' ')}
                </span>
              </div>
              <div className="text-sm text-slate-300 space-y-2">
                <p>📅 <span className="text-slate-400">
                  {new Date(project.start_date).toLocaleDateString()} → {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Ongoing'}
                </span></p>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedProject && (
        <div className="card p-6">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-700">
            <div>
              <h3 className="text-xl font-bold text-white">{selectedProject.name}</h3>
              <p className="text-slate-400 text-sm">Equipment Allocation</p>
            </div>
            {user.role === 'admin' && (
              <button
                onClick={() => alert('Add items to project functionality')}
                className="btn-secondary"
              >
                ➕ Allocate Items
              </button>
            )}
          </div>

          {projectItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400">No equipment allocated to this project</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Equipment</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Allocated</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Used</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Remaining</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {projectItems.map(pi => {
                    const used = pi.quantity_used || 0;
                    const allocated = pi.quantity_allocated;
                    const remaining = allocated - used;
                    const usagePercent = (used / allocated) * 100;
                    return (
                      <tr key={pi.id} className="hover:bg-slate-700/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-white">{pi.item?.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-300 font-semibold">{allocated}</td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-slate-600 rounded-full h-2">
                              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${usagePercent}%` }}></div>
                            </div>
                            <span className="text-slate-400 text-xs">{used}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-emerald-400 font-semibold">{remaining}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProjectForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    start_date: '',
    end_date: '',
    status: 'planning',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post('/api/projects', formData);
      alert('Project created successfully');
      onSubmit();
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Error creating project');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6 bg-gradient-to-br from-slate-800 to-slate-700 border-blue-600">
      <h3 className="text-lg font-bold text-white mb-6">Create New Project</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">📋 Project Name</label>
          <input
            type="text"
            required
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter project name..."
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">📍 Location</label>
          <input
            type="text"
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Project location..."
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">📅 Start Date</label>
          <input
            type="date"
            required
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">📅 End Date (Optional)</label>
          <input
            type="date"
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">📊 Status</label>
          <select
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="planning">Planning</option>
            <option value="in_progress">In Progress</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-300 mb-2">📝 Description</label>
        <textarea
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500 resize-none"
          rows="4"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the project..."
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 btn-primary disabled:opacity-50"
        >
          {submitting ? '⏳ Creating...' : '✓ Create Project'}
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

export default ProjectManager;
