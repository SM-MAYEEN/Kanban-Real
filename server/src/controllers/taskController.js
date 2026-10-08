import { Task } from '../models/Task.js';
import { Column } from '../models/Column.js';
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
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    if (!boardId || !columnId) {
      return res.status(400).json({ message: 'Board ID and Column ID are required' });
    }

    // ভ্যালিড ObjectId নিশ্চিত করা
    const bId = mongoose.isValidObjectId(boardId) ? new mongoose.Types.ObjectId(boardId) : null;
    const cId = mongoose.isValidObjectId(columnId) ? new mongoose.Types.ObjectId(columnId) : null;

    if (!bId || !cId) {
      return res.status(400).json({ message: 'Invalid Board ID or Column ID format' });
    }

    // কলামের টাস্ক অর্ডার
    const columnTaskCount = await Task.countDocuments({ 
      $or: [{ columnId: cId }, { column: cId }] 
    });

    // সাবটাস্ক প্রসেসিং
    const formattedSubtasks = Array.isArray(subtasks)
      ? subtasks
          .map((st) => {
            if (typeof st === 'string' && st.trim()) return { title: st.trim(), completed: false };
            if (st && typeof st === 'object' && st.title) return { title: String(st.title).trim(), completed: Boolean(st.completed) };
            return null;
          })
          .filter(Boolean)
      : [];

    // পেলোড - উভয় ফিল্ড নাম দিয়ে দেওয়া হলো যাতে স্কিমায় যে নামেই থাকুক কাজ করে
    const taskDoc = {
      title: title.trim(),
      description: description ? String(description).trim() : '',
      issueType: issueType || 'Task',
      storyPoints: Number(storyPoints) || 1,
      estimatedHours: Number(estimatedHours) || 0,
      loggedHours: 0,
      boardId: bId,
      board: bId,
      columnId: cId,
      column: cId,
      priority: priority || 'Medium',
      tags: Array.isArray(tags) ? tags : [],
      subtasks: formattedSubtasks,
      order: columnTaskCount,
    };

    if (sprintId && mongoose.isValidObjectId(sprintId)) {
      taskDoc.sprintId = new mongoose.Types.ObjectId(sprintId);
    }
    if (dueDate) {
      taskDoc.dueDate = new Date(dueDate);
    }
    if (req.user && (req.user._id || req.user.id)) {
      const uId = req.user._id || req.user.id;
      taskDoc.creator = uId;
      taskDoc.user = uId;
    }

    // Task.key is unique across the collection, so choose an unused key globally.
    const getNextTaskKey = async () => {
      const existingKeys = await Task.distinct('key', { key: /^KAN-\d+$/ });
      const nextNumber = existingKeys.reduce((max, key) => {
        const match = /^KAN-(\d+)$/.exec(key);
        return match ? Math.max(max, Number(match[1])) : max;
      }, 0) + 1;
      return `KAN-${nextNumber}`;
    };

    // Retry if another request claims the same key after the lookup.
    let newTask;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      taskDoc.key = await getNextTaskKey();
      try {
        newTask = await Task.create(taskDoc);
        break;
      } catch (error) {
        const isKeyCollision = error.code === 11000
          && (error.keyPattern?.key || error.keyValue?.key);
        if (!isKeyCollision || attempt === 4) {
          throw error;
        }
      }
    }
    const taskKey = newTask.key;

    // ২. কলামের সাথে টাস্ক লিঙ্ক করা (যদি কলাম স্কিমায় tasks অ্যারে থাকে)
    try {
      if (Column) {
        await Column.findByIdAndUpdate(cId, {
          $addToSet: { tasks: newTask._id }
        });
      }
    } catch (colErr) {
      console.warn('Column task update bypassed:', colErr.message);
    }

    // ৩. পপুলেট
    let populatedTask;
    try {
      populatedTask = await Task.findById(newTask._id)
        .populate('assignedTo', 'name email avatar')
        .populate('blockedBy', 'key title');
    } catch {
      populatedTask = newTask;
    }

    // ৪. অ্যাক্টিভিটি হিস্ট্রি
    if (req.user && (req.user._id || req.user.id)) {
      try {
        await Activity.create({
          boardId: bId,
          user: req.user._id || req.user.id,
          action: 'CREATED_TASK',
          details: `created [${taskKey}] "${newTask.title}"`,
        });
      } catch (actErr) {
        console.warn('Activity write bypassed:', actErr.message);
      }
    }

    // ৫. সকেট এমিট
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(bId.toString()).emit('task:created', populatedTask || newTask);
      }
    } catch (sockErr) {
      console.warn('Socket emit bypassed:', sockErr.message);
    }

    return res.status(201).json(populatedTask || newTask);
  } catch (error) {
    console.error('CRITICAL TASK CONTROLLER 500 ERROR:', error);
    return res.status(500).json({ 
      message: error.message || 'Internal server error creating task',
      details: error.name || 'Error'
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
      if (Column && task.columnId) {
        await Column.findByIdAndUpdate(task.columnId, {
          $pull: { tasks: id }
        });
      }
    } catch {
      // pass
    }

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