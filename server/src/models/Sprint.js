import mongoose from 'mongoose';

const sprintSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Sprint name is required'],
      trim: true,
    },
    goal: {
      type: String,
      default: '',
    },
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['future', 'active', 'completed'],
      default: 'future',
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    totalPoints: {
      type: Number,
      default: 0,
    },
    completedPoints: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const Sprint = mongoose.model('Sprint', sprintSchema);