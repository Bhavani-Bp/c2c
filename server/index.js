require('dotenv').config();
const express = require('express');
const axios = require('axios');
const http = require('http');
const { Server } = require('socket.io');
// const ytdl = require('@distube/ytdl-core');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();

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

// Standard CORS middleware (backup)
app.use(cors({
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));
app.use(express.json());

console.log('✅ CORS configured for:', allowedOrigins);

// In-memory storage for users (will be replaced with database later)
// Structure: { userId: { userId, name, dob, passwordHash, email, isVerified, createdAt } }
const users = {};

// Store email verification codes
const emailVerificationCodes = {};

// API Routes

// Root route for server status
app.get('/', (req, res) => {
    res.json({
        message: 'Connect to Connect Server is running!',
        status: 'active',
        availableEndpoints: [
            'POST /api/create-room',
            'POST /api/join-room',
            'GET /api/room/:roomId'
        ]
    });
});


// ========== YOUTUBE API ENDPOINTS ==========

// Search API
app.get('/api/search', async (req, res) => {
    console.log('🔍 SEARCH API CALLED:', { query: req.query.query });
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        console.error('❌ SEARCH ERROR: Missing YouTube API Key');
        return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
    }

    try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                q: query,
                type: 'video',
                maxResults: 50,
                key: apiKey
            }
        });

        const videos = response.data.items.map(item => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.medium.url,
            channel: item.snippet.channelTitle,
            description: item.snippet.description,
            publishDate: item.snippet.publishedAt
        }));

        console.log(`✅ SEARCH SUCCESS: Found ${videos.length} videos`);
        res.json({ success: true, videos });
    } catch (error) {
        console.error('❌ SEARCH ERROR:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch videos from YouTube' });
    }
});

// Play API (Extract Stream URL) - REMOVED
// app.get('/api/play', async (req, res) => {
//     res.status(410).json({ error: 'This endpoint has been removed.' });
// });

// ========== AUTHENTICATION API ENDPOINTS ==========


// Signup API
app.post('/api/auth/signup', async (req, res) => {
    console.log('📝 SIGNUP API CALLED:', { userId: req.body.userId, name: req.body.name });
    const { userId, name, dob, password, email } = req.body;

    // Validation
    if (!userId || !name || !dob || !password || !email) {
        console.log('❌ SIGNUP: Missing required fields');
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    if (users[userId]) {
        console.log('❌ SIGNUP: User ID already exists');
        return res.status(400).json({ error: 'User ID already exists' });
    }

    try {
        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Generate verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Store verification code
        emailVerificationCodes[email] = {
            code: verificationCode,
            userId,
            expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
        };

        // Create user
        users[userId] = {
            userId,
            name,
            dob,
            passwordHash,
            email,
            isVerified: false,
            createdAt: new Date().toISOString()
        };

        // Log verification code (in production, send email)
        console.log(`✅ SIGNUP SUCCESS - Verification code for ${email}: ${verificationCode}`);
        console.log(`Total users: ${Object.keys(users).length}`);

        res.json({
            success: true,
            message: 'Account created! Verification code sent to email (check console)',
            userId
        });
    } catch (error) {
        console.error('❌ SIGNUP ERROR:', error);
        res.status(500).json({ error: 'Server error during signup' });
    }
});

// Login API
app.post('/api/auth/login', async (req, res) => {
    console.log('🔐 LOGIN API CALLED:', { userId: req.body.userId });
    const { userId, password } = req.body;

    // Validation
    if (!userId || !password) {
        console.log('❌ LOGIN: Missing required fields');
        return res.status(400).json({ error: 'User ID and password are required' });
    }

    // Check if user exists
    const user = users[userId];
    if (!user) {
        console.log('❌ LOGIN: User not found');
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    try {
        // Compare password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            console.log('❌ LOGIN: Invalid password');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if email is verified
        if (!user.isVerified) {
            console.log('⚠️ LOGIN: Email not verified');
            return res.status(403).json({
                error: 'Email not verified',
                requiresVerification: true
            });
        }

        console.log('✅ LOGIN SUCCESS:', { userId, name: user.name });

        // Return user data (excluding password)
        res.json({
            success: true,
            user: {
                userId: user.userId,
                name: user.name,
                email: user.email,
                dob: user.dob
            }
        });
    } catch (error) {
        console.error('❌ LOGIN ERROR:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// Verify Email API
app.post('/api/auth/verify-email', (req, res) => {
    console.log('📧 VERIFY EMAIL API CALLED:', { email: req.body.email, code: req.body.code });
    const { email, code } = req.body;

    // Validation
    if (!email || !code) {
        console.log('❌ VERIFY EMAIL: Missing required fields');
        return res.status(400).json({ error: 'Email and code are required' });
    }

    // Check verification code
    const verification = emailVerificationCodes[email];
    if (!verification) {
        console.log('❌ VERIFY EMAIL: No verification code found');
        return res.status(400).json({ error: 'No verification code found for this email' });
    }

    // Check expiration
    if (Date.now() > verification.expiresAt) {
        delete emailVerificationCodes[email];
        console.log('❌ VERIFY EMAIL: Code expired');
        return res.status(400).json({ error: 'Verification code expired' });
    }

    // Check code match
    if (verification.code !== code) {
        console.log('❌ VERIFY EMAIL: Invalid code');
        return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Mark user as verified
    const user = users[verification.userId];
    if (user) {
        user.isVerified = true;
        delete emailVerificationCodes[email];
        console.log('✅ EMAIL VERIFIED:', { userId: user.userId, email });

        res.json({
            success: true,
            message: 'Email verified successfully',
            user: {
                userId: user.userId,
                name: user.name,
                email: user.email,
                dob: user.dob
            }
        });
    } else {
        console.log('❌ VERIFY EMAIL: User not found');
        res.status(404).json({ error: 'User not found' });
    }
});

// ========== ROOM API ENDPOINTS ==========


// Create Room API
app.post('/api/create-room', (req, res) => {
    console.log('🚀 CREATE ROOM API CALLED:', { creatorName: req.body.creatorName, creatorEmail: req.body.creatorEmail });
    const { creatorName, creatorEmail } = req.body;

    if (!creatorName || !creatorEmail) {
        console.log('❌ CREATE ROOM: Missing required fields');
        return res.status(400).json({ error: 'Name and email are required' });
    }

    // Generate unique room ID
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create room
    rooms[roomId] = {
        users: [],
        videoState: {
            url: '',
            isPlaying: false,
            currentTime: 0,
            lastUpdated: Date.now()
        },
        createdBy: creatorEmail,
        createdAt: new Date().toISOString()
    };

    console.log('✅ CREATE ROOM SUCCESS:', { roomId, creatorName, creatorEmail });
    console.log('Available rooms now:', Object.keys(rooms));
    res.json({
        success: true,
        roomId,
        message: 'Room created successfully'
    });
});

// Send Verification Code API
app.post('/api/send-verification', (req, res) => {
    console.log('📧 SEND VERIFICATION API CALLED:', { email: req.body.email, roomId: req.body.roomId });
    const { email, roomId } = req.body;

    if (!email || !roomId) {
        console.log('❌ SEND VERIFICATION: Missing required fields');
        return res.status(400).json({ error: 'Email and room ID are required' });
    }

    if (!rooms[roomId]) {
        return res.status(404).json({ error: 'Room not found' });
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store verification code (expires in 10 minutes)
    verificationCodes[email] = {
        code,
        roomId,
        expiresAt: Date.now() + 10 * 60 * 1000
    };

    // In production, send email here
    console.log(`Verification code for ${email}: ${code}`);

    console.log('✅ VERIFICATION CODE SENT:', { email, roomId, code });
    res.json({
        success: true,
        message: 'Verification code sent to your email'
    });
});

// Verify Code API
app.post('/api/verify-code', (req, res) => {
    console.log('🔐 VERIFY CODE API CALLED:', { email: req.body.email, code: req.body.code, name: req.body.name });
    const { email, code, name } = req.body;

    if (!email || !code || !name) {
        console.log('❌ VERIFY CODE: Missing required fields');
        return res.status(400).json({ error: 'Email, code, and name are required' });
    }

    const verification = verificationCodes[email];

    if (!verification) {
        return res.status(400).json({ error: 'No verification code found' });
    }

    if (Date.now() > verification.expiresAt) {
        delete verificationCodes[email];
        return res.status(400).json({ error: 'Verification code expired' });
    }

    if (verification.code !== code) {
        return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Clean up verification code
    delete verificationCodes[email];

    console.log('✅ VERIFICATION SUCCESS:', { email, name, roomId: verification.roomId });
    res.json({
        success: true,
        roomId: verification.roomId,
        message: 'Verification successful'
    });
});

// Join Room API (without verification)
app.post('/api/join-room', (req, res) => {
    console.log('🚪 JOIN ROOM API CALLED:', { name: req.body.name, email: req.body.email, roomId: req.body.roomId });
    const { name, email, roomId } = req.body;

    if (!name || !email || !roomId) {
        console.log('❌ JOIN ROOM: Missing required fields');
        return res.status(400).json({ error: 'Name, email, and room ID are required' });
    }

    if (!rooms[roomId]) {
        console.log('❌ JOIN ROOM: Room not found:', roomId);
        console.log('Available rooms:', Object.keys(rooms));
        console.log('Total rooms:', Object.keys(rooms).length);
        return res.status(404).json({
            error: 'Room not found. Please check the Room ID.',
            availableRooms: Object.keys(rooms).length,
            hint: 'Make sure you\'re using the exact Room ID shared by the room creator'
        });
    }

    console.log('✅ JOIN ROOM SUCCESS:', { name, email, roomId });
    console.log('Room exists with users:', rooms[roomId].users.length);
    res.json({
        success: true,
        roomId,
        message: 'Successfully joined room'
    });
});

// Get Room Info API
app.get('/api/room/:roomId', (req, res) => {
    const { roomId } = req.params;

    if (!rooms[roomId]) {
        return res.status(404).json({ error: 'Room not found' });
    }

    res.json({
        success: true,
        room: {
            id: roomId,
            userCount: rooms[roomId].users.length,
            createdAt: rooms[roomId].createdAt
        }
    });
});

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: [
            "http://localhost:3000",
            "https://c2c-kappa.vercel.app",
            "https://thorough-victory-production.up.railway.app"
        ],
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Store room data (simple in-memory storage for MVP)
// Structure: { roomId: { users: [ { id, name, email } ], videoState: { url, isPlaying, currentTime, lastUpdated }, createdBy, createdAt } }
const rooms = {};

// Store user verification codes (in production, use Redis or database)
const verificationCodes = {};

io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

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
    socket.on('join_room', (data) => {
        const { room, name } = data;
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
        const user = { id: socket.id, name };
        rooms[room].users.push(user);

        console.log(`User ${name} (${socket.id}) joined room: ${room}`);
        console.log(`Room ${room} now has ${rooms[room].users.length} users`);

        // Send current video state to the new user
        if (rooms[room].videoState.url) {
            socket.emit('receive_video_state', rooms[room].videoState);
            console.log(`Sent current video state to ${name}:`, rooms[room].videoState);
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
    });

    // Send Message Event
    socket.on('send_message', (data) => {
        // data: { room, message, username, time }
        socket.to(data.room).emit('receive_message', data);
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
        console.log(`Video URL changed in room ${room}:`, url);
        socket.to(room).emit('receive_video_url_change', { url });
    });

    // Playlist Events
    socket.on('add_to_playlist', (data) => {
        const { room, video } = data;
        if (rooms[room]) {
            if (!rooms[room].playlist) rooms[room].playlist = [];
            // Check for duplicates
            const exists = rooms[room].playlist.find(v => v.videoId === video.videoId);
            if (!exists) {
                rooms[room].playlist.push(video);
                io.to(room).emit('receive_playlist', rooms[room].playlist);

                // Notify chat
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
                // Remove from playlist if desired, or keep it. For now, let's keep it.
                // Actually, usually "play next" implies removing from queue, but "play specific" might not.
                // Let's implement "remove after play" logic in the client or a separate event if needed.
                // For now, just play it.

                // We'll handle the actual URL fetching in the client for now to reuse the existing logic,
                // OR we can do it here. Let's stick to client-driven playback for consistency with current architecture.
                // But wait, we need to tell everyone to play this video.
                // The client calling this will then trigger 'video_url_change'.
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
        // data: { userToCall, signalData, from, name }
        io.to(data.userToCall).emit("callUser", {
            signal: data.signalData,
            from: data.from,
            name: data.name
        });
    });

    socket.on("answerCall", (data) => {
        // data: { to, signal }
        io.to(data.to).emit("callAccepted", { signal: data.signal, from: socket.id });
    });

    socket.on("ice-candidate", (data) => {
        // data: { to, candidate }
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
        console.log(`User ${socket.id} started screen sharing in room ${room}`);
        socket.to(room).emit("screen_share_started", { from: socket.id });
    });

    socket.on("stop_screen_share", ({ room }) => {
        console.log(`User ${socket.id} stopped screen sharing in room ${room}`);
        socket.to(room).emit("screen_share_stopped", { from: socket.id });
    });

    // Disconnect Event
    socket.on('disconnect', () => {
        console.log('User Disconnected', socket.id);
        // Cleanup logic (remove user from rooms) could go here
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
                break; // Assuming user is only in one room
            }
        }
    });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    console.log(`SERVER RUNNING ON PORT ${PORT}`);
});
