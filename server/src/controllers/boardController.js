import crypto from 'crypto';
import { Board } from '../models/Board.js';
import { Column } from '../models/Column.js';
import { Task } from '../models/Task.js';
import { User } from '../models/User.js';
import { sendInviteEmail } from '../../sendEmail.js';
import { isBoardOwner } from '../utils/boardAccess.js';

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
    })
      .select('-pendingInvites')
      .populate('owner', 'name email avatar');

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
      .select('-pendingInvites')
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

    const isMember = isBoardOwner(board, req.user._id)
      || board.members.some((member) => member._id.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'You must be invited to access this board.' });
    }

    const columns = await Column.find({ boardId: id }).sort({ order: 1 });
    const tasks = await Task.find({ boardId: id })
      .populate('assignedTo', 'name email avatar')
      .sort({ order: 1 });

    const boardData = board.toObject();
    boardData.pendingInvites = isBoardOwner(board, req.user._id)
      ? boardData.pendingInvites.map(({ token, ...invite }) => invite)
      : [];
    res.json({ board: boardData, columns, tasks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ইমেইলে ইনভাইট পাঠানো; গ্রহণ না করা পর্যন্ত সদস্য হিসেবে যোগ হয় না
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
    if (!isBoardOwner(board, req.user._id)) {
      return res.status(403).json({ message: 'Only the team leader can invite members.' });
    }

    const clientUrl = process.env.CLIENT_URL || req.headers.origin || 'http://localhost:5173';
    const inviterName = req.user?.name || 'A teammate';

    const existingUser = await User.findOne({ email: targetEmail }).select('_id name');
    if (existingUser && board.members.some(
      (memberId) => memberId.toString() === existingUser._id.toString()
    )) {
      return res.status(400).json({ message: 'User is already a member of this board.' });
    }

    const inviteToken = crypto.randomBytes(32).toString('hex');
    board.pendingInvites = board.pendingInvites.filter((invite) => invite.email !== targetEmail);
    board.pendingInvites.push({
      email: targetEmail,
      token: inviteToken,
    });
    await board.save();

    const inviteLink = `${clientUrl}/invite?inviteToken=${inviteToken}&boardId=${id}&email=${encodeURIComponent(targetEmail)}`;
    void sendInviteEmail({
      toEmail: targetEmail,
      boardTitle: board.title,
      inviteLink,
      inviterName,
    })
      .then(() => {
        console.log(`Invitation email delivered to ${targetEmail}.`);
      })
      .catch((mailErr) => {
        console.error(`Invitation email delivery failed for ${targetEmail}:`, mailErr.message);
      });

    res.json({
      message: `Invitation created successfully for ${targetEmail}. Share the invitation link below; they must accept it before joining the board.`,
      inviteLink,
      emailSent: null,
      pendingInvite: {
        email: targetEmail,
        invitedAt: board.pendingInvites.find((invite) => invite.email === targetEmail)?.invitedAt,
      },
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
    if (validInvite.email.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({ message: 'This invitation was sent to a different email address.' });
    }

    // মেম্বার হিসেবে যুক্ত করা
    if (!board.members.some((memberId) => memberId.toString() === req.user._id.toString())) {
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

export const removeBoardMember = async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const board = await Board.findById(id);
    if (!board) return res.status(404).json({ message: 'Board not found.' });
    if (!isBoardOwner(board, req.user._id)) {
      return res.status(403).json({ message: 'Only the team leader can manage members.' });
    }
    if (isBoardOwner(board, memberId)) {
      return res.status(400).json({ message: 'The team leader cannot be removed from the board.' });
    }

    const memberExists = board.members.some(
      (currentMemberId) => currentMemberId.toString() === memberId
    );
    if (!memberExists) {
      return res.status(404).json({ message: 'Board member not found.' });
    }

    board.members = board.members.filter(
      (currentMemberId) => currentMemberId.toString() !== memberId
    );
    await board.save();
    const io = req.app.get('io');
    if (io) {
      for (const socket of io.of('/').sockets.values()) {
        if (socket.user?._id?.toString() === memberId) {
          socket.emit('board:access-revoked', { boardId: id });
          socket.leave(id);
        }
      }
    }
    res.json({ message: 'Member removed from the board.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const cancelBoardInvite = async (req, res) => {
  try {
    const { id } = req.params;
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ message: 'Please provide an email address.' });
    const board = await Board.findById(id);
    if (!board) return res.status(404).json({ message: 'Board not found.' });
    if (!isBoardOwner(board, req.user._id)) {
      return res.status(403).json({ message: 'Only the team leader can manage invitations.' });
    }

    const originalCount = board.pendingInvites.length;
    board.pendingInvites = board.pendingInvites.filter(
      (invite) => invite.email.toLowerCase() !== email
    );
    if (board.pendingInvites.length === originalCount) {
      return res.status(404).json({ message: 'Pending invitation not found.' });
    }

    await board.save();
    res.json({ message: 'Invitation cancelled.' });
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
    if (!isBoardOwner(board, req.user._id)) {
      return res.status(403).json({ message: 'Only the team leader can archive this board.' });
    }

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
    if (!isBoardOwner(board, req.user._id)) {
      return res.status(403).json({ message: 'Only the team leader can restore this board.' });
    }

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
    if (!isBoardOwner(board, req.user._id)) {
      return res.status(403).json({ message: 'Only the team leader can permanently delete this board.' });
    }

    await Column.deleteMany({ boardId: id });
    await Task.deleteMany({ boardId: id });
    await Board.findByIdAndDelete(id);
    res.json({ message: 'Board permanently deleted.', permanentlyDeleted: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};