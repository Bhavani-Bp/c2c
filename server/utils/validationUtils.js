/**
 * Validate email format using regex
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @param {Object} options - Validation options
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validatePassword(password, options = {}) {
    const {
        minLength = 8,
        requireUppercase = true,
        requireLowercase = true,
        requireNumbers = true,
        requireSpecialChars = false
    } = options;

    const errors = [];

    if (password.length < minLength) {
        errors.push(`Password must be at least ${minLength} characters long`);
    }

    if (requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    if (requireLowercase && !/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    if (requireNumbers && !/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate room code format
 * @param {string} roomCode - Room code to validate
 * @returns {boolean} True if valid room code (alphanumeric, 6-10 chars)
 */
function isValidRoomCode(roomCode) {
    const roomCodeRegex = /^[A-Za-z0-9]{6,10}$/;
    return roomCodeRegex.test(roomCode);
}

/**
 * Validate username format
 * @param {string} username - Username to validate
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateUsername(username) {
    if (!username || username.trim().length === 0) {
        return { valid: false, error: 'Username is required' };
    }

    if (username.length < 3) {
        return { valid: false, error: 'Username must be at least 3 characters' };
    }

    if (username.length > 30) {
        return { valid: false, error: 'Username must not exceed 30 characters' };
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        return { valid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
    }

    return { valid: true };
}

/**
 * Sanitize user input to prevent XSS
 * @param {string} input - User input to sanitize
 * @returns {string} Sanitized input
 */
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;

    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Validate date of birth (must be at least 13 years old)
 * @param {string|Date} dateOfBirth - Date of birth to validate
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateDateOfBirth(dateOfBirth) {
    const date = new Date(dateOfBirth);

    if (isNaN(date.getTime())) {
        return { valid: false, error: 'Invalid date format' };
    }

    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    const dayDiff = today.getDate() - date.getDate();

    const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

    if (actualAge < 13) {
        return { valid: false, error: 'You must be at least 13 years old' };
    }

    if (actualAge > 120) {
        return { valid: false, error: 'Invalid date of birth' };
    }

    return { valid: true };
}

module.exports = {
    isValidEmail,
    validatePassword,
    isValidRoomCode,
    validateUsername,
    sanitizeInput,
    validateDateOfBirth
};
