import { ChannelMessage } from '../models/ChannelMessage.js';

// মেসেজে ইমোজি রিয়েকশন টগল করা
export const toggleReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body || {};
    const userId = req.user._id;

    if (typeof emoji !== 'string' || !emoji.trim()) {
      return res.status(400).json({ message: 'A reaction emoji is required' });
    }
    const normalizedEmoji = emoji.trim();

    const message = await ChannelMessage.findById(messageId);
    if (!message) return res.status(404).json({ message: 'মেসেজ পাওয়া যায়নি' });

    // রিয়েকশন অ্যারে চেক করা
    let reactionItem = message.reactions.find((r) => r.emoji === normalizedEmoji);

    if (reactionItem) {
      const userIndex = reactionItem.users.findIndex((id) => id.equals(userId));
      if (userIndex > -1) {
        // আগেই দেওয়া থাকলে রিমুভ হবে
        reactionItem.users.splice(userIndex, 1);
        if (reactionItem.users.length === 0) {
          message.reactions = message.reactions.filter((r) => r.emoji !== normalizedEmoji);
        }
      } else {
        reactionItem.users.push(userId);
      }
    } else {
      message.reactions.push({ emoji: normalizedEmoji, users: [userId] });
    }

    await message.save();
    
    // সকেটে সবার কাছে রিয়েকশন সিঙ্ক পাঠানো
    const io = req.app.get('io');
    if (io) io.emit('message_reaction_updated', { messageId, reactions: message.reactions });

    return res.status(200).json(message);
  } catch (err) {
    console.error('Toggle message reaction error:', err);
    return res.status(500).json({ message: 'Unable to update message reaction' });
  }
};