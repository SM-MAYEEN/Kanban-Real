import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import API from '../api/axiosInstance';
import { useLangStore } from '../store/langStore';
import { translations } from '../utils/translations';

export default function ForgotPassword() {
  const { language } = useLangStore();
  const t = translations[language] || translations.en;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get('token');

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState({ success: '', error: '' });
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ success: '', error: '' });

    try {
      let res;
      if (resetToken) {
        if (newPassword !== confirmPassword) {
          setStatus({
            success: '',
            error: language === 'bn' ? 'দুটি পাসওয়ার্ড মিলছে না।' : 'The passwords do not match.',
          });
          return;
        }
        res = await API.post('/auth/reset-password', { token: resetToken, newPassword });
      } else {
        res = await API.post('/auth/forgot-password', { email: email.trim() });
      }

      setStatus({
        success: resetToken
          ? (res.data?.message || t.resetSuccessMsg)
          : t.resetLinkSentMsg,
        error: '',
      });

      if (resetToken) {
        setTimeout(() => navigate('/login'), 2000);
      }
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
          <p className="text-xs text-slate-400 mt-1">
            {resetToken
              ? (language === 'bn' ? 'নতুন পাসওয়ার্ড লিখুন।' : 'Choose a new password for your account.')
              : t.forgotSubtitle}
          </p>
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
          {!resetToken && (
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
          )}

          {resetToken && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">{t.newPasswordLabel}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
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
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">{t.confirmNewPassLabel}</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder={t.confirmNewPassLabel}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0c1322] border border-amber-500/25 text-white text-xs outline-none focus:border-amber-400 transition placeholder:text-slate-500"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black text-xs tracking-wider shadow-lg shadow-amber-500/25 transition active:scale-98"
          >
            {loading ? t.processing : (resetToken ? t.resetPassBtn : (language === 'bn' ? 'রিসেট লিংক পাঠান' : 'Send reset link'))}
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