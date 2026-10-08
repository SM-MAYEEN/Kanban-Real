import mongoose from 'mongoose';

const channelMessageSchema = new mongoose.Schema(
  {
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      default: null,
    },
    channel: {
      type: String,
      default: 'general',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    reactions: [
      {
        emoji: {
          type: String,
          required: true,
        },
        users: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

export const ChannelMessage = mongoose.model('ChannelMessage', channelMessageSchema);