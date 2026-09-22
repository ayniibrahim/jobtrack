import express from 'express';
import { Company, Application } from '../models/index.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

// GET /api/companies
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const { search } = req.query;

    const query = { userId };
    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { industry: { $regex: q, $options: 'i' } },
        { location: { $regex: q, $options: 'i' } }
      ];
    }

    const companies = await Company.find(query).sort({ name: 1 }).lean();
    const apps = await Application.find({ userId }).lean();

    const enriched = companies.map((c) => {
      const companyApps = apps.filter(
        (a) =>
          a.companyId === c._id ||
          (a.companyName && a.companyName.toLowerCase() === (c.name || '').toLowerCase())
      );
      return {
        ...c,
        applicationCount: companyApps.length,
        activeCount: companyApps.filter((a) => !a.isArchived && a.status !== 'Rejected').length
      };
    });

    res.json({ success: true, data: enriched });
  } catch (err) {
    console.error('[Company GET All Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve companies.' });
  }
});

// GET /api/companies/:id
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user._id;
    const company = await Company.findById(req.params.id).lean();

    if (!company || String(company.userId) !== String(userId)) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }

    const apps = await Application.find({ userId }).lean();
    const companyApps = apps.filter(
      (a) =>
        a.companyId === company._id ||
        (a.companyName && a.companyName.toLowerCase() === (company.name || '').toLowerCase())
    );

    res.json({
      success: true,
      data: {
        ...company,
        applications: companyApps
      }
    });
  } catch (err) {
    console.error('[Company GET Detail Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve company.' });
  }
});

// POST /api/companies
router.post('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, logo, website, industry, location, description, notes } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Company name is required.' });
    }

    const newCompany = await Company.create({
      userId,
      name: name.trim(),
      logo: logo || '',
      website: website || '',
      industry: industry || 'Technology',
      location: location || '',
      description: description || '',
      notes: notes || ''
    });

    res.status(201).json({
      success: true,
      message: 'Company added to target directory.',
      data: newCompany
    });
  } catch (err) {
    console.error('[Company POST Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to create company.' });
  }
});

// PATCH /api/companies/:id
router.patch('/:id', async (req, res) => {
  try {
    const userId = req.user._id;
    const company = await Company.findById(req.params.id);

    if (!company || String(company.userId) !== String(userId)) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }

    const { name, logo, website, industry, location, description, notes } = req.body;
    if (name !== undefined) company.name = name.trim();
    if (logo !== undefined) company.logo = logo;
    if (website !== undefined) company.website = website.trim();
    if (industry !== undefined) company.industry = industry;
    if (location !== undefined) company.location = location.trim();
    if (description !== undefined) company.description = description;
    if (notes !== undefined) company.notes = notes;

    await company.save();

    res.json({
      success: true,
      message: 'Company details updated.',
      data: company
    });
  } catch (err) {
    console.error('[Company PATCH Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to update company.' });
  }
});

// DELETE /api/companies/:id
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user._id;
    const company = await Company.findById(req.params.id);

    if (!company || String(company.userId) !== String(userId)) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }

    await Company.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Company deleted successfully.'
    });
  } catch (err) {
    console.error('[Company DELETE Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to delete company.' });
  }
});

export default router;
