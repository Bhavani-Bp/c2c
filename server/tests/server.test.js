const { createServer } = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');

describe('Socket.io Server Tests', () => {
    let io, serverSocket, clientSocket1, clientSocket2;
    let httpServer;

    beforeAll((done) => {
        httpServer = createServer();
        io = new Server(httpServer);
        httpServer.listen(() => {
            const port = httpServer.address().port;
            clientSocket1 = new Client(`http://localhost:${port}`);
            clientSocket2 = new Client(`http://localhost:${port}`);
            
            io.on('connection', (socket) => {
                serverSocket = socket;
            });
            
            clientSocket1.on('connect', done);
        });
    });

    afterAll(() => {
        io.close();
        clientSocket1.close();
        clientSocket2.close();
        httpServer.close();
    });

    test('should connect successfully', (done) => {
        expect(clientSocket1.connected).toBe(true);
        done();
    });

    test('should join room and notify others', (done) => {
        const roomData = { room: 'test-room', name: 'TestUser1' };
        
        clientSocket2.on('receive_message', (data) => {
            expect(data.message).toBe('TestUser1 has joined the room');
            expect(data.username).toBe('System');
            done();
        });

        clientSocket1.emit('join_room', roomData);
    });

    test('should send and receive messages', (done) => {
        const messageData = {
            room: 'test-room',
            username: 'TestUser1',
            message: 'Hello World',
            time: '12:00'
        };

        clientSocket2.on('receive_message', (data) => {
            expect(data.message).toBe('Hello World');
            expect(data.username).toBe('TestUser1');
            done();
        });

        clientSocket1.emit('send_message', messageData);
    });

    test('should handle multiple users in same room', (done) => {
        let messagesReceived = 0;
        
        const checkComplete = () => {
            messagesReceived++;
            if (messagesReceived === 2) done();
        };

        clientSocket1.on('receive_message', checkComplete);
        clientSocket2.on('receive_message', checkComplete);

        clientSocket2.emit('join_room', { room: 'test-room', name: 'TestUser2' });
    });

    test('should handle disconnect and cleanup', (done) => {
        clientSocket2.on('receive_message', (data) => {
            if (data.message.includes('has left the room')) {
                expect(data.username).toBe('System');
                done();
            }
        });

        clientSocket1.disconnect();
    });
});