import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { GEMINI_MODELS } from '../types';
import styles from '../components/dashboard/DashboardComponents.module.css';

export const Settings: React.FC = () => {
    const { settings, updateSettings, t } = useApp();
    const [tempSettings, setTempSettings] = useState(settings);
    const [hasChanges, setHasChanges] = useState(false);

    const handleFieldChange = (newSettings: typeof tempSettings) => {
        setTempSettings(newSettings);
        setHasChanges(true);
    };

    const handleSave = () => {
        updateSettings(tempSettings);
        setHasChanges(false);
    };

    const handleReset = () => {
        setTempSettings(settings);
        setHasChanges(false);
    };

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-6">{t.settings.title}</h2>

            <div className="space-y-6">
                <div>
                    <label className={styles.label}>{t.settings.apiKeyLabel}</label>
                    <input
                        type="password"
                        className={styles.input}
                        value={tempSettings.apiKey}
                        onChange={(e) => handleFieldChange({ ...tempSettings, apiKey: e.target.value })}
                        placeholder={t.settings.apiKeyPlaceholder}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        {t.settings.apiKeyHint}
                    </p>
                </div>

                <div>
                    <label className={styles.label}>{t.settings.modelLabel}</label>
                    <select
                        className={styles.select}
                        value={tempSettings.model}
                        onChange={(e) => handleFieldChange({ ...tempSettings, model: e.target.value })}
                    >
                        {GEMINI_MODELS.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className={styles.label}>{t.settings.languageLabel}</label>
                    <select
                        className={styles.select}
                        value={tempSettings.language}
                        onChange={(e) => handleFieldChange({ ...tempSettings, language: e.target.value as 'ja' | 'en' })}
                    >
                        <option value="ja">{t.dashboard.japanese}</option>
                        <option value="en">{t.dashboard.english}</option>
                    </select>
                </div>

                <div>
                    <label className={styles.label}>{t.settings.maxFileSizeLabel}</label>
                    <input
                        type="number"
                        className={styles.input}
                        value={tempSettings.maxFileSize}
                        onChange={(e) => handleFieldChange({ ...tempSettings, maxFileSize: parseInt(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        {t.settings.maxFileSizeHint}
                    </p>
                </div>

                <div className="flex gap-3 pt-4">
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges}
                        className={`px-6 py-2 rounded font-medium transition-colors ${hasChanges
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        {t.common.save}
                    </button>
                    <button
                        onClick={handleReset}
                        disabled={!hasChanges}
                        className={`px-6 py-2 rounded font-medium transition-colors ${hasChanges
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        {t.common.reset}
                    </button>
                </div>

                {hasChanges && (
                    <p className="text-sm text-orange-600 mt-2">
                        {t.common.unsavedChanges}
                    </p>
                )}
            </div>
        </div>
    );
};
