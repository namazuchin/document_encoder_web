export interface AppSettings {
    apiKey: string;
    model: string;
    maxFileSize: number; // in bytes
    language: 'ja' | 'en';
}

export interface PromptPreset {
    id: string;
    name: string;
    content: string;
    isDefault: boolean;
}

export const GEMINI_MODELS = [
    { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro Preview' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite' },
];

export interface ProcessingLog {
    timestamp: number;
    message: string;
    type: 'info' | 'error' | 'success';
}

// Dashboard state types for persistence
export interface VideoSourceInfo {
    type: 'file' | 'youtube';
    // File source metadata (actual File object cannot be stored in localStorage)
    files?: {
        name: string;
        size: number;
        type: string;
    }[];
    // Legacy single file support (optional, for migration if needed, or just remove)
    // YouTube source data
    youtubeUrl?: string;
    youtubeTitle?: string;
}

export interface DashboardState {
    videoSource: VideoSourceInfo | null;
    videoSourceMode: 'file' | 'youtube';
    promptConfig: {
        prompt: string;
        language: 'ja' | 'en';
        extractScreenshots: boolean;
        cropScreenshots?: boolean;
        screenshotFrequency: 'minimal' | 'moderate' | 'detailed';
    };
}
