const authService = require('../services/auth.service');

class AuthController {
    /**
     * POST /api/auth/signup
     */
    async signup(req, res, next) {
        try {
            const { name, email, password, dateOfBirth } = req.body;

            if (!name || !email || !password) {
                return res.status(400).json({ error: 'Name, email, and password are required' });
            }

            const result = await authService.signup({ name, email, password, dateOfBirth });
            res.json({ success: true, ...result });
        } catch (error) {
            if (error.message === 'Email already registered') {
                return res.status(409).json({ error: error.message });
            }
            next(error);
        }
    }

    /**
     * POST /api/auth/login
     */
    async login(req, res, next) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required' });
            }

            const result = await authService.login({ email, password });
            res.json({ success: true, ...result });
        } catch (error) {
            if (error.requiresVerification) {
                return res.status(403).json({
                    error: 'Email not verified',
                    requiresVerification: true
                });
            }
            if (error.message === 'Invalid credentials') {
                return res.status(401).json({ error: error.message });
            }
            next(error);
        }
    }

    /**
     * POST /api/auth/verify-email
     */
    async verifyEmail(req, res, next) {
        try {
            const { email, code } = req.body;

            if (!email || !code) {
                return res.status(400).json({ error: 'Email and code are required' });
            }

            const result = await authService.verifyEmail({ email, code });
            res.json({ success: true, ...result });
        } catch (error) {
            if (error.message.includes('verification code')) {
                return res.status(400).json({ error: error.message });
            }
            next(error);
        }
    }

    /**
     * GET /api/auth/me - Get current user (protected)
     */
    async getCurrentUser(req, res, next) {
        try {
            const user = await authService.getCurrentUser(req.user.userId);
            res.json({ success: true, user });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AuthController();
