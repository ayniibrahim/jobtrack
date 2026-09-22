import mongoose from 'mongoose';

const ContactSchema = new mongoose.Schema(
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
      required: [true, 'Contact name is required'],
      trim: true
    },
    company: {
      type: String,
      default: '',
      trim: true
    },
    jobTitle: {
      type: String,
      default: 'Recruiter',
      trim: true
    },
    email: {
      type: String,
      default: '',
      trim: true
    },
    phone: {
      type: String,
      default: '',
      trim: true
    },
    linkedin: {
      type: String,
      default: '',
      trim: true
    },
    notes: {
      type: String,
      default: ''
    },
    isPrimaryPOC: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

ContactSchema.index({ userId: 1, name: 1 });

export const Contact = mongoose.models.Contact || mongoose.model('Contact', ContactSchema);
export default Contact;
