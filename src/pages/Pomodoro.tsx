import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import ProgressRing from '../components/ui/ProgressRing';
import { Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react';

type Mode = 'focus' | 'shortBreak' | 'longBreak';

const durations: Record<Mode, number> = {
  focus: 25,
  shortBreak: 5,
  longBreak: 15,
};

const modeColors: Record<Mode, string> = {
  focus: '#8B5CF6',
  shortBreak: '#10B981',
  longBreak: '#3B82F6',
};

const modeLabels: Record<Mode, string> = {
  focus: 'Focus',
  shortBreak: 'Short Break',
  longBreak: 'Long Break',
};

export default function Pomodoro() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [mode, setMode] = useState<Mode>('focus');
  const [timeLeft, setTimeLeft] = useState(durations.focus * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const totalTime = durations[mode] * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  const switchMode = useCallback((newMode: Mode) => {
    setMode(newMode);
    setTimeLeft(durations[newMode] * 60);
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          if (mode === 'focus') {
            const newSessions = sessions + 1;
            setSessions(newSessions);
            addToast('Focus session complete! Take a break.', 'success');
            // Log activity
            if (user) {
              supabase.from('activity_logs').insert({
                user_id: user.id,
                action: 'pomodoro_complete',
                entity_type: 'pomodoro',
                details: { mode, sessions: newSessions },
              }).then(() => {});
            }
            switchMode(newSessions % 4 === 0 ? 'longBreak' : 'shortBreak');
          } else {
            addToast('Break over! Time to focus.', 'info');
            switchMode('focus');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode, sessions, addToast, switchMode, user]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(durations[mode] * 60);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Focus Timer</h1>
        <p className="text-sm text-gray-500">Stay productive with the Pomodoro technique</p>
      </motion.div>

      {/* Mode Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 mb-8 justify-center"
      >
        {(['focus', 'shortBreak', 'longBreak'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`px-4 py-2.5 rounded-2xl text-sm font-medium transition-all ${
              mode === m
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-200/50'
                : 'bg-white/80 text-gray-500 border border-purple-50 hover:bg-purple-50/50'
            }`}
          >
            {modeLabels[m]}
          </button>
        ))}
      </motion.div>

      {/* Timer */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white/80 backdrop-blur-sm rounded-3xl border border-purple-50 shadow-xl shadow-purple-100/10 p-8 sm:p-12 flex flex-col items-center"
      >
        <ProgressRing
          progress={progress}
          size={220}
          strokeWidth={10}
          color={modeColors[mode]}
          bgColor="#f3f0ff"
        >
          <div className="text-center">
            <p className="text-5xl font-bold text-gray-800 tabular-nums">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </p>
            <p className="text-sm text-gray-400 mt-1">{modeLabels[mode]}</p>
          </div>
        </ProgressRing>

        {/* Controls */}
        <div className="flex items-center gap-4 mt-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetTimer}
            className="w-12 h-12 rounded-2xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <RotateCcw className="w-5 h-5 text-gray-500" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTimer}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-white flex items-center justify-center shadow-xl shadow-purple-300/40"
          >
            {isRunning ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
          </motion.button>

          <div className="w-12 h-12" /> {/* Spacer for alignment */}
        </div>

        {/* Sessions Counter */}
        <div className="mt-8 flex items-center gap-2 text-sm text-gray-400">
          <Brain className="w-4 h-4" />
          <span>{sessions} sessions completed today</span>
        </div>
      </motion.div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 bg-purple-50/50 rounded-3xl p-6 border border-purple-100/50"
      >
        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <Coffee className="w-4 h-4 text-purple-500" /> Pomodoro Tips
        </h3>
        <ul className="space-y-2 text-sm text-gray-500">
          <li>Focus for 25 minutes, then take a 5-minute break</li>
          <li>After 4 focus sessions, take a longer 15-minute break</li>
          <li>Remove distractions during focus time</li>
          <li>Use breaks to stretch, hydrate, or rest your eyes</li>
        </ul>
      </motion.div>
    </div>
  );
}
