import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isValidYouTubeUrl, fetchYouTubeMetadata, fetchYouTubeTitle } from './youtube';

describe('YouTube Service', () => {
    describe('isValidYouTubeUrl', () => {
        it('should validate standard YouTube URLs', () => {
            expect(isValidYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
            expect(isValidYouTubeUrl('https://youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
            expect(isValidYouTubeUrl('http://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
        });

        it('should validate youtu.be short URLs', () => {
            expect(isValidYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
            expect(isValidYouTubeUrl('http://youtu.be/dQw4w9WgXcQ')).toBe(true);
        });

        it('should validate mobile YouTube URLs', () => {
            expect(isValidYouTubeUrl('https://m.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
        });

        it('should reject invalid URLs', () => {
            expect(isValidYouTubeUrl('https://www.example.com/video')).toBe(false);
            expect(isValidYouTubeUrl('https://vimeo.com/123456')).toBe(false);
            expect(isValidYouTubeUrl('not-a-url')).toBe(false);
            expect(isValidYouTubeUrl('')).toBe(false);
        });

        it('should reject non-YouTube domains', () => {
            expect(isValidYouTubeUrl('https://www.fakeyoutube.com/watch?v=123')).toBe(false);
            expect(isValidYouTubeUrl('https://youtube.evil.com/watch?v=123')).toBe(false);
        });
    });

    describe('fetchYouTubeMetadata', () => {
        beforeEach(() => {
            global.fetch = vi.fn();
        });

        it('should fetch metadata successfully', async () => {
            const mockMetadata = {
                title: 'Test Video',
                author_name: 'Test Author',
                provider_name: 'YouTube',
                thumbnail_url: 'https://example.com/thumb.jpg',
                html: '<iframe></iframe>'
            };

            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => mockMetadata
            });

            const result = await fetchYouTubeMetadata('https://www.youtube.com/watch?v=dQw4w9WgXcQ');

            expect(result).toEqual(mockMetadata);
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('youtube.com/oembed')
            );
        });

        it('should throw error for invalid URL', async () => {
            await expect(fetchYouTubeMetadata('https://www.example.com/video'))
                .rejects.toThrow('Invalid YouTube URL');
        });

        it('should throw error when video not found', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: false,
                status: 404
            });

            await expect(fetchYouTubeMetadata('https://www.youtube.com/watch?v=invalid'))
                .rejects.toThrow('Video not found');
        });

        it('should throw error on API failure', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error'
            });

            await expect(fetchYouTubeMetadata('https://www.youtube.com/watch?v=dQw4w9WgXcQ'))
                .rejects.toThrow('Failed to fetch metadata');
        });

        it('should handle network errors', async () => {
            (global.fetch as any).mockRejectedValue(new Error('Network error'));

            await expect(fetchYouTubeMetadata('https://www.youtube.com/watch?v=dQw4w9WgXcQ'))
                .rejects.toThrow('Network error');
        });
    });

    describe('fetchYouTubeTitle', () => {
        beforeEach(() => {
            global.fetch = vi.fn();
        });

        it('should fetch title from metadata', async () => {
            const mockMetadata = {
                title: 'Test Video Title',
                author_name: 'Test Author',
                provider_name: 'YouTube',
                thumbnail_url: 'https://example.com/thumb.jpg',
                html: '<iframe></iframe>'
            };

            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => mockMetadata
            });

            const title = await fetchYouTubeTitle('https://www.youtube.com/watch?v=dQw4w9WgXcQ');

            expect(title).toBe('Test Video Title');
        });

        it('should propagate errors from fetchYouTubeMetadata', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: false,
                status: 404
            });

            await expect(fetchYouTubeTitle('https://www.youtube.com/watch?v=invalid'))
                .rejects.toThrow('Video not found');
        });
    });
});
