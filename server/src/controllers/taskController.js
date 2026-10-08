import { Task } from '../models/Task.js';
import { Activity } from '../models/Activity.js';

export const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      boardId,
      columnId,
      sprintId,
      dueDate,
      priority,
      tags,
      subtasks,
      issueType,
      storyPoints,
      estimatedHours,
      blockedBy,
    } = req.body;

    if (!title || !boardId || !columnId) {
      return res.status(400).json({ message: 'Title, boardId, and columnId are required' });
    }

    const columnTaskCount = await Task.countDocuments({ columnId });
    const boardTotalTasks = await Task.countDocuments({ boardId });
    const taskKey = `KAN-${boardTotalTasks + 1}`;

    const task = await Task.create({
      key: taskKey,
      title: title.trim(),
      description: description || '',
      issueType: issueType || 'Task',
      storyPoints: Number(storyPoints) || 1,
      estimatedHours: Number(estimatedHours) || 0,
      loggedHours: 0,
      boardId,
      columnId,
      sprintId: sprintId || null,
      blockedBy: blockedBy || [],
      dueDate: dueDate || null,
      priority: priority || 'Medium',
      tags: tags || [],
      subtasks: subtasks || [],
      order: columnTaskCount,
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatar')
      .populate('blockedBy', 'key title');

    if (req.user) {
      await Activity.create({
        boardId,
        user: req.user._id,
        action: 'CREATED_TASK',
        details: `created [${taskKey}] "${task.title}" (${task.issueType})`,
      });
    }

    // Socket.io রিয়েলটাইম ব্রডকাস্ট
    const io = req.app.get('io');
    if (io) {
      io.to(boardId.toString()).emit('task:created', populatedTask);
    }

    res.status(201).json(populatedTask);
  } catch (error) {
    console.error('Create Task Server Error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedTask = await Task.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('assignedTo', 'name email avatar')
      .populate('blockedBy', 'key title');

    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const logTaskTime = async (req, res) => {
  try {
    const { id } = req.params;
    const { hours } = req.body;

    const hoursToAdd = Number(hours);
    if (isNaN(hoursToAdd) || hoursToAdd <= 0) {
      return res.status(400).json({ message: 'Please provide valid hours worked' });
    }

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    task.loggedHours = Number((task.loggedHours + hoursToAdd).toFixed(2));
    await task.save();

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findByIdAndDelete(id);

    if (!task) return res.status(404).json({ message: 'Task not found' });

    const io = req.app.get('io');
    if (io) {
      io.to(task.boardId.toString()).emit('task:deleted', id);
    }

    res.json({ message: 'Task deleted successfully', taskId: id, boardId: task.boardId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};