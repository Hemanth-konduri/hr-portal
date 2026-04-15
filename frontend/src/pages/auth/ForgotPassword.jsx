import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Mail, AlertCircle, ArrowRight, ArrowLeft, Loader2, Building2, CheckCircle2 } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.msg || 'Something went wrong');
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

            {submitted ? (
              /* ── SUCCESS STATE ── */
              <div className="text-center">
                <div className="w-16 h-16 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-5">
                  <CheckCircle2 size={32} className="text-green-500" />
                </div>
                <h2 className="text-[#1C1C1E] text-2xl font-bold tracking-tight mb-2">OTP Sent!</h2>
                <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                  If <span className="text-[#1C1C1E] font-semibold">{email}</span> is registered, a 6-digit OTP has been sent. Check your inbox.
                </p>
                <Link
                  to="/reset-password"
                  className="w-full bg-[#1C1C1E] text-white rounded-2xl py-4 text-sm font-bold tracking-wide hover:bg-[#2d2d2d] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Enter OTP <ArrowRight size={16} />
                </Link>
                <div className="flex items-center gap-3 mt-6">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-gray-300 text-[11px]">didn't receive it?</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-4 text-[#1C1C1E] text-xs font-semibold hover:underline"
                >
                  Try a different email
                </button>
              </div>
            ) : (
              /* ── FORM STATE ── */
              <>
                <div className="mb-7">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail size={22} className="text-[#1C1C1E]" />
                    <h2 className="text-[#1C1C1E] text-[26px] font-bold tracking-tight">Forgot Password</h2>
                  </div>
                  <p className="text-gray-400 text-sm">Enter your email and we'll send you a reset OTP</p>
                </div>

                {error && (
                  <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-500 rounded-2xl px-4 py-3 text-sm mb-5">
                    <AlertCircle size={16} className="flex-shrink-0" />
                    {error}
                  </div>
                )}

                <form onSubmit={onSubmit} className="space-y-4">
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
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full bg-[#F7F7F7] text-[#1C1C1E] placeholder-gray-300 rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none border-2 border-transparent focus:border-[#1C1C1E] focus:bg-white transition-all duration-200"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#1C1C1E] text-white rounded-2xl py-4 text-sm font-bold tracking-wide hover:bg-[#2d2d2d] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
                  >
                    {loading ? (
                      <><Loader2 size={16} className="animate-spin" /> Sending OTP...</>
                    ) : (
                      <>Send OTP <ArrowRight size={16} /></>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-center mt-5">
          <Link
            to="/login"
            className="flex items-center gap-1.5 text-gray-400 text-xs font-medium hover:text-[#1C1C1E] transition-colors"
          >
            <ArrowLeft size={13} /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;