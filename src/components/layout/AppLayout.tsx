import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import FloatingActionButton from '../ui/FloatingActionButton';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen pb-20 lg:pb-0">
        <Outlet />
      </main>
      <BottomNav />
      <FloatingActionButton />
    </div>
  );
}
