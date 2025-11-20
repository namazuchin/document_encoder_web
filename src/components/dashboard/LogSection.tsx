import React, { useRef, useEffect } from 'react';
import type { ProcessingLog } from '../../types';
import { Trash2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

interface Props {
    logs: ProcessingLog[];
    onClear: () => void;
}

export const LogSection: React.FC<Props> = ({ logs, onClear }) => {
    const { t } = useApp();
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div className="flex flex-col h-64 border border-gray-200 rounded-lg overflow-hidden bg-gray-900 text-gray-100 font-mono text-xs">
            <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
                <span className="font-semibold text-gray-300">{t.dashboard.logsTitle}</span>
                <button onClick={onClear} className="text-gray-400 hover:text-white">
                    <Trash2 size={14} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {logs.length === 0 && (
                    <div className="text-gray-500 italic">No logs yet...</div>
                )}
                {logs.map((log, i) => (
                    <div key={i} className={`
            ${log.type === 'error' ? 'text-red-400' : ''}
            ${log.type === 'success' ? 'text-green-400' : ''}
            ${log.type === 'info' ? 'text-gray-300' : ''}
          `}>
                        <span className="text-gray-500 mr-2">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        {log.message}
                    </div>
                ))}
                <div ref={endRef} />
            </div>
        </div>
    );
};
