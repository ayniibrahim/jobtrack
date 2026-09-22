import express from 'express';
import bcrypt from 'bcryptjs';
import { User, Activity } from '../models/index.js';
import { protect, generateToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, email, and password.'
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists. Please log in.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}&backgroundColor=4338ca&textColor=ffffff`,
      professionalTitle: 'Job Seeker',
      location: 'San Francisco, CA',
      desiredRole: 'Software Engineer',
      desiredSalary: '$150,000+',
      preferredLocation: 'Remote / Hybrid',
      remotePreference: 'Remote preferred',
      employmentType: 'Full-time'
    });

    await Activity.create({
      userId: newUser._id,
      type: 'system',
      title: 'Welcome to JobTrack!',
      description: 'Your career search command center has been provisioned.',
      company: 'JobTrack'
    });

    const token = generateToken(newUser._id);
    const safeUser = newUser.toObject ? newUser.toObject() : { ...newUser };
    delete safeUser.password;

    res.status(201).json({
      success: true,
      message: 'Account registered successfully!',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('[Auth Register Error]:', err);
    res.status(500).json({
      success: false,
      message: 'Registration error occurred. Please try again.'
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = generateToken(user._id);
    const safeUser = user.toObject ? user.toObject() : { ...user };
    delete safeUser.password;

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('[Auth Login Error]:', err);
    res.status(500).json({
      success: false,
      message: 'Login error occurred.'
    });
  }
});

// POST /api/auth/demo-login
router.post('/demo-login', async (req, res) => {
  try {
    let user = await User.findOne({
      $or: [{ email: 'demo@jobtrack.com' }, { email: 'ayni@jobtrack.io' }]
    });

    if (!user) {
      const allUsers = await User.find({}).limit(1);
      user = allUsers[0];
    }

    if (!user) {
      // Create default user if none exists
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      user = await User.create({
        fullName: 'Ayni Vance',
        email: 'demo@jobtrack.com',
        password: hashedPassword,
        avatar:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuAWUhNlfbYNEjJxyfdg5DPXO0TbYzorXC-VqP-jdswZvrltTnJRyQFsmHfD-0UPrf9G2MwHoAIRTW0ISqLC6E9mOP8hH0Rj8ZX0i77Xa6X3fHkGTgWtIvz6-M498KJGngYjmKPbQ-qcWKfBM42G13P9azUxq6E1Qm0ySXEJfm5xA_R7s2ezI0Vaj-s1cpliuLUj42Qo4UPHxAI1PrTd8iCccGHoANMNbVR7pkij_WOasAN6HL8ghrpF',
        professionalTitle: 'Lead Product Designer & Design Technologist',
        location: 'San Francisco, CA',
        desiredRole: 'Principal Product Designer / Staff Design Technologist',
        desiredSalary: '$195,000 - $240,000',
        preferredLocation: 'San Francisco, CA (Hybrid / Remote)',
        remotePreference: 'Remote & Hybrid',
        employmentType: 'Full-time'
      });
    }

    const token = generateToken(user._id);
    const safeUser = user.toObject ? user.toObject() : { ...user };
    delete safeUser.password;

    res.status(200).json({
      success: true,
      message: 'Demo session started successfully.',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('[Auth Demo Login Error]:', err);
    res.status(500).json({
      success: false,
      message: 'Demo login error occurred.'
    });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
});

// GET /api/auth/me (Protected)
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    delete user.password;
    res.json({
      success: true,
      user
    });
  } catch (err) {
    console.error('[Auth Me Error]:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile.'
    });
  }
});

// PUT /api/auth/profile (Protected)
router.put('/profile', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      fullName,
      professionalTitle,
      location,
      desiredRole,
      desiredSalary,
      preferredLocation,
      remotePreference,
      employmentType,
      avatar
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (fullName) user.fullName = fullName.trim();
    if (professionalTitle !== undefined) user.professionalTitle = professionalTitle.trim();
    if (location !== undefined) user.location = location.trim();
    if (desiredRole !== undefined) user.desiredRole = desiredRole.trim();
    if (desiredSalary !== undefined) user.desiredSalary = desiredSalary.trim();
    if (preferredLocation !== undefined) user.preferredLocation = preferredLocation.trim();
    if (remotePreference !== undefined) user.remotePreference = remotePreference;
    if (employmentType !== undefined) user.employmentType = employmentType;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    const safeUser = user.toObject ? user.toObject() : { ...user };
    delete safeUser.password;

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: safeUser
    });
  } catch (err) {
    console.error('[Auth Update Profile Error]:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile.'
    });
  }
});

// PUT /api/auth/password (Protected)
router.put('/password', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current and new passwords.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (err) {
    console.error('[Auth Change Password Error]:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to change password.'
    });
  }
});

export default router;
