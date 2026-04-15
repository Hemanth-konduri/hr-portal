import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { Lock, Eye, EyeOff, AlertCircle, AlertTriangle, ArrowRight, Loader2, ShieldCheck, Building2 } from 'lucide-react';

const ChangePassword = () => {
  const [formData, setFormData] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const toggleShow = (field) => setShow((p) => ({ ...p, [field]: !p[field] }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.new_password !== formData.confirm_password)
      return setError('New passwords do not match');
    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        current_password: formData.current_password,
        new_password: formData.new_password,
      });
      const updatedUser = { ...user, password_reset_required: false };
      login(localStorage.getItem('token'), updatedUser);
      if (user.role === 'super_admin') navigate('/super-admin/dashboard');
      else if (user.role === 'admin') navigate('/admin/dashboard');
      else navigate('/employee/dashboard');
    } catch (err) {
      setError(err.response?.data?.msg || 'Password change failed');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: 'current_password', label: 'Current Password',     placeholder: 'Enter current password',    showKey: 'current' },
    { name: 'new_password',     label: 'New Password',         placeholder: 'Min 8 chars, upper, lower, number, special', showKey: 'new' },
    { name: 'confirm_password', label: 'Confirm New Password', placeholder: 'Re-enter new password',      showKey: 'confirm' },
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
      <div className="absolute inset-0 opacity-[0.3]"
        style={{ backgroundImage: 'radial-gradient(circle, #1C1C1E 1px, transparent 1px)', backgroundSize: '28px 28px' }}
      />

      <div className="relative z-10 w-full max-w-[440px] mx-4">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">

          {/* Accent bar */}
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
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck size={22} className="text-[#1C1C1E]" />
                <h2 className="text-[#1C1C1E] text-[26px] font-bold tracking-tight">Change Password</h2>
              </div>
              <p className="text-gray-400 text-sm">
                {user?.password_reset_required
                  ? 'You must change your password before continuing'
                  : 'Update your account password'}
              </p>
            </div>

            {/* First login warning */}
            {user?.password_reset_required && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 text-amber-700 rounded-2xl px-4 py-3 text-sm mb-5">
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                <span>This is your first login. Please set a new password to continue.</span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-500 rounded-2xl px-4 py-3 text-sm mb-5">
                <AlertCircle size={16} className="flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={onSubmit} className="space-y-4">
              {fields.map(({ name, label, placeholder, showKey }) => (
                <div key={name}>
                  <label className="block text-[#1C1C1E] text-[11px] font-bold mb-2 uppercase tracking-widest">
                    {label}
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300">
                      <Lock size={15} />
                    </div>
                    <input
                      type={show[showKey] ? 'text' : 'password'}
                      name={name}
                      placeholder={placeholder}
                      value={formData[name]}
                      onChange={onChange}
                      required
                      className="w-full bg-[#F7F7F7] text-[#1C1C1E] placeholder-gray-300 rounded-2xl pl-11 pr-12 py-3.5 text-sm outline-none border-2 border-transparent focus:border-[#1C1C1E] focus:bg-white transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShow(showKey)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1C1C1E] transition-colors"
                    >
                      {show[showKey] ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1C1C1E] text-white rounded-2xl py-4 text-sm font-bold tracking-wide hover:bg-[#2d2d2d] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> Updating...</>
                ) : (
                  <>Update Password <ArrowRight size={16} /></>
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-gray-400 text-xs mt-5">
          Need help? Contact your <span className="text-[#1C1C1E] font-semibold">HR Administrator</span>
        </p>
      </div>
    </div>
  );
};

export default ChangePassword;