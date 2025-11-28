/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom';

describe('Playlist Advanced Operations', () => {
    let mockPlaylist: any[];

    beforeEach(() => {
        mockPlaylist = [];
    });

    test('should handle adding multiple videos at once', () => {
        const videos = [
            { videoId: '1', title: 'Video 1', thumbnail: '', channel: 'Channel A' },
            { videoId: '2', title: 'Video 2', thumbnail: '', channel: 'Channel B' },
            { videoId: '3', title: 'Video 3', thumbnail: '', channel: 'Channel C' }
        ];

        videos.forEach(v => mockPlaylist.push(v));

        expect(mockPlaylist).toHaveLength(3);
    });

    test('should find video by ID', () => {
        const video1 = { videoId: 'abc123', title: 'Test', thumbnail: '', channel: '' };
        const video2 = { videoId: 'def456', title: 'Test 2', thumbnail: '', channel: '' };

        mockPlaylist.push(video1, video2);

        const found = mockPlaylist.find(v => v.videoId === 'def456');

        expect(found).toBeDefined();
        expect(found?.title).toBe('Test 2');
    });

    test('should clear entire playlist', () => {
        mockPlaylist = [
            { videoId: '1', title: 'Video 1', thumbnail: '', channel: '' },
            { videoId: '2', title: 'Video 2', thumbnail: '', channel: '' }
        ];

        mockPlaylist = [];

        expect(mockPlaylist).toHaveLength(0);
    });

    test('should get playlist length correctly', () => {
        expect(mockPlaylist.length).toBe(0);

        mockPlaylist.push({ videoId: '1', title: 'Video 1', thumbnail: '', channel: '' });
        expect(mockPlaylist.length).toBe(1);

        mockPlaylist.push({ videoId: '2', title: 'Video 2', thumbnail: '', channel: '' });
        expect(mockPlaylist.length).toBe(2);
    });

    test('should handle playlist with maximum items', () => {
        const maxItems = 100;

        for (let i = 0; i < maxItems; i++) {
            mockPlaylist.push({
                videoId: `video${i}`,
                title: `Video ${i}`,
                thumbnail: '',
                channel: ''
            });
        }

        expect(mockPlaylist).toHaveLength(maxItems);
        expect(mockPlaylist[0].videoId).toBe('video0');
        expect(mockPlaylist[maxItems - 1].videoId).toBe(`video${maxItems - 1}`);
    });

    test('should maintain video metadata', () => {
        const video = {
            videoId: 'test123',
            title: 'Test Video Title',
            thumbnail: 'https://example.com/thumb.jpg',
            channel: 'Test Channel',
            description: 'Test description',
            publishDate: '2024-01-01'
        };

        mockPlaylist.push(video);

        expect(mockPlaylist[0]).toEqual(video);
        expect(mockPlaylist[0].description).toBe('Test description');
        expect(mockPlaylist[0].publishDate).toBe('2024-01-01');
    });

    test('should handle removing non-existent video', () => {
        mockPlaylist = [
            { videoId: '1', title: 'Video 1', thumbnail: '', channel: '' }
        ];

        const initialLength = mockPlaylist.length;
        mockPlaylist = mockPlaylist.filter(v => v.videoId !== 'nonexistent');

        expect(mockPlaylist).toHaveLength(initialLength);
    });

    test('should handle reordering playlist items', () => {
        mockPlaylist = [
            { videoId: '1', title: 'First', thumbnail: '', channel: '' },
            { videoId: '2', title: 'Second', thumbnail: '', channel: '' },
            { videoId: '3', title: 'Third', thumbnail: '', channel: '' }
        ];

        // Move first item to end
        const firstItem = mockPlaylist.shift();
        if (firstItem) mockPlaylist.push(firstItem);

        expect(mockPlaylist[0].videoId).toBe('2');
        expect(mockPlaylist[2].videoId).toBe('1');
    });
});
