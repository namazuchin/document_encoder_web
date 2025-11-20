# Web版 Document Encoder 仕様書

## 1. 概要
既存のTauriベースのデスクトップアプリケーション「Document Encoder」を、Webブラウザ上で動作するアプリケーションとして移植する。
バックエンドロジック（Rust）を廃止し、Web標準技術（TypeScript, WebAssembly）を用いてクライアントサイドのみで完結するアーキテクチャへ変更する。

ホスティング環境には **Cloudflare Pages** を利用する。

## 2. アーキテクチャ変更点

| 項目 | デスクトップ版 (Tauri) | Web版 (今回作成) |
| --- | --- | --- |
| **実行環境** | macOS / Windows (ローカルアプリ) | Webブラウザ (Chrome, Edge, Firefox等) |
| **言語** | Rust (Backend) + TypeScript (Frontend) | **TypeScript (Full Stack)** |
| **動画処理** | システムの `ffmpeg` バイナリ実行 | **`ffmpeg.wasm` (WebAssembly)** |
| **ファイル操作** | `std::fs` (OSファイルシステム) | **Browser File API** / `Blob` / `JSZip` |
| **設定保存** | OS設定ファイル (`app_config_dir`) | **LocalStorage** (ブラウザ内ストレージ) |
| **API通信** | `reqwest` (Rust) | **`fetch` API** (TypeScript) |

## 3. 機能要件

### 3.1. 動画入力

#### A. ローカルファイル
- ユーザーはローカルの動画ファイル（.mp4, .mov等）をドラッグ＆ドロップまたはファイル選択ダイアログで入力する。
- **ファイルサイズ制限**:
    - デフォルト上限: **1GB**
    - 設定画面にて上限値を変更可能にする（可変設定）。ブラウザのメモリ制限を考慮し、高すぎる値には警告を表示する。

#### B. YouTube動画
- YouTubeのURLとタイトルを入力して処理を開始する。
- **処理方式**: Gemini APIのYouTube連携機能（`video/youtube` MIMEタイプ）を利用。動画ダウンロードは行わず、URLをAPIに渡して直接解析させる。
- **制約**: 画像埋め込み機能は利用不可（デスクトップ版同様）。

### 3.2. バックエンドロジックのTypeScript移行
Rust (`src-tauri/src/*`) で実装されていたロジックを、TypeScriptモジュールとして再実装する。

#### 3.2.1. Gemini API連携 (`gemini.ts`)
Rustの `gemini.rs` に相当する機能を `fetch` APIを用いて実装する。

- **`uploadToGemini`**:
    - Resumable Upload Protocol (v1beta) を実装。
    - `XMLHttpRequest` または `fetch` を使用し、アップロード進捗（%）をUIに通知する。
    - ステータスポーリング機能（Processing -> Active）を実装する。
- **`generateDocument`**:
    - Gemini Pro (`generateContent`) へのリクエスト処理。
    - プロンプト生成ロジックの移植。
- **`integrateDocuments`**:
    - 複数ドキュメントの統合ロジック（将来的な拡張用、初期は単一ファイル処理が主）。

#### 3.2.2. 動画処理 (`videoProcessor.ts`)
Rustの `video.rs` および外部コマンド `ffmpeg` の呼び出しを `ffmpeg.wasm` に置き換える。

- **初期化**: `@ffmpeg/ffmpeg` の `load()` 処理。Core URL等はCDNまたはローカルアセットから読み込む。
- **`getVideoDuration`**:
    - `ffprobe` 相当の機能を実装（または `ffmpeg` のログ解析、HTMLVideoElementの一時読み込みで代替）。
- **`extractFrames`**:
    - 指定されたタイムスタンプ（秒）に基づき、動画から静止画（PNG）を抽出する。
    - `ffmpeg.wasm` の仮想ファイルシステム（MEMFS）を利用し、バイナリデータ（Uint8Array/Blob）として出力する。
- **高速化 (SharedArrayBuffer)**:
    - マルチスレッド処理を有効化するため、Cloudflare Pagesのヘッダー設定を行う。
    - HTTPヘッダー:
        ```
        Cross-Origin-Opener-Policy: same-origin
        Cross-Origin-Embedder-Policy: require-corp
        ```

#### 3.2.3. 設定・状態管理
- Rustの `AppHandle` や `State` で管理していた設定値は、React Context または Global State (Zustand等) で管理する。
- 永続化が必要な設定（APIキー、言語設定、サイズ制限設定）は `localStorage` に保存する。
    - **セキュリティ注記**: APIキーはブラウザのストレージに保存されるため、端末共有時のリスクについてユーザーに周知する（暗号化はJS上で完結するため本質的な保護にはならないが、平文表示防止程度の難読化は検討）。

### 3.3. ドキュメント生成と保存
- 生成されたMarkdownテキストと、抽出された画像ファイル（Blob）を `JSZip` を用いてアーカイブ化する。
- ブラウザのダウンロード機能（`<a download>`）を用いて、ZIPファイルとしてユーザーに提供する。

## 4. UI/UX
- 既存のReactコンポーネント (`src/components/*`) を再利用しつつ、Tauri依存部分（`@tauri-apps/api`）を除去・置換する。
- **設定画面**:
    - 「動画ファイルサイズ上限」の設定項目を追加。
    - 保存先フォルダ選択（Tauri dialog）は削除し、ブラウザのデフォルトダウンロード動作とする。

## 5. 技術スタック
- **Frontend**: React + Vite + TypeScript
- **Video Processing**: @ffmpeg/ffmpeg (v0.12+), @ffmpeg/util
- **Archive**: JSZip
- **API Client**: Native `fetch` API
- **Hosting**: Cloudflare Pages

## 6. 開発・移行ステップ

1.  **プロジェクト構成の変更**:
    - `src-tauri` ディレクトリの削除（または参照用として保持）。
    - Web用ビルド設定 (`vite.config.ts`) の調整。Coop/Coepヘッダー対応のDevサーバー設定。
2.  **CoreロジックのTypeScript化**:
    - `gemini.rs` -> `src/services/gemini.ts`
    - `video.rs` -> `src/services/video.ts` (ffmpeg.wasm)
    - `types.rs` -> `src/types.ts` (既存定義の拡充)
3.  **コンポーネントの改修**:
    - Tauri API呼び出し (`invoke`) を、上記TypeScriptサービスの呼び出しに置換。
    - ファイル選択ロジックを `<input type="file">` ベースに変更。
4.  **デプロイ設定**:
    - Cloudflare Pages用の `_headers` ファイル作成。
