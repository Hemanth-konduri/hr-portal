import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { KeyRound, Mail, Eye, EyeOff, AlertCircle, ArrowRight, ArrowLeft, Loader2, Building2, CheckCircle2, Hash } from 'lucide-react';

const ResetPassword = () => {
  const [formData, setFormData] = useState({ email: '', token: '', new_password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', formData);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

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

            {success ? (
              /* ── SUCCESS STATE ── */
              <div className="text-center">
                <div className="w-16 h-16 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-5">
                  <CheckCircle2 size={32} className="text-green-500" />
                </div>
                <h2 className="text-[#1C1C1E] text-2xl font-bold tracking-tight mb-2">Password Reset!</h2>
                <p className="text-gray-400 text-sm mb-3 leading-relaxed">
                  Your password has been successfully updated.
                </p>
                <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
                  <Loader2 size={12} className="animate-spin" />
                  Redirecting to login in 3 seconds...
                </div>
              </div>
            ) : (
              /* ── FORM STATE ── */
              <>
                <div className="mb-7">
                  <div className="flex items-center gap-2 mb-1">
                    <KeyRound size={22} className="text-[#1C1C1E]" />
                    <h2 className="text-[#1C1C1E] text-[26px] font-bold tracking-tight">Reset Password</h2>
                  </div>
                  <p className="text-gray-400 text-sm">Enter the OTP from your email and set a new password</p>
                </div>

                {error && (
                  <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-500 rounded-2xl px-4 py-3 text-sm mb-5">
                    <AlertCircle size={16} className="flex-shrink-0" />
                    {error}
                  </div>
                )}

                <form onSubmit={onSubmit} className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-[#1C1C1E] text-[11px] font-bold mb-2 uppercase tracking-widest">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300">
                        <Mail size={15} />
                      </div>
                      <input
                        type="email"
                        name="email"
                        placeholder="Your registered email"
                        value={formData.email}
                        onChange={onChange}
                        required
                        className="w-full bg-[#F7F7F7] text-[#1C1C1E] placeholder-gray-300 rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none border-2 border-transparent focus:border-[#1C1C1E] focus:bg-white transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* OTP */}
                  <div>
                    <label className="block text-[#1C1C1E] text-[11px] font-bold mb-2 uppercase tracking-widest">
                      OTP Code
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300">
                        <Hash size={15} />
                      </div>
                      <input
                        type="text"
                        name="token"
                        placeholder="000000"
                        maxLength={6}
                        value={formData.token}
                        onChange={onChange}
                        required
                        className="w-full bg-[#F7F7F7] text-[#1C1C1E] placeholder-gray-300 rounded-2xl pl-11 pr-4 py-3.5 text-xl font-bold tracking-[0.5em] text-center outline-none border-2 border-transparent focus:border-[#1C1C1E] focus:bg-white transition-all duration-200"
                      />
                    </div>
                    <p className="text-gray-400 text-[11px] mt-1.5 ml-1">Enter the 6-digit code sent to your email</p>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-[#1C1C1E] text-[11px] font-bold mb-2 uppercase tracking-widest">
                      New Password
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300">
                        <KeyRound size={15} />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="new_password"
                        placeholder="Min 8 chars, upper, lower, number, special"
                        value={formData.new_password}
                        onChange={onChange}
                        required
                        className="w-full bg-[#F7F7F7] text-[#1C1C1E] placeholder-gray-300 rounded-2xl pl-11 pr-12 py-3.5 text-sm outline-none border-2 border-transparent focus:border-[#1C1C1E] focus:bg-white transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1C1C1E] transition-colors"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#1C1C1E] text-white rounded-2xl py-4 text-sm font-bold tracking-wide hover:bg-[#2d2d2d] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
                  >
                    {loading ? (
                      <><Loader2 size={16} className="animate-spin" /> Resetting...</>
                    ) : (
                      <>Reset Password <ArrowRight size={16} /></>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        {/* Footer links */}
        <div className="flex items-center justify-center gap-4 mt-5">
          <Link to="/forgot-password" className="flex items-center gap-1.5 text-gray-400 text-xs font-medium hover:text-[#1C1C1E] transition-colors">
            <ArrowLeft size={13} /> Resend OTP
          </Link>
          <span className="text-gray-300">·</span>
          <Link to="/login" className="flex items-center gap-1.5 text-gray-400 text-xs font-medium hover:text-[#1C1C1E] transition-colors">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;