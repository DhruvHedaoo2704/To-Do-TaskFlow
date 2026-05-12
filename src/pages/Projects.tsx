import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import {
  FolderKanban, Plus, Trash2, Edit3, CheckSquare,
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  created_at: string;
}

interface TaskCount {
  project_id: string;
  count: number;
  completed: number;
}

const colorOptions = [
  '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#64748B',
];

const iconOptions = ['folder', 'briefcase', 'code', 'book-open', 'heart', 'star', 'zap', 'globe', 'music', 'camera'];

export default function Projects() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [taskCounts, setTaskCounts] = useState<TaskCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form, setForm] = useState({ name: '', description: '', color: '#8B5CF6', icon: 'folder' });

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [projRes, taskRes] = await Promise.all([
      supabase.from('projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('tasks').select('project_id, status').eq('user_id', user.id),
    ]);

    if (projRes.data) setProjects(projRes.data as Project[]);
    if (taskRes.data) {
      const counts: Record<string, { count: number; completed: number }> = {};
      taskRes.data.forEach((t: any) => {
        if (!t.project_id) return;
        if (!counts[t.project_id]) counts[t.project_id] = { count: 0, completed: 0 };
        counts[t.project_id].count++;
        if (t.status === 'completed') counts[t.project_id].completed++;
      });
      setTaskCounts(
        Object.entries(counts).map(([project_id, data]) => ({ project_id, ...data }))
      );
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'create') {
      setShowModal(true);
      window.history.replaceState({}, '', '/projects');
    }
  }, []);

  const openCreate = () => {
    setEditingProject(null);
    setForm({ name: '', description: '', color: '#8B5CF6', icon: 'folder' });
    setShowModal(true);
  };

  const openEdit = (p: Project) => {
    setEditingProject(p);
    setForm({ name: p.name, description: p.description, color: p.color, icon: p.icon });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const payload = { name: form.name, description: form.description, color: form.color, icon: form.icon, user_id: user.id };

    if (editingProject) {
      const { error } = await supabase.from('projects').update(payload).eq('id', editingProject.id);
      if (error) { addToast('Failed to update project', 'error'); return; }
      addToast('Project updated', 'success');
    } else {
      const { error } = await supabase.from('projects').insert(payload);
      if (error) { addToast('Failed to create project', 'error'); return; }
      addToast('Project created', 'success');
    }

    setShowModal(false);
    fetchData();
  };

  const deleteProject = async (id: string) => {
    await supabase.from('projects').delete().eq('id', id);
    addToast('Project deleted', 'info');
    fetchData();
  };

  const getTaskCount = (projectId: string) => taskCounts.find((t) => t.project_id === projectId);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Projects</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{projects.length} projects</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openCreate}
          className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl text-sm font-medium shadow-lg shadow-purple-200/50 flex items-center gap-2 self-start"
        >
          <Plus className="w-4 h-4" /> New Project
        </motion.button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-3xl" />)}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create a project to organize your tasks"
          actionLabel="Create Project"
          onAction={openCreate}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project, i) => {
            const tc = getTaskCount(project.id);
            const progress = tc && tc.count > 0 ? Math.round((tc.completed / tc.count) * 100) : 0;

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4 }}
                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-3xl p-6 border border-purple-50 dark:border-purple-900/30 shadow-lg shadow-purple-100/10 dark:shadow-purple-900/10 hover:shadow-xl transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: project.color + '20', boxShadow: `0 8px 16px ${project.color}15` }}
                  >
                    <FolderKanban className="w-6 h-6" style={{ color: project.color }} />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(project)} className="p-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/30 text-gray-400 dark:text-gray-300 hover:text-purple-500 dark:hover:text-purple-300">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteProject(project.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-1">{project.name}</h3>
                {project.description && (
                  <p className="text-sm text-gray-400 dark:text-gray-400 mb-4 line-clamp-2">{project.description}</p>
                )}

                <div className="flex items-center gap-3 mt-4">
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                    <CheckSquare className="w-4 h-4" />
                    <span>{tc?.count || 0} tasks</span>
                  </div>
                  <div className="flex-1 bg-gray-100 dark:bg-slate-800 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-2 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500">{progress}%</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingProject ? 'Edit Project' : 'New Project'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full px-4 py-3 bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900 rounded-2xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-300 dark:focus:ring-purple-600 transition-all"
              placeholder="Project name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900 rounded-2xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-300 dark:focus:ring-purple-600 transition-all resize-none"
              placeholder="What's this project about?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Color</label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className={`w-8 h-8 rounded-xl transition-all ${form.color === c ? 'ring-2 ring-offset-2 ring-purple-400 scale-110' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Icon</label>
            <div className="flex flex-wrap gap-2">
              {iconOptions.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setForm({ ...form, icon: ic })}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm transition-all ${
                    form.icon === ic ? 'bg-purple-100 ring-2 ring-purple-400' : 'bg-gray-50'
                  }`}
                >
                  {ic.charAt(0).toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-200 rounded-2xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl text-sm font-semibold shadow-lg shadow-purple-200/50"
            >
              {editingProject ? 'Update' : 'Create'}
            </motion.button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
