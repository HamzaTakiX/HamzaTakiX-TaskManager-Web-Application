import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { registerUser, login, sendRecoveryEmail, updateUserImages, updateProfile, deleteAccount, exportUserData, resetPassword, updatePassword, getCurrentUser } from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join('uploads', file.fieldname === 'profileImage' ? 'profiles' : 'banners');
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Auth routes
router.post('/register', registerUser);
router.post('/login', login);
router.post('/forgot-password', sendRecoveryEmail);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', authenticateToken, getCurrentUser);
router.post('/upload-images', authenticateToken, upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'bannerImage', maxCount: 1 }
]), updateUserImages);
router.put('/update-profile', authenticateToken, updateProfile);
router.put('/profile/password', authenticateToken, updatePassword);
router.delete('/delete-account', authenticateToken, deleteAccount);
router.get('/export-data', authenticateToken, exportUserData);

// Notification settings routes
router.post('/notification-settings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = req.body;

    await User.findByIdAndUpdate(userId, {
      notificationSettings: settings
    });

    res.json({ 
      state: true, 
      message: 'Notification settings updated successfully' 
    });
  } catch (error) {
    console.error('Error saving notification settings:', error);
    res.status(500).json({ 
      state: false, 
      message: 'Error saving notification settings' 
    });
  }
});

router.get('/notification-settings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    res.json({ 
      state: true, 
      settings: user.notificationSettings || {} 
    });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({ 
      state: false, 
      message: 'Error fetching notification settings' 
    });
  }
});

export default router;
