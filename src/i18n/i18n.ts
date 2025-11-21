export type Language = 'ja' | 'en';

export interface Translations {
    common: {
        save: string;
        reset: string;
        cancel: string;
        delete: string;
        edit: string;
        create: string;
        download: string;
        generate: string;
        clear: string;
        copy: string;
        copied: string;
        unsavedChanges: string;
    };
    layout: {
        appTitle: string;
        settingsTooltip: string;
        promptPresetsTooltip: string;
    };
    dashboard: {
        videoSourceTitle: string;
        promptSettingsTitle: string;
        statusTitle: string;
        localFileTab: string;
        youtubeTab: string;
        uploadPrompt: string;
        uploadHint: string;
        youtubeUrl: string;
        videoTitle: string;
        setVideo: string;
        preset: string;
        selectPreset: string;
        defaultPreset: string;
        language: string;
        screenshots: string;
        enable: string;
        frequency: string;
        minimal: string;
        moderate: string;
        detailed: string;
        prompt: string;
        promptPlaceholder: string;
        processing: string;
        progressLabel: string;
        logsTitle: string;
        resultTitle: string;
        noResult: string;
        japanese: string;
        english: string;
    };
    settings: {
        title: string;
        apiKeyLabel: string;
        apiKeyPlaceholder: string;
        apiKeyHint: string;
        modelLabel: string;
        maxFileSizeLabel: string;
        maxFileSizeHint: string;
        languageLabel: string;
        configManagement: string;
        exportConfig: string;
        importConfig: string;
        importSuccess: string;
        importError: string;
    };
    promptManager: {
        title: string;
        newPreset: string;
        editPreset: string;
        nameLabel: string;
        contentLabel: string;
        noPresets: string;
        deleteConfirm: string;
    };
    messages: {
        apiKeyMissing: string;
        uploadComplete: string;
        generationComplete: string;
        extractionComplete: string;
        noPlaceholders: string;
        failed: string;
        done: string;
    };
}

export const translations: Record<Language, Translations> = {
    ja: {
        common: {
            save: '保存',
            reset: 'リセット',
            cancel: 'キャンセル',
            delete: '削除',
            edit: '編集',
            create: '作成',
            download: 'ダウンロード',
            generate: '生成',
            clear: 'クリア',
            copy: 'コピー',
            copied: 'コピー済み',
            unsavedChanges: '⚠️ 未保存の変更があります',
        },
        layout: {
            appTitle: 'Document Encoder Web',
            settingsTooltip: '設定',
            promptPresetsTooltip: 'プロンプトプリセット',
        },
        dashboard: {
            videoSourceTitle: '1. 動画ソース',
            promptSettingsTitle: '2. プロンプト設定',
            statusTitle: 'ステータス',
            localFileTab: 'ローカルファイル',
            youtubeTab: 'YouTube',
            uploadPrompt: 'クリックしてアップロード、またはドラッグ&ドロップ',
            uploadHint: 'MP4, MOV, WebM (最大1GB)',
            youtubeUrl: 'YouTube URL',
            videoTitle: '動画タイトル',
            setVideo: '動画を設定',
            preset: 'プリセット',
            selectPreset: 'プリセットを選択...',
            defaultPreset: 'デフォルト (手動)',
            language: '言語',
            screenshots: 'スクリーンショット',
            enable: '有効化',
            frequency: '頻度',
            minimal: '最小 (低)',
            moderate: '中程度 (中)',
            detailed: '詳細 (高)',
            prompt: 'プロンプト',
            promptPlaceholder: 'プロンプトを入力してください...',
            processing: '処理中...',
            progressLabel: '進捗',
            logsTitle: 'ログ',
            resultTitle: '結果',
            noResult: '結果がここに表示されます',
            japanese: '日本語',
            english: '英語',
        },
        settings: {
            title: '設定',
            apiKeyLabel: 'Gemini APIキー',
            apiKeyPlaceholder: 'Gemini APIキーを入力してください',
            apiKeyHint: 'APIキーはブラウザのLocalStorageにローカル保存されます。',
            modelLabel: 'モデル',
            maxFileSizeLabel: '最大ファイルサイズ (バイト)',
            maxFileSizeHint: 'デフォルト: 1073741824 (1GB)。大きなファイルはブラウザをクラッシュさせる可能性があります。',
            languageLabel: '表示言語',
            configManagement: '設定管理',
            exportConfig: '設定をエクスポート',
            importConfig: '設定をインポート',
            importSuccess: '設定をインポートしました',
            importError: '設定のインポートに失敗しました',
        },
        promptManager: {
            title: 'プロンプトプリセット',
            newPreset: '新規プリセット',
            editPreset: 'プリセットを編集',
            nameLabel: '名前',
            contentLabel: '内容',
            noPresets: 'カスタムプリセットがありません。作成して開始してください。',
            deleteConfirm: '本当にこのプリセットを削除しますか?',
        },
        messages: {
            apiKeyMissing: 'APIキーが設定されていません。設定画面で設定してください。',
            uploadComplete: 'アップロード完了',
            generationComplete: '生成完了!',
            extractionComplete: '画像を抽出し、Markdownを更新しました。',
            noPlaceholders: '生成されたドキュメント内にスクリーンショットプレースホルダーが見つかりませんでした。',
            failed: '失敗',
            done: '完了',
        },
    },
    en: {
        common: {
            save: 'Save',
            reset: 'Reset',
            cancel: 'Cancel',
            delete: 'Delete',
            edit: 'Edit',
            create: 'Create',
            download: 'Download',
            generate: 'Generate',
            clear: 'Clear',
            copy: 'Copy',
            copied: 'Copied',
            unsavedChanges: '⚠️ You have unsaved changes',
        },
        layout: {
            appTitle: 'Document Encoder Web',
            settingsTooltip: 'Settings',
            promptPresetsTooltip: 'Prompt Presets',
        },
        dashboard: {
            videoSourceTitle: '1. Video Source',
            promptSettingsTitle: '2. Prompt Settings',
            statusTitle: 'Status',
            localFileTab: 'Local File',
            youtubeTab: 'YouTube',
            uploadPrompt: 'Click to upload or drag and drop',
            uploadHint: 'MP4, MOV, WebM up to 1GB',
            youtubeUrl: 'YouTube URL',
            videoTitle: 'Video Title',
            setVideo: 'Set Video',
            preset: 'Preset',
            selectPreset: 'Select a preset...',
            defaultPreset: 'Default (Manual)',
            language: 'Language',
            screenshots: 'Screenshots',
            enable: 'Enable',
            frequency: 'Frequency',
            minimal: 'Minimal (Low)',
            moderate: 'Moderate (Medium)',
            detailed: 'Detailed (High)',
            prompt: 'Prompt',
            promptPlaceholder: 'Enter your prompt here...',
            processing: 'Processing...',
            progressLabel: 'Progress',
            logsTitle: 'Logs',
            resultTitle: 'Result',
            noResult: 'Results will appear here',
            japanese: 'Japanese',
            english: 'English',
        },
        settings: {
            title: 'Settings',
            apiKeyLabel: 'Gemini API Key',
            apiKeyPlaceholder: 'Enter your Gemini API Key',
            apiKeyHint: 'Your API key is stored locally in your browser\'s LocalStorage.',
            modelLabel: 'Model',
            maxFileSizeLabel: 'Max File Size (Bytes)',
            maxFileSizeHint: 'Default: 1073741824 (1GB). Large files may crash the browser.',
            languageLabel: 'Display Language',
            configManagement: 'Configuration Management',
            exportConfig: 'Export Configuration',
            importConfig: 'Import Configuration',
            importSuccess: 'Configuration imported successfully',
            importError: 'Failed to import configuration',
        },
        promptManager: {
            title: 'Prompt Presets',
            newPreset: 'New Preset',
            editPreset: 'Edit Preset',
            nameLabel: 'Name',
            contentLabel: 'Content',
            noPresets: 'No custom presets found. Create one to get started.',
            deleteConfirm: 'Are you sure you want to delete this preset?',
        },
        messages: {
            apiKeyMissing: 'API Key is missing. Please go to Settings.',
            uploadComplete: 'Upload complete',
            generationComplete: 'Generation complete!',
            extractionComplete: 'Extracted images and updated markdown.',
            noPlaceholders: 'No screenshot placeholders found in the generated document.',
            failed: 'Failed',
            done: 'Done',
        },
    },
};

export function useTranslation(language: Language) {
    return translations[language];
}
