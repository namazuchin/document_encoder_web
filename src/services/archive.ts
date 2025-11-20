import JSZip from 'jszip';

export const ArchiveService = {
    async createZip(
        markdown: string,
        images: { blob: Blob; name: string }[]
    ): Promise<Blob> {
        const zip = new JSZip();

        // Add markdown file
        zip.file("document.md", markdown);

        // Add images folder
        const imgFolder = zip.folder("images");
        if (imgFolder) {
            images.forEach(img => {
                imgFolder.file(img.name, img.blob);
            });
        }

        return await zip.generateAsync({ type: "blob" });
    }
};
