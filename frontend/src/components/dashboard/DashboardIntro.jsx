import { Search } from 'lucide-react';
import PanelCard from './PanelCard';

export default function DashboardIntro({ userName = 'Taylor' }) {
  return (
    <PanelCard title={`Welcome back ${userName}`} subtitle="Your HR overview for today" className="overflow-hidden">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm text-slate-400">Monitor recent leave approvals, employee activity, and company announcements from one dashboard.</p>
        </div>

        <div className="flex w-full max-w-xl items-center gap-3 rounded-[999px] border border-slate-800/90 bg-slate-900/95 px-4 py-3 shadow-[0_20px_70px_rgba(15,23,42,0.12)]">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search employees, approvals, announcements"
            className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
        </div>
      </div>
    </PanelCard>
  );
}
