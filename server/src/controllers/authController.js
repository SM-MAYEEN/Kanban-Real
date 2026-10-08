import { User } from '../models/User.js';
import { Board } from '../models/Board.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @route POST /api/auth/register
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ name, email, password });

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

    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
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
  res.json({ user: req.user });
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

    // সরাসরি ডাটাবেজে আপডেট ও নতুন ডকুমেন্ট রিটার্ন করা
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
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
    console.error('Update Profile Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/auth/teammates
// ইউজারের বোর্ডের সাথে সংযুক্ত মেম্বারদের তালিকা নেওয়া
export const getTeammates = async (req, res) => {
  try {
    const userBoards = await Board.find({
      $or: [{ owner: req.user._id }, { members: { $in: [req.user._id] } }],
    });

    // সব বোর্ড থেকে মেম্বারদের ইউনিক আইডি বের করা
    const memberIds = new Set();
    userBoards.forEach((board) => {
      if (board.owner.toString() !== req.user._id.toString()) {
        memberIds.add(board.owner.toString());
      }
      board.members.forEach((mId) => {
        if (mId.toString() !== req.user._id.toString()) {
          memberIds.add(mId.toString());
        }
      });
    });

    const teammates = await User.find({ _id: { $in: Array.from(memberIds) } }).select(
      'name email avatar organization designation'
    );

    res.json(teammates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};