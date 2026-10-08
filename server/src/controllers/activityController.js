import { Activity } from '../models/Activity.js';
import { findBoardForMember, isBoardOwner } from '../utils/boardAccess.js';
import { Board } from '../models/Board.js';

// বোর্ডের সব অ্যাক্টিভিটি ফেচ
export const getBoardActivities = async (req, res) => {
  try {
    const { boardId } = req.params;
    const board = await findBoardForMember(boardId, req.user._id);
    if (!board) {
      return res.status(404).json({ message: 'Board not found or you are not a member.' });
    }
    const activities = await Activity.find({ boardId })
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(40);

    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// পুরো বোর্ডের সব অ্যাক্টিভিটি লগ ক্লিয়ার করা
export const clearBoardActivities = async (req, res) => {
  try {
    const { boardId } = req.params;
    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ message: 'Board not found.' });
    if (!isBoardOwner(board, req.user._id)) {
      return res.status(403).json({ message: 'Only the team leader can clear board activity.' });
    }
    await Activity.deleteMany({ boardId });
    res.json({ message: 'All board activities cleared successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// সিঙ্গেল অ্যাক্টিভিটি ডিলিট করা
export const deleteSingleActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const activity = await Activity.findById(id);
    if (!activity) return res.status(404).json({ message: 'Activity not found.' });
    const board = await Board.findById(activity.boardId);
    if (!board) return res.status(404).json({ message: 'Board not found.' });
    if (!isBoardOwner(board, req.user._id)) {
      return res.status(403).json({ message: 'Only the team leader can delete activity.' });
    }
    await Activity.findByIdAndDelete(id);
    res.json({ message: 'Activity log entry deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};