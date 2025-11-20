# Document Encoder Web

Document Encoder Web は、動画ファイルの内容を解析し、Google Gemini API を使用して構造化されたドキュメント（Markdown）を生成するWebアプリケーションです。
以前のTauri版デスクトップアプリを、Web標準技術を用いてブラウザ上で動作するように移植したものです。

## ✨ 主な機能

- **ローカル動画処理**:
  - ブラウザ上で `ffmpeg.wasm` を使用して動画からスクリーンショットを抽出。
  - サーバーへの動画アップロード（解析用）とフレーム抽出をクライアントサイドで完結。
- **YouTube 動画対応**:
  - YouTubeのURLを指定して、Geminiに直接解析を依頼（※モデルの対応状況に依存）。
- **ドキュメント生成**:
  - Google Gemini Pro モデルを使用して、動画の内容を詳細に解説するMarkdownを作成。
  - 抽出した画像とMarkdownをZIPファイルとして一括ダウンロード。
- **設定管理**:
  - APIキーやモデル設定をブラウザの `localStorage` に保存。

## 🛠 技術スタック

- **Frontend**: React, TypeScript, Vite
- **Styling**: CSS Modules (Vanilla CSS)
- **Video Processing**: [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm) (Client-side)
- **AI Integration**: Google Gemini API
- **Hosting**: Cloudflare Pages (推奨)

## 🚀 始め方

### 前提条件

- Node.js (v18以上推奨)
- Google Gemini API Key

### インストール

```bash
npm install
```

### 開発サーバーの起動

```bash
npm run dev
```
ブラウザで `http://localhost:5173` を開いてください。

> [!NOTE]
> `ffmpeg.wasm` の高速化機能（SharedArrayBuffer）を利用するため、開発サーバーは以下のレスポンスヘッダーを返すように設定されています。
> - `Cross-Origin-Opener-Policy: same-origin`
> - `Cross-Origin-Embedder-Policy: require-corp`

### ビルド

```bash
npm run build
```
`dist` ディレクトリに静的ファイルが生成されます。

### テスト

```bash
npm test
```

## ☁️ デプロイ (Cloudflare Pages)

このプロジェクトは Cloudflare Pages へのデプロイに最適化されています。
`public/_headers` ファイルが含まれており、必要なセキュリティヘッダー（COOP/COEP）が自動的に適用されます。

1. Cloudflare Pages でリポジトリを接続。
2. ビルド設定:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Output directory**: `dist`

## ⚠️ 注意事項・制限

- **ブラウザ互換性**: `SharedArrayBuffer` をサポートするモダンブラウザ（Chrome, Edge, Firefox, Safari等）が必要です。
- **メモリ制限**: ブラウザのメモリ制限により、1GBを超えるような巨大な動画ファイルの処理はクラッシュする可能性があります。
- **セキュリティ**: APIキーはブラウザのローカルストレージに保存されます。共用PCなどでは使用後に設定を削除してください。

## 📄 ライセンス

[MIT License](LICENSE)
