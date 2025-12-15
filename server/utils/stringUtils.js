/**
 * Generate a unique user ID from name and random number
 * @param {string} name - User's name
 * @returns {string} Generated user ID (e.g., "johndoe123")
 */
function generateUserId(name) {
    const baseName = name.toLowerCase().replace(/\s+/g, '');
    const randomSuffix = Math.floor(Math.random() * 1000);
    return `${baseName}${randomSuffix}`;
}

/**
 * Generate a random alphanumeric string
 * @param {number} length - Length of the string (default: 8)
 * @returns {string} Random string
 */
function generateRandomString(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Sanitize string by removing special characters
 * @param {string} str - Input string
 * @returns {string} Sanitized string
 */
function sanitizeString(str) {
    return str.replace(/[^a-zA-Z0-9\s-_]/g, '');
}

/**
 * Convert string to slug format
 * @param {string} str - Input string
 * @returns {string} Slug (e.g., "hello-world")
 */
function slugify(str) {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Capitalize first letter of each word
 * @param {string} str - Input string
 * @returns {string} Capitalized string
 */
function capitalizeWords(str) {
    return str.replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Truncate string to specified length with ellipsis
 * @param {string} str - Input string
 * @param {number} maxLength - Maximum length (default: 50)
 * @returns {string} Truncated string
 */
function truncate(str, maxLength = 50) {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
}

module.exports = {
    generateUserId,
    generateRandomString,
    sanitizeString,
    slugify,
    capitalizeWords,
    truncate
};
