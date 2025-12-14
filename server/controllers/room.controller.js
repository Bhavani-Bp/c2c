const roomService = require('../services/room.service');

class RoomController {
    /**
     * GET /api/rooms/public - Get public rooms
     */
    async getPublicRooms(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 12;

            const result = await roomService.getPublicRooms(page, limit);
            res.json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/create-room - Create room (keeping old endpoint for compatibility)
     */
    async createRoom(req, res, next) {
        try {
            const { creatorName, creatorEmail, name, description, isPublic, maxUsers } = req.body;

            if (!creatorName || !creatorEmail) {
                return res.status(400).json({ error: 'Name and email are required' });
            }

            // Find or create user
            const prisma = require('../config/database');
            let user = await prisma.user.findUnique({ where: { email: creatorEmail } });

            if (!user) {
                user = await prisma.user.create({
                    data: {
                        userId: `temp_${Date.now()}`,
                        name: creatorName,
                        email: creatorEmail,
                        passwordHash: '',
                        isVerified: false
                    }
                });
            }

            const room = await roomService.createRoom({
                hostUserId: user.userId,
                name,
                description,
                isPublic,
                maxUsers
            });

            res.json({ success: true, roomId: room.roomId, room });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/rooms/:roomId - Get room by ID
     */
    async getRoomById(req, res, next) {
        try {
            const { roomId } = req.params;
            const room = await roomService.getRoomById(roomId);
            res.json({ success: true, room });
        } catch (error) {
            if (error.message === 'Room not found') {
                return res.status(404).json({ error: error.message });
            }
            next(error);
        }
    }

    /**
     * POST /api/join-room - Join room
     */
    async joinRoom(req, res, next) {
        try {
            const { roomId, name, email } = req.body;

            if (!roomId || !name || !email) {
                return res.status(400).json({ error: 'Room ID, name, and email are required' });
            }

            // Find or create user
            const prisma = require('../config/database');
            let user = await prisma.user.findUnique({ where: { email } });

            if (!user) {
                user = await prisma.user.create({
                    data: {
                        userId: `guest_${Date.now()}`,
                        name,
                        email,
                        passwordHash: '',
                        isVerified: false
                    }
                });
            }

            const room = await roomService.joinRoom(roomId, user.userId);
            res.json({ success: true, room });
        } catch (error) {
            if (error.message === 'Room is full') {
                return res.status(400).json({ error: error.message });
            }
            next(error);
        }
    }

    /**
     * DELETE /api/rooms/:roomId - Delete room (host only)
     */
    async deleteRoom(req, res, next) {
        try {
            const { roomId } = req.params;
            const userId = req.user?.userId; // Assumes auth middleware adds user to req

            if (!userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            const result = await roomService.deleteRoom(roomId, userId);
            res.json(result);
        } catch (error) {
            if (error.message === 'Only the host can delete this room') {
                return res.status(403).json({ error: error.message });
            }
            if (error.message === 'Room not found') {
                return res.status(404).json({ error: error.message });
            }
            next(error);
        }
    }
}

module.exports = new RoomController();
