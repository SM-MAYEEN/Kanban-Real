import { Activity } from '../models/Activity.js';

// বোর্ডের সব অ্যাক্টিভিটি ফেচ
export const getBoardActivities = async (req, res) => {
  try {
    const { boardId } = req.params;
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
    await Activity.findByIdAndDelete(id);
    res.json({ message: 'Activity log entry deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};