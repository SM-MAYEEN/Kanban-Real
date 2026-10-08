import jwt from 'jsonwebtoken';

// গ্লোবাল অনলাইন ইউজার ট্র্যাক করার জন্য ম্যাপ (userId -> Set of socketIds)
const onlineUsers = new Map();

export const setupSocketServer = (io) => {
  // অথেন্টিকেশন মিডলওয়্যার: টোকেন থেকে ইউজার আইডি উদ্ধার
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;

    if (userId) {
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }
      onlineUsers.get(userId).add(socket.id);

      // সবার কাছে বর্তমান সব অনলাইন ইউজারের আইডি লিস্ট ব্রডকাস্ট করা
      const activeIds = Array.from(onlineUsers.keys());
      io.emit('users:online', activeIds);
    }

    // বোর্ড রুমে জয়েন ও লিভ
    socket.on('board:join', (boardId) => {
      socket.join(boardId);
    });

    socket.on('board:leave', (boardId) => {
      socket.leave(boardId);
    });

    // টাস্ক ইভেন্টস
    socket.on('task:move', (data) => {
      socket.to(data.boardId).emit('task:moved', data);
    });

    socket.on('task:created', (data) => {
      socket.to(data.boardId).emit('task:created', data.task);
    });

    socket.on('task:deleted', (data) => {
      socket.to(data.boardId).emit('task:deleted', data);
    });

    // ডিসকানেক্ট হ্যান্ডলিং
    socket.on('disconnect', () => {
      if (userId && onlineUsers.has(userId)) {
        const userSockets = onlineUsers.get(userId);
        userSockets.delete(socket.id);

        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
        }

        // রিফ্রেশড অনলাইন লিস্ট ব্রডকাস্ট
        const activeIds = Array.from(onlineUsers.keys());
        io.emit('users:online', activeIds);
      }
    });
  });
};