import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { sendPasswordResetEmail } from '../services/emailService.js';
import dotenv from 'dotenv';

dotenv.config();

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ 
                state: false, 
                message: 'If this email exists in our system, you will receive password reset instructions.' 
            });
        }

        // Generate reset token
        const resetToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Save reset token to user
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // Send reset email
        const emailSent = await sendPasswordResetEmail(email, resetToken);

        if (emailSent) {
            res.json({
                state: true,
                message: 'Password reset instructions have been sent to your email.'
            });
        } else {
            res.json({
                state: false,
                message: 'Failed to send reset email. Please try again later.'
            });
        }

    } catch (error) {
        console.error('Forgot password error:', error);
        res.json({
            state: false,
            message: 'An error occurred. Please try again later.'
        });
    }
};
