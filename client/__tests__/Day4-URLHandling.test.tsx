import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RoomClient from '../components/RoomClient';
import { io } from 'socket.io-client';

// Mock socket.io-client
jest.mock('socket.io-client');
const mockIo = io as jest.MockedFunction<typeof io>;

// Mock PlayerComponent
jest.mock('../components/PlayerComponent', () => {
    return function MockPlayerComponent({ url }: { url: string }) {
        return <div data-testid="player-component" data-url={url}>Player: {url}</div>;
    };
});

describe('Day 4 - URL Handling Tests', () => {
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

    test('renders URL input field correctly', () => {
        render(<RoomClient roomId="test123" userName="TestUser" />);
        
        const urlInput = screen.getByPlaceholderText('Try: https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
        expect(urlInput).toBeInTheDocument();
        expect(urlInput).toHaveValue('');
        
        const loadButton = screen.getByText('Load');
        expect(loadButton).toBeInTheDocument();
    });

    test('starts with empty video URL', () => {
        render(<RoomClient roomId="test123" userName="TestUser" />);
        
        // When URL is empty, PlayerComponent is not rendered, instead shows "No video loaded" message
        expect(screen.getByText('No video loaded')).toBeInTheDocument();
        expect(screen.queryByTestId('player-component')).not.toBeInTheDocument();
    });

    test('updates video URL when form submitted', async () => {
        render(<RoomClient roomId="test123" userName="TestUser" />);
        
        const urlInput = screen.getByPlaceholderText('Try: https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
        const loadButton = screen.getByText('Load');
        
        fireEvent.change(urlInput, { target: { value: 'https://youtube.com/watch?v=newvideo' } });
        fireEvent.click(loadButton);
        
        await waitFor(() => {
            const player = screen.getByTestId('player-component');
            expect(player).toHaveAttribute('data-url', 'https://youtube.com/watch?v=newvideo');
        });
    });

    test('clears input field after loading URL', async () => {
        render(<RoomClient roomId="test123" userName="TestUser" />);
        
        const urlInput = screen.getByPlaceholderText('Try: https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4') as HTMLInputElement;
        const loadButton = screen.getByText('Load');
        
        fireEvent.change(urlInput, { target: { value: 'https://youtube.com/watch?v=test' } });
        expect(urlInput.value).toBe('https://youtube.com/watch?v=test');
        
        fireEvent.click(loadButton);
        
        await waitFor(() => {
            expect(urlInput.value).toBe('');
        });
    });

    test('handles various video URL formats', async () => {
        const testUrls = [
            'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'https://vimeo.com/123456789',
            'https://example.com/video.mp4',
            'https://soundcloud.com/artist/track',
            'https://www.twitch.tv/videos/123456789'
        ];

        render(<RoomClient roomId="test123" userName="TestUser" />);
        
        const urlInput = screen.getByPlaceholderText('Try: https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
        const loadButton = screen.getByText('Load');
        
        for (const url of testUrls) {
            fireEvent.change(urlInput, { target: { value: url } });
            fireEvent.click(loadButton);
            
            await waitFor(() => {
                const player = screen.getByTestId('player-component');
                expect(player).toHaveAttribute('data-url', url);
            });
        }
    });

    test('prevents submission with empty URL', () => {
        render(<RoomClient roomId="test123" userName="TestUser" />);
        
        const urlInput = screen.getByPlaceholderText('Try: https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
        const loadButton = screen.getByText('Load');
        
        // Ensure we start with empty URL (no player component rendered)
        expect(screen.getByText('No video loaded')).toBeInTheDocument();
        expect(screen.queryByTestId('player-component')).not.toBeInTheDocument();
        
        // Try to submit empty URL
        fireEvent.change(urlInput, { target: { value: '' } });
        fireEvent.click(loadButton);
        
        // URL should remain unchanged (empty) - still shows "No video loaded"
        expect(screen.getByText('No video loaded')).toBeInTheDocument();
        expect(screen.queryByTestId('player-component')).not.toBeInTheDocument();
    });

    test('handles form submission via Enter key', async () => {
        render(<RoomClient roomId="test123" userName="TestUser" />);
        
        const urlInput = screen.getByPlaceholderText('Try: https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
        
        fireEvent.change(urlInput, { target: { value: 'https://youtube.com/watch?v=enterkey' } });
        fireEvent.submit(urlInput.closest('form')!);
        
        await waitFor(() => {
            const player = screen.getByTestId('player-component');
            expect(player).toHaveAttribute('data-url', 'https://youtube.com/watch?v=enterkey');
        });
    });

    test('handles malformed URLs gracefully', async () => {
        render(<RoomClient roomId="test123" userName="TestUser" />);
        
        const urlInput = screen.getByPlaceholderText('Try: https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
        const loadButton = screen.getByText('Load');
        
        const malformedUrls = [
            { input: 'not-a-url', expected: 'https://not-a-url' }, // RoomClient adds https:// prefix
            { input: 'http://', expected: 'https://http://' }, // RoomClient adds https:// even if http:// is present but incomplete
            { input: 'youtube.com/watch', expected: 'https://youtube.com/watch' },
            { input: 'ftp://example.com/video.mp4', expected: 'https://ftp://example.com/video.mp4' } // RoomClient checks for 'http' not 'http://', so ftp:// gets https:// prepended
        ];
        
        for (const { input, expected } of malformedUrls) {
            fireEvent.change(urlInput, { target: { value: input } });
            fireEvent.click(loadButton);
            
            await waitFor(() => {
                const player = screen.getByTestId('player-component');
                expect(player).toHaveAttribute('data-url', expected);
            });
        }
    });

    test('URL input has correct styling and attributes', () => {
        render(<RoomClient roomId="test123" userName="TestUser" />);
        
        const urlInput = screen.getByPlaceholderText('Try: https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
        
        expect(urlInput).toHaveAttribute('type', 'text');
        expect(urlInput).toHaveClass('flex-1', 'bg-zinc-950', 'border', 'border-zinc-700');
        
        const loadButton = screen.getByText('Load');
        expect(loadButton).toHaveAttribute('type', 'submit');
        expect(loadButton).toHaveClass('px-4', 'py-2', 'bg-zinc-800');
    });
});