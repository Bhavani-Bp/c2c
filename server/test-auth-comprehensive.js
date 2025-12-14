/**
 * AUTH API TEST SUITE
 * Tests for signup and login endpoints
 * Run with: node test-auth-comprehensive.js
 */

const API_URL = 'http://localhost:3001';

// Color codes for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

let passedTests = 0;
let failedTests = 0;
let testResults = [];

// Helper function to make API calls
async function apiCall(endpoint, method, data) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const responseData = await response.json();
        return { status: response.status, data: responseData };
    } catch (error) {
        return { status: 'ERROR', data: { error: error.message } };
    }
}

// Test runner
async function runTest(testName, testFn) {
    try {
        console.log(`\n${colors.blue}🧪 Running: ${testName}${colors.reset}`);
        await testFn();
        console.log(`${colors.green}✅ PASSED${colors.reset}`);
        passedTests++;
        testResults.push({ name: testName, status: 'PASSED' });
    } catch (error) {
        console.log(`${colors.red}❌ FAILED: ${error.message}${colors.reset}`);
        failedTests++;
        testResults.push({ name: testName, status: 'FAILED', error: error.message });
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

// ===== SIGNUP TESTS =====

async function testSignup_Success() {
    const timestamp = Date.now();
    const result = await apiCall('/api/auth/signup', 'POST', {
        name: 'Test User',
        email: `test${timestamp}@example.com`,
        password: 'password123'
    });

    assert(result.status === 200, `Expected 200, got ${result.status}`);
    assert(result.data.success === true, 'Missing success flag');
    assert(result.data.token, 'Missing JWT token');
    assert(result.data.user, 'Missing user data');
    assert(result.data.user.userId.includes('testuser'), `Unexpected userId format: ${result.data.user.userId}`);
    assert(/\d{3}$/.test(result.data.user.userId), 'UserId should end with 3 digits');
}

async function testSignup_DuplicateEmail() {
    const email = 'duplicate@example.com';

    // Create first user
    await apiCall('/api/auth/signup', 'POST', {
        name: 'First User',
        email: email,
        password: 'password123'
    });

    // Try to create duplicate
    const result = await apiCall('/api/auth/signup', 'POST', {
        name: 'Second User',
        email: email,
        password: 'password456'
    });

    assert(result.status === 400, `Expected 400 for duplicate email, got ${result.status}`);
    assert(result.data.error.includes('already registered'), 'Should return duplicate email error');
}

async function testSignup_MissingName() {
    const result = await apiCall('/api/auth/signup', 'POST', {
        email: 'test@example.com',
        password: 'password123'
    });

    assert(result.status === 400, `Expected 400, got ${result.status}`);
    assert(result.data.error, 'Should return error message');
}

async function testSignup_MissingEmail() {
    const result = await apiCall('/api/auth/signup', 'POST', {
        name: 'Test User',
        password: 'password123'
    });

    assert(result.status === 400, `Expected 400, got ${result.status}`);
}

async function testSignup_MissingPassword() {
    const result = await apiCall('/api/auth/signup', 'POST', {
        name: 'Test User',
        email: 'test@example.com'
    });

    assert(result.status === 400, `Expected 400, got ${result.status}`);
}

async function testSignup_EmptyName() {
    const result = await apiCall('/api/auth/signup', 'POST', {
        name: '',
        email: 'test@example.com',
        password: 'password123'
    });

    assert(result.status === 400, `Expected 400 for empty name, got ${result.status}`);
}

async function testSignup_NameWithSpecialChars() {
    const timestamp = Date.now();
    const result = await apiCall('/api/auth/signup', 'POST', {
        name: 'John O\'Brien-Smith Jr.',
        email: `john${timestamp}@example.com`,
        password: 'password123'
    });

    assert(result.status === 200, `Expected 200, got ${result.status}`);
    assert(result.data.user.userId, 'Should generate userId for special chars');
    console.log(`    Generated userId: ${result.data.user.userId}`);
}

async function testSignup_VeryLongName() {
    const timestamp = Date.now();
    const longName = 'A'.repeat(100);
    const result = await apiCall('/api/auth/signup', 'POST', {
        name: longName,
        email: `long${timestamp}@example.com`,
        password: 'password123'
    });

    assert(result.status === 200, `Should handle long names, got ${result.status}`);
    console.log(`    Generated userId length: ${result.data.user.userId.length}`);
}

async function testSignup_InvalidEmail() {
    const result = await apiCall('/api/auth/signup', 'POST', {
        name: 'Test User',
        email: 'notanemail',
        password: 'password123'
    });

    // Should either accept it or reject it, but shouldn't crash
    assert(result.status !== 'ERROR', 'Server should handle invalid email');
}

// ===== LOGIN TESTS =====

async function testLogin_Success() {
    const timestamp = Date.now();
    const email = `logintest${timestamp}@example.com`;

    // First create user
    await apiCall('/api/auth/signup', 'POST', {
        name: 'Login Test',
        email: email,
        password: 'password123'
    });

    // Mark as verified (in production, would use verify endpoint)
    // For now, we'll test with unverified user

    const result = await apiCall('/api/auth/login', 'POST', {
        email: email,
        password: 'password123'
    });

    // Should fail if not verified, OR succeed if verification is disabled
    assert(result.status === 403 || result.status === 200, `Unexpected status: ${result.status}`);

    if (result.status === 403) {
        assert(result.data.error.includes('not verified'), 'Should mention verification');
    } else {
        assert(result.data.token, 'Should return token');
    }
}

async function testLogin_WrongPassword() {
    const timestamp = Date.now();
    const email = `wrongpass${timestamp}@example.com`;

    await apiCall('/api/auth/signup', 'POST', {
        name: 'Wrong Pass Test',
        email: email,
        password: 'correctpassword'
    });

    const result = await apiCall('/api/auth/login', 'POST', {
        email: email,
        password: 'wrongpassword'
    });

    assert(result.status === 401, `Expected 401, got ${result.status}`);
    assert(result.data.error.includes('Invalid'), 'Should say invalid credentials');
}

async function testLogin_UserNotExists() {
    const result = await apiCall('/api/auth/login', 'POST', {
        email: 'nonexistent@example.com',
        password: 'password123'
    });

    assert(result.status === 401, `Expected 401, got ${result.status}`);
    assert(result.data.error, 'Should return error');
}

async function testLogin_MissingFields() {
    const result1 = await apiCall('/api/auth/login', 'POST', {
        email: 'test@example.com'
    });
    assert(result1.status === 400, 'Should reject missing password');

    const result2 = await apiCall('/api/auth/login', 'POST', {
        password: 'password123'
    });
    assert(result2.status === 400, 'Should reject missing email');
}

// ===== SECURITY TESTS =====

async function testSignup_SQLInjectionAttempt() {
    const result = await apiCall('/api/auth/signup', 'POST', {
        name: "'; DROP TABLE users; --",
        email: 'hacker@example.com',
        password: 'password123'
    });

    // Should handle gracefully without crashing
    assert(result.status !== 'ERROR', 'Should handle SQL injection attempt');
}

async function testSignup_XSSAttempt() {
    const timestamp = Date.now();
    const result = await apiCall('/api/auth/signup', 'POST', {
        name: '<script>alert("XSS")</script>',
        email: `xss${timestamp}@example.com`,
        password: 'password123'
    });

    // Should handle without crashing
    assert(result.status !== 'ERROR', 'Should handle XSS attempt');
}

// ===== USERID GENERATION TESTS =====

async function testUserIdFormat() {
    const timestamp = Date.now();
    const result = await apiCall('/api/auth/signup', 'POST', {
        name: 'Jane Smith',
        email: `jane${timestamp}@example.com`,
        password: 'password123'
    });

    assert(result.status === 200, `Expected 200, got ${result.status}`);
    const userId = result.data.user.userId;

    // Should be lowercase
    assert(userId === userId.toLowerCase(), 'UserId should be lowercase');
    // Should have no spaces
    assert(!userId.includes(' '), 'UserId should have no spaces');
    // Should end with 3 digits
    assert(/\d{3}$/.test(userId), 'UserId should end with 3 digits');

    console.log(`    UserId: ${userId}`);
}

async function testUserIdCollision() {
    // Create two users with same name
    const timestamp = Date.now();

    const result1 = await apiCall('/api/auth/signup', 'POST', {
        name: 'Collision Test',
        email: `collision1_${timestamp}@example.com`,
        password: 'password123'
    });

    const result2 = await apiCall('/api/auth/signup', 'POST', {
        name: 'Collision Test',
        email: `collision2_${timestamp}@example.com`,
        password: 'password123'
    });

    assert(result1.status === 200 && result2.status === 200, 'Both should succeed');
    assert(result1.data.user.userId !== result2.data.user.userId, 'UserIds should be different');

    console.log(`    User 1: ${result1.data.user.userId}`);
    console.log(`    User 2: ${result2.data.user.userId}`);
}

// ===== RUN ALL TESTS =====

async function runAllTests() {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`${colors.yellow}🧪 AUTH API TEST SUITE${colors.reset}`);
    console.log(`${'='.repeat(60)}\n`);

    console.log(`${colors.blue}📋 SIGNUP TESTS${colors.reset}`);
    await runTest('Signup - Success', testSignup_Success);
    await runTest('Signup - Duplicate Email', testSignup_DuplicateEmail);
    await runTest('Signup - Missing Name', testSignup_MissingName);
    await runTest('Signup - Missing Email', testSignup_MissingEmail);
    await runTest('Signup - Missing Password', testSignup_MissingPassword);
    await runTest('Signup - Empty Name', testSignup_EmptyName);
    await runTest('Signup - Name with Special Characters', testSignup_NameWithSpecialChars);
    await runTest('Signup - Very Long Name', testSignup_VeryLongName);
    await runTest('Signup - Invalid Email Format', testSignup_InvalidEmail);

    console.log(`\n${colors.blue}📋 LOGIN TESTS${colors.reset}`);
    await runTest('Login - Success (or Verification Required)', testLogin_Success);
    await runTest('Login - Wrong Password', testLogin_WrongPassword);
    await runTest('Login - User Not Exists', testLogin_UserNotExists);
    await runTest('Login - Missing Fields', testLogin_MissingFields);

    console.log(`\n${colors.blue}📋 SECURITY TESTS${colors.reset}`);
    await runTest('Security - SQL Injection Attempt', testSignup_SQLInjectionAttempt);
    await runTest('Security - XSS Attempt', testSignup_XSSAttempt);

    console.log(`\n${colors.blue}📋 USERID GENERATION TESTS${colors.reset}`);
    await runTest('UserId - Format Check', testUserIdFormat);
    await runTest('UserId - Collision Handling', testUserIdCollision);

    // Print summary
    console.log(`\n${'='.repeat(60)}`);
    console.log(`${colors.yellow}📊 TEST SUMMARY${colors.reset}`);
    console.log(`${'='.repeat(60)}\n`);

    console.log(`${colors.green}✅ Passed: ${passedTests}${colors.reset}`);
    console.log(`${colors.red}❌ Failed: ${failedTests}${colors.reset}`);
    console.log(`Total: ${passedTests + failedTests}\n`);

    if (failedTests > 0) {
        console.log(`${colors.red}Failed Tests:${colors.reset}`);
        testResults
            .filter(r => r.status === 'FAILED')
            .forEach(r => console.log(`  - ${r.name}: ${r.error}`));
    }

    console.log(`\n${'='.repeat(60)}\n`);

    if (failedTests === 0) {
        console.log(`${colors.green}🎉 ALL TESTS PASSED! Code is ready for git push!${colors.reset}\n`);
    } else {
        console.log(`${colors.red}❌ Some tests failed. Please review and fix before pushing to git.${colors.reset}\n`);
    }

    process.exit(failedTests > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
    console.error(`${colors.red}Fatal error:${colors.reset}`, error);
    process.exit(1);
});
