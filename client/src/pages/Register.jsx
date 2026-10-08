import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import API from '../api/axiosInstance';

export default function Register() {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('inviteToken');
  const boardId = searchParams.get('boardId');
  const emailParam = searchParams.get('email');

  const [name, setName] = useState('');
  const [email, setEmail] = useState(emailParam || '');
  const [password, setPassword] = useState('');
  const { register, loading, error } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await register(name, email, password);
    if (success) {
      // যদি ইনভাইট টোকেন থাকে, স্বয়ংক্রিয়ভাবে বোর্ডে যুক্ত হওয়া
      if (inviteToken && boardId) {
        try {
          await API.post('/boards/accept-invite', {
            boardId,
            inviteToken,
          });
          navigate(`/board/${boardId}`);
          return;
        } catch (err) {
          console.error('Failed to auto-accept invite:', err);
        }
      }
      navigate('/dashboard');
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#07090e] px-4 overflow-hidden selection:bg-amber-500/30 selection:text-amber-200">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/15 rounded-full blur-[130px] pointer-events-none"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-600/20 rounded-full blur-[130px] pointer-events-none"></div>

      <div className="relative w-full max-w-md rounded-2xl solid-glass p-8 sm:p-10 z-10 border border-white/10 shadow-2xl">
        <div className="absolute -top-[1px] left-10 right-10 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-xl mb-3 shadow-lg shadow-amber-500/30">
            K
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {inviteToken ? 'Join Your Team' : 'Get Started Free'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {inviteToken
              ? 'Complete registration to join the collaborative workspace'
              : 'Create an account to build real-time agile workflows'}
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 text-xs text-rose-300 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl bg-slate-950/80 border border-white/10 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-amber-400 outline-none transition"
              placeholder="e.g. John Doe"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              readOnly={Boolean(inviteToken)}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl bg-slate-950/80 border border-white/10 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-amber-400 outline-none transition"
              placeholder="you@domain.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl bg-slate-950/80 border border-white/10 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-amber-400 outline-none transition"
              placeholder="Minimum 6 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 py-3.5 font-bold text-slate-950 text-sm tracking-wide shadow-lg shadow-amber-500/25 transition active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? 'Setting up Workspace...' : inviteToken ? 'Accept & Join Board' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-amber-400 font-semibold hover:text-amber-300 underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}