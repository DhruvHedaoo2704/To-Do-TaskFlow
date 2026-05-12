import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { LogOut, Moon, Sun, Bell, Shield, HelpCircle, ChevronRight } from 'lucide-react';

export default function Settings() {
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useToast();

  const settingsGroups = [
    {
      title: 'Preferences',
      items: [
        {
          icon: theme === 'dark' ? Moon : Sun,
          label: 'Dark Mode',
          description: 'Switch between light and dark theme',
          action: (
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
          ),
        },
        {
          icon: Bell,
          label: 'Notifications',
          description: 'Manage notification preferences',
          action: <ChevronRight className="w-5 h-5 text-gray-300" />,
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          icon: Shield,
          label: 'Privacy & Security',
          description: 'Manage your account security',
          action: <ChevronRight className="w-5 h-5 text-gray-300" />,
        },
        {
          icon: HelpCircle,
          label: 'Help & Support',
          description: 'Get help or send feedback',
          action: <ChevronRight className="w-5 h-5 text-gray-300" />,
        },
      ],
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto min-h-screen bg-white dark:bg-gray-950">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage your preferences</p>
      </motion.div>

      <div className="space-y-6">
        {settingsGroups.map((group, gi) => (
          <motion.div
            key={group.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gi * 0.1 }}
            className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl border border-purple-50 dark:border-purple-900/30 shadow-lg shadow-purple-100/10 dark:shadow-purple-900/10 overflow-hidden"
          >
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 pt-5 pb-2">
              {group.title}
            </h3>
            {group.items.map((setting) => (
              <div
                key={setting.label}
                className="flex items-center gap-4 px-6 py-4 hover:bg-purple-50/30 dark:hover:bg-purple-900/20 transition-colors"
              >
                <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <setting.icon className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{setting.label}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{setting.description}</p>
                </div>
                {setting.action}
              </div>
            ))}
          </motion.div>
        ))}

        {/* Sign Out */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={async () => {
            await signOut();
            addToast('Signed out', 'info');
          }}
          className="w-full flex items-center gap-4 px-6 py-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl border border-red-100 dark:border-red-900/30 shadow-lg shadow-red-100/10 dark:shadow-red-900/10 text-red-500 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/20 transition-colors"
        >
          <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
            <LogOut className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium">Sign Out</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Sign out of your account</p>
          </div>
        </motion.button>
      </div>
    </div>
  );
}
