import mongoose from 'mongoose';

const boardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Board title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // আমন্ত্রণ গ্রহণ বা টিম লিডারের অনুমোদনের অপেক্ষায় থাকা সদস্যরা
    pendingInvites: [
      {
        email: { type: String, required: true },
        token: { type: String, required: true },
        invitedAt: { type: Date, default: Date.now },
        acceptedAt: { type: Date, default: null },
        approvedAt: { type: Date, default: null },
      },
    ],
    isArchived: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletionApprovals: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

export const Board = mongoose.model('Board', boardSchema);