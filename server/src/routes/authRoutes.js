import express from 'express';
import {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  getTeammates,
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.get('/teammates', protect, getTeammates);

export default router;