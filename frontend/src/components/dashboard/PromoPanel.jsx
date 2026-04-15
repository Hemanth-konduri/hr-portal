import { Sparkles } from 'lucide-react';

export default function PromoPanel() {
  return (
    <section className="rounded-[36px] border border-lime-300/20 bg-gradient-to-br from-lime-400/10 via-slate-950/40 to-slate-950/95 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.24)]">
      <div className="flex flex-col gap-5 rounded-[32px] border border-slate-800/90 bg-slate-950/95 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Go Premium</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-100">Explore 25k+ courses with lifetime membership</h3>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-[20px] bg-lime-300 text-slate-950 shadow-lg shadow-lime-300/20">
            <Sparkles size={20} />
          </div>
        </div>
        <button className="inline-flex items-center justify-center rounded-[28px] bg-lime-300 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-lime-300/20 transition hover:bg-lime-200">
          Get Access
        </button>
      </div>
    </section>
  );
}
