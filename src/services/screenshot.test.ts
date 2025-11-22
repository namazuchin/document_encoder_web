import { describe, it, expect } from 'vitest';
import {
    parseTimestampToSeconds,
    parseScreenshotPlaceholders,
    replaceScreenshotsInMarkdown,
    buildScreenshotPromptInstruction,
    formatTimestampToFilename,
    removeFileExtension,
    sanitizeFilename,
    generateScreenshotFilename
} from './screenshot';

describe('screenshot service', () => {
    describe('parseTimestampToSeconds', () => {
        it('should parse MM:SS format', () => {
            expect(parseTimestampToSeconds('01:23')).toBe(83);
            expect(parseTimestampToSeconds('00:14')).toBe(14);
            expect(parseTimestampToSeconds('10:00')).toBe(600);
        });

        it('should parse MM:SS.SS format with decimals', () => {
            expect(parseTimestampToSeconds('01:23.5')).toBe(83.5);
            expect(parseTimestampToSeconds('00:14.25')).toBe(14.25);
        });

        it('should parse SS.SS format', () => {
            expect(parseTimestampToSeconds('83.5')).toBe(83.5);
            expect(parseTimestampToSeconds('14')).toBe(14);
            expect(parseTimestampToSeconds('120.75')).toBe(120.75);
        });
    });

    describe('parseScreenshotPlaceholders', () => {
        it('should find placeholders in MM:SS format', () => {
            const markdown = 'Some text [Screenshot: 01:23s] more text [Screenshot: 00:14s] end';
            const result = parseScreenshotPlaceholders(markdown);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                placeholder: '[Screenshot: 01:23s]',
                timestampStr: '01:23',
                seconds: 83
            });
            expect(result[1]).toEqual({
                placeholder: '[Screenshot: 00:14s]',
                timestampStr: '00:14',
                seconds: 14
            });
        });

        it('should find placeholders in SS.SS format', () => {
            const markdown = 'Text [Screenshot: 83.5s] and [Screenshot: 14s]';
            const result = parseScreenshotPlaceholders(markdown);

            expect(result).toHaveLength(2);
            expect(result[0].seconds).toBe(83.5);
            expect(result[1].seconds).toBe(14);
        });

        it('should handle mixed formats', () => {
            const markdown = '[Screenshot: 01:23s] and [Screenshot: 45.5s]';
            const result = parseScreenshotPlaceholders(markdown);

            expect(result).toHaveLength(2);
            expect(result[0].seconds).toBe(83);
            expect(result[1].seconds).toBe(45.5);
        });

        it('should return empty array when no placeholders found', () => {
            const markdown = 'No placeholders here';
            const result = parseScreenshotPlaceholders(markdown);

            expect(result).toHaveLength(0);
        });

        it('should handle case-insensitive matching', () => {
            const markdown = '[screenshot: 01:23s] and [SCREENSHOT: 00:14s]';
            const result = parseScreenshotPlaceholders(markdown);

            expect(result).toHaveLength(2);
        });
    });

    describe('replaceScreenshotsInMarkdown', () => {
        it('should replace placeholders with image links', () => {
            const markdown = 'Text [Screenshot: 01:23s] more text [Screenshot: 00:14s] end';
            const images = [
                { seconds: 83, filename: 'image-1.png' },
                { seconds: 14, filename: 'image-2.png' }
            ];

            const result = replaceScreenshotsInMarkdown(markdown, images);

            expect(result).toContain('![Screenshot 1](./images/image-1.png)');
            expect(result).toContain('![Screenshot 2](./images/image-2.png)');
            expect(result).not.toContain('[Screenshot:');
        });

        it('should handle timestamps with tolerance', () => {
            const markdown = '[Screenshot: 01:23s]';
            const images = [{ seconds: 83.3, filename: 'image-1.png' }]; // 0.3秒の差

            const result = replaceScreenshotsInMarkdown(markdown, images);

            expect(result).toContain('![Screenshot 1](./images/image-1.png)');
        });

        it('should not replace if timestamp difference is too large', () => {
            const markdown = '[Screenshot: 01:23s]';
            const images = [{ seconds: 90, filename: 'image-1.png' }]; // 7秒の差

            const result = replaceScreenshotsInMarkdown(markdown, images);

            expect(result).toBe(markdown); // 変更されない
        });
    });

    describe('buildScreenshotPromptInstruction', () => {
        it('should generate minimal frequency instruction', () => {
            const instruction = buildScreenshotPromptInstruction('minimal');

            expect(instruction).toContain('most critical visual elements');
            expect(instruction).toContain('sparingly');
            expect(instruction).toContain('[Screenshot: XX:XXs]');
        });

        it('should generate moderate frequency instruction', () => {
            const instruction = buildScreenshotPromptInstruction('moderate');

            expect(instruction).toContain('visual elements or important points');
            expect(instruction).toContain('key moments');
        });

        it('should generate detailed frequency instruction', () => {
            const instruction = buildScreenshotPromptInstruction('detailed');

            expect(instruction).toContain('visual elements, UI components');
            expect(instruction).toContain('frequently');
        });
    });

    describe('formatTimestampToFilename', () => {
        it('should format timestamps to hhmmssff format', () => {
            expect(formatTimestampToFilename(0)).toBe('00000000');
            expect(formatTimestampToFilename(83)).toBe('00012300');
            expect(formatTimestampToFilename(3661)).toBe('01010100');
        });

        it('should handle decimal seconds and convert to frames', () => {
            // 0.5 seconds at 30fps = frame 15
            expect(formatTimestampToFilename(0.5, 30)).toBe('00000015');
            // 1.5 seconds at 30fps = frame 15
            expect(formatTimestampToFilename(1.5, 30)).toBe('00000115');
        });

        it('should handle custom FPS', () => {
            // 0.5 seconds at 60fps = frame 30
            expect(formatTimestampToFilename(0.5, 60)).toBe('00000030');
            // 0.5 seconds at 24fps = frame 12
            expect(formatTimestampToFilename(0.5, 24)).toBe('00000012');
        });

        it('should pad values correctly', () => {
            // 1 hour, 2 minutes, 3 seconds, frame 4
            expect(formatTimestampToFilename(3723.133, 30)).toBe('01020303');
        });
    });

    describe('removeFileExtension', () => {
        it('should remove common video extensions', () => {
            expect(removeFileExtension('video.mp4')).toBe('video');
            expect(removeFileExtension('movie.avi')).toBe('movie');
            expect(removeFileExtension('clip.mov')).toBe('clip');
        });

        it('should handle multiple dots', () => {
            expect(removeFileExtension('my.video.file.mp4')).toBe('my.video.file');
        });

        it('should return original if no extension', () => {
            expect(removeFileExtension('noextension')).toBe('noextension');
        });

        it('should handle edge cases', () => {
            expect(removeFileExtension('.hiddenfile')).toBe('.hiddenfile');
            expect(removeFileExtension('file.')).toBe('file');
        });
    });

    describe('sanitizeFilename', () => {
        it('should replace spaces with underscores', () => {
            expect(sanitizeFilename('my video file')).toBe('my_video_file');
            expect(sanitizeFilename('test  file')).toBe('test__file');
        });

        it('should replace filesystem-forbidden characters', () => {
            expect(sanitizeFilename('file/name')).toBe('file_name');
            expect(sanitizeFilename('file\\name')).toBe('file_name');
            expect(sanitizeFilename('file:name')).toBe('file_name');
            expect(sanitizeFilename('file*name')).toBe('file_name');
            expect(sanitizeFilename('file?name')).toBe('file_name');
            expect(sanitizeFilename('file"name')).toBe('file_name');
            expect(sanitizeFilename('file<name')).toBe('file_name');
            expect(sanitizeFilename('file>name')).toBe('file_name');
            expect(sanitizeFilename('file|name')).toBe('file_name');
        });

        it('should handle multiple problematic characters', () => {
            expect(sanitizeFilename('my/video file:2024')).toBe('my_video_file_2024');
            // test<file>?*.txt has 3 forbidden chars (<, >, ?, *) resulting in 3 underscores
            expect(sanitizeFilename('test<file>?*.txt')).toBe('test_file___.txt');
        });

        it('should preserve safe characters', () => {
            expect(sanitizeFilename('video-file_123')).toBe('video-file_123');
            expect(sanitizeFilename('file.name.mp4')).toBe('file.name.mp4');
        });
    });

    describe('generateScreenshotFilename', () => {
        it('should generate filename without video extension', () => {
            const result = generateScreenshotFilename('video.mp4', 83);
            expect(result).toBe('video_00012300.jpg');
        });

        it('should sanitize spaces in filename', () => {
            const result = generateScreenshotFilename('my video.mp4', 14);
            expect(result).toBe('my_video_00001400.jpg');
        });

        it('should sanitize forbidden characters', () => {
            const result = generateScreenshotFilename('my/video:file.avi', 0);
            expect(result).toBe('my_video_file_00000000.jpg');
        });

        it('should handle complex filenames', () => {
            const result = generateScreenshotFilename('test file (2024).mov', 3661);
            expect(result).toBe('test_file_(2024)_01010100.jpg');
        });

        it('should include timestamp with frames', () => {
            const result = generateScreenshotFilename('clip.mp4', 83.5, 30);
            expect(result).toBe('clip_00012315.jpg');
        });

        it('should handle filenames with multiple extensions', () => {
            const result = generateScreenshotFilename('my.video.file.mp4', 0);
            expect(result).toBe('my.video.file_00000000.jpg');
        });
    });
});
