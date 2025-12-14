// Test Auth Endpoints
const API_URL = 'http://localhost:3001';

async function testAuthFlow() {
    console.log('🧪 Testing Auth Endpoints\n');

    // Test 1: Signup
    console.log('1️⃣ Testing Signup...');
    const signupResponse = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123'
        })
    });
    const signupData = await signupResponse.json();
    console.log('Signup Response:', signupData);

    if (!signupData.token) {
        console.error('❌ Signup failed - no token returned');
        return;
    }
    console.log('✅ Signup successful - Token received\n');

    const token = signupData.token;

    // Test 2: Login
    console.log('2️⃣ Testing Login...');
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123'
        })
    });
    const loginData = await loginResponse.json();
    console.log('Login Response:', loginData);

    if (!loginData.token) {
        console.log('ℹ️ Login blocked - Email not verified (expected)');
    } else {
        console.log('✅ Login successful - Token received\n');
    }

    // Test 3: Get Current User
    console.log('3️⃣ Testing Get Current User...');
    const meResponse = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    const meData = await meResponse.json();
    console.log('Current User Response:', meData);

    if (meData.success) {
        console.log('✅ Get user successful\n');
    }

    console.log('🎉 All tests completed!');
}

testAuthFlow().catch(console.error);
