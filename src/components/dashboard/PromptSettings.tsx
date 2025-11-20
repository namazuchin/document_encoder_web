import React, { useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import styles from './DashboardComponents.module.css';

export interface PromptConfig {
    prompt: string;
    language: 'ja' | 'en';
    extractScreenshots: boolean;
    screenshotFrequency: 'minimal' | 'moderate' | 'detailed';
}

interface Props {
    config: PromptConfig;
    onChange: (config: PromptConfig) => void;
    isYoutube: boolean;
}

const DEFAULT_PROMPTS = {
    ja: `動画の内容を詳細に解説するドキュメントを作成してください。
重要なポイント、手順、概念を明確に記述し、必要に応じて箇条書きや表を使用してください。`,
    en: `Create a detailed document explaining the content of the video.
Clearly describe important points, steps, and concepts, using bullet points and tables as needed.`
};

export const PromptSettings: React.FC<Props> = ({ config, onChange, isYoutube }) => {
    const { presets, t } = useApp();

    useEffect(() => {
        if (!config.prompt) {
            onChange({ ...config, prompt: DEFAULT_PROMPTS[config.language] });
        }
    }, []);

    const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const presetId = e.target.value;
        if (!presetId) return;

        const preset = presets.find(p => p.id === presetId);
        if (preset) {
            onChange({ ...config, prompt: preset.content });
        } else if (presetId === 'default') {
            onChange({ ...config, prompt: DEFAULT_PROMPTS[config.language] });
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <label className={styles.label}>{t.dashboard.preset}</label>
                <select className={styles.select} onChange={handlePresetChange} defaultValue="">
                    <option value="" disabled>{t.dashboard.selectPreset}</option>
                    <option value="default">{t.dashboard.defaultPreset}</option>
                    {presets.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={styles.label}>{t.dashboard.language}</label>
                    <select
                        className={styles.select}
                        value={config.language}
                        onChange={(e) => onChange({ ...config, language: e.target.value as 'ja' | 'en' })}
                    >
                        <option value="ja">{t.dashboard.japanese}</option>
                        <option value="en">{t.dashboard.english}</option>
                    </select>
                </div>

                {!isYoutube && (
                    <div>
                        <label className={styles.label}>{t.dashboard.screenshots}</label>
                        <div className="flex items-center gap-2 mt-2">
                            <input
                                type="checkbox"
                                id="extract-screens"
                                checked={config.extractScreenshots}
                                onChange={(e) => onChange({ ...config, extractScreenshots: e.target.checked })}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="extract-screens" className="text-sm text-gray-700">{t.dashboard.enable}</label>
                        </div>
                    </div>
                )}
            </div>

            {!isYoutube && config.extractScreenshots && (
                <div>
                    <label className={styles.label}>{t.dashboard.frequency}</label>
                    <select
                        className={styles.select}
                        value={config.screenshotFrequency}
                        onChange={(e) => onChange({ ...config, screenshotFrequency: e.target.value as any })}
                    >
                        <option value="minimal">{t.dashboard.minimal}</option>
                        <option value="moderate">{t.dashboard.moderate}</option>
                        <option value="detailed">{t.dashboard.detailed}</option>
                    </select>
                </div>
            )}

            <div>
                <label className={styles.label}>{t.dashboard.prompt}</label>
                <textarea
                    className={`${styles.textarea} h-32 resize-none`}
                    value={config.prompt}
                    onChange={(e) => onChange({ ...config, prompt: e.target.value })}
                    placeholder={t.dashboard.promptPlaceholder}
                />
            </div>
        </div>
    );
};
