import mongoose from 'mongoose';

const InterviewSchema = new mongoose.Schema(
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
    applicationId: {
      type: String,
      default: null,
      index: true
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true
    },
    jobTitle: {
      type: String,
      default: '',
      trim: true
    },
    interviewType: {
      type: String,
      default: 'Video'
    },
    roundName: {
      type: String,
      default: 'Technical Round'
    },
    date: {
      type: String,
      required: [true, 'Interview date is required']
    },
    startTime: {
      type: String,
      default: '14:00'
    },
    endTime: {
      type: String,
      default: '15:00'
    },
    durationMinutes: {
      type: Number,
      default: 60
    },
    interviewer: {
      type: String,
      default: ''
    },
    interviewerTitle: {
      type: String,
      default: ''
    },
    interviewerEmail: {
      type: String,
      default: ''
    },
    meetingUrl: {
      type: String,
      default: ''
    },
    location: {
      type: String,
      default: 'Remote Video Link'
    },
    notes: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'],
      default: 'Scheduled'
    },
    completed: {
      type: Boolean,
      default: false
    },
    outcomeNotes: {
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

InterviewSchema.index({ userId: 1, date: 1 });

export const Interview = mongoose.models.Interview || mongoose.model('Interview', InterviewSchema);
export default Interview;
