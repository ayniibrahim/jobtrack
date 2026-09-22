import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema(
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
    name: {
      type: String,
      required: [true, 'Document name is required'],
      trim: true
    },
    type: {
      type: String,
      enum: ['Resume', 'Cover Letter', 'Certificate', 'Portfolio', 'Other'],
      default: 'Resume'
    },
    size: {
      type: Number,
      default: 0
    },
    url: {
      type: String,
      default: ''
    },
    applicationId: {
      type: String,
      default: null,
      index: true
    },
    notes: {
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

DocumentSchema.index({ userId: 1, type: 1 });

export const Document = mongoose.models.Document || mongoose.model('Document', DocumentSchema);
export default Document;
