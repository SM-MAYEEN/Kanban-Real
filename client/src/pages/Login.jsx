import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useLangStore } from '../store/langStore';
import { translations } from '../utils/translations';

export default function Login() {
  const [searchParams] = useSearchParams();
  const { language, toggleLanguage } = useLangStore();
  const t = translations[language] || translations.en;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      const inviteQuery = new URLSearchParams(searchParams);
      navigate(inviteQuery.has('inviteToken') ? `/invite?${inviteQuery}` : '/dashboard');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#060913] text-slate-100 flex items-center justify-center p-4 relative selection:bg-amber-500/30 selection:text-amber-200">
      {/* টপ ল্যাঙ্গুয়েজ সুইচ বাটন */}
      <button
        onClick={toggleLanguage}
        className="absolute top-5 right-5 px-3 py-1.5 rounded-xl bg-slate-900 border border-amber-500/30 text-amber-300 text-xs font-black shadow-md hover:bg-amber-500 hover:text-slate-950 transition"
      >
        {language === 'en' ? 'বাংলা (BN)' : 'English (EN)'}
      </button>

      <div className="luxury-glass-card w-full max-w-md p-6 sm:p-8 rounded-3xl border border-amber-500/30 shadow-2xl relative overflow-hidden">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-amber-500/30 mx-auto mb-3">
            K
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">{t.loginTitle}</h2>
          <p className="text-xs text-slate-400 mt-1">{t.loginSubtitle}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-300">{t.passwordLabel}</label>
              <Link to="/forgot-password" className="text-[11px] text-amber-400 hover:underline">
                {t.forgotPassLink}
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder={t.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            {loading ? t.authenticating : t.signInBtn}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          {t.noAccount}{' '}
          <Link
            to={searchParams.has('inviteToken') ? `/register?${searchParams}` : '/register'}
            className="font-bold text-amber-400 hover:text-amber-300"
          >
            {t.signUpLink}
          </Link>
        </p>
      </div>
    </div>
  );
}