import { Sprint } from '../models/Sprint.js';
import { Task } from '../models/Task.js';
import { Column } from '../models/Column.js';

// বোর্ডের সব স্প্রিন্ট ফেচ করা
export const getBoardSprints = async (req, res) => {
  try {
    const { boardId } = req.params;
    const sprints = await Sprint.find({ boardId }).sort({ createdAt: -1 });
    res.json(sprints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// নতুন স্প্রিন্ট তৈরি
export const createSprint = async (req, res) => {
  try {
    const { boardId, name, goal, startDate, endDate } = req.body;
    const sprint = await Sprint.create({
      boardId,
      name: name || `Sprint ${Date.now().toString().slice(-4)}`,
      goal: goal || '',
      startDate: startDate || new Date(),
      endDate: endDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Default 2 Weeks
      status: 'future',
    });
    res.status(201).json(sprint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// স্প্রিন্ট স্ট্যাটাস আপডেট (Start or Complete Sprint)
export const updateSprintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'active', 'completed', 'future'

    const sprint = await Sprint.findById(id);
    if (!sprint) return res.status(404).json({ message: 'Sprint not found' });

    sprint.status = status;
    await sprint.save();

    res.json(sprint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Burndown Chart ও Velocity ডেটা এনালাইটিক্স
export const getSprintAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const sprint = await Sprint.findById(id);
    if (!sprint) return res.status(404).json({ message: 'Sprint not found' });

    // স্প্রিন্টের সব টাস্ক
    const tasks = await Task.find({ sprintId: id }).populate('columnId');

    const totalStoryPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

    // Done কলাম খোঁজা
    const doneColumn = await Column.findOne({ boardId: sprint.boardId, title: { $regex: /done/i } });
    const completedTasks = doneColumn
      ? tasks.filter((t) => t.columnId && t.columnId._id.toString() === doneColumn._id.toString())
      : [];

    const completedStoryPoints = completedTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

    // Burndown টাইমলাইন সিমুলেশন (১৪ দিনের আদর্শ বার্নডাউন লাইন)
    const days = 10;
    const burndownData = [];
    for (let day = 0; day <= days; day++) {
      const idealRemaining = Math.max(0, Math.round(totalStoryPoints - (totalStoryPoints / days) * day));
      burndownData.push({
        day: `Day ${day}`,
        ideal: idealRemaining,
        actual: day === 0 ? totalStoryPoints : Math.max(0, totalStoryPoints - (completedStoryPoints / days) * day),
      });
    }

    res.json({
      sprint,
      totalStoryPoints,
      completedStoryPoints,
      remainingPoints: totalStoryPoints - completedStoryPoints,
      burndownData,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};