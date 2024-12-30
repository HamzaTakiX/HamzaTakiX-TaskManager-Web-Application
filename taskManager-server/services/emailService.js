import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create reusable transporter
const createTransporter = async () => {
    // Generate test SMTP service account from ethereal.email
    const testAccount = await nodemailer.createTestAccount();

    // Create a testing transporter
    return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass
        }
    });
};

export const sendPasswordResetEmail = async (to, resetToken) => {
    const resetLink = `http://localhost:3000/auth/reset-password?token=${resetToken}`;
    
    try {
        const transporter = await createTransporter();
        
        const mailOptions = {
            from: '"Star Company" <noreply@starcompany.com>',
            to: to,
            subject: 'Password Reset Request - Star Company',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #074799; text-align: center;">Password Reset Request</h2>
                    <p>Hello,</p>
                    <p>We received a request to reset your password. Click the button below to create a new password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" 
                           style="background-color: #074799; 
                                  color: white; 
                                  padding: 12px 24px; 
                                  text-decoration: none; 
                                  border-radius: 5px;
                                  display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    <p>If you didn't request this password reset, you can safely ignore this email.</p>
                    <p>This link will expire in 1 hour for security reasons.</p>
                    <p>Best regards,<br>Star Company Team</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        
        // This URL is only for testing - it shows where the email can be previewed
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};
