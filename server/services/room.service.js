const prisma = require('../config/database');

class RoomService {
    /**
     * Get Public Rooms with Pagination
     */
    async getPublicRooms(page = 1, limit = 12) {
        console.log('📋 ROOM SERVICE: Get public rooms', { page, limit });

        const skip = (page - 1) * limit;

        const totalRooms = await prisma.room.count({
            where: { isPublic: true }
        });

        const rooms = await prisma.room.findMany({
            where: { isPublic: true },
            take: limit,
            skip: skip,
            orderBy: { createdAt: 'desc' },
            include: {
                host: {
                    select: {
                        userId: true,
                        name: true,
                        avatarUrl: true
                    }
                },
                participants: {
                    select: {
                        userId: true
                    }
                }
            }
        });

        const formattedRooms = rooms.map(room => ({
            roomId: room.roomId,
            name: room.name || 'Untitled Room',
            description: room.description,
            hostUserId: room.hostUserId,
            hostName: room.host.name,
            hostAvatar: room.host.avatarUrl,
            participantCount: room.participants.length,
            maxUsers: room.maxUsers,
            currentVideoUrl: room.currentVideoUrl,
            isPlaying: room.isPlaying,
            createdAt: room.createdAt
        }));

        const totalPages = Math.ceil(totalRooms / limit);

        console.log(`✅ Found ${formattedRooms.length} public rooms (Page ${page}/${totalPages})`);

        return {
            rooms: formattedRooms,
            totalRooms,
            page,
            totalPages,
            hasMore: page < totalPages
        };
    }

    /**
     * Create Room
     */
    async createRoom({ hostUserId, name, description, isPublic, maxUsers }) {
        console.log('🚀 ROOM SERVICE: Create room', { hostUserId, name });

        // Generate unique room ID
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();

        const room = await prisma.room.create({
            data: {
                roomId,
                hostUserId,
                name,
                description,
                isPublic: isPublic !== false, // Default to true
                maxUsers: maxUsers || 10
            }
        });

        console.log('✅ Room created:', roomId);

        return room;
    }

    /**
     * Get Room by ID
     */
    async getRoomById(roomId) {
        const room = await prisma.room.findUnique({
            where: { roomId },
            include: {
                host: {
                    select: {
                        userId: true,
                        name: true,
                        avatarUrl: true
                    }
                },
                participants: {
                    include: {
                        user: {
                            select: {
                                userId: true,
                                name: true,
                                avatarUrl: true
                            }
                        }
                    }
                }
            }
        });

        if (!room) {
            throw new Error('Room not found');
        }

        return room;
    }

    /**
     * Join Room
     */
    async joinRoom(roomId, userId) {
        console.log('🚪 ROOM SERVICE: Join room', { roomId, userId });

        const room = await this.getRoomById(roomId);

        // Check if room is full
        if (room.participants.length >= room.maxUsers) {
            throw new Error('Room is full');
        }

        // Check if user already in room
        const existing = await prisma.roomParticipant.findUnique({
            where: {
                roomId_userId: {
                    roomId,
                    userId
                }
            }
        });

        if (existing) {
            console.log('⚠️  User already in room');
            return room;
        }

        // Add user to room
        await prisma.roomParticipant.create({
            data: {
                roomId,
                userId
            }
        });

        console.log('✅ User joined room');

        return await this.getRoomById(roomId);
    }

    /**
     * Delete Room (Manual - by host)
     */
    async deleteRoom(roomId, userId) {
        console.log('🗑️  ROOM SERVICE: Delete room', { roomId, userId });

        const room = await this.getRoomById(roomId);

        // Check if user is the host
        if (room.hostUserId !== userId) {
            throw new Error('Only the host can delete this room');
        }

        // Delete room (will cascade delete participants, invites, messages)
        await prisma.room.delete({
            where: { roomId }
        });

        console.log('✅ Room deleted:', roomId);

        return { success: true, message: 'Room deleted successfully' };
    }

    /**
     * Update Room Last Activity
     */
    async updateRoomActivity(roomId) {
        await prisma.room.update({
            where: { roomId },
            data: { lastActivityAt: new Date() }
        });
    }

    /**
     * Cleanup Empty Rooms (older than 10 minutes)
     */
    async cleanupEmptyRooms() {
        console.log('🧹 ROOM SERVICE: Running cleanup for empty rooms...');

        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

        // Find rooms with no active participants and last activity > 10 mins ago
        const emptyRooms = await prisma.room.findMany({
            where: {
                lastActivityAt: {
                    lt: tenMinutesAgo
                },
                participants: {
                    none: {}
                }
            },
            include: {
                participants: true
            }
        });

        if (emptyRooms.length === 0) {
            console.log('✅ No empty rooms to clean up');
            return { deleted: 0 };
        }

        // Delete all empty rooms
        const roomIds = emptyRooms.map(r => r.roomId);

        const result = await prisma.room.deleteMany({
            where: {
                roomId: {
                    in: roomIds
                }
            }
        });

        console.log(`✅ Cleaned up ${result.count} empty rooms:`, roomIds);

        return result;
    }
}

module.exports = new RoomService();
