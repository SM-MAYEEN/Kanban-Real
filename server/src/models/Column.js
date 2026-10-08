import mongoose from 'mongoose';

const columnSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Column title is required'],
      trim: true,
    },
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    wipLimit: {
      type: Number,
      default: 0, // 0 মানে কোনো লিমিট নেই (Unlimited)
    },
  },
  { timestamps: true }
);

export const Column = mongoose.model('Column', columnSchema);