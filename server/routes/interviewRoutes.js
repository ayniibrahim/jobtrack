import express from 'express';
import { Interview, Application, Activity, Notification } from '../models/index.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

// GET /api/interviews
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const { upcoming, applicationId } = req.query;

    const query = { userId };
    if (applicationId) {
      query.applicationId = applicationId;
    }

    if (upcoming === 'true') {
      const today = new Date().toISOString().split('T')[0];
      query.date = { $gte: today };
      query.status = { $ne: 'Cancelled' };
    }

    const interviews = await Interview.find(query).sort({ date: 1, startTime: 1 }).lean();
    res.json({ success: true, data: interviews });
  } catch (err) {
    console.error('[Interview GET All Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve interviews.' });
  }
});

// GET /api/interviews/calendar
router.get('/calendar', async (req, res) => {
  try {
    const userId = req.user._id;
    const interviews = await Interview.find({ userId }).lean();
    const apps = await Application.find({ userId }).lean();

    const interviewEvents = interviews.map((i) => ({
      id: i._id,
      title: `${i.company}: ${i.roundName || i.interviewType} Interview`,
      date: i.date,
      startTime: i.startTime || '10:00',
      endTime: i.endTime || '11:00',
      type: 'interview',
      details: i.notes || '',
      company: i.company,
      interviewer: i.interviewer,
      meetingUrl: i.meetingUrl,
      applicationId: i.applicationId,
      status: i.status
    }));

    // Add deadlines from applications
    const deadlineEvents = apps
      .filter((a) => a.deadline || a.nextActionDate)
      .map((a) => ({
        id: `deadline_${a._id}`,
        title: `${a.companyName}: ${a.nextAction || 'Action Deadline'}`,
        date: (a.deadline ? a.deadline.split('T')[0] : a.nextActionDate) || a.dateApplied,
        startTime: '17:00',
        endTime: '18:00',
        type: a.status === 'Offer' ? 'offer_deadline' : 'follow_up',
        details: a.nextAction || 'Follow-up or decision due',
        company: a.companyName,
        applicationId: a._id
      }));

    const combined = [...interviewEvents, ...deadlineEvents].sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    res.json({ success: true, data: combined });
  } catch (err) {
    console.error('[Interview GET Calendar Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve calendar events.' });
  }
});

// GET /api/interviews/:id
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user._id;
    const interview = await Interview.findById(req.params.id).lean();

    if (!interview || String(interview.userId) !== String(userId)) {
      return res.status(404).json({ success: false, message: 'Interview not found.' });
    }

    res.json({ success: true, data: interview });
  } catch (err) {
    console.error('[Interview GET Detail Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve interview.' });
  }
});

// POST /api/interviews
router.post('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      applicationId,
      company,
      jobTitle,
      interviewType = 'Video',
      roundName = 'Technical Round',
      date,
      startTime = '14:00',
      endTime = '15:00',
      durationMinutes = 60,
      interviewer = '',
      interviewerTitle = '',
      interviewerEmail = '',
      meetingUrl = '',
      location = 'Remote Video Link',
      notes = '',
      status = 'Scheduled'
    } = req.body;

    if (!company || !date) {
      return res.status(400).json({
        success: false,
        message: 'Company name and interview date are required.'
      });
    }

    const newInterview = await Interview.create({
      userId,
      applicationId: applicationId || null,
      company: company.trim(),
      jobTitle: jobTitle ? jobTitle.trim() : '',
      interviewType,
      roundName,
      date,
      startTime,
      endTime,
      durationMinutes: Number(durationMinutes) || 60,
      interviewer: interviewer.trim(),
      interviewerTitle: interviewerTitle.trim(),
      interviewerEmail: interviewerEmail.trim(),
      meetingUrl: meetingUrl.trim(),
      location: location.trim(),
      notes,
      status
    });

    // If an application ID is provided, ensure application status is moved to 'Interview' if appropriate
    if (applicationId) {
      const app = await Application.findById(applicationId);
      if (app && ['Wishlist', 'Applied', 'Screening'].includes(app.status)) {
        app.status = 'Interview';
        await app.save();
      }
    }

    // Log Activity
    await Activity.create({
      userId,
      type: 'interview_scheduled',
      title: `${company}: ${roundName} scheduled`,
      description: `${date} at ${startTime} · ${interviewType} format`,
      company,
      relatedId: newInterview._id
    });

    // Create Notification
    await Notification.create({
      userId,
      type: 'interview',
      title: `Interview Scheduled: ${company}`,
      message: `Your ${roundName} is scheduled for ${date} at ${startTime}.`,
      link: '/calendar'
    });

    res.status(201).json({
      success: true,
      message: 'Interview scheduled successfully.',
      data: newInterview
    });
  } catch (err) {
    console.error('[Interview POST Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to schedule interview.' });
  }
});

// PATCH /api/interviews/:id
router.patch('/:id', async (req, res) => {
  try {
    const userId = req.user._id;
    const interview = await Interview.findById(req.params.id);

    if (!interview || String(interview.userId) !== String(userId)) {
      return res.status(404).json({ success: false, message: 'Interview not found.' });
    }

    const {
      company,
      jobTitle,
      interviewType,
      roundName,
      date,
      startTime,
      endTime,
      durationMinutes,
      interviewer,
      interviewerTitle,
      interviewerEmail,
      meetingUrl,
      location,
      notes,
      status,
      completed,
      outcomeNotes
    } = req.body;

    if (company !== undefined) interview.company = company.trim();
    if (jobTitle !== undefined) interview.jobTitle = jobTitle.trim();
    if (interviewType !== undefined) interview.interviewType = interviewType;
    if (roundName !== undefined) interview.roundName = roundName;
    if (date !== undefined) interview.date = date;
    if (startTime !== undefined) interview.startTime = startTime;
    if (endTime !== undefined) interview.endTime = endTime;
    if (durationMinutes !== undefined) interview.durationMinutes = Number(durationMinutes);
    if (interviewer !== undefined) interview.interviewer = interviewer.trim();
    if (interviewerTitle !== undefined) interview.interviewerTitle = interviewerTitle.trim();
    if (interviewerEmail !== undefined) interview.interviewerEmail = interviewerEmail.trim();
    if (meetingUrl !== undefined) interview.meetingUrl = meetingUrl.trim();
    if (location !== undefined) interview.location = location.trim();
    if (notes !== undefined) interview.notes = notes;
    if (status !== undefined) interview.status = status;
    if (completed !== undefined) interview.completed = Boolean(completed);
    if (outcomeNotes !== undefined) interview.outcomeNotes = outcomeNotes;

    await interview.save();

    res.json({
      success: true,
      message: 'Interview updated successfully.',
      data: interview
    });
  } catch (err) {
    console.error('[Interview PATCH Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to update interview.' });
  }
});

// DELETE /api/interviews/:id
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user._id;
    const interview = await Interview.findById(req.params.id);

    if (!interview || String(interview.userId) !== String(userId)) {
      return res.status(404).json({ success: false, message: 'Interview not found.' });
    }

    await Interview.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Interview deleted successfully.'
    });
  } catch (err) {
    console.error('[Interview DELETE Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to delete interview.' });
  }
});

export default router;
