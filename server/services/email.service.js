const transporter = require('../config/email');

/**
 * Send verification email with 6-digit code
 * @param {string} email - Recipient email address
 * @param {string} code - 6-digit verification code
 * @param {string} name - User's name
 */
async function sendVerificationEmail(email, code, name) {
    const mailOptions = {
        from: process.env.EMAIL_FROM || 'Connect2Connect <noreply@connect2connect.com>',
        to: email,
        subject: 'Verify Your Email - Connect2Connect',
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0A0A0A; color: #F8F6F0;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <div style="width: 60px; height: 60px; background: #4169E1; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                        <span style="font-size: 30px;">📧</span>
                    </div>
                    <h1 style="color: #F8F6F0; margin: 0;">Welcome to Connect2Connect!</h1>
                </div>
                
                <div style="background: #1A1A1A; border: 2px solid #333; border-radius: 12px; padding: 30px; margin: 20px 0;">
                    <p style="color: #F8F6F0; font-size: 16px; margin-bottom: 20px;">Hi <strong>${name}</strong>,</p>
                    <p style="color: #999; margin-bottom: 25px;">Thanks for signing up! Your verification code is:</p>
                    
                    <div style="background: #4169E1; padding: 25px; text-align: center; border-radius: 8px; margin: 25px 0;">
                        <h1 style="color: #F8F6F0; letter-spacing: 8px; margin: 0; font-size: 36px; font-family: 'Courier New', monospace;">${code}</h1>
                    </div>
                    
                    <p style="color: #999; font-size: 14px; margin-top: 20px;">
                        ⏱️ This code will expire in <strong style="color: #F8F6F0;">10 minutes</strong>.
                    </p>
                    <p style="color: #666; font-size: 13px; margin-top: 15px;">
                        If you didn't sign up for Connect2Connect, please ignore this email.
                    </p>
                </div>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #333;">
                    <p style="color: #666; font-size: 12px; margin: 0;">
                        Watch together, anywhere 🎬
                    </p>
                    <p style="color: #444; font-size: 11px; margin-top: 5px;">
                        © 2025 Connect2Connect. All rights reserved.
                    </p>
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Verification email sent to ${email} (Message ID: ${info.messageId})`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Email send error:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Send password reset email
 * @param {string} email - Recipient email address
 * @param {string} resetToken - Password reset token
 * @param {string} name - User's name
 */
async function sendPasswordResetEmail(email, resetToken, name) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
        from: process.env.EMAIL_FROM || 'Connect2Connect <noreply@connect2connect.com>',
        to: email,
        subject: 'Reset Your Password - Connect2Connect',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4169E1;">Password Reset Request</h2>
                <p>Hi ${name},</p>
                <p>We received a request to reset your password. Click the button below to reset it:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="background: #4169E1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                        Reset Password
                    </a>
                </div>
                
                <p style="color: #666; font-size: 12px;">
                    If you didn't request this, please ignore this email.
                    <br>This link will expire in 1 hour.
                </p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Password reset email sent to ${email}`);
        return { success: true };
    } catch (error) {
        console.error('❌ Password reset email error:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail
};
