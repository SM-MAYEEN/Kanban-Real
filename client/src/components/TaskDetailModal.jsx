import { useEffect, useState } from 'react';
import axios from 'axios';
import API from '../api/axiosInstance';
import { getSocket } from '../socket/socketClient';

export default function TaskDetailModal({
  task,
  allTasks = [],
  isOpen,
  onClose,
  boardId,
  onTaskUpdated,
  onDeleteTask,
}) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState(task?.attachments || []);
  const [subtasks, setSubtasks] = useState(task?.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [workHoursToLog, setWorkHoursToLog] = useState('');
  const [selectedBlockId, setSelectedBlockId] = useState('');

  useEffect(() => {
    if (!task) return;
    setAttachments(task.attachments || []);
    setSubtasks(task.subtasks || []);

    const fetchComments = async () => {
      try {
        const res = await API.get(`/comments/${task._id}`);
        setComments(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchComments();

    const socket = getSocket();
    const handleCommentAdded = ({ taskId, comment }) => {
      if (taskId === task._id) setComments((prev) => [...prev, comment]);
    };

    if (socket) socket.on('comment:added', handleCommentAdded);
    return () => {
      if (socket) socket.off('comment:added', handleCommentAdded);
    };
  }, [task]);

  if (!isOpen || !task) return null;

  // Link Dependency (Blocked By) Handler (Feature 4)
  const handleAddDependency = async () => {
    if (!selectedBlockId || selectedBlockId === task._id) return;
    const currentBlocked = task.blockedBy ? task.blockedBy.map((b) => (b._id ? b._id : b)) : [];
    if (currentBlocked.includes(selectedBlockId)) return;

    try {
      const res = await API.put(`/tasks/${task._id}`, {
        blockedBy: [...currentBlocked, selectedBlockId],
      });
      onTaskUpdated(res.data);
      setSelectedBlockId('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogTime = async (e) => {
    e.preventDefault();
    const hours = parseFloat(workHoursToLog);
    if (isNaN(hours) || hours <= 0) return;
    try {
      const res = await API.post(`/tasks/${task._id}/log-time`, { hours });
      onTaskUpdated(res.data);
      setWorkHoursToLog('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSubtask = async (index) => {
    const updatedSubtasks = subtasks.map((st, i) =>
      i === index ? { ...st, isCompleted: !st.isCompleted } : st
    );
    setSubtasks(updatedSubtasks);
    try {
      const res = await API.put(`/tasks/${task._id}`, { subtasks: updatedSubtasks });
      onTaskUpdated(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSubtaskModal = async (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    const updatedSubtasks = [...subtasks, { title: newSubtaskTitle.trim(), isCompleted: false }];
    setSubtasks(updatedSubtasks);
    setNewSubtaskTitle('');
    try {
      const res = await API.put(`/tasks/${task._id}`, { subtasks: updatedSubtasks });
      onTaskUpdated(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await API.post(`/comments/${task._id}`, { content: newComment });
      setComments((prev) => [...prev, res.data]);
      setNewComment('');
      const socket = getSocket();
      if (socket) {
        socket.emit('comment:create', { boardId, taskId: task._id, comment: res.data });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      const res = await API.post(`/tasks/${task._id}/upload-url`, {
        fileName: file.name,
        fileType: file.type,
      });
      await axios.put(res.data.uploadUrl, file, { headers: { 'Content-Type': file.type } });
      const updateRes = await API.post(`/tasks/${task._id}/attachments`, {
        fileUrl: res.data.fileUrl,
        fileName: file.name,
        fileType: file.type,
      });
      setAttachments(updateRes.data.attachments);
      onTaskUpdated(updateRes.data);
      setUploading(false);
    } catch (err) {
      console.error(err);
      setUploading(false);
    }
  };

  const estimated = task.estimatedHours || 0;
  const logged = task.loggedHours || 0;
  const isOvertime = estimated > 0 && logged > estimated;
  const timePercent = estimated > 0 ? Math.min(Math.round((logged / estimated) * 100), 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        <div className="p-5 border-b border-white/[0.08] flex justify-between items-start bg-slate-950/50">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {task.key || 'KAN'}
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                {task.issueType || 'Task'}
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                {task.storyPoints || 1} pts
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">{task.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (window.confirm('Delete this task?')) {
                  onDeleteTask(task._id);
                  onClose();
                }
              }}
              className="text-xs px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition"
            >
              🗑️ Delete
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">✕</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Issue Linking & Dependencies (Feature 4) */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-white/10 space-y-3">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>🔗</span> Issue Dependencies (Blocks / Blocked By)
            </h4>

            {task.blockedBy && task.blockedBy.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] text-rose-400 font-bold block">is Blocked By:</span>
                {task.blockedBy.map((b) => (
                  <div key={b._id || b} className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center justify-between">
                    <span>🚫 {b.key || 'Issue'} - {b.title || 'Dependent Task'}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <select
                value={selectedBlockId}
                onChange={(e) => setSelectedBlockId(e.target.value)}
                className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-400"
              >
                <option value="">Select a task that blocks this...</option>
                {allTasks
                  .filter((t) => t._id !== task._id)
                  .map((t) => (
                    <option key={t._id} value={t._id}>
                      [{t.key}] {t.title}
                    </option>
                  ))}
              </select>
              <button
                type="button"
                onClick={handleAddDependency}
                className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold rounded-lg transition"
              >
                + Link Blocked
              </button>
            </div>
          </div>

          {/* Time Tracking Panel */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-white/10 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-semibold uppercase tracking-wider">⏱️ Time Tracking</span>
              <span className={isOvertime ? 'text-rose-400 font-bold' : 'text-cyan-400'}>
                {logged}h logged of {estimated}h estimated
              </span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
              <div className={`h-full ${isOvertime ? 'bg-rose-500' : 'bg-cyan-400'}`} style={{ width: `${timePercent}%` }} />
            </div>
            <form onSubmit={handleLogTime} className="flex gap-2">
              <input
                type="number"
                step="0.5"
                placeholder="Log hours..."
                value={workHoursToLog}
                onChange={(e) => setWorkHoursToLog(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-amber-400"
              />
              <button type="submit" className="px-3 py-1.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold rounded-lg">
                + Log Work
              </button>
            </form>
          </div>

          {/* Checklist */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Checklist</h4>
            <div className="space-y-1.5 mb-2">
              {subtasks.map((st, i) => (
                <label key={i} className="flex items-center gap-2.5 p-2 bg-slate-950/60 rounded-xl border border-white/5 cursor-pointer">
                  <input type="checkbox" checked={st.isCompleted} onChange={() => handleToggleSubtask(i)} className="accent-amber-500" />
                  <span className={`text-xs ${st.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}`}>{st.title}</span>
                </label>
              ))}
            </div>
            <form onSubmit={handleAddSubtaskModal} className="flex gap-2">
              <input
                type="text"
                placeholder="Add checklist item..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-amber-400"
              />
              <button type="submit" className="px-3 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold">
                + Add
              </button>
            </form>
          </div>

          {/* Attachments */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attachments</h4>
              <label className="cursor-pointer text-xs px-2.5 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-lg">
                {uploading ? 'Uploading...' : '+ Attach'}
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
              </label>
            </div>
            <div className="space-y-1.5">
              {attachments.map((file, i) => (
                <div key={i} className="flex justify-between items-center p-2 bg-slate-950 rounded-xl text-xs">
                  <span className="truncate text-slate-300">📎 {file.fileName}</span>
                  <a href={file.url} target="_blank" rel="noreferrer" className="text-amber-400 hover:underline">Download</a>
                </div>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Comments</h4>
            <div className="space-y-2 mb-3 max-h-36 overflow-y-auto">
              {comments.map((c) => (
                <div key={c._id} className="p-2.5 bg-slate-950 rounded-xl border border-white/5 text-xs">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="font-bold text-amber-400">{c.author?.name}</span>
                    <span className="text-slate-500">{new Date(c.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-300">{c.content}</p>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Write comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-amber-400"
              />
              <button type="submit" className="px-4 py-1.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl">
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}