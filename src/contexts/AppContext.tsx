import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type AppSettings, type ProcessingLog, type PromptPreset, type DashboardState, GEMINI_MODELS } from '../types';
import { StorageService } from '../services/storage';
import { useTranslation as getTranslation, type Language, type Translations } from '../i18n/i18n';

interface AppContextType {
    settings: AppSettings;
    updateSettings: (newSettings: AppSettings, persist?: boolean) => Promise<void>;
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
    dashboardState: DashboardState;
    updateDashboardState: (state: DashboardState) => void;
    isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_SETTINGS: AppSettings = {
    apiKey: '',
    model: GEMINI_MODELS[0].id,
    maxFileSize: 1024 * 1024 * 1024,
    language: 'ja',
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);
    const [logs, setLogs] = useState<ProcessingLog[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState("");
    const [presets, setPresets] = useState<PromptPreset[]>(StorageService.getPresets());
    const [language, setLanguage] = useState<Language>(DEFAULT_SETTINGS.language);
    const [dashboardState, setDashboardState] = useState<DashboardState>(StorageService.getDashboardState());
    const t = getTranslation(language);

    // Load settings on mount (async)
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const loadedSettings = await StorageService.getSettings();
                setSettings(loadedSettings);
                setLanguage(loadedSettings.language);
            } catch (error) {
                console.error('Failed to load settings:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadSettings();
    }, []);

    const updateSettings = async (newSettings: AppSettings, persist: boolean = true) => {
        setSettings(newSettings);
        setLanguage(newSettings.language);
        if (persist) {
            await StorageService.saveSettings(newSettings);
        }
    };

    const updatePresets = (newPresets: PromptPreset[]) => {
        setPresets(newPresets);
        StorageService.savePresets(newPresets);
    };

    const updateDashboardState = (newState: DashboardState) => {
        setDashboardState(newState);
        StorageService.saveDashboardState(newState);
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
            t,
            dashboardState,
            updateDashboardState,
            isLoading
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
