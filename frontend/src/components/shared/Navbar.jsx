import { Search, ChevronDown, Building2 } from 'lucide-react';

const Navbar = ({ userName = 'Admin' }) => {
  return (
    <header className="sticky top-0 z-50">
      <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 rounded-[36px] border border-slate-800/90 bg-slate-950/95 p-4 shadow-[0_20px_80px_rgba(15,23,42,0.24)] backdrop-blur-xl md:flex-row md:items-center md:justify-between md:px-5 md:py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-[28px] bg-slate-900 text-lime-300 shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
              <Building2 size={20} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">HR Portal</p>
              <p className="text-lg font-semibold text-slate-100">Welcome back {userName} <span role="img" aria-label="wave">👋</span></p>
            </div>
          </div>

          <div className="flex flex-1 min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-end md:gap-4">
            <div className="hidden w-full max-w-sm items-center gap-3 rounded-[999px] border border-slate-800 bg-slate-900/95 px-4 py-3 text-slate-100 shadow-[0_18px_40px_rgba(15,23,42,0.15)] md:flex">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                placeholder="Search dashboard"
                className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-3 rounded-[28px] border border-slate-800 bg-slate-900/95 px-4 py-3 text-slate-100 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
              <div className="flex h-11 w-11 items-center justify-center rounded-[22px] bg-lime-300 text-slate-950 font-semibold shadow-lg shadow-lime-300/30">
                {userName?.charAt(0) || 'A'}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-slate-100">{userName}</p>
                <p className="text-xs text-slate-400">Administrator</p>
              </div>
              <ChevronDown size={16} className="text-slate-400" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
