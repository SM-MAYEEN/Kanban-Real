import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initializeSocket } from './socket/socketHandler.js';

const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

const server = http.createServer(app);

// Allowed origins (Development + Production Vercel URL)
const allowedOrigins = process.env.CLIENT_URL 
  ? [process.env.CLIENT_URL, 'http://localhost:5173'] 
  : ['http://localhost:5173'];

// Socket.io configuration with Production CORS setup
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      // Vercel deployment domains allow korar jonno
      if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      return callback(null, true); // Fallback safe allow
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