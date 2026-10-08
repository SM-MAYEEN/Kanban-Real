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
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    if (!boardId || !columnId) {
      return res.status(400).json({ message: 'Board ID and Column ID are required' });
    }

    // ID ভ্যালিডেশন
    const validBoardId = mongoose.isValidObjectId(boardId) ? boardId : null;
    const validColumnId = mongoose.isValidObjectId(columnId) ? columnId : null;

    if (!validBoardId || !validColumnId) {
      return res.status(400).json({ message: 'Invalid Board ID or Column ID' });
    }

    const columnTaskCount = await Task.countDocuments({ columnId: validColumnId });
    const boardTotalTasks = await Task.countDocuments({ boardId: validBoardId });
    const taskKey = `KAN-${boardTotalTasks + 1}`;

    // Subtasks নিরাপদ ফরম্যাটিং
    const sanitizedSubtasks = Array.isArray(subtasks)
      ? subtasks
          .map((st) => {
            if (typeof st === 'string') return { title: st, completed: false };
            if (st && typeof st === 'object') return { title: st.title || '', completed: Boolean(st.completed) };
            return null;
          })
          .filter((st) => st && st.title.trim())
      : [];

    // BlockedBy নিরাপদ ফরম্যাটিং
    const sanitizedBlockedBy = Array.isArray(blockedBy)
      ? blockedBy.filter((id) => mongoose.isValidObjectId(id))
      : [];

    // বর্তমান ইউজারের নিরাপদ রেফারেন্স
    const currentUserId = req.user ? (req.user._id || req.user.id) : null;

    // টাস্ক ডাটা অবজেক্ট তৈরি
    const taskData = {
      key: taskKey,
      title: title.trim(),
      description: description ? description.trim() : '',
      issueType: issueType || 'Task',
      storyPoints: Number(storyPoints) || 1,
      estimatedHours: Number(estimatedHours) || 0,
      loggedHours: 0,
      boardId: validBoardId,
      columnId: validColumnId,
      sprintId: mongoose.isValidObjectId(sprintId) ? sprintId : null,
      blockedBy: sanitizedBlockedBy,
      dueDate: dueDate ? new Date(dueDate) : null,
      priority: priority || 'Medium',
      tags: Array.isArray(tags) ? tags : [],
      subtasks: sanitizedSubtasks,
      order: columnTaskCount,
    };

    // যদি Task স্কিমাতে creator বা user ফিল্ড থাকে
    if (currentUserId) {
      taskData.creator = currentUserId;
      taskData.user = currentUserId;
    }

    const newTask = await Task.create(taskData);

    // Populate করা
    let populatedTask;
    try {
      populatedTask = await Task.findById(newTask._id)
        .populate('assignedTo', 'name email avatar')
        .populate('blockedBy', 'key title');
    } catch {
      populatedTask = newTask;
    }

    // অ্যাক্টিভিটি লগ (কোনো কারণে ফেইল করলেও যেন টাস্ক ক্রিয়েশন না থামে)
    if (currentUserId) {
      try {
        await Activity.create({
          boardId: validBoardId,
          user: currentUserId,
          action: 'CREATED_TASK',
          details: `created [${taskKey}] "${newTask.title}"`,
        });
      } catch (actErr) {
        console.error('Activity creation error ignored:', actErr.message);
      }
    }

    // Socket.io ব্রডকাস্ট (সেফ কল)
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(validBoardId.toString()).emit('task:created', populatedTask || newTask);
      }
    } catch (socketErr) {
      console.error('Socket emit ignored:', socketErr.message);
    }

    return res.status(201).json(populatedTask || newTask);
  } catch (error) {
    console.error('CRITICAL: Create Task Server 500 Error ->', error);
    return res.status(500).json({ 
      message: 'Server error while creating task: ' + error.message 
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
    } catch (socketErr) {
      console.error('Socket delete emit ignored:', socketErr.message);
    }

    res.json({ message: 'Task deleted successfully', taskId: id, boardId: task.boardId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};