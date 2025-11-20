/**
 * スクリーンショット機能に関するユーティリティ
 * Markdown内のプレースホルダー解析、タイムスタンプ変換、置換処理を提供
 */

export interface ScreenshotPlaceholder {
    /** プレースホルダー全文 (例: "[Screenshot: 01:23s]") */
    placeholder: string;
    /** タイムスタンプ文字列 (例: "01:23" または "83.5") */
    timestampStr: string;
    /** 秒数に変換されたタイムスタンプ */
    seconds: number;
}

/**
 * Markdown内の [Screenshot: XX:XXs] 形式のプレースホルダーを解析
 * @param markdown 解析対象のMarkdownテキスト
 * @returns 検出されたプレースホルダー情報の配列
 */
export function parseScreenshotPlaceholders(markdown: string): ScreenshotPlaceholder[] {
    // [Screenshot: XX:XX(s)] または [Screenshot: XX.XX(s)] の形式に対応
    const regex = /\[Screenshot:\s*(\d{1,2}:\d{2}(?:\.\d+)?|\d+(?:\.\d+)?)\s*s?\]/gi;
    const placeholders: ScreenshotPlaceholder[] = [];

    let match: RegExpExecArray | null;
    while ((match = regex.exec(markdown)) !== null) {
        const placeholder = match[0];
        const timestampStr = match[1];
        const seconds = parseTimestampToSeconds(timestampStr);

        placeholders.push({
            placeholder,
            timestampStr,
            seconds
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
 * スクリーンショット頻度に基づいたプロンプト指示文を生成
 * @param frequency スクリーンショット頻度 ('minimal' | 'moderate' | 'detailed')
 * @returns Geminiに追加するプロンプト指示文
 */
export function buildScreenshotPromptInstruction(
    frequency: 'minimal' | 'moderate' | 'detailed'
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

    return `${baseInstruction}${config.what}, please include screenshot references using this exact format: [Screenshot: XX:XXs] where XX:XX is the timestamp in MM:SS format (e.g., [Screenshot: 00:14s], [Screenshot: 01:23s]). ${config.usage}`;
}
