import express from 'express';
import { getTaskComments, addComment } from '../controllers/commentController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/:taskId', getTaskComments);
router.post('/:taskId', addComment);

export default router;