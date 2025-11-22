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

    async getVideoDuration(file: File): Promise<number> {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = () => {
                URL.revokeObjectURL(video.src);
                resolve(video.duration);
            };
            video.onerror = () => reject(new Error("Failed to load video metadata"));
            video.src = URL.createObjectURL(file);
        });
    }

    async extractFrames(
        file: File,
        targets: { timestamp: number; crop?: { x: number; y: number; w: number; h: number } }[],
        onProgress?: (percent: number) => void
    ): Promise<Blob[]> {
        if (!this.loaded) await this.load();

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
                // crop=w:h:x:y
                args.push('-vf', `crop=${crop.w}:${crop.h}:${crop.x}:${crop.y}`);
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
