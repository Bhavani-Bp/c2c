const userService = require('../services/user.service');

class UserController {
    /**
     * PUT /api/auth/profile - Update user profile (protected)
     */
    async updateProfile(req, res, next) {
        try {
            const { bio, avatarUrl, interests, dateOfBirth } = req.body;

            const user = await userService.updateProfile(req.user.userId, {
                bio,
                avatarUrl,
                interests,
                dateOfBirth
            });

            res.json({ success: true, user });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/users/:userId - Get user by ID
     */
    async getUserById(req, res, next) {
        try {
            const { userId } = req.params;
            const user = await userService.getUserById(userId);
            res.json({ success: true, user });
        } catch (error) {
            if (error.message === 'User not found') {
                return res.status(404).json({ error: error.message });
            }
            next(error);
        }
    }
}

module.exports = new UserController();
