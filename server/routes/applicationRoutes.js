import express from 'express';
import { Application, Company, Contact, Interview, Document, Activity, Notification } from '../models/index.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

function isValidUrl(string) {
  if (!string || typeof string !== 'string') return true;
  const trimmed = string.trim();
  if (!trimmed) return true;
  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    return Boolean(url.hostname);
  } catch (_) {
    return false;
  }
}

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return true;
  const trimmed = email.trim();
  if (!trimmed) return true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed);
}

function cleanTags(input) {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map((t) => String(t).trim().replace(/^#/, '')).filter(Boolean);
  }
  if (typeof input === 'string') {
    return input.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean);
  }
  return [];
}

// GET /api/applications/stats/summary
router.get('/stats/summary', async (req, res) => {
  try {
    const userId = req.user._id;
    const apps = await Application.find({ userId }).lean();

    const totalPipeline = apps.length;
    const activeApps = apps.filter((a) => !a.isArchived && a.status !== 'Rejected' && a.status !== 'Withdrawn' && a.status !== 'Archived');
    const screening = apps.filter((a) => (a.status === 'Screening' || a.pipelineStage === 'Screening') && !a.isArchived);
    const interviews = apps.filter((a) => (a.status === 'Interview' || a.pipelineStage === 'Interview') && !a.isArchived);
    const offers = apps.filter((a) => (a.status === 'Offer' || a.pipelineStage === 'Offer') && !a.isArchived);
    const wishlist = apps.filter((a) => (a.status === 'Wishlist' || a.pipelineStage === 'Wishlist') && !a.isArchived);
    const applied = apps.filter((a) => (a.status === 'Applied' || a.pipelineStage === 'Applied') && !a.isArchived);
    const rejected = apps.filter((a) => a.status === 'Rejected' || a.pipelineStage === 'Rejected');
    const withdrawn = apps.filter((a) => a.status === 'Withdrawn' || a.pipelineStage === 'Withdrawn');
    const archived = apps.filter((a) => a.isArchived || a.status === 'Archived' || a.status === 'Rejected');

    // Calculate Average Salary Target
    const salaries = apps
      .map((a) => a.maxSalary || a.minSalary || a.salaryMax || a.salaryMin)
      .filter((s) => typeof s === 'number' && s > 0);
    const avgSalary =
      salaries.length > 0
        ? Math.round(salaries.reduce((acc, curr) => acc + curr, 0) / salaries.length)
        : 172000;

    // Health score based on active pipeline distribution
    const healthScore =
      totalPipeline > 0
        ? Math.min(95, Math.round(70 + offers.length * 10 + interviews.length * 2.5 + activeApps.length * 1.5))
        : 80;

    res.json({
      success: true,
      data: {
        totalPipeline,
        activeCount: activeApps.length,
        inReviewCount: screening.length + applied.length,
        interviewCount: interviews.length,
        offerCount: offers.length,
        wishlistCount: wishlist.length,
        appliedCount: applied.length,
        rejectedCount: rejected.length,
        withdrawnCount: withdrawn.length,
        archivedCount: archived.length,
        avgSalary,
        healthScore,
        funnel: {
          wishlist: wishlist.length,
          applied: applied.length,
          screening: screening.length,
          interview: interviews.length,
          offer: offers.length,
          rejected: rejected.length,
          withdrawn: withdrawn.length,
          archived: archived.length
        }
      }
    });
  } catch (err) {
    console.error('[Application Stats Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to calculate application stats.' });
  }
});

// GET /api/applications
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      search,
      status,
      pipelineStage,
      priority,
      workMode,
      source,
      company,
      archived,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      page = 1,
      limit = 50
    } = req.query;

    const query = { userId };

    if (archived === 'true') {
      query.isArchived = true;
    } else if (archived === 'false') {
      query.isArchived = false;
    }

    const filterStage = status || pipelineStage;
    if (filterStage && filterStage !== 'all') {
      if (filterStage === 'active') {
        query.isArchived = false;
        query.status = { $nin: ['Rejected', 'Withdrawn', 'Archived'] };
      } else {
        query.$or = [{ status: filterStage }, { pipelineStage: filterStage }];
      }
    }

    if (priority && priority !== 'all') {
      // Allow matching "High", "High Priority", etc.
      query.priority = { $regex: priority.replace(/[()]/g, ''), $options: 'i' };
    }

    if (workMode && workMode !== 'all') {
      query.workMode = workMode;
    }

    if (source && source !== 'all') {
      query.source = { $regex: source, $options: 'i' };
    }

    if (company) {
      query.companyName = { $regex: company, $options: 'i' };
    }

    let apps = await Application.find(query).lean();

    // Apply text search
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      apps = apps.filter((app) => {
        const text = `${app.jobTitle} ${app.companyName} ${app.location || ''} ${app.notes || ''} ${app.jobDescription || ''} ${app.whyThisRole || ''} ${app.keySkills || ''} ${app.recruiterName || ''} ${app.source || ''} ${(app.techTags || app.tags || []).join(' ')}`.toLowerCase();
        return text.includes(q);
      });
    }

    // Sort in-memory to handle custom salary comparisons cleanly
    const sortDir = sortOrder === 'asc' ? 1 : -1;
    apps.sort((a, b) => {
      let valA, valB;
      if (sortBy === 'salary') {
        valA = a.maxSalary || a.salaryMax || a.minSalary || a.salaryMin || 0;
        valB = b.maxSalary || b.salaryMax || b.minSalary || b.salaryMin || 0;
      } else if (sortBy === 'dateApplied') {
        valA = a.dateApplied || a.dateSaved || '';
        valB = b.dateApplied || b.dateSaved || '';
      } else if (sortBy === 'company') {
        valA = (a.companyName || '').toLowerCase();
        valB = (b.companyName || '').toLowerCase();
      } else {
        valA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        valB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      }
      if (valA === valB) return 0;
      return valA > valB ? sortDir : -sortDir;
    });

    const total = apps.length;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const paginated = apps.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      data: paginated
    });
  } catch (err) {
    console.error('[Application GET All Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve applications.' });
  }
});

// GET /api/applications/:id
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user._id;
    const app = await Application.findById(req.params.id).lean();

    if (!app || String(app.userId) !== String(userId)) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    let company = null;
    if (app.companyId) {
      company = await Company.findById(app.companyId).lean();
    }

    const interviews = await Interview.find({ applicationId: app._id, userId }).lean();
    const documents = await Document.find({ applicationId: app._id, userId }).lean();
    const contact = app.recruiterEmail
      ? await Contact.findOne({ userId, email: app.recruiterEmail }).lean()
      : null;

    res.json({
      success: true,
      data: {
        ...app,
        company,
        interviews,
        documents,
        contact
      }
    });
  } catch (err) {
    console.error('[Application GET Detail Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve application details.' });
  }
});

// POST /api/applications
router.post('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const body = req.body;

    const jobTitle = body.jobTitle?.trim();
    const companyName = body.companyName?.trim();

    if (!jobTitle || !companyName) {
      return res.status(400).json({
        success: false,
        message: 'Job Title and Company Name are required.'
      });
    }

    // Salary numbers
    let minSalary = body.minSalary !== undefined && body.minSalary !== '' ? Number(body.minSalary) : (body.salaryMin !== undefined && body.salaryMin !== '' ? Number(body.salaryMin) : 0);
    let maxSalary = body.maxSalary !== undefined && body.maxSalary !== '' ? Number(body.maxSalary) : (body.salaryMax !== undefined && body.salaryMax !== '' ? Number(body.salaryMax) : 0);

    // If min and max not provided, try parsing from salaryRange string
    if (minSalary === 0 && maxSalary === 0 && body.salaryRange) {
      const matches = String(body.salaryRange).match(/\d[\d,.]*/g);
      if (matches && matches.length > 0) {
        const hasK = /k\b/i.test(body.salaryRange);
        const multiplier = hasK ? 1000 : 1;
        const nums = matches.map((m) => {
          const val = parseFloat(m.replace(/,/g, ''));
          return isNaN(val) ? 0 : val * multiplier;
        });
        if (nums.length === 1) {
          minSalary = nums[0];
          maxSalary = nums[0];
        } else if (nums.length >= 2) {
          minSalary = Math.min(nums[0], nums[1]);
          maxSalary = Math.max(nums[0], nums[1]);
        }
      }
    }

    // Validate salary comparison
    if (minSalary > 0 && maxSalary > 0 && minSalary > maxSalary) {
      return res.status(400).json({
        success: false,
        message: 'Minimum salary cannot exceed maximum salary.'
      });
    }

    // Validate URLs and emails
    if (body.jobUrl && !isValidUrl(body.jobUrl)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Job Posting URL.'
      });
    }

    if (body.meetingLink && !isValidUrl(body.meetingLink)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Meeting URL.'
      });
    }

    if (body.recruiterEmail && !isValidEmail(body.recruiterEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid Recruiter Email address.'
      });
    }

    // Stage & Status normalization
    const stage = body.pipelineStage || body.status || 'Wishlist';

    // Auto find or create company
    let company = await Company.findOne({
      userId,
      name: { $regex: `^${companyName}$`, $options: 'i' }
    });

    if (!company) {
      let web = '';
      if (body.jobUrl && body.jobUrl.startsWith('http')) {
        try {
          web = new URL(body.jobUrl).origin;
        } catch (_) {}
      }
      company = await Company.create({
        userId,
        name: companyName,
        logo: body.companyLogo || '',
        location: body.location || '',
        website: web,
        industry: 'Technology',
        description: `Tracking opportunities at ${companyName}`
      });
    }

    // Auto associate or create contact if recruiter info provided
    if (body.recruiterName && body.recruiterName.trim()) {
      const recName = body.recruiterName.trim();
      const recEmail = body.recruiterEmail ? body.recruiterEmail.trim() : '';

      let contact = null;
      if (recEmail) {
        contact = await Contact.findOne({ userId, email: recEmail });
      }
      if (!contact) {
        contact = await Contact.findOne({
          userId,
          name: { $regex: `^${recName}$`, $options: 'i' },
          company: { $regex: `^${companyName}$`, $options: 'i' }
        });
      }

      if (!contact) {
        await Contact.create({
          userId,
          name: recName,
          company: companyName,
          jobTitle: 'Recruiter / Talent Partner',
          email: recEmail,
          phone: body.recruiterPhone || '',
          linkedin: body.recruiterLinkedIn || '',
          notes: body.contactNotes || `Recruiter contact for ${jobTitle} at ${companyName}`
        });
      }
    }

    const cleanedTags = cleanTags(body.techTags || body.tags);

    const newApp = await Application.create({
      userId,
      jobTitle,
      companyId: company._id,
      companyName: company.name,
      companyLogo: body.companyLogo || company.logo || '',
      location: body.location || 'Remote',
      workMode: body.workMode || 'Remote',
      employmentType: body.employmentType || 'Full-time',
      jobUrl: body.jobUrl || '',
      source: body.source || 'Company Website',
      jobDescription: body.jobDescription || '',
      pipelineStage: stage,
      status: stage,
      priority: body.priority || 'Medium Priority (Standard)',
      minSalary,
      maxSalary,
      salaryRange: body.salaryRange || '',
      salaryMin: minSalary,
      salaryMax: maxSalary,
      salaryCurrency: body.salaryCurrency || 'USD',
      salaryType: body.salaryType || 'Annual',
      dateSaved: body.dateSaved || new Date().toISOString().split('T')[0],
      dateApplied: body.dateApplied || (stage === 'Wishlist' ? '' : new Date().toISOString().split('T')[0]),
      applicationDeadline: body.applicationDeadline || body.deadline || '',
      deadline: body.applicationDeadline || body.deadline || '',
      lastFollowUpDate: body.lastFollowUpDate || '',
      nextAction: body.nextAction || 'Submit application',
      nextActionDate: body.nextActionDate || '',
      recruiterName: body.recruiterName || '',
      recruiterEmail: body.recruiterEmail || '',
      recruiterPhone: body.recruiterPhone || '',
      recruiterLinkedIn: body.recruiterLinkedIn || '',
      contactNotes: body.contactNotes || '',
      resumeVersion: body.resumeVersion || '',
      interviewDate: body.interviewDate || '',
      interviewType: body.interviewType || 'Technical',
      meetingLink: body.meetingLink || '',
      interviewNotes: body.interviewNotes || '',
      interviewQuestions: body.interviewQuestions || '',
      techTags: cleanedTags,
      tags: cleanedTags,
      whyThisRole: body.whyThisRole || '',
      keySkills: body.keySkills || '',
      notes: body.notes || '',
      isArchived: stage === 'Rejected' || stage === 'Archived',
      offerDetails: body.offerDetails || {}
    });

    // If interview date provided, schedule interview event for calendar
    if (body.interviewDate) {
      const interviewDateFormatted = body.interviewDate.includes('T')
        ? body.interviewDate.split('T')[0]
        : body.interviewDate;

      await Interview.create({
        userId,
        applicationId: newApp._id,
        company: companyName,
        jobTitle,
        interviewType: body.interviewType || 'Technical',
        roundName: `${body.interviewType || 'Interview'} Round`,
        date: interviewDateFormatted,
        startTime: '14:00',
        endTime: '15:00',
        interviewer: body.recruiterName || 'Hiring Team',
        meetingUrl: body.meetingLink || '',
        notes: body.interviewNotes || body.notes || ''
      });
    }

    // Log Activity
    await Activity.create({
      userId,
      type: 'application_created',
      title: `${companyName}: Added application for ${jobTitle}`,
      description: `Stage: ${stage} · Priority: ${newApp.priority}`,
      company: companyName,
      relatedId: newApp._id
    });

    // Notify if high priority or urgent
    if (newApp.priority && newApp.priority.includes('High')) {
      await Notification.create({
        userId,
        type: 'application',
        title: `🔥 High Priority Application: ${companyName}`,
        message: `Application created for ${jobTitle}. Next action: ${newApp.nextAction || 'Submit application'}.`,
        link: `/applications/${newApp._id}`
      });
    }

    res.status(201).json({
      success: true,
      message: 'Application added successfully.',
      data: newApp
    });
  } catch (err) {
    console.error('[Application POST Error]:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to create application.' });
  }
});

// Common update handler for PUT and PATCH
async function handleUpdate(req, res) {
  try {
    const userId = req.user._id;
    const app = await Application.findById(req.params.id);

    if (!app || String(app.userId) !== String(userId)) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const body = req.body;

    // Check salary validation
    const minSalary = body.minSalary !== undefined ? Number(body.minSalary) : (body.salaryMin !== undefined ? Number(body.salaryMin) : app.minSalary);
    const maxSalary = body.maxSalary !== undefined ? Number(body.maxSalary) : (body.salaryMax !== undefined ? Number(body.salaryMax) : app.maxSalary);

    if (minSalary > 0 && maxSalary > 0 && minSalary > maxSalary) {
      return res.status(400).json({
        success: false,
        message: 'Minimum salary cannot exceed maximum salary.'
      });
    }

    if (body.jobUrl !== undefined && body.jobUrl && !isValidUrl(body.jobUrl)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Job Posting URL.'
      });
    }

    if (body.meetingLink !== undefined && body.meetingLink && !isValidUrl(body.meetingLink)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Meeting URL.'
      });
    }

    if (body.recruiterEmail !== undefined && body.recruiterEmail && !isValidEmail(body.recruiterEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid Recruiter Email address.'
      });
    }

    const allowedFields = [
      'jobTitle',
      'companyName',
      'companyLogo',
      'companyId',
      'jobUrl',
      'location',
      'workMode',
      'employmentType',
      'source',
      'jobDescription',
      'pipelineStage',
      'status',
      'priority',
      'minSalary',
      'maxSalary',
      'salaryRange',
      'salaryMin',
      'salaryMax',
      'salaryCurrency',
      'salaryType',
      'dateSaved',
      'dateApplied',
      'applicationDeadline',
      'deadline',
      'lastFollowUpDate',
      'nextAction',
      'nextActionDate',
      'recruiterName',
      'recruiterEmail',
      'recruiterPhone',
      'recruiterLinkedIn',
      'contactNotes',
      'resumeVersion',
      'interviewDate',
      'interviewType',
      'meetingLink',
      'interviewNotes',
      'interviewQuestions',
      'techTags',
      'tags',
      'whyThisRole',
      'keySkills',
      'notes',
      'isArchived',
      'isTopChoice',
      'offerDetails',
      'milestones'
    ];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        if (field === 'techTags' || field === 'tags') {
          const cleaned = cleanTags(body[field]);
          app.techTags = cleaned;
          app.tags = cleaned;
        } else {
          app[field] = body[field];
        }
      }
    });

    if (body.pipelineStage) {
      app.status = body.pipelineStage;
      app.pipelineStage = body.pipelineStage;
    } else if (body.status) {
      app.pipelineStage = body.status;
      app.status = body.status;
    }

    if (app.status === 'Rejected' || app.status === 'Archived') {
      app.isArchived = true;
    }

    // Sync salaries
    if (body.minSalary !== undefined) {
      app.minSalary = Number(body.minSalary);
      app.salaryMin = Number(body.minSalary);
    }
    if (body.maxSalary !== undefined) {
      app.maxSalary = Number(body.maxSalary);
      app.salaryMax = Number(body.maxSalary);
    }

    // If interview date was provided/updated, schedule/update linked interview
    if (body.interviewDate) {
      const interviewDateFormatted = body.interviewDate.includes('T')
        ? body.interviewDate.split('T')[0]
        : body.interviewDate;

      let interview = await Interview.findOne({ applicationId: app._id, userId });
      if (interview) {
        interview.date = interviewDateFormatted;
        if (body.interviewType) interview.interviewType = body.interviewType;
        if (body.meetingLink !== undefined) interview.meetingUrl = body.meetingLink;
        if (body.interviewNotes !== undefined) interview.notes = body.interviewNotes;
        await interview.save();
      } else {
        await Interview.create({
          userId,
          applicationId: app._id,
          company: app.companyName,
          jobTitle: app.jobTitle,
          interviewType: body.interviewType || 'Technical',
          roundName: `${body.interviewType || 'Interview'} Round`,
          date: interviewDateFormatted,
          startTime: '14:00',
          endTime: '15:00',
          interviewer: body.recruiterName || 'Hiring Team',
          meetingUrl: body.meetingLink || '',
          notes: body.interviewNotes || ''
        });
      }
    }

    await app.save();

    res.json({
      success: true,
      message: 'Application updated successfully.',
      data: app
    });
  } catch (err) {
    console.error('[Application Update Error]:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to update application.' });
  }
}

// PUT /api/applications/:id
router.put('/:id', handleUpdate);

// PATCH /api/applications/:id
router.patch('/:id', handleUpdate);

// PATCH /api/applications/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, pipelineStage, nextAction, nextActionDate } = req.body;
    const targetStatus = status || pipelineStage;

    if (!targetStatus) {
      return res.status(400).json({ success: false, message: 'Status or pipeline stage is required.' });
    }

    const app = await Application.findById(req.params.id);
    if (!app || String(app.userId) !== String(userId)) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const previousStatus = app.status;
    app.status = targetStatus;
    app.pipelineStage = targetStatus;
    if (nextAction !== undefined) app.nextAction = nextAction;
    if (nextActionDate !== undefined) app.nextActionDate = nextActionDate;
    if (targetStatus === 'Rejected' || targetStatus === 'Archived') app.isArchived = true;
    if (targetStatus === 'Wishlist' || targetStatus === 'Applied') app.isArchived = false;

    await app.save();

    // Log Activity
    await Activity.create({
      userId,
      type: 'status_change',
      title: `${app.companyName}: Moved to ${targetStatus}`,
      description: `Transitioned from ${previousStatus} → ${targetStatus}`,
      company: app.companyName,
      relatedId: app._id
    });

    // Create Notification on milestones
    if (targetStatus === 'Interview' || targetStatus === 'Offer') {
      await Notification.create({
        userId,
        type: targetStatus === 'Offer' ? 'offer' : 'interview',
        title: targetStatus === 'Offer' ? `🎉 Offer Received from ${app.companyName}!` : `Interview Scheduled: ${app.companyName}`,
        message: targetStatus === 'Offer' ? `Congratulations! Review compensation details.` : `Prepare your technical loops for ${app.jobTitle}.`,
        link: `/applications/${app._id}`
      });
    }

    res.json({
      success: true,
      message: `Status updated to ${targetStatus}.`,
      data: app
    });
  } catch (err) {
    console.error('[Application Status Update Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to update application status.' });
  }
});

// PATCH /api/applications/:id/archive
router.patch('/:id/archive', async (req, res) => {
  try {
    const userId = req.user._id;
    const { isArchived } = req.body;

    const app = await Application.findById(req.params.id);
    if (!app || String(app.userId) !== String(userId)) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    app.isArchived = isArchived !== undefined ? Boolean(isArchived) : !app.isArchived;
    if (app.isArchived) {
      app.status = 'Archived';
      app.pipelineStage = 'Archived';
    } else {
      app.status = 'Applied';
      app.pipelineStage = 'Applied';
    }
    await app.save();

    res.json({
      success: true,
      message: app.isArchived ? 'Application archived.' : 'Application restored.',
      data: app
    });
  } catch (err) {
    console.error('[Application Archive Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to toggle archive status.' });
  }
});

// DELETE /api/applications/:id
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user._id;
    const app = await Application.findById(req.params.id);

    if (!app || String(app.userId) !== String(userId)) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    await Application.findByIdAndDelete(req.params.id);

    // Also delete linked interviews and documents
    await Interview.deleteMany({ applicationId: req.params.id, userId });
    await Document.deleteMany({ applicationId: req.params.id, userId });

    res.json({
      success: true,
      message: 'Application and associated records removed successfully.'
    });
  } catch (err) {
    console.error('[Application DELETE Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to delete application.' });
  }
});

export default router;
