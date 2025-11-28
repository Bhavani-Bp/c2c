/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom';

describe('URL Parsing and Validation', () => {
    const parseYouTubeUrl = (url: string): string | null => {
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname.includes('youtube.com')) {
                return urlObj.searchParams.get('v');
            } else if (urlObj.hostname.includes('youtu.be')) {
                return urlObj.pathname.slice(1).split('?')[0];
            }
            return null;
        } catch (e) {
            return null;
        }
    };

    test('should parse standard YouTube URL', () => {
        const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        expect(parseYouTubeUrl(url)).toBe('dQw4w9WgXcQ');
    });

    test('should parse YouTube short URL', () => {
        const url = 'https://youtu.be/dQw4w9WgXcQ';
        expect(parseYouTubeUrl(url)).toBe('dQw4w9WgXcQ');
    });

    test('should parse YouTube URL with timestamp', () => {
        const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s';
        expect(parseYouTubeUrl(url)).toBe('dQw4w9WgXcQ');
    });

    test('should parse YouTube URL with playlist', () => {
        const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLtest';
        expect(parseYouTubeUrl(url)).toBe('dQw4w9WgXcQ');
    });

    test('should handle mobile YouTube URLs', () => {
        const url = 'https://m.youtube.com/watch?v=dQw4w9WgXcQ';
        expect(parseYouTubeUrl(url)).toBe('dQw4w9WgXcQ');
    });

    test('should handle youtu.be with query parameters', () => {
        const url = 'https://youtu.be/dQw4w9WgXcQ?t=10';
        expect(parseYouTubeUrl(url)).toBe('dQw4w9WgXcQ');
    });

    test('should return null for invalid URLs', () => {
        expect(parseYouTubeUrl('not a url')).toBeNull();
        expect(parseYouTubeUrl('https://vimeo.com/12345')).toBeNull();
        expect(parseYouTubeUrl('https://example.com')).toBeNull();
    });

    test('should handle malformed YouTube URLs', () => {
        expect(parseYouTubeUrl('https://youtube.com/watch')).toBeNull();
        expect(parseYouTubeUrl('https://youtube.com/watch?x=123')).toBeNull();
    });

    test('should handle HTTP vs HTTPS', () => {
        const httpUrl = 'http://www.youtube.com/watch?v=test123';
        const httpsUrl = 'https://www.youtube.com/watch?v=test123';

        expect(parseYouTubeUrl(httpUrl)).toBe('test123');
        expect(parseYouTubeUrl(httpsUrl)).toBe('test123');
    });

    test('should handle URLs without www', () => {
        const url = 'https://youtube.com/watch?v=test123';
        expect(parseYouTubeUrl(url)).toBe('test123');
    });
});
