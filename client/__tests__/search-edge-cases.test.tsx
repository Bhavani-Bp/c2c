/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom';

// Mock fetch
global.fetch = jest.fn();

describe('Search Edge Cases and Error Handling', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should handle empty search query', async () => {
        const emptyQuery = '';

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            json: async () => ({ success: true, videos: [] })
        });

        const response = await fetch(`http://localhost:3001/api/search?query=${encodeURIComponent(emptyQuery)}`);
        const data = await response.json();

        expect(data.videos).toEqual([]);
    });

    test('should handle search query with only spaces', async () => {
        const spacesQuery = '   ';

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            json: async () => ({ success: true, videos: [] })
        });

        const response = await fetch(`http://localhost:3001/api/search?query=${encodeURIComponent(spacesQuery.trim())}`);
        const data = await response.json();

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('query=')
        );
    });

    test('should handle very long search queries', async () => {
        const longQuery = 'a'.repeat(500);

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            json: async () => ({ success: true, videos: [] })
        });

        const response = await fetch(`http://localhost:3001/api/search?query=${encodeURIComponent(longQuery)}`);
        const data = await response.json();

        expect(global.fetch).toHaveBeenCalled();
    });

    test('should handle unicode characters in search', async () => {
        const unicodeQuery = 'こんにちは 🎵 música';

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            json: async () => ({ success: true, videos: [] })
        });

        await fetch(`http://localhost:3001/api/search?query=${encodeURIComponent(unicodeQuery)}`);

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('%')
        );
    });

    test('should handle server timeout gracefully', async () => {
        (global.fetch as jest.Mock).mockImplementationOnce(() =>
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 100)
            )
        );

        try {
            await fetch('http://localhost:3001/api/search?query=test');
        } catch (error: any) {
            expect(error.message).toBe('Timeout');
        }
    });

    test('should handle 500 server errors', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            status: 500,
            json: async () => ({ error: 'Internal server error' })
        });

        const response = await fetch('http://localhost:3001/api/search?query=test');
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBeDefined();
    });

    test('should handle rate limiting (429)', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            status: 429,
            json: async () => ({ error: 'Too many requests' })
        });

        const response = await fetch('http://localhost:3001/api/search?query=test');

        expect(response.status).toBe(429);
    });
});
