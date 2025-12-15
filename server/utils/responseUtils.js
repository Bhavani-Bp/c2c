/**
 * Format success response
 * @param {Object} data - Response data
 * @param {string} message - Optional success message
 * @returns {Object} Formatted success response
 */
function successResponse(data, message = 'Success') {
    return {
        success: true,
        message,
        data
    };
}

/**
 * Format error response
 * @param {string} error - Error message
 * @param {number} statusCode - HTTP status code (optional)
 * @returns {Object} Formatted error response
 */
function errorResponse(error, statusCode = 500) {
    return {
        success: false,
        error,
        statusCode
    };
}

/**
 * Format paginated response
 * @param {Array} items - Array of items
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @returns {Object} Formatted paginated response
 */
function paginatedResponse(items, page, limit, total) {
    const totalPages = Math.ceil(total / limit);

    return {
        success: true,
        data: items,
        pagination: {
            currentPage: page,
            itemsPerPage: limit,
            totalItems: total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
        }
    };
}

/**
 * Format validation error response
 * @param {Array} errors - Array of validation error messages
 * @returns {Object} Formatted validation error response
 */
function validationErrorResponse(errors) {
    return {
        success: false,
        error: 'Validation failed',
        validationErrors: errors
    };
}

/**
 * Format authentication error response
 * @param {string} message - Error message (default: 'Authentication required')
 * @returns {Object} Formatted auth error response
 */
function authErrorResponse(message = 'Authentication required') {
    return {
        success: false,
        error: message,
        statusCode: 401
    };
}

module.exports = {
    successResponse,
    errorResponse,
    paginatedResponse,
    validationErrorResponse,
    authErrorResponse
};
