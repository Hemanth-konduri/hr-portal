import { Activity, Clock } from 'lucide-react';
import PanelCard from './PanelCard';

const scheduleItems = [
  { title: 'Design System', type: 'Lecture · Class', time: '8:00 AM' },
  { title: 'Typography', type: 'Group · Test', time: '10:30 AM' },
  { title: 'Color Style', type: 'Group · Test', time: '1:00 PM' },
  { title: 'Visual Design', type: 'Lecture · Test', time: '3:45 PM' },
];

export default function ActivityPanel() {
  return (
    <PanelCard title="Hours Activity" subtitle="Weekly performance" icon={Activity} action="+3%">
      <div className="grid gap-6 lg:grid-cols-[1.5fr_0.95fr]">
        <div className="rounded-[32px] bg-slate-900/90 p-5">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">This week</p>
              <h4 className="text-3xl font-semibold text-slate-100">6h 45m</h4>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">+3%</span>
          </div>
          <div className="space-y-3">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, index) => (
              <div key={day} className="flex items-end gap-3">
                <span className="w-8 text-xs text-slate-500">{day}</span>
                <div className="flex-1 rounded-full bg-slate-800 h-2.5">
                  <div className={`h-2.5 rounded-full bg-lime-300 ${['w-1/5', 'w-2/5', 'w-3/5', 'w-4/5', 'w-5/6', 'w-4/5', 'w-3/5'][index]}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-[32px] bg-slate-900/95 p-5">
          <div className="flex items-center gap-3 rounded-[24px] border border-slate-800/90 bg-slate-950/90 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-slate-800 text-lime-300">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-100">Daily Schedule</p>
              <p className="text-xs text-slate-500">Stay on track with your agenda</p>
            </div>
          </div>
          <div className="space-y-3">
            {scheduleItems.map((item, idx) => (
              <div key={idx} className="rounded-[24px] border border-slate-800/90 bg-slate-950/90 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-100">{item.title}</p>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">{item.time}</span>
                </div>
                <p className="mt-2 text-xs text-slate-500">{item.type}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PanelCard>
  );
}
