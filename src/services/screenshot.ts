/**
 * スクリーンショット機能に関するユーティリティ
 * Markdown内のプレースホルダー解析、タイムスタンプ変換、置換処理を提供
 */

export interface ScreenshotPlaceholder {
    /** プレースホルダー全文 (例: "[Screenshot: 01:23s]" または "[Screenshot: 01:23s | 100,200,300,400]") */
    placeholder: string;
    /** タイムスタンプ文字列 (例: "01:23" または "83.5") */
    timestampStr: string;
    /** 秒数に変換されたタイムスタンプ */
    seconds: number;
    /** クロップ情報 (ymin, xmin, ymax, xmax) - 0-1000 scale */
    crop?: {
        ymin: number;
        xmin: number;
        ymax: number;
        xmax: number;
    };
}

/**
 * Markdown内の [Screenshot: XX:XXs] または [Screenshot: XX:XXs | ymin,xmin,ymax,xmax] 形式のプレースホルダーを解析
 * @param markdown 解析対象のMarkdownテキスト
 * @returns 検出されたプレースホルダー情報の配列
 */
export function parseScreenshotPlaceholders(markdown: string): ScreenshotPlaceholder[] {
    // [Screenshot: XX:XX(s)] または [Screenshot: XX.XX(s)] または [Screenshot: XX:XXs | ymin,xmin,ymax,xmax] の形式に対応
    // Group 1: Timestamp
    // Group 2: Optional coordinates (e.g., "100,200,300,400")
    const regex = /\[Screenshot:\s*(\d{1,2}:\d{2}(?:\.\d+)?|\d+(?:\.\d+)?)\s*s?(?:\s*\|\s*(\d+,\d+,\d+,\d+))?\]/gi;
    const placeholders: ScreenshotPlaceholder[] = [];

    let match: RegExpExecArray | null;
    while ((match = regex.exec(markdown)) !== null) {
        const placeholder = match[0];
        const timestampStr = match[1];
        const coordsStr = match[2];
        const seconds = parseTimestampToSeconds(timestampStr);

        let crop: { ymin: number; xmin: number; ymax: number; xmax: number } | undefined;
        if (coordsStr) {
            const [ymin, xmin, ymax, xmax] = coordsStr.split(',').map(Number);
            if (!isNaN(ymin) && !isNaN(xmin) && !isNaN(ymax) && !isNaN(xmax)) {
                crop = { ymin, xmin, ymax, xmax };
            }
        }

        placeholders.push({
            placeholder,
            timestampStr,
            seconds,
            crop
        });
    }

    return placeholders;
}

/**
 * タイムスタンプ文字列を秒数に変換
 * @param timestamp "MM:SS" または "SS.SS" 形式の文字列
 * @returns 秒数 (浮動小数点)
 */
export function parseTimestampToSeconds(timestamp: string): number {
    if (timestamp.includes(':')) {
        // MM:SS 形式
        const [minutes, seconds] = timestamp.split(':').map(parseFloat);
        return minutes * 60 + seconds;
    } else {
        // SS.SS 形式
        return parseFloat(timestamp);
    }
}

/**
 * Markdown内のスクリーンショットプレースホルダーを画像リンクに置換
 * @param markdown 元のMarkdownテキスト
 * @param images タイムスタンプとファイル名のマッピング
 * @returns 置換後のMarkdownテキスト
 */
export function replaceScreenshotsInMarkdown(
    markdown: string,
    images: { seconds: number; filename: string }[]
): string {
    let result = markdown;
    const placeholders = parseScreenshotPlaceholders(markdown);

    // タイムスタンプでソート (降順) - 長いプレースホルダーから置換して重複を避ける
    const sortedPlaceholders = [...placeholders].sort((a, b) => b.seconds - a.seconds);

    sortedPlaceholders.forEach((ph, index) => {
        // 対応する画像を探す (許容誤差: 0.5秒)
        const image = images.find(img => Math.abs(img.seconds - ph.seconds) < 0.5);

        if (image) {
            // プレースホルダーを画像リンクに置換
            const imageLink = `![Screenshot ${index + 1}](./images/${image.filename})`;
            result = result.replace(ph.placeholder, imageLink);
        }
    });

    return result;
}

/**
 * 秒数をhhmmssff形式のファイル名に変換
 * @param seconds 秒数（浮動小数点）
 * @param fps フレームレート（デフォルト: 30）
 * @returns hhmmssff形式の文字列（例: "00123405"）
 */
export function formatTimestampToFilename(seconds: number, fps: number = 30): string {
    const totalSeconds = Math.floor(seconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    // 小数部分からフレーム番号を計算
    const fractionalPart = seconds - totalSeconds;
    const frame = Math.floor(fractionalPart * fps) % fps;

    return `${hours.toString().padStart(2, '0')}${minutes.toString().padStart(2, '0')}${secs.toString().padStart(2, '0')}${frame.toString().padStart(2, '0')}`;
}

/**
 * ファイル名から拡張子を除去
 * @param filename ファイル名
 * @returns 拡張子を除いたファイル名
 */
export function removeFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1 || lastDotIndex === 0) {
        return filename;
    }
    return filename.substring(0, lastDotIndex);
}

/**
 * ファイル名として使えない文字をサニタイズ
 * - 半角スペースを _ に置換
 * - ファイルシステムで禁止されている文字（/ \ : * ? " < > |）を _ に置換
 * @param filename サニタイズするファイル名
 * @returns サニタイズされたファイル名
 */
export function sanitizeFilename(filename: string): string {
    return filename
        .replace(/\s/g, '_')  // 半角スペースを _ に置換
        .replace(/[/\\:*?"<>|]/g, '_');  // ファイル名として使えない文字を _ に置換
}

/**
 * スクリーンショットのファイル名を生成
 * @param videoFilename 元の動画ファイル名
 * @param seconds タイムスタンプ（秒）
 * @param fps フレームレート（デフォルト: 30）
 * @returns サニタイズされたスクリーンショットファイル名
 */
export function generateScreenshotFilename(
    videoFilename: string,
    seconds: number,
    fps: number = 30
): string {
    const nameWithoutExt = removeFileExtension(videoFilename);
    const sanitized = sanitizeFilename(nameWithoutExt);
    const timestamp = formatTimestampToFilename(seconds, fps);
    return `${sanitized}_${timestamp}.jpg`;
}

/**
 * スクリーンショット頻度に基づいたプロンプト指示文を生成
 * @param frequency スクリーンショット頻度 ('minimal' | 'moderate' | 'detailed')
 * @param cropEnabled クロップ（切り抜き）を有効にするかどうか
 * @returns Geminiに追加するプロンプト指示文
 */
export function buildScreenshotPromptInstruction(
    frequency: 'minimal' | 'moderate' | 'detailed',
    cropEnabled: boolean = false
): string {
    const baseInstruction = `\n\nIMPORTANT: When describing`;

    const frequencyTexts = {
        minimal: {
            what: ' the most critical visual elements',
            usage: 'Use these references sparingly for only the most important moments.'
        },
        moderate: {
            what: ' visual elements or important points in the document',
            usage: 'Use these references to mark key moments that would benefit from visual representation.'
        },
        detailed: {
            what: ' visual elements, UI components, or detailed explanations',
            usage: 'Use these references frequently to provide comprehensive visual documentation.'
        }
    };

    const config = frequencyTexts[frequency];

    let formatInstruction = `please include screenshot references using this exact format: [Screenshot: XX:XXs] where XX:XX is the timestamp in MM:SS format.`;

    if (cropEnabled) {
        formatInstruction = `please include screenshot references using this exact format: [Screenshot: XX:XXs | ymin,xmin,ymax,xmax].
        - XX:XX is the timestamp in MM:SS format.
        - ymin,xmin,ymax,xmax are the bounding box coordinates in 0-1000 scale (relative to the video frame).
        - ymin is top, xmin is left, ymax is bottom, xmax is right.
        - If you want to capture the whole screen, omit the coordinates: [Screenshot: XX:XXs].
        - Example: [Screenshot: 01:23s | 100,200,500,600] to crop a specific region.`;
    }

    return `${baseInstruction}${config.what}, ${formatInstruction} ${config.usage}`;
}
