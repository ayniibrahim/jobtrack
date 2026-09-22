import mongoose from 'mongoose';

const ApplicationSchema = new mongoose.Schema(
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
    jobTitle: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      index: true
    },
    companyId: {
      type: String,
      default: '',
      index: true
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      index: true
    },
    companyLogo: {
      type: String,
      default: ''
    },
    location: {
      type: String,
      default: 'Remote',
      trim: true
    },
    workMode: {
      type: String,
      enum: ['Remote', 'Hybrid', 'On-site'],
      default: 'Remote'
    },
    employmentType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'],
      default: 'Full-time'
    },
    jobUrl: {
      type: String,
      default: '',
      trim: true
    },
    source: {
      type: String,
      default: 'Company Website'
    },
    jobDescription: {
      type: String,
      default: ''
    },
    pipelineStage: {
      type: String,
      enum: ['Wishlist', 'Applied', 'Screening', 'Interview', 'Offer', 'Rejected', 'Withdrawn', 'Archived'],
      default: 'Wishlist',
      index: true
    },
    status: {
      type: String,
      default: 'Wishlist',
      index: true
    },
    priority: {
      type: String,
      default: 'Medium Priority (Standard)'
    },
    minSalary: {
      type: Number,
      default: 0
    },
    maxSalary: {
      type: Number,
      default: 0
    },
    salaryRange: {
      type: String,
      default: ''
    },
    salaryMin: {
      type: Number,
      default: 0
    },
    salaryMax: {
      type: Number,
      default: 0
    },
    salaryCurrency: {
      type: String,
      enum: ['USD', 'EUR', 'GBP', 'Other'],
      default: 'USD'
    },
    salaryType: {
      type: String,
      enum: ['Annual', 'Monthly', 'Hourly'],
      default: 'Annual'
    },
    dateSaved: {
      type: String,
      default: () => new Date().toISOString().split('T')[0]
    },
    dateApplied: {
      type: String,
      default: ''
    },
    applicationDeadline: {
      type: String,
      default: ''
    },
    deadline: {
      type: String,
      default: ''
    },
    lastFollowUpDate: {
      type: String,
      default: ''
    },
    nextAction: {
      type: String,
      default: 'Submit application'
    },
    nextActionDate: {
      type: String,
      default: ''
    },
    recruiterName: {
      type: String,
      default: ''
    },
    recruiterEmail: {
      type: String,
      default: ''
    },
    recruiterPhone: {
      type: String,
      default: ''
    },
    recruiterLinkedIn: {
      type: String,
      default: ''
    },
    contactNotes: {
      type: String,
      default: ''
    },
    resumeVersion: {
      type: String,
      default: ''
    },
    interviewDate: {
      type: String,
      default: ''
    },
    interviewType: {
      type: String,
      default: 'Technical'
    },
    meetingLink: {
      type: String,
      default: ''
    },
    interviewNotes: {
      type: String,
      default: ''
    },
    interviewQuestions: {
      type: String,
      default: ''
    },
    techTags: {
      type: [String],
      default: []
    },
    tags: {
      type: [String],
      default: []
    },
    whyThisRole: {
      type: String,
      default: ''
    },
    keySkills: {
      type: String,
      default: ''
    },
    notes: {
      type: String,
      default: ''
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true
    },
    isTopChoice: {
      type: Boolean,
      default: false
    },
    offerDetails: {
      baseSalary: { type: Number, default: 0 },
      equity: { type: String, default: '' },
      signOnBonus: { type: Number, default: 0 },
      annualBonus: { type: Number, default: 0 },
      yearOneTotal: { type: Number, default: 0 },
      expirationDate: { type: String, default: '' },
      decisionStatus: { type: String, default: 'Pending' }
    },
    milestones: [
      {
        title: { type: String },
        status: { type: String, enum: ['completed', 'current', 'upcoming'], default: 'upcoming' },
        date: { type: String }
      }
    ]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Pre-save hook to synchronize aliases & backwards compatible fields
ApplicationSchema.pre('save', function (next) {
  // Sync status and pipelineStage
  if (this.pipelineStage && !this.status) {
    this.status = this.pipelineStage;
  } else if (this.status && !this.pipelineStage) {
    this.pipelineStage = this.status;
  } else if (this.isModified('pipelineStage')) {
    this.status = this.pipelineStage;
  } else if (this.isModified('status')) {
    this.pipelineStage = this.status;
  }

  // Handle archive flag sync
  if (this.status === 'Archived' || this.status === 'Rejected') {
    this.isArchived = true;
  }

  // Sync salaries
  if (this.minSalary !== undefined && this.salaryMin === 0) {
    this.salaryMin = this.minSalary;
  } else if (this.salaryMin !== undefined && this.minSalary === 0) {
    this.minSalary = this.salaryMin;
  }

  if (this.maxSalary !== undefined && this.salaryMax === 0) {
    this.salaryMax = this.maxSalary;
  } else if (this.salaryMax !== undefined && this.maxSalary === 0) {
    this.maxSalary = this.salaryMax;
  }

  // Sync deadlines
  if (this.applicationDeadline && !this.deadline) {
    this.deadline = this.applicationDeadline;
  } else if (this.deadline && !this.applicationDeadline) {
    this.applicationDeadline = this.deadline;
  }

  // Sync techTags and tags
  if (this.techTags && this.techTags.length > 0 && (!this.tags || this.tags.length === 0)) {
    this.tags = this.techTags;
  } else if (this.tags && this.tags.length > 0 && (!this.techTags || this.techTags.length === 0)) {
    this.techTags = this.tags;
  }

  if (typeof next === 'function') {
    next();
  }
});

ApplicationSchema.index({ userId: 1, status: 1 });
ApplicationSchema.index({ userId: 1, pipelineStage: 1 });
ApplicationSchema.index({ userId: 1, updatedAt: -1 });

export const Application = mongoose.models.Application || mongoose.model('Application', ApplicationSchema);
export default Application;
