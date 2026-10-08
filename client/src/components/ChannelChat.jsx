import { useState, useEffect, useRef } from 'react';
import API from '../api/axiosInstance';
import { getSocket } from '../socket/socketClient';
import { useAuthStore } from '../store/authStore';

export default function ChannelChat({ channel, boardId, boardOwnerId }) {
  const [messages, setMessages] = useState([]);
  const [newText, setNewText] = useState('');
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);
  const bottomRef = useRef(null);

  // চেক: ইউজার কি টিম লিডার?
  const isLeader = user && boardOwnerId && user._id === boardOwnerId;
  const isAnnouncements = channel === 'announcements';
  const canPost = !isAnnouncements || isLeader;

  const fetchMessages = async () => {
    try {
      const res = await API.get(`/channels/${channel}`);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    const socket = getSocket();
    const handleNewMsg = (msg) => {
      if (msg.channel === channel) {
        setMessages((prev) => [...prev, msg]);
      }
    };
    const handleDeleteMsg = ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    };

    if (socket) {
      socket.on('channel:message', handleNewMsg);
      socket.on('channel:message:deleted', handleDeleteMsg);
    }

    return () => {
      if (socket) {
        socket.off('channel:message', handleNewMsg);
        socket.off('channel:message:deleted', handleDeleteMsg);
      }
    };
  }, [channel]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newText.trim() || !canPost) return;

    try {
      const res = await API.post(`/channels/${channel}`, { text: newText, boardId });
      setMessages((prev) => [...prev, res.data]);
      setNewText('');

      const socket = getSocket();
      if (socket) {
        socket.emit('channel:send', res.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post message');
    }
  };

  // মেসেজ ডিলিট হ্যান্ডলার
  const handleDelete = async (messageId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await API.delete(`/channels/${messageId}`);
      setMessages((prev) => prev.filter((m) => m._id !== messageId));

      const socket = getSocket();
      if (socket) {
        socket.emit('channel:delete', { messageId });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-950/70 text-slate-100 overflow-hidden">
      {/* হেডার */}
      <div className="h-14 px-6 border-b border-white/[0.08] flex items-center justify-between bg-slate-900/60 shrink-0">
        <div>
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <span>#</span> {channel}
          </h3>
          <span className="text-[11px] text-slate-400">
            {isAnnouncements
              ? '📢 Official team broadcasts (Leader post only)'
              : 'Team discussions & quick collaborations'}
          </span>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
          ● Live Discussion
        </span>
      </div>

      {/* মেসেজ স্ক্রল এরিয়া */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {loading ? (
          <div className="text-slate-500 text-xs text-center py-10 animate-pulse">
            Loading discussions...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs italic">
            Start of #{channel}. Send a message to collaborate!
          </div>
        ) : (
          messages.map((m) => {
            const isMyMsg = user && m.user && (m.user._id === user._id || m.user === user._id);
            return (
              <div
                key={m._id}
                className="group flex items-start justify-between gap-3 p-2.5 rounded-xl hover:bg-white/[0.03] transition"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-900 border border-amber-400/40 flex items-center justify-center font-bold text-xs text-amber-300 shrink-0">
                    {m.user?.avatar ? (
                      <img src={m.user.avatar} alt="Avatar" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      m.user?.name?.charAt(0) || 'U'
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-xs text-white">
                        {m.user?.name || 'Teammate'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{m.text}</p>
                  </div>
                </div>

                {/* ডিলিট বাটন (শুধুমাত্র নিজের মেসেজে আসবে) */}
                {isMyMsg && (
                  <button
                    onClick={() => handleDelete(m._id)}
                    title="Delete message"
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 text-xs transition"
                  >
                    🗑️
                  </button>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* ইনপুট বার */}
      {canPost ? (
        <form onSubmit={handleSend} className="p-4 border-t border-white/[0.08] bg-slate-900/60 flex gap-3 shrink-0">
          <input
            type="text"
            placeholder={`Message #${channel}...`}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md"
          >
            Send
          </button>
        </form>
      ) : (
        <div className="p-3 border-t border-white/[0.08] bg-slate-900/40 text-center text-xs text-amber-300/80 italic">
          🔒 Only team leader / owner can broadcast in #{channel}.
        </div>
      )}
    </div>
  );
}