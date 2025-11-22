import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export class VideoProcessor {
    private ffmpeg: FFmpeg;
    private loaded = false;

    constructor() {
        this.ffmpeg = new FFmpeg();
    }

    async load() {
        if (this.loaded) return;
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
        await this.ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        this.loaded = true;
    }

    async getVideoMetadata(file: File): Promise<{ duration: number; width: number; height: number }> {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = () => {
                const metadata = {
                    duration: video.duration,
                    width: video.videoWidth,
                    height: video.videoHeight
                };
                URL.revokeObjectURL(video.src);
                resolve(metadata);
            };
            video.onerror = () => reject(new Error("Failed to load video metadata"));
            video.src = URL.createObjectURL(file);
        });
    }

    async extractFrames(
        file: File,
        targets: { timestamp: number; crop?: { ymin: number; xmin: number; ymax: number; xmax: number } }[],
        onProgress?: (percent: number) => void
    ): Promise<Blob[]> {
        if (!this.loaded) await this.load();

        // Get video metadata for coordinate conversion
        const { width, height } = await this.getVideoMetadata(file);

        const inputName = 'input.mp4';
        await this.ffmpeg.writeFile(inputName, await fetchFile(file));

        const screenshots: Blob[] = [];
        const total = targets.length;

        for (let i = 0; i < total; i++) {
            const { timestamp, crop } = targets[i];
            const outputName = `frame_${i}.png`;

            const args = [
                '-ss', timestamp.toString(),
                '-i', inputName,
                '-frames:v', '1',
                '-q:v', '2',  // 品質設定 (1-31, 2は高品質)
            ];

            if (crop) {
                // Convert relative coordinates (0-1000) to pixels
                // ymin, xmin, ymax, xmax -> x, y, w, h
                const x = Math.round((crop.xmin / 1000) * width);
                const y = Math.round((crop.ymin / 1000) * height);
                const w = Math.round(((crop.xmax - crop.xmin) / 1000) * width);
                const h = Math.round(((crop.ymax - crop.ymin) / 1000) * height);

                // Ensure valid bounds
                const safeX = Math.max(0, Math.min(x, width - 1));
                const safeY = Math.max(0, Math.min(y, height - 1));
                const safeW = Math.max(1, Math.min(w, width - safeX));
                const safeH = Math.max(1, Math.min(h, height - safeY));

                // crop=w:h:x:y
                args.push('-vf', `crop=${safeW}:${safeH}:${safeX}:${safeY}`);
            }

            args.push(outputName);

            // -ss before -i is faster (seek)
            await this.ffmpeg.exec(args);

            const data = await this.ffmpeg.readFile(outputName) as Uint8Array;
            screenshots.push(new Blob([new Uint8Array(data)], { type: 'image/png' }));

            // Cleanup output file
            await this.ffmpeg.deleteFile(outputName);

            if (onProgress) {
                onProgress(((i + 1) / total) * 100);
            }
        }

        // Cleanup input file
        await this.ffmpeg.deleteFile(inputName);

        return screenshots;
    }
}
