import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { registerUser, login, sendRecoveryEmail, updateUserImages, updateProfile, deleteAccount, exportUserData, resetPassword, updatePassword, getCurrentUser } from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';

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

export default router;
