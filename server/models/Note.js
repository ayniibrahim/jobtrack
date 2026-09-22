import mongoose from 'mongoose';

const NoteSchema = new mongoose.Schema(
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
    targetType: {
      type: String,
      enum: ['application', 'company', 'contact', 'interview', 'general'],
      default: 'application',
      index: true
    },
    targetId: {
      type: String,
      default: '',
      index: true
    },
    title: {
      type: String,
      default: '',
      trim: true
    },
    content: {
      type: String,
      required: [true, 'Note content is required']
    },
    tags: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

NoteSchema.index({ userId: 1, targetType: 1, targetId: 1 });

export const Note = mongoose.models.Note || mongoose.model('Note', NoteSchema);
export default Note;
