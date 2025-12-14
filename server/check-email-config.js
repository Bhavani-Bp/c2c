/**
 * Email Configuration Checker
 * 
 * This script helps verify if your Brevo email configuration is correct
 */

require('dotenv').config();
const axios = require('axios');

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@connect2connect.com';

console.log('\n' + '='.repeat(60));
console.log('📧 EMAIL CONFIGURATION CHECKER');
console.log('='.repeat(60));

// Check 1: API Key
console.log('\n1️⃣  Checking BREVO_API_KEY...');
if (!BREVO_API_KEY) {
    console.log('❌ BREVO_API_KEY is NOT set in .env file');
    console.log('   Please add: BREVO_API_KEY=your_api_key_here');
    process.exit(1);
} else {
    console.log('✅ BREVO_API_KEY is set');
    console.log(`   Value: ${BREVO_API_KEY.substring(0, 10)}...${BREVO_API_KEY.substring(BREVO_API_KEY.length - 4)}`);
}

// Check 2: Email From
console.log('\n2️⃣  Checking EMAIL_FROM...');
console.log(`   Email From: ${EMAIL_FROM}`);

// Check 3: Test API Connection
console.log('\n3️⃣  Testing Brevo API connection...');

async function testBrevoConnection() {
    try {
        // Test API key by fetching account info
        const response = await axios.get('https://api.brevo.com/v3/account', {
            headers: {
                'api-key': BREVO_API_KEY
            }
        });

        console.log('✅ Brevo API connection successful!');
        console.log(`   Account Email: ${response.data.email}`);
        console.log(`   Account Name: ${response.data.firstName} ${response.data.lastName}`);
        console.log(`   Plan: ${response.data.plan[0]?.type || 'Unknown'}`);

        // Check email credits
        if (response.data.plan[0]?.credits !== undefined) {
            console.log(`   Email Credits: ${response.data.plan[0].credits}`);
        }

        return true;
    } catch (error) {
        console.log('❌ Brevo API connection failed!');
        console.log(`   Status: ${error.response?.status}`);
        console.log(`   Error: ${error.response?.data?.message || error.message}`);

        if (error.response?.status === 401) {
            console.log('\n⚠️  AUTHENTICATION FAILED');
            console.log('   Your API key is invalid or expired.');
            console.log('   Please check: https://app.brevo.com/settings/keys/api');
        }

        return false;
    }
}

// Check 4: Test Sender Email
console.log('\n4️⃣  Testing sender email configuration...');

async function testSenderEmail() {
    try {
        const response = await axios.get('https://api.brevo.com/v3/senders', {
            headers: {
                'api-key': BREVO_API_KEY
            }
        });

        const senders = response.data.senders;
        console.log(`✅ Found ${senders.length} verified sender(s):`);

        senders.forEach((sender, index) => {
            const isMatch = sender.email === EMAIL_FROM;
            console.log(`   ${index + 1}. ${sender.email} ${isMatch ? '✅ (MATCHES EMAIL_FROM)' : ''}`);
        });

        const matchingSender = senders.find(s => s.email === EMAIL_FROM);
        if (!matchingSender) {
            console.log(`\n⚠️  WARNING: EMAIL_FROM (${EMAIL_FROM}) is not in your verified senders list!`);
            console.log('   You may need to verify this email in Brevo:');
            console.log('   https://app.brevo.com/senders');
        }

        return true;
    } catch (error) {
        console.log('❌ Could not fetch sender list');
        console.log(`   Error: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

// Check 5: Send Test Email
async function sendTestEmail() {
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        readline.question('\n5️⃣  Send a test email? Enter recipient email (or press Enter to skip): ', async (testEmail) => {
            readline.close();

            if (!testEmail || testEmail.trim() === '') {
                console.log('⏭️  Skipped test email');
                resolve(true);
                return;
            }

            try {
                console.log(`\n📧 Sending test email to ${testEmail}...`);
                const response = await axios.post(
                    'https://api.brevo.com/v3/smtp/email',
                    {
                        sender: { email: EMAIL_FROM, name: 'Connect2Connect' },
                        to: [{ email: testEmail }],
                        subject: 'Test Email from Connect2Connect',
                        htmlContent: `
                            <div style="font-family: Arial, sans-serif; padding: 20px;">
                                <h2>✅ Email Configuration Test</h2>
                                <p>This is a test email from your Connect2Connect application.</p>
                                <p>If you're receiving this, your email configuration is working correctly!</p>
                                <hr>
                                <p style=" color: #666; font-size: 12px;">
                                    Sent at: ${new Date().toLocaleString()}<br>
                                    From: ${EMAIL_FROM}<br>
                                    Using: Brevo API
                                </p>
                            </div>
                        `
                    },
                    {
                        headers: {
                            'api-key': BREVO_API_KEY,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                console.log('✅ Test email sent successfully!');
                console.log(`   Message ID: ${response.data.messageId}`);
                console.log(`   Check ${testEmail} inbox (including spam folder)`);
                resolve(true);
            } catch (error) {
                console.log('❌ Test email failed!');
                console.log(`   Status: ${error.response?.status}`);
                console.log(`   Error: ${error.response?.data || error.message}`);
                resolve(false);
            }
        });
    });
}

// Run all checks
async function runAllChecks() {
    const connectionOk = await testBrevoConnection();
    if (!connectionOk) {
        console.log('\n❌ Cannot proceed - fix API connection first');
        process.exit(1);
    }

    await testSenderEmail();
    await sendTestEmail();

    console.log('\n' + '='.repeat(60));
    console.log('✅ Email configuration check complete!');
    console.log('='.repeat(60));
    console.log('\nIf all checks passed, your email verification should work.');
    console.log('If emails still don\'t arrive, check:');
    console.log('  1. Spam/junk folder');
    console.log('  2. Brevo dashboard for delivery logs');
    console.log('  3. Server console for verification codes (fallback)');
    console.log('='.repeat(60) + '\n');
}

runAllChecks().catch(error => {
    console.error('\nFatal error:', error);
    process.exit(1);
});
