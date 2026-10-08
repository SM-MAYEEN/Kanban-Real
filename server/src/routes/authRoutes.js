import express from 'express';
import {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  getTeammates,
  changePassword,
  forgotPassword,
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public Routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Password Reset Routes (উভয় পাথ রাখা হয়েছে যাতে 404 না আসে)
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', forgotPassword);

// Protected Routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.get('/teammates', protect, getTeammates);
router.put('/change-password', protect, changePassword);

export default router;