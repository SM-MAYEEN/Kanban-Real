// মেসেজে ইমোজি রিয়েকশন টগল করা
export const toggleReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'মেসেজ পাওয়া যায়নি' });

    // রিয়েকশন অ্যারে চেক করা
    let reactionItem = message.reactions.find((r) => r.emoji === emoji);

    if (reactionItem) {
      const userIndex = reactionItem.users.indexOf(userId);
      if (userIndex > -1) {
        // আগেই দেওয়া থাকলে রিমুভ হবে
        reactionItem.users.splice(userIndex, 1);
        if (reactionItem.users.length === 0) {
          message.reactions = message.reactions.filter((r) => r.emoji !== emoji);
        }
      } else {
        reactionItem.users.push(userId);
      }
    } else {
      message.reactions.push({ emoji, users: [userId] });
    }

    await message.save();
    
    // সকেটে সবার কাছে রিয়েকশন সিঙ্ক পাঠানো
    const io = req.app.get('io');
    if (io) io.emit('message_reaction_updated', { messageId, reactions: message.reactions });

    res.status(200).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};