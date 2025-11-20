import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { type AppSettings, type ProcessingLog, type PromptPreset } from '../types';
import { StorageService } from '../services/storage';
import { useTranslation as getTranslation, type Language, type Translations } from '../i18n/i18n';

interface AppContextType {
    settings: AppSettings;
    updateSettings: (newSettings: AppSettings) => void;
    logs: ProcessingLog[];
    addLog: (message: string, type?: 'info' | 'error' | 'success') => void;
    clearLogs: () => void;
    isProcessing: boolean;
    setIsProcessing: (isProcessing: boolean) => void;
    progress: number;
    setProgress: (progress: number) => void;
    statusMessage: string;
    setStatusMessage: (msg: string) => void;
    presets: PromptPreset[];
    updatePresets: (presets: PromptPreset[]) => void;
    language: Language;
    t: Translations;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<AppSettings>(StorageService.getSettings());
    const [logs, setLogs] = useState<ProcessingLog[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState("");
    const [presets, setPresets] = useState<PromptPreset[]>(StorageService.getPresets());
    const [language, setLanguage] = useState<Language>(settings.language);
    const t = getTranslation(language);

    const updateSettings = (newSettings: AppSettings) => {
        setSettings(newSettings);
        setLanguage(newSettings.language);
        StorageService.saveSettings(newSettings);
    };

    const updatePresets = (newPresets: PromptPreset[]) => {
        setPresets(newPresets);
        StorageService.savePresets(newPresets);
    };

    const addLog = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
        setLogs(prev => [...prev, { timestamp: Date.now(), message, type }]);
    };

    const clearLogs = () => setLogs([]);

    return (
        <AppContext.Provider value={{
            settings,
            updateSettings,
            logs,
            addLog,
            clearLogs,
            isProcessing,
            setIsProcessing,
            progress,
            setProgress,
            statusMessage,
            setStatusMessage,
            presets,
            updatePresets,
            language,
            t
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};
