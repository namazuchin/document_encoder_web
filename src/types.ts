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

export interface VideoSource {
    type: 'file' | 'youtube';
    file?: File;
    youtubeUrl?: string;
    youtubeTitle?: string;
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
