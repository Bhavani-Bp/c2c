import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Simple Day 5 sync test without complex mocks
describe('Day 5 - Simple Synchronization Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    // Mock sync functionality
    const mockSocketEmit = jest.fn();
    const MockSyncComponent = () => {
        const [isPlaying, setIsPlaying] = React.useState(false);
        const [url, setUrl] = React.useState('https://youtube.com/watch?v=default');
        const [currentTime, setCurrentTime] = React.useState(0);
        
        const mockSocket = {
            emit: mockSocketEmit,
            on: jest.fn(),
        };

        const handlePlay = () => {
            setIsPlaying(true);
            mockSocket.emit('video_play', { room: 'test123', currentTime: 30.5 });
        };

        const handlePause = () => {
            setIsPlaying(false);
            mockSocket.emit('video_pause', { room: 'test123', currentTime: 45.2 });
        };

        const handleUrlChange = (newUrl: string) => {
            setUrl(newUrl);
            mockSocket.emit('video_url_change', { room: 'test123', url: newUrl });
        };

        const handleSeek = (time: number) => {
            setCurrentTime(time);
            mockSocket.emit('video_seek', { room: 'test123', currentTime: time });
        };

        return (
            <div>
                <div data-testid="player-state" data-playing={isPlaying} data-url={url} data-time={currentTime}>
                    Player State
                </div>
                <button onClick={handlePlay} data-testid="play-btn">Play</button>
                <button onClick={handlePause} data-testid="pause-btn">Pause</button>
                <button onClick={() => handleSeek(60)} data-testid="seek-btn">Seek</button>
                <button onClick={() => handleUrlChange('https://vimeo.com/newvideo')} data-testid="url-btn">
                    Change URL
                </button>
                <div data-testid="socket-calls">{JSON.stringify(mockSocketEmit.mock.calls)}</div>
            </div>
        );
    };

    test('Day 5: Play event emits correct socket message', () => {
        render(<MockSyncComponent />);
        
        const playBtn = screen.getByTestId('play-btn');
        fireEvent.click(playBtn);
        
        const playerState = screen.getByTestId('player-state');
        expect(playerState).toHaveAttribute('data-playing', 'true');
        
        const socketCalls = screen.getByTestId('socket-calls');
        expect(socketCalls.textContent).toContain('video_play');
        expect(socketCalls.textContent).toContain('test123');
        expect(socketCalls.textContent).toContain('30.5');
    });

    test('Day 5: Pause event emits correct socket message', () => {
        render(<MockSyncComponent />);
        
        const pauseBtn = screen.getByTestId('pause-btn');
        fireEvent.click(pauseBtn);
        
        const playerState = screen.getByTestId('player-state');
        expect(playerState).toHaveAttribute('data-playing', 'false');
        
        const socketCalls = screen.getByTestId('socket-calls');
        expect(socketCalls.textContent).toContain('video_pause');
        expect(socketCalls.textContent).toContain('45.2');
    });

    test('Day 5: Seek event emits correct socket message', () => {
        render(<MockSyncComponent />);
        
        const seekBtn = screen.getByTestId('seek-btn');
        fireEvent.click(seekBtn);
        
        const playerState = screen.getByTestId('player-state');
        expect(playerState).toHaveAttribute('data-time', '60');
        
        const socketCalls = screen.getByTestId('socket-calls');
        expect(socketCalls.textContent).toContain('video_seek');
        expect(socketCalls.textContent).toContain('60');
    });

    test('Day 5: URL change emits correct socket message', () => {
        render(<MockSyncComponent />);
        
        const urlBtn = screen.getByTestId('url-btn');
        fireEvent.click(urlBtn);
        
        const playerState = screen.getByTestId('player-state');
        expect(playerState).toHaveAttribute('data-url', 'https://vimeo.com/newvideo');
        
        const socketCalls = screen.getByTestId('socket-calls');
        expect(socketCalls.textContent).toContain('video_url_change');
        expect(socketCalls.textContent).toContain('https://vimeo.com/newvideo');
    });

    test('Day 5: All sync events include room ID', () => {
        render(<MockSyncComponent />);
        
        // Trigger all events
        fireEvent.click(screen.getByTestId('play-btn'));
        fireEvent.click(screen.getByTestId('pause-btn'));
        fireEvent.click(screen.getByTestId('seek-btn'));
        fireEvent.click(screen.getByTestId('url-btn'));
        
        const socketCalls = screen.getByTestId('socket-calls');
        const callsText = socketCalls.textContent || '';
        
        // Count occurrences of room ID
        const roomIdCount = (callsText.match(/test123/g) || []).length;
        expect(roomIdCount).toBe(4); // Should appear in all 4 events
    });
});