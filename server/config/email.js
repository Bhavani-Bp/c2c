const nodemailer = require('nodemailer');

// Create transporter with Gmail SMTP
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Verify connection on startup
transporter.verify((error, success) => {
    if (error) {
        console.log('❌ Email service error:', error.message);
        console.log('ℹ️  Please configure EMAIL_USER and EMAIL_PASSWORD in .env');
    } else {
        console.log('✅ Email service ready to send messages');
    }
});

module.exports = transporter;
