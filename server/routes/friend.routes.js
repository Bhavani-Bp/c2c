const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friend.controller');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/friends/search:
 *   get:
 *     summary: Search for users
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query (name or email)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Results per page
 *     responses:
 *       200:
 *         description: Search results
 *       400:
 *         description: Missing search query
 *       401:
 *         description: Unauthorized
 */
router.get('/search', friendController.searchUsers);

/**
 * @swagger
 * /api/friends/request:
 *   post:
 *     summary: Send friend request
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiverId
 *             properties:
 *               receiverId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Friend request sent
 *       400:
 *         description: Invalid request
 *       404:
 *         description: User not found
 *       409:
 *         description: Already friends or request pending
 */
router.post('/request', friendController.sendFriendRequest);

/**
 * @swagger
 * /api/friends/request/{id}/accept:
 *   put:
 *     summary: Accept friend request
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Request ID
 *     responses:
 *       200:
 *         description: Request accepted
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Request not found
 */
router.put('/request/:id/accept', friendController.acceptFriendRequest);

/**
 * @swagger
 * /api/friends/request/{id}/reject:
 *   put:
 *     summary: Reject friend request
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Request ID
 *     responses:
 *       200:
 *         description: Request rejected
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Request not found
 */
router.put('/request/:id/reject', friendController.rejectFriendRequest);

/**
 * @swagger
 * /api/friends/request/{id}:
 *   delete:
 *     summary: Cancel sent friend request
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Request ID
 *     responses:
 *       200:
 *         description: Request cancelled
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Request not found
 */
router.delete('/request/:id', friendController.cancelFriendRequest);

/**
 * @swagger
 * /api/friends:
 *   get:
 *     summary: Get list of friends
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Friends list
 */
router.get('/', friendController.getFriendsList);

/**
 * @swagger
 * /api/friends/{friendId}:
 *   delete:
 *     summary: Remove friend
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: friendId
 *         required: true
 *         schema:
 *           type: string
 *         description: Friend user ID
 *     responses:
 *       200:
 *         description: Friend removed
 *       404:
 *         description: Friendship not found
 */
router.delete('/:friendId', friendController.removeFriend);

/**
 * @swagger
 * /api/friends/requests/pending:
 *   get:
 *     summary: Get pending friend requests received
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending requests
 */
router.get('/requests/pending', friendController.getPendingRequests);

/**
 * @swagger
 * /api/friends/requests/sent:
 *   get:
 *     summary: Get sent friend requests
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sent requests
 */
router.get('/requests/sent', friendController.getSentRequests);

/**
 * @swagger
 * /api/friends/suggestions:
 *   get:
 *     summary: Get friend suggestions
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of suggestions
 *     responses:
 *       200:
 *         description: Friend suggestions
 */
router.get('/suggestions', friendController.getFriendSuggestions);

module.exports = router;
