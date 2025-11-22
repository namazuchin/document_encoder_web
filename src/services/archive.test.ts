import { describe, it, expect } from 'vitest';
import { ArchiveService } from '../services/archive';
import JSZip from 'jszip';

describe('ArchiveService', () => {
    it('should create a zip file with markdown and images', async () => {
        const markdown = '# Test Document';
        const images = [
            { blob: new Blob(['fake-image-data'], { type: 'image/png' }), name: 'test.png' }
        ];

        const zipBlob = await ArchiveService.createZip(markdown, images);
        expect(zipBlob).toBeInstanceOf(Blob);

        // Verify zip content
        const zip = await JSZip.loadAsync(zipBlob);

        const mdContent = await zip.file('document.md')?.async('string');
        expect(mdContent).toBe(markdown);

        const imgContent = await zip.folder('images')?.file('test.png')?.async('string');
        expect(imgContent).toBe('fake-image-data');
    });

    it('should create a zip file with custom markdown filename', async () => {
        const markdown = '# Custom Document';
        const images = [
            { blob: new Blob(['image-data'], { type: 'image/png' }), name: 'img.png' }
        ];
        const customFileName = 'my_video.md';

        const zipBlob = await ArchiveService.createZip(markdown, images, customFileName);
        expect(zipBlob).toBeInstanceOf(Blob);

        // Verify zip content
        const zip = await JSZip.loadAsync(zipBlob);

        const mdContent = await zip.file(customFileName)?.async('string');
        expect(mdContent).toBe(markdown);

        const imgContent = await zip.folder('images')?.file('img.png')?.async('string');
        expect(imgContent).toBe('image-data');
    });
});
