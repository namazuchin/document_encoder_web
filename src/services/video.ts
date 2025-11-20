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
        timestamps: number[],
        onProgress?: (percent: number) => void
    ): Promise<Blob[]> {
        if (!this.loaded) await this.load();

        const inputName = 'input.mp4';
        await this.ffmpeg.writeFile(inputName, await fetchFile(file));

        const screenshots: Blob[] = [];
        const total = timestamps.length;

        for (let i = 0; i < total; i++) {
            const time = timestamps[i];
            const outputName = `frame_${i}.png`;

            // -ss before -i is faster (seek)
            await this.ffmpeg.exec([
                '-ss', time.toString(),
                '-i', inputName,
                '-frames:v', '1',
                '-q:v', '2',  // 品質設定 (1-31, 2は高品質)
                outputName
            ]);

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
