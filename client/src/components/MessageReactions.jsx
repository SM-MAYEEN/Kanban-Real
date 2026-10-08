import { useEffect, useState } from 'react';
import API from '../api/axiosInstance';
import { useAuthStore } from '../store/authStore';

const QUICK_EMOJIS = ['👍', '🚀', '❤️', '🔥', '🎉'];

export default function MessageReactions({ message }) {
  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = currentUser?._id || currentUser?.id;
  const [reactions, setReactions] = useState(message.reactions || []);

  useEffect(() => {
    setReactions(message.reactions || []);
  }, [message.reactions]);

  const handleReact = async (emoji) => {
    try {
      const res = await API.post(`/messages/${message._id}/reaction`, { emoji });
      setReactions(res.data.reactions);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
      {/* অলরেডি দেওয়া রিয়েকশন লিস্ট */}
      {reactions.map((r, i) => {
        const hasReacted = r.users?.some((id) => String(id) === String(currentUserId));
        return (
          <button
            key={i}
            onClick={() => handleReact(r.emoji)}
            className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 border transition ${
              hasReacted
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-bold'
                : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
            }`}
          >
            <span>{r.emoji}</span>
            <span className="text-[10px]">{r.users?.length || 0}</span>
          </button>
        );
      })}

      {/* কুইক অ্যাড ইমোজি মেনু */}
      <div className="flex items-center gap-1 bg-slate-900/90 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleReact(emoji)}
            className="hover:scale-125 transition text-xs p-0.5"
            title={`React with ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}