import mongoose from 'mongoose';

const ActivitySchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString()
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    type: {
      type: String,
      default: 'action'
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    company: {
      type: String,
      default: ''
    },
    relatedId: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

ActivitySchema.index({ userId: 1, createdAt: -1 });

export const Activity = mongoose.models.Activity || mongoose.model('Activity', ActivitySchema);
export default Activity;
