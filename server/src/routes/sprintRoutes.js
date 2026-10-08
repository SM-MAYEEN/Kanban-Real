import express from 'express';
import {
    createSprint,
    getBoardSprints,
    getSprintAnalytics,
    updateSprintStatus,
} from '../controllers/sprintController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/board/:boardId', getBoardSprints);
router.post('/', createSprint);
router.put('/:id/status', updateSprintStatus);
router.get('/:id/analytics', getSprintAnalytics);

export default router;