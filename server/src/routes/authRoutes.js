import express from 'express';
import {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  getTeammates,
  changePassword,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public Routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected Routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.get('/teammates', protect, getTeammates);
router.put('/change-password', protect, changePassword);

export default router;