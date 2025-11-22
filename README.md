# Document Encoder Web

Document Encoder Web は、動画ファイルの内容を解析し、Google Gemini API を使用して構造化されたドキュメント（Markdown）を生成するWebアプリケーションです。
以前のTauri版デスクトップアプリを、Web標準技術を用いてブラウザ上で動作するように移植したものです。

## ✨ 主な機能

- **ローカル動画処理**:
  - ブラウザ上で `ffmpeg.wasm` を使用して動画からスクリーンショットを抽出。
  - **複数ファイル対応**: 複数の動画ファイルを同時にアップロード・処理可能。各動画は順序に処理され、生成されたドキュメントは自動的にマージされます。
  - サーバーへの動画アップロード（解析用）とフレーム抽出をクライアントサイドで完結。
  - 動画ファイルはGemini APIのみにアップロードされます。
- **YouTube 動画対応**:
  - YouTubeのURLを指定して、Geminiに直接解析を依頼（※モデルの対応状況に依存）。
  - YouTubeモードではスクリーンショット埋め込み機能は利用できません。
- **ドキュメント生成**:
  - Google Gemini Pro モデルを使用して、動画の内容を詳細に解説するMarkdownを作成。
  - 抽出した画像とMarkdownをZIPファイルとして一括ダウンロード。
- **スクリーンショット管理**:
  - **抽出頻度の制御**: Minimal（少なめ）/ Moderate（普通）/ Detailed（多め）から選択。
  - 選択した頻度に応じて、システムプロンプトが自動生成されGeminiに送信されます。
  - 複数ファイル処理時は、各ファイルのスクリーンショットにタイムスタンプを付けて管理。
- **プロンプトプリセット管理**:
  - **組み込みプリセット**: 動画要約、技術文書化、会議議事録、字幕抽出の4種類。
  - **カスタムプリセット**: 独自のプロンプトテンプレートを作成・保存・管理可能。
- **設定管理**:
  - APIキーやモデル設定をブラウザの `localStorage` に保存。
  - **設定のインポート/エクスポート**: JSON形式で設定をバックアップ・復元可能（APIキーは除外）。
  - **ダッシュボード状態の永続化**: ビデオソース選択やプロンプト設定をIndexedDB/LocalStorageに自動保存し、ブラウザ再起動後も状態を復元。

## 🛠 技術スタック

- **Frontend**: React 19.2, TypeScript, Vite 7.2
- **UI Framework**: Chakra UI v3.29 (CSS-in-JS with Emotion)
- **Styling**: Emotion (@emotion/react, @emotion/styled)
- **Animations**: Framer Motion v12.23
- **Icons**: Lucide React v0.554
- **Video Processing**: @ffmpeg/ffmpeg v0.12.15 (Client-side)
- **Archive**: jszip v3.10.1
- **Routing**: React Router v7.9
- **AI Integration**: Google Gemini API
- **Storage**: LocalStorage + IndexedDB
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

## 📊 状態管理とデータ永続化

### Context API（React Context）
- グローバル状態：APIキー、モデル設定、言語設定
- 処理状態：isProcessing、progress、statusMessage
- ログ（ProcessingLog）とプロンプトプリセット

### LocalStorage
- アプリケーション設定（apiKey、model、maxFileSize、language）
- ダッシュボード状態（選択されたビデオソース、プロンプト設定、言語設定）
- プロンプトプリセット（カスタムプリセット）

### IndexedDB
- 大容量ビデオファイルのバイナリデータを永続化
- ブラウザメモリ制限（通常1GB）を超えるファイル対応
- `DocumentEncoderDB`データベース内の`videoFiles`ストアに格納

**セキュリティ注記**: APIキーはLocalStorageに平文保存されます。共用PCでの使用後は設定をクリアしてください。

## 📖 使い方

### 基本的なワークフロー

1. **設定の準備**
   - 右上の設定アイコンをクリック
   - Gemini API Keyを入力
   - モデル（デフォルト: gemini-1.5-flash-002）と最大ファイルサイズを設定
   - 表示言語を選択（日本語/英語）

2. **動画ソースの選択**
   - **ローカルファイル**: 動画ファイルをアップロード（複数選択可能）
   - **YouTube**: YouTube URLと動画タイトルを入力

3. **プロンプト設定**
   - プリセットから選択、または手動でプロンプトを入力
   - スクリーンショット埋め込み設定（ローカルファイルのみ）
     - 有効/無効を選択
     - 頻度（Minimal/Moderate/Detailed）を選択
   - 言語設定で出力言語を指定

4. **ドキュメント生成**
   - 「生成」ボタンをクリック
   - 進捗状況とログをリアルタイムで確認
   - 完了後、結果プレビューとダウンロードボタンが表示

5. **結果のダウンロード**
   - Markdownファイルと抽出したスクリーンショットをZIPファイルとしてダウンロード

### プロンプトプリセットの管理

- 右上のプリセットアイコンをクリックしてプリセット管理画面を開く
- **組み込みプリセット**（編集不可）:
  - 動画要約 / Video Summary
  - 技術文書化 / Technical Documentation
  - 会議議事録 / Meeting Minutes
  - 字幕抽出 / Transcript Extraction
- **カスタムプリセット**:
  - 「新規プリセット」ボタンで作成
  - 名前とプロンプト内容を入力
  - 編集・削除も可能

### 設定のバックアップ・復元

1. **エクスポート**:
   - 設定画面の「設定をエクスポート」ボタンをクリック
   - JSON形式でダウンロード（APIキーは除外されます）

2. **インポート**:
   - 設定画面の「設定をインポート」ボタンをクリック
   - エクスポートしたJSONファイルを選択
   - 既存のAPIキーは保持され、プリセットは統合されます

### 複数ファイルの処理

1. ローカルファイルタブで複数の動画ファイルを選択
2. 各ファイルは順次処理され、個別にMarkdownが生成
3. 生成されたドキュメントは自動的にマージされ、一つの統合ドキュメントとして出力
4. スクリーンショットは各ファイルごとにタイムスタンプ付きで管理

## ⚠️ 注意事項・制限

- **ブラウザ互換性**: `SharedArrayBuffer` をサポートするモダンブラウザ（Chrome, Edge, Firefox, Safari等）が必要です。
- **メモリ制限**: ブラウザのメモリ制限により、デフォルトでは1GBまでの動画ファイル処理を推奨します（設定で変更可能ですが、大きすぎる値はブラウザクラッシュのリスクがあります）。
- **セキュリティ**: APIキーはブラウザのローカルストレージに保存されます。共用PCなどでは使用後に設定を削除してください。
- **複数ファイル処理**: 複数の動画を処理する場合、各ファイルが順次処理されるため、処理時間が長くなる可能性があります。

## 📄 ライセンス

[MIT License](LICENSE)
