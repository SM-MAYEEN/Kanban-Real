import express from 'express';
import { toggleReaction } from '../controllers/messageController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/:messageId/reaction', protect, toggleReaction);

export default router;
