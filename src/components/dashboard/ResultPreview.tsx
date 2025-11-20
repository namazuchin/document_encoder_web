import React from 'react';
import { Download, Copy, Check } from 'lucide-react';
import styles from './DashboardComponents.module.css';
import { useApp } from '../../contexts/AppContext';

interface Props {
    content: string;
    onDownload: () => void;
}

export const ResultPreview: React.FC<Props> = ({ content, onDownload }) => {
    const { t } = useApp();
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!content) return null;

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-700">{t.dashboard.resultTitle}</h3>
                <div className="flex gap-2">
                    <button
                        onClick={handleCopy}
                        className={`${styles.button} ${styles.secondaryButton} text-xs py-1 px-2`}
                    >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? t.common.copied : t.common.copy}
                    </button>
                    <button
                        onClick={onDownload}
                        className={`${styles.button} ${styles.primaryButton} text-xs py-1 px-2`}
                    >
                        <Download size={14} />
                        {t.common.download}
                    </button>
                </div>
            </div>
            <textarea
                className="flex-1 w-full p-4 border border-gray-200 rounded-lg font-mono text-sm bg-gray-50 resize-none focus:outline-none"
                value={content}
                readOnly
            />
        </div>
    );
};
