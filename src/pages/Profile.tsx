import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import {
  Mail, Flame, Trophy, Edit3, Save,
  Award, Star, Zap, Target,
} from 'lucide-react';
import { format } from 'date-fns';

interface Profile {
  full_name: string;
  avatar_url: string;
  theme: string;
  streak_count: number;
  last_active_date: string | null;
  created_at: string;
}

interface Achievement {
  id: string;
  type: string;
  earned_at: string;
}

const achievementInfo: Record<string, { label: string; icon: typeof Star; color: string }> = {
  first_task: { label: 'First Task', icon: Star, color: 'from-amber-400 to-amber-500' },
  streak_3: { label: '3-Day Streak', icon: Flame, color: 'from-orange-400 to-red-500' },
  streak_7: { label: '7-Day Streak', icon: Flame, color: 'from-red-400 to-red-600' },
  completed_10: { label: '10 Tasks Done', icon: Target, color: 'from-emerald-400 to-emerald-600' },
  completed_50: { label: '50 Tasks Done', icon: Trophy, color: 'from-purple-400 to-purple-600' },
  power_user: { label: 'Power User', icon: Zap, color: 'from-blue-400 to-blue-600' },
};

export default function Profile() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [taskStats, setTaskStats] = useState({ total: 0, completed: 0 });

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [profRes, achRes, taskRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('achievements').select('*').eq('user_id', user.id).order('earned_at', { ascending: false }),
      supabase.from('tasks').select('status').eq('user_id', user.id),
    ]);

    if (profRes.data) {
      setProfile(profRes.data as Profile);
      setName(profRes.data.full_name);
    }
    if (achRes.data) setAchievements(achRes.data as Achievement[]);
    if (taskRes.data) {
      setTaskStats({
        total: taskRes.data.length,
        completed: taskRes.data.filter((t: any) => t.status === 'completed').length,
      });
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveProfile = async () => {
    if (!user) return;
    await supabase.from('profiles').update({ full_name: name }).eq('id', user.id);
    addToast('Profile updated', 'success');
    setEditing(false);
    fetchData();
  };

  const initials = (profile?.full_name || user?.email || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm rounded-3xl border border-purple-50 shadow-xl shadow-purple-100/10 overflow-hidden mb-6"
      >
        <div className="h-32 bg-gradient-to-br from-purple-500 to-purple-700 relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3N2Zz4=')] opacity-50" />
        </div>

        <div className="px-6 pb-6 -mt-12 relative">
          <div className="flex items-end gap-4 mb-6">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-purple-300/40 border-4 border-white">
              {initials}
            </div>
            <div className="flex-1 pb-1">
              {editing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="px-3 py-2 bg-purple-50 border border-purple-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                  />
                  <button onClick={saveProfile} className="p-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors">
                    <Save className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-800">{profile?.full_name || 'Set your name'}</h2>
                  <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-purple-50 text-gray-400 hover:text-purple-500 transition-colors">
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              )}
              <p className="text-sm text-gray-400 flex items-center gap-1 mt-0.5">
                <Mail className="w-3.5 h-3.5" /> {user?.email}
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-purple-50/50 rounded-2xl">
              <p className="text-xl font-bold text-gray-800">{taskStats.total}</p>
              <p className="text-xs text-gray-400">Total Tasks</p>
            </div>
            <div className="text-center p-3 bg-emerald-50/50 rounded-2xl">
              <p className="text-xl font-bold text-gray-800">{taskStats.completed}</p>
              <p className="text-xs text-gray-400">Completed</p>
            </div>
            <div className="text-center p-3 bg-orange-50/50 rounded-2xl">
              <p className="text-xl font-bold text-gray-800">{profile?.streak_count || 0}</p>
              <p className="text-xs text-gray-400">Day Streak</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/80 backdrop-blur-sm rounded-3xl border border-purple-50 shadow-lg shadow-purple-100/10 p-6 mb-6"
      >
        <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-purple-500" /> Achievements
        </h3>

        {achievements.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Complete tasks to earn achievements</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {achievements.map((ach) => {
              const info = achievementInfo[ach.type] || { label: ach.type, icon: Star, color: 'from-gray-400 to-gray-500' };
              const Icon = info.icon;
              return (
                <motion.div
                  key={ach.id}
                  whileHover={{ scale: 1.05 }}
                  className="flex flex-col items-center p-4 bg-purple-50/30 rounded-2xl"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${info.color} flex items-center justify-center mb-2 shadow-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs font-medium text-gray-700">{info.label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{format(parseISO(ach.earned_at), 'MMM d')}</p>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Theme Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/80 backdrop-blur-sm rounded-3xl border border-purple-50 shadow-lg shadow-purple-100/10 p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-800">Appearance</h3>
            <p className="text-sm text-gray-400">Toggle between light and dark mode</p>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative w-14 h-8 rounded-full transition-colors ${theme === 'dark' ? 'bg-purple-500' : 'bg-gray-200'}`}
          >
            <motion.div
              animate={{ x: theme === 'dark' ? 24 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="w-6 h-6 bg-white rounded-full shadow-md absolute top-1"
            />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function parseISO(s: string): Date {
  return new Date(s);
}
