# Agent Context: Document Encoder Web

## プロジェクト概要
**Document Encoder Web**は、Google の Gemini API を使用して動画ファイルを構造化されたドキュメントに変換するクライアントサイドWebアプリケーションです。Tauri ベースのデスクトップアプリケーションから移植されました。

## 技術スタック
- **フレームワーク**: React + Vite + TypeScript
- **スタイリング**: Vanilla CSS と CSS Modules（`index.css`でTailwindのユーティリティクラスを模倣）
- **動画処理**: `ffmpeg.wasm`（クライアントサイド）
- **AI統合**: Google Gemini API（`fetch`による直接呼び出し）
- **状態管理**: React Context（`AppContext`）
- **ホスティング**: Cloudflare Pages

## アーキテクチャ
このアプリケーションは、カスタムバックエンドなしで完全にブラウザ上で動作するように設計されています。

### 主要ディレクトリ
- `src/services/`: コアビジネスロジック
    - `gemini.ts`: Resumable Upload Protocol とコンテンツ生成を処理
    - `video.ts`: `ffmpeg.wasm`を使用したフレーム抽出を管理
    - `storage.ts`: 設定の永続化のために`localStorage`をラップ
    - `archive.ts`: `JSZip`を使用してZIPファイルを生成
- `src/i18n/`: 多言語化システム
    - `i18n.ts`: 翻訳データと型定義（日本語・英語対応）
- `src/components/`: UIコンポーネント
    - `dashboard/`: メインダッシュボード専用のコンポーネント（VideoSelector、PromptSettingsなど）
    - `layout/`: 共有レイアウトコンポーネント
- `src/pages/`: トップレベルのルートコンポーネント（`Dashboard`、`Settings`）
- `src/contexts/`: グローバル状態（`AppProvider`）

## 多言語化（i18n）
アプリケーションは日本語と英語に対応しています。

### 実装の特徴
- **軽量実装**: 外部ライブラリを使わず、カスタムi18nシステムを実装
- **型安全**: TypeScriptで全翻訳キーが型定義され、コンパイル時にチェック
- **即時反映**: 言語変更時、全UIコンポーネントが自動的に再レンダリング
- **永続化**: LocalStorageに言語設定を保存し、次回起動時も維持

### 使い方（開発者向け）
```typescript
// コンポーネント内で翻訳を使用
import { useApp } from '../contexts/AppContext';

const MyComponent = () => {
    const { t } = useApp();
    return <h1>{t.dashboard.title}</h1>;
};
```

### 翻訳の追加方法
1. `src/i18n/i18n.ts`の`Translations`インターフェースに新しいキーを追加
2. `translations.ja`と`translations.en`に対応する翻訳を追加
3. コンポーネントで`t.カテゴリ.キー`の形式で使用

### ユーザー向け
- Settings画面の「表示言語」ドロップダウンで言語を切り替え可能
- デフォルト言語: 日本語


## 重要な制約と設定
1.  **SharedArrayBuffer のサポート**:
    - `ffmpeg.wasm`は`SharedArrayBuffer`を必要とします
    - **ヘッダー**: サーバーは以下のヘッダーを返す必要があります:
        ```
        Cross-Origin-Opener-Policy: same-origin
        Cross-Origin-Embedder-Policy: require-corp
        ```
    - `vite.config.ts`（開発環境）と`public/_headers`（本番環境/Cloudflare）で設定されています

2.  **TypeScript 設定**:
    - `verbatimModuleSyntax`が有効になっています
    - **ルール**: 型のみのインポートには必ず`import type { ... }`を使用してください

3.  **ブラウザの制限事項**:
    - 大きなファイル（>1GB）はメモリ制限によりブラウザがクラッシュする可能性があります
    - `ffmpeg.wasm`のパフォーマンスはクライアントデバイスに依存します

## 開発ワークフロー
- **開発サーバーの起動**: `npm run dev`
- **本番用ビルド**: `npm run build`
- **Lint/型チェック**: ビルドコマンドは最初に`tsc -b`を実行します
- **テスト実行**: `npm test`

### コード変更時の重要なルール
⚠️ **コードを変更した際は、必ず以下を実行してください**:

1. **テストの実行**: 
   - コード変更後は必ず`npm test`を実行し、既存のテストが通ることを確認してください
   - テストが失敗した場合は、コードを修正するか、テストを適切に更新してください

2. **新しい機能やバグ修正の場合**:
   - 新しい機能を追加した場合は、対応するテストケースを追加してください
   - バグ修正の場合は、そのバグを検出するためのテストを追加してください
   - テストファイルは`*.test.ts`または`*.test.tsx`という命名規則に従ってください

3. **テストの配置**:
   - ビジネスロジック（`src/services/`）のテストは同じディレクトリに配置してください
   - コンポーネントのテストは対応するコンポーネントと同じディレクトリに配置してください

4. **テストフレームワーク**: 
   - このプロジェクトでは**Vitest**を使用しています
   - React コンポーネントのテストには`@testing-library/react`を使用してください

## 今後のタスク / ロードマップ
- [ ] アップロード中のネットワーク中断に対するエラーハンドリングの改善
- [ ] `ffmpeg.wasm`が対応可能であれば、より多くの動画フォーマットのサポートを追加
- [ ] より堅牢なプロンプトテンプレートシステムの実装（XML のインポート/エクスポート）
