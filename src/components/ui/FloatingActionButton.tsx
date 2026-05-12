import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckSquare, FolderKanban, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const actions = [
    { icon: CheckSquare, label: 'New Task', onClick: () => navigate('/tasks?action=create') },
    { icon: FolderKanban, label: 'New Project', onClick: () => navigate('/projects?action=create') },
  ];

  return (
    <div className="fixed bottom-24 lg:bottom-8 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && actions.map((action, i) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => { action.onClick(); setIsOpen(false); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-2xl shadow-lg shadow-purple-100/50 border border-purple-100/50 text-sm font-medium text-gray-700 hover:shadow-xl transition-shadow"
          >
            <action.icon className="w-4 h-4 text-purple-500" />
            {action.label}
          </motion.button>
        ))}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-lg shadow-purple-300/50 flex items-center justify-center"
      >
        <motion.div animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
          {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </motion.div>
      </motion.button>
    </div>
  );
}
