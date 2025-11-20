import React from 'react';


interface Props {
    progress: number;
    statusMessage: string;
}

export const ProgressSection: React.FC<Props> = ({ progress, statusMessage }) => {
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium text-gray-700">
                <span>{statusMessage || "Ready"}</span>
                <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                ></div>
            </div>
        </div>
    );
};
