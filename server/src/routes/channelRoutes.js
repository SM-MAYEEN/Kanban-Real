import express from 'express';
import {
  getChannelMessages,
  postChannelMessage,
  deleteChannelMessage,
} from '../controllers/channelController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/:channel', getChannelMessages);
router.post('/:channel', postChannelMessage);
router.delete('/:id', deleteChannelMessage);

export default router;