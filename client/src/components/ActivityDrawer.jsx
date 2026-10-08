import { useEffect, useState } from 'react';
import API from '../api/axiosInstance';
import { getSocket } from '../socket/socketClient';

export default function ActivityDrawer({ boardId, isOpen, onClose }) {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    if (!boardId || !isOpen) return;

    API.get(`/activities/${boardId}`)
      .then((res) => setActivities(res.data))
      .catch((err) => console.error(err));

    const socket = getSocket();
    const handleNewActivity = (newAct) => {
      setActivities((prev) => [newAct, ...prev]);
    };

    if (socket) {
      socket.on('activity:created', handleNewActivity);
    }

    return () => {
      if (socket) {
        socket.off('activity:created', handleNewActivity);
      }
    };
  }, [boardId, isOpen]);

  // সিঙ্গেল লগ ডিলিট
  const handleDeleteItem = async (activityId) => {
    try {
      await API.delete(`/activities/${activityId}`);
      setActivities((prev) => prev.filter((a) => a._id !== activityId));
    } catch (err) {
      console.error(err);
    }
  };

  // সব লগ ক্লিয়ার করা
  const handleClearAll = async () => {
    if (!window.confirm('Clear all activity logs for this board?')) return;
    try {
      await API.delete(`/activities/clear/${boardId}`);
      setActivities([]);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-40 flex flex-col text-slate-100">
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-950/40">
        <div>
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <span>📜</span> Activity Audit Log
          </h3>
          <span className="text-[10px] text-slate-400">Live board event trail</span>
        </div>

        <div className="flex items-center gap-2">
          {activities.length > 0 && (
            <button
              onClick={handleClearAll}
              title="Clear all logs"
              className="text-[11px] px-2 py-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition"
            >
              Clear All
            </button>
          )}
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm p-1">
            ✕
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activities.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs italic">
            No activity logs recorded yet.
          </div>
        ) : (
          activities.map((act) => (
            <div
              key={act._id}
              className="group p-3 rounded-xl bg-slate-950/60 border border-white/[0.06] hover:border-white/10 transition flex items-start justify-between gap-3 text-xs"
            >
              <div className="flex-1">
                <p className="text-slate-300 leading-snug">
                  <span className="font-semibold text-amber-400">
                    {act.user?.name || 'Teammate'}
                  </span>{' '}
                  {act.details}
                </p>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {new Date(act.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>

              {/* Delete Single Activity Button */}
              <button
                onClick={() => handleDeleteItem(act._id)}
                title="Delete this entry"
                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 transition"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}