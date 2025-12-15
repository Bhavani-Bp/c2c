/**
 * Levenshtein Distance Algorithm
 * Calculates the minimum number of single-character edits (insertions, deletions, substitutions)
 * required to change one string into another
 * 
 * Time Complexity: O(m * n) where m and n are string lengths
 * Space Complexity: O(m * n)
 * 
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Edit distance between strings
 */
function levenshteinDistance(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;

    // Create 2D array for dynamic programming
    const dp = Array(len1 + 1)
        .fill(null)
        .map(() => Array(len2 + 1).fill(0));

    // Initialize first column (transform str1 to empty string)
    for (let i = 0; i <= len1; i++) {
        dp[i][0] = i;
    }

    // Initialize first row (transform empty string to str2)
    for (let j = 0; j <= len2; j++) {
        dp[0][j] = j;
    }

    // Fill the dp table
    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                // Characters match, no operation needed
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                // Take minimum of three operations
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,      // Deletion
                    dp[i][j - 1] + 1,      // Insertion
                    dp[i - 1][j - 1] + 1   // Substitution
                );
            }
        }
    }

    return dp[len1][len2];
}

/**
 * Check if two strings are similar within a tolerance
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @param {number} maxDistance - Maximum allowed edit distance (default: 2)
 * @returns {boolean} True if strings are similar
 */
function isSimilar(str1, str2, maxDistance = 2) {
    const distance = levenshteinDistance(
        str1.toLowerCase(),
        str2.toLowerCase()
    );
    return distance <= maxDistance;
}

/**
 * Normalize search query
 * @param {string} query - Search query
 * @returns {string} Normalized query (lowercase, trimmed)
 */
function normalizeSearchQuery(query) {
    if (!query || typeof query !== 'string') return '';

    return query
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' '); // Replace multiple spaces with single space
}

/**
 * Calculate similarity score between query and text (0-100)
 * Higher score = more similar
 * 
 * @param {string} query - Search query
 * @param {string} text - Text to compare
 * @returns {number} Similarity score (0-100)
 */
function calculateSimilarityScore(query, text) {
    const normalizedQuery = normalizeSearchQuery(query);
    const normalizedText = text.toLowerCase();

    // Exact match
    if (normalizedText === normalizedQuery) return 100;

    // Starts with query
    if (normalizedText.startsWith(normalizedQuery)) return 90;

    // Contains query
    if (normalizedText.includes(normalizedQuery)) return 70;

    // Fuzzy match using Levenshtein distance
    const distance = levenshteinDistance(normalizedQuery, normalizedText);
    const maxLength = Math.max(normalizedQuery.length, normalizedText.length);

    if (maxLength === 0) return 0;

    // Convert distance to similarity percentage
    const similarity = ((maxLength - distance) / maxLength) * 100;

    return Math.max(0, similarity);
}

/**
 * Rank and sort search results by relevance
 * @param {Array} results - Array of search results with 'name' field
 * @param {string} query - Search query
 * @returns {Array} Sorted results by relevance
 */
function rankResults(results, query) {
    const normalizedQuery = normalizeSearchQuery(query);

    return results
        .map(result => ({
            ...result,
            _score: calculateSimilarityScore(normalizedQuery, result.name)
        }))
        .filter(result => result._score >= 30) // Filter out low-relevance results
        .sort((a, b) => b._score - a._score) // Sort by score descending
        .map(({ _score, ...result }) => result); // Remove score from final results
}

/**
 * Highlight matching parts of text for UI display
 * Returns indices where the query matches in the text
 * 
 * @param {string} text - Text to search in
 * @param {string} query - Query to find
 * @returns {Array<{start: number, end: number}>} Match positions
 */
function highlightMatch(text, query) {
    const normalizedText = text.toLowerCase();
    const normalizedQuery = normalizeSearchQuery(query);

    const matches = [];
    let startIndex = 0;

    while (startIndex < normalizedText.length) {
        const index = normalizedText.indexOf(normalizedQuery, startIndex);
        if (index === -1) break;

        matches.push({
            start: index,
            end: index + normalizedQuery.length
        });

        startIndex = index + normalizedQuery.length;
    }

    return matches;
}

/**
 * Generate search name from user's full name
 * Used to populate searchName field in database
 * 
 * @param {string} name - User's full name
 * @returns {string} Lowercase search-optimized name
 */
function generateSearchName(name) {
    if (!name) return '';
    return name.toLowerCase().trim();
}

module.exports = {
    levenshteinDistance,
    isSimilar,
    normalizeSearchQuery,
    calculateSimilarityScore,
    rankResults,
    highlightMatch,
    generateSearchName
};
