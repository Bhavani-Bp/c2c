require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

// Import configurations
const corsOptions = require('./config/cors');
const prisma = require('./config/database');
const swaggerSpec = require('./config/swagger.config');
const swaggerUi = require('swagger-ui-express');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

// Import routes
const routes = require('./routes');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Trust proxy for Railway deployment
app.set("trust proxy", 1);

// Allowed origins for CORS
const allowedOrigins = [
    "http://localhost:3000",
    "https://c2c-kappa.vercel.app",
    "https://thorough-victory-production.up.railway.app"
];

// Manual CORS middleware (fixes OPTIONS preflight for Express 5)
app.use((req, res, next) => {
    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }

    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    // Important: Handle OPTIONS preflight
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }

    next();
});

// Body parser middleware
app.use(express.json());

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'C2C API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
        persistAuthorization: true,
    }
}));

// API Routes - All routes are now modularized!
app.use('/api', routes);

// Error handling middleware (must be last)
app.use(errorHandler);

// ========== SOCKET.IO SETUP ==========

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Store room data (simple in-memory storage for MVP)
const rooms = {};
const verificationCodes = {};

// Make Socket.IO available to controllers
app.set('io', io);

io.on('connection', (socket) => {
    console.log(`✅ User Connected: ${socket.id}`);

    // Heartbeat to keep connection alive
    const heartbeat = setInterval(() => {
        socket.emit("ping", Date.now());
    }, 5000);

    socket.on("pong", () => { });

    // Clear heartbeat on disconnect
    socket.on('disconnect', () => {
        clearInterval(heartbeat);
    });

    // Join Room Event
    socket.on('join_room', async (data) => {
        const { room, name, userId } = data;
        socket.join(room);

        // Initialize room if it doesn't exist
        if (!rooms[room]) {
            rooms[room] = {
                users: [],
                videoState: {
                    url: '',
                    isPlaying: false,
                    currentTime: 0,
                    lastUpdated: Date.now()
                },
                playlist: []
            };
        }

        // Add user to room
        const user = { id: socket.id, name, userId };
        rooms[room].users.push(user);

        console.log(`👤 User ${name} (${socket.id}) joined room: ${room}`);
        console.log(`📊 Room ${room} now has ${rooms[room].users.length} users`);

        // ✨ Load and send message history from database
        try {
            const messageHistory = await prisma.message.findMany({
                where: { roomId: room },
                include: {
                    user: {
                        select: {
                            name: true,
                            avatarUrl: true,
                            userId: true
                        }
                    }
                },
                orderBy: { createdAt: 'asc' },
                take: 100 // Last 100 messages
            });

            // Send message history to the user who just joined
            if (messageHistory.length > 0) {
                socket.emit('message_history', {
                    messages: messageHistory.map(msg => ({
                        id: msg.id,
                        message: msg.content,
                        username: msg.user?.name || 'Guest',
                        time: new Date(msg.createdAt).toLocaleTimeString(),
                        createdAt: msg.createdAt
                    }))
                });

                console.log(`📜 Sent ${messageHistory.length} previous messages to ${name}`);
            }
        } catch (error) {
            console.error('❌ Failed to load message history:', error);
        }

        // Send current video state to the new user
        if (rooms[room].videoState.url) {
            socket.emit('receive_video_state', rooms[room].videoState);
        }

        // Notify others in the room
        socket.to(room).emit('receive_message', {
            message: `${name} has joined the room`,
            username: 'System',
            time: new Date().toLocaleTimeString(),
        });

        // Send current room users to all users
        io.to(room).emit('room_users', rooms[room].users);

        // Send current playlist to new user
        if (rooms[room].playlist && rooms[room].playlist.length > 0) {
            socket.emit('receive_playlist', rooms[room].playlist);
        }

        // Update room activity in database
        const roomService = require('./services/room.service');
        roomService.updateRoomActivity(room).catch(err => {
            console.error('Failed to update room activity:', err);
        });
    });

    // Send Message Event
    socket.on('send_message', async (data) => {
        const { room, message, username, time, userId } = data;

        try {
            // Save message to database
            const savedMessage = await prisma.message.create({
                data: {
                    roomId: room,
                    userId: userId || 'guest', // Use 'guest' for non-registered users
                    content: message
                },
                include: {
                    user: {
                        select: {
                            name: true,
                            avatarUrl: true,
                            userId: true
                        }
                    }
                }
            });

            // Broadcast to all users in room (including sender via io.to)
            io.to(room).emit('receive_message', {
                id: savedMessage.id,
                message: savedMessage.content,
                username: username || savedMessage.user?.name || 'Guest',
                time: time || new Date().toLocaleTimeString(),
                createdAt: savedMessage.createdAt
            });

            console.log(`💬 Message saved to DB: Room ${room} - ${username}: "${message.substring(0, 50)}..."`);
        } catch (error) {
            console.error('❌ Failed to save message:', error);
            // Still broadcast even if DB save fails
            socket.to(room).emit('receive_message', data);
        }
    });

    // Video Sync Events
    socket.on('video_play', (data) => {
        const { room, currentTime } = data;
        if (rooms[room]) {
            rooms[room].videoState.isPlaying = true;
            rooms[room].videoState.currentTime = currentTime;
            rooms[room].videoState.lastUpdated = Date.now();
        }
        socket.to(room).emit('receive_video_play', { currentTime });
    });

    socket.on('video_pause', (data) => {
        const { room, currentTime } = data;
        if (rooms[room]) {
            rooms[room].videoState.isPlaying = false;
            rooms[room].videoState.currentTime = currentTime;
            rooms[room].videoState.lastUpdated = Date.now();
        }
        socket.to(room).emit('receive_video_pause', { currentTime });
    });

    socket.on('video_seek', (data) => {
        const { room, currentTime } = data;
        if (rooms[room]) {
            rooms[room].videoState.currentTime = currentTime;
            rooms[room].videoState.lastUpdated = Date.now();
        }
        socket.to(room).emit('receive_video_seek', { currentTime });
    });

    socket.on('video_url_change', (data) => {
        const { room, url } = data;
        if (rooms[room]) {
            rooms[room].videoState.url = url;
            rooms[room].videoState.currentTime = 0;
            rooms[room].videoState.isPlaying = false;
            rooms[room].videoState.lastUpdated = Date.now();
        }
        console.log(`🎥 Video URL changed in room ${room}:`, url);
        socket.to(room).emit('receive_video_url_change', { url });
    });

    // Playlist Events
    socket.on('add_to_playlist', (data) => {
        const { room, video } = data;
        if (rooms[room]) {
            if (!rooms[room].playlist) rooms[room].playlist = [];
            const exists = rooms[room].playlist.find(v => v.videoId === video.videoId);
            if (!exists) {
                rooms[room].playlist.push(video);
                io.to(room).emit('receive_playlist', rooms[room].playlist);
                io.to(room).emit('receive_message', {
                    message: `Added "${video.title}" to playlist`,
                    username: 'System',
                    time: new Date().toLocaleTimeString(),
                });
            }
        }
    });

    socket.on('remove_from_playlist', (data) => {
        const { room, videoId } = data;
        if (rooms[room] && rooms[room].playlist) {
            rooms[room].playlist = rooms[room].playlist.filter(v => v.videoId !== videoId);
            io.to(room).emit('receive_playlist', rooms[room].playlist);
        }
    });

    socket.on('play_from_playlist', (data) => {
        const { room, videoId } = data;
        if (rooms[room] && rooms[room].playlist) {
            const video = rooms[room].playlist.find(v => v.videoId === videoId);
            if (video) {
                // Handled by client
            }
        }
    });

    // Get current video state (for late joiners)
    socket.on('get_video_state', (data) => {
        const { room } = data;
        if (rooms[room] && rooms[room].videoState) {
            socket.emit('receive_video_state', rooms[room].videoState);
        }
    });

    // WebRTC Signaling Events (SimplePeer - legacy)
    socket.on("callUser", (data) => {
        io.to(data.userToCall).emit("callUser", {
            signal: data.signalData,
            from: data.from,
            name: data.name
        });
    });

    socket.on("answerCall", (data) => {
        io.to(data.to).emit("callAccepted", { signal: data.signal, from: socket.id });
    });

    socket.on("ice-candidate", (data) => {
        io.to(data.to).emit("ice-candidate", data.candidate);
    });

    // WebRTC Signaling Events (Native RTCPeerConnection)
    socket.on("webrtc_offer", ({ target, sdp }) => {
        io.to(target).emit("webrtc_offer", { from: socket.id, sdp });
    });

    socket.on("webrtc_answer", ({ target, sdp }) => {
        io.to(target).emit("webrtc_answer", { from: socket.id, sdp });
    });

    socket.on("webrtc_ice_candidate", ({ target, candidate }) => {
        io.to(target).emit("webrtc_ice_candidate", { from: socket.id, candidate });
    });

    // Screen Share Events
    socket.on("start_screen_share", ({ room }) => {
        console.log(`🖥️  User ${socket.id} started screen sharing in room ${room}`);
        socket.to(room).emit("screen_share_started", { from: socket.id });
    });

    socket.on("stop_screen_share", ({ room }) => {
        console.log(`🖥️  User ${socket.id} stopped screen sharing in room ${room}`);
        socket.to(room).emit("screen_share_stopped", { from: socket.id });
    });

    // Disconnect Event
    socket.on('disconnect', () => {
        console.log('❌ User Disconnected:', socket.id);

        // Cleanup: remove user from rooms
        for (const roomId in rooms) {
            const room = rooms[roomId];
            const userIndex = room.users.findIndex(u => u.id === socket.id);
            if (userIndex !== -1) {
                const user = room.users[userIndex];
                room.users.splice(userIndex, 1);
                io.to(roomId).emit('receive_message', {
                    message: `${user.name} has left the room`,
                    username: 'System',
                    time: new Date().toLocaleTimeString(),
                });
                io.to(roomId).emit('room_users', room.users);

                // Update room activity when user leaves
                const roomService = require('./services/room.service');
                roomService.updateRoomActivity(roomId).catch(err => {
                    console.error('Failed to update room activity on disconnect:', err);
                });

                break;
            }
        }
    });
});

// ========== START SERVER ==========

const PORT = process.env.PORT || 3001;

server.listen(PORT, async () => {
    console.log('🚀 ========================================');
    console.log(`🚀 SERVER RUNNING ON PORT ${PORT}`);
    console.log('🚀 ========================================');
    console.log('✅ Database connected (PostgreSQL via Prisma)');
    console.log('✅ MVC Architecture initialized');
    console.log('✅ Socket.IO ready for real-time communication');
    console.log('🚀 ========================================');

    // Start automatic room cleanup (every 5 minutes)
    const roomService = require('./services/room.service');
    setInterval(async () => {
        try {
            await roomService.cleanupEmptyRooms();
        } catch (error) {
            console.error('❌ Error during room cleanup:', error);
        }
    }, 5 * 60 * 1000); // 5 minutes

    console.log('🧹 Automatic room cleanup started (runs every 5 minutes)');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('⚠️  SIGTERM signal received: closing server');
    server.close(() => {
        console.log('✅ HTTP server closed');
    });
    await prisma.$disconnect();
    console.log('✅ Database connection closed');
    process.exit(0);
});

module.exports = { app, server, io };
