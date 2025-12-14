const prisma = require('../config/database');

class UserService {
    /**
     * Update User Profile
     */
    async updateProfile(userId, { bio, avatarUrl, interests, dateOfBirth }) {
        console.log('📝 USER SERVICE: Update profile', { userId });

        const updateData = {};
        if (bio !== undefined) updateData.bio = bio;
        if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
        if (interests !== undefined) updateData.interests = interests;
        if (dateOfBirth !== undefined) updateData.dateOfBirth = new Date(dateOfBirth);

        const user = await prisma.user.update({
            where: { userId },
            data: updateData,
            select: {
                userId: true,
                name: true,
                email: true,
                avatarUrl: true,
                bio: true,
                interests: true,
                dateOfBirth: true,
                isVerified: true,
                createdAt: true
            }
        });

        console.log('✅ Profile updated successfully:', userId);

        return user;
    }

    /**
     * Get User by ID
     */
    async getUserById(userId) {
        const user = await prisma.user.findUnique({
            where: { userId },
            select: {
                userId: true,
                name: true,
                email: true,
                avatarUrl: true,
                bio: true,
                interests: true,
                isVerified: true,
                createdAt: true
            }
        });

        if (!user) {
            throw new Error('User not found');
        }

        return user;
    }
}

module.exports = new UserService();
