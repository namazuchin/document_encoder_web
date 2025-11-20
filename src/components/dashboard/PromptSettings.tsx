import React, { useEffect } from 'react';
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

const DEFAULT_PROMPT = `動画の内容を詳細に解説するドキュメントを作成してください。
重要なポイント、手順、概念を明確に記述し、必要に応じて箇条書きや表を使用してください。`;

export const PromptSettings: React.FC<Props> = ({ config, onChange, isYoutube }) => {

    useEffect(() => {
        if (!config.prompt) {
            onChange({ ...config, prompt: DEFAULT_PROMPT });
        }
    }, []);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={styles.label}>Language</label>
                    <select
                        className={styles.select}
                        value={config.language}
                        onChange={(e) => onChange({ ...config, language: e.target.value as 'ja' | 'en' })}
                    >
                        <option value="ja">Japanese</option>
                        <option value="en">English</option>
                    </select>
                </div>

                {!isYoutube && (
                    <div>
                        <label className={styles.label}>Screenshots</label>
                        <div className="flex items-center gap-2 mt-2">
                            <input
                                type="checkbox"
                                id="extract-screens"
                                checked={config.extractScreenshots}
                                onChange={(e) => onChange({ ...config, extractScreenshots: e.target.checked })}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="extract-screens" className="text-sm text-gray-700">Enable</label>
                        </div>
                    </div>
                )}
            </div>

            {!isYoutube && config.extractScreenshots && (
                <div>
                    <label className={styles.label}>Frequency</label>
                    <select
                        className={styles.select}
                        value={config.screenshotFrequency}
                        onChange={(e) => onChange({ ...config, screenshotFrequency: e.target.value as any })}
                    >
                        <option value="minimal">Minimal (Low)</option>
                        <option value="moderate">Moderate (Medium)</option>
                        <option value="detailed">Detailed (High)</option>
                    </select>
                </div>
            )}

            <div>
                <label className={styles.label}>Prompt</label>
                <textarea
                    className={`${styles.textarea} h-32 resize-none`}
                    value={config.prompt}
                    onChange={(e) => onChange({ ...config, prompt: e.target.value })}
                    placeholder="Enter your prompt here..."
                />
            </div>
        </div>
    );
};
