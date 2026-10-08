import { Draggable } from '@hello-pangea/dnd';

export default function TaskCard({ 
  task = {}, 
  index = 0, 
  onCardClick = () => {}, 
  onDeleteClick = () => {} 
}) {
  if (!task || !task._id) return null;

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${task.title || 'Task'}"?`)) {
      onDeleteClick(task._id);
    }
  };

  const totalSubtasks = Array.isArray(task.subtasks) ? task.subtasks.length : 0;
  const completedSubtasks = Array.isArray(task.subtasks) 
    ? task.subtasks.filter((s) => s && s.isCompleted).length 
    : 0;
  const progressPercent = totalSubtasks > 0 
    ? Math.round((completedSubtasks / totalSubtasks) * 100) 
    : 0;

  // Time Tracking Safe Check
  const estimated = Number(task.estimatedHours) || 0;
  const logged = Number(task.loggedHours) || 0;
  const timePercent = estimated > 0 ? Math.min(Math.round((logged / estimated) * 100), 100) : 0;
  const isOvertime = estimated > 0 && logged > estimated;

  const priorityColors = {
    High: 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/30',
    Medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30',
    Low: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  };

  const issueTypeConfig = {
    Bug: { icon: '🐞', bg: 'bg-rose-500/20 text-rose-500 dark:text-rose-300 border-rose-500/30' },
    Story: { icon: '📗', bg: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/30' },
    Task: { icon: '☑️', bg: 'bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/30' },
    Epic: { icon: '⚡', bg: 'bg-purple-500/20 text-purple-600 dark:text-purple-300 border-purple-500/30' },
  };

  const currentType = issueTypeConfig[task.issueType] || issueTypeConfig.Task;
  const isBlocked = Array.isArray(task.blockedBy) && task.blockedBy.length > 0;

  return (
    <Draggable draggableId={String(task._id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onCardClick(task)}
          className={`p-4 mb-3.5 rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden group select-none ${
            isBlocked
              ? 'border-2 border-rose-500/60 bg-rose-950/20 shadow-lg shadow-rose-950/30'
              : snapshot.isDragging
              ? 'scale-[1.03] shadow-2xl border-2 border-amber-400 bg-slate-900/95 z-50'
              : 'luxury-glass-card hover:-translate-y-1'
          }`}
        >
          {/* Top Golden / Status Accent Line */}
          <div
            className={`absolute top-0 left-0 right-0 h-[2.5px] ${
              isBlocked
                ? 'bg-rose-500'
                : task.issueType === 'Bug'
                ? 'bg-gradient-to-r from-rose-500 to-rose-400'
                : task.issueType === 'Epic'
                ? 'bg-gradient-to-r from-purple-500 to-amber-400'
                : 'bg-gradient-to-r from-amber-400 via-amber-200 to-amber-600'
            } opacity-90 group-hover:opacity-100 transition-opacity`}
          />

          {/* Header Row: Key + Issue Type + Story Point */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-md border flex items-center gap-1 ${currentType.bg}`}
              >
                <span>{currentType.icon}</span>
                <span>{task.key || 'KAN'}</span>
              </span>

              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                  priorityColors[task.priority] || priorityColors.Medium
                }`}
              >
                {task.priority || 'Medium'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Story Point Badge */}
              <span
                title="Story Points"
                className="w-5 h-5 rounded-full bg-slate-900/80 dark:bg-slate-950 border border-amber-500/30 text-amber-400 font-black text-[10px] flex items-center justify-center shadow-inner"
              >
                {task.storyPoints || 1}
              </span>

              <button
                onClick={handleDelete}
                title="Delete task"
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-400 p-0.5 hover:bg-rose-500/10 rounded transition duration-150"
              >
                🗑️
              </button>
            </div>
          </div>

          {/* Blocked Dependency Alert */}
          {isBlocked && (
            <div className="mb-2.5 px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-[10px] text-rose-400 font-bold flex items-center gap-1.5">
              <span>🚫 Blocked</span>
              <span className="text-[9px] font-medium text-rose-300">
                ({task.blockedBy.length} dependency pending)
              </span>
            </div>
          )}

          {/* Title */}
          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-tight mb-1.5 leading-snug group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
            {task.title}
          </h4>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
              {task.description}
            </p>
          )}

          {/* Subtasks Progress Bar */}
          {totalSubtasks > 0 && (
            <div className="mb-3">
              <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                <span className="font-semibold">Checklist</span>
                <span className="font-bold text-amber-500 dark:text-amber-400">
                  {completedSubtasks}/{totalSubtasks} ({progressPercent}%)
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-950 rounded-full overflow-hidden border border-amber-500/15">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    progressPercent === 100
                      ? 'bg-emerald-400'
                      : progressPercent > 50
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                      : 'bg-indigo-400'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Time Tracking Progress */}
          {estimated > 0 && (
            <div className="mb-3">
              <div className="flex justify-between items-center text-[10px] mb-1">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <span>⏱️</span> Logged Time
                </span>
                <span className={isOvertime ? 'text-rose-500 font-bold' : 'text-amber-600 dark:text-amber-300 font-bold'}>
                  {logged}h / {estimated}h
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-950 rounded-full overflow-hidden border border-amber-500/15">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    isOvertime ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-400 to-cyan-400'
                  }`}
                  style={{ width: `${timePercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Footer Info: Tags & Deadline */}
          <div className="flex items-center justify-between pt-2.5 border-t border-amber-500/15 text-[11px]">
            <div className="flex items-center gap-1 overflow-hidden">
              {Array.isArray(task.tags) && task.tags.slice(0, 2).map((t, idx) => (
                <span
                  key={idx}
                  className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-300 truncate max-w-[70px]"
                >
                  #{t}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                {task.dueDate
                  ? new Date(task.dueDate).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                    })
                  : 'No deadline'}
              </span>

              {Array.isArray(task.attachments) && task.attachments.length > 0 && (
                <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-0.5 text-[10px]">
                  📎 {task.attachments.length}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}