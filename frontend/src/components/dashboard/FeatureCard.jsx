export default function FeatureCard({ icon, title, lessons, category, accent }) {
  return (
    <article className="rounded-[30px] border border-slate-800/90 bg-slate-900/95 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.18)] transition hover:-translate-y-1 hover:border-lime-300/40">
      <div className={`inline-flex items-center justify-center rounded-[18px] p-3 ${accent}`}>
        {icon}
      </div>
      <div className="mt-5">
        <h4 className="text-base font-semibold text-slate-100">{title}</h4>
        <p className="mt-2 text-sm text-slate-400">{lessons} Lessons</p>
      </div>
      {category && <span className="mt-4 inline-flex rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-400">{category}</span>}
    </article>
  );
}
