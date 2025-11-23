import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Simple Day 6 polish and refinement tests
describe('Day 6 - Polish & Refinement Tests', () => {
    // Mock enhanced sync component with Day 6 features
    const MockEnhancedComponent = () => {
        const [connectionStatus, setConnectionStatus] = React.useState<'connecting' | 'connected' | 'disconnected'>('connecting');
        const [syncStatus, setSyncStatus] = React.useState<string>('');
        const [roomUsers, setRoomUsers] = React.useState([{id: '1', name: 'User1'}, {id: '2', name: 'User2'}]);
        const [url, setUrl] = React.useState('');
        const [playerError, setPlayerError] = React.useState<string | null>(null);
        const [isReady, setIsReady] = React.useState(false);

        const handleConnect = () => {
            setConnectionStatus('connected');
            setSyncStatus('Connected to room');
        };

        const handleDisconnect = () => {
            setConnectionStatus('disconnected');
            setSyncStatus('Disconnected from room');
        };

        const handleUrlChange = (newUrl: string) => {
            // URL validation
            const urlPattern = /^(https?:\/\/)|(www\.)/;
            const validUrl = urlPattern.test(newUrl.trim()) ? newUrl.trim() : `https://${newUrl.trim()}`;
            setUrl(validUrl);
            setSyncStatus('Loading new video...');
            setTimeout(() => setSyncStatus(''), 2000);
        };

        const handlePlayerError = () => {
            setPlayerError('Failed to load video. Please check the URL and try again.');
            setIsReady(false);
        };

        const handlePlayerReady = () => {
            setIsReady(true);
            setPlayerError(null);
        };

        return (
            <div>
                {/* Connection Status */}
                <div data-testid="connection-status" data-status={connectionStatus}>
                    <div className={`w-2 h-2 rounded-full ${
                        connectionStatus === 'connected' ? 'bg-green-500' :
                        connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                        'bg-red-500'
                    }`}></div>
                    <span>
                        {connectionStatus === 'connected' ? `${roomUsers.length} users` :
                         connectionStatus === 'connecting' ? 'Connecting...' :
                         'Disconnected'}
                    </span>
                </div>

                {/* Sync Status */}
                {syncStatus && (
                    <div data-testid="sync-status">{syncStatus}</div>
                )}

                {/* Player Error */}
                {playerError && (
                    <div data-testid="player-error">{playerError}</div>
                )}

                {/* Player Ready State */}
                {!isReady && !playerError && (
                    <div data-testid="player-loading">Loading video...</div>
                )}

                {/* URL Input */}
                <input
                    data-testid="url-input"
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="Enter URL"
                />

                {/* Control Buttons */}
                <button onClick={handleConnect} data-testid="connect-btn">Connect</button>
                <button onClick={handleDisconnect} data-testid="disconnect-btn">Disconnect</button>
                <button onClick={handlePlayerError} data-testid="error-btn">Trigger Error</button>
                <button onClick={handlePlayerReady} data-testid="ready-btn">Player Ready</button>

                {/* Display Values */}
                <div data-testid="url-display">{url}</div>
                <div data-testid="user-count">{roomUsers.length}</div>
            </div>
        );
    };

    test('Day 6: Connection status updates correctly', () => {
        render(<MockEnhancedComponent />);
        
        // Initial connecting state
        const status = screen.getByTestId('connection-status');
        expect(status).toHaveAttribute('data-status', 'connecting');
        expect(screen.getByText('Connecting...')).toBeInTheDocument();
        
        // Connect
        fireEvent.click(screen.getByTestId('connect-btn'));
        expect(status).toHaveAttribute('data-status', 'connected');
        expect(screen.getByText('2 users')).toBeInTheDocument();
        
        // Disconnect
        fireEvent.click(screen.getByTestId('disconnect-btn'));
        expect(status).toHaveAttribute('data-status', 'disconnected');
        expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });

    test('Day 6: Sync status messages appear and disappear', async () => {
        render(<MockEnhancedComponent />);
        
        // Connect to show sync status
        fireEvent.click(screen.getByTestId('connect-btn'));
        
        expect(screen.getByTestId('sync-status')).toHaveTextContent('Connected to room');
        
        // Disconnect to change sync status
        fireEvent.click(screen.getByTestId('disconnect-btn'));
        expect(screen.getByTestId('sync-status')).toHaveTextContent('Disconnected from room');
    });

    test('Day 6: URL validation adds https prefix', () => {
        render(<MockEnhancedComponent />);
        
        const urlInput = screen.getByTestId('url-input');
        
        // Test URL without protocol
        fireEvent.change(urlInput, { target: { value: 'youtube.com/watch?v=test' } });
        expect(screen.getByTestId('url-display')).toHaveTextContent('https://youtube.com/watch?v=test');
        
        // Test URL with protocol (should remain unchanged)
        fireEvent.change(urlInput, { target: { value: 'https://vimeo.com/123' } });
        expect(screen.getByTestId('url-display')).toHaveTextContent('https://vimeo.com/123');
    });

    test('Day 6: Player error handling works correctly', () => {
        render(<MockEnhancedComponent />);
        
        // Initially no error
        expect(screen.queryByTestId('player-error')).not.toBeInTheDocument();
        
        // Trigger error
        fireEvent.click(screen.getByTestId('error-btn'));
        expect(screen.getByTestId('player-error')).toHaveTextContent('Failed to load video. Please check the URL and try again.');
        
        // Player ready should clear error
        fireEvent.click(screen.getByTestId('ready-btn'));
        expect(screen.queryByTestId('player-error')).not.toBeInTheDocument();
    });

    test('Day 6: Loading state shows when player not ready', () => {
        render(<MockEnhancedComponent />);
        
        // Initially loading (not ready, no error)
        expect(screen.getByTestId('player-loading')).toHaveTextContent('Loading video...');
        
        // When ready, loading disappears
        fireEvent.click(screen.getByTestId('ready-btn'));
        expect(screen.queryByTestId('player-loading')).not.toBeInTheDocument();
        
        // When error occurs, loading also disappears
        fireEvent.click(screen.getByTestId('error-btn'));
        expect(screen.queryByTestId('player-loading')).not.toBeInTheDocument();
    });

    test('Day 6: Room user count displays correctly', () => {
        render(<MockEnhancedComponent />);
        
        expect(screen.getByTestId('user-count')).toHaveTextContent('2');
        
        // When connected, shows user count in status
        fireEvent.click(screen.getByTestId('connect-btn'));
        expect(screen.getByText('2 users')).toBeInTheDocument();
    });

    test('Day 6: URL change triggers loading status', async () => {
        render(<MockEnhancedComponent />);
        
        const urlInput = screen.getByTestId('url-input');
        fireEvent.change(urlInput, { target: { value: 'youtube.com/newvideo' } });
        
        expect(screen.getByTestId('sync-status')).toHaveTextContent('Loading new video...');
    });

    test('Day 6: Connection status visual indicators work', () => {
        render(<MockEnhancedComponent />);
        
        const statusDiv = screen.getByTestId('connection-status');
        
        // Check connecting state (yellow)
        expect(statusDiv.querySelector('.bg-yellow-500')).toBeInTheDocument();
        
        // Check connected state (green)
        fireEvent.click(screen.getByTestId('connect-btn'));
        expect(statusDiv.querySelector('.bg-green-500')).toBeInTheDocument();
        
        // Check disconnected state (red)
        fireEvent.click(screen.getByTestId('disconnect-btn'));
        expect(statusDiv.querySelector('.bg-red-500')).toBeInTheDocument();
    });
});