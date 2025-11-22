# CLAUDE.md

このファイルは、このリポジトリで作業する際にClaude Code (claude.ai/code) にガイダンスを提供します。

## プロジェクト概要

Document Encoder Webは、動画ファイルを処理してGoogle Gemini APIを使用して構造化されたMarkdownドキュメントを生成するブラウザベースのアプリケーションです。デスクトップ機能（元々Tauriで構築）をWeb APIとffmpeg.wasmを使用してブラウザで完全に動作するように移植しました。

## 開発コマンド

```bash
# 開発サーバー起動 (http://localhost:5173 で実行)
npm run dev

# 本番用ビルド (dist/に出力)
npm run build

# テスト実行
npm test

# リント実行
npm run lint

# 本番ビルドのプレビュー
npm run preview
```

**重要**: コードを変更したら、必ず以下を実行してください：
1. `npm test` - すべてのテストが通ることを確認
2. `npm run build` - ビルドが成功することを確認

これらのコマンドが両方とも成功することを確認してから、変更をコミットしてください。

## アーキテクチャ

### コア技術

- **React 19.2** with TypeScript
- **Vite 7.2** ビルドツールと開発サーバー
- **Chakra UI v3** with Emotion（スタイリング）
- **ffmpeg.wasm** クライアントサイド動画処理
- **IndexedDB** 大容量ファイルストレージ
- **LocalStorage** 設定と状態の永続化

### 重要なブラウザ要件

このアプリケーションは、ffmpeg.wasmのパフォーマンスを有効にするために`SharedArrayBuffer`を使用するための特定のセキュリティヘッダーが**必須**です：
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`

これらのヘッダーは以下で設定されています：
- **開発環境**: `vite.config.ts`のserverヘッダー
- **本番環境**: `public/_headers`（Cloudflare Pages形式）

### アプリケーション構造

```
src/
├── components/          # Reactコンポーネント
│   ├── dashboard/      # ダッシュボード専用コンポーネント
│   └── layout/         # レイアウトコンポーネント（AppLayout）
├── contexts/           # React Contextプロバイダー
│   └── AppContext.tsx  # グローバル状態管理
├── i18n/              # 国際化（ja/en）
├── pages/             # ルートレベルのページ
│   ├── Dashboard.tsx  # メイン動画処理UI
│   ├── Settings.tsx   # アプリ設定
│   └── PromptManager.tsx # プロンプトプリセット管理
├── services/          # ビジネスロジックとAPIクライアント
│   ├── gemini.ts      # Gemini APIクライアント
│   ├── screenshot.ts  # ffmpeg.wasm動画処理
│   ├── indexedDB.ts   # 大容量ファイル永続化
│   ├── storage.ts     # LocalStorageラッパー
│   ├── youtube.ts     # YouTube URL処理
│   └── archive.ts     # ZIPファイル生成
└── types.ts           # TypeScript型定義
```

### 状態管理

アプリはグローバル状態に**React Context API**（`AppContext`）を使用しています：

**設定と構成**：
- APIキー、モデル選択、最大ファイルサイズ、言語
- `StorageService`経由でLocalStorageに保存

**処理状態**：
- `isProcessing`、`progress`、`statusMessage`
- リアルタイムログ（`ProcessingLog[]`）

**プロンプトプリセット**：
- 4つの組み込みプリセット（読み取り専用）
- LocalStorageに保存されるカスタムユーザープリセット

**ダッシュボード状態**：
- 動画ソース選択（ファイル/YouTube）
- プロンプト設定
- スクリーンショット設定
- LocalStorageに永続化され、リロード時に復元

### データ永続化戦略

**LocalStorage** (`src/services/storage.ts`)：
- アプリ設定: `doc_encoder_settings`
- プロンプトプリセット: `doc_encoder_settings_presets`
- ダッシュボード状態: `doc_encoder_settings_dashboard`
- デフォルトプリセットフラグ: `doc_encoder_default_presets_initialized`

**IndexedDB** (`src/services/indexedDB.ts`)：
- データベース: `DocumentEncoderDB`（バージョン2）
- ストア: `videoFiles`
- キー: `currentVideo`
- 保存内容: タイムスタンプ付き`File[]`オブジェクト
- ブラウザメモリ制限（>1GBファイル）に対応

### 動画処理パイプライン

1. **ファイルアップロード**：
   - ユーザーがローカルファイルまたはYouTube URLを選択
   - 複数ファイル対応（順次処理）
   - ファイルはIndexedDBに保存され永続化

2. **Geminiアップロード** (`GeminiClient.uploadFile`)：
   - 再開可能なアップロードプロトコルを使用
   - XMLHttpRequest経由で進捗追跡
   - Gemini処理完了まで待機

3. **スクリーンショット抽出**（ローカルファイルのみ）：
   - ffmpeg.wasmを使用してフレーム抽出
   - 頻度：minimal（少）、moderate（中）、detailed（多）
   - 頻度設定に基づいてシステムプロンプトを自動生成

4. **コンテンツ生成** (`GeminiClient.generateContent`)：
   - ユーザープロンプト + オプションのスクリーンショット指示を結合
   - 複数ファイル：各ファイルを順次処理し、結果をマージ

5. **ダウンロード**：
   - Markdown + 抽出したスクリーンショットのZIPアーカイブ
   - jszipを使用して生成

### Gemini API統合

**GeminiClient** (`src/services/gemini.ts`)：

```typescript
// 進捗追跡付き再開可能アップロード
uploadFile(file: File, mimeType: string, onProgress?: (progress) => void): Promise<string>

// Geminiの動画処理完了を待機
waitForProcessing(fileName: string): Promise<void>

// オプションのファイルとスクリーンショット指示でコンテンツ生成
generateContent(model: string, prompt: string, fileUri?: string, mimeType?: string, screenshotInstruction?: string): Promise<string>
```

**重要事項**：
- ファイルアップロードは`generateContent`で使用する`file_uri`を返す
- 動画は生成前に処理完了（`waitForProcessing`でポーリング）が必要
- スクリーンショット指示はユーザープロンプトの末尾に追加される

### 国際化

アプリは`src/i18n/i18n.ts`経由で日本語と英語をサポート：

```typescript
type Language = 'ja' | 'en';
interface Translations { ... }
const translations: Record<Language, Translations>
```

コンポーネントで`useApp().t`経由で翻訳にアクセス：
```typescript
const { t, language } = useApp();
// t.common.save, t.settings.title, など
```

**新しいUIテキストを追加する場合**：
1. `Translations`インターフェースにキーを追加
2. `translations.ja`に日本語翻訳を追加
3. `translations.en`に英語翻訳を追加

### テスト

テストはVitestとReact Testing Libraryを使用：
- 設定: `vite.config.ts`（testセクション）
- セットアップ: `src/test/setup.ts`
- 実行: `npm test`
- 既存のテスト: `src/services/`内の`*.test.ts`ファイル

## 重要なパターン

### Storage Serviceの使用

永続化には常に`StorageService`を使用：
```typescript
// 設定の取得/保存
const settings = StorageService.getSettings();
StorageService.saveSettings(settings);

// プリセットの取得/保存
const presets = StorageService.getPresets();
StorageService.savePresets(presets);

// ダッシュボード状態の取得/保存
const state = StorageService.getDashboardState();
StorageService.saveDashboardState(state);

// 設定のエクスポート/インポート
const json = StorageService.exportConfiguration();
const result = StorageService.importConfiguration(jsonString);

// データのクリア
StorageService.clearSettings();
StorageService.clearDashboardState();
```

### 大容量ファイル用IndexedDB

動画ファイルの永続化には`IndexedDBService`を使用：
```typescript
await IndexedDBService.saveVideoFiles(files); // File[]
const files = await IndexedDBService.getVideoFiles();
const exists = await IndexedDBService.hasVideoFiles();
await IndexedDBService.deleteVideoFiles();
```

### ログとユーザーフィードバック

ユーザーに表示するメッセージには`useApp().addLog()`を使用：
```typescript
const { addLog, t } = useApp();
addLog(t.messages.uploadComplete, 'success');
addLog('動画を処理中...', 'info');
addLog('アップロードに失敗しました', 'error');
```

## デプロイ

**Cloudflare Pages**（推奨）：
- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- `public/_headers`が自動的にCOOP/COEPヘッダーを適用

**その他のホスト**: ffmpeg.wasmが動作するようにCOOP/COEPヘッダーを手動で設定する必要があります。

## セキュリティ注意事項

- APIキーはLocalStorageに**平文**で保存されます
- 設定エクスポートは意図的にAPIキーを除外します
- 設定インポートは既存のAPIキーを保持します
- 共用PCではストレージをクリアする必要があります
- 動画ファイルはGemini APIにのみアップロードされ、他のサーバーには保存されません
