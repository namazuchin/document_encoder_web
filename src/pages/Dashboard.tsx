import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Grid, VStack, Box, Heading, Text } from '@chakra-ui/react';
import { VideoSourceSelector, type VideoSource } from '../components/dashboard/VideoSourceSelector';
import { PromptSettings } from '../components/dashboard/PromptSettings';
import { ActionPanel } from '../components/dashboard/ActionPanel';
import { ProgressSection } from '../components/dashboard/ProgressSection';
import { LogSection } from '../components/dashboard/LogSection';
import { ResultPreview } from '../components/dashboard/ResultPreview';
import { useApp } from '../contexts/AppContext';
import { VideoProcessor } from '../services/video';
import { GeminiClient } from '../services/gemini';
import { ArchiveService } from '../services/archive';
import { IndexedDBService } from '../services/indexedDB';
import { parseScreenshotPlaceholders, replaceScreenshotsInMarkdown, buildScreenshotPromptInstruction, formatTimestampToFilename } from '../services/screenshot';

import { IntroModal } from '../components/IntroModal';

export const Dashboard: React.FC = () => {
    const {
        settings,
        logs,
        addLog,
        clearLogs,
        isProcessing,
        setIsProcessing,
        progress,
        setProgress,
        statusMessage,
        setStatusMessage,
        t,
        dashboardState,
        updateDashboardState
    } = useApp();

    // Local state for processing results (not persisted)
    const [resultMarkdown, setResultMarkdown] = useState('');
    const [extractedImages, setExtractedImages] = useState<{ blob: Blob; name: string }[]>([]);
    const [loadedFiles, setLoadedFiles] = useState<File[]>([]);

    // Load files from IndexedDB on mount
    useEffect(() => {
        const loadFilesFromIndexedDB = async () => {
            try {
                if (dashboardState.videoSource?.type === 'file') {
                    const files = await IndexedDBService.getVideoFiles();
                    setLoadedFiles(files);
                }
            } catch (error) {
                console.error('Failed to load files from IndexedDB:', error);
            }
        };

        loadFilesFromIndexedDB();
    }, [dashboardState.videoSource]);

    // Convert persisted VideoSourceInfo to VideoSource (with Files from IndexedDB if available)
    const videoSource = useMemo<VideoSource | null>(() => {
        if (!dashboardState.videoSource) return null;

        if (dashboardState.videoSource.type === 'youtube') {
            return {
                type: 'youtube',
                youtubeUrl: dashboardState.videoSource.youtubeUrl,
                youtubeTitle: dashboardState.videoSource.youtubeTitle
            };
        }

        // For file type, use the files loaded from IndexedDB
        if (dashboardState.videoSource.type === 'file' && loadedFiles.length > 0) {
            return {
                type: 'file',
                files: loadedFiles
            };
        }

        return null;
    }, [dashboardState.videoSource, loadedFiles]);

    const promptConfig = dashboardState.promptConfig;
    const videoSourceMode = dashboardState.videoSourceMode;

    const activeSourceType = videoSource?.type ?? videoSourceMode;
    const isYoutubeSelected = activeSourceType === 'youtube';

    const videoProcessor = useRef(new VideoProcessor());

    // Handlers for updating dashboard state
    const handleVideoSourceChange = async (source: VideoSource | null) => {
        if (!source) {
            // Clear both state and IndexedDB
            updateDashboardState({
                ...dashboardState,
                videoSource: null
            });
            try {
                await IndexedDBService.deleteVideoFiles();
                setLoadedFiles([]);
            } catch (error) {
                console.error('Failed to delete files from IndexedDB:', error);
            }
            return;
        }

        if (source.type === 'youtube') {
            updateDashboardState({
                ...dashboardState,
                videoSource: {
                    type: 'youtube',
                    youtubeUrl: source.youtubeUrl,
                    youtubeTitle: source.youtubeTitle
                }
            });
        } else if (source.type === 'file' && source.files) {
            // Save files to IndexedDB
            try {
                await IndexedDBService.saveVideoFiles(source.files);
                setLoadedFiles(source.files);
                updateDashboardState({
                    ...dashboardState,
                    videoSource: {
                        type: 'file',
                        files: source.files.map(f => ({
                            name: f.name,
                            size: f.size,
                            type: f.type
                        }))
                    }
                });
            } catch (error) {
                console.error('Failed to save files to IndexedDB:', error);
                // Still update state with metadata even if IndexedDB fails
                updateDashboardState({
                    ...dashboardState,
                    videoSource: {
                        type: 'file',
                        files: source.files.map(f => ({
                            name: f.name,
                            size: f.size,
                            type: f.type
                        }))
                    }
                });
            }
        }
    };

    const handlePromptConfigChange = (config: typeof promptConfig) => {
        updateDashboardState({
            ...dashboardState,
            promptConfig: config
        });
    };

    const handleVideoSourceModeChange = (mode: 'file' | 'youtube') => {
        updateDashboardState({
            ...dashboardState,
            videoSourceMode: mode
        });
    };

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
            const intermediateDocs: string[] = [];
            let finalMarkdown = '';
            let allImages: { blob: Blob; name: string }[] = [];

            // 1. Process Videos Sequentially
            const totalFiles = (videoSource.type === 'file' && videoSource.files) ? videoSource.files.length : 0;
            const isSingleFile = totalFiles === 1;

            if (videoSource.type === 'file' && videoSource.files && videoSource.files.length > 0) {

                for (let i = 0; i < totalFiles; i++) {
                    const file = videoSource.files[i];
                    setStatusMessage(`Processing video ${i + 1}/${totalFiles}: ${file.name}`);
                    addLog(`Processing file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

                    // Upload
                    setStatusMessage(`Uploading video ${i + 1}/${totalFiles}...`);
                    addLog(`Starting upload for ${file.name}...`);
                    const fileUri = await gemini.uploadFile(file, "video/mp4", (prog) => {
                        const baseProgress = (i / totalFiles) * 50;
                        const fileProgress = (prog.loaded / prog.total) * (50 / totalFiles);
                        setProgress(baseProgress + fileProgress);
                    });
                    addLog(`${t.messages.uploadComplete}. URI: ${fileUri}`, "success");

                    // Generate Intermediate Document
                    setStatusMessage(`Generating document for video ${i + 1}/${totalFiles}...`);
                    addLog(`Sending request to ${settings.model} for ${file.name}...`);

                    // Use a specific prompt for intermediate summarization if multiple files
                    // If single file, use the main prompt directly
                    const promptToUse = isSingleFile ? promptConfig.prompt : `
This is video ${i + 1} of ${totalFiles}.
Please analyze this video and provide a detailed summary and extraction of content.
Focus on capturing all key information, as this will be merged with other video summaries later.
Language: ${promptConfig.language === 'ja' ? 'Japanese' : 'English'}
`;

                    const shouldBuildScreenshotInstruction = promptConfig.extractScreenshots;
                    const screenshotInstruction = shouldBuildScreenshotInstruction
                        ? buildScreenshotPromptInstruction(promptConfig.screenshotFrequency)
                        : undefined;

                    const text = await gemini.generateContent(settings.model, promptToUse, fileUri, "video/mp4", screenshotInstruction);

                    // If multiple files, prefix the text to identify source and tag screenshots
                    let docContent = text;
                    if (!isSingleFile) {
                        // Tag placeholders with filename to preserve context through merge
                        // Replace [Screenshot: MM:SS] with [Screenshot: filename | MM:SS]
                        docContent = text.replace(/\[Screenshot:\s*(\d{1,2}:\d{2}(?:\.\d+)?|\d+(?:\.\d+)?)\s*s?\]/gi, (_, timestamp) => {
                            return `[Screenshot: ${file.name} | ${timestamp}]`;
                        });

                        docContent = `
# Video Source: ${file.name}

${docContent}
`;
                    }
                    intermediateDocs.push(docContent);
                    addLog(`Document generated for ${file.name}`, "success");
                }

                // 2. Merge Documents (if multiple)
                if (intermediateDocs.length > 1) {
                    setStatusMessage("Merging documents...");
                    addLog("Merging intermediate documents...");
                    setProgress(60);

                    const mergePrompt = `
Here are the summaries/documents generated from ${intermediateDocs.length} different videos.
Please merge them into a single coherent document based on the user's original request.
Preserve all important information and screenshot placeholders.
IMPORTANT: Keep the screenshot placeholders in the format [Screenshot: filename | MM:SS] exactly as they appear in the source text. Do not strip the filename.

User's Original Request:
${promptConfig.prompt}

---
${intermediateDocs.join('\n\n---\n\n')}
`;
                    // No file attachment for merge step, just text
                    finalMarkdown = await gemini.generateContent(settings.model, mergePrompt);
                    addLog("Documents merged successfully.", "success");
                } else {
                    finalMarkdown = intermediateDocs[0];
                }

                // 3. Extract Screenshots Sequentially
                if (promptConfig.extractScreenshots) {
                    setStatusMessage("Extracting screenshots...");
                    addLog("Analyzing screenshot placeholders in final document...");

                    // Extract screenshots
                    // We iterate through videos again.

                    for (let i = 0; i < totalFiles; i++) {
                        const file = videoSource.files[i];

                        let timestamps: number[] = [];

                        if (isSingleFile) {
                            timestamps = parseScreenshotPlaceholders(finalMarkdown).map(p => p.seconds);
                        } else {
                            // Regex for [Screenshot: filename | MM:SS]
                            // Escape filename for regex
                            const escapedName = file.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            // Match [Screenshot: filename | MM:SS]
                            const regex = new RegExp(`\\[Screenshot:\\s*${escapedName}\\s*\\|\\s*(\\d{1,2}:\\d{2}(?:\\.\\d+)?)\\s*\\]`, 'gi');

                            let match;
                            while ((match = regex.exec(finalMarkdown)) !== null) {
                                // Use the helper to parse timestamp string
                                // We need to import parseTimestampToSeconds or duplicate logic?
                                // It's exported from screenshot.ts, but I need to make sure it's imported.
                                // It is NOT imported in the original file content I saw.
                                // I should check imports.
                                // Actually, `parseScreenshotPlaceholders` uses it internally.
                                // I can just parse "MM:SS" manually here since it's simple.
                                const tsStr = match[1];
                                const parts = tsStr.split(':');
                                const minutes = parseInt(parts[0], 10);
                                const seconds = parseFloat(parts[1]);
                                timestamps.push(minutes * 60 + seconds);
                            }
                        }

                        if (timestamps.length > 0) {
                            setStatusMessage(`Extracting screenshots for ${file.name}...`);
                            addLog(`Extracting ${timestamps.length} frames from ${file.name}...`);

                            const blobs = await videoProcessor.current.extractFrames(file, timestamps, () => {
                                // Progress logic could be added here if needed
                            });

                            // Map to image objects
                            const newImages = blobs.map((blob, idx) => ({
                                blob,
                                name: `${file.name}_${formatTimestampToFilename(timestamps[idx])}.jpg`
                            }));

                            allImages = [...allImages, ...newImages];

                            // Replace in Markdown
                            if (isSingleFile) {
                                const imageMapping = timestamps.map((ts, idx) => ({
                                    seconds: ts,
                                    filename: newImages[idx].name
                                }));
                                finalMarkdown = replaceScreenshotsInMarkdown(finalMarkdown, imageMapping);
                            } else {
                                // Custom replace for multi-file
                                // Create a map for quick lookup: timestamp (approx) -> filename
                                const imageMap = new Map<number, string>();
                                timestamps.forEach((ts, idx) => {
                                    imageMap.set(ts, newImages[idx].name);
                                });

                                // Replace all placeholders for this file in one go
                                const escapedName = file.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                const replaceRegex = new RegExp(`\\[Screenshot:\\s*${escapedName}\\s*\\|\\s*(\\d{1,2}:\\d{2}(?:\\.\\d+)?)\\s*\\]`, 'gi');

                                finalMarkdown = finalMarkdown.replace(replaceRegex, (match, tsStr) => {
                                    const parts = tsStr.split(':');
                                    const m = parseInt(parts[0], 10);
                                    const s = parseFloat(parts[1]);
                                    const sec = m * 60 + s;

                                    // Find if this second is in our map (with tolerance)
                                    // Since we just created the map from the same timestamps, exact match might fail due to float precision if we recalculated.
                                    // But here we are parsing the string again.
                                    // Let's find the closest timestamp in the map.

                                    for (const [ts, filename] of imageMap.entries()) {
                                        if (Math.abs(ts - sec) < 0.5) {
                                            return `![${tsStr}](${filename})`;
                                        }
                                    }
                                    return match;
                                });
                            }
                        }
                    }
                }
            } else if (videoSource.type === 'youtube' && videoSource.youtubeUrl) {
                // ... (Existing YouTube logic) ...
                // Just copy existing logic but adapt to new structure
                setStatusMessage("Processing YouTube video...");
                // ...
                // (Keep existing logic for YouTube)
                // ...
                const text = await gemini.generateContent(settings.model, promptConfig.prompt + "\n\nTarget: " + videoSource.youtubeUrl, videoSource.youtubeUrl, undefined, undefined);
                finalMarkdown = text;
            }

            setResultMarkdown(finalMarkdown);
            setExtractedImages(allImages);
            setProgress(100);
            setStatusMessage(t.messages.done);

        } catch (error: unknown) {
            console.error(error);
            const message = error instanceof Error ? error.message : "Unknown error occurred";
            addLog(message, "error");
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
            if (videoSource.type === 'file' && videoSource.files && videoSource.files.length > 0) {
                // Use first file name or a generic name if multiple
                if (videoSource.files.length === 1) {
                    const fileName = videoSource.files[0].name;
                    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
                    zipFileName = `${nameWithoutExt}.zip`;
                } else {
                    zipFileName = `multi_video_documents_${new Date().toISOString().slice(0, 10)}.zip`;
                }
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
        <>
            <IntroModal />
            <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6}>
                <VStack gap={6} p={1} align="stretch">
                    <Box bg="white" p={6} rounded="xl" shadow="sm" borderWidth="1px">
                        <Heading size="md" mb={4}>{t.dashboard.videoSourceTitle}</Heading>
                        <VideoSourceSelector
                            value={videoSource}
                            onChange={handleVideoSourceChange}
                            mode={videoSourceMode}
                            onModeChange={handleVideoSourceModeChange}
                        />
                        {isYoutubeSelected && (
                            <Text
                                mt={4}
                                fontSize="sm"
                                color="orange.700"
                                bg="orange.50"
                                borderWidth="1px"
                                borderColor="orange.100"
                                rounded="md"
                                p={3}
                            >
                                {t.dashboard.youtubeScreenshotNotice}
                            </Text>
                        )}
                    </Box>

                    <Box bg="white" p={6} rounded="xl" shadow="sm" borderWidth="1px">
                        <Heading size="md" mb={4}>{t.dashboard.promptSettingsTitle}</Heading>
                        <PromptSettings
                            config={promptConfig}
                            onChange={handlePromptConfigChange}
                            isYoutube={isYoutubeSelected}
                        />
                    </Box>

                    <ActionPanel
                        onGenerate={handleGenerate}
                        isProcessing={isProcessing}
                        disabled={!videoSource}
                    />
                </VStack>

                <VStack gap={6} p={1} align="stretch">
                    <Box bg="white" p={6} rounded="xl" shadow="sm" borderWidth="1px">
                        <Heading size="md" mb={4}>{t.dashboard.statusTitle}</Heading>
                        <ProgressSection progress={progress} statusMessage={statusMessage} />
                    </Box>

                    <LogSection logs={logs} onClear={clearLogs} />

                    <Box bg="white" p={6} rounded="xl" shadow="sm" borderWidth="1px" flex="1" minH="300px">
                        <ResultPreview content={resultMarkdown} onDownload={handleDownload} />
                    </Box>
                </VStack>
            </Grid>
        </>
    );
};
