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
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Exp' },
];

export interface ProcessingLog {
    timestamp: number;
    message: string;
    type: 'info' | 'error' | 'success';
}
