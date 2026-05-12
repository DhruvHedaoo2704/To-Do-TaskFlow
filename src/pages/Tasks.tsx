import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { TaskCardSkeleton } from '../components/ui/Skeleton';
import {
  Search, Filter, Plus, Check, Trash2, Edit3, Calendar,
  ChevronDown, X,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  category: string;
  due_date: string | null;
  project_id: string | null;
  projects?: { name: string; color: string } | null;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  color: string;
}

const priorityColors = {
  high: 'bg-red-100 text-red-600 border-red-200',
  medium: 'bg-amber-100 text-amber-600 border-amber-200',
  low: 'bg-emerald-100 text-emerald-600 border-emerald-200',
};

const statusColors = {
  pending: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-600',
  completed: 'bg-emerald-100 text-emerald-600',
};

export default function Tasks() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'pending' as 'pending' | 'in_progress' | 'completed',
    category: 'general',
    due_date: '',
    project_id: '',
  });

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('tasks')
      .select('*, projects(name, color)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setTasks(data as Task[]);
    setLoading(false);
  }, [user]);

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('projects')
      .select('id, name, color')
      .eq('user_id', user.id);
    if (data) setProjects(data as Project[]);
  }, [user]);

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, [fetchTasks, fetchProjects]);

  // Check for create action from FAB
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'create') {
      setShowModal(true);
      window.history.replaceState({}, '', '/tasks');
    }
  }, []);

  const openCreate = () => {
    setEditingTask(null);
    setForm({ title: '', description: '', priority: 'medium', status: 'pending', category: 'general', due_date: '', project_id: '' });
    setShowModal(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      category: task.category,
      due_date: task.due_date || '',
      project_id: task.project_id || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const payload = {
      title: form.title,
      description: form.description,
      priority: form.priority,
      status: form.status,
      category: form.category,
      due_date: form.due_date || null,
      project_id: form.project_id || null,
      user_id: user.id,
      completed_at: form.status === 'completed' ? new Date().toISOString() : null,
    };

    if (editingTask) {
      const { error } = await supabase.from('tasks').update(payload).eq('id', editingTask.id);
      if (error) { addToast('Failed to update task', 'error'); return; }
      addToast('Task updated', 'success');
    } else {
      const { error } = await supabase.from('tasks').insert(payload);
      if (error) { addToast('Failed to create task', 'error'); return; }
      addToast('Task created', 'success');
    }

    setShowModal(false);
    fetchTasks();
  };

  const toggleComplete = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await supabase
      .from('tasks')
      .update({ status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : null })
      .eq('id', task.id);
    addToast(newStatus === 'completed' ? 'Task completed!' : 'Task reopened', 'success');
    fetchTasks();
  };

  const deleteTask = async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id);
    addToast('Task deleted', 'info');
    fetchTasks();
  };

  const filtered = tasks.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    return true;
  });

  const grouped = {
    pending: filtered.filter((t) => t.status === 'pending'),
    in_progress: filtered.filter((t) => t.status === 'in_progress'),
    completed: filtered.filter((t) => t.status === 'completed'),
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-500">{tasks.length} total tasks</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openCreate}
          className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl text-sm font-medium shadow-lg shadow-purple-200/50 flex items-center gap-2 self-start"
        >
          <Plus className="w-4 h-4" /> New Task
        </motion.button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-12 pr-4 py-3 bg-white/80 border border-purple-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-3 rounded-2xl text-sm font-medium flex items-center gap-2 border transition-colors ${
            showFilters ? 'bg-purple-50 border-purple-200 text-purple-600' : 'bg-white/80 border-purple-100 text-gray-600'
          }`}
        >
          <Filter className="w-4 h-4" /> Filters
          <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-white/80 rounded-2xl p-4 border border-purple-50 flex flex-wrap gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Priority</label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="px-3 py-2 bg-purple-50 border border-purple-100 rounded-xl text-sm focus:outline-none"
                >
                  <option value="all">All</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 bg-purple-50 border border-purple-100 rounded-xl text-sm focus:outline-none"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              {(filterPriority !== 'all' || filterStatus !== 'all') && (
                <button
                  onClick={() => { setFilterPriority('all'); setFilterStatus('all'); }}
                  className="self-end px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Lists */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <TaskCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Check}
          title={tasks.length === 0 ? 'No tasks yet' : 'No matching tasks'}
          description={tasks.length === 0 ? 'Create your first task to get started' : 'Try adjusting your filters'}
          actionLabel={tasks.length === 0 ? 'Create Task' : undefined}
          onAction={tasks.length === 0 ? openCreate : undefined}
        />
      ) : (
        <div className="space-y-6">
          {(['pending', 'in_progress', 'completed'] as const).map((status) => {
            const group = grouped[status];
            if (group.length === 0) return null;
            return (
              <div key={status}>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${status === 'completed' ? 'bg-emerald-400' : status === 'in_progress' ? 'bg-blue-400' : 'bg-gray-300'}`} />
                  {status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
                  <span className="text-gray-300 font-normal">({group.length})</span>
                </h3>
                <div className="space-y-2">
                  {group.map((task, i) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      whileHover={{ x: 4 }}
                      className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-purple-50 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group"
                    >
                      <button
                        onClick={() => toggleComplete(task)}
                        className={`w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                          task.status === 'completed'
                            ? 'bg-purple-500 border-purple-500'
                            : 'border-purple-200 hover:border-purple-400'
                        }`}
                      >
                        {task.status === 'completed' && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {task.projects && (
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: task.projects.color + '20', color: task.projects.color }}>
                              {task.projects.name}
                            </span>
                          )}
                          {task.due_date && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(parseISO(task.due_date), 'MMM d')}
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[task.status]}`}>
                            {task.status === 'in_progress' ? 'In Progress' : task.status}
                          </span>
                        </div>
                      </div>

                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${priorityColors[task.priority]}`}>
                        {task.priority}
                      </span>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(task)} className="p-1.5 rounded-lg hover:bg-purple-50 text-gray-400 hover:text-purple-500 transition-colors">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteTask(task.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingTask ? 'Edit Task' : 'New Task'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="w-full px-4 py-3 bg-purple-50/50 border border-purple-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all"
              placeholder="What needs to be done?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-purple-50/50 border border-purple-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all resize-none"
              placeholder="Add details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                className="w-full px-4 py-3 bg-purple-50/50 border border-purple-100 rounded-2xl text-sm focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                className="w-full px-4 py-3 bg-purple-50/50 border border-purple-100 rounded-2xl text-sm focus:outline-none"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-3 bg-purple-50/50 border border-purple-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all"
                placeholder="e.g. Work, Personal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date</label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="w-full px-4 py-3 bg-purple-50/50 border border-purple-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Project</label>
            <select
              value={form.project_id}
              onChange={(e) => setForm({ ...form, project_id: e.target.value })}
              className="w-full px-4 py-3 bg-purple-50/50 border border-purple-100 rounded-2xl text-sm focus:outline-none"
            >
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-2xl text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl text-sm font-semibold shadow-lg shadow-purple-200/50"
            >
              {editingTask ? 'Update' : 'Create'}
            </motion.button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
