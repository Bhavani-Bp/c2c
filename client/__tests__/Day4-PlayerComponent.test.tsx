import { render, screen, waitFor } from '@testing-library/react';
import PlayerComponent from '../components/PlayerComponent';

// Mock ReactPlayer
jest.mock('react-player', () => {
    return function MockReactPlayer({ url, controls, playing, ...props }: any) {
        return (
            <div 
                data-testid="react-player" 
                data-url={url}
                data-controls={controls}
                data-playing={playing}
                {...props}
            >
                Mock Player: {url}
            </div>
        );
    };
});

describe('Day 4 - PlayerComponent Tests', () => {
    beforeEach(() => {
        // Mock window object
        Object.defineProperty(window, 'window', {
            value: window,
            writable: true
        });
    });

    test('renders loading state on server-side', () => {
        // Mock window as undefined (SSR)
        Object.defineProperty(window, 'window', {
            value: undefined,
            writable: true
        });

        render(<PlayerComponent url="https://youtube.com/watch?v=test" />);
        
        expect(screen.getByText('Loading Player...')).toBeInTheDocument();
        expect(screen.queryByTestId('react-player')).not.toBeInTheDocument();
    });

    test('renders ReactPlayer with correct props', async () => {
        render(<PlayerComponent url="https://youtube.com/watch?v=test123" />);
        
        await waitFor(() => {
            const player = screen.getByTestId('react-player');
            expect(player).toBeInTheDocument();
            expect(player).toHaveAttribute('data-url', 'https://youtube.com/watch?v=test123');
            expect(player).toHaveAttribute('data-controls', 'true');
            expect(player).toHaveAttribute('data-playing', 'false');
        });
    });

    test('handles YouTube URLs correctly', async () => {
        const youtubeUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        render(<PlayerComponent url={youtubeUrl} />);
        
        await waitFor(() => {
            const player = screen.getByTestId('react-player');
            expect(player).toHaveAttribute('data-url', youtubeUrl);
        });
    });

    test('handles MP4 URLs correctly', async () => {
        const mp4Url = 'https://example.com/video.mp4';
        render(<PlayerComponent url={mp4Url} />);
        
        await waitFor(() => {
            const player = screen.getByTestId('react-player');
            expect(player).toHaveAttribute('data-url', mp4Url);
        });
    });

    test('handles Vimeo URLs correctly', async () => {
        const vimeoUrl = 'https://vimeo.com/123456789';
        render(<PlayerComponent url={vimeoUrl} />);
        
        await waitFor(() => {
            const player = screen.getByTestId('react-player');
            expect(player).toHaveAttribute('data-url', vimeoUrl);
        });
    });

    test('updates URL when prop changes', async () => {
        const { rerender } = render(<PlayerComponent url="https://youtube.com/watch?v=test1" />);
        
        await waitFor(() => {
            expect(screen.getByTestId('react-player')).toHaveAttribute('data-url', 'https://youtube.com/watch?v=test1');
        });
        
        rerender(<PlayerComponent url="https://youtube.com/watch?v=test2" />);
        
        await waitFor(() => {
            expect(screen.getByTestId('react-player')).toHaveAttribute('data-url', 'https://youtube.com/watch?v=test2');
        });
    });

    test('handles empty URL gracefully', async () => {
        render(<PlayerComponent url="" />);
        
        await waitFor(() => {
            const player = screen.getByTestId('react-player');
            expect(player).toHaveAttribute('data-url', '');
        });
    });

    test('has correct styling classes', () => {
        render(<PlayerComponent url="https://youtube.com/watch?v=test" />);
        
        const container = screen.getByTestId('react-player').parentElement;
        expect(container).toHaveClass('relative', 'w-full', 'h-full', 'bg-black', 'rounded-xl');
    });
});