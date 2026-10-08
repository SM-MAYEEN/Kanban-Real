import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Task } from '../models/Task.js';
import { Activity } from '../models/Activity.js';
import { Column } from '../models/Column.js';
import { findBoardForMember } from '../utils/boardAccess.js';

// বর্তমানে কানেক্টেড ইউজারদের তালিকা (Set of User IDs)
const onlineUsers = new Map();

export const initializeSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    onlineUsers.set(userId, socket.id);

    // সব ক্লায়েন্টকে বর্তমান অনলাইন ইউজারদের তালিকা পাঠানো
    io.emit('users:online', Array.from(onlineUsers.keys()));

    socket.on('board:join', async (boardId) => {
      try {
        const board = await findBoardForMember(boardId, socket.user._id);
        if (!board) {
          socket.emit('board:access-denied', { boardId });
          return;
        }
        socket.join(board._id.toString());
      } catch (error) {
        console.error('Socket board:join error:', error.message);
        socket.emit('board:access-denied', { boardId });
      }
    });

    socket.on('board:leave', (boardId) => {
      socket.leave(boardId);
    });

    socket.on('task:move', async (data) => {
      try {
        const { taskId, boardId, sourceColumnId, destinationColumnId, newOrder } = data;

        const task = await Task.findById(taskId);
        if (!task) return;
        const board = await findBoardForMember(boardId, socket.user._id);
        if (!board || task.boardId.toString() !== board._id.toString()) return;
        const destinationColumn = await Column.findOne({
          _id: destinationColumnId,
          boardId: board._id,
        });
        if (!destinationColumn) return;

        task.columnId = destinationColumnId;
        task.order = newOrder;
        await task.save();

        const activity = await Activity.create({
          boardId,
          user: socket.user._id,
          action: 'MOVED_TASK',
          details: `moved "${task.title}"`,
        });

        const populatedActivity = await Activity.findById(activity._id).populate(
          'user',
          'name email avatar'
        );

        socket.to(boardId).emit('task:moved', {
          taskId,
          sourceColumnId,
          destinationColumnId,
          newOrder,
        });

        io.to(boardId).emit('activity:created', populatedActivity);
      } catch (error) {
        console.error('Socket task:move error:', error.message);
      }
    });

    socket.on('task:created', async ({ boardId, task }) => {
      try {
        const board = await findBoardForMember(boardId, socket.user._id);
        const storedTask = task?._id ? await Task.findById(task._id).select('boardId') : null;
        if (board && storedTask?.boardId.toString() === board._id.toString()) {
          socket.to(board._id.toString()).emit('task:created', task);
        }
      } catch (error) {
        console.error('Socket task:created error:', error.message);
      }
    });

    socket.on('comment:create', async ({ boardId, taskId, comment }) => {
      try {
        const board = await findBoardForMember(boardId, socket.user._id);
        const task = await Task.findOne({ _id: taskId, boardId }).select('_id');
        if (board && task) {
          socket.to(board._id.toString()).emit('comment:added', { taskId, comment });
        }
      } catch (error) {
        console.error('Socket comment:create error:', error.message);
      }
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      io.emit('users:online', Array.from(onlineUsers.keys()));
    });
  });
};