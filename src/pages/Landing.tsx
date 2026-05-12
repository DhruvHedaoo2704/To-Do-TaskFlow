import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Zap, BarChart3, Calendar, ArrowRight, Sparkles } from 'lucide-react';

const features = [
  { icon: CheckSquare, title: 'Smart Tasks', desc: 'Organize, prioritize, and track every task with ease.' },
  { icon: Calendar, title: 'Calendar View', desc: 'Plan your days and weeks with a beautiful calendar.' },
  { icon: BarChart3, title: 'Analytics', desc: 'Track your productivity with insightful charts.' },
  { icon: Zap, title: 'Focus Timer', desc: 'Stay productive with the built-in Pomodoro timer.' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden">
      {/* Hero */}
      <div className="relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-br from-purple-200/30 to-purple-400/10 rounded-full blur-3xl -top-64" />

        <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-200">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
              TaskFlow
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-200 hover:text-purple-600 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl text-sm font-medium shadow-lg shadow-purple-200/50 hover:shadow-xl transition-shadow"
            >
              Get Started
            </button>
          </div>
        </nav>

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/30 rounded-full text-sm text-purple-600 font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              Premium Productivity Suite
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-gray-100 leading-tight mb-6">
              Master Your
              <br />
              <span className="bg-gradient-to-r from-purple-600 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                Productivity
              </span>
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto mb-10">
              The elegant task management app that helps you focus on what matters.
              Beautiful design, powerful features, zero friction.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/register')}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl text-base font-semibold shadow-xl shadow-purple-300/40 flex items-center gap-2"
              >
                Start for Free <ArrowRight className="w-5 h-5" />
              </motion.button>
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-4 bg-white border border-purple-100 text-gray-700 rounded-2xl text-base font-semibold shadow-lg hover:shadow-xl transition-shadow"
              >
                Sign In
              </button>
            </div>
          </motion.div>

          {/* Preview Card */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="mt-16 mx-auto max-w-2xl"
          >
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-purple-200/30 dark:shadow-purple-900/20 border border-purple-100/50 dark:border-purple-900/30 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <div className="space-y-3">
                {['Design new landing page', 'Review pull requests', 'Update documentation'].map((task, i) => (
                  <motion.div
                    key={task}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-purple-50/50 dark:bg-slate-900/40"
                  >
                    <div className={`w-5 h-5 rounded-lg border-2 ${i === 2 ? 'bg-purple-500 border-purple-500' : 'border-purple-200'}`} />
                    <span className={`text-sm ${i === 2 ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-100 font-medium'}`}>{task}</span>
                    <span className={`ml-auto text-xs px-2 py-1 rounded-full ${i === 0 ? 'bg-red-100 text-red-600' : i === 1 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {i === 0 ? 'High' : i === 1 ? 'Medium' : 'Done'}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Everything you need to stay productive
          </h2>
          <p className="text-gray-500 max-w-lg mx-auto">
            Powerful features wrapped in a beautiful, intuitive interface.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-3xl p-6 border border-purple-50 dark:border-purple-900/30 shadow-lg shadow-purple-100/20 dark:shadow-purple-900/20 hover:shadow-xl transition-shadow"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-3xl p-12 text-center shadow-2xl shadow-purple-300/30"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to transform your workflow?
          </h2>
          <p className="text-purple-100 max-w-md mx-auto mb-8">
            Join thousands of productive people who use TaskFlow every day.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/register')}
            className="px-8 py-4 bg-white text-purple-700 rounded-2xl text-base font-semibold shadow-xl flex items-center gap-2 mx-auto"
          >
            Get Started Free <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t border-purple-50 py-8 text-center text-sm text-gray-400">
        Built with care. TaskFlow &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
