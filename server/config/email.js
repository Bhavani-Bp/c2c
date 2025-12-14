const { Resend } = require('resend');

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Verify API key is configured
if (!process.env.RESEND_API_KEY) {
    console.log('⚠️  RESEND_API_KEY not configured - email sending will fail');
    console.log('ℹ️  Get your API key from: https://resend.com/api-keys');
} else {
    console.log('✅ Resend email service configured');
}

module.exports = resend;
