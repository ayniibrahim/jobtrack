import express from 'express';
import { Contact } from '../models/index.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

// GET /api/contacts
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const { search } = req.query;

    const query = { userId };
    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { company: { $regex: q, $options: 'i' } },
        { jobTitle: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ];
    }

    const contacts = await Contact.find(query).sort({ name: 1 }).lean();
    res.json({ success: true, data: contacts });
  } catch (err) {
    console.error('[Contact GET All Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve contacts.' });
  }
});

// GET /api/contacts/:id
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user._id;
    const contact = await Contact.findById(req.params.id).lean();

    if (!contact || String(contact.userId) !== String(userId)) {
      return res.status(404).json({ success: false, message: 'Contact not found.' });
    }

    res.json({ success: true, data: contact });
  } catch (err) {
    console.error('[Contact GET Detail Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve contact.' });
  }
});

// POST /api/contacts
router.post('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, company, jobTitle, email, phone, linkedin, notes, isPrimaryPOC } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Contact name is required.' });
    }

    const newContact = await Contact.create({
      userId,
      name: name.trim(),
      company: company ? company.trim() : '',
      jobTitle: jobTitle || 'Recruiter',
      email: email ? email.trim() : '',
      phone: phone ? phone.trim() : '',
      linkedin: linkedin ? linkedin.trim() : '',
      notes: notes || '',
      isPrimaryPOC: Boolean(isPrimaryPOC)
    });

    res.status(201).json({
      success: true,
      message: 'Contact added to recruiter directory.',
      data: newContact
    });
  } catch (err) {
    console.error('[Contact POST Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to create contact.' });
  }
});

// PATCH /api/contacts/:id
router.patch('/:id', async (req, res) => {
  try {
    const userId = req.user._id;
    const contact = await Contact.findById(req.params.id);

    if (!contact || String(contact.userId) !== String(userId)) {
      return res.status(404).json({ success: false, message: 'Contact not found.' });
    }

    const { name, company, jobTitle, email, phone, linkedin, notes, isPrimaryPOC } = req.body;
    if (name !== undefined) contact.name = name.trim();
    if (company !== undefined) contact.company = company.trim();
    if (jobTitle !== undefined) contact.jobTitle = jobTitle.trim();
    if (email !== undefined) contact.email = email.trim();
    if (phone !== undefined) contact.phone = phone.trim();
    if (linkedin !== undefined) contact.linkedin = linkedin.trim();
    if (notes !== undefined) contact.notes = notes;
    if (isPrimaryPOC !== undefined) contact.isPrimaryPOC = Boolean(isPrimaryPOC);

    await contact.save();

    res.json({
      success: true,
      message: 'Contact details updated.',
      data: contact
    });
  } catch (err) {
    console.error('[Contact PATCH Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to update contact.' });
  }
});

// DELETE /api/contacts/:id
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user._id;
    const contact = await Contact.findById(req.params.id);

    if (!contact || String(contact.userId) !== String(userId)) {
      return res.status(404).json({ success: false, message: 'Contact not found.' });
    }

    await Contact.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Contact deleted successfully.'
    });
  } catch (err) {
    console.error('[Contact DELETE Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to delete contact.' });
  }
});

export default router;
