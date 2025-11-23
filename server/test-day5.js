const io = require('socket.io-client');

console.log('Testing Day 5 Synchronization...');

// Start server first
require('./index.js');

setTimeout(() => {
    const socket1 = io('http://localhost:3001');
    const socket2 = io('http://localhost:3001');

    socket1.on('connect', () => {
        console.log('✅ Socket1 connected');
        socket1.emit('join_room', { room: 'test123', name: 'User1' });
    });

    socket2.on('connect', () => {
        console.log('✅ Socket2 connected');
        socket2.emit('join_room', { room: 'test123', name: 'User2' });
    });

    // Test video sync events
    socket1.on('receive_video_play', (data) => {
        console.log('✅ Socket1 received play event:', data);
    });

    socket2.on('receive_video_play', (data) => {
        console.log('✅ Socket2 received play event:', data);
    });

    socket1.on('receive_video_url_change', (data) => {
        console.log('✅ Socket1 received URL change:', data);
    });

    socket2.on('receive_video_url_change', (data) => {
        console.log('✅ Socket2 received URL change:', data);
    });

    // Test sync after both connected
    setTimeout(() => {
        console.log('🎬 Testing video play sync...');
        socket1.emit('video_play', { room: 'test123', currentTime: 30.5 });
    }, 2000);

    setTimeout(() => {
        console.log('🔗 Testing URL change sync...');
        socket1.emit('video_url_change', { room: 'test123', url: 'https://youtube.com/watch?v=newvideo' });
    }, 3000);

    setTimeout(() => {
        console.log('⏸️ Testing video pause sync...');
        socket2.emit('video_pause', { room: 'test123', currentTime: 45.2 });
    }, 4000);

    setTimeout(() => {
        console.log('🔍 Testing get video state...');
        socket2.emit('get_video_state', { room: 'test123' });
    }, 5000);

    socket2.on('receive_video_state', (data) => {
        console.log('✅ Socket2 received video state:', data);
        console.log('🎉 Day 5 synchronization tests completed!');
        process.exit(0);
    });

}, 1000);