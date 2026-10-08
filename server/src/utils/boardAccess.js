import mongoose from 'mongoose';
import { Board } from '../models/Board.js';

export const isBoardOwner = (board, userId) => {
  const ownerId = board.owner?._id || board.owner;
  return ownerId.toString() === userId.toString();
};

export const findBoardForMember = async (boardId, userId) => {
  if (!mongoose.isValidObjectId(boardId)) return null;

  return Board.findOne({
    _id: boardId,
    $or: [{ owner: userId }, { members: userId }],
  }).select('_id owner members');
};
