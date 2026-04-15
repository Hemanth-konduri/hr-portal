import { ArrowUpRight } from 'lucide-react';
import PanelCard from './PanelCard';

const courses = [
  { title: '3D Design Course', instructor: 'Michael Andrew', remaining: '8h 45 min', progress: 45 },
  { title: 'Development Basics', instructor: 'Natalia Varman', remaining: '18h 12 min', progress: 75 },
];

export default function CoursesProgress() {
  return (
    <PanelCard title="Course You’re Taking" subtitle="Your active learning path">
      <div className="space-y-4">
        {courses.map((course) => (
          <div key={course.title} className="rounded-[28px] border border-slate-800/90 bg-slate-900/95 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-base font-semibold text-slate-100">{course.title}</h4>
                <p className="mt-2 text-sm text-slate-500">{course.instructor}</p>
              </div>
              <span className="text-xs font-semibold text-slate-400">Remaining</span>
            </div>
            <div className="mt-4 flex items-center justify-between gap-4 text-sm text-slate-400">
              <p>{course.remaining}</p>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-950/90 px-3 py-1 text-xs font-semibold text-lime-300">
                <ArrowUpRight size={14} /> {course.progress}%
              </div>
            </div>
            <div className="mt-4 h-2 rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-lime-300" style={{ width: `${course.progress}%` }} />
            </div>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}
