import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RoomClient from '../components/RoomClient';
import { io } from 'socket.io-client';

// Mock socket.io-client
jest.mock('socket.io-client');
const mockIo = io;

// Mock PlayerComponent
jest.mock('../components/PlayerComponent', () => {
    const React = require('react');
    return function MockPlayerComponent({ url }) {
        return React.createElement(
            'div',
            {
                'data-testid': 'player-component',
                'data-url': url
            },
            `Player: ${url}`
        );
    };
});

describe('RoomClient', () => {
    let mockSocket;

    beforeEach(() => {
        mockSocket = {
            emit: jest.fn(),
            on: jest.fn(),
            disconnect: jest.fn(),
        };
        mockIo.mockReturnValue(mockSocket);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('renders room interface correctly', () => {
        render(<RoomClient roomId="test123" userName="TestUser" />);

        expect(screen.getByText('Live Chat')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
        expect(
            screen.getByPlaceholderText(
                'Try: https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
            )
        ).toBeInTheDocument();
        expect(screen.getByText('Room:')).toBeInTheDocument();
        expect(screen.getByText('test123')).toBeInTheDocument();
    });

    test('initializes socket connection and joins room', () => {
        render(<RoomClient roomId="test123" userName="TestUser" />);

        expect(mockIo).toHaveBeenCalledWith('http://localhost:3001');
        expect(mockSocket.emit).toHaveBeenCalledWith('join_room', {
            room: 'test123',
            name: 'TestUser'
        });
    });

    test('sends message when form submitted', async () => {
        render(<RoomClient roomId="test123" userName="TestUser" />);

        const messageInput = screen.getByPlaceholderText('Type a message...');
        const sendButton = screen.getByRole('button', { name: /send/i });

        fireEvent.change(messageInput, { target: { value: 'Hello World' } });
        fireEvent.click(sendButton);

        expect(mockSocket.emit).toHaveBeenCalledWith(
            'send_message',
            expect.objectContaining({
                room: 'test123',
                username: 'TestUser',
                message: 'Hello World'
            })
        );
    });

    test('prevents sending empty messages', () => {
        render(<RoomClient roomId="test123" userName="TestUser" />);

        const sendButton = screen.getByRole('button', { name: /send/i });
        expect(sendButton).toBeDisabled();

        const messageInput = screen.getByPlaceholderText('Type a message...');
        fireEvent.change(messageInput, { target: { value: '   ' } });
        expect(sendButton).toBeDisabled();
    });

    test('updates URL when form submitted', async () => {
        render(<RoomClient roomId="test123" userName="TestUser" />);

        const urlInput = screen.getByPlaceholderText(
            'Try: https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
        );
        const loadButton = screen.getByText('Load');

        fireEvent.change(urlInput, { target: { value: 'https://youtube.com/watch?v=newvideo' } });
        fireEvent.click(loadButton);

        await waitFor(() => {
            const player = screen.getByTestId('player-component');
            expect(player).toHaveAttribute('data-url', 'https://youtube.com/watch?v=newvideo');
        });
    });

    test('displays received messages correctly', async () => {
        render(<RoomClient roomId="test123" userName="TestUser" />);

        const mockMessage = {
            message: 'Hello from another user',
            username: 'OtherUser',
            time: '12:00'
        };

        const receiveCall = mockSocket.on.mock.calls.find(call => call[0] === 'receive_message');
        expect(receiveCall).toBeTruthy();

        const receiveMessageCallback = receiveCall[1];
        receiveMessageCallback(mockMessage);

        await waitFor(() => {
            expect(screen.getByText('Hello from another user')).toBeInTheDocument();
            expect(screen.getByText('OtherUser')).toBeInTheDocument();
        });
    });

    test('handles system messages differently', async () => {
        render(<RoomClient roomId="test123" userName="TestUser" />);

        const systemMessage = {
            message: 'User joined the room',
            username: 'System',
            time: '12:00'
        };

        const receiveCall = mockSocket.on.mock.calls.find(call => call[0] === 'receive_message');
        expect(receiveCall).toBeTruthy();

        const receiveMessageCallback = receiveCall[1];
        receiveMessageCallback(systemMessage);

        await waitFor(() => {
            expect(screen.getByText('User joined the room')).toBeInTheDocument();
        });
    });

    test('cleans up socket on unmount', () => {
        const { unmount } = render(<RoomClient roomId="test123" userName="TestUser" />);

        unmount();

        expect(mockSocket.disconnect).toHaveBeenCalled();
    });
});
