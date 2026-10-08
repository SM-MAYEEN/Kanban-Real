import { DragDropContext } from '@hello-pangea/dnd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../api/axiosInstance';
import ActivityDrawer from '../components/ActivityDrawer';
import ChannelChat from '../components/ChannelChat';
import Column from '../components/Column';
import CreateTaskModal from '../components/CreateTaskModal';
import FileManager from '../components/FileManager';
import SlackSidebar from '../components/SlackSidebar';
import TaskDetailModal from '../components/TaskDetailModal';
import { initSocket } from '../socket/socketClient';
import { useBoardStore } from '../store/boardStore';
import { useAuthStore } from '../store/authStore';
import { useLangStore } from '../store/langStore';
import { exportBoardToCSV } from '../utils/exportUtils';
import { playSuccessSwoosh } from '../utils/soundEffects';

const translations = {
  en: {
    syncing: "Synchronizing Workspace...",
    boardUnavailable: "You do not have access to this board.",
    moveFailed: "Could not move the task. Please try again.",
    searchPlaceholder: "🔍 Search issues...",
    boardTab: "Board",
    calendarTab: "📅 Calendar",
    backlogTab: "📋 Backlog",
    createIssue: "+ Create Issue",
    exportCsv: "Export CSV",
    priority: "Priority:",
    all: "All",
    high: "High 🔴",
    medium: "Medium 🟡",
    low: "Low 🟢",
    activity: "Activity",
    timelineTitle: "Sprint Delivery Timeline & Due Dates",
    timelineDesc: "Scheduled issue deliveries organized by deadlines.",
    addIssueDate: "+ Add Issue with Date",
    noCalendarIssues: "No issues currently scheduled with due dates. Add a deadline to any task to view it on the calendar!",
    due: "Due:",
    backlogTitle: "Agile Backlog & Sprints",
    backlogDesc: "Plan upcoming sprints and prioritize unassigned backlog issues.",
    createSprint: "+ Create Sprint",
    issuesCount: "Issues",
    storyPointsShort: "pts",
    startSprint: "Start Sprint 🚀",
    completeSprint: "Complete Sprint 🏁",
    completed: "Completed",
    noSprintIssues: "No issues assigned to this sprint yet.",
    backlogBoxTitle: "📦 Backlog",
    moveToSprint: "Move to Sprint...",
    addColumn: "+ Add Column",
    addColumnTitle: "Add Workflow Column",
    columnPlaceholder: "e.g. Code Review",
    wipLimitPlaceholder: "WIP Limit (0 = None)",
    cancel: "Cancel",
    create: "Create",
    analyticsTitle: "📈 Velocity & Burndown Analytics",
    sprintVelocity: "Sprint Velocity",
    totalStoryPoints: "Total Story Points",
    completedPoints: "Completed",
    remainingPoints: "Remaining",
    sprintTrajectory: "Sprint Trajectory",
    actualRemaining: "Actual Remaining:",
    ideal: "Ideal:",
    inviteTitle: "Invite Teammate via Email",
    invitePlaceholder: "colleague@domain.com",
    sendInvite: "Send Invite",
    teamLeader: "Team leader / Admin",
    members: "Team members",
    pendingInvites: "Pending invitations",
    awaitingInvitee: "Waiting for invitee to accept",
    awaitingAdmin: "Accepted — waiting for your approval",
    approveInvite: "Approve",
    inviteApproved: "Invitation approved",
    refreshInvites: "Refresh",
    removeMember: "Remove",
    cancelInvite: "Cancel invite",
    copyInvite: "Copy invite link",
    copied: "Copied",
    copyFailed: "Could not copy the link. Select and copy it manually.",
    invalidInviteEmail: "Enter a valid email address to send an invitation.",
    confirmRemoveMember: "Remove this person from the team?",
    confirmCancelInvite: "Cancel this invitation?",
    noPendingInvites: "No pending invitations.",
    errorText: "Error",
  },
  bn: {
    syncing: "ওয়ার্কস্পেস সিঙ্ক হচ্ছে...",
    boardUnavailable: "এই বোর্ডে আপনার প্রবেশাধিকার নেই।",
    moveFailed: "টাস্কটি সরানো যায়নি। আবার চেষ্টা করুন।",
    searchPlaceholder: "🔍 ইস্যু খুঁজুন...",
    boardTab: "বোর্ড",
    calendarTab: "📅 ক্যালেন্ডার",
    backlogTab: "📋 ব্যাকলগ",
    createIssue: "+ নতুন ইস্যু তৈরি করুন",
    exportCsv: "এক্সপোর্ট CSV",
    priority: "অগ্রাধিকার:",
    all: "সব",
    high: "জরুরি 🔴",
    medium: "সাধারণ 🟡",
    low: "কম 🟢",
    activity: "অ্যাক্টিভিটি",
    timelineTitle: "স্প্রিন্ট ডেলিভারি টাইমলাইন ও সময়সীমা",
    timelineDesc: "নির্দিষ্ট ডেডলাইন অনুযায়ী সাজানো ইস্যু তালিকা।",
    addIssueDate: "+ তারিখসহ ইস্যু যুক্ত করুন",
    noCalendarIssues: "নির্দিষ্ট সময়সীমা দেওয়া কোনো ইস্যু নেই। ক্যালেন্ডারে দেখতে টাস্কে ডেডলাইন যুক্ত করুন!",
    due: "মেয়াদ:",
    backlogTitle: "অ্যাজাইল ব্যাকলগ ও স্প্রিন্ট",
    backlogDesc: "পরবর্তী স্প্রিন্ট পরিকল্পনা করুন এবং অনির্ধারিত কাজগুলো সাজান।",
    createSprint: "+ স্প্রিন্ট তৈরি করুন",
    issuesCount: "টি ইস্যু",
    storyPointsShort: "পয়েন্ট",
    startSprint: "স্প্রিন্ট শুরু করুন 🚀",
    completeSprint: "স্প্রিন্ট সমাপ্ত করুন 🏁",
    completed: "সমাপ্ত",
    noSprintIssues: "এই স্প্রিন্টে এখনো কোনো ইস্যু নির্ধারণ করা হয়নি।",
    backlogBoxTitle: "📦 ব্যাকলগ",
    moveToSprint: "স্প্রিন্টে পাঠান...",
    addColumn: "+ কলাম যুক্ত করুন",
    addColumnTitle: "নতুন ওয়ার্কফ্লো কলাম",
    columnPlaceholder: "যেমন: কোড রিভিউ",
    wipLimitPlaceholder: "কাজের সীমা (০ = অনির্দিষ্ট)",
    cancel: "বাতিল",
    create: "তৈরি করুন",
    analyticsTitle: "📈 ভেলোসিটি ও বার্নডাউন অ্যানালিটিক্স",
    sprintVelocity: "স্প্রিন্ট ভেলোসিটি",
    totalStoryPoints: "মোট স্টোরি পয়েন্ট",
    completedPoints: "সম্পন্ন",
    remainingPoints: "বাকি আছে",
    sprintTrajectory: "স্প্রিন্ট প্রগ্রেস গ্রাফ",
    actualRemaining: "প্রকৃত বাকি:",
    ideal: "টার্গেট:",
    inviteTitle: "ইমেইলের মাধ্যমে সহকর্মীকে আমন্ত্রণ জানান",
    invitePlaceholder: "colleague@domain.com",
    sendInvite: "আমন্ত্রণ পাঠান",
    teamLeader: "টিম লিডার / অ্যাডমিন",
    members: "টিম সদস্য",
    pendingInvites: "অপেক্ষমাণ আমন্ত্রণ",
    awaitingInvitee: "আমন্ত্রিত ব্যক্তির গ্রহণের অপেক্ষায়",
    awaitingAdmin: "গ্রহণ করা হয়েছে — আপনার অনুমোদনের অপেক্ষায়",
    approveInvite: "অনুমোদন করুন",
    inviteApproved: "আমন্ত্রণ অনুমোদিত",
    refreshInvites: "রিফ্রেশ",
    removeMember: "সরান",
    cancelInvite: "আমন্ত্রণ বাতিল",
    copyInvite: "আমন্ত্রণ লিংক কপি",
    copied: "কপি হয়েছে",
    copyFailed: "লিংক কপি হয়নি। লিংকটি নির্বাচন করে কপি করুন।",
    invalidInviteEmail: "আমন্ত্রণ পাঠাতে একটি সঠিক ইমেইল ঠিকানা লিখুন।",
    confirmRemoveMember: "এই সদস্যকে টিম থেকে সরাবেন?",
    confirmCancelInvite: "এই আমন্ত্রণটি বাতিল করবেন?",
    noPendingInvites: "কোনো অপেক্ষমাণ আমন্ত্রণ নেই।",
    errorText: "সমস্যা হয়েছে",
  }
};

export default function BoardView() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const { language } = useLangStore();
  const t = translations[language] || translations.en;
  const user = useAuthStore((state) => state.user);

  const {
    board,
    columns,
    tasks,
    loading,
    error,
    fetchBoardDetails,
    moveTask,
    addTask,
    deleteTask,
    handleTaskMovedRemote,
    handleTaskCreatedRemote,
    handleTaskDeletedRemote,
  } = useBoardStore();

  const [activeColumnId, setActiveColumnId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [moveError, setMoveError] = useState('');

  // Views: 'kanban' | 'backlog' | 'calendar' | 'channel' | 'files'
  const [currentView, setCurrentView] = useState('kanban');
  const [selectedChannel, setSelectedChannel] = useState('customer-feedback');

  // Sprints & Burndown Analytics
  const [allBoards, setAllBoards] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [activeSprint, setActiveSprint] = useState(null);
  const [showBurndownModal, setShowBurndownModal] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('All');

  // Column creation
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [newColumnWip, setNewColumnWip] = useState(0);

  // Invite Modal
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const inviteInFlightRef = useRef(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState('');
  const [inviteFeedback, setInviteFeedback] = useState({ type: '', message: '' });
  const [memberActionId, setMemberActionId] = useState('');
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);
  const boardOwnerId = board?.owner?._id || board?.owner;
  const currentUserId = user?._id || user?.id;
  const isBoardOwner = Boolean(
    boardOwnerId && currentUserId && boardOwnerId.toString() === currentUserId.toString()
  );

  const fetchSprints = async () => {
    try {
      const res = await API.get(`/sprints/board/${boardId}`);
      setSprints(res.data);
      const active = res.data.find((s) => s.status === 'active');
      setActiveSprint(active || null);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllBoards = async () => {
    try {
      const res = await API.get('/boards');
      setAllBoards(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBoardDetails(boardId);
    fetchSprints();
    fetchAllBoards();

    const token = localStorage.getItem('token');
    const socket = initSocket(token);

    if (socket) {
      if (socket.connected) {
        setIsConnected(true);
        socket.emit('board:join', boardId);
      }
      socket.on('connect', () => {
        setIsConnected(true);
        socket.emit('board:join', boardId);
      });
      socket.on('disconnect', () => setIsConnected(false));
      socket.on('task:moved', handleTaskMovedRemote);
      socket.on('task:created', handleTaskCreatedRemote);
      socket.on('task:deleted', handleTaskDeletedRemote);
      socket.on('board:access-revoked', ({ boardId: revokedBoardId }) => {
        if (revokedBoardId?.toString() === boardId?.toString()) {
          navigate('/dashboard');
        }
      });
    }

    return () => {
      if (socket) {
        socket.emit('board:leave', boardId);
        socket.off('task:moved');
        socket.off('task:created');
        socket.off('task:deleted');
        socket.off('board:access-revoked');
      }
    };
  }, [boardId]);

  // Burndown Analytics
  const handleOpenAnalytics = async () => {
    if (activeSprint) {
      try {
        const res = await API.get(`/sprints/${activeSprint._id}/analytics`);
        setAnalyticsData(res.data);
        setShowBurndownModal(true);
        return;
      } catch (err) {
        console.error(err);
      }
    }

    const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 1), 0);
    const doneCol = columns.find((c) => /done|completed/i.test(c.title));
    const completedTasks = doneCol ? tasks.filter((t) => (t.columnId?._id || t.columnId || t.column)?.toString() === doneCol._id?.toString()) : [];
    const completedPoints = completedTasks.reduce((sum, t) => sum + (t.storyPoints || 1), 0);

    const burndownDays = [
      { day: language === 'bn' ? 'দিন ১' : 'Day 1', ideal: totalPoints, actual: totalPoints },
      { day: language === 'bn' ? 'দিন ৩' : 'Day 3', ideal: Math.round(totalPoints * 0.7), actual: Math.max(0, totalPoints - Math.round(completedPoints * 0.3)) },
      { day: language === 'bn' ? 'দিন ৭' : 'Day 7', ideal: Math.round(totalPoints * 0.4), actual: Math.max(0, totalPoints - Math.round(completedPoints * 0.7)) },
      { day: language === 'bn' ? 'দিন ১০' : 'Day 10', ideal: 0, actual: Math.max(0, totalPoints - completedPoints) },
    ];

    setAnalyticsData({
      sprint: { name: language === 'bn' ? 'ওয়ার্কস্পেস সামগ্রিক ভেলোসিটি' : 'Workspace Overall Velocity' },
      totalStoryPoints: totalPoints,
      completedStoryPoints: completedPoints,
      remainingPoints: totalPoints - completedPoints,
      burndownData: burndownDays,
    });
    setShowBurndownModal(true);
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesPriority =
        selectedPriority === 'All' ? true : t.priority === selectedPriority;
      return matchesSearch && matchesPriority;
    });
  }, [tasks, searchQuery, selectedPriority]);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;

    const destColumn = columns.find((c) => c._id?.toString() === destination.droppableId?.toString());
    if (destColumn && /done|completed/i.test(destColumn.title)) {
      playSuccessSwoosh();
    }

    setMoveError('');
    try {
      await moveTask(
        draggableId,
        source.droppableId,
        destination.droppableId,
        destination.index
      );
    } catch (error) {
      setMoveError(error.response?.data?.message || t.moveFailed);
    }
  };

  const openCreateModal = (colId) => {
    setActiveColumnId(colId || columns[0]?._id);
    setIsModalOpen(true);
  };

  const handleCreateNewColumn = async (e) => {
    e.preventDefault();
    if (!newColumnTitle.trim()) return;
    try {
      const res = await API.post('/columns', {
        title: newColumnTitle.trim(),
        boardId,
        wipLimit: Number(newColumnWip),
      });
      useBoardStore.setState((state) => ({ columns: [...state.columns, res.data] }));
      setNewColumnTitle('');
      setNewColumnWip(0);
      setShowAddColumn(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || inviteInFlightRef.current) return;
    inviteInFlightRef.current = true;
    setGeneratedInviteLink('');
    setInviteLinkCopied(false);
    try {
      const res = await API.post(`/boards/${boardId}/members`, { email: inviteEmail.trim() });
      setInviteFeedback({
        type: 'success',
        message: res.data.message,
      });
      if (res.data.inviteLink) setGeneratedInviteLink(res.data.inviteLink);
      if (res.data.pendingInvite) {
        useBoardStore.setState((state) => ({
          board: state.board
            ? {
                ...state.board,
                pendingInvites: [
                  ...(state.board.pendingInvites || []).filter(
                    (invite) => invite.email !== res.data.pendingInvite.email
                  ),
                  res.data.pendingInvite,
                ],
              }
            : state.board,
        }));
      }
      setInviteEmail('');
    } catch (err) {
      setInviteFeedback({ type: 'error', message: err.response?.data?.message || t.errorText });
    } finally {
      inviteInFlightRef.current = false;
    }
  };

  const handleCopyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedInviteLink);
      setInviteLinkCopied(true);
    } catch {
      setInviteFeedback({ type: 'error', message: t.copyFailed });
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm(t.confirmRemoveMember)) return;
    setMemberActionId(memberId);
    try {
      await API.delete(`/boards/${boardId}/members/${memberId}`);
      await fetchBoardDetails(boardId);
      setInviteFeedback({ type: 'success', message: t.removeMember });
    } catch (err) {
      setInviteFeedback({ type: 'error', message: err.response?.data?.message || t.errorText });
    } finally {
      setMemberActionId('');
    }
  };

  const handleCancelInvite = async (email) => {
    if (!window.confirm(t.confirmCancelInvite)) return;
    setMemberActionId(email);
    try {
      await API.delete(`/boards/${boardId}/invites`, { data: { email } });
      await fetchBoardDetails(boardId);
      setInviteFeedback({ type: 'success', message: t.cancelInvite });
    } catch (err) {
      setInviteFeedback({ type: 'error', message: err.response?.data?.message || t.errorText });
    } finally {
      setMemberActionId('');
    }
  };

  const handleApproveInvite = async (email) => {
    setMemberActionId(email);
    try {
      const res = await API.post(`/boards/${boardId}/invites/approve`, { email });
      await fetchBoardDetails(boardId);
      setInviteFeedback({ type: 'success', message: res.data.message || t.inviteApproved });
    } catch (err) {
      setInviteFeedback({ type: 'error', message: err.response?.data?.message || t.errorText });
    } finally {
      setMemberActionId('');
    }
  };

  const handleRefreshInvites = async () => {
    setMemberActionId('refresh');
    try {
      await fetchBoardDetails(boardId);
    } catch (err) {
      setInviteFeedback({ type: 'error', message: err.response?.data?.message || t.errorText });
    } finally {
      setMemberActionId('');
    }
  };

  const handleCreateSprint = async () => {
    try {
      const res = await API.post('/sprints', {
        boardId,
        name: `${language === 'bn' ? 'স্প্রিন্ট' : 'Sprint'} ${sprints.length + 1}`,
      });
      setSprints([res.data, ...sprints]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSprintStatus = async (sprintId, newStatus) => {
    try {
      await API.put(`/sprints/${sprintId}/status`, { status: newStatus });
      fetchSprints();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignTaskSprint = async (taskId, sprintId) => {
    try {
      const res = await API.put(`/tasks/${taskId}`, { sprintId });
      useBoardStore.setState((state) => ({
        tasks: state.tasks.map((t) => (t._id?.toString() === taskId?.toString() ? res.data : t)),
      }));
    } catch (err) {
      console.error(err);
    }
  };

  // 1-second flicker fix: shudhu loading shesh hole ebong prokrrito error thaklei 'boardUnavailable' screen dekhabe
  if (!board && !loading && error) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#07090e] text-slate-100">
        <div className="text-center space-y-3">
          <p className="text-sm text-rose-300">{error || t.boardUnavailable}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-bold hover:bg-amber-300 transition"
          >
            {language === 'bn' ? 'ড্যাশবোর্ডে ফিরুন' : 'Back to dashboard'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#07090e] text-slate-100 flex overflow-hidden selection:bg-amber-500/30 selection:text-amber-200">
      <SlackSidebar
        currentView={currentView}
        setCurrentView={(view) => {
          if (view === 'activity') {
            setIsActivityOpen(!isActivityOpen);
          } else {
            setCurrentView(view);
          }
        }}
        selectedChannel={selectedChannel}
        setSelectedChannel={setSelectedChannel}
        board={board}
        boards={allBoards}
        isBoardView={true}
        onOpenBurndown={handleOpenAnalytics}
        onOpenInvite={() => setShowInviteModal(true)}
        isBoardOwner={isBoardOwner}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
      />

      <div className="flex-1 h-screen flex flex-col overflow-hidden">
        <header className="h-16 shrink-0 px-4 sm:px-6 border-b border-amber-500/20 bg-[#0c1120]/90 backdrop-blur-md flex items-center justify-between z-20">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-md">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs shrink-0"
              title="Toggle Menu"
            >
              ☰
            </button>
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0c1322] border border-amber-500/20 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-amber-400 placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setCurrentView('kanban')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                  currentView === 'kanban' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.boardTab}
              </button>
              <button
                onClick={() => setCurrentView('calendar')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                  currentView === 'calendar' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.calendarTab}
              </button>
              <button
                onClick={() => setCurrentView('backlog')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                  currentView === 'backlog' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.backlogTab}
              </button>
            </div>

            <button
              onClick={() => openCreateModal(columns[0]?._id)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md transition active:scale-95 flex items-center gap-1.5 shrink-0"
            >
              <span>{t.createIssue}</span>
            </button>

            <button
              onClick={() => exportBoardToCSV(board?.title || 'Board', tasks)}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <span>📊</span>
              <span className="hidden md:inline">{t.exportCsv}</span>
            </button>

            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400">
              <span>{t.priority}</span>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="bg-slate-900 border border-white/10 text-white rounded-lg px-2 py-1 text-xs outline-none"
              >
                <option value="All">{t.all}</option>
                <option value="High">{t.high}</option>
                <option value="Medium">{t.medium}</option>
                <option value="Low">{t.low}</option>
              </select>
            </div>

            <button
              onClick={() => setIsActivityOpen(!isActivityOpen)}
              className={`p-2 rounded-xl border text-xs font-bold transition flex items-center gap-1 ${
                isActivityOpen
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:text-white'
              }`}
            >
              🔔 <span className="hidden sm:inline">{t.activity}</span>
            </button>
          </div>
        </header>

        {moveError && (
          <div role="alert" className="mx-4 mt-3 px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex justify-between gap-3">
            <span>{moveError}</span>
            <button onClick={() => setMoveError('')} aria-label="Dismiss" className="text-rose-200">✕</button>
          </div>
        )}

        {currentView === 'channel' ? (
          <ChannelChat
            channel={selectedChannel}
            boardId={boardId}
            boardOwnerId={board?.owner?._id || board?.owner}
          />
        ) : currentView === 'files' ? (
          <FileManager tasks={tasks} />
        ) : currentView === 'calendar' ? (
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 z-10">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>📅</span> {t.timelineTitle}
                  </h2>
                  <p className="text-xs text-slate-400">{t.timelineDesc}</p>
                </div>
                <button
                  onClick={() => openCreateModal(columns[0]?._id)}
                  className="px-3.5 py-1.5 bg-amber-400 text-slate-950 font-bold text-xs rounded-xl hover:bg-amber-300 transition"
                >
                  {t.addIssueDate}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTasks
                  .filter((t) => t.dueDate)
                  .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                  .map((task) => (
                    <div
                      key={task._id}
                      onClick={() => setSelectedTask(task)}
                      className="p-4 rounded-xl bg-slate-900/60 border border-white/10 cursor-pointer hover:border-amber-400 transition"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {t.due} {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400">{task.priority}</span>
                      </div>
                      <h4 className="font-bold text-white text-sm mb-1">
                        [{task.key || 'KAN'}] {task.title}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-2">{task.description}</p>
                    </div>
                  ))}
              </div>

              {filteredTasks.filter((t) => t.dueDate).length === 0 && (
                <div className="text-center py-12 text-xs text-slate-500 italic border border-dashed border-white/10 rounded-2xl">
                  {t.noCalendarIssues}
                </div>
              )}
            </div>
          </main>
        ) : currentView === 'backlog' ? (
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 z-10">
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>📋</span> {t.backlogTitle}
                  </h2>
                  <p className="text-xs text-slate-400">{t.backlogDesc}</p>
                </div>
                <button
                  onClick={handleCreateSprint}
                  className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow hover:from-amber-300 hover:to-amber-500 transition"
                >
                  {t.createSprint}
                </button>
              </div>

              {sprints.map((sprint) => {
                const sprintTasks = tasks.filter((t) => t.sprintId?.toString() === sprint._id?.toString());
                const sprintPoints = sprintTasks.reduce((acc, curr) => acc + (curr.storyPoints || 0), 0);

                return (
                  <div key={sprint._id} className="bg-slate-900/60 p-5 rounded-2xl border border-white/10 space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-sm text-white">{sprint.name}</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {sprintTasks.length} {t.issuesCount} • {sprintPoints} {t.storyPointsShort}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {sprint.status === 'future' ? (
                          <button
                            onClick={() => handleToggleSprintStatus(sprint._id, 'active')}
                            className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold rounded-lg hover:bg-emerald-500/30 transition"
                          >
                            {t.startSprint}
                          </button>
                        ) : sprint.status === 'active' ? (
                          <button
                            onClick={() => handleToggleSprintStatus(sprint._id, 'completed')}
                            className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold rounded-lg hover:bg-purple-500/30 transition"
                          >
                            {t.completeSprint}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500 italic">{t.completed}</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {sprintTasks.length === 0 ? (
                        <div className="text-center py-4 text-xs text-slate-500 italic border border-dashed border-white/5 rounded-xl">
                          {t.noSprintIssues}
                        </div>
                      ) : (
                        sprintTasks.map((st) => (
                          <div
                            key={st._id}
                            onClick={() => setSelectedTask(st)}
                            className="p-3 bg-slate-950/80 hover:bg-slate-900 border border-white/5 rounded-xl flex items-center justify-between cursor-pointer text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-amber-300">{st.key}</span>
                              <span className="text-white">{st.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
                                {st.storyPoints || 1} {t.storyPointsShort}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAssignTaskSprint(st._id, null);
                                }}
                                className="text-slate-500 hover:text-rose-400 text-xs"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}

              <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/10 space-y-3">
                <h3 className="font-bold text-sm text-white">{t.backlogBoxTitle} ({tasks.filter((t) => !t.sprintId).length} {t.issuesCount})</h3>
                <div className="space-y-2">
                  {tasks
                    .filter((t) => !t.sprintId)
                    .map((tTask) => (
                      <div
                        key={tTask._id}
                        onClick={() => setSelectedTask(tTask)}
                        className="p-3 bg-slate-950/80 hover:bg-slate-900 border border-white/5 rounded-xl flex items-center justify-between cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-amber-300">{tTask.key}</span>
                          <span className="text-white">{tTask.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
                            {tTask.storyPoints || 1} {t.storyPointsShort}
                          </span>
                          {sprints.length > 0 && (
                            <select
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleAssignTaskSprint(tTask._id, e.target.value)}
                              defaultValue=""
                              className="bg-slate-900 border border-white/10 text-white rounded-lg px-2 py-1 text-[11px] outline-none"
                            >
                              <option value="" disabled>{t.moveToSprint}</option>
                              {sprints
                                .filter((s) => s.status !== 'completed')
                                .map((s) => (
                                  <option key={s._id} value={s._id}>{s.name}</option>
                                ))}
                            </select>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </main>
        ) : (
          <main className="flex-1 overflow-x-auto overflow-y-hidden p-4 sm:p-6 z-10">
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="flex gap-6 h-full items-start">
                {columns.map((column) => {
                  const columnTasks = filteredTasks
                    .filter((t) => {
                      const taskColId = (t.columnId?._id || t.columnId || t.column?._id || t.column)?.toString();
                      const colId = (column._id?._id || column._id)?.toString();
                      return taskColId && colId && taskColId === colId;
                    })
                    .sort((a, b) => (a.order || 0) - (b.order || 0));

                  return (
                    <Column
                      key={column._id}
                      column={column}
                      tasks={columnTasks}
                      onAddTaskClick={openCreateModal}
                      onCardClick={(task) => setSelectedTask(task)}
                      onDeleteTask={deleteTask}
                      onColumnUpdated={(updatedCol) => {
                        useBoardStore.setState((state) => ({
                          columns: state.columns.map((c) =>
                            c._id === updatedCol._id ? updatedCol : c
                          ),
                        }));
                      }}
                      onColumnDeleted={(deletedId) => {
                        useBoardStore.setState((state) => ({
                          columns: state.columns.filter((c) => c._id !== deletedId),
                          tasks: state.tasks.filter((t) => t.columnId !== deletedId),
                        }));
                      }}
                    />
                  );
                })}

                <div className="w-72 shrink-0">
                  {showAddColumn ? (
                    <form
                      onSubmit={handleCreateNewColumn}
                      className="bg-slate-900/80 p-4 rounded-2xl border border-white/10 space-y-3"
                    >
                      <h4 className="font-bold text-xs text-white">{t.addColumnTitle}</h4>
                      <input
                        type="text"
                        required
                        placeholder={t.columnPlaceholder}
                        value={newColumnTitle}
                        onChange={(e) => setNewColumnTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs outline-none focus:border-amber-400"
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder={t.wipLimitPlaceholder}
                        value={newColumnWip}
                        onChange={(e) => setNewColumnWip(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs outline-none focus:border-amber-400"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddColumn(false)}
                          className="px-3 py-1 text-xs text-slate-400"
                        >
                          {t.cancel}
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-amber-400 text-slate-950 font-bold text-xs rounded-xl hover:bg-amber-300 transition"
                        >
                          {t.create}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setShowAddColumn(true)}
                      className="w-full py-3.5 border-2 border-dashed border-white/10 hover:border-amber-400/50 rounded-2xl text-slate-400 hover:text-amber-300 font-bold text-xs transition"
                    >
                      {t.addColumn}
                    </button>
                  )}
                </div>
              </div>
            </DragDropContext>
          </main>
        )}
      </div>

      {showBurndownModal && analyticsData && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] p-6 text-slate-100 shadow-2xl flex flex-col">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-white/[0.08]">
              <div>
                <h3 className="font-bold text-base text-white">{t.analyticsTitle}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{analyticsData.sprint?.name || t.sprintVelocity}</p>
              </div>
              <button onClick={() => setShowBurndownModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6 text-center">
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5">
                <span className="text-[11px] text-slate-400 block mb-1">{t.totalStoryPoints}</span>
                <span className="text-lg font-bold text-white">{analyticsData.totalStoryPoints} {t.storyPointsShort}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5">
                <span className="text-[11px] text-emerald-400 block mb-1">{t.completedPoints}</span>
                <span className="text-lg font-bold text-emerald-400">{analyticsData.completedStoryPoints} {t.storyPointsShort}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5">
                <span className="text-[11px] text-amber-400 block mb-1">{t.remainingPoints}</span>
                <span className="text-lg font-bold text-amber-400">{analyticsData.remainingPoints} {t.storyPointsShort}</span>
              </div>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              <span className="text-xs font-semibold text-slate-300 block mb-2">{t.sprintTrajectory}</span>
              {analyticsData.burndownData?.map((d, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{d.day}</span>
                    <span>{t.actualRemaining} {d.actual} {t.storyPointsShort} ({t.ideal} {d.ideal} {t.storyPointsShort})</span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex">
                    <div
                      className="bg-amber-400 transition-all"
                      style={{
                        width: `${analyticsData.totalStoryPoints > 0 ? (d.actual / analyticsData.totalStoryPoints) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl text-slate-100 relative">
            <button onClick={() => setShowInviteModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>
            <h3 className="font-bold text-white text-base mb-2">{t.inviteTitle}</h3>
            <p className="text-xs text-amber-300 mb-4">{t.teamLeader}: {board?.owner?.name || user?.name}</p>
            {inviteFeedback.message && (
              <div className={`mb-4 p-3 rounded-xl text-xs border ${
                inviteFeedback.type === 'error'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : inviteFeedback.type === 'warning'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}>
                {inviteFeedback.message}
              </div>
            )}
            {generatedInviteLink && (
              <div className="mb-5 space-y-2">
                <label className="block text-xs text-slate-300">{t.copyInvite}</label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={generatedInviteLink}
                    onFocus={(e) => e.target.select()}
                    className="min-w-0 flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleCopyInviteLink}
                    className="px-3 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs shrink-0"
                  >
                    {inviteLinkCopied ? t.copied : t.copyInvite}
                  </button>
                </div>
              </div>
            )}
            <h4 className="text-xs font-bold text-white mb-2">
              {t.members} ({board?.members?.length || 0})
            </h4>
            <div className="space-y-2 mb-5">
              {(board?.members || []).map((member) => {
                const memberId = member?._id || member;
                const isLeader = memberId?.toString() === boardOwnerId?.toString();
                return (
                  <div key={memberId.toString()} className="flex items-center justify-between gap-3 rounded-xl bg-slate-950/70 border border-white/5 px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{member?.name || member?.email || 'Team member'}</p>
                      {member?.email && <p className="text-[10px] text-slate-400 truncate">{member.email}</p>}
                    </div>
                    {isLeader ? (
                      <span className="text-[10px] text-amber-300 font-bold shrink-0">{t.teamLeader}</span>
                    ) : (
                      <button
                        type="button"
                        disabled={memberActionId === memberId.toString()}
                        onClick={() => handleRemoveMember(memberId.toString())}
                        className="text-[10px] text-rose-300 hover:text-rose-200 disabled:opacity-50"
                      >
                        {t.removeMember}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-white">{t.pendingInvites}</h4>
              <button
                type="button"
                disabled={memberActionId === 'refresh'}
                onClick={handleRefreshInvites}
                className="text-[10px] text-amber-300 hover:text-amber-200 disabled:opacity-50"
              >
                {t.refreshInvites}
              </button>
            </div>
            <div className="space-y-2 mb-5">
              {(board?.pendingInvites || []).length === 0 ? (
                <p className="text-[11px] text-slate-500">{t.noPendingInvites}</p>
              ) : board.pendingInvites.map((invite) => (
                <div key={invite.email} className="flex items-center justify-between gap-3 rounded-xl bg-slate-950/70 border border-white/5 px-3 py-2">
                  <div className="min-w-0">
                    <span className="block text-xs text-slate-300 truncate">{invite.email}</span>
                    <span className="block text-[10px] text-slate-500">
                      {invite.acceptedAt ? t.awaitingAdmin : t.awaitingInvitee}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {invite.acceptedAt && (
                      <button
                        type="button"
                        disabled={memberActionId === invite.email}
                        onClick={() => handleApproveInvite(invite.email)}
                        className="text-[10px] text-emerald-300 hover:text-emerald-200 disabled:opacity-50"
                      >
                        {t.approveInvite}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={memberActionId === invite.email}
                      onClick={() => handleCancelInvite(invite.email)}
                      className="text-[10px] text-rose-300 hover:text-rose-200 disabled:opacity-50"
                    >
                      {t.cancelInvite}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleInvite} className="space-y-4 border-t border-white/10 pt-4">
              <input
                type="email"
                required
                placeholder={t.invitePlaceholder}
                value={inviteEmail}
                onInvalid={(e) => {
                  e.preventDefault();
                  setInviteFeedback({ type: 'error', message: t.invalidInviteEmail });
                }}
                onChange={(e) => {
                  setInviteEmail(e.target.value);
                  setInviteFeedback((current) =>
                    current.type === 'error' ? { type: '', message: '' } : current
                  );
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm outline-none focus:border-amber-400"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-bold text-xs"
                >
                  {t.sendInvite}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        columnId={activeColumnId}
        boardId={boardId}
        onAdd={addTask}
      />

      <TaskDetailModal
        isOpen={!!selectedTask}
        task={selectedTask}
        allTasks={tasks}
        boardId={boardId}
        onClose={() => setSelectedTask(null)}
        onDeleteTask={deleteTask}
        onTaskUpdated={(updatedTask) => {
          useBoardStore.setState((state) => ({
            tasks: state.tasks.map((t) => (t._id?.toString() === updatedTask._id?.toString() ? updatedTask : t)),
          }));
          setSelectedTask(updatedTask);
        }}
      />

      <ActivityDrawer
        boardId={boardId}
        isOpen={isActivityOpen}
        onClose={() => setIsActivityOpen(false)}
      />
    </div>
  );
}