import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageService } from './storage';
import type { AppSettings, PromptPreset } from '../types';

describe('StorageService', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        vi.clearAllMocks();
    });

    describe('getSettings and saveSettings', () => {
        it('should return default settings when nothing is stored', () => {
            const settings = StorageService.getSettings();

            expect(settings).toHaveProperty('apiKey');
            expect(settings).toHaveProperty('model');
            expect(settings).toHaveProperty('maxFileSize');
            expect(settings).toHaveProperty('language');
        });

        it('should save and retrieve settings', () => {
            const testSettings: AppSettings = {
                apiKey: 'test-key',
                model: 'gemini-1.5-pro',
                maxFileSize: 2048,
                language: 'en'
            };

            StorageService.saveSettings(testSettings);
            const retrieved = StorageService.getSettings();

            expect(retrieved).toEqual(testSettings);
        });

        it('should merge with default settings on retrieval', () => {
            const partialSettings = {
                apiKey: 'test-key'
            };

            localStorage.setItem('doc_encoder_settings', JSON.stringify(partialSettings));
            const settings = StorageService.getSettings();

            expect(settings.apiKey).toBe('test-key');
            expect(settings).toHaveProperty('model');
            expect(settings).toHaveProperty('language');
        });
    });

    describe('clearSettings', () => {
        it('should clear stored settings', () => {
            const testSettings: AppSettings = {
                apiKey: 'test-key',
                model: 'gemini-1.5-pro',
                maxFileSize: 2048,
                language: 'en'
            };

            StorageService.saveSettings(testSettings);
            StorageService.clearSettings();

            const settings = StorageService.getSettings();
            expect(settings.apiKey).toBe(''); // Should be default
        });
    });

    describe('getPresets and savePresets', () => {
        it('should initialize with default presets on first load', () => {
            const presets = StorageService.getPresets();

            expect(presets.length).toBeGreaterThan(0);
            expect(presets.every(p => p.isDefault)).toBe(true);
        });

        it('should save and retrieve custom presets', () => {
            const customPreset: PromptPreset = {
                id: 'custom-1',
                name: 'Custom Preset',
                content: 'Custom content',
                isDefault: false
            };

            const presets = [...StorageService.getPresets(), customPreset];
            StorageService.savePresets(presets);

            const retrieved = StorageService.getPresets();
            const found = retrieved.find(p => p.id === 'custom-1');

            expect(found).toBeDefined();
            expect(found?.name).toBe('Custom Preset');
        });
    });

    describe('exportConfiguration', () => {
        it('should export settings and presets as JSON', () => {
            const testSettings: AppSettings = {
                apiKey: 'secret-key',
                model: 'gemini-1.5-pro',
                maxFileSize: 2048,
                language: 'en'
            };

            StorageService.saveSettings(testSettings);

            const exported = StorageService.exportConfiguration();
            const parsed = JSON.parse(exported);

            expect(parsed).toHaveProperty('settings');
            expect(parsed).toHaveProperty('presets');
            expect(parsed).toHaveProperty('version');
            expect(parsed).toHaveProperty('exportedAt');
        });

        it('should exclude API key from export', () => {
            const testSettings: AppSettings = {
                apiKey: 'secret-key',
                model: 'gemini-1.5-pro',
                maxFileSize: 2048,
                language: 'en'
            };

            StorageService.saveSettings(testSettings);

            const exported = StorageService.exportConfiguration();
            const parsed = JSON.parse(exported);

            expect(parsed.settings.apiKey).toBe('');
        });
    });

    describe('importConfiguration', () => {
        it('should import settings and preserve existing API key', () => {
            // Set initial API key
            const initialSettings: AppSettings = {
                apiKey: 'existing-key',
                model: 'gemini-1.5-pro',
                maxFileSize: 1024,
                language: 'ja'
            };
            StorageService.saveSettings(initialSettings);

            // Import configuration
            const importData = {
                settings: {
                    apiKey: '',
                    model: 'gemini-1.5-flash',
                    maxFileSize: 2048,
                    language: 'en'
                },
                presets: [],
                version: 1
            };

            const result = StorageService.importConfiguration(JSON.stringify(importData));

            expect(result.success).toBe(true);

            const settings = StorageService.getSettings();
            expect(settings.apiKey).toBe('existing-key'); // Preserved
            expect(settings.model).toBe('gemini-1.5-flash'); // Updated
            expect(settings.language).toBe('en'); // Updated
        });

        it('should merge presets on import', () => {
            const existingPreset: PromptPreset = {
                id: 'existing-1',
                name: 'Existing',
                content: 'Existing content',
                isDefault: false
            };
            StorageService.savePresets([existingPreset]);

            const importData = {
                settings: {},
                presets: [
                    {
                        id: 'new-1',
                        name: 'New Preset',
                        content: 'New content',
                        isDefault: false
                    }
                ],
                version: 1
            };

            StorageService.importConfiguration(JSON.stringify(importData));

            const presets = StorageService.getPresets();
            const hasExisting = presets.some(p => p.id === 'existing-1');
            const hasNew = presets.some(p => p.id === 'new-1');

            expect(hasExisting).toBe(true);
            expect(hasNew).toBe(true);
        });

        it('should update existing presets with same ID', () => {
            const preset: PromptPreset = {
                id: 'preset-1',
                name: 'Original',
                content: 'Original content',
                isDefault: false
            };
            StorageService.savePresets([preset]);

            const importData = {
                settings: {},
                presets: [
                    {
                        id: 'preset-1',
                        name: 'Updated',
                        content: 'Updated content',
                        isDefault: false
                    }
                ],
                version: 1
            };

            StorageService.importConfiguration(JSON.stringify(importData));

            const presets = StorageService.getPresets();
            const updated = presets.find(p => p.id === 'preset-1');

            expect(updated?.name).toBe('Updated');
            expect(updated?.content).toBe('Updated content');
        });

        it('should return error for invalid JSON', () => {
            const result = StorageService.importConfiguration('invalid json');

            expect(result.success).toBe(false);
            expect(result.message).toContain('parse');
        });

        it('should return error for invalid format', () => {
            const result = StorageService.importConfiguration(JSON.stringify({ foo: 'bar' }));

            expect(result.success).toBe(false);
            expect(result.message).toContain('Invalid');
        });
    });

    describe('getDashboardState and saveDashboardState', () => {
        it('should return default dashboard state when nothing is stored', () => {
            const state = StorageService.getDashboardState();

            expect(state).toHaveProperty('videoSource');
            expect(state).toHaveProperty('videoSourceMode');
            expect(state).toHaveProperty('promptConfig');
            expect(state.videoSourceMode).toBe('file');
        });

        it('should save and retrieve dashboard state', () => {
            const testState = {
                videoSource: null,
                videoSourceMode: 'youtube' as const,
                promptConfig: {
                    prompt: 'Test prompt',
                    language: 'en' as const,
                    extractScreenshots: true,
                    screenshotFrequency: 'detailed' as const
                }
            };

            StorageService.saveDashboardState(testState);
            const retrieved = StorageService.getDashboardState();

            expect(retrieved.videoSourceMode).toBe('youtube');
            expect(retrieved.promptConfig.prompt).toBe('Test prompt');
        });
    });

    describe('clearDashboardState', () => {
        it('should clear stored dashboard state', () => {
            const testState = {
                videoSource: null,
                videoSourceMode: 'youtube' as const,
                promptConfig: {
                    prompt: 'Test prompt',
                    language: 'en' as const,
                    extractScreenshots: true,
                    screenshotFrequency: 'detailed' as const
                }
            };

            StorageService.saveDashboardState(testState);
            StorageService.clearDashboardState();

            const state = StorageService.getDashboardState();
            expect(state.videoSourceMode).toBe('file'); // Should be default
        });
    });
});
