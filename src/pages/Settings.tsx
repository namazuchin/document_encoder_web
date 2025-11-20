import React from 'react';
import { useApp } from '../contexts/AppContext';
import { GEMINI_MODELS } from '../types';
import styles from '../components/dashboard/DashboardComponents.module.css';

export const Settings: React.FC = () => {
    const { settings, updateSettings } = useApp();

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Settings</h2>

            <div className="space-y-6">
                <div>
                    <label className={styles.label}>Gemini API Key</label>
                    <input
                        type="password"
                        className={styles.input}
                        value={settings.apiKey}
                        onChange={(e) => updateSettings({ ...settings, apiKey: e.target.value })}
                        placeholder="Enter your Gemini API Key"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Your API key is stored locally in your browser's LocalStorage.
                    </p>
                </div>

                <div>
                    <label className={styles.label}>Model</label>
                    <select
                        className={styles.select}
                        value={settings.model}
                        onChange={(e) => updateSettings({ ...settings, model: e.target.value })}
                    >
                        {GEMINI_MODELS.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className={styles.label}>Max File Size (Bytes)</label>
                    <input
                        type="number"
                        className={styles.input}
                        value={settings.maxFileSize}
                        onChange={(e) => updateSettings({ ...settings, maxFileSize: parseInt(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Default: 1073741824 (1GB). Large files may crash the browser.
                    </p>
                </div>
            </div>
        </div>
    );
};
