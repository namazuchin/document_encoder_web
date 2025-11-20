import React from 'react';
import { Play, Loader2 } from 'lucide-react';
import styles from './DashboardComponents.module.css';

interface Props {
    onGenerate: () => void;
    isProcessing: boolean;
    disabled: boolean;
}

export const ActionPanel: React.FC<Props> = ({ onGenerate, isProcessing, disabled }) => {
    return (
        <div className="pt-4 border-t border-gray-200">
            <button
                className={`${styles.button} ${styles.primaryButton} w-full py-3 text-lg`}
                onClick={onGenerate}
                disabled={disabled || isProcessing}
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="animate-spin" />
                        Processing...
                    </>
                ) : (
                    <>
                        <Play fill="currentColor" />
                        Generate Document
                    </>
                )}
            </button>
        </div>
    );
};
