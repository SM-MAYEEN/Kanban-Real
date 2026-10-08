import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext } from '@hello-pangea/dnd';
import { useBoardStore } from '../store/boardStore';
import { initSocket } from '../socket/socketClient';
import API from '../api/axiosInstance';
import SlackSidebar from '../components/SlackSidebar';
import Column from '../components/Column';
import CreateTaskModal from '../components/CreateTaskModal';
import TaskDetailModal from '../components/TaskDetailModal';
import ActivityDrawer from '../components/ActivityDrawer';
import ChannelChat from '../components/ChannelChat';
import FileManager from '../components/FileManager';

export default function BoardView() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const {
    board,
    columns,
    tasks,
    loading,
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
  const [inviteLoading, setInviteLoading] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState('');
  const [inviteFeedback, setInviteFeedback] = useState({ type: '', message: '' });

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
    }

    return () => {
      if (socket) {
        socket.emit('board:leave', boardId);
        socket.off('task:moved');
        socket.off('task:created');
        socket.off('task:deleted');
      }
    };
  }, [boardId]);

  // Burndown / Breakdown ওপেন করার হ্যান্ডলার (কোনো স্প্রিন্ট না থাকলেও বোর্ডের মোট টাস্ক নিয়ে গণনা করবে)
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

    // অলটারনেটিভ: স্প্রিন্ট না থাকলে পুরো বোর্ডের সার্বিক বার্নডাউন চার্ট তৈরি
    const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 1), 0);
    const doneCol = columns.find((c) => /done|completed/i.test(c.title));
    const completedTasks = doneCol ? tasks.filter((t) => t.columnId === doneCol._id) : [];
    const completedPoints = completedTasks.reduce((sum, t) => sum + (t.storyPoints || 1), 0);

    const burndownDays = [
      { day: 'Day 1', ideal: totalPoints, actual: totalPoints },
      { day: 'Day 3', ideal: Math.round(totalPoints * 0.7), actual: Math.max(0, totalPoints - Math.round(completedPoints * 0.3)) },
      { day: 'Day 7', ideal: Math.round(totalPoints * 0.4), actual: Math.max(0, totalPoints - Math.round(completedPoints * 0.7)) },
      { day: 'Day 10', ideal: 0, actual: Math.max(0, totalPoints - completedPoints) },
    ];

    setAnalyticsData({
      sprint: { name: 'Workspace Overall Velocity' },
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

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;

    moveTask(
      draggableId,
      source.droppableId,
      destination.droppableId,
      destination.index
    );
  };

  const openCreateModal = (colId) => {
    setActiveColumnId(colId);
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
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    try {
      const res = await API.post(`/boards/${boardId}/members`, { email: inviteEmail.trim() });
      setInviteFeedback({ type: 'success', message: res.data.message });
      if (res.data.inviteLink) setGeneratedInviteLink(res.data.inviteLink);
      else {
        fetchBoardDetails(boardId);
        setInviteEmail('');
      }
    } catch (err) {
      setInviteFeedback({ type: 'error', message: err.response?.data?.message || 'Error' });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCreateSprint = async () => {
    try {
      const res = await API.post('/sprints', {
        boardId,
        name: `Sprint ${sprints.length + 1}`,
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
        tasks: state.tasks.map((t) => (t._id === taskId ? res.data : t)),
      }));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#07090e] text-amber-400 font-semibold text-sm animate-pulse">
        Synchronizing Workspace...
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#07090e] text-slate-100 flex overflow-hidden selection:bg-amber-500/30 selection:text-amber-200">
      {/* স্ল্যাক সাইডবার */}
      <SlackSidebar
        currentView={currentView}
        setCurrentView={(view) => {
          if (view === 'activity') {
            // অ্যাক্টিভিটি ক্লিক করলে টগল হবে (খুলে থাকলে বন্ধ হবে)
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
      />

      {/* ডানপাশের মূল স্ক্রিন */}
      <div className="flex-1 h-screen flex flex-col overflow-hidden">
        {/* টপ হেডার ও সার্চ বার */}
        <header className="h-14 shrink-0 px-6 border-b border-white/[0.08] bg-[#0c0f17]/90 flex items-center justify-between z-20">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <input
              type="text"
              placeholder="🔍 Search issues by title or #tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* View Switching Quick Tabs */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setCurrentView('kanban')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                  currentView === 'kanban' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400'
                }`}
              >
                Board
              </button>
              <button
                onClick={() => setCurrentView('calendar')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                  currentView === 'calendar' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400'
                }`}
              >
                📅 Calendar
              </button>
              <button
                onClick={() => setCurrentView('backlog')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                  currentView === 'backlog' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400'
                }`}
              >
                📋 Backlog
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Priority:</span>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="bg-slate-900 border border-white/10 text-white rounded-lg px-2 py-1 text-xs outline-none"
              >
                <option value="All">All</option>
                <option value="High">High 🔴</option>
                <option value="Medium">Medium 🟡</option>
                <option value="Low">Low 🟢</option>
              </select>
            </div>

            {/* অ্যাক্টিভিটি বাটন (টগল কাজ করবে) */}
            <button
              onClick={() => setIsActivityOpen(!isActivityOpen)}
              className={`p-2 rounded-xl border text-xs font-bold transition flex items-center gap-1 ${
                isActivityOpen
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:text-white'
              }`}
              title="Toggle Live Activity Log"
            >
              🔔 Activity
            </button>
          </div>
        </header>

        {/* ভিউ কন্টেন্ট */}
        {currentView === 'channel' ? (
          /* রিয়েল-টাইম চ্যানেল চ্যাট (মেসেজ ডিলিট ও লিডার পারমিশন সহ) */
          <ChannelChat
            channel={selectedChannel}
            boardId={boardId}
            boardOwnerId={board?.owner?._id || board?.owner}
          />
        ) : currentView === 'files' ? (
          /* ফাইলস ম্যানেজার */
          <FileManager tasks={tasks} />
        ) : currentView === 'calendar' ? (
          /* সম্পূর্ণ কার্যকরী ক্যালেন্ডার ও টাইমলাইন ভিউ */
          <main className="flex-1 overflow-y-auto p-6 z-10">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>📅</span> Sprint Delivery Timeline & Due Dates
                  </h2>
                  <p className="text-xs text-slate-400">Scheduled issue deliveries organized by deadlines.</p>
                </div>
                <button
                  onClick={() => openCreateModal(columns[0]?._id)}
                  className="px-3.5 py-1.5 bg-amber-400 text-slate-950 font-bold text-xs rounded-xl"
                >
                  + Add Issue with Date
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
                      className="p-4 rounded-xl solid-glass border border-white/10 cursor-pointer hover:border-amber-400 transition"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
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
                  No issues currently scheduled with due dates. Add a deadline to any task to view it on the calendar!
                </div>
              )}
            </div>
          </main>
        ) : currentView === 'backlog' ? (
          /* স্প্রিন্ট ব্যাকলগ ইঞ্জিন */
          <main className="flex-1 overflow-y-auto p-6 z-10">
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>📋</span> Agile Backlog & Sprints
                  </h2>
                  <p className="text-xs text-slate-400">Plan upcoming sprints and prioritize unassigned backlog issues.</p>
                </div>
                <button
                  onClick={handleCreateSprint}
                  className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow"
                >
                  + Create Sprint
                </button>
              </div>

              {sprints.map((sprint) => {
                const sprintTasks = tasks.filter((t) => t.sprintId === sprint._id);
                const sprintPoints = sprintTasks.reduce((acc, curr) => acc + (curr.storyPoints || 0), 0);

                return (
                  <div key={sprint._id} className="solid-glass p-5 rounded-2xl border border-white/10 space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-sm text-white">{sprint.name}</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {sprintTasks.length} Issues • {sprintPoints} Story Points
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {sprint.status === 'future' ? (
                          <button
                            onClick={() => handleToggleSprintStatus(sprint._id, 'active')}
                            className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold rounded-lg"
                          >
                            Start Sprint 🚀
                          </button>
                        ) : sprint.status === 'active' ? (
                          <button
                            onClick={() => handleToggleSprintStatus(sprint._id, 'completed')}
                            className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold rounded-lg"
                          >
                            Complete Sprint 🏁
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500 italic">Completed</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {sprintTasks.length === 0 ? (
                        <div className="text-center py-4 text-xs text-slate-500 italic border border-dashed border-white/5 rounded-xl">
                          No issues assigned to this sprint yet.
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
                                {st.storyPoints} pts
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

              {/* Unassigned Backlog */}
              <div className="solid-glass p-5 rounded-2xl border border-white/10 space-y-3">
                <h3 className="font-bold text-sm text-white">📦 Backlog ({tasks.filter((t) => !t.sprintId).length} Issues)</h3>
                <div className="space-y-2">
                  {tasks
                    .filter((t) => !t.sprintId)
                    .map((t) => (
                      <div
                        key={t._id}
                        onClick={() => setSelectedTask(t)}
                        className="p-3 bg-slate-950/80 hover:bg-slate-900 border border-white/5 rounded-xl flex items-center justify-between cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-amber-300">{t.key}</span>
                          <span className="text-white">{t.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
                            {t.storyPoints} pts
                          </span>
                          {sprints.length > 0 && (
                            <select
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleAssignTaskSprint(t._id, e.target.value)}
                              defaultValue=""
                              className="bg-slate-900 border border-white/10 text-white rounded-lg px-2 py-1 text-[11px] outline-none"
                            >
                              <option value="" disabled>Move to Sprint...</option>
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
          /* কানবান বোর্ড */
          <main className="flex-1 overflow-x-auto overflow-y-hidden p-6 z-10">
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="flex gap-6 h-full items-start">
                {columns.map((column) => {
                  const columnTasks = filteredTasks
                    .filter((t) => t.columnId === column._id)
                    .sort((a, b) => a.order - b.order);

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

                {/* Add Column */}
                <div className="w-72 shrink-0">
                  {showAddColumn ? (
                    <form
                      onSubmit={handleCreateNewColumn}
                      className="solid-glass p-4 rounded-2xl border border-white/10 space-y-3"
                    >
                      <h4 className="font-bold text-xs text-white">Add Workflow Column</h4>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Code Review"
                        value={newColumnTitle}
                        onChange={(e) => setNewColumnTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs outline-none"
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="WIP Limit (0 = None)"
                        value={newColumnWip}
                        onChange={(e) => setNewColumnWip(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs outline-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddColumn(false)}
                          className="px-3 py-1 text-xs text-slate-400"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-amber-400 text-slate-950 font-bold text-xs rounded-xl"
                        >
                          Create
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setShowAddColumn(true)}
                      className="w-full py-3.5 border-2 border-dashed border-white/10 hover:border-amber-400/50 rounded-2xl text-slate-400 hover:text-amber-300 font-bold text-xs transition"
                    >
                      + Add Column
                    </button>
                  )}
                </div>
              </div>
            </DragDropContext>
          </main>
        )}
      </div>

      {/* Burndown / Velocity Analytics Modal (সবসময় সচল) */}
      {showBurndownModal && analyticsData && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] p-6 text-slate-100 shadow-2xl flex flex-col">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-white/[0.08]">
              <div>
                <h3 className="font-bold text-base text-white">📈 Velocity & Burndown Analytics</h3>
                <p className="text-xs text-slate-400 mt-0.5">{analyticsData.sprint?.name || 'Sprint'} • Burn Velocity</p>
              </div>
              <button onClick={() => setShowBurndownModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6 text-center">
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5">
                <span className="text-[11px] text-slate-400 block mb-1">Total Story Points</span>
                <span className="text-lg font-bold text-white">{analyticsData.totalStoryPoints} pts</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5">
                <span className="text-[11px] text-emerald-400 block mb-1">Completed</span>
                <span className="text-lg font-bold text-emerald-400">{analyticsData.completedStoryPoints} pts</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5">
                <span className="text-[11px] text-amber-400 block mb-1">Remaining</span>
                <span className="text-lg font-bold text-amber-400">{analyticsData.remainingPoints} pts</span>
              </div>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              <span className="text-xs font-semibold text-slate-300 block mb-2">Sprint Trajectory</span>
              {analyticsData.burndownData?.map((d, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{d.day}</span>
                    <span>Actual Remaining: {d.actual} pts (Ideal: {d.ideal} pts)</span>
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

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl text-slate-100 relative">
            <button onClick={() => setShowInviteModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>
            <h3 className="font-bold text-white text-base mb-2">Invite Teammate via Email</h3>
            {inviteFeedback.message && (
              <div className="mb-4 p-3 rounded-xl text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                {inviteFeedback.message}
              </div>
            )}
            <form onSubmit={handleInvite} className="space-y-4">
              <input
                type="email"
                required
                placeholder="colleague@domain.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm outline-none focus:border-amber-400"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-bold text-xs"
                >
                  {inviteLoading ? 'Processing...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Creation Modal */}
      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        columnId={activeColumnId}
        boardId={boardId}
        onAdd={addTask}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        isOpen={!!selectedTask}
        task={selectedTask}
        allTasks={tasks}
        boardId={boardId}
        onClose={() => setSelectedTask(null)}
        onDeleteTask={deleteTask}
        onTaskUpdated={(updatedTask) => {
          useBoardStore.setState((state) => ({
            tasks: state.tasks.map((t) => (t._id === updatedTask._id ? updatedTask : t)),
          }));
          setSelectedTask(updatedTask);
        }}
      />

      {/* Activity Drawer (টগল সাপোর্ট সহ) */}
      <ActivityDrawer
        boardId={boardId}
        isOpen={isActivityOpen}
        onClose={() => setIsActivityOpen(false)}
      />
    </div>
  );
}