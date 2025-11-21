import { type AppSettings, type PromptPreset, GEMINI_MODELS } from '../types';

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
    },

    getPresets(): PromptPreset[] {
        const stored = localStorage.getItem(STORAGE_KEY + '_presets');
        if (!stored) return [];
        try {
            return JSON.parse(stored);
        } catch {
            return [];
        }
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
    }
};
