import React from 'react';
import { Download, Copy, Check } from 'lucide-react';
import styles from './DashboardComponents.module.css';

interface Props {
    content: string;
    onDownload: () => void;
}

export const ResultPreview: React.FC<Props> = ({ content, onDownload }) => {
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
                <h3 className="font-semibold text-gray-700">Result Preview</h3>
                <div className="flex gap-2">
                    <button
                        onClick={handleCopy}
                        className={`${styles.button} ${styles.secondaryButton} text-xs py-1 px-2`}
                    >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                    <button
                        onClick={onDownload}
                        className={`${styles.button} ${styles.primaryButton} text-xs py-1 px-2`}
                    >
                        <Download size={14} />
                        Download ZIP
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
