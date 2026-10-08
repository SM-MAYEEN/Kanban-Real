import { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import API from '../api/axiosInstance';

export default function Column({
  column,
  tasks,
  onAddTaskClick,
  onCardClick,
  onDeleteTask,
  onColumnUpdated,
  onColumnDeleted,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(column.title);
  const [wipLimit, setWipLimit] = useState(column.wipLimit || 0);

  // WIP Limit চেক (0 মানে আনলিমিটেড)
  const isOverLimit = column.wipLimit > 0 && tasks.length > column.wipLimit;
  const isAtLimit = column.wipLimit > 0 && tasks.length === column.wipLimit;

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await API.put(`/columns/${column._id}`, {
        title,
        wipLimit: Number(wipLimit),
      });
      onColumnUpdated(res.data);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteColumn = async () => {
    if (window.confirm(`Delete column "${column.title}" and all its tasks?`)) {
      try {
        await API.delete(`/columns/${column._id}`);
        onColumnDeleted(column._id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div
      className={`flex flex-col w-[85vw] sm:w-80 shrink-0 solid-glass rounded-2xl p-4 max-h-full border transition-all duration-300 shadow-2xl ${
        isOverLimit
          ? 'border-rose-500 shadow-rose-500/20 bg-rose-950/20'
          : 'border-white/10'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 shrink-0 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 overflow-hidden">
          <h3 className="font-bold text-sm text-white tracking-wide truncate">
            {column.title}
          </h3>

          {/* Task Counter with WIP Limit Badge */}
          <span
            className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${
              isOverLimit
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                : isAtLimit
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-white/[0.05] text-slate-300 border-white/10'
            }`}
          >
            {tasks.length}
            {column.wipLimit > 0 ? ` / ${column.wipLimit}` : ''}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsEditing(!isEditing)}
            title="Edit Column & WIP Limit"
            className="text-xs p-1 text-slate-400 hover:text-white rounded hover:bg-white/5 transition"
          >
            ⚙️
          </button>
          <button
            onClick={() => onAddTaskClick(column._id)}
            className="text-xs px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg transition duration-150 shadow-sm shadow-amber-400/20"
          >
            + Add
          </button>
        </div>
      </div>

      {/* WIP Limit Exceeded Alert Banner */}
      {isOverLimit && (
        <div className="mb-3 px-3 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-[11px] text-rose-300 flex items-center gap-2">
          <span>⚠️</span>
          <span>
            <strong>WIP Exceeded:</strong> Max limit is {column.wipLimit}!
          </span>
        </div>
      )}

      {/* Inline Settings Modal / Drawer for WIP Limit */}
      {isEditing && (
        <form
          onSubmit={handleSaveSettings}
          className="p-3 mb-3 rounded-xl bg-slate-950/90 border border-white/10 space-y-2.5 text-xs text-slate-200"
        >
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white outline-none focus:border-amber-400 text-xs"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              WIP Limit (0 = Unlimited)
            </label>
            <input
              type="number"
              min="0"
              max="50"
              value={wipLimit}
              onChange={(e) => setWipLimit(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white outline-none focus:border-amber-400 text-xs"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleDeleteColumn}
              className="text-rose-400 hover:underline text-[11px]"
            >
              Delete Column
            </button>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-2.5 py-1 rounded bg-white/5 text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 rounded bg-amber-400 text-slate-950 font-bold"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Droppable Task List */}
      <Droppable droppableId={column._id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto pr-1 rounded-xl transition-colors min-h-[120px] ${
              snapshot.isDraggingOver ? 'bg-white/[0.02]' : ''
            }`}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task._id}
                task={task}
                index={index}
                onCardClick={onCardClick}
                onDeleteClick={onDeleteTask}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}