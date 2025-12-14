/**
 * Test Email Verification Flow
 * 
 * This script tests:
 * 1. Signup creates user without token
 * 2. Login fails for unverified user
 * 3. Email verification returns token
 * 4. Login succeeds for verified user
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000';
const TEST_EMAIL = `test${Date.now()}@example.com`;
const TEST_PASSWORD = 'testpass123';
const TEST_NAME = 'Test User';

let verificationCode = null;
let userId = null;

async function testSignup() {
    console.log('\n🧪 TEST 1: Signup (should NOT return token)');
    console.log('='.repeat(50));

    try {
        const response = await axios.post(`${API_URL}/api/auth/signup`, {
            name: TEST_NAME,
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });

        console.log('✅ Status:', response.status);
        console.log('📦 Response:', JSON.stringify(response.data, null, 2));

        if (response.data.token) {
            console.log('❌ FAIL: Token returned before verification!');
            return false;
        }

        if (!response.data.requiresVerification) {
            console.log('❌ FAIL: requiresVerification flag not set!');
            return false;
        }

        if (response.data.user.isVerified !== false) {
            console.log('❌ FAIL: User should not be verified yet!');
            return false;
        }

        userId = response.data.user.userId;
        console.log('✅ PASS: Signup successful without token');
        console.log(`📧 Check server logs for verification code for: ${TEST_EMAIL}`);

        return true;
    } catch (error) {
        console.log('❌ FAIL:', error.response?.data || error.message);
        return false;
    }
}

async function testLoginBeforeVerification() {
    console.log('\n🧪 TEST 2: Login before verification (should fail)');
    console.log('='.repeat(50));

    try {
        const response = await axios.post(`${API_URL}/api/auth/login`, {
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });

        console.log('❌ FAIL: Login should have been rejected!');
        console.log('📦 Response:', JSON.stringify(response.data, null, 2));
        return false;
    } catch (error) {
        if (error.response?.status === 403) {
            console.log('✅ PASS: Login correctly rejected');
            console.log('📦 Error:', error.response.data);
            return true;
        } else {
            console.log('❌ FAIL: Wrong error type');
            console.log('📦 Error:', error.response?.data || error.message);
            return false;
        }
    }
}

async function testEmailVerification() {
    console.log('\n🧪 TEST 3: Email verification (should return token)');
    console.log('='.repeat(50));

    // Prompt for verification code
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        readline.question('Enter verification code from server logs: ', async (code) => {
            readline.close();
            verificationCode = code.trim();

            try {
                const response = await axios.post(`${API_URL}/api/auth/verify-email`, {
                    email: TEST_EMAIL,
                    code: verificationCode
                });

                console.log('✅ Status:', response.status);
                console.log('📦 Response:', JSON.stringify(response.data, null, 2));

                if (!response.data.token) {
                    console.log('❌ FAIL: Token not returned after verification!');
                    resolve(false);
                    return;
                }

                if (!response.data.user.isVerified) {
                    console.log('❌ FAIL: User should be verified!');
                    resolve(false);
                    return;
                }

                console.log('✅ PASS: Email verification successful with token');
                resolve(true);
            } catch (error) {
                console.log('❌ FAIL:', error.response?.data || error.message);
                resolve(false);
            }
        });
    });
}

async function testLoginAfterVerification() {
    console.log('\n🧪 TEST 4: Login after verification (should succeed)');
    console.log('='.repeat(50));

    try {
        const response = await axios.post(`${API_URL}/api/auth/login`, {
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });

        console.log('✅ Status:', response.status);
        console.log('📦 Response:', JSON.stringify(response.data, null, 2));

        if (!response.data.token) {
            console.log('❌ FAIL: Token not returned on login!');
            return false;
        }

        if (!response.data.user.isVerified) {
            console.log('❌ FAIL: User should be verified!');
            return false;
        }

        console.log('✅ PASS: Login successful after verification');
        return true;
    } catch (error) {
        console.log('❌ FAIL:', error.response?.data || error.message);
        return false;
    }
}

async function runTests() {
    console.log('\n' + '='.repeat(50));
    console.log('🧪 EMAIL VERIFICATION FLOW TESTS');
    console.log('='.repeat(50));
    console.log(`🔗 API URL: ${API_URL}`);
    console.log(`📧 Test Email: ${TEST_EMAIL}`);
    console.log('='.repeat(50));

    const results = {
        signup: false,
        loginBeforeVerification: false,
        verification: false,
        loginAfterVerification: false
    };

    results.signup = await testSignup();
    if (!results.signup) {
        console.log('\n❌ Signup test failed. Stopping tests.');
        process.exit(1);
    }

    results.loginBeforeVerification = await testLoginBeforeVerification();

    results.verification = await testEmailVerification();
    if (!results.verification) {
        console.log('\n❌ Verification test failed. Stopping tests.');
        process.exit(1);
    }

    results.loginAfterVerification = await testLoginAfterVerification();

    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`1. Signup without token: ${results.signup ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`2. Login before verification: ${results.loginBeforeVerification ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`3. Email verification: ${results.verification ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`4. Login after verification: ${results.loginAfterVerification ? '✅ PASS' : '❌ FAIL'}`);
    console.log('='.repeat(50));

    const allPassed = Object.values(results).every(r => r === true);
    if (allPassed) {
        console.log('\n🎉 ALL TESTS PASSED!');
    } else {
        console.log('\n❌ SOME TESTS FAILED!');
        process.exit(1);
    }
}

runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
