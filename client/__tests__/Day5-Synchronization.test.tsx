import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RoomClient from '../components/RoomClient';
import { io } from 'socket.io-client';

// Mock socket.io-client
jest.mock('socket.io-client');
const mockIo = io as jest.MockedFunction<typeof io>;

// Mock ReactPlayer with sync capabilities
const mockReact = require('react');
jest.mock('react-player', () => {
    return mockReact.forwardRef(function MockReactPlayer(props: any, ref: any) {
        const { url, playing, onPlay, onPause, onSeek } = props;
        
        mockReact.useImperativeHandle(ref, () => ({
            getCurrentTime: () => 30.5,
            seekTo: jest.fn(),
        }));

        return mockReact.createElement('div', {
            'data-testid': 'react-player-sync',
            'data-url': url,
            'data-playing': playing
        }, [
            mockReact.createElement('button', { onClick: onPlay, 'data-testid': 'mock-play', key: 'play' }, 'Play'),
            mockReact.createElement('button', { onClick: onPause, 'data-testid': 'mock-pause', key: 'pause' }, 'Pause'),
            mockReact.createElement('button', { onClick: () => onSeek && onSeek(60), 'data-testid': 'mock-seek', key: 'seek' }, 'Seek'),
            `Sync Player: ${url}`
        ]);
    });
});

describe('Day 5 - Video Synchronization Tests', () => {
    let mockSocket: any;

    beforeEach(() => {
        mockSocket = {
            emit: jest.fn(),
            on: jest.fn(),
            off: jest.fn(),
            disconnect: jest.fn(),
        };
        mockIo.mockReturnValue(mockSocket);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('emits video_play event when play button clicked', async () => {
        render(<RoomClient roomId="test123" userName="TestUser" />);
        
        const playButton = screen.getByTestId('mock-play');
        fireEvent.click(playButton);
        
        expect(mockSocket.emit).toHaveBeenCalledWith('video_play', {
            room: 'test123',
            currentTime: 30.5
        });
    });

    test('emits video_pause event when pause button clicked', async () => {
        render(<RoomClient roomId="test123" userName="TestUser" />);
        
        const pauseButton = screen.getByTestId('mock-pause');
        fireEvent.click(pauseButton);
        
        expect(mockSocket.emit).toHaveBeenCalledWith('video_pause', {
            room: 'test123',
            currentTime: 30.5
        });
    });

    test('emits video_seek event when seek occurs', async () => {
        render(<RoomClient roomId="test123" userName="TestUser" />);
        
        const seekButton = screen.getByTestId('mock-seek');
        fireEvent.click(seekButton);
        
        expect(mockSocket.emit).toHaveBeenCalledWith('video_seek', {
            room: 'test123',
            currentTime: 60
        });
    });

    test('emits video_url_change when URL is changed', async () => {
        render(<RoomClient roomId="test123" userName="TestUser" />);
        
        const urlInput = screen.getByPlaceholderText('Paste video URL (YouTube, MP4, etc.)');
        const loadButton = screen.getByText('Load');
        
        fireEvent.change(urlInput, { target: { value: 'https://youtube.com/watch?v=sync-test' } });
        fireEvent.click(loadButton);
        
        expect(mockSocket.emit).toHaveBeenCalledWith('video_url_change', {
            room: 'test123',
            url: 'https://youtube.com/watch?v=sync-test'
        });
    });

    test('requests video state on room join', () => {
        render(<RoomClient roomId="test123" userName="TestUser" />);
        
        expect(mockSocket.emit).toHaveBeenCalledWith('get_video_state', {
            room: 'test123'
        });
    });

    test('listens for video sync events', () => {
        render(<RoomClient roomId="test123" userName="TestUser" />);
        
        expect(mockSocket.on).toHaveBeenCalledWith('receive_video_url_change', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('receive_video_state', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('receive_video_play', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('receive_video_pause', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('receive_video_seek', expect.any(Function));
    });

    test('updates URL when receiving sync event', () => {
        render(<RoomClient roomId="test123" userName="TestUser" />);
        
        // Find the callback for 'receive_video_url_change' and call it
        const urlChangeCallback = mockSocket.on.mock.calls.find(
            call => call[0] === 'receive_video_url_change'
        )[1];
        
        urlChangeCallback({ url: 'https://vimeo.com/synced-video' });
        
        const player = screen.getByTestId('react-player-sync');
        expect(player).toHaveAttribute('data-url', 'https://vimeo.com/synced-video');
    });

    test('updates video state when receiving sync state', () => {
        render(<RoomClient roomId="test123" userName="TestUser" />);
        
        // Find the callback for 'receive_video_state' and call it
        const stateCallback = mockSocket.on.mock.calls.find(
            call => call[0] === 'receive_video_state'
        )[1];
        
        stateCallback({
            url: 'https://youtube.com/watch?v=state-sync',
            isPlaying: true,
            currentTime: 120
        });
        
        const player = screen.getByTestId('react-player-sync');
        expect(player).toHaveAttribute('data-url', 'https://youtube.com/watch?v=state-sync');
        expect(player).toHaveAttribute('data-playing', 'true');
    });

    test('playing state updates correctly', async () => {
        render(<RoomClient roomId="test123" userName="TestUser" />);
        
        const player = screen.getByTestId('react-player-sync');
        expect(player).toHaveAttribute('data-playing', 'false');
        
        const playButton = screen.getByTestId('mock-play');
        fireEvent.click(playButton);
        
        await waitFor(() => {
            expect(player).toHaveAttribute('data-playing', 'true');
        });
    });

    test('cleans up socket listeners on unmount', () => {
        const { unmount } = render(<RoomClient roomId="test123" userName="TestUser" />);
        
        unmount();
        
        expect(mockSocket.off).toHaveBeenCalledWith('receive_video_play');
        expect(mockSocket.off).toHaveBeenCalledWith('receive_video_pause');
        expect(mockSocket.off).toHaveBeenCalledWith('receive_video_seek');
    });
});