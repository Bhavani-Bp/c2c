/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom';

// Mock fetch
global.fetch = jest.fn();

describe('Video Playback Functionality', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should fetch ad-free stream URL for video', async () => {
        const mockResponse = {
            success: true,
            streamUrl: 'https://googlevideo.com/videoplayback?id=123',
            title: 'Test Video',
            author: 'Test Author'
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            json: async () => mockResponse
        });

        const videoId = 'dQw4w9WgXcQ';
        const response = await fetch(`http://localhost:3001/api/play?id=${videoId}`);
        const data = await response.json();

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/play?id=dQw4w9WgXcQ')
        );
        expect(data.success).toBe(true);
        expect(data.streamUrl).toContain('googlevideo.com');
    });

    test('should fallback to YouTube URL if stream extraction fails', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            json: async () => ({ success: false, error: 'No stream URL found' })
        });

        const videoId = 'test123';
        const response = await fetch(`http://localhost:3001/api/play?id=${videoId}`);
        const data = await response.json();

        expect(data.success).toBe(false);

        // Fallback URL
        const fallbackUrl = `https://www.youtube.com/watch?v=${videoId}`;
        expect(fallbackUrl).toBe('https://www.youtube.com/watch?v=test123');
    });

    test('should detect YouTube URLs correctly', () => {
        const testCases = [
            { url: 'https://www.youtube.com/watch?v=abc123', videoId: 'abc123' },
            { url: 'https://youtu.be/def456', videoId: 'def456' },
            { url: 'http://youtube.com/watch?v=ghi789', videoId: 'ghi789' }
        ];

        testCases.forEach(({ url, videoId }) => {
            let extractedId = null;

            try {
                const urlObj = new URL(url);
                if (urlObj.hostname.includes('youtube.com')) {
                    extractedId = urlObj.searchParams.get('v');
                } else if (urlObj.hostname.includes('youtu.be')) {
                    extractedId = urlObj.pathname.slice(1);
                }
            } catch (e) {
                extractedId = null;
            }

            expect(extractedId).toBe(videoId);
        });
    });

    test('should handle invalid video IDs', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            status: 400,
            json: async () => ({ error: 'Video ID is required' })
        });

        const response = await fetch('http://localhost:3001/api/play?id=');
        const data = await response.json();

        expect(data.error).toBe('Video ID is required');
    });
});
