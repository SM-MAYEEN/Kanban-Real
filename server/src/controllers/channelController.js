import { ChannelMessage } from '../models/ChannelMessage.js';
import { Board } from '../models/Board.js';

// চ্যানেল মেসেজ ফেচ
export const getChannelMessages = async (req, res) => {
  try {
    const { channel } = req.params;
    const messages = await ChannelMessage.find({ channel })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(60);
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// চ্যানেল মেসেজ পাঠানো (Announcements পারমিশন চেক সহ)
export const postChannelMessage = async (req, res) => {
  try {
    const { channel } = req.params;
    const { text, boardId } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Message cannot be empty' });

    // announcements চ্যানেলে শুধুমাত্র বোর্ডের ওনার / লিডার পোস্ট করতে পারবে
    if (channel === 'announcements' && boardId) {
      const board = await Board.findById(boardId);
      if (board && board.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Only team leader can post in announcements.' });
      }
    }

    const msg = await ChannelMessage.create({
      channel,
      text: text.trim(),
      boardId: boardId || null,
      user: req.user._id,
    });

    const populated = await ChannelMessage.findById(msg._id).populate('user', 'name avatar');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// চ্যানেল মেসেজ ডিলিট
export const deleteChannelMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const msg = await ChannelMessage.findById(id);
    if (!msg) return res.status(404).json({ message: 'Message not found' });

    // শুধু মেসেজের লেখক ডিলিট করতে পারবে
    if (msg.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await ChannelMessage.findByIdAndDelete(id);
    res.json({ message: 'Message deleted successfully', messageId: id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};