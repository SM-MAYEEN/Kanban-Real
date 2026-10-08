import express from 'express';
import {
  createTask,
  moveTask,
  updateTask,
  logTaskTime,
  deleteTask,
} from '../controllers/taskController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createTask);
router.put('/:id/move', protect, moveTask);
router.put('/:id', protect, updateTask);
router.put('/:id/time', protect, logTaskTime);
router.delete('/:id', protect, deleteTask);

export default router;