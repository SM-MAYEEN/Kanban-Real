import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    passwordResetToken: {
      type: String,
      default: undefined,
    },
    passwordResetExpires: {
      type: Date,
      default: undefined,
    },
    avatar: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    organization: {
      type: String,
      default: '',
    },
    designation: {
      type: String,
      default: '',
    },
    identificationId: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// পাসওয়ার্ড সেভ বা পরিবর্তন করার আগে হ্যাশ করা
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next ? next() : undefined;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  if (next) next();
});

// পাসওয়ার্ড মেলানোর মেথড
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
export const User = mongoose.model('User', userSchema);
export default User;