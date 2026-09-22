import express from 'express';
import { Application, Interview } from '../models/index.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

// GET /api/analytics
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;

    const apps = await Application.find({ userId }).lean();
    const interviews = await Interview.find({ userId }).lean();

    const totalApplications = apps.length;
    const totalInterviews = interviews.length;

    // Status counts
    const wishlistCount = apps.filter((a) => a.status === 'Wishlist').length;
    const appliedCount = apps.filter((a) => a.status === 'Applied').length;
    const screeningCount = apps.filter((a) => a.status === 'Screening').length;
    const interviewCount = apps.filter((a) => a.status === 'Interview').length;
    const offerCount = apps.filter((a) => a.status === 'Offer').length;
    const rejectedCount = apps.filter((a) => a.status === 'Rejected').length;

    // Responded applications = applications that moved past 'Applied' / 'Wishlist'
    const respondedApps = apps.filter((a) =>
      ['Screening', 'Interview', 'Offer', 'Rejected'].includes(a.status)
    );

    const responseRate =
      totalApplications > 0 ? Math.round((respondedApps.length / totalApplications) * 100) : 0;
    const interviewRate =
      totalApplications > 0
        ? Math.round(((interviewCount + offerCount) / totalApplications) * 100)
        : 0;
    const offerRate =
      totalApplications > 0 ? Math.round((offerCount / totalApplications) * 100) : 0;
    const rejectionRate =
      totalApplications > 0 ? Math.round((rejectedCount / totalApplications) * 100) : 0;

    // Applications by status breakdown
    const applicationsByStatus = [
      { status: 'Wishlist', count: wishlistCount, color: '#6366f1' },
      { status: 'Applied', count: appliedCount, color: '#0ea5e9' },
      { status: 'Screening', count: screeningCount, color: '#a855f7' },
      { status: 'Interview', count: interviewCount, color: '#f59e0b' },
      { status: 'Offer', count: offerCount, color: '#10b981' },
      { status: 'Rejected', count: rejectedCount, color: '#f43f5e' }
    ];

    // Source breakdown
    const sourceMap = {};
    apps.forEach((a) => {
      const src = a.source || 'Company Careers';
      sourceMap[src] = (sourceMap[src] || 0) + 1;
    });

    const applicationsBySource = Object.keys(sourceMap).map((source) => ({
      source,
      count: sourceMap[source],
      percentage: totalApplications > 0 ? Math.round((sourceMap[source] / totalApplications) * 100) : 0
    }));

    // Applications over time (last 6 months or months with activity)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const timelineMap = {};

    apps.forEach((a) => {
      const dateStr = a.dateApplied || a.createdAt;
      if (dateStr) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
          timelineMap[key] = (timelineMap[key] || 0) + 1;
        }
      }
    });

    const applicationsOverTime = Object.keys(timelineMap).map((month) => ({
      month,
      applications: timelineMap[month]
    }));

    // Salary Distribution
    const salaryBuckets = {
      '< $120k': 0,
      '$120k - $160k': 0,
      '$160k - $200k': 0,
      '> $200k': 0
    };

    apps.forEach((a) => {
      const s = a.salaryMax || a.salaryMin;
      if (s) {
        if (s < 120000) salaryBuckets['< $120k']++;
        else if (s <= 160000) salaryBuckets['$120k - $160k']++;
        else if (s <= 200000) salaryBuckets['$160k - $200k']++;
        else salaryBuckets['> $200k']++;
      }
    });

    const salaryDistribution = Object.keys(salaryBuckets).map((range) => ({
      range,
      count: salaryBuckets[range]
    }));

    res.json({
      success: true,
      data: {
        totalApplications,
        totalInterviews,
        responseRate,
        interviewRate,
        offerRate,
        rejectionRate,
        applicationsByStatus,
        applicationsBySource,
        applicationsOverTime,
        salaryDistribution
      }
    });
  } catch (err) {
    console.error('[Analytics GET Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to compute analytics.' });
  }
});

export default router;
