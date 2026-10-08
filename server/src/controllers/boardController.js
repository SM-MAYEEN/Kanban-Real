import crypto from 'crypto';
import { Board } from '../models/Board.js';
import { Column } from '../models/Column.js';
import { Task } from '../models/Task.js';
import { User } from '../models/User.js';
import { sendInviteEmail } from '../../sendEmail.js';

// নতুন বোর্ড তৈরি
export const createBoard = async (req, res) => {
  try {
    const { title, description } = req.body;

    const board = await Board.create({
      title,
      description: description || '',
      owner: req.user._id,
      members: [req.user._id],
    });

    const defaultColumns = [
      { title: 'To Do', boardId: board._id, order: 0 },
      { title: 'In Progress', boardId: board._id, order: 1 },
      { title: 'Done', boardId: board._id, order: 2 },
    ];
    await Column.insertMany(defaultColumns);

    res.status(201).json(board);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// অ্যাক্টিভ বোর্ড ফেচ
export const getUserBoards = async (req, res) => {
  try {
    const boards = await Board.find({
      isArchived: { $ne: true },
      $or: [
        { owner: req.user._id },
        { members: { $in: [req.user._id] } }
      ]
    }).populate('owner', 'name email avatar');

    res.json(boards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ট্র্যাশ/আর্কাইভ বোর্ড ফেচ
export const getArchivedBoards = async (req, res) => {
  try {
    const boards = await Board.find({
      isArchived: true,
      $or: [
        { owner: req.user._id },
        { members: { $in: [req.user._id] } }
      ]
    })
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar')
      .populate('deletionApprovals', 'name email avatar');

    res.json(boards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// বোর্ড ডিটেইলস ফেচ
export const getBoardDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const board = await Board.findById(id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    if (!board || board.isArchived) {
      return res.status(404).json({ message: 'Board not found or archived' });
    }

    const isMember = board.members.some(
      (m) => m._id.toString() === req.user._id.toString()
    );
    if (!isMember) {
      board.members.push(req.user._id);
      await board.save();
    }

    const columns = await Column.find({ boardId: id }).sort({ order: 1 });
    const tasks = await Task.find({ boardId: id })
      .populate('assignedTo', 'name email avatar')
      .sort({ order: 1 });

    res.json({ board, columns, tasks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// যে কারও ইমেইলে ইনভাইট পাঠানো ও অটো ইমেইল সেন্ড করা
export const addMemberByEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Please provide a valid email.' });
    }

    const targetEmail = email.trim().toLowerCase();
    const board = await Board.findById(id);
    if (!board) return res.status(404).json({ message: 'Board not found.' });

    const clientUrl = process.env.CLIENT_URL || req.headers.origin || 'http://localhost:5173';
    const inviterName = req.user?.name || 'A teammate';

    // ১. এক্সিস্টিং ইউজার হলে
    const existingUser = await User.findOne({ email: targetEmail });
    if (existingUser) {
      const alreadyMember = board.members.some(
        (mId) => mId.toString() === existingUser._id.toString()
      );
      if (alreadyMember) {
        return res.status(400).json({ message: 'User is already a member of this board.' });
      }

      board.members.push(existingUser._id);
      await board.save();

      // অটো ইমেইল নোটিফিকেশন পাঠানো
      const directBoardLink = `${clientUrl}/board/${id}`;
      try {
        await sendInviteEmail({
          toEmail: targetEmail,
          boardTitle: board.title,
          inviteLink: directBoardLink,
          inviterName,
        });
      } catch (mailErr) {
        console.warn('Direct invite email sending failed:', mailErr.message);
      }

      return res.json({
        message: `Directly added ${existingUser.name}! An invitation email has also been sent to ${targetEmail}.`,
        inviteLink: null,
      });
    }

    // ২. নতুন ইউজার হলে (যাদের অ্যাকাউন্ট এখনও নেই)
    const inviteToken = crypto.randomBytes(20).toString('hex');
    
    board.pendingInvites = board.pendingInvites.filter((inv) => inv.email !== targetEmail);
    board.pendingInvites.push({
      email: targetEmail,
      token: inviteToken,
    });
    await board.save();

    const inviteLink = `${clientUrl}/register?inviteToken=${inviteToken}&boardId=${id}&email=${encodeURIComponent(targetEmail)}`;

    // স্বয়ংক্রিয়ভাবে তার ইনবক্সে ইমেইল পাঠানো
    try {
      await sendInviteEmail({
        toEmail: targetEmail,
        boardTitle: board.title,
        inviteLink,
        inviterName,
      });
    } catch (mailErr) {
      console.warn('Auto invite email failed:', mailErr.message);
    }

    res.json({
      message: `Invitation email successfully sent to ${targetEmail}!`,
      inviteLink,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// ইনভাইট টোকেন অ্যাকসেপ্ট করে বোর্ডে যোগ হওয়া
export const acceptInviteToken = async (req, res) => {
  try {
    const { boardId, inviteToken } = req.body;
    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    const validInvite = board.pendingInvites.find((inv) => inv.token === inviteToken);
    if (!validInvite) {
      return res.status(400).json({ message: 'Invalid or expired invitation token.' });
    }

    // মেম্বার হিসেবে যুক্ত করা
    if (!board.members.includes(req.user._id)) {
      board.members.push(req.user._id);
    }
    // পেন্ডিং থেকে সরানো
    board.pendingInvites = board.pendingInvites.filter((inv) => inv.token !== inviteToken);
    await board.save();

    res.json({ message: 'Successfully joined board!', boardId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// সফট ডিলিট / আর্কাইভ
export const archiveBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const board = await Board.findById(id);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    board.isArchived = true;
    board.deletedAt = new Date();
    await board.save();

    res.json({ message: 'Board moved to archive/history', board });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// রিস্টোর
export const restoreBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const board = await Board.findById(id);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    board.isArchived = false;
    board.deletedAt = null;
    board.deletionApprovals = [];
    await board.save();

    res.json({ message: 'Board restored successfully', board });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// স্থায়ী ডিলিট অ্যাপ্রুভাল
export const approvePermanentDelete = async (req, res) => {
  try {
    const { id } = req.params;
    const board = await Board.findById(id);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    const userId = req.user._id.toString();
    const alreadyApproved = board.deletionApprovals.some((aId) => aId.toString() === userId);

    if (!alreadyApproved) {
      board.deletionApprovals.push(req.user._id);
      await board.save();
    }

    const otherMemberApprovals = board.deletionApprovals.filter(
      (aId) => aId.toString() !== board.owner.toString()
    );

    if (board.members.length <= 1 || otherMemberApprovals.length >= 1) {
      await Column.deleteMany({ boardId: id });
      await Task.deleteMany({ boardId: id });
      await Board.findByIdAndDelete(id);

      return res.json({
        message: 'Board permanently deleted upon team permission approval.',
        permanentlyDeleted: true,
      });
    }

    res.json({
      message: 'Approval recorded. Waiting for 1 teammate approval to delete permanently.',
      permanentlyDeleted: false,
      board,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};