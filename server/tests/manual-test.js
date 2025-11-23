const io = require('socket.io-client');

// Manual test script to verify server functionality
const socket1 = io('http://localhost:3001');
const socket2 = io('http://localhost:3001');

console.log('Starting manual server tests...');

// Test 1: Connection
socket1.on('connect', () => {
    console.log('✅ Socket1 connected:', socket1.id);
    
    // Test 2: Join room
    socket1.emit('join_room', { room: 'test123', name: 'User1' });
});

socket2.on('connect', () => {
    console.log('✅ Socket2 connected:', socket2.id);
    
    setTimeout(() => {
        socket2.emit('join_room', { room: 'test123', name: 'User2' });
    }, 1000);
});

// Test 3: Message receiving
socket1.on('receive_message', (data) => {
    console.log('✅ Socket1 received message:', data);
});

socket2.on('receive_message', (data) => {
    console.log('✅ Socket2 received message:', data);
});

// Test 4: Room users update
socket1.on('room_users', (users) => {
    console.log('✅ Socket1 room users update:', users);
});

socket2.on('room_users', (users) => {
    console.log('✅ Socket2 room users update:', users);
});

// Test 5: Send message after joining
setTimeout(() => {
    socket1.emit('send_message', {
        room: 'test123',
        username: 'User1',
        message: 'Hello from User1!',
        time: new Date().toLocaleTimeString()
    });
}, 2000);

setTimeout(() => {
    socket2.emit('send_message', {
        room: 'test123',
        username: 'User2',
        message: 'Hello from User2!',
        time: new Date().toLocaleTimeString()
    });
}, 3000);

// Test 6: Disconnect test
setTimeout(() => {
    console.log('🔌 Disconnecting Socket1...');
    socket1.disconnect();
}, 5000);

setTimeout(() => {
    console.log('🔌 Disconnecting Socket2...');
    socket2.disconnect();
    process.exit(0);
}, 7000);