import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axiosInstance';
import SlackSidebar from '../components/SlackSidebar';
import { useAuthStore } from '../store/authStore';
import { useLangStore } from '../store/langStore';

const translations = {
  en: {
    createWorkspace: "Create New Workspace",
    createDesc: "Launch a collaborative board with real-time sync and sprint planning.",
    createBtn: "+ Create Workspace",
    placeholderTitle: "Workspace title...",
    guidelinesTitle: "Workspace Guidelines",
    activeBoards: "Active Workspaces",
    noBoards: "No active workspaces found. Create one above!",
    openWorkspace: "Open Workspace →",
    guidelineBtn: "💡 View Guidelines",
    guidelineDetail: "How KanbanFlow Works",
    step1: "1. Create Workspaces: Launch independent boards tailored for each project or course sprint.",
    step2: "2. Real-Time Execution: Move cards between To Do, In Progress, and Done with sub-second team sync.",
    step3: "3. Issue Management: Utilize Jira-style issue keys (KAN-1), Story Points, and work hour tracking.",
    step4: "4. Two-Man Deletion Rule: Boards are safe-deleted to trash history before permanent team approval.",
    close: "Close",
  },
  bn: {
    createWorkspace: "নতুন ওয়ার্কস্পেস তৈরি করুন",
    createDesc: "রিয়েল-টাইম সিঙ্ক এবং স্প্রিন্ট প্ল্যানিং সহ একটি যৌথ কানবান বোর্ড শুরু করুন।",
    createBtn: "+ বোর্ড তৈরি করুন",
    placeholderTitle: "বোর্ডের নাম লিখুন...",
    guidelinesTitle: "ওয়ার্কস্পেস ব্যবহারের নিয়মাবলী",
    activeBoards: "সক্রিয় ওয়ার্কস্পেসসমূহ",
    noBoards: "কোনো সক্রিয় বোর্ড নেই। ওপরে একটি তৈরি করুন!",
    openWorkspace: "বোর্ডে প্রবেশ করুন →",
    guidelineBtn: "💡 গাইডলাইন দেখুন",
    guidelineDetail: "কানবানফ্লো ব্যবহারের পূর্ণাঙ্গ নিয়মাবলী",
    step1: "১. ওয়ার্কস্পেস তৈরি: যেকোনো প্রজেক্ট বা কোর্সের স্প্রিন্টের জন্য স্বতন্ত্র বোর্ড চালু করুন।",
    step2: "২. রিয়েল-টাইম এক্সিকিউশন: কার্ডগুলোকে To Do, In Progress ও Done-এ টেনে আনলে সবার কাছে নিমেষেই সিঙ্ক হবে।",
    step3: "৩. ইস্যু ম্যানেজমেন্ট: জিরা স্টাইল ইস্যু কি (KAN-1), স্টোরি পয়েন্ট এবং কাজের ঘণ্টা ট্র্যাকিং ব্যবহার করুন।",
    step4: "৪. ডিলিট নিরাপত্তা: বোর্ড ডিলিট করলে ট্র্যাশ হিস্টোরিতে সংরক্ষিত থাকে; টিমের অনুমতি ছাড়া চিরতরে মোছে না।",
    close: "বন্ধ করুন",
  }
};

export default function Dashboard() {
  const [boards, setBoards] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [showGuidelineModal, setShowGuidelineModal] = useState(false);
  const user = useAuthStore((state) => state.user);
  const fetchCurrentUser = useAuthStore((state) => state.fetchCurrentUser);
  const { language } = useLangStore();
  const t = translations[language] || translations.en;
  const navigate = useNavigate();

  const fetchBoards = async () => {
    try {
      const res = await API.get('/boards');
      setBoards(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();
    fetchCurrentUser();
  }, []);

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const res = await API.post('/boards', { title });
      setBoards((prev) => [...prev, res.data]);
      setTitle('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchiveBoard = async (e, boardId) => {
    e.stopPropagation();
    if (!window.confirm(language === 'bn' ? 'বোর্ডটি কি হিস্টোরিতে সরাতে চান?' : 'Move board to Trash History?')) return;
    try {
      await API.put(`/boards/${boardId}/archive`);
      setBoards((prev) => prev.filter((b) => b._id !== boardId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#060913] text-slate-100 flex overflow-hidden selection:bg-amber-500/30 selection:text-amber-200">
    <SlackSidebar
      currentView="home"
      boards={boards}
      board={null}
      isBoardView={false}
    />

      {/* ডানপাশের মূল স্ক্রিন */}
      <div className="flex-1 h-screen flex flex-col overflow-hidden relative">
        {/* অম্বিয়েন্ট ব্যাকগ্রাউন্ড নেভি-ব্লু শিমার */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[160px] pointer-events-none"></div>

        {/* সলিড ব্ল্যাক প্রিমিয়াম গ্লাস নেভবার (হোম আইকন মুক্ত) */}
        <header className="h-16 shrink-0 px-8 solid-glass-navbar flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <span className="font-black text-lg tracking-wide text-slate-900 dark:text-white drop-shadow">
              KanbanFlow
            </span>
            <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 shadow-md">
              Enterprise
            </span>
          </div>

          {/* গাইডলাইন বাটন */}
          <button
            onClick={() => setShowGuidelineModal(true)}
            className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 dark:text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            {t.guidelineBtn}
          </button>
        </header>

        {/* ড্যাশবোর্ড কন্টেন্ট বডি */}
        <main className="flex-1 overflow-y-auto px-8 py-8 space-y-8 z-10">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Create Workspace Card (Luxury Solid Glass) */}
            <div className="luxury-glass-card rounded-2xl p-7 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[11px] font-bold mb-2">
                  <span>⚡</span> Rapid Sprint Management
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {t.createWorkspace}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  {t.createDesc}
                </p>
              </div>

              <form onSubmit={handleCreateBoard} className="flex gap-3 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder={t.placeholderTitle}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-amber-500/30 text-xs outline-none focus:border-amber-400 dark:text-white text-slate-900 min-w-[260px] shadow-inner"
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-xs tracking-wider shadow-lg shadow-amber-500/25 shrink-0 transition active:scale-95"
                >
                  {t.createBtn}
                </button>
              </form>
            </div>

            {/* সক্রিয় ওয়ার্কস্পেসসমূহ */}
            <div>
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-amber-500 dark:text-amber-400/90 flex items-center gap-2">
                  <span>📂</span> {t.activeBoards} ({boards.length})
                </h3>
              </div>

              {loading ? (
                <div className="text-amber-400/60 text-xs py-12 text-center animate-pulse">
                  Loading luxury workspaces...
                </div>
              ) : boards.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-xs border border-dashed border-amber-500/20 rounded-2xl luxury-glass-card">
                  {t.noBoards}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {boards.map((b) => (
                    <div
                      key={b._id}
                      onClick={() => navigate(`/board/${b._id}`)}
                      className="cursor-pointer luxury-glass-card rounded-2xl p-6 relative overflow-hidden group"
                    >
                      {/* Top Golden Accent Line */}
                      <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-amber-400 via-amber-200 to-amber-600 opacity-80 group-hover:opacity-100 transition"></div>

                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          Kanban Board
                        </span>
                        <button
                          onClick={(e) => handleArchiveBoard(e, b._id)}
                          className="text-slate-400 hover:text-rose-500 text-xs p-1 rounded-md hover:bg-rose-500/10 transition"
                          title="Move to Trash"
                        >
                          🗑️
                        </button>
                      </div>

                      <h4 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition mb-1.5 truncate">
                        {b.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        Real-time agile workspace with Jira issue keys, sprints & burndown velocity.
                      </p>

                      <div className="mt-6 pt-4 border-t border-amber-500/15 flex justify-between items-center text-xs">
                        <span className="text-emerald-500 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Live
                        </span>
                        <span className="text-amber-500 dark:text-amber-400 font-extrabold group-hover:translate-x-1 transition">
                          {t.openWorkspace}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* গাইডলাইন পপআপ মডাল */}
      {showGuidelineModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="luxury-glass-card rounded-2xl p-7 max-w-lg w-full shadow-2xl space-y-4 border border-amber-500/40">
            <div className="flex justify-between items-center pb-3 border-b border-amber-500/20">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>💡</span> {t.guidelineDetail}
              </h3>
              <button
                onClick={() => setShowGuidelineModal(false)}
                className="text-slate-400 hover:text-white text-base"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
              <p className="p-3.5 bg-slate-100 dark:bg-slate-950/80 rounded-xl border border-amber-500/20 leading-relaxed">{t.step1}</p>
              <p className="p-3.5 bg-slate-100 dark:bg-slate-950/80 rounded-xl border border-amber-500/20 leading-relaxed">{t.step2}</p>
              <p className="p-3.5 bg-slate-100 dark:bg-slate-950/80 rounded-xl border border-amber-500/20 leading-relaxed">{t.step3}</p>
              <p className="p-3.5 bg-slate-100 dark:bg-slate-950/80 rounded-xl border border-amber-500/20 leading-relaxed">{t.step4}</p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowGuidelineModal(false)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-black text-xs hover:from-amber-300 hover:to-amber-500 transition shadow-md"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}