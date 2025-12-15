const friendService = require('../services/friend.service');

class FriendController {
    /**
     * GET /api/friends/search?q=query&page=1&limit=20
     * Search for users
     */
    async searchUsers(req, res, next) {
        try {
            const { q: query, page = 1, limit = 20 } = req.query;
            const currentUserId = req.user.userId;

            if (!query) {
                return res.status(400).json({
                    success: false,
                    error: 'Search query is required'
                });
            }

            const result = await friendService.searchUsers(query, currentUserId, {
                page: parseInt(page),
                limit: parseInt(limit)
            });

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/friends/request
     * Send friend request
     */
    async sendFriendRequest(req, res, next) {
        try {
            const { receiverId } = req.body;
            const senderId = req.user.userId;

            if (!receiverId) {
                return res.status(400).json({
                    success: false,
                    error: 'receiverId is required'
                });
            }

            const connection = await friendService.sendFriendRequest(senderId, receiverId);

            // Emit Socket.IO event to receiver
            const io = req.app.get('io');
            if (io) {
                io.to(receiverId).emit('friend:request', {
                    requestId: connection.id,
                    from: connection.requester
                });
            }

            res.status(201).json({
                success: true,
                data: {
                    requestId: connection.id,
                    status: connection.status,
                    receiver: connection.addressee,
                    createdAt: connection.createdAt
                },
                message: 'Friend request sent successfully'
            });
        } catch (error) {
            if (error.message.includes('already')) {
                return res.status(409).json({
                    success: false,
                    error: error.message
                });
            }
            if (error.message === 'User not found') {
                return res.status(404).json({
                    success: false,
                    error: error.message
                });
            }
            next(error);
        }
    }

    /**
     * PUT /api/friends/request/:id/accept
     * Accept friend request
     */
    async acceptFriendRequest(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.userId;

            const connection = await friendService.acceptFriendRequest(id, userId);

            // Emit Socket.IO event to requester
            const io = req.app.get('io');
            if (io) {
                io.to(connection.requesterId).emit('friend:accepted', {
                    friend: connection.addressee
                });
            }

            res.json({
                success: true,
                data: {
                    friend: connection.requester
                },
                message: 'Friend request accepted'
            });
        } catch (error) {
            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    error: error.message
                });
            }
            if (error.message.includes('not authorized')) {
                return res.status(403).json({
                    success: false,
                    error: error.message
                });
            }
            next(error);
        }
    }

    /**
     * PUT /api/friends/request/:id/reject
     * Reject friend request
     */
    async rejectFriendRequest(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.userId;

            const result = await friendService.rejectFriendRequest(id, userId);

            res.json({
                success: true,
                data: result,
                message: 'Friend request rejected'
            });
        } catch (error) {
            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    error: error.message
                });
            }
            if (error.message.includes('not authorized')) {
                return res.status(403).json({
                    success: false,
                    error: error.message
                });
            }
            next(error);
        }
    }

    /**
     * DELETE /api/friends/request/:id
     * Cancel sent friend request
     */
    async cancelFriendRequest(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.userId;

            const result = await friendService.cancelFriendRequest(id, userId);

            res.json({
                success: true,
                data: result,
                message: 'Friend request cancelled'
            });
        } catch (error) {
            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    error: error.message
                });
            }
            if (error.message.includes('not authorized')) {
                return res.status(403).json({
                    success: false,
                    error: error.message
                });
            }
            next(error);
        }
    }

    /**
     * GET /api/friends
     * Get list of friends
     */
    async getFriendsList(req, res, next) {
        try {
            const userId = req.user.userId;

            const friends = await friendService.getFriendsList(userId);

            res.json({
                success: true,
                data: {
                    friends,
                    count: friends.length
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/friends/:friendId
     * Remove friend
     */
    async removeFriend(req, res, next) {
        try {
            const { friendId } = req.params;
            const userId = req.user.userId;

            const result = await friendService.removeFriend(userId, friendId);

            res.json({
                success: true,
                data: result,
                message: 'Friend removed successfully'
            });
        } catch (error) {
            if (error.message === 'Friendship not found') {
                return res.status(404).json({
                    success: false,
                    error: error.message
                });
            }
            next(error);
        }
    }

    /**
     * GET /api/friends/requests/pending
     * Get pending friend requests received
     */
    async getPendingRequests(req, res, next) {
        try {
            const userId = req.user.userId;

            const requests = await friendService.getPendingRequests(userId);

            res.json({
                success: true,
                data: {
                    requests,
                    count: requests.length
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/friends/requests/sent
     * Get sent friend requests
     */
    async getSentRequests(req, res, next) {
        try {
            const userId = req.user.userId;

            const requests = await friendService.getSentRequests(userId);

            res.json({
                success: true,
                data: {
                    requests,
                    count: requests.length
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/friends/suggestions
     * Get friend suggestions
     */
    async getFriendSuggestions(req, res, next) {
        try {
            const userId = req.user.userId;
            const { limit = 10 } = req.query;

            const suggestions = await friendService.getFriendSuggestions(userId, parseInt(limit));

            res.json({
                success: true,
                data: {
                    suggestions,
                    count: suggestions.length
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new FriendController();
