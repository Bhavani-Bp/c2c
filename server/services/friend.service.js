const prisma = require('../config/database');
const { normalizeSearchQuery, rankResults, generateSearchName } = require('../utils/searchUtils');

class FriendService {
    /**
     * Search for users by name or email
     * Excludes current user, already friends, and applies fuzzy matching
     * 
     * @param {string} query - Search query
     * @param {string} currentUserId - ID of the user performing search
     * @param {Object} options - Pagination and filter options
     * @returns {Object} Search results with pagination
     */
    async searchUsers(query, currentUserId, options = {}) {
        const { page = 1, limit = 20, excludeFriends = true } = options;
        const normalizedQuery = normalizeSearchQuery(query);

        if (!normalizedQuery || normalizedQuery.length < 2) {
            return {
                users: [],
                pagination: {
                    currentPage: page,
                    totalPages: 0,
                    totalResults: 0,
                    hasNextPage: false,
                    hasPreviousPage: false
                }
            };
        }

        // Get user's friend IDs if we need to exclude them
        let friendIds = [];
        if (excludeFriends) {
            const connections = await prisma.connection.findMany({
                where: {
                    OR: [
                        { requesterId: currentUserId, status: 'ACCEPTED' },
                        { addresseeId: currentUserId, status: 'ACCEPTED' }
                    ]
                },
                select: {
                    requesterId: true,
                    addresseeId: true
                }
            });

            friendIds = connections.map(conn =>
                conn.requesterId === currentUserId ? conn.addresseeId : conn.requesterId
            );
        }

        // Search in database with optimized query
        const users = await prisma.user.findMany({
            where: {
                AND: [
                    {
                        userId: {
                            not: currentUserId // Exclude current user
                        }
                    },
                    {
                        userId: {
                            notIn: friendIds // Exclude friends
                        }
                    },
                    {
                        OR: [
                            {
                                searchName: {
                                    contains: normalizedQuery,
                                    mode: 'insensitive'
                                }
                            },
                            {
                                name: {
                                    contains: normalizedQuery,
                                    mode: 'insensitive'
                                }
                            },
                            {
                                email: {
                                    contains: normalizedQuery,
                                    mode: 'insensitive'
                                }
                            }
                        ]
                    }
                ]
            },
            select: {
                userId: true,
                name: true,
                email: true,
                avatarUrl: true,
                bio: true,
                interests: true,
                createdAt: true
            },
            take: limit * 2 // Get more results for fuzzy filtering
        });

        // Apply fuzzy matching and ranking
        const rankedUsers = rankResults(users, query);

        // Get friendship status for each user
        const usersWithStatus = await Promise.all(
            rankedUsers.slice(0, limit).map(async (user) => {
                const friendshipStatus = await this.getFriendshipStatus(currentUserId, user.userId);
                const mutualFriends = await this.getMutualFriendsCount(currentUserId, user.userId);

                return {
                    ...user,
                    friendshipStatus,
                    mutualFriends
                };
            })
        );

        // Calculate pagination
        const totalResults = rankedUsers.length;
        const totalPages = Math.ceil(totalResults / limit);

        return {
            users: usersWithStatus,
            pagination: {
                currentPage: page,
                totalPages,
                totalResults,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            }
        };
    }

    /**
     * Get friendship status between two users
     * @param {string} userId1 - First user ID
     * @param {string} userId2 - Second user ID
     * @returns {string} Status: NOT_FRIENDS, PENDING_SENT, PENDING_RECEIVED, FRIENDS, BLOCKED
     */
    async getFriendshipStatus(userId1, userId2) {
        const connection = await prisma.connection.findFirst({
            where: {
                OR: [
                    { requesterId: userId1, addresseeId: userId2 },
                    { requesterId: userId2, addresseeId: userId1 }
                ]
            }
        });

        if (!connection) return 'NOT_FRIENDS';

        if (connection.status === 'ACCEPTED') return 'FRIENDS';
        if (connection.status === 'BLOCKED') return 'BLOCKED';
        if (connection.status === 'REJECTED') return 'NOT_FRIENDS';

        // Pending request
        if (connection.requesterId === userId1) return 'PENDING_SENT';
        return 'PENDING_RECEIVED';
    }

    /**
     * Send friend request
     * @param {string} senderId - User sending the request
     * @param {string} receiverId - User receiving the request
     * @returns {Object} Created connection request
     */
    async sendFriendRequest(senderId, receiverId) {
        // Validation
        if (senderId === receiverId) {
            throw new Error('Cannot send friend request to yourself');
        }

        // Check if receiver exists
        const receiver = await prisma.user.findUnique({
            where: { userId: receiverId },
            select: { userId: true, name: true, email: true, avatarUrl: true }
        });

        if (!receiver) {
            throw new Error('User not found');
        }

        // Check for existing connection
        const existingConnection = await prisma.connection.findFirst({
            where: {
                OR: [
                    { requesterId: senderId, addresseeId: receiverId },
                    { requesterId: receiverId, addresseeId: senderId }
                ]
            }
        });

        if (existingConnection) {
            if (existingConnection.status === 'ACCEPTED') {
                throw new Error('You are already friends with this user');
            }
            if (existingConnection.status === 'PENDING') {
                throw new Error('Friend request already sent');
            }
            if (existingConnection.status === 'BLOCKED') {
                throw new Error('Cannot send friend request to this user');
            }
        }

        // Create friend request
        const connection = await prisma.connection.create({
            data: {
                requesterId: senderId,
                addresseeId: receiverId,
                status: 'PENDING'
            },
            include: {
                requester: {
                    select: {
                        userId: true,
                        name: true,
                        email: true,
                        avatarUrl: true
                    }
                },
                addressee: {
                    select: {
                        userId: true,
                        name: true,
                        email: true,
                        avatarUrl: true
                    }
                }
            }
        });

        console.log(`✅ Friend request sent: ${senderId} → ${receiverId}`);

        return connection;
    }

    /**
     * Accept friend request
     * @param {string} connectionId - ID of the connection request
     * @param {string} userId - ID of user accepting (must be addressee)
     * @returns {Object} Updated connection
     */
    async acceptFriendRequest(connectionId, userId) {
        const connection = await prisma.connection.findUnique({
            where: { id: parseInt(connectionId) },
            include: {
                requester: {
                    select: {
                        userId: true,
                        name: true,
                        email: true,
                        avatarUrl: true
                    }
                },
                addressee: {
                    select: {
                        userId: true,
                        name: true,
                        email: true,
                        avatarUrl: true
                    }
                }
            }
        });

        if (!connection) {
            throw new Error('Friend request not found');
        }

        if (connection.addresseeId !== userId) {
            throw new Error('You are not authorized to accept this request');
        }

        if (connection.status !== 'PENDING') {
            throw new Error('This request has already been processed');
        }

        // Update status to ACCEPTED
        const updatedConnection = await prisma.connection.update({
            where: { id: parseInt(connectionId) },
            data: { status: 'ACCEPTED' },
            include: {
                requester: {
                    select: {
                        userId: true,
                        name: true,
                        email: true,
                        avatarUrl: true
                    }
                },
                addressee: {
                    select: {
                        userId: true,
                        name: true,
                        email: true,
                        avatarUrl: true
                    }
                }
            }
        });

        console.log(`✅ Friend request accepted: ${connection.requesterId} ↔ ${connection.addresseeId}`);

        return updatedConnection;
    }

    /**
     * Reject friend request
     * @param {string} connectionId - ID of the connection request
     * @param {string} userId - ID of user rejecting (must be addressee)
     * @returns {Object} Result
     */
    async rejectFriendRequest(connectionId, userId) {
        const connection = await prisma.connection.findUnique({
            where: { id: parseInt(connectionId) }
        });

        if (!connection) {
            throw new Error('Friend request not found');
        }

        if (connection.addresseeId !== userId) {
            throw new Error('You are not authorized to reject this request');
        }

        if (connection.status !== 'PENDING') {
            throw new Error('This request has already been processed');
        }

        // Delete the request instead of updating status
        await prisma.connection.delete({
            where: { id: parseInt(connectionId) }
        });

        console.log(`❌ Friend request rejected: ${connection.requesterId} → ${connection.addresseeId}`);

        return { success: true, message: 'Friend request rejected' };
    }

    /**
     * Cancel sent friend request
     * @param {string} connectionId - ID of the connection request
     * @param {string} userId - ID of user cancelling (must be requester)
     * @returns {Object} Result
     */
    async cancelFriendRequest(connectionId, userId) {
        const connection = await prisma.connection.findUnique({
            where: { id: parseInt(connectionId) }
        });

        if (!connection) {
            throw new Error('Friend request not found');
        }

        if (connection.requesterId !== userId) {
            throw new Error('You are not authorized to cancel this request');
        }

        if (connection.status !== 'PENDING') {
            throw new Error('This request has already been processed');
        }

        // Delete the request
        await prisma.connection.delete({
            where: { id: parseInt(connectionId) }
        });

        console.log(`🚫 Friend request cancelled: ${connection.requesterId} → ${connection.addresseeId}`);

        return { success: true, message: 'Friend request cancelled' };
    }

    /**
     * Get list of friends for a user
     * @param {string} userId - User ID
     * @returns {Array} List of friends
     */
    async getFriendsList(userId) {
        const connections = await prisma.connection.findMany({
            where: {
                OR: [
                    { requesterId: userId, status: 'ACCEPTED' },
                    { addresseeId: userId, status: 'ACCEPTED' }
                ]
            },
            include: {
                requester: {
                    select: {
                        userId: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                        bio: true,
                        interests: true
                    }
                },
                addressee: {
                    select: {
                        userId: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                        bio: true,
                        interests: true
                    }
                }
            }
        });

        // Extract friend data (the other user in each connection)
        const friends = connections.map(conn => {
            return conn.requesterId === userId ? conn.addressee : conn.requester;
        });

        return friends;
    }

    /**
     * Remove friend (delete connection)
     * @param {string} userId - Current user ID
     * @param {string} friendId - Friend to remove
     * @returns {Object} Result
     */
    async removeFriend(userId, friendId) {
        const connection = await prisma.connection.findFirst({
            where: {
                OR: [
                    { requesterId: userId, addresseeId: friendId, status: 'ACCEPTED' },
                    { requesterId: friendId, addresseeId: userId, status: 'ACCEPTED' }
                ]
            }
        });

        if (!connection) {
            throw new Error('Friendship not found');
        }

        await prisma.connection.delete({
            where: { id: connection.id }
        });

        console.log(`💔 Friendship removed: ${userId} ↔ ${friendId}`);

        return { success: true, message: 'Friend removed successfully' };
    }

    /**
     * Get pending friend requests received
     * @param {string} userId - User ID
     * @returns {Array} Pending requests
     */
    async getPendingRequests(userId) {
        const requests = await prisma.connection.findMany({
            where: {
                addresseeId: userId,
                status: 'PENDING'
            },
            include: {
                requester: {
                    select: {
                        userId: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                        bio: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return requests.map(req => ({
            requestId: req.id,
            from: req.requester,
            createdAt: req.createdAt
        }));
    }

    /**
     * Get sent friend requests
     * @param {string} userId - User ID
     * @returns {Array} Sent requests
     */
    async getSentRequests(userId) {
        const requests = await prisma.connection.findMany({
            where: {
                requesterId: userId,
                status: 'PENDING'
            },
            include: {
                addressee: {
                    select: {
                        userId: true,
                        name: true,
                        email: true,
                        avatarUrl: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return requests.map(req => ({
            requestId: req.id,
            to: req.addressee,
            createdAt: req.createdAt
        }));
    }

    /**
     * Get mutual friends count between two users
     * @param {string} userId1 - First user ID
     * @param {string} userId2 - Second user ID
     * @returns {number} Count of mutual friends
     */
    async getMutualFriendsCount(userId1, userId2) {
        const user1Friends = await this.getFriendsList(userId1);
        const user2Friends = await this.getFriendsList(userId2);

        const user1FriendIds = new Set(user1Friends.map(f => f.userId));
        const mutualCount = user2Friends.filter(f => user1FriendIds.has(f.userId)).length;

        return mutualCount;
    }

    /**
     * Get friend suggestions based on mutual friends
     * @param {string} userId - User ID
     * @param {number} limit - Number of suggestions (default: 10)
     * @returns {Array} Suggested users
     */
    async getFriendSuggestions(userId, limit = 10) {
        // Get user's friends
        const friends = await this.getFriendsList(userId);
        const friendIds = friends.map(f => f.userId);

        if (friendIds.length === 0) {
            // No friends yet, return random users
            return await prisma.user.findMany({
                where: {
                    userId: { not: userId }
                },
                select: {
                    userId: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                    bio: true
                },
                take: limit
            });
        }

        // Find friends of friends
        const suggestions = await prisma.connection.findMany({
            where: {
                OR: [
                    { requesterId: { in: friendIds }, status: 'ACCEPTED' },
                    { addresseeId: { in: friendIds }, status: 'ACCEPTED' }
                ]
            },
            include: {
                requester: {
                    select: {
                        userId: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                        bio: true
                    }
                },
                addressee: {
                    select: {
                        userId: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                        bio: true
                    }
                }
            },
            take: limit * 3 // Get more for filtering
        });

        // Extract unique users who are not already friends
        const suggestedUsers = new Map();

        for (const conn of suggestions) {
            const suggestedUser = conn.requesterId !== userId && !friendIds.includes(conn.requesterId)
                ? conn.requester
                : conn.addresseeId !== userId && !friendIds.includes(conn.addresseeId)
                    ? conn.addressee
                    : null;

            if (suggestedUser && suggestedUser.userId !== userId) {
                if (!suggestedUsers.has(suggestedUser.userId)) {
                    suggestedUsers.set(suggestedUser.userId, {
                        ...suggestedUser,
                        mutualFriends: 1
                    });
                } else {
                    const existing = suggestedUsers.get(suggestedUser.userId);
                    existing.mutualFriends++;
                }
            }
        }

        // Sort by mutual friends count and limit
        return Array.from(suggestedUsers.values())
            .sort((a, b) => b.mutualFriends - a.mutualFriends)
            .slice(0, limit);
    }
}

module.exports = new FriendService();
