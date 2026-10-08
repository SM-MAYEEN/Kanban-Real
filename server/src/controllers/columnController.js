import { Column } from '../models/Column.js';
import { Task } from '../models/Task.js';
import { findBoardForMember } from '../utils/boardAccess.js';

// নতুন কলাম তৈরি করা
export const createColumn = async (req, res) => {
  try {
    const { title, boardId, wipLimit } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Column title is required' });
    }

    const board = await findBoardForMember(boardId, req.user._id);
    if (!board) {
      return res.status(404).json({ message: 'Board not found or you are not a member.' });
    }

    const columnCount = await Column.countDocuments({ boardId });
    const column = await Column.create({
      title: title.trim(),
      boardId,
      order: columnCount,
      wipLimit: Number(wipLimit) || 0,
    });

    res.status(201).json(column);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// কলামের নাম ও WIP লিমিট আপডেট করা
export const updateColumn = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, wipLimit } = req.body;

    const column = await Column.findById(id);
    if (!column) return res.status(404).json({ message: 'Column not found' });
    const board = await findBoardForMember(column.boardId, req.user._id);
    if (!board) {
      return res.status(404).json({ message: 'Column not found or you are not a board member.' });
    }

    if (title !== undefined) column.title = title.trim();
    if (wipLimit !== undefined) column.wipLimit = Number(wipLimit);

    await column.save();
    res.json(column);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// কলাম ডিলিট করা (ভেতরের টাস্কসহ)
export const deleteColumn = async (req, res) => {
  try {
    const { id } = req.params;
    const column = await Column.findById(id);
    if (!column) return res.status(404).json({ message: 'Column not found' });
    const board = await findBoardForMember(column.boardId, req.user._id);
    if (!board) {
      return res.status(404).json({ message: 'Column not found or you are not a board member.' });
    }

    await Task.deleteMany({ columnId: id });
    await Column.findByIdAndDelete(id);

    res.json({ message: 'Column and associated tasks deleted', columnId: id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};