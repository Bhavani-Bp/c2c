// Update User Profile API
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
    console.log('📝 UPDATE PROFILE API CALLED:', { userId: req.user.userId });
    const { bio, avatarUrl, interests, dateOfBirth } = req.body;

    try {
        // Build update object (only include fields that are provided)
        const updateData = {};
        if (bio !== undefined) updateData.bio = bio;
        if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
        if (interests !== undefined) updateData.interests = interests;
        if (dateOfBirth !== undefined) updateData.dateOfBirth = new Date(dateOfBirth);

        // Update user in database
        const user = await prisma.user.update({
            where: { userId: req.user.userId },
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

        console.log('✅ Profile updated successfully:', { userId: user.userId });

        res.json({ success: true, user });
    } catch (error) {
        console.error('❌ UPDATE PROFILE ERROR:', error);
        res.status(500).json({ error: 'Server error during profile update' });
    }
});

// Get Public Rooms API
app.get('/api/rooms/public', async (req, res) => {
    console.log('📋 GET PUBLIC ROOMS API CALLED');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    try {
        // Get total count of public rooms
        const totalRooms = await prisma.room.count({
            where: { isPublic: true }
        });

        // Get public rooms with host info and participant count
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

        // Format response
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

        res.json({
            success: true,
            rooms: formattedRooms,
            totalRooms,
            page,
            totalPages,
            hasMore: page < totalPages
        });
    } catch (error) {
        console.error('❌ GET PUBLIC ROOMS ERROR:', error);
        res.status(500).json({ error: 'Server error fetching rooms' });
    }
});

