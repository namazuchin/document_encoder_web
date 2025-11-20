import React, { useState } from 'react';
import { Upload, Youtube, X } from 'lucide-react';
import styles from './DashboardComponents.module.css';
import { useApp } from '../../contexts/AppContext';

export interface VideoSource {
    type: 'file' | 'youtube';
    file?: File;
    youtubeUrl?: string;
    youtubeTitle?: string;
}

interface Props {
    value: VideoSource | null;
    onChange: (source: VideoSource | null) => void;
}

export const VideoSourceSelector: React.FC<Props> = ({ value, onChange }) => {
    const { t } = useApp();
    const [mode, setMode] = useState<'file' | 'youtube'>('file');
    const [ytUrl, setYtUrl] = useState('');
    const [ytTitle, setYtTitle] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onChange({ type: 'file', file: e.target.files[0] });
        }
    };

    const handleYoutubeSubmit = () => {
        if (ytUrl && ytTitle) {
            onChange({ type: 'youtube', youtubeUrl: ytUrl, youtubeTitle: ytTitle });
        }
    };

    return (
        <div>
            <div className="flex border-b border-gray-200 mb-4">
                <button
                    className={`px-4 py-2 text-sm font-medium ${mode === 'file' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setMode('file')}
                >
                    {t.dashboard.localFileTab}
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium ${mode === 'youtube' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setMode('youtube')}
                >
                    {t.dashboard.youtubeTab}
                </button>
            </div>

            {mode === 'file' ? (
                <div className="space-y-4">
                    {!value || value.type !== 'file' ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                            <input
                                type="file"
                                id="video-upload"
                                className="hidden"
                                accept="video/*"
                                onChange={handleFileChange}
                            />
                            <label htmlFor="video-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                <Upload className="w-8 h-8 text-gray-400" />
                                <span className="text-sm text-gray-600">{t.dashboard.uploadPrompt}</span>
                                <span className="text-xs text-gray-400">{t.dashboard.uploadHint}</span>
                            </label>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-2 bg-blue-100 rounded text-blue-600">
                                    <Upload size={20} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{value.file?.name}</p>
                                    <p className="text-xs text-gray-500">{(value.file!.size / (1024 * 1024)).toFixed(2)} MB</p>
                                </div>
                            </div>
                            <button
                                onClick={() => onChange(null)}
                                className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    <div>
                        <label className={styles.label}>{t.dashboard.youtubeUrl}</label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={ytUrl}
                            onChange={(e) => setYtUrl(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className={styles.label}>{t.dashboard.videoTitle}</label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder={t.dashboard.videoTitle}
                            value={ytTitle}
                            onChange={(e) => setYtTitle(e.target.value)}
                        />
                    </div>
                    <button
                        className={`${styles.button} ${styles.primaryButton} w-full`}
                        onClick={handleYoutubeSubmit}
                        disabled={!ytUrl || !ytTitle}
                    >
                        {t.dashboard.setVideo}
                    </button>

                    {value?.type === 'youtube' && (
                        <div className="mt-2 flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-2 bg-red-100 rounded text-red-600">
                                    <Youtube size={20} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{value.youtubeTitle}</p>
                                    <p className="text-xs text-gray-500 truncate">{value.youtubeUrl}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => onChange(null)}
                                className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
