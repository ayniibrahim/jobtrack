import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString()
    },
    fullName: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    password: {
      type: String,
      required: [true, 'Please provide a password']
    },
    avatar: {
      type: String,
      default: ''
    },
    professionalTitle: {
      type: String,
      default: 'Software Engineer',
      trim: true
    },
    location: {
      type: String,
      default: 'San Francisco, CA',
      trim: true
    },
    desiredRole: {
      type: String,
      default: 'Senior / Staff Software Engineer',
      trim: true
    },
    desiredSalary: {
      type: String,
      default: '$160,000 - $220,000',
      trim: true
    },
    preferredLocation: {
      type: String,
      default: 'San Francisco, CA (Hybrid / Remote)',
      trim: true
    },
    remotePreference: {
      type: String,
      default: 'Remote & Hybrid',
      trim: true
    },
    employmentType: {
      type: String,
      default: 'Full-time'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export default User;
