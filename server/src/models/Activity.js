import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String, // e.g. 'CREATED_TASK', 'MOVED_TASK', 'ADDED_COMMENT'
      required: true,
    },
    details: {
      type: String, // মানুষের পড়ার উপযোগী বিবরণ, e.g. "moved 'API Auth' to Done"
      required: true,
    },
  },
  { timestamps: true }
);

export const Activity = mongoose.model('Activity', activitySchema);