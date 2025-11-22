import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RoomClient from '../components/RoomClient';
import { io } from 'socket.io-client';

// Mock socket.io-client
jest.mock('socket.io-client');
const mockIo = io as jest.MockedFunction<typeof io>;

// Mock ReactPlayer directly
jest.mock('react-player', () => {
    return function MockReactPlayer({ url, controls, playing, onPlay, onPause, onSeek }: any) {
        return (
            <div 
                data-testid="react-player-direct"
                data-url={url}
                data-controls={controls}
                data-playing={playing}
            >
                <button onClick={onPlay} data-testid="mock-play">Play</button>
                <button onClick={onPause} data-testid="mock-pause">Pause</button>
                <button onClick={() => onSeek && onSeek(30)} data-testid="mock-seek">Seek</button>
                Mock Player: {url}
            </div>
        );
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
        
        // 1. Check initial state
        expect(screen.getByTestId('react-player-direct')).toHaveAttribute('data-url', 'https://www.youtube.com/watch?v=LXb3EKWsInQ');
        
        // 2. Enter new URL
        const urlInput = screen.getByPlaceholderText('Paste video URL (YouTube, MP4, etc.)');
        fireEvent.change(urlInput, { target: { value: 'https://vimeo.com/123456' } });
        
        // 3. Submit form
        const loadButton = screen.getByText('Load');
        fireEvent.click(loadButton);
        
        // 4. Verify URL updated
        await waitFor(() => {
            expect(screen.getByTestId('react-player-direct')).toHaveAttribute('data-url', 'https://vimeo.com/123456');
        });
        
        // 5. Verify input cleared
        expect(urlInput).toHaveValue('');
    });

    test('player controls are properly configured', () => {
        render(<RoomClient roomId="test123" userName="TestUser" />);
        
        const player = screen.getByTestId('react-player-direct');
        expect(player).toHaveAttribute('data-controls', 'true');
        expect(player).toHaveAttribute('data-playing', 'false');
    });

    test('room info displays correctly with video player', () => {
        render(<RoomClient roomId="cinema123" userName="TestUser" />);
        
        // Check room info overlay
        expect(screen.getByText('Room:')).toBeInTheDocument();
        expect(screen.getByText('cinema123')).toBeInTheDocument();
        
        // Check player is present
        expect(screen.getByTestId('react-player-direct')).toBeInTheDocument();
    });

    test('layout structure is correct', () => {
        render(<RoomClient roomId="test123" userName="TestUser" />);
        
        // Check main layout elements
        expect(screen.getByPlaceholderText('Paste video URL (YouTube, MP4, etc.)')).toBeInTheDocument();
        expect(screen.getByTestId('react-player-direct')).toBeInTheDocument();
        expect(screen.getByText('Live Chat')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
    });

    test('multiple URL changes work correctly', async () => {
        render(<RoomClient roomId="test123" userName="TestUser" />);
        
        const urlInput = screen.getByPlaceholderText('Paste video URL (YouTube, MP4, etc.)');
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
                expect(screen.getByTestId('react-player-direct')).toHaveAttribute('data-url', urls[i]);
            });
            
            expect(urlInput).toHaveValue('');
        }
    });

    test('video player and chat work simultaneously', async () => {
        render(<RoomClient roomId="test123" userName="TestUser" />);
        
        // Change video URL
        const urlInput = screen.getByPlaceholderText('Paste video URL (YouTube, MP4, etc.)');
        fireEvent.change(urlInput, { target: { value: 'https://youtube.com/watch?v=test' } });
        fireEvent.click(screen.getByText('Load'));
        
        // Send a chat message
        const messageInput = screen.getByPlaceholderText('Type a message...');
        fireEvent.change(messageInput, { target: { value: 'Video loaded!' } });
        fireEvent.click(screen.getByRole('button', { name: /send/i }));
        
        // Verify both work
        await waitFor(() => {
            expect(screen.getByTestId('react-player-direct')).toHaveAttribute('data-url', 'https://youtube.com/watch?v=test');
            expect(screen.getByText('Video loaded!')).toBeInTheDocument();
        });
    });

    test('URL input validation edge cases', async () => {
        render(<RoomClient roomId="test123" userName="TestUser" />);
        
        const urlInput = screen.getByPlaceholderText('Paste video URL (YouTube, MP4, etc.)');
        const loadButton = screen.getByText('Load');
        const originalUrl = 'https://www.youtube.com/watch?v=LXb3EKWsInQ';
        
        // Test whitespace-only input
        fireEvent.change(urlInput, { target: { value: '   ' } });
        fireEvent.click(loadButton);
        
        // Should not change URL
        expect(screen.getByTestId('react-player-direct')).toHaveAttribute('data-url', originalUrl);
        
        // Test valid URL with whitespace
        fireEvent.change(urlInput, { target: { value: '  https://youtube.com/watch?v=trimmed  ' } });
        fireEvent.click(loadButton);
        
        await waitFor(() => {
            expect(screen.getByTestId('react-player-direct')).toHaveAttribute('data-url', '  https://youtube.com/watch?v=trimmed  ');
        });
    });
});