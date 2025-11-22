/**
 * YouTube oEmbed API Service
 * 
 * YouTube動画のメタデータを取得するためのサービス
 * APIキー不要でタイトルなどの基本情報を取得できます
 */

export interface YouTubeMetadata {
    title: string;
    author_name: string;
    provider_name: string;
    thumbnail_url: string;
    html: string;
}

/**
 * YouTube URLが有効かどうかをチェック
 */
export function isValidYouTubeUrl(url: string): boolean {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase();

        // youtu.be または youtube.com を許可
        return (
            hostname === 'www.youtube.com' ||
            hostname === 'youtube.com' ||
            hostname === 'youtu.be' ||
            hostname === 'm.youtube.com'
        );
    } catch {
        return false;
    }
}

/**
 * YouTube oEmbed APIを使用して動画のメタデータを取得
 * 
 * @param url - YouTube動画のURL
 * @returns メタデータオブジェクト
 * @throws URLが無効な場合、またはAPIリクエストが失敗した場合にエラーをスロー
 */
export async function fetchYouTubeMetadata(url: string): Promise<YouTubeMetadata> {
    // URL検証
    if (!isValidYouTubeUrl(url)) {
        throw new Error('Invalid YouTube URL');
    }

    // oEmbed APIエンドポイント
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;

    try {
        const response = await fetch(oembedUrl);

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Video not found');
            }
            throw new Error(`Failed to fetch metadata: ${response.statusText}`);
        }

        const data: YouTubeMetadata = await response.json();
        return data;
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Unknown error occurred while fetching YouTube metadata');
    }
}

/**
 * YouTube URLからタイトルを取得（簡易版）
 * 
 * @param url - YouTube動画のURL
 * @returns 動画のタイトル
 */
export async function fetchYouTubeTitle(url: string): Promise<string> {
    const metadata = await fetchYouTubeMetadata(url);
    return metadata.title;
}
