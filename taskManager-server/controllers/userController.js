import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { createUser, findUserByEmail, findUserByEmailAndFullName, findUserById, deleteUserById, updateUserPassword } from '../services/userService.js';
import User from '../models/User.js';

export const registerUser = async (req, res) => {
    try {
        let { fullName, job, email, password, location } = req.body;
        console.log("calling register with " + fullName + " " + job + " " + email + " " + password);
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.json({ message: 'Email already exists.' , 'state' : false});
        }
        fullName = fullName.toLowerCase();
        // If location is not provided, it will use the default from the model
        const newUser = await createUser({ fullName, job, email, password, location });
        res.json({ 
            message: 'User registered successfully', 
            user: {
                id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                job: newUser.job,
                location: newUser.location,
                joinedDate: newUser.joinedDate
            }, 
            state: true
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Error registering user', error: error.message, 'state' : false });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt for email:', email);

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found');
            return res.json({
                state: false,
                message: "Invalid credentials"
            });
        }
        console.log('User found');

        // Compare password
        console.log('Attempting password comparison');
        const isMatch = await user.comparePassword(password);
        console.log('Password match result:', isMatch);

        if (!isMatch) {
            console.log('Password does not match');
            return res.json({
                state: false,
                message: "Invalid credentials"
            });
        }

        // Generate token
        const token = jwt.sign(
            { 
                userId: user._id,
                email: user.email 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Log frontend display status
        console.log('Frontend Display Status:');
        console.log('profileImage displaying:', !!(user.profileImage && user.profileImage !== 'none'));
        console.log('bannerImage displaying:', !!(user.bannerImage && user.bannerImage !== 'none'));

        // Log user image status
        console.log('User Image Status (excluding none):');
        console.log('profileImage:', !!(user.profileImage && user.profileImage !== 'none'));
        console.log('bannerImage:', !!(user.bannerImage && user.bannerImage !== 'none'));

        // Debug actual image paths
        console.log('Actual image paths:');
        console.log('profileImage path:', user.profileImage);
        console.log('bannerImage path:', user.bannerImage);

        res.json({
            state: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                job: user.job,
                phoneNumber: user.phoneNumber,
                languages: user.languages,
                location: user.location,
                about: user.about,
                skills: user.skills,
                profileImage: user.profileImage === 'none' ? null : user.profileImage,
                bannerImage: user.bannerImage === 'none' ? null : user.bannerImage,
                joinedDate: user.joinedDate
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            state: false,
            message: "An error occurred during login"
        });
    }
};

export const sendRecoveryEmail = async (req, res) => {
    try {
        const { email } = req.body;
        console.log('Received request to reset password for email:', email);

        // Find user
        const user = await User.findOne({ email });
        console.log('Found user:', user ? 'Yes' : 'No');

        if (!user) {
            console.log('No user found with email:', email);
            return res.json({ 
                state: false, 
                message: 'If a user with this email exists, they will receive password reset instructions.' 
            });
        }

        // Generate reset token
        const resetToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        console.log('Generated reset token');

        // Save reset token to user
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
        
        // Save and verify
        await user.save();
        
        // Verify the save was successful
        const updatedUser = await User.findById(user._id);
        console.log('Token saved successfully:', {
            hasToken: !!updatedUser.resetPasswordToken,
            hasExpiry: !!updatedUser.resetPasswordExpires,
            tokenMatch: updatedUser.resetPasswordToken === resetToken
        });

        // Create test SMTP service account
        console.log('Creating test email account...');
        const testAccount = await nodemailer.createTestAccount();
        console.log('Test account created');

        // Create transporter
        const transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });

        // Create reset URL
        const resetUrl = `http://localhost:3000/auth/reset-password?token=${resetToken}`;

        // Create email content
        const mailOptions = {
            from: '"Task Manager" <noreply@taskmanager.com>',
            to: user.email,
            subject: 'Password Reset Request',
            html: `
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                    <h2 style="color: #074799; text-align: center;">Password Reset Request</h2>
                    <p>Hello ${user.fullName},</p>
                    <p>We received a request to reset your password. Click the button below to create a new password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background-color: #074799; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
                    </div>
                    <p>If you didn't request this, you can safely ignore this email.</p>
                    <p>This link will expire in 1 hour for security reasons.</p>
                    <hr style="border: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #666; font-size: 12px; text-align: center;">Task Manager Team</p>
                </div>
            `
        };

        // Send email
        console.log('Sending test email...');
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
        
        // Get preview URL
        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log('Preview URL:', previewUrl);

        res.json({
            state: true,
            message: 'If a user with this email exists, they will receive password reset instructions.',
            previewUrl: previewUrl
        });

    } catch (error) {
        console.error('Recovery email error:', error);
        res.status(500).json({ 
            state: false, 
            message: 'An error occurred while processing your request.' 
        });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        console.log('Attempting to reset password with token');

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Token verified successfully');
        } catch (error) {
            console.error('Token verification failed:', error);
            return res.json({ 
                state: false, 
                message: 'Invalid or expired reset link' 
            });
        }

        // Find user
        const user = await User.findById(decoded.userId);
        if (!user) {
            console.log('User not found');
            return res.json({ 
                state: false, 
                message: 'User not found' 
            });
        }
        console.log('User found successfully');

        // Check if token matches and hasn't expired
        if (user.resetPasswordToken !== token || !user.resetPasswordExpires || user.resetPasswordExpires < Date.now()) {
            console.log('Token validation failed:', {
                tokenMatch: user.resetPasswordToken === token,
                hasExpiry: !!user.resetPasswordExpires,
                expired: user.resetPasswordExpires ? user.resetPasswordExpires < Date.now() : true
            });
            return res.json({ 
                state: false, 
                message: 'Reset link has expired or is invalid' 
            });
        }

        // Update password - will be hashed by pre-save middleware
        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();
        console.log('Password updated successfully');

        // Verify the new password works
        const passwordMatch = await user.comparePassword(newPassword);
        console.log('New password verification:', passwordMatch);

        if (!passwordMatch) {
            console.error('Password verification failed after reset');
            return res.status(500).json({
                state: false,
                message: 'Error updating password'
            });
        }

        res.json({ 
            state: true, 
            message: 'Password has been reset successfully' 
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ 
            state: false, 
            message: 'An error occurred while resetting your password' 
        });
    }
};

export const updateUserImages = async (req, res) => {
    try {
        const userId = req.user.userId;
        const updateData = {};
        
        // Handle image removal requests
        if (req.body.removeProfileImage) {
            updateData.profileImage = null;
        } else if (req.body.removeBannerImage) {
            updateData.bannerImage = null;
        }
        
        // Handle new image uploads
        if (req.files) {
            if (req.files.profileImage) {
                const profilePath = `/uploads/profiles/${req.files.profileImage[0].filename}`;
                updateData.profileImage = profilePath;
            }
            if (req.files.bannerImage) {
                const bannerPath = `/uploads/banners/${req.files.bannerImage[0].filename}`;
                updateData.bannerImage = bannerPath;
            }
        }

        const user = await findUserById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found', state: false });
        }

        // Update user with new image paths or null values
        Object.assign(user, updateData);
        await user.save();

        res.json({
            message: 'Images updated successfully',
            state: true,
            user: {
                profileImage: user.profileImage,
                bannerImage: user.bannerImage
            }
        });
    } catch (error) {
        console.error('Error updating user images:', error);
        res.status(500).json({ message: 'Error updating images', error: error.message, state: false });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { fullName, location, languages, phoneNumber, email, about, skills } = req.body;
        const userId = req.user.userId;

        console.log('Updating profile with skills:', skills); // Debug log
        console.log('User ID:', userId); // Add debug log

        const user = await findUserById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found', state: false });
        }

        // Check if email is being changed and if it's already in use
        if (email && email !== user.email) {
            const existingUser = await findUserByEmail(email);
            if (existingUser) {
                return res.status(400).json({ message: 'Email already in use', state: false });
            }
        }

        // Update fields
        if (fullName) user.fullName = fullName.toLowerCase();
        if (location) user.location = location;
        if (languages) user.languages = languages;
        if (phoneNumber) user.phoneNumber = phoneNumber;
        if (email) user.email = email;
        if (about !== undefined) user.about = about;
        if (skills !== undefined) {
            console.log('Setting user skills to:', skills); // Debug log
            user.skills = skills;
        }

        await user.save();
        console.log('User saved with skills:', user.skills); // Debug log

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                job: user.job,
                location: user.location,
                languages: user.languages,
                phoneNumber: user.phoneNumber,
                about: user.about,
                skills: user.skills,
                profileImage: user.profileImage,
                bannerImage: user.bannerImage,
                joinedDate: user.joinedDate
            },
            state: true
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Error updating profile', error: error.message, state: false });
    }
};

export const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.userId; // From auth middleware

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                state: false,
                message: "User not found"
            });
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({
                state: false,
                message: "Current password is incorrect"
            });
        }

        // Update password
        const updatedUser = await updateUserPassword(userId, newPassword);
        if (!updatedUser) {
            return res.status(500).json({
                state: false,
                message: "Failed to update password"
            });
        }

        res.json({
            state: true,
            message: "Password updated successfully"
        });
    } catch (error) {
        console.error('Password update error:', error);
        res.status(500).json({
            state: false,
            message: "An error occurred while updating password"
        });
    }
};

export const deleteAccount = async (req, res) => {
    try {
        console.log('User from token:', req.user);
        const userId = req.user.userId;  
        console.log('Attempting to delete account for user:', userId);

        // Find the user first to make sure they exist
        const user = await findUserById(userId);
        console.log('Found user:', user ? 'Yes' : 'No');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found', state: false });
        }

        // Delete the user
        await deleteUserById(userId);
        console.log('Successfully deleted user:', userId);

        res.json({
            message: 'Account deleted successfully',
            state: true
        });
    } catch (error) {
        console.error('Account deletion error:', error);
        res.status(500).json({ message: 'Error deleting account', error: error.message, state: false });
    }
};

export const exportUserData = async (req, res) => {
    try {
        console.log('User from token:', req.user);
        const userId = req.user.userId;  
        console.log('Attempting to export data for user:', userId);
        
        const user = await findUserById(userId);
        console.log('Found user:', user ? 'Yes' : 'No');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found', state: false });
        }

        // Prepare user data for export (excluding sensitive information)
        const userData = {
            profile: {
                fullName: user.fullName,
                email: user.email,
                job: user.job,
                location: user.location,
                about: user.about,
                skills: user.skills,
                languages: user.languages,
                phoneNumber: user.phoneNumber,  
                profileImage: user.profileImage,
                bannerImage: user.bannerImage,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        };

        // Send the data as a downloadable JSON file
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=user_data_${userId}.json`);
        res.json(userData);
        
        console.log('Successfully exported data for user:', userId);
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ message: 'Error exporting user data', error: error.message, state: false });
    }
};

export const getCurrentUser = async (req, res) => {
    try {
        // Get userId from req.user
        const userId = req.user.userId;
        console.log('Getting current user with ID:', userId);

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                state: false,
                message: "User not found"
            });
        }

        res.json({
            state: true,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                job: user.job,
                phoneNumber: user.phoneNumber,
                languages: user.languages,
                location: user.location,
                about: user.about,
                skills: user.skills,
                profileImage: user.profileImage === 'none' ? null : user.profileImage,
                bannerImage: user.bannerImage === 'none' ? null : user.bannerImage,
                joinedDate: user.joinedDate
            }
        });
    } catch (error) {
        console.error('Error getting current user:', error);
        res.status(500).json({
            state: false,
            message: "An error occurred while getting user data"
        });
    }
};
