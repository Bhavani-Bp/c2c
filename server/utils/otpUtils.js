/**
 * Generate a random 6-digit OTP code
 * @returns {string} 6-digit OTP code
 */
function generateOTP() {
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp.toString();
}

/**
 * Generate a random OTP code with custom length
 * @param {number} length - Length of OTP (default: 6)
 * @returns {string} OTP code
 */
function generateCustomOTP(length = 6) {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    const otp = Math.floor(min + Math.random() * (max - min + 1));
    return otp.toString();
}

/**
 * Create OTP verification object with expiration
 * @param {string} code - OTP code
 * @param {number} expiryMinutes - Minutes until expiration (default: 10)
 * @returns {Object} Verification object with code and expiry timestamp
 */
function createOTPVerification(code, expiryMinutes = 10) {
    return {
        code,
        expiresAt: Date.now() + (expiryMinutes * 60 * 1000)
    };
}

/**
 * Check if OTP has expired
 * @param {number} expiresAt - Expiration timestamp
 * @returns {boolean} True if expired, false otherwise
 */
function isOTPExpired(expiresAt) {
    return expiresAt < Date.now();
}

/**
 * Verify OTP code matches and is not expired
 * @param {Object} verification - Verification object with code and expiresAt
 * @param {string} inputCode - Code to verify
 * @returns {Object} { valid: boolean, reason?: string }
 */
function verifyOTP(verification, inputCode) {
    if (!verification) {
        return { valid: false, reason: 'No verification code found' };
    }

    if (isOTPExpired(verification.expiresAt)) {
        return { valid: false, reason: 'Verification code expired' };
    }

    if (verification.code !== inputCode) {
        return { valid: false, reason: 'Invalid verification code' };
    }

    return { valid: true };
}

module.exports = {
    generateOTP,
    generateCustomOTP,
    createOTPVerification,
    isOTPExpired,
    verifyOTP
};
