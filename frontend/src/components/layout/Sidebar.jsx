import {
  Home, Users, Calendar, Clock, DollarSign,
  FileText, Megaphone, LogOut, Settings, Award,
  ShieldCheck, LayoutDashboard,
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const getLinks = () => {
    if (!user) return [];
    const role = user.role;

    if (role === 'super_admin') return [
      { to: '/super-admin/dashboard', icon: Home,           label: 'Dashboard'     },
      { to: '/super-admin/admins',    icon: ShieldCheck,    label: 'Admins'        },
      { to: '/admin/employees',       icon: Users,          label: 'Employees'     },
      { to: '/admin/attendance',      icon: Clock,          label: 'Attendance'    },
      { to: '/admin/leaves',          icon: Calendar,       label: 'Leaves'        },
      { to: '/admin/payroll',         icon: DollarSign,     label: 'Payroll'       },
      { to: '/admin/announcements',   icon: Megaphone,      label: 'Announcements' },
    ];

    if (role === 'admin') return [
      { to: '/admin/dashboard',       icon: LayoutDashboard,label: 'Dashboard'     },
      { to: '/admin/employees',       icon: Users,          label: 'Employees'     },
      { to: '/admin/attendance',      icon: Clock,          label: 'Attendance'    },
      { to: '/admin/leaves',          icon: Calendar,       label: 'Leaves'        },
      { to: '/admin/payroll',         icon: DollarSign,     label: 'Payroll'       },
      { to: '/admin/announcements',   icon: Megaphone,      label: 'Announcements' },
    ];

    return [
      { to: '/employee/dashboard',    icon: Home,           label: 'Dashboard'     },
      { to: '/employee/leaves',       icon: Calendar,       label: 'Leaves'        },
      { to: '/employee/payroll',      icon: DollarSign,     label: 'Payslips'      },
      { to: '/employee/performance',  icon: Award,          label: 'Performance'   },
      { to: '/employee/documents',    icon: FileText,       label: 'Documents'     },
    ];
  };

  return (
    <aside className="min-h-screen w-64 bg-[#13131A] flex flex-col justify-between py-5 px-4 rounded-2xl flex-shrink-0">

      {/* TOP */}
      <div>
        {/* Logo */}
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="w-9 h-9 bg-[#C8F135] rounded-xl flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#13131A" strokeWidth="2.5"/>
              <path d="M8 12h8M12 8v8" stroke="#13131A" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <span className="text-white font-bold text-base tracking-tight block leading-none">HR Portal</span>
            <span className="text-[#8B8B9E] text-[10px] capitalize">{user?.role?.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="space-y-1">
          {getLinks().map(({ to, icon: Icon, label }) => (
            <NavLink key={to} end to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#C8F135] text-[#13131A]'
                    : 'text-[#8B8B9E] hover:text-white hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* BOTTOM */}
      <div>
        {/* User info */}
        <div className="px-4 py-3 mb-2 rounded-xl bg-white/5 border border-white/5">
          <p className="text-white text-sm font-semibold truncate">{user?.full_name}</p>
          <p className="text-[#8B8B9E] text-xs capitalize mt-0.5">{user?.role?.replace('_', ' ')}</p>
        </div>

        {/* Logout */}
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#8B8B9E] hover:text-red-400 hover:bg-white/5 transition-all duration-200">
          <LogOut size={18} strokeWidth={1.8} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
