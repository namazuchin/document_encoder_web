import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { AppSettings, ProcessingLog } from '../types';
import { StorageService } from '../services/storage';

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<AppSettings>(StorageService.getSettings());
    const [logs, setLogs] = useState<ProcessingLog[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState("");

    const updateSettings = (newSettings: AppSettings) => {
        setSettings(newSettings);
        StorageService.saveSettings(newSettings);
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
            setStatusMessage
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
