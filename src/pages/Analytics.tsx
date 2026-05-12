import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { TrendingUp, CheckCircle, Clock, Target } from 'lucide-react';
import { format, subDays, parseISO, isSameDay } from 'date-fns';

const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

export default function Analytics() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id);
    if (data) setTasks(data);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  if (loading) return <DashboardSkeleton />;

  const completed = tasks.filter((t) => t.status === 'completed').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const pending = tasks.filter((t) => t.status === 'pending').length;
  const total = tasks.length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Weekly data (last 7 days)
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayTasks = tasks.filter((t) => t.created_at && isSameDay(parseISO(t.created_at), date));
    const dayCompleted = dayTasks.filter((t) => t.status === 'completed').length;
    return {
      day: format(date, 'EEE'),
      created: dayTasks.length,
      completed: dayCompleted,
    };
  });

  // Priority distribution
  const priorityData = [
    { name: 'High', value: tasks.filter((t) => t.priority === 'high').length },
    { name: 'Medium', value: tasks.filter((t) => t.priority === 'medium').length },
    { name: 'Low', value: tasks.filter((t) => t.priority === 'low').length },
  ].filter((d) => d.value > 0);

  // Status distribution
  const statusData = [
    { name: 'Completed', value: completed },
    { name: 'In Progress', value: inProgress },
    { name: 'Pending', value: pending },
  ].filter((d) => d.value > 0);

  // Category data
  const categoryMap: Record<string, number> = {};
  tasks.forEach((t) => {
    const cat = t.category || 'general';
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });
  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <motion.div variants={item} className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500">Your productivity insights</p>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Tasks', value: total, icon: Target, color: 'from-purple-500 to-purple-600' },
          { label: 'Completed', value: completed, icon: CheckCircle, color: 'from-emerald-500 to-emerald-600' },
          { label: 'In Progress', value: inProgress, icon: Clock, color: 'from-blue-500 to-blue-600' },
          { label: 'Completion Rate', value: `${completionRate}%`, icon: TrendingUp, color: 'from-amber-500 to-amber-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white/80 backdrop-blur-sm rounded-3xl p-5 border border-purple-50 shadow-lg shadow-purple-100/10">
            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 shadow-lg`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Weekly Activity */}
        <motion.div variants={item} className="bg-white/80 backdrop-blur-sm rounded-3xl border border-purple-50 shadow-lg shadow-purple-100/10 p-6">
          <h3 className="text-base font-bold text-gray-800 mb-4">Weekly Activity</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f0ff" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 20px rgba(139,92,246,0.15)' }}
              />
              <Bar dataKey="created" fill="#c4b5fd" radius={[8, 8, 0, 0]} />
              <Bar dataKey="completed" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Status Distribution */}
        <motion.div variants={item} className="bg-white/80 backdrop-blur-sm rounded-3xl border border-purple-50 shadow-lg shadow-purple-100/10 p-6">
          <h3 className="text-base font-bold text-gray-800 mb-4">Status Distribution</h3>
          {statusData.length > 0 ? (
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 20px rgba(139,92,246,0.15)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">No data yet</div>
          )}
          <div className="flex justify-center gap-4 mt-2">
            {statusData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                {d.name}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Breakdown */}
        <motion.div variants={item} className="bg-white/80 backdrop-blur-sm rounded-3xl border border-purple-50 shadow-lg shadow-purple-100/10 p-6">
          <h3 className="text-base font-bold text-gray-800 mb-4">Priority Breakdown</h3>
          {priorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={priorityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f0ff" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={60} />
                <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 20px rgba(139,92,246,0.15)' }} />
                <Bar dataKey="value" fill="#8B5CF6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">No data yet</div>
          )}
        </motion.div>

        {/* Category Distribution */}
        <motion.div variants={item} className="bg-white/80 backdrop-blur-sm rounded-3xl border border-purple-50 shadow-lg shadow-purple-100/10 p-6">
          <h3 className="text-base font-bold text-gray-800 mb-4">Categories</h3>
          {categoryData.length > 0 ? (
            <div className="space-y-3">
              {categoryData.map((cat, i) => {
                const pct = total > 0 ? Math.round((cat.value / total) * 100) : 0;
                return (
                  <div key={cat.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-sm text-gray-700 flex-1 capitalize">{cat.name}</span>
                    <span className="text-sm font-medium text-gray-500">{cat.value}</span>
                    <div className="w-24 bg-gray-100 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-2 rounded-full"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-8">{pct}%</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">No data yet</div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
