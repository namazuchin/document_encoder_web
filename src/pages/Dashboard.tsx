import React, { useState, useRef } from 'react';
import { Grid, VStack, Box, Heading, Text } from '@chakra-ui/react';
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
    const [videoSourceMode, setVideoSourceMode] = useState<'file' | 'youtube'>('file');

    const activeSourceType = videoSource?.type ?? videoSourceMode;
    const isYoutubeSelected = activeSourceType === 'youtube';

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
            let mimeType: string | undefined = "video/mp4";

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
                fileUri = videoSource.youtubeUrl;
                mimeType = undefined;
            }

            // 2. Generate Document with screenshot instruction
            setStatusMessage("Generating document...");
            setProgress(50);
            addLog(`Sending request to ${settings.model}...`);

            const finalPrompt = `${promptConfig.prompt}\n\nTarget Video: ${videoSource.type === 'youtube' ? videoSource.youtubeUrl : '(Attached Video)'}\nLanguage: ${promptConfig.language === 'ja' ? 'Japanese' : 'English'}`;

            // スクリーンショット指示を生成（YouTubeソースでは無効）
            const shouldBuildScreenshotInstruction = promptConfig.extractScreenshots && videoSource?.type === 'file';
            const screenshotInstruction = shouldBuildScreenshotInstruction
                ? buildScreenshotPromptInstruction(promptConfig.screenshotFrequency)
                : undefined;

            const text = await gemini.generateContent(settings.model, finalPrompt, fileUri, mimeType, screenshotInstruction);
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
        <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6}>
            <VStack gap={6} p={1} align="stretch">
                <Box bg="white" p={6} rounded="xl" shadow="sm" borderWidth="1px">
                    <Heading size="md" mb={4}>{t.dashboard.videoSourceTitle}</Heading>
                    <VideoSourceSelector
                        value={videoSource}
                        onChange={setVideoSource}
                        mode={videoSourceMode}
                        onModeChange={setVideoSourceMode}
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
                        onChange={setPromptConfig}
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
    );
};
