# スクリーンショット取得機能 実装詳細

本ドキュメントは、Web版 Document Encoder におけるスクリーンショット取得（画像埋め込み）機能の実装詳細について記述します。
デスクトップ版（Rust/Tauri）の実装ロジックを踏襲しつつ、WebAssembly (`ffmpeg.wasm`) を用いてブラウザ上で処理を完結させる設計とします。

## 1. 処理フロー概要

1.  **プロンプト指示**: ユーザーが画像埋め込みを有効にした場合、Geminiへのプロンプトに「特定のフォーマットでタイムスタンプを出力する」指示を追加します。
2.  **ドキュメント生成**: Gemini APIから生成されたMarkdownテキストを受け取ります。
3.  **プレースホルダー解析**: テキスト内の `[Screenshot: MM:SSs]` 形式のプレースホルダーを解析し、タイムスタンプを抽出します。
4.  **フレーム抽出**: `ffmpeg.wasm` を使用して、動画ファイルから該当するタイムスタンプのフレームを静止画（PNG）として抽出します。
5.  **画像保存と置換**: 抽出した画像をZIPファイルに追加し、Markdown内のプレースホルダーを画像リンクに置換します。

## 2. 実装詳細

### 2.1. プロンプト指示の注入

Geminiへのリクエスト生成時、設定された「埋込頻度」に応じて以下の指示文をシステムプロンプトまたはユーザープロンプトの末尾に追加します。

**指示文テンプレート (例: Moderate)**:
```text
IMPORTANT: When describing visual elements or important points in the document, please include screenshot references using this exact format: [Screenshot: XX:XXs] where XX:XX is the timestamp in MM:SS format (e.g., [Screenshot: 00:14s], [Screenshot: 01:23s]). Use these references to mark key moments that would benefit from visual representation.
```

**埋込頻度ごとの違い**:
- **Minimal**: "most critical visual elements", "Use these references sparingly"
- **Moderate**: "visual elements or important points", "Use these references to mark key moments"
- **Detailed**: "visual elements, UI components, or detailed explanations", "Use these references frequently"

### 2.2. タイムスタンプの解析

生成されたMarkdownテキストから、以下の正規表現を用いてプレースホルダーを検出します。

```typescript
const screenshotRegex = /\[Screenshot:\s*(\d{1,2}:\d{2}(?:\.\d+)?|\d+(?:\.\d+)?)\s*s\]/g;
```

**対応フォーマット**:
- `MM:SSs` (例: `01:23s`)
- `SS.SSs` (例: `83.5s`)

**解析ロジック**:
- `MM:SS` 形式の場合は `分 * 60 + 秒` で秒数（float）に変換します。
- `SS.SS` 形式の場合はそのまま秒数として扱います。

### 2.3. ffmpeg.wasm による画像抽出

ブラウザ上で `ffmpeg.wasm` を実行し、フレームを抽出します。

**依存ライブラリ**:
- `@ffmpeg/ffmpeg`
- `@ffmpeg/util`

**処理ステップ**:

1.  **FFmpegのロード**:
    ```typescript
    import { FFmpeg } from '@ffmpeg/ffmpeg';
    import { fetchFile } from '@ffmpeg/util';

    const ffmpeg = new FFmpeg();
    await ffmpeg.load({
        coreURL: "/assets/ffmpeg-core.js", // CDNまたはローカルパス
        wasmURL: "/assets/ffmpeg-core.wasm"
    });
    ```

2.  **ファイルの書き込み (MEMFS)**:
    ユーザーが選択した動画ファイル（Fileオブジェクト）をFFmpegの仮想ファイルシステムに書き込みます。
    ```typescript
    await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));
    ```

3.  **抽出コマンドの実行**:
    Rust版の実装同様、高速シーク（入力オプションとしての `-ss`）を利用します。
    ```typescript
    const timestamp = 123.45; // 秒数
    const outputFilename = `image-${index}.png`;

    await ffmpeg.exec([
        '-ss', timestamp.toString(), // シーク位置
        '-i', 'input.mp4',           // 入力ファイル
        '-vframes', '1',             // 1フレームのみ出力
        '-q:v', '2',                 // 品質設定 (1-31, 2は高品質)
        outputFilename               // 出力ファイル名
    ]);
    ```

4.  **画像の読み出し**:
    生成された画像データを読み出します。
    ```typescript
    const data = await ffmpeg.readFile(outputFilename);
    const blob = new Blob([data], { type: 'image/png' });
    ```

5.  **クリーンアップ**:
    メモリ圧迫を防ぐため、処理済みの画像ファイルは仮想ファイルシステムから削除します。
    ```typescript
    await ffmpeg.deleteFile(outputFilename);
    ```
    ※動画ファイル（`input.mp4`）は全ての抽出が終わるまで保持し、最後に削除します。

### 2.4. ドキュメントの構築

抽出した画像データと修正済みMarkdownをまとめてZIPファイルを作成します。

**ZIP構成**:
```
output.zip
├── document.md
└── images/
    ├── image-1.png
    ├── image-2.png
    └── ...
```

**Markdownの置換処理**:
Markdownテキスト内の `[Screenshot: 12:34s]` を `![Screenshot 1](./images/image-1.png)` に置換します。

## 3. 制約事項と対策

### 3.1. メモリ制限
ブラウザのWebAssembly環境（特に32bit環境やモバイル）ではメモリ制限が厳しいため、巨大な動画ファイルを一度に `writeFile` するとクラッシュする可能性があります。
- **初期対策**: 1GB程度までのファイルをサポート対象とし、それ以上は警告を表示します。
- **高度な対策 (将来)**: 動画を分割して読み込む等の処理が必要になる可能性がありますが、初期実装では行いません。

### 3.2. SharedArrayBuffer
`ffmpeg.wasm` のマルチスレッド機能を利用するためには、ホスティングサーバー（Cloudflare Pages）側で以下のHTTPヘッダーを設定する必要があります。

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

### 3.3. YouTube動画
YouTube動画モードでは動画ファイルの実体がブラウザ内に存在しないため、本機能（スクリーンショット抽出）は利用できません。UI上で画像埋め込みオプションを無効化します。
