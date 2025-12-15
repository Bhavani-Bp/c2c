const express = require('express');
const router = express.Router();
const roomController = require('../controllers/room.controller');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * /api/rooms/public:
 *   get:
 *     summary: Get list of public rooms
 *     tags: [Rooms]
 *     parameters:
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
 *           default: 12
 *         description: Number of rooms per page
 *     responses:
 *       200:
 *         description: List of public rooms
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 rooms:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Room'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 */
router.get('/public', roomController.getPublicRooms);

/**
 * @swagger
 * /api/rooms/{roomId}:
 *   get:
 *     summary: Get room details by ID
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *     responses:
 *       200:
 *         description: Room details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 room:
 *                   $ref: '#/components/schemas/Room'
 *       404:
 *         description: Room not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:roomId', roomController.getRoomById);

/**
 * @swagger
 * /api/create-room:
 *   post:
 *     summary: Create a new room (legacy endpoint)
 *     tags: [Rooms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - creatorName
 *               - creatorEmail
 *             properties:
 *               creatorName:
 *                 type: string
 *                 example: John Doe
 *               creatorEmail:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               name:
 *                 type: string
 *                 example: Movie Night
 *               description:
 *                 type: string
 *                 example: Watch movies together
 *               isPublic:
 *                 type: boolean
 *                 default: true
 *               maxUsers:
 *                 type: integer
 *                 default: 10
 *     responses:
 *       200:
 *         description: Room created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 roomId:
 *                   type: string
 *                 room:
 *                   $ref: '#/components/schemas/Room'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/create-room', roomController.createRoom);

/**
 * @swagger
 * /api/join-room:
 *   post:
 *     summary: Join an existing room (legacy endpoint)
 *     tags: [Rooms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roomId
 *               - name
 *               - email
 *             properties:
 *               roomId:
 *                 type: string
 *                 example: room_123abc
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *     responses:
 *       200:
 *         description: Successfully joined room
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 room:
 *                   $ref: '#/components/schemas/Room'
 *       400:
 *         description: Room is full or invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/join-room', roomController.joinRoom);

/**
 * @swagger
 * /api/delete-room/{roomId}:
 *   post:
 *     summary: Delete a room (host only)
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID to delete
 *     responses:
 *       200:
 *         description: Room deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Only the host can delete the room
 *       404:
 *         description: Room not found
 */
router.post('/delete-room/:roomId', authenticateToken, roomController.deleteRoom);

/**
 * @swagger
 * /api/rooms/{roomId}/messages:
 *   get:
 *     summary: Get message history for a room
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of messages to fetch
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fetch messages before this timestamp (for pagination)
 *     responses:
 *       200:
 *         description: Message history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     messages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           content:
 *                             type: string
 *                           username:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     count:
 *                       type: integer
 *       404:
 *         description: Room not found
 */
router.get('/:roomId/messages', async (req, res) => {
    try {
        const { roomId } = req.params;
        const { limit = 100, before } = req.query;
        const prisma = require('../config/database');

        const messages = await prisma.message.findMany({
            where: {
                roomId,
                ...(before && { createdAt: { lt: new Date(before) } })
            },
            include: {
                user: {
                    select: {
                        name: true,
                        avatarUrl: true,
                        userId: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit)
        });

        res.json({
            success: true,
            data: {
                messages: messages.reverse().map(msg => ({
                    id: msg.id,
                    content: msg.content,
                    username: msg.user?.name || 'Guest',
                    avatarUrl: msg.user?.avatarUrl,
                    userId: msg.userId,
                    createdAt: msg.createdAt
                })),
                count: messages.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
