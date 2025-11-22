import { type AppSettings, type PromptPreset, GEMINI_MODELS } from '../types';

const STORAGE_KEY = 'doc_encoder_settings';
const DEFAULT_PRESETS_INITIALIZED_KEY = 'doc_encoder_default_presets_initialized';

const DEFAULT_SETTINGS: AppSettings = {
    apiKey: '',
    model: GEMINI_MODELS[0].id,
    maxFileSize: 1024 * 1024 * 1024, // 1GB
    language: 'ja',
};

const DEFAULT_PRESETS: PromptPreset[] = [
    {
        id: 'default-summary',
        name: '動画要約 / Video Summary',
        content: `この動画の内容を以下の形式で要約してください：

## 概要
（動画の全体的な内容を2-3文で説明）

## 主なポイント
- （重要なポイント1）
- （重要なポイント2）
- （重要なポイント3）

## 詳細
（各セクションごとに詳しく説明）`,
        isDefault: true
    },
    {
        id: 'default-technical-doc',
        name: '技術文書化 / Technical Documentation',
        content: `この技術チュートリアル/解説動画を詳細なドキュメントに変換してください：

## 前提条件
（必要な知識や環境）

## 手順
1. （ステップ1の詳細説明）
2. （ステップ2の詳細説明）
...

## コード例
（該当する場合、コードスニペットを含める）

## トラブルシューティング
（一般的な問題と解決策）`,
        isDefault: true
    },
    {
        id: 'default-meeting-minutes',
        name: '会議議事録 / Meeting Minutes',
        content: `この会議動画から議事録を作成してください：

## 会議情報
- 日時: （動画から推測または省略）
- 参加者: （特定できる場合）

## 議題
（話し合われた主なトピック）

## 議論内容
（各議題について話し合われた内容）

## 決定事項
- （決定1）
- （決定2）

## アクションアイテム
- （担当者）: （タスク）`,
        isDefault: true
    },
    {
        id: 'default-transcript',
        name: '字幕抽出 / Transcript Extraction',
        content: `この動画の音声を文字起こししてください：

## 文字起こし

（話された内容を時系列順に、話者が分かる場合は話者名とともに記録してください）

話者名（または時刻）: テキスト内容`,
        isDefault: true
    }
];

export const StorageService = {
    getSettings(): AppSettings {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return DEFAULT_SETTINGS;
        try {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        } catch {
            return DEFAULT_SETTINGS;
        }
    },

    saveSettings(settings: AppSettings) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    },

    clearSettings() {
        localStorage.removeItem(STORAGE_KEY);
    },

    getPresets(): PromptPreset[] {
        const stored = localStorage.getItem(STORAGE_KEY + '_presets');
        const initialized = localStorage.getItem(DEFAULT_PRESETS_INITIALIZED_KEY);

        let presets: PromptPreset[] = [];
        if (stored) {
            try {
                presets = JSON.parse(stored);
            } catch {
                presets = [];
            }
        }

        // 初回ロード時またはプリセットが空の場合、デフォルトプリセットを追加
        if (!initialized && presets.length === 0) {
            presets = [...DEFAULT_PRESETS];
            this.savePresets(presets);
            localStorage.setItem(DEFAULT_PRESETS_INITIALIZED_KEY, 'true');
        }

        return presets;
    },

    savePresets(presets: PromptPreset[]) {
        localStorage.setItem(STORAGE_KEY + '_presets', JSON.stringify(presets));
    },

    exportConfiguration(): string {
        const settings = this.getSettings();
        const presets = this.getPresets();

        // Exclude API key from export
        const exportSettings = { ...settings, apiKey: '' };

        const config = {
            settings: exportSettings,
            presets,
            version: 1,
            exportedAt: new Date().toISOString()
        };

        return JSON.stringify(config, null, 2);
    },

    importConfiguration(jsonString: string): { success: boolean; message?: string } {
        try {
            const data = JSON.parse(jsonString);

            if (!data.settings && !data.presets) {
                return { success: false, message: 'Invalid configuration file format' };
            }

            // Import settings (preserve existing API key)
            if (data.settings) {
                const currentSettings = this.getSettings();
                const newSettings = {
                    ...data.settings,
                    apiKey: currentSettings.apiKey // Keep existing API key
                };
                this.saveSettings(newSettings);
            }

            // Import presets (merge strategy)
            if (data.presets && Array.isArray(data.presets)) {
                const currentPresets = this.getPresets();
                const newPresets = [...currentPresets];

                data.presets.forEach((preset: PromptPreset) => {
                    const index = newPresets.findIndex(p => p.id === preset.id);
                    if (index !== -1) {
                        newPresets[index] = preset; // Update existing
                    } else {
                        newPresets.push(preset); // Add new
                    }
                });

                this.savePresets(newPresets);
            }

            return { success: true };
        } catch (error) {
            return { success: false, message: 'Failed to parse configuration file' };
        }
    },

    // Dashboard state persistence
    getDashboardState(): import('../types').DashboardState {
        const stored = localStorage.getItem(STORAGE_KEY + '_dashboard');
        if (!stored) {
            // Return default state
            return {
                videoSource: null,
                videoSourceMode: 'file',
                promptConfig: {
                    prompt: '',
                    language: 'ja',
                    extractScreenshots: true,
                    screenshotFrequency: 'moderate'
                }
            };
        }
        try {
            return JSON.parse(stored);
        } catch {
            // Return default state on parse error
            return {
                videoSource: null,
                videoSourceMode: 'file',
                promptConfig: {
                    prompt: '',
                    language: 'ja',
                    extractScreenshots: true,
                    screenshotFrequency: 'moderate'
                }
            };
        }
    },

    saveDashboardState(state: import('../types').DashboardState) {
        localStorage.setItem(STORAGE_KEY + '_dashboard', JSON.stringify(state));
    },

    clearDashboardState() {
        localStorage.removeItem(STORAGE_KEY + '_dashboard');
    }
};
