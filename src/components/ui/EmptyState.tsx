import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-purple-300" />
      </div>
      <h3 className="text-lg font-bold text-gray-700 mb-2">{title}</h3>
      <p className="text-sm text-gray-400 max-w-xs mb-6">{description}</p>
      {actionLabel && onAction && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAction}
          className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl text-sm font-medium shadow-lg shadow-purple-200/50"
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  );
}
