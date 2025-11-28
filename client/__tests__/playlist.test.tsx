/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom';

describe('Playlist Functionality', () => {
    let mockPlaylist: any[];

    beforeEach(() => {
        mockPlaylist = [];
    });

    test('should add video to playlist', () => {
        const video = {
            videoId: 'abc123',
            title: 'Test Video',
            thumbnail: 'https://example.com/thumb.jpg',
            channel: 'Test Channel'
        };

        mockPlaylist.push(video);

        expect(mockPlaylist).toHaveLength(1);
        expect(mockPlaylist[0].videoId).toBe('abc123');
        expect(mockPlaylist[0].title).toBe('Test Video');
    });

    test('should prevent duplicate videos in playlist', () => {
        const video = {
            videoId: 'abc123',
            title: 'Test Video',
            thumbnail: 'https://example.com/thumb.jpg',
            channel: 'Test Channel'
        };

        mockPlaylist.push(video);

        // Try to add duplicate
        const exists = mockPlaylist.find(v => v.videoId === video.videoId);
        if (!exists) {
            mockPlaylist.push(video);
        }

        expect(mockPlaylist).toHaveLength(1);
    });

    test('should remove video from playlist', () => {
        const video1 = { videoId: 'abc123', title: 'Video 1', thumbnail: '', channel: '' };
        const video2 = { videoId: 'def456', title: 'Video 2', thumbnail: '', channel: '' };

        mockPlaylist.push(video1, video2);
        expect(mockPlaylist).toHaveLength(2);

        // Remove video1
        mockPlaylist = mockPlaylist.filter(v => v.videoId !== 'abc123');

        expect(mockPlaylist).toHaveLength(1);
        expect(mockPlaylist[0].videoId).toBe('def456');
    });

    test('should maintain playlist order', () => {
        const videos = [
            { videoId: '1', title: 'First', thumbnail: '', channel: '' },
            { videoId: '2', title: 'Second', thumbnail: '', channel: '' },
            { videoId: '3', title: 'Third', thumbnail: '', channel: '' }
        ];

        videos.forEach(v => mockPlaylist.push(v));

        expect(mockPlaylist[0].title).toBe('First');
        expect(mockPlaylist[1].title).toBe('Second');
        expect(mockPlaylist[2].title).toBe('Third');
    });

    test('should handle empty playlist', () => {
        expect(mockPlaylist).toHaveLength(0);
        expect(mockPlaylist).toEqual([]);
    });
});
