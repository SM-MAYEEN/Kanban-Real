import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axiosInstance';
import { useLangStore } from '../store/langStore';
import { translations } from '../utils/translations';

export default function ForgotPassword() {
  const { language } = useLangStore();
  const t = translations[language] || translations.en;
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState({ success: '', error: '' });
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ success: '', error: '' });

    const payload = {
      email: email.trim(),
      newPassword,
    };

    try {
      let res;
      // সরাসরি আমাদের কাস্টম ব্যাকএন্ডে রিসেট রিকোয়েস্ট পাঠানো
      try {
        res = await API.post('/auth/forgot-password', payload);
      } catch (err1) {
        if (err1.response?.status === 404) {
          res = await API.post('/forgot-password', payload);
        } else {
          throw err1;
        }
      }

      setStatus({
        success: res.data?.message || (language === 'bn' ? 'পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে! লগইন পেজে নিয়ে যাওয়া হচ্ছে...' : 'Password updated successfully! Redirecting...'),
        error: '',
      });

      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      console.error('Password reset failure:', err);
      const backendMessage = err.response?.data?.message || err.message;
      setStatus({
        error: backendMessage || (language === 'bn' ? 'পাসওয়ার্ড পরিবর্তন করা যায়নি।' : 'Failed to reset password.'),
        success: '',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#060913] text-slate-100 flex items-center justify-center p-4">
      <div className="luxury-glass-card w-full max-w-md p-6 sm:p-8 rounded-3xl border border-amber-500/30 shadow-2xl relative">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-amber-500/30 mx-auto mb-3">
            K
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">{t.forgotTitle}</h2>
          <p className="text-xs text-slate-400 mt-1">{t.forgotSubtitle}</p>
        </div>

        {status.success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs text-center font-medium">
            {status.success}
          </div>
        )}
        {status.error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center font-medium">
            {status.error}
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">{t.emailLabel}</label>
            <input
              type="email"
              required
              placeholder={t.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0c1322] border border-amber-500/25 text-white text-xs outline-none focus:border-amber-400 transition placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">{t.newPasswordLabel}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder={t.newPasswordPlaceholder}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 rounded-xl bg-[#0c1322] border border-amber-500/25 text-white text-xs outline-none focus:border-amber-400 transition placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-300 text-sm p-1"
              >
                {showPassword ? '👁️' : '🙈'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black text-xs tracking-wider shadow-lg shadow-amber-500/25 transition active:scale-98"
          >
            {loading ? t.processing : t.resetPassBtn}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          <Link to="/login" className="font-bold text-amber-400 hover:text-amber-300">
            {t.backToLogin}
          </Link>
        </p>
      </div>
    </div>
  );
}