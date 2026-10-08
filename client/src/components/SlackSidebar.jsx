import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useLangStore } from '../store/langStore';

const translations = {
  en: {
    home: "Home",
    board: "Board",
    dms: "DMs",
    activity: "Activity",
    files: "Files",
    tools: "Tools",
    profile: "Profile Settings",
    signOut: "Sign Out",
    activeBoards: "Active Workspaces",
    confirmSignOut: "Confirm Sign Out",
    confirmText: "Are you sure you want to end your current session?",
    cancel: "Cancel",
    yesSignOut: "Yes, Sign Out",
    channels: "Channels",
    viewProfile: "View Profile",
  },
  bn: {
    home: "হোম",
    board: "বোর্ড",
    dms: "বার্তা",
    activity: "অ্যাক্টিভিটি",
    files: "ফাইলস",
    tools: "টুলস",
    profile: "প্রোফাইল সেটিংস",
    signOut: "লগআউট",
    activeBoards: "সক্রিয় ওয়ার্কস্পেসসমূহ",
    confirmSignOut: "লগআউট নিশ্চিতকরণ",
    confirmText: "আপনি কি আপনার বর্তমান সেশন শেষ করতে চান?",
    cancel: "না, বাতিল",
    yesSignOut: "হ্যাঁ, লগআউট",
    channels: "চ্যানেলসমূহ",
    viewProfile: "প্রোফাইল দেখুন",
  }
};

export default function SlackSidebar({
  currentView = 'home',
  setCurrentView = () => {},
  selectedChannel = 'general',
  setSelectedChannel = () => {},
  board = null,
  boards = [],
  onOpenBurndown = () => {},
  onOpenInvite = () => {},
  isBoardView = false,
}) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { language, toggleLanguage } = useLangStore();
  const t = translations[language] || translations.en;
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // সবসময় স্থায়ীভাবে HTML-এ 'dark' ক্লাস লক করে রাখা
  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }, []);

  const handleConfirmLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <aside className="h-screen shrink-0 flex z-30 select-none">
        {/* ১. বামপাশের সরু মিনি-রেল (Deep Luxury Navy & Gold) */}
        <div className="w-16 h-full bg-[#050811] border-r border-amber-500/20 flex flex-col items-center justify-between py-4 shadow-2xl">
          <div className="flex flex-col items-center gap-3">
            {/* অ্যানিমেটেড 'K' লোগো */}
            <Link
              to="/dashboard"
              className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 flex items-center justify-center font-black text-slate-950 text-base shadow-lg shadow-amber-500/30 k-logo-animated transition cursor-pointer"
              title="KanbanFlow Enterprise"
            >
              K
            </Link>

            {/* কোর মেনু বাটনসমূহ: শুধুমাত্র বোর্ডের ভেতর থাকলেই শো করবে */}
            {isBoardView ? (
              <div className="flex flex-col items-center gap-2 mt-2">
                <button
                  onClick={() => setCurrentView('kanban')}
                  title={t.board}
                  className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center transition ${
                    currentView === 'kanban'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-inner font-bold'
                      : 'text-slate-400 hover:text-amber-200 hover:bg-white/5'
                  }`}
                >
                  <span className="text-base leading-none">📋</span>
                  <span className="text-[9px] mt-0.5">{t.board}</span>
                </button>

                <button
                  onClick={() => setCurrentView('channel')}
                  title={t.dms}
                  className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center transition ${
                    currentView === 'channel'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-inner font-bold'
                      : 'text-slate-400 hover:text-amber-200 hover:bg-white/5'
                  }`}
                >
                  <span className="text-base leading-none">💬</span>
                  <span className="text-[9px] mt-0.5">{t.dms}</span>
                </button>

                <button
                  onClick={() => setCurrentView('activity')}
                  title={t.activity}
                  className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center transition ${
                    currentView === 'activity'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-inner font-bold'
                      : 'text-slate-400 hover:text-amber-200 hover:bg-white/5'
                  }`}
                >
                  <span className="text-base leading-none">🔔</span>
                  <span className="text-[9px] mt-0.5">{t.activity}</span>
                </button>

                <button
                  onClick={() => setCurrentView('files')}
                  title={t.files}
                  className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center transition ${
                    currentView === 'files'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-inner font-bold'
                      : 'text-slate-400 hover:text-amber-200 hover:bg-white/5'
                  }`}
                >
                  <span className="text-base leading-none">📁</span>
                  <span className="text-[9px] mt-0.5">{t.files}</span>
                </button>

                <button
                  onClick={onOpenBurndown}
                  title={t.tools}
                  className="w-11 h-11 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-amber-300 hover:bg-white/5 transition"
                >
                  <span className="text-base leading-none">📈</span>
                  <span className="text-[9px] mt-0.5">{t.tools}</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 mt-2">
                <button
                  onClick={() => setCollapsed(!collapsed)}
                  title={t.activeBoards}
                  className="w-11 h-11 rounded-xl flex flex-col items-center justify-center bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition shadow-md"
                >
                  <span className="text-base leading-none">📁</span>
                  <span className="text-[9px] mt-0.5 font-bold">Boards</span>
                </button>
              </div>
            )}
          </div>

          {/* বটম সেকশন: শুধুমাত্র ভাষা ও প্রোফাইল (হোয়াইট মোড অপশন ডিলিট করা হয়েছে) */}
          <div className="flex flex-col items-center gap-3 relative">
            {/* BN / EN Toggle */}
            <button
              onClick={toggleLanguage}
              title="Toggle Language"
              className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-amber-500 hover:text-slate-950 text-amber-300 flex items-center justify-center text-xs font-black border border-amber-500/30 transition shadow-sm"
            >
              {language === 'en' ? 'BN' : 'EN'}
            </button>

            {/* প্রোফাইল মেনু */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="relative group focus:outline-none"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-800 border-2 border-amber-400/60 overflow-hidden flex items-center justify-center text-xs font-bold text-amber-300 shadow">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.charAt(0)?.toUpperCase() || 'U'
                  )}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#050811]"></span>
              </button>

              {showProfileMenu && (
                <div className="absolute bottom-2 left-12 w-52 bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl py-2.5 z-50 text-xs backdrop-blur-xl">
                  <div
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate('/profile');
                    }}
                    className="px-3.5 py-2 border-b border-white/10 mb-1 cursor-pointer hover:bg-amber-500/10 transition"
                  >
                    <p className="font-bold text-white truncate hover:text-amber-300">
                      {user?.name || 'User Profile'}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                    <span className="text-[9px] text-amber-400 mt-1 inline-block font-semibold">
                      {t.viewProfile} →
                    </span>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-3.5 py-2 text-slate-200 hover:bg-white/10 transition font-medium"
                  >
                    <span>⚙️</span> {t.profile}
                  </Link>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setShowLogoutConfirm(true);
                    }}
                    className="w-full text-left flex items-center gap-2 px-3.5 py-2 text-rose-400 hover:bg-rose-500/10 transition font-semibold"
                  >
                    <span>🚪</span> {t.signOut}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ২. চওড়া ওয়ার্কস্পেস প্যানেল */}
        {!collapsed && (
          <div className="w-64 h-full bg-[#0a1120] border-r border-amber-500/20 flex flex-col justify-between py-4 px-3 text-slate-100 shadow-2xl">
            <div className="overflow-y-auto">
              <div className="flex items-center justify-between px-2 pb-3 border-b border-amber-500/20 mb-3">
                <div className="overflow-hidden">
                  <h3 className="font-extrabold text-sm text-white truncate flex items-center gap-1.5">
                    <span className="text-amber-400">❖</span> {isBoardView ? board?.title || 'Workspace' : t.activeBoards}
                  </h3>
                  <span className="text-[10px] text-slate-400 block">
                    {isBoardView ? 'Real-time Project' : 'Your Workspaces'}
                  </span>
                </div>
                <button
                  onClick={() => setCollapsed(true)}
                  title="Hide Sidebar"
                  className="text-xs text-amber-300/80 hover:text-amber-300 p-1 hover:bg-white/5 rounded-md"
                >
                  ◀
                </button>
              </div>

              {/* শুধুমাত্র বোর্ডের ভেতর থাকলেই চ্যানেল অপশন দেখাবে */}
              {isBoardView && (
                <div className="mb-5">
                  <div className="flex items-center justify-between px-2 text-[11px] font-bold uppercase tracking-wider text-amber-400/80 mb-1.5">
                    <span>{t.channels}</span>
                    <button onClick={onOpenInvite} className="text-sm hover:text-white">+</button>
                  </div>

                  <div className="space-y-1">
                    {['customer-feedback', 'general', 'announcements'].map((channel) => (
                      <button
                        key={channel}
                        onClick={() => {
                          setSelectedChannel(channel);
                          setCurrentView('channel');
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-xl text-xs truncate flex items-center gap-2 transition ${
                          selectedChannel === channel && currentView === 'channel'
                            ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-bold shadow-md'
                            : 'text-slate-300 hover:bg-white/5 hover:text-amber-300'
                        }`}
                      >
                        <span className="font-bold">#</span>
                        <span className="truncate">{channel}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* অ্যাক্টিভ বোর্ডগুলোর লিস্ট */}
              <div>
                <div className="flex items-center justify-between px-2 text-[11px] font-bold uppercase tracking-wider text-amber-400/80 mb-1.5">
                  <span>{t.activeBoards} ({boards.length})</span>
                  <Link to="/dashboard" className="text-xs hover:text-amber-300">+</Link>
                </div>

                <div className="space-y-1">
                  {boards.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic px-2 py-1">No active boards.</p>
                  ) : (
                    boards.map((b) => (
                      <button
                        key={b._id}
                        onClick={() => navigate(`/board/${b._id}`)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs truncate flex items-center gap-2 transition border ${
                          b._id === board?._id
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 font-bold shadow-sm'
                            : 'border-transparent text-slate-300 hover:bg-white/5 hover:text-amber-200'
                        }`}
                      >
                        <span>📌</span>
                        <span className="truncate">{b.title}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-amber-500/20 px-2 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Live Presence
              </span>
              <span className="font-bold text-amber-300">{boards.length} Workspaces</span>
            </div>
          </div>
        )}

        {/* কলাপ্স বোতাম */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            title="Expand Sidebar"
            className="h-10 w-4 bg-[#0a1120] border-r border-y border-amber-500/30 rounded-r-lg my-auto text-[10px] text-amber-300 hover:text-white flex items-center justify-center"
          >
            ▶
          </button>
        )}
      </aside>

      {/* কনফার্মেশন সহ লগআউট মডাল */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-xl mx-auto border border-rose-500/30">
              🚪
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{t.confirmSignOut}</h3>
              <p className="text-xs text-slate-400 mt-1">{t.confirmText}</p>
            </div>
            <div className="flex gap-2.5 justify-center pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleConfirmLogout}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500"
              >
                {t.yesSignOut}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}