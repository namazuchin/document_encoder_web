import React, { useState, useRef } from 'react';
import styles from './Dashboard.module.css';
import { VideoSourceSelector, type VideoSource } from '../components/dashboard/VideoSourceSelector';
import { PromptSettings, type PromptConfig } from '../components/dashboard/PromptSettings';
import { ActionPanel } from '../components/dashboard/ActionPanel';
import { ProgressSection } from '../components/dashboard/ProgressSection';
import { LogSection } from '../components/dashboard/LogSection';
import { ResultPreview } from '../components/dashboard/ResultPreview';
import { useApp } from '../contexts/AppContext';
import { VideoProcessor } from '../services/video';
import { GeminiClient } from '../services/gemini';
import { ArchiveService } from '../services/archive';
import { parseScreenshotPlaceholders, replaceScreenshotsInMarkdown, buildScreenshotPromptInstruction, formatTimestampToFilename } from '../services/screenshot';

export const Dashboard: React.FC = () => {
    const { settings, logs, addLog, clearLogs, isProcessing, setIsProcessing, progress, setProgress, statusMessage, setStatusMessage, t } = useApp();

    const [videoSource, setVideoSource] = useState<VideoSource | null>(null);
    const [promptConfig, setPromptConfig] = useState<PromptConfig>({
        prompt: '',
        language: 'ja',
        extractScreenshots: true,
        screenshotFrequency: 'moderate'
    });
    const [resultMarkdown, setResultMarkdown] = useState('');
    const [extractedImages, setExtractedImages] = useState<{ blob: Blob; name: string }[]>([]);

    const videoProcessor = useRef(new VideoProcessor());

    const handleGenerate = async () => {
        if (!videoSource) return;
        if (!settings.apiKey) {
            addLog(t.messages.apiKeyMissing, "error");
            return;
        }

        setIsProcessing(true);
        clearLogs();
        setResultMarkdown('');
        setExtractedImages([]);
        setProgress(0);

        try {
            const gemini = new GeminiClient(settings.apiKey);
            let fileUri = '';

            // 1. Process Video (Upload only, no screenshot extraction yet)
            if (videoSource.type === 'file' && videoSource.file) {
                setStatusMessage("Processing local video...");
                addLog(`Selected file: ${videoSource.file.name} (${(videoSource.file.size / 1024 / 1024).toFixed(2)} MB)`);

                // Upload to Gemini
                setStatusMessage("Uploading video to Gemini...");
                addLog("Starting upload...");
                fileUri = await gemini.uploadFile(videoSource.file, "video/mp4", (prog) => {
                    const pct = (prog.loaded / prog.total) * 50; // First 50%
                    setProgress(pct);
                });
                addLog(`${t.messages.uploadComplete}. URI: ${fileUri}`, "success");

            } else if (videoSource.type === 'youtube' && videoSource.youtubeUrl) {
                setStatusMessage("Processing YouTube video...");
                addLog(`YouTube URL: ${videoSource.youtubeUrl}`);
                addLog("YouTube mode: Skipping local processing and upload. Passing URL to model.");
            }

            // 2. Generate Document with screenshot instruction
            setStatusMessage("Generating document...");
            setProgress(50);
            addLog(`Sending request to ${settings.model}...`);

            const finalPrompt = `${promptConfig.prompt}\n\nTarget Video: ${videoSource.type === 'youtube' ? videoSource.youtubeUrl : '(Attached Video)'}\nLanguage: ${promptConfig.language === 'ja' ? 'Japanese' : 'English'}`;

            // スクリーンショット指示を生成
            const screenshotInstruction = promptConfig.extractScreenshots
                ? buildScreenshotPromptInstruction(promptConfig.screenshotFrequency)
                : undefined;

            const text = await gemini.generateContent(settings.model, finalPrompt, fileUri, screenshotInstruction);
            setProgress(70);
            addLog(t.messages.generationComplete, "success");

            // 3. Extract screenshots based on placeholders (if enabled and file source)
            let finalMarkdown = text;
            let images: { blob: Blob; name: string }[] = [];

            if (promptConfig.extractScreenshots && videoSource.type === 'file' && videoSource.file) {
                setStatusMessage("Extracting screenshots from placeholders...");
                addLog("Analyzing screenshot placeholders...");

                const placeholders = parseScreenshotPlaceholders(text);

                if (placeholders.length > 0) {
                    addLog(`Found ${placeholders.length} screenshot placeholders.`);

                    // タイムスタンプを抽出
                    const timestamps = placeholders.map(p => p.seconds);

                    // フレーム抽出
                    addLog(`Extracting ${timestamps.length} frames...`);
                    const blobs = await videoProcessor.current.extractFrames(videoSource.file, timestamps, (pct) => {
                        setProgress(70 + pct * 0.2); // 70-90%
                    });

                    // 画像情報を準備（hhmmssff形式のファイル名）
                    images = blobs.map((blob, i) => ({
                        blob,
                        name: `${formatTimestampToFilename(timestamps[i])}.jpg`
                    }));

                    const imageMapping = timestamps.map((timestamp) => ({
                        seconds: timestamp,
                        filename: `${formatTimestampToFilename(timestamp)}.jpg`
                    }));

                    // Markdownを置換
                    finalMarkdown = replaceScreenshotsInMarkdown(text, imageMapping);
                    addLog(`${t.messages.extractionComplete} (${images.length})`, "success");
                } else {
                    addLog(t.messages.noPlaceholders);
                }
            }

            setResultMarkdown(finalMarkdown);
            setExtractedImages(images);
            setProgress(100);
            setStatusMessage(t.messages.done);

        } catch (error: any) {
            console.error(error);
            addLog(error.message || "Unknown error occurred", "error");
            setStatusMessage(t.messages.failed);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = async () => {
        if (!resultMarkdown) return;
        
        // 動画名を取得してzipファイル名に使用
        let zipFileName = "document_package.zip";
        if (videoSource) {
            if (videoSource.type === 'file' && videoSource.file) {
                // ファイル名から拡張子を除去
                const fileName = videoSource.file.name;
                const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
                zipFileName = `${nameWithoutExt}.zip`;
            } else if (videoSource.type === 'youtube' && videoSource.youtubeTitle) {
                // YouTubeタイトルを使用（ファイル名に使えない文字を置換）
                const sanitizedTitle = videoSource.youtubeTitle
                    .replace(/[/\\:*?"<>|]/g, '_')
                    .trim();
                zipFileName = `${sanitizedTitle}.zip`;
            }
        }
        
        const zipBlob = await ArchiveService.createZip(resultMarkdown, extractedImages);
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = zipFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className={styles.container}>
            <div className={styles.leftPane}>
                <div className={styles.card}>
                    <h2 className={styles.cardHeader}>{t.dashboard.videoSourceTitle}</h2>
                    <VideoSourceSelector value={videoSource} onChange={setVideoSource} />
                </div>

                <div className={styles.card}>
                    <h2 className={styles.cardHeader}>{t.dashboard.promptSettingsTitle}</h2>
                    <PromptSettings
                        config={promptConfig}
                        onChange={setPromptConfig}
                        isYoutube={videoSource?.type === 'youtube'}
                    />
                </div>

                <ActionPanel
                    onGenerate={handleGenerate}
                    isProcessing={isProcessing}
                    disabled={!videoSource}
                />
            </div>

            <div className={styles.rightPane}>
                <div className={styles.card}>
                    <h2 className={styles.cardHeader}>{t.dashboard.statusTitle}</h2>
                    <ProgressSection progress={progress} statusMessage={statusMessage} />
                </div>

                <LogSection logs={logs} onClear={clearLogs} />

                <div className={`${styles.card} flex-1 min-h-[300px]`}>
                    <ResultPreview content={resultMarkdown} onDownload={handleDownload} />
                </div>
            </div>
        </div>
    );
};
