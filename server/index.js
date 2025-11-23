const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

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
            "https://*.vercel.app",
            /^https:\/\/.*\.vercel\.app$/
        ],
        methods: ["GET", "POST"],
        credentials: true
    },
    // Connection stability settings
    pingInterval: 10000,
    pingTimeout: 5000
});


// Store room data (simple in-memory storage for MVP)
// Structure: { roomId: { users: [ { id, name, email } ], videoState: { url, isPlaying, currentTime, lastUpdated }, createdBy, createdAt } }
const rooms = {};

// Store user verification codes (in production, use Redis or database)
const verificationCodes = {};

io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

    // Join Room Event
    socket.on('join_room', (data) => {
        const { room, name } = data;
        socket.join(room);

        // Initialize room if it doesn't exist
        if (!rooms[room]) {
            rooms[room] = {
                users: [],
                host: null, // Track the host (first user)
                videoState: {
                    url: '',
                    isPlaying: false,
                    currentTime: 0,
                    lastUpdated: Date.now()
                }
            };
        }

        // Add user to room
        const user = { id: socket.id, name };
        rooms[room].users.push(user);

        // Elect host if none exists (first user becomes host)
        if (!rooms[room].host) {
            rooms[room].host = socket.id;
            console.log(`👑 ${name} (${socket.id}) is now the host of room ${room}`);
        }

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

        // Send current room users to all users (including host info)
        io.to(room).emit('room_users', {
            users: rooms[room].users,
            host: rooms[room].host
        });
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

    // ============================================
    // SYNCHRONIZED VIDEO PLAYBACK EVENTS
    // ============================================

    // Server Time Sync RPC (for client clock synchronization)
    socket.on('get_server_time', (callback) => {
        const serverTime = Date.now();
        if (typeof callback === 'function') {
            callback({ serverTime });
        }
    });

    // Host loads a video with scheduled start time
    socket.on('load_video', ({ roomId, url, startAt }) => {
        console.log(`📹 load_video in room ${roomId}: ${url} at ${startAt}`);
        if (rooms[roomId]) {
            rooms[roomId].videoState = {
                url,
                isPlaying: false,
                currentTime: 0,
                lastUpdated: startAt,
                startAt
            };
        }
        // Broadcast to all users in room (including sender for confirmation)
        io.to(roomId).emit('load_video', { url, startAt, from: socket.id });
    });

    // Play command with server timestamp
    socket.on('play', ({ roomId, at }) => {
        console.log(`▶️ play in room ${roomId} at server time ${at}`);
        if (rooms[roomId]) {
            rooms[roomId].videoState.isPlaying = true;
            rooms[roomId].videoState.lastUpdated = at;
        }
        io.to(roomId).emit('play', { at, from: socket.id });
    });

    // Pause command with server timestamp
    socket.on('pause', ({ roomId, at }) => {
        console.log(`⏸️ pause in room ${roomId} at server time ${at}`);
        if (rooms[roomId]) {
            rooms[roomId].videoState.isPlaying = false;
            rooms[roomId].videoState.lastUpdated = at;
        }
        io.to(roomId).emit('pause', { at, from: socket.id });
    });

    // Seek command with position and server timestamp
    socket.on('seek', ({ roomId, to, at }) => {
        console.log(`⏩ seek in room ${roomId} to ${to}s at server time ${at}`);
        if (rooms[roomId]) {
            rooms[roomId].videoState.currentTime = to;
            rooms[roomId].videoState.lastUpdated = at;
        }
        io.to(roomId).emit('seek', { to, at, from: socket.id });
    });

    // Request current state (for late joiners)
    socket.on('request_current_state', ({ roomId }, callback) => {
        console.log(`🔄 request_current_state for room ${roomId}`);
        if (rooms[roomId] && rooms[roomId].videoState && rooms[roomId].videoState.url) {
            const state = {
                ...rooms[roomId].videoState,
                serverTime: Date.now()
            };
            if (typeof callback === 'function') {
                callback(state);
            }
        } else {
            if (typeof callback === 'function') {
                callback(null);
            }
        }
    });

    // ============================================
    // END SYNCHRONIZED VIDEO PLAYBACK EVENTS
    // ============================================


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

                // Re-elect host if the disconnected user was the host
                if (room.host === socket.id) {
                    room.host = room.users.length > 0 ? room.users[0].id : null;
                    if (room.host) {
                        console.log(`👑 New host elected: ${room.users[0].name} (${room.host})`);
                    }
                }

                io.to(roomId).emit('receive_message', {
                    message: `${user.name} has left the room`,
                    username: 'System',
                    time: new Date().toLocaleTimeString(),
                });

                // Send updated user list with new host info
                io.to(roomId).emit('room_users', {
                    users: room.users,
                    host: room.host
                });
                break; // Assuming user is only in one room
            }
        }
    });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, "0.0.0.0", () => {
    console.log(`SERVER RUNNING ON PORT ${PORT} (accessible via 0.0.0.0)`);
    console.log(`Ready for ngrok tunnel: ngrok http --host-header=rewrite ${PORT}`);
});
