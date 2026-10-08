import { Comment } from '../models/Comment.js';
import { Task } from '../models/Task.js';
import { findBoardForMember } from '../utils/boardAccess.js';

// @route GET /api/comments/:taskId
export const getTaskComments = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    const board = await findBoardForMember(task.boardId, req.user._id);
    if (!board) {
      return res.status(404).json({ message: 'Task not found or you are not a board member.' });
    }
    const comments = await Comment.find({ taskId })
      .populate('author', 'name email avatar')
      .sort({ createdAt: 1 });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/comments/:taskId
export const addComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    const board = await findBoardForMember(task.boardId, req.user._id);
    if (!board) {
      return res.status(404).json({ message: 'Task not found or you are not a board member.' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment content cannot be empty' });
    }

    const comment = await Comment.create({
      taskId,
      author: req.user._id,
      content,
    });

    const populatedComment = await Comment.findById(comment._id).populate(
      'author',
      'name email avatar'
    );

    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};