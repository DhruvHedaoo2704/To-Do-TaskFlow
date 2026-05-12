import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import ProgressRing from '../components/ui/ProgressRing';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import {
  CheckSquare,
  Clock,
  TrendingUp,
  Flame,
  Calendar,
  ArrowRight,
  Check,
} from 'lucide-react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { useNavigate, Link } from 'react-router-dom';

interface Task {
  id: string;
  title: string;
  priority: string;
  status: string;
  due_date: string | null;
  category: string;
  projects?: { name: string; color: string } | null;
}

interface Profile {
  full_name: string;
  streak_count: number;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalTasks, setTotalTasks] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [inProgressTasks, setInProgressTasks] = useState(0);
  const [todayTasks, setTodayTasks] = useState(0);
  const navigate = useNavigate(); // Initialize navigation

  const handleToggleStatus = async (e: React.MouseEvent, taskId: string, currentStatus: string) => {
    e.stopPropagation(); // Prevents navigating to /tasks when checking the box
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    
    // Update local state immediately
    const oldTask = tasks.find(t => t.id === taskId);
    if (oldTask) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      
      // Update statistics
      if (currentStatus === 'completed' && newStatus === 'pending') {
        setCompletedTasks(prev => Math.max(0, prev - 1));
        setInProgressTasks(prev => prev + 1);
      } else if (currentStatus === 'pending' && newStatus === 'completed') {
        setCompletedTasks(prev => prev + 1);
        setInProgressTasks(prev => Math.max(0, prev - 1));
      }
    }
    
    // Update in Supabase
    const { error } = await supabase
      .from('tasks')
      .update({ 
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null 
      })
      .eq('id', taskId);

    if (error) {
      // Revert if there's an error
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: currentStatus } : t));
      if (currentStatus === 'completed' && newStatus === 'pending') {
        setCompletedTasks(prev => prev + 1);
        setInProgressTasks(prev => Math.max(0, prev - 1));
      } else if (currentStatus === 'pending' && newStatus === 'completed') {
        setCompletedTasks(prev => Math.max(0, prev - 1));
        setInProgressTasks(prev => prev + 1);
      }
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchDashboard = async () => {
      const [profileRes, tasksRes] = await Promise.all([
        supabase.from('profiles').select('full_name, streak_count').eq('id', user.id).maybeSingle(),
        supabase
          .from('tasks')
          .select('id, title, priority, status, due_date, category, projects(name, color)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (tasksRes.data) {
        const allTasks = tasksRes.data as unknown as Task[];
        setTasks(allTasks.slice(0, 6));
        setTotalTasks(allTasks.length);
        setCompletedTasks(allTasks.filter((t) => t.status === 'completed').length);
        setInProgressTasks(allTasks.filter((t) => t.status === 'in_progress').length);
        setTodayTasks(
          allTasks.filter((t) => t.due_date && isToday(parseISO(t.due_date))).length
        );
      }
      setLoading(false);
    };

    fetchDashboard();
  }, [user]);

  if (loading) return <DashboardSkeleton />;

  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const priorityColor = (p: string) => {
    if (p === 'high') return 'bg-red-100 text-red-600';
    if (p === 'medium') return 'bg-amber-100 text-amber-600';
    return 'bg-emerald-100 text-emerald-600';
  };

  const formatDueDate = (d: string | null) => {
    if (!d) return null;
    const date = parseISO(d);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
  };

  return (
    <>
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto"
    >
      {/* Greeting */}
      <motion.div variants={item} className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          {greeting}, <span className="bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">{profile?.full_name || 'there'}</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Tasks', value: totalTasks, icon: CheckSquare, color: 'from-purple-500 to-purple-600', shadow: 'shadow-purple-200/50' },
          { label: 'Completed', value: completedTasks, icon: TrendingUp, color: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-200/50' },
          { label: 'In Progress', value: inProgressTasks, icon: Clock, color: 'from-amber-500 to-amber-600', shadow: 'shadow-amber-200/50' },
          { label: 'Due Today', value: todayTasks, icon: Calendar, color: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-200/50' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            whileHover={{ y: -2 }}
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-3xl p-5 border border-purple-50 dark:border-purple-900/30 shadow-lg shadow-purple-100/10 dark:shadow-purple-900/10"
          >
            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 shadow-lg ${stat.shadow}`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stat.value}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Progress + Streak */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Progress Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-purple-500 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-purple-300/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2">Today's Progress</h2>
              <p className="text-purple-100 text-sm mb-4">
                You've completed {completedTasks} of {totalTasks} tasks
              </p>
              <div className="w-full bg-purple-400/30 rounded-full h-3 mb-4">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  className="bg-white rounded-full h-3"
                />
              </div>
              <div className="flex gap-6 text-sm">
                <div>
                  <p className="text-purple-200">Completion</p>
                  <p className="text-2xl font-bold">{progress}%</p>
                </div>
                <div>
                  <p className="text-purple-200">Remaining</p>
                  <p className="text-2xl font-bold">{totalTasks - completedTasks}</p>
                </div>
              </div>
            </div>
            <ProgressRing progress={progress} size={100} strokeWidth={8} color="#ffffff" bgColor="rgba(255,255,255,0.2)">
              <span className="text-xl font-bold text-white">{progress}%</span>
            </ProgressRing>
          </div>
        </div>

        {/* Streak Card */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-3xl p-6 border border-purple-50 dark:border-purple-900/30 shadow-lg shadow-purple-100/10 dark:shadow-purple-900/10 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center mb-4 shadow-lg shadow-orange-200/50 dark:shadow-orange-900/30">
            <Flame className="w-7 h-7 text-white" />
          </div>
          <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{profile?.streak_count || 0}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Day Streak</p>
          <p className="text-xs text-gray-300 dark:text-gray-400 mt-2">Keep it going!</p>
        </div>
      </motion.div>

      {/* Recent Tasks Section */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Recent Tasks</h2>
          <Link to="/tasks" className="text-sm text-purple-600 font-medium flex items-center gap-1 hover:underline">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {tasks.length === 0 ? (
          <EmptyState icon={CheckSquare} title="No tasks yet" description="Create your first task to get started" />
        ) : (
          <div className="space-y-3">
            {tasks.slice(0, 6).map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ x: 4 }}
                // CARD CLICK: Navigates to the main tasks page
                onClick={() => navigate('/tasks')}
                className="cursor-pointer bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl p-4 border border-purple-50 dark:border-purple-900/30 shadow-sm shadow-purple-100/10 dark:shadow-purple-900/10 hover:shadow-md transition-all flex items-center gap-4"
              >
                {/* CHECKBOX BUTTON: Handles the toggle logic */}
                <button
                  onClick={(e) => handleToggleStatus(e, task.id, task.status)}
                  className={`w-5 h-5 rounded-lg border-2 flex-shrink-0 transition-colors flex items-center justify-center ${
                    task.status === 'completed' 
                      ? 'bg-purple-500 border-purple-500' 
                      : 'border-purple-200 hover:border-purple-400'
                  }`}
                >
                  {task.status === 'completed' && <Check className="w-3 h-3 text-white" />}
                </button>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium text-gray-800 dark:text-gray-100 truncate ${task.status === 'completed' ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {task.projects && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: task.projects.color + '20', color: task.projects.color }}>
                        {task.projects.name}
                      </span>
                    )}
                    {task.due_date && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDueDate(task.due_date)}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${priorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
    </>
  );
}