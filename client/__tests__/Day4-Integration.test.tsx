import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RoomClient from '../components/RoomClient';
import { io } from 'socket.io-client';

// Mock socket.io-client
jest.mock('socket.io-client');
const mockIo = io as jest.MockedFunction<typeof io>;

// Mock PlayerComponent directly
jest.mock('../components/PlayerComponent', () => {
    const React = require('react');
    return function MockPlayerComponent({ url, isPlaying, onPlay, onPause }: any) {
        return React.createElement('div', {
            'data-testid': 'player-component',
            'data-url': url,
            'data-playing': isPlaying
        }, [
            React.createElement('button', { onClick: onPlay, 'data-testid': 'mock-play', key: 'play' }, 'Play'),
            React.createElement('button', { onClick: onPause, 'data-testid': 'mock-pause', key: 'pause' }, 'Pause'),
            `Mock Player: ${url}`
        ]);
    };
});

describe('Day 4 - Integration Tests', () => {
    let mockSocket: any;

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

    test('complete video loading workflow', async () => {
        render(<RoomClient roomId="test123" userName="TestUser" />);

        // 1. Check initial state (empty URL)
        expect(screen.getByTestId('player-component')).toHaveAttribute('data-url', '');

        // 2. Enter new URL
        const urlInput = screen.getByPlaceholderText('Try: https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
        fireEvent.change(urlInput, { target: { value: 'https://vimeo.com/123456' } });

        // 3. Submit form
        const loadButton = screen.getByText('Load');
        fireEvent.click(loadButton);

        // 4. Verify URL updated
        await waitFor(() => {
            expect(screen.getByTestId('player-component')).toHaveAttribute('data-url', 'https://vimeo.com/123456');
        });

        // 5. Verify input cleared
        expect(urlInput).toHaveValue('');
    });

    test('player controls are properly configured', () => {
        render(<RoomClient roomId="test123" userName="TestUser" />);

        const player = screen.getByTestId('player-component');
        // Controls are handled internally by PlayerComponent now
        expect(player).toBeInTheDocument();
        expect(player).toHaveAttribute('data-playing', 'false');
    });

    test('room info displays correctly with video player', () => {
        render(<RoomClient roomId="cinema123" userName="TestUser" />);

        // Check room info overlay
        expect(screen.getByText('Room:')).toBeInTheDocument();
        expect(screen.getByText('cinema123')).toBeInTheDocument();

        // Check player is present
        expect(screen.getByTestId('player-component')).toBeInTheDocument();
    });

    test('layout structure is correct', () => {
        render(<RoomClient roomId="test123" userName="TestUser" />);

        // Check main layout elements
        expect(screen.getByPlaceholderText('Paste video URL (YouTube, MP4, etc.)')).toBeInTheDocument();
        expect(screen.getByTestId('player-component')).toBeInTheDocument();
        expect(screen.getByText('Live Chat')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
    });

    test('multiple URL changes work correctly', async () => {
        render(<RoomClient roomId="test123" userName="TestUser" />);

        const urlInput = screen.getByPlaceholderText('Try: https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
        const loadButton = screen.getByText('Load');

        const urls = [
            'https://youtube.com/watch?v=video1',
            'https://vimeo.com/video2',
            'https://example.com/video3.mp4'
        ];

        for (let i = 0; i < urls.length; i++) {
            fireEvent.change(urlInput, { target: { value: urls[i] } });
            fireEvent.click(loadButton);

            await waitFor(() => {
                expect(screen.getByTestId('player-component')).toHaveAttribute('data-url', urls[i]);
            });

            expect(urlInput).toHaveValue('');
        }
    });

    test('video player and chat work simultaneously', async () => {
        render(<RoomClient roomId="test123" userName="TestUser" />);

        // Change video URL
        const urlInput = screen.getByPlaceholderText('Try: https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
        fireEvent.change(urlInput, { target: { value: 'https://youtube.com/watch?v=test' } });
        fireEvent.click(screen.getByText('Load'));

        // Send a chat message
        const messageInput = screen.getByPlaceholderText('Type a message...');
        fireEvent.change(messageInput, { target: { value: 'Video loaded!' } });
        fireEvent.click(screen.getByRole('button', { name: /send/i }));

        // Verify both work
        await waitFor(() => {
            expect(screen.getByTestId('player-component')).toHaveAttribute('data-url', 'https://youtube.com/watch?v=test');
            expect(screen.getByText('Video loaded!')).toBeInTheDocument();
        });
    });

    test('URL input validation edge cases', async () => {
        render(<RoomClient roomId="test123" userName="TestUser" />);

        const urlInput = screen.getByPlaceholderText('Try: https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
        const loadButton = screen.getByText('Load');
        const originalUrl = '';

        // Test whitespace-only input
        fireEvent.change(urlInput, { target: { value: '   ' } });
        fireEvent.click(loadButton);

        // Should not change URL (stays empty)
        expect(screen.getByTestId('player-component')).toHaveAttribute('data-url', originalUrl);

        // Test valid URL with whitespace (should be trimmed by handleUrlSubmit)
        fireEvent.change(urlInput, { target: { value: '  https://youtube.com/watch?v=trimmed  ' } });
        fireEvent.click(loadButton);

        await waitFor(() => {
            // URL should be trimmed and https:// added if needed
            const player = screen.getByTestId('player-component');
            const url = player.getAttribute('data-url');
            expect(url).toContain('youtube.com/watch?v=trimmed');
        });
    });
});