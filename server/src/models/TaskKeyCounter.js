import mongoose from 'mongoose';

const taskKeyCounterSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    sequence: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { versionKey: false }
);

export const TaskKeyCounter = mongoose.model('TaskKeyCounter', taskKeyCounterSchema);
