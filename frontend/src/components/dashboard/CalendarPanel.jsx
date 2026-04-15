import { CalendarDays } from 'lucide-react';
import PanelCard from './PanelCard';

const assignments = [
  { title: 'Methods of data', due: '02 July, 10:30 AM', status: 'In progress' },
  { title: 'Market Research', due: '14 June, 12:45 AM', status: 'Completed' },
  { title: 'Data Collection', due: '12 May, 11:00 AM', status: 'Upcoming' },
];

const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function CalendarPanel() {
  return (
    <div className="space-y-6">
      <PanelCard title="Daily Calendar" icon={CalendarDays} subtitle="Stay on schedule" className="p-5">
        <div className="grid gap-4 rounded-[32px] border border-slate-800/90 bg-slate-900/95 p-4">
          <div className="rounded-[28px] border border-slate-800/90 bg-slate-950/95 p-4">
            <div className="flex items-center justify-between text-sm text-slate-400">
              <button className="rounded-full border border-slate-700 px-3 py-1">←</button>
              <span className="font-semibold text-slate-100">August, 2023</span>
              <button className="rounded-full border border-slate-700 px-3 py-1">→</button>
            </div>
            <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs text-slate-500">
              {weekDays.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-7 gap-2 text-center text-sm text-slate-100">
              {Array.from({ length: 35 }).map((_, index) => {
                const day = index + 1;
                const isCurrent = day === 17;
                return (
                  <div
                    key={index}
                    className={`rounded-3xl py-2 ${isCurrent ? 'bg-lime-300 text-slate-950' : 'hover:bg-slate-800/80'}`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </PanelCard>

      <PanelCard title="Assignments" subtitle="Track your progress" className="p-5">
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <div key={assignment.title} className="flex items-center justify-between rounded-[28px] border border-slate-800/90 bg-slate-900/95 p-4">
              <div>
                <p className="font-semibold text-slate-100">{assignment.title}</p>
                <p className="text-xs text-slate-500">{assignment.due}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                assignment.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-300' :
                assignment.status === 'Upcoming' ? 'bg-sky-500/10 text-sky-300' :
                'bg-amber-500/10 text-amber-300'
              }`}>{assignment.status}</span>
            </div>
          ))}
        </div>
      </PanelCard>
    </div>
  );
}
