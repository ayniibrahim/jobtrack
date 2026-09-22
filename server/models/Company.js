import mongoose from 'mongoose';

const CompanySchema = new mongoose.Schema(
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
      required: [true, 'Company name is required'],
      trim: true
    },
    logo: {
      type: String,
      default: ''
    },
    website: {
      type: String,
      default: '',
      trim: true
    },
    industry: {
      type: String,
      default: 'Technology',
      trim: true
    },
    location: {
      type: String,
      default: '',
      trim: true
    },
    description: {
      type: String,
      default: ''
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

CompanySchema.index({ userId: 1, name: 1 });

export const Company = mongoose.models.Company || mongoose.model('Company', CompanySchema);
export default Company;
