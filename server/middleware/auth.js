const jwt = require('jsonwebtoken');

/**
 * JWT Authentication Middleware
 * Verifies JWT token from Authorization header
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log('❌ Token verification failed:', err.message);
            return res.status(403).json({ error: 'Invalid or expired token' });
        }

        req.user = user; // Attach user info to request
        next();
    });
};

module.exports = { authenticateToken };
