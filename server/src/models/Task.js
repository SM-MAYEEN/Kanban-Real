import mongoose from 'mongoose';

const subtaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    isCompleted: { type: Boolean, default: false },
  },
  { _id: true }
);

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    fileName: { type: String, required: true },
    fileType: { type: String, default: '' },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      unique: true,
      sparse: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    issueType: {
      type: String,
      enum: ['Story', 'Task', 'Bug', 'Epic'],
      default: 'Task',
    },
    storyPoints: {
      type: Number,
      default: 1,
    },
    estimatedHours: {
      type: Number,
      default: 0,
    },
    loggedHours: {
      type: Number,
      default: 0,
    },
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
      index: true,
    },
    columnId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Column',
      required: true,
      index: true,
    },
    // Sprint Linking: null হলে টাস্কটি Backlog-এ থাকবে
    sprintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sprint',
      default: null,
    },
    // Task Dependencies (Feature 4)
    blockedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],
    blocks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    tags: {
      type: [String],
      default: [],
    },
    subtasks: [subtaskSchema],
    attachments: [attachmentSchema],
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const Task = mongoose.model('Task', taskSchema);