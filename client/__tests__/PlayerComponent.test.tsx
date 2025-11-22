import { render, screen } from '@testing-library/react';
import PlayerComponent from '../components/PlayerComponent';

// Mock ReactPlayer
jest.mock('react-player', () => {
    return function MockReactPlayer({ url, ...props }: any) {
        return (
            <div data-testid="react-player" data-url={url} {...props}>
                Mock Player: {url}
            </div>
        );
    };
});

describe('PlayerComponent', () => {
    test('shows loading state initially', () => {
        // Mock window as undefined initially
        Object.defineProperty(window, 'window', {
            value: undefined,
            writable: true
        });

        render(<PlayerComponent url="https://youtube.com/watch?v=test" />);
        
        expect(screen.getByText('Loading Player...')).toBeInTheDocument();
    });

    test('renders ReactPlayer when window is available', () => {
        // Mock window as available
        Object.defineProperty(window, 'window', {
            value: window,
            writable: true
        });

        render(<PlayerComponent url="https://youtube.com/watch?v=test" />);
        
        const player = screen.getByTestId('react-player');
        expect(player).toBeInTheDocument();
        expect(player).toHaveAttribute('data-url', 'https://youtube.com/watch?v=test');
    });

    test('updates URL when prop changes', () => {
        const { rerender } = render(<PlayerComponent url="https://youtube.com/watch?v=test1" />);
        
        let player = screen.getByTestId('react-player');
        expect(player).toHaveAttribute('data-url', 'https://youtube.com/watch?v=test1');
        
        rerender(<PlayerComponent url="https://youtube.com/watch?v=test2" />);
        
        player = screen.getByTestId('react-player');
        expect(player).toHaveAttribute('data-url', 'https://youtube.com/watch?v=test2');
    });

    test('handles empty URL', () => {
        render(<PlayerComponent url="" />);
        
        const player = screen.getByTestId('react-player');
        expect(player).toHaveAttribute('data-url', '');
    });

    test('handles various URL formats', () => {
        const urls = [
            'https://youtube.com/watch?v=test',
            'https://vimeo.com/123456',
            'https://example.com/video.mp4',
            'https://soundcloud.com/track'
        ];

        urls.forEach(url => {
            const { rerender } = render(<PlayerComponent url={url} />);
            const player = screen.getByTestId('react-player');
            expect(player).toHaveAttribute('data-url', url);
        });
    });
});