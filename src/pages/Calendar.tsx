import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check, Clock } from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isSameDay, parseISO, isToday,
} from 'date-fns';

interface Task {
  id: string;
  title: string;
  priority: string;
  status: string;
  due_date: string | null;
}

export default function CalendarPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const fetchTasks = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('tasks')
      .select('id, title, priority, status, due_date')
      .eq('user_id', user.id)
      .not('due_date', 'is', null);
    if (data) setTasks(data as Task[]);
  }, [user]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);

  const days: Date[] = [];
  let day = calStart;
  while (day <= calEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const tasksForDate = (date: Date) =>
    tasks.filter((t) => t.due_date && isSameDay(parseISO(t.due_date), date));

  const selectedTasks = tasksForDate(selectedDate);

  const priorityDot = (p: string) => {
    if (p === 'high') return 'bg-red-400';
    if (p === 'medium') return 'bg-amber-400';
    return 'bg-emerald-400';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Calendar</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Plan your schedule</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-3xl border border-purple-50 dark:border-purple-900/30 shadow-lg shadow-purple-100/10 dark:shadow-purple-900/10 p-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="w-10 h-10 rounded-xl bg-purple-50 hover:bg-purple-100 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-purple-600" />
            </button>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{format(currentMonth, 'MMMM yyyy')}</h2>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="w-10 h-10 rounded-xl bg-purple-50 hover:bg-purple-100 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-purple-600" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((d, i) => {
              const dayTasks = tasksForDate(d);
              const isSelected = isSameDay(d, selectedDate);
              const isCurrentMonth = isSameMonth(d, currentMonth);

              return (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDate(d)}
                  className={`relative p-2 rounded-2xl text-sm font-medium transition-all min-h-[48px] flex flex-col items-center ${
                    isSelected
                      ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-200/50'
                      : isToday(d)
                      ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-600'
                      : isCurrentMonth
                      ? 'text-gray-700 dark:text-gray-200 hover:bg-purple-50/50 dark:hover:bg-purple-950/40'
                      : 'text-gray-300 dark:text-gray-500'
                  }`}
                >
                  <span>{format(d, 'd')}</span>
                  {dayTasks.length > 0 && (
                    <div className="flex gap-0.5 mt-1">
                      {dayTasks.slice(0, 3).map((t, j) => (
                        <div
                          key={j}
                          className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/70' : priorityDot(t.priority)}`}
                        />
                      ))}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Tasks */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-purple-50 shadow-lg shadow-purple-100/10 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="w-5 h-5 text-purple-500" />
            <h3 className="text-base font-bold text-gray-800">
              {isToday(selectedDate) ? 'Today' : format(selectedDate, 'MMM d')}
            </h3>
          </div>

          {selectedTasks.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No tasks for this day</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedTasks.map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center gap-3 p-3 rounded-2xl ${
                    task.status === 'completed' ? 'bg-emerald-50/50' : 'bg-purple-50/50'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityDot(task.priority)}`} />
                  <span className={`text-sm flex-1 ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-700 font-medium'}`}>
                    {task.title}
                  </span>
                  {task.status === 'completed' && <Check className="w-4 h-4 text-emerald-500" />}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
