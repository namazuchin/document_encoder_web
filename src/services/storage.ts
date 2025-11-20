import { type AppSettings, GEMINI_MODELS } from '../types';

const STORAGE_KEY = 'doc_encoder_settings';

const DEFAULT_SETTINGS: AppSettings = {
    apiKey: '',
    model: GEMINI_MODELS[0].id,
    maxFileSize: 1024 * 1024 * 1024, // 1GB
    language: 'ja',
};

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
    }
};
