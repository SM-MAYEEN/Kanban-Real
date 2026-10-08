import { useState } from 'react';
import AiSubtaskGenerator from './AiSubtaskGenerator';
import { useLangStore } from '../store/langStore';
import { translations } from '../utils/translations';

export default function CreateTaskModal({ isOpen, onClose, onCreateTask, initialColumn = 'todo' }) {
  const { language } = useLangStore();
  const t = translations[language] || translations.en;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [storyPoints, setStoryPoints] = useState(1);
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskInput, setNewSubtaskInput] = useState('');

  if (!isOpen) return null;

  const handleAddAiSubtasks = (aiGeneratedList) => {
    const formatted = aiGeneratedList.map((item) => ({
      id: Date.now() + Math.random(),
      title: item,
      completed: false,
    }));
    setSubtasks((prev) => [...prev, ...formatted]);
  };

  const handleAddManualSubtask = (e) => {
    e.preventDefault();
    if (!newSubtaskInput.trim()) return;
    setSubtasks((prev) => [
      ...prev,
      { id: Date.now(), title: newSubtaskInput.trim(), completed: false },
    ]);
    setNewSubtaskInput('');
  };

  const handleRemoveSubtask = (id) => {
    setSubtasks((prev) => prev.filter((st) => st.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreateTask({
      title: title.trim(),
      description: description.trim(),
      priority,
      storyPoints: Number(storyPoints) || 1,
      status: initialColumn,
      subtasks,
    });

    setTitle('');
    setDescription('');
    setPriority('Medium');
    setStoryPoints(1);
    setSubtasks([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="luxury-glass-card rounded-2xl w-full max-w-lg p-6 border border-amber-500/40 shadow-2xl relative my-8">
        <div className="flex justify-between items-center pb-3 border-b border-amber-500/20 mb-4">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <span className="text-amber-400">✨</span> {t.modalTitle}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg p-1">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              {t.taskNameLabel}
            </label>
            <input
              type="text"
              required
              placeholder={t.taskNamePlaceholder}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0c1322] border border-amber-500/30 text-white text-xs outline-none focus:border-amber-400 placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              {t.descLabel}
            </label>
            <textarea
              rows={2}
              placeholder={t.descPlaceholder}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-[#0c1322] border border-amber-500/30 text-white text-xs outline-none focus:border-amber-400 placeholder:text-slate-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                {t.priority}
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0c1322] border border-amber-500/30 text-white text-xs outline-none focus:border-amber-400"
              >
                <option value="Low">{t.low}</option>
                <option value="Medium">{t.medium}</option>
                <option value="High">{t.high}</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                {t.totalStoryPoints}
              </label>
              <input
                type="number"
                min="1"
                max="21"
                value={storyPoints}
                onChange={(e) => setStoryPoints(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0c1322] border border-amber-500/30 text-white text-xs outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-amber-500/20">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <span>📋</span> {t.subtasksTitle} ({subtasks.length})
              </label>
              <AiSubtaskGenerator taskTitle={title} onAddSubtasks={handleAddAiSubtasks} />
            </div>

            <div className="flex gap-2 mb-2.5">
              <input
                type="text"
                placeholder={t.manualSubtaskPlaceholder}
                value={newSubtaskInput}
                onChange={(e) => setNewSubtaskInput(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl bg-[#0c1322] border border-amber-500/20 text-white text-xs outline-none focus:border-amber-400 placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={handleAddManualSubtask}
                className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold"
              >
                {t.add}
              </button>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {subtasks.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic py-1">
                  {t.noSubtasks}
                </p>
              ) : (
                subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between bg-slate-900/80 border border-amber-500/20 px-2.5 py-1.5 rounded-lg text-xs"
                  >
                    <span className="text-slate-200 truncate flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      {st.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(st.id)}
                      className="text-slate-400 hover:text-rose-400 text-xs px-1"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-amber-500/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-white/5 transition"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95"
            >
              {t.submitTask}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}