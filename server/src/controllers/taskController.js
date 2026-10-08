import { Task } from '../models/Task.js';
import { Activity } from '../models/Activity.js';
import mongoose from 'mongoose';

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
      assignedTo,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    if (!boardId || !columnId) {
      return res.status(400).json({ message: 'Board ID and Column ID are required' });
    }

    // ObjectId সেফটি ভ্যালিডেশন
    const validBoardId = mongoose.isValidObjectId(boardId) ? new mongoose.Types.ObjectId(boardId) : null;
    const validColumnId = mongoose.isValidObjectId(columnId) ? new mongoose.Types.ObjectId(columnId) : null;

    if (!validBoardId || !validColumnId) {
      return res.status(400).json({ message: 'Invalid Board ID or Column ID format' });
    }

    const columnTaskCount = await Task.countDocuments({ columnId: validColumnId });
    const boardTotalTasks = await Task.countDocuments({ boardId: validBoardId });
    // ইউনিক কি নিশ্চিত করা
    const taskKey = `KAN-${boardTotalTasks + 1}-${Math.floor(100 + Math.random() * 900)}`;

    // Subtasks স্যানিটাইজেশন
    const cleanSubtasks = Array.isArray(subtasks)
      ? subtasks
          .map((st) => {
            if (typeof st === 'string' && st.trim()) return { title: st.trim(), completed: false };
            if (st && typeof st === 'object' && st.title) return { title: String(st.title).trim(), completed: Boolean(st.completed) };
            return null;
          })
          .filter(Boolean)
      : [];

    // টাস্ক পেলোড তৈরি (যেখানে কোনো ইনভ্যালিড ObjectId পাস হবে না)
    const taskPayload = {
      key: taskKey,
      title: title.trim(),
      description: description ? String(description).trim() : '',
      issueType: issueType || 'Task',
      storyPoints: Number(storyPoints) || 1,
      estimatedHours: Number(estimatedHours) || 0,
      loggedHours: 0,
      boardId: validBoardId,
      columnId: validColumnId,
      priority: priority || 'Medium',
      tags: Array.isArray(tags) ? tags : [],
      subtasks: cleanSubtasks,
      order: columnTaskCount,
    };

    // অপশনাল ফিল্ডগুলো কেবল ভ্যালিড হলেই পুশ করা হবে
    if (sprintId && mongoose.isValidObjectId(sprintId)) {
      taskPayload.sprintId = new mongoose.Types.ObjectId(sprintId);
    }
    if (dueDate) {
      taskPayload.dueDate = new Date(dueDate);
    }
    if (assignedTo && mongoose.isValidObjectId(assignedTo)) {
      taskPayload.assignedTo = new mongoose.Types.ObjectId(assignedTo);
    }
    if (Array.isArray(blockedBy) && blockedBy.length > 0) {
      taskPayload.blockedBy = blockedBy.filter((id) => mongoose.isValidObjectId(id)).map((id) => new mongoose.Types.ObjectId(id));
    }

    // অথেন্টিকেটেড ইউজার থাকলে যোগ করা
    if (req.user && (req.user._id || req.user.id)) {
      const uId = req.user._id || req.user.id;
      taskPayload.creator = uId;
      taskPayload.user = uId;
    }

    const task = await Task.create(taskPayload);

    // Populate ট্রাই-ক্যাচ
    let populatedTask;
    try {
      populatedTask = await Task.findById(task._id)
        .populate('assignedTo', 'name email avatar')
        .populate('blockedBy', 'key title');
    } catch {
      populatedTask = task;
    }

    // এক্টিভিটি ট্রাই-ক্যাচ
    if (req.user && (req.user._id || req.user.id)) {
      try {
        await Activity.create({
          boardId: validBoardId,
          user: req.user._id || req.user.id,
          action: 'CREATED_TASK',
          details: `created [${taskKey}] "${task.title}"`,
        });
      } catch (actErr) {
        console.warn('Activity write skipped:', actErr.message);
      }
    }

    // সকেট ট্রাই-ক্যাচ
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(validBoardId.toString()).emit('task:created', populatedTask || task);
      }
    } catch (sErr) {
      console.warn('Socket emit skipped:', sErr.message);
    }

    return res.status(201).json(populatedTask || task);
  } catch (error) {
    console.error('SERVER TASK ERROR LOG:', error);
    return res.status(500).json({
      message: error.message || 'Server error creating task',
      errorDetails: error.toString(),
    });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid Task ID' });
    }

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
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid Task ID' });
    }

    const task = await Task.findByIdAndDelete(id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    try {
      const io = req.app.get('io');
      if (io) {
        io.to(task.boardId.toString()).emit('task:deleted', id);
      }
    } catch {
      // pass
    }

    res.json({ message: 'Task deleted successfully', taskId: id, boardId: task.boardId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};