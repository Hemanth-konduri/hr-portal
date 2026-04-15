import { Bell, Search, UserCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Header({ title }) {
  const { user } = useAuth();
  
  return (
    <header className="h-20 glass border-b border-border flex items-center justify-between px-8 z-10 sticky top-0">
      <h2 className="text-2xl font-bold text-text-main">{title || 'Dashboard'}</h2>
      
      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input 
            type="text" 
            placeholder="Search..." 
            className="pl-10 pr-4 py-2 bg-surface border border-border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 w-64 transition-all"
          />
        </div>
        
        <button className="relative text-text-muted hover:text-amber-500 transition-colors">
          <Bell size={22} />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-6 border-l border-border">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-text-main leading-tight">{user?.full_name || 'User'}</p>
            <p className="text-xs text-text-muted capitalize">{user?.role?.replace('_', ' ') || 'Role'}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center border border-border">
            {user?.profile_photo ? (
              <img src={user.profile_photo} alt="profile" className="w-full h-full rounded-full object-cover" />
            ) : (
              <UserCircle size={24} className="text-text-muted" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
