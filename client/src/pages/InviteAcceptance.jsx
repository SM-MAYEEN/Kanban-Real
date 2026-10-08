import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import API from '../api/axiosInstance';
import { useAuthStore } from '../store/authStore';
import { useLangStore } from '../store/langStore';

export default function InviteAcceptance() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const { language } = useLangStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [awaitingApproval, setAwaitingApproval] = useState(false);

  const boardId = searchParams.get('boardId');
  const inviteToken = searchParams.get('inviteToken');
  const invitedEmail = searchParams.get('email') || '';
  const hasInvite = Boolean(boardId && inviteToken && invitedEmail);
  const query = searchParams.toString();
  const loginLink = `/login?${query}`;
  const registerLink = `/register?${query}`;
  const isBangla = language === 'bn';
  const isInvitedUser = user?.email?.toLowerCase() === invitedEmail.toLowerCase();

  const acceptInvitation = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await API.post('/boards/accept-invite', {
        boardId,
        inviteToken,
        email: invitedEmail,
      });
      if (response.data.status === 'approved') {
        navigate(`/board/${boardId}`, { replace: true });
      } else {
        setAwaitingApproval(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || (isBangla ? 'আমন্ত্রণ গ্রহণ করা যায়নি।' : 'Could not accept the invitation.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#07090e] text-slate-100 flex items-center justify-center p-4">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-7 shadow-2xl">
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400 text-xl font-black text-slate-950">K</div>
          <h1 className="text-xl font-bold text-white">
            {isBangla ? 'টিম আমন্ত্রণ' : 'Team invitation'}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {hasInvite
              ? `${isBangla ? 'আমন্ত্রণটি পাঠানো হয়েছে' : 'This invitation was sent to'} ${invitedEmail}.`
              : (isBangla ? 'এই আমন্ত্রণ লিংকটি অসম্পূর্ণ বা অবৈধ।' : 'This invitation link is incomplete or invalid.')}
          </p>
        </div>

        {error && (
          <div role="alert" className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        {hasInvite && !isAuthenticated && (
          <div className="space-y-3">
            <p className="text-center text-xs text-slate-400">
              {isBangla ? 'বোর্ডে যোগ দিতে সাইন ইন করুন অথবা অ্যাকাউন্ট তৈরি করুন।' : 'Sign in or create an account to review and accept this invitation.'}
            </p>
            <Link to={loginLink} className="block w-full rounded-xl bg-amber-400 py-3 text-center text-sm font-bold text-slate-950">
              {isBangla ? 'সাইন ইন' : 'Sign in'}
            </Link>
            <Link to={registerLink} className="block w-full rounded-xl border border-white/10 py-3 text-center text-sm font-semibold text-slate-200 hover:bg-white/5">
              {isBangla ? 'নতুন অ্যাকাউন্ট তৈরি করুন' : 'Create an account'}
            </Link>
          </div>
        )}

        {hasInvite && isAuthenticated && !isInvitedUser && (
          <div className="space-y-3">
            <p className="text-center text-xs text-amber-300">
              {isBangla
                ? `আপনি ${user?.email} দিয়ে সাইন ইন করেছেন। এই আমন্ত্রণটি ${invitedEmail}-এর জন্য।`
                : `You are signed in as ${user?.email}. This invitation is for ${invitedEmail}.`}
            </p>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate(loginLink, { replace: true });
              }}
              className="w-full rounded-xl bg-amber-400 py-3 text-sm font-bold text-slate-950"
            >
              {isBangla ? 'আমন্ত্রিত অ্যাকাউন্ট দিয়ে সাইন ইন' : 'Sign in with invited account'}
            </button>
          </div>
        )}

        {hasInvite && isAuthenticated && isInvitedUser && (
          <div className="space-y-3">
            <p className="text-center text-xs text-slate-300">
              {awaitingApproval
                ? (isBangla ? 'আপনি আমন্ত্রণ গ্রহণ করেছেন। বোর্ডের অ্যাডমিন অনুমোদন দিলে তবেই যোগ দিতে পারবেন।' : 'You accepted the invitation. You can join after the team admin approves it.')
                : (isBangla ? 'আমন্ত্রণটি পরীক্ষা করে গ্রহণ করুন। এরপর বোর্ডের অ্যাডমিনের অনুমোদন লাগবে।' : 'Review and accept the invitation. The team admin must approve it before you can join.')}
            </p>
            <button
              type="button"
              disabled={loading}
              onClick={acceptInvitation}
              className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 py-3 text-sm font-bold text-slate-950 disabled:opacity-50"
            >
              {loading
                ? (isBangla ? 'যাচাই করা হচ্ছে…' : 'Checking…')
                : (awaitingApproval
                    ? (isBangla ? 'অনুমোদনের অবস্থা যাচাই করুন' : 'Check approval status')
                    : (isBangla ? 'আমন্ত্রণ গ্রহণ করুন' : 'Accept invitation'))}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
