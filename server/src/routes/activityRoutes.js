import express from 'express';
import {
  getBoardActivities,
  clearBoardActivities,
  deleteSingleActivity,
} from '../controllers/activityController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/:boardId', getBoardActivities);
router.delete('/clear/:boardId', clearBoardActivities);
router.delete('/:id', deleteSingleActivity);

export default router;