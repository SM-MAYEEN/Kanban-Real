import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initializeSocket } from './socket/socketHandler.js';
import { isAllowedOrigin } from './config/cors.js';

const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origin is not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// app instance-e socket.io attach kora (controllers-e use korar jonno)
app.set('io', io);

// Socket handler initialization
initializeSocket(io);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});