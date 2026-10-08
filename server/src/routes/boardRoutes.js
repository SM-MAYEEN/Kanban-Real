import express from 'express';
import {
  createBoard,
  getUserBoards,
  getArchivedBoards,
  getBoardDetails,
  archiveBoard,
  restoreBoard,
  approvePermanentDelete,
  addMemberByEmail,
  acceptInviteToken,
} from '../controllers/boardController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/').post(createBoard).get(getUserBoards);
router.get('/archived', getArchivedBoards);
router.get('/:id', getBoardDetails);

router.post('/:id/members', addMemberByEmail);
router.post('/accept-invite', acceptInviteToken);

router.put('/:id/archive', archiveBoard);
router.put('/:id/restore', restoreBoard);
router.delete('/:id/permanent', approvePermanentDelete);

export default router;