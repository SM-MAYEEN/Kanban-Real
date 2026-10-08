import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import boardRoutes from './routes/boardRoutes.js';
import columnRoutes from './routes/columnRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import sprintRoutes from './routes/sprintRoutes.js';
import channelRoutes from './routes/channelRoutes.js';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Auth Routes (Duti prefix allow kora holo jate kono path e 404 na ashe)
app.use('/api/auth', authRoutes);
app.use('/api', authRoutes);

// Core Kanban & Collaboration Routes
app.use('/api/boards', boardRoutes);
app.use('/api/columns', columnRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/sprints', sprintRoutes);
app.use('/api/channels', channelRoutes);

// Health Check
app.get('/health', (req, res) => res.json({ status: 'ok', server: 'Live' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', server: 'Live' }));

// 404 Fallback Logger
app.use((req, res, next) => {
  res.status(404).json({ message: `Cannot ${req.method} ${req.originalUrl}` });
});

export default app;