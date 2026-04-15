export default function PanelCard({ title, subtitle, action, icon: Icon, children, className = '', dark = false }) {
  const card  = dark ? 'bg-[#13131A] border-slate-800/90' : 'bg-white border-gray-200';
  const head  = dark ? 'text-slate-100' : 'text-gray-900';
  const sub   = dark ? 'text-slate-400' : 'text-gray-500';
  const ico   = dark ? 'bg-slate-900 text-[#C8F135]' : 'bg-gray-100 text-amber-500';
  const act   = dark ? 'text-[#C8F135]' : 'text-amber-500';

  return (
    <section className={`rounded-2xl border p-6 shadow-sm ${card} ${className}`}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${ico}`}>
              <Icon size={20} />
            </div>
          )}
          <div>
            <h3 className={`text-base font-semibold ${head}`}>{title}</h3>
            {subtitle && <p className={`text-sm mt-0.5 ${sub}`}>{subtitle}</p>}
          </div>
        </div>
        {action && <div className={`text-sm font-semibold ${act}`}>{action}</div>}
      </div>
      {children}
    </section>
  );
}
