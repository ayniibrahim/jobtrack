import express from 'express';
import { Application, Company, Contact, Interview } from '../models/index.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

// GET /api/search?q=
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.json({
        success: true,
        data: {
          applications: [],
          companies: [],
          contacts: [],
          interviews: []
        }
      });
    }

    const queryStr = q.trim();

    const [applications, companies, contacts, interviews] = await Promise.all([
      Application.find({
        userId,
        $or: [
          { jobTitle: { $regex: queryStr, $options: 'i' } },
          { companyName: { $regex: queryStr, $options: 'i' } },
          { location: { $regex: queryStr, $options: 'i' } },
          { notes: { $regex: queryStr, $options: 'i' } }
        ]
      })
        .limit(10)
        .lean(),

      Company.find({
        userId,
        $or: [
          { name: { $regex: queryStr, $options: 'i' } },
          { industry: { $regex: queryStr, $options: 'i' } },
          { location: { $regex: queryStr, $options: 'i' } }
        ]
      })
        .limit(5)
        .lean(),

      Contact.find({
        userId,
        $or: [
          { name: { $regex: queryStr, $options: 'i' } },
          { company: { $regex: queryStr, $options: 'i' } },
          { jobTitle: { $regex: queryStr, $options: 'i' } },
          { email: { $regex: queryStr, $options: 'i' } }
        ]
      })
        .limit(5)
        .lean(),

      Interview.find({
        userId,
        $or: [
          { company: { $regex: queryStr, $options: 'i' } },
          { jobTitle: { $regex: queryStr, $options: 'i' } },
          { interviewer: { $regex: queryStr, $options: 'i' } },
          { notes: { $regex: queryStr, $options: 'i' } }
        ]
      })
        .limit(5)
        .lean()
    ]);

    res.json({
      success: true,
      data: {
        applications,
        companies,
        contacts,
        interviews
      }
    });
  } catch (err) {
    console.error('[Search GET Error]:', err);
    res.status(500).json({ success: false, message: 'Search execution failed.' });
  }
});

export default router;
