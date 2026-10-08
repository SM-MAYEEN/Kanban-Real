import { User } from '../models/User.js';
import { Board } from '../models/Board.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @route POST /api/auth/forgot-password
// ইমেইল সার্ভিস ফেইল ছাড়াই সরাসরি ডাটাবেজ ভেরিফাইড পাসওয়ার্ড রিসেট
export const forgotPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Email and new password are required' });
    }

    const cleanEmail = email.trim();

    // কেস-ইনসেন্সিটিভ সার্চ
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') },
    });

    if (!user) {
      return res.status(404).json({ message: 'No registered user found with this email!' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // পাসওয়ার্ড সুরক্ষিতভাবে হ্যাশ করে সরাসরি আপডেট
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(user._id, {
      $set: { password: hashedPassword },
    });

    return res.status(200).json({ 
      success: true,
      message: 'Password reset successful! You can now log in.' 
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({ message: 'Internal server error: ' + error.message });
  }
};

// @route PUT /api/auth/change-password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id || req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password does not match' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @route POST /api/auth/register
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        phone: user.phone,
        organization: user.organization,
        designation: user.designation,
        identificationId: user.identificationId,
        bio: user.bio,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = user.matchPassword
      ? await user.matchPassword(password)
      : await bcrypt.compare(password, user.password);

    if (isMatch) {
      res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          phone: user.phone,
          organization: user.organization,
          designation: user.designation,
          identificationId: user.identificationId,
          bio: user.bio,
        },
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/auth/profile
export const updateProfile = async (req, res) => {
  try {
    const {
      name,
      phone,
      organization,
      designation,
      identificationId,
      bio,
      avatar,
    } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id || req.user.id,
      {
        $set: {
          ...(name && { name }),
          phone: phone || '',
          organization: organization || '',
          designation: designation || '',
          identificationId: identificationId || '',
          bio: bio || '',
          ...(avatar && { avatar }),
        },
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        phone: updatedUser.phone,
        organization: updatedUser.organization,
        designation: updatedUser.designation,
        identificationId: updatedUser.identificationId,
        bio: updatedUser.bio,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/auth/teammates
export const getTeammates = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const userBoards = await Board.find({
      $or: [{ owner: userId }, { members: {$in: [userId] } }],
    });

    const memberIds = new Set();
    userBoards.forEach((board) => {
      if (board.owner && board.owner.toString() !== userId.toString()) {
        memberIds.add(board.owner.toString());
      }
      if (board.members && Array.isArray(board.members)) {
        board.members.forEach((mId) => {
          if (mId.toString() !== userId.toString()) {
            memberIds.add(mId.toString());
          }
        });
      }
    });

    const teammates = await User.find({ _id: { $in: Array.from(memberIds) } }).select(
      'name email avatar organization designation'
    );

    res.json(teammates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};