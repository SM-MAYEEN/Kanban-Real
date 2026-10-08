import express from 'express';
import {
  createTask,
  updateTask,
  deleteTask,
  logTaskTime,
} from '../controllers/taskController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', createTask);
router.put('/:id', updateTask);
router.post('/:id/log-time', logTaskTime);
router.delete('/:id', deleteTask);

export default router;