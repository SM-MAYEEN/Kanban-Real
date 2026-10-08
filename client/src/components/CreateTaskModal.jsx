import { useState } from 'react';

export default function CreateTaskModal({ isOpen, onClose, columnId, boardId, onAdd }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [issueType, setIssueType] = useState('Task');
  const [storyPoints, setStoryPoints] = useState(3);
  const [estimatedHours, setEstimatedHours] = useState(8);
  const [tagsInput, setTagsInput] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState('');

  if (!isOpen) return null;

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    setSubtasks([...subtasks, { title: newSubtask.trim(), isCompleted: false }]);
    setNewSubtask('');
  };

  const handleRemoveSubtask = (idx) => {
    setSubtasks(subtasks.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    onAdd({
      title: title.trim(),
      description: description.trim(),
      issueType,
      storyPoints: Number(storyPoints),
      estimatedHours: Number(estimatedHours) || 0,
      dueDate: dueDate || null,
      priority,
      tags: parsedTags,
      subtasks,
      columnId,
      boardId,
    });

    setTitle('');
    setDescription('');
    setDueDate('');
    setPriority('Medium');
    setIssueType('Task');
    setStoryPoints(3);
    setEstimatedHours(8);
    setTagsInput('');
    setSubtasks([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl p-6 text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-white/[0.08]">
          <div>
            <h3 className="font-bold text-base text-white">Create Jira-Style Issue</h3>
            <p className="text-xs text-slate-400 mt-0.5">Specify category, complexity & estimated duration</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Issue Type & Story Point Selection */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Issue Type
              </label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white outline-none focus:border-amber-400"
              >
                <option value="Task">☑️ Task</option>
                <option value="Story">📗 Story</option>
                <option value="Bug">🐞 Bug</option>
                <option value="Epic">⚡ Epic</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Story Points
              </label>
              <select
                value={storyPoints}
                onChange={(e) => setStoryPoints(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white outline-none focus:border-amber-400"
              >
                <option value="1">1 pt</option>
                <option value="2">2 pts</option>
                <option value="3">3 pts</option>
                <option value="5">5 pts</option>
                <option value="8">8 pts</option>
                <option value="13">13 pts</option>
              </select>
            </div>

            {/* Estimated Hours Input */}
            <div>
              <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Estimated (Hours)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="e.g. 8"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Summary / Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Implement WebSocket reconnection retry"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Description</label>
            <textarea
              rows={2}
              placeholder="Technical acceptance criteria..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white outline-none focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white outline-none focus:border-amber-400"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Tags (Comma-separated)
            </label>
            <input
              type="text"
              placeholder="frontend, auth, api"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white outline-none focus:border-amber-400"
            />
          </div>

          {/* Subtasks */}
          <div>
            <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Acceptance Checklist</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Add sub-task..."
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl font-bold hover:bg-amber-500/30"
              >
                + Add
              </button>
            </div>

            <div className="space-y-1.5 max-h-24 overflow-y-auto">
              {subtasks.map((st, i) => (
                <div key={i} className="flex justify-between items-center bg-slate-950/70 p-2 rounded-lg border border-white/5">
                  <span className="text-slate-300 truncate">{st.title}</span>
                  <button type="button" onClick={() => handleRemoveSubtask(i)} className="text-slate-500 hover:text-rose-400">✕</button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white bg-white/[0.03] rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 font-bold text-slate-950 hover:from-amber-300 hover:to-amber-500"
            >
              Create Issue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}