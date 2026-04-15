import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import {
  MapPin, DollarSign, Calendar, BarChart2,
  FolderOpen, Megaphone, Eye, EyeOff,
  Building2, ShieldCheck, User, Briefcase,
  AlertCircle, ArrowRight, Loader2
} from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', formData);
      const { token, user } = res.data;
      login(token, user);
      if (user.password_reset_required) { navigate('/change-password'); return; }
      if (user.role === 'super_admin') navigate('/super-admin/dashboard');
      else if (user.role === 'admin') navigate('/admin/dashboard');
      else navigate('/employee/dashboard');
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const floatingCards = [
    { top: '8%',  left: '3%',  Icon: MapPin,      label: 'Live Attendance',  sub: '56 checked in today',  bg: 'bg-blue-50',   iconColor: 'text-blue-500' },
    { top: '8%',  right: '3%', Icon: DollarSign,  label: 'Payroll',          sub: 'June payslips ready',  bg: 'bg-green-50',  iconColor: 'text-green-500' },
    { top: '40%', left: '1%',  Icon: Calendar,    label: 'Leave Requests',   sub: '3 pending approval',   bg: 'bg-orange-50', iconColor: 'text-orange-500' },
    { top: '40%', right: '1%', Icon: BarChart2,   label: 'Performance',      sub: 'Q2 reviews due soon',  bg: 'bg-purple-50', iconColor: 'text-purple-500' },
    { top: '72%', left: '3%',  Icon: FolderOpen,  label: 'Documents',        sub: '12 new uploads',       bg: 'bg-yellow-50', iconColor: 'text-yellow-500' },
    { top: '72%', right: '3%', Icon: Megaphone,   label: 'Announcements',    sub: '2 new notices',        bg: 'bg-red-50',    iconColor: 'text-red-500' },
  ];

  const pills = [
    { top: '22%', left: '22%',  text: '78 Employees',    color: 'bg-[#1C1C1E] text-white' },
    { top: '22%', right: '22%', text: '71% Attendance',  color: 'bg-white text-[#1C1C1E]' },
    { top: '78%', left: '22%',  text: '5 On Leave',      color: 'bg-white text-[#1C1C1E]' },
    { top: '78%', right: '22%', text: 'Payroll Active ✓', color: 'bg-[#1C1C1E] text-white' },
  ];

  const roles = [
    { label: 'Super Admin', Icon: ShieldCheck },
    { label: 'HR Admin',    Icon: User },
    { label: 'Employee',    Icon: Briefcase },
  ];

  return (
    <div className="min-h-screen bg-[#ECECEC] flex items-center justify-center relative overflow-hidden">

      {/* Decorative circles */}
      <div className="absolute top-[-180px] left-[-180px] w-[500px] h-[500px] rounded-full bg-[#1C1C1E] opacity-[0.06]" />
      <div className="absolute bottom-[-200px] right-[-200px] w-[550px] h-[550px] rounded-full bg-[#1C1C1E] opacity-[0.06]" />
      <div className="absolute top-[40%] left-[-100px] w-[300px] h-[300px] rounded-full bg-[#1C1C1E] opacity-[0.04]" />
      <div className="absolute top-[-60px] right-[25%] w-[200px] h-[200px] rounded-full bg-[#1C1C1E] opacity-[0.04]" />
      <div className="absolute bottom-[-40px] left-[30%] w-[180px] h-[180px] rounded-full bg-[#1C1C1E] opacity-[0.04]" />

      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.3]"
        style={{
          backgroundImage: 'radial-gradient(circle, #1C1C1E 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Floating feature cards */}
      {floatingCards.map(({ label, sub, Icon, bg, iconColor, top, left, right }) => (
        <div
          key={label}
          className="hidden xl:flex absolute items-center gap-3 bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-sm border border-gray-100 w-[215px]"
          style={{ top, left, right }}
        >
          <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
            <Icon size={16} className={iconColor} />
          </div>
          <div>
            <p className="text-[#1C1C1E] text-xs font-semibold leading-tight">{label}</p>
            <p className="text-gray-400 text-[11px] mt-0.5">{sub}</p>
          </div>
        </div>
      ))}

      {/* Floating stat pills */}
      {pills.map(({ text, color, top, left, right }) => (
        <div
          key={text}
          className={`hidden xl:flex absolute items-center gap-2 ${color} rounded-full px-4 py-2 text-xs font-semibold shadow-sm`}
          style={{ top, left, right }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
          {text}
        </div>
      ))}

      {/* ── LOGIN CARD ── */}
      <div className="relative z-10 w-full max-w-[440px] mx-4">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">

          {/* Card top accent bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-gray-800 via-gray-600 to-gray-400" />

          <div className="p-10">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-11 h-11 bg-[#1C1C1E] rounded-2xl flex items-center justify-center flex-shrink-0">
                <Building2 size={20} className="text-white" />
              </div>
              <div>
                <p className="text-[#1C1C1E] text-sm font-bold leading-none tracking-tight">HR Portal</p>
                <p className="text-gray-400 text-[11px] mt-0.5 tracking-wide">Workforce Management System</p>
              </div>
            </div>

            {/* Heading */}
            <div className="mb-7">
              <h2 className="text-[#1C1C1E] text-[26px] font-bold mb-1 tracking-tight">Welcome back 👋</h2>
              <p className="text-gray-400 text-sm">Sign in to your account to continue</p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-500 rounded-2xl px-4 py-3 text-sm mb-5">
                <AlertCircle size={16} className="flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={onSubmit} className="space-y-4">

              {/* Email */}
              <div>
                <label className="block text-[#1C1C1E] text-[11px] font-bold mb-2 uppercase tracking-widest">
                  Email address
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={onChange}
                  required
                  className="w-full bg-[#F7F7F7] text-[#1C1C1E] placeholder-gray-300 rounded-2xl px-4 py-3.5 text-sm outline-none border-2 border-transparent focus:border-[#1C1C1E] focus:bg-white transition-all duration-200"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[#1C1C1E] text-[11px] font-bold uppercase tracking-widest">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-gray-400 text-xs hover:text-[#1C1C1E] transition-colors font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={onChange}
                    required
                    className="w-full bg-[#F7F7F7] text-[#1C1C1E] placeholder-gray-300 rounded-2xl px-4 py-3.5 pr-14 text-sm outline-none border-2 border-transparent focus:border-[#1C1C1E] focus:bg-white transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1C1C1E] transition-colors"
                  >
                    {showPassword
                      ? <EyeOff size={16} />
                      : <Eye size={16} />
                    }
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1C1C1E] text-white rounded-2xl py-4 text-sm font-bold tracking-wide hover:bg-[#2d2d2d] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-gray-300 text-[11px] font-medium tracking-wide">secured with JWT</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Role chips */}
            <div className="flex gap-2 justify-center">
              {roles.map(({ label, Icon }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 bg-[#F7F7F7] rounded-xl px-3 py-2 border border-gray-100 hover:border-gray-300 transition-colors"
                >
                  <Icon size={12} className="text-gray-400" />
                  <span className="text-[11px] text-gray-500 font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Below card */}
        <p className="text-center text-gray-400 text-xs mt-5">
          Need access? Contact your{' '}
          <span className="text-[#1C1C1E] font-semibold">HR Administrator</span>
        </p>
      </div>
    </div>
  );
};

export default Login;