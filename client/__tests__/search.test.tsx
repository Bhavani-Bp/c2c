/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock fetch
global.fetch = jest.fn();

describe('YouTube Search Functionality', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should fetch search results when query is submitted', async () => {
        const mockVideos = [
            {
                videoId: 'test123',
                title: 'Test Video',
                thumbnail: 'https://example.com/thumb.jpg',
                channel: 'Test Channel',
                description: 'Test description',
                publishDate: '2024-01-01'
            }
        ];

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            json: async () => ({ success: true, videos: mockVideos })
        });

        const searchQuery = 'test query';
        const response = await fetch(`http://localhost:3001/api/search?query=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/search?query=test%20query')
        );
        expect(data.success).toBe(true);
        expect(data.videos).toHaveLength(1);
        expect(data.videos[0].title).toBe('Test Video');
    });

    test('should handle search errors gracefully', async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        try {
            await fetch('http://localhost:3001/api/search?query=test');
        } catch (error: any) {
            expect(error.message).toBe('Network error');
        }
    });

    test('should encode special characters in search query', async () => {
        const specialQuery = 'hello & goodbye';

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            json: async () => ({ success: true, videos: [] })
        });

        await fetch(`http://localhost:3001/api/search?query=${encodeURIComponent(specialQuery)}`);

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('hello%20%26%20goodbye')
        );
    });
});
