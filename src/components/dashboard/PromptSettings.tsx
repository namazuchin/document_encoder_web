import React, { useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { VStack, Box, Text, NativeSelect, HStack, Switch, Textarea } from '@chakra-ui/react';
import { Image as ImageIcon } from 'lucide-react';
import { buildScreenshotPromptInstruction } from '../../services/screenshot';

export interface PromptConfig {
    prompt: string;
    language: 'ja' | 'en';
    extractScreenshots: boolean;
    cropScreenshots?: boolean;
    screenshotFrequency: 'minimal' | 'moderate' | 'detailed';
}

interface Props {
    config: PromptConfig;
    onChange: (config: PromptConfig) => void;
    isYoutube: boolean;
}

const DEFAULT_PROMPTS = {
    ja: `動画の内容を詳細に解説するドキュメントを作成してください。
重要なポイント、手順、概念を明確に記述し、必要に応じて箇条書きや表を使用してください。`,
    en: `Create a detailed document explaining the content of the video.
Clearly describe important points, steps, and concepts, using bullet points and tables as needed.`
};

export const PromptSettings: React.FC<Props> = ({ config, onChange, isYoutube }) => {
    const { presets, t } = useApp();

    useEffect(() => {
        if (!config.prompt) {
            onChange({ ...config, prompt: DEFAULT_PROMPTS[config.language] });
        }
    }, []);

    const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const presetId = e.target.value;
        if (!presetId) return;

        const preset = presets.find(p => p.id === presetId);
        if (preset) {
            onChange({ ...config, prompt: preset.content });
        } else if (presetId === 'default') {
            onChange({ ...config, prompt: DEFAULT_PROMPTS[config.language] });
        }
    };

    // システムプロンプトを生成（スクリーンショットが有効な場合のみ）
    const systemPrompt = config.extractScreenshots && !isYoutube
        ? buildScreenshotPromptInstruction(config.screenshotFrequency, config.cropScreenshots)
        : '';

    return (
        <VStack gap={4} align="stretch">
            <Box>
                <Text mb={2} fontSize="sm" fontWeight="medium" color="gray.700">{t.dashboard.preset}</Text>
                <NativeSelect.Root>
                    <NativeSelect.Field onChange={handlePresetChange} defaultValue="">
                        <option value="" disabled>{t.dashboard.selectPreset}</option>
                        <option value="default">{t.dashboard.defaultPreset}</option>
                        {presets.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                </NativeSelect.Root>
            </Box>

            <Box>
                <Text mb={2} fontSize="sm" fontWeight="medium" color="gray.700">{t.dashboard.language}</Text>
                <NativeSelect.Root>
                    <NativeSelect.Field
                        value={config.language}
                        onChange={(e) => onChange({ ...config, language: e.currentTarget.value as 'ja' | 'en' })}
                    >
                        <option value="ja">{t.dashboard.japanese}</option>
                        <option value="en">{t.dashboard.english}</option>
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                </NativeSelect.Root>
            </Box>

            {!isYoutube && (
                <Box p={4} borderWidth="1px" borderRadius="md" borderColor="gray.200">
                    <HStack mb={3} gap={2} color="gray.700">
                        <ImageIcon size={18} />
                        <Text fontSize="sm" fontWeight="bold">{t.dashboard.screenshotSettings}</Text>
                    </HStack>

                    <HStack gap={3} alignItems="center" flexWrap="wrap">
                        <Switch.Root
                            checked={config.extractScreenshots}
                            onCheckedChange={(e) => onChange({ ...config, extractScreenshots: e.checked })}
                        >
                            <Switch.HiddenInput />
                            <Switch.Control>
                                <Switch.Thumb />
                            </Switch.Control>
                            <Switch.Label fontSize="sm">{t.dashboard.embedScreenshots}</Switch.Label>
                        </Switch.Root>

                        {config.extractScreenshots && (
                            <Switch.Root
                                checked={config.cropScreenshots}
                                onCheckedChange={(e) => onChange({ ...config, cropScreenshots: e.checked })}
                            >
                                <Switch.HiddenInput />
                                <Switch.Control>
                                    <Switch.Thumb />
                                </Switch.Control>
                                <Switch.Label fontSize="sm">{t.dashboard.cropScreenshots}</Switch.Label>
                            </Switch.Root>
                        )}

                        <HStack gap={2} alignItems="center" flex="0 0 auto">
                            <Text fontSize="sm" color="gray.600" whiteSpace="nowrap">{t.dashboard.frequency}:</Text>
                            <NativeSelect.Root size="sm" width="auto" disabled={!config.extractScreenshots}>
                                <NativeSelect.Field
                                    value={config.screenshotFrequency}
                                    onChange={(e) => onChange({ ...config, screenshotFrequency: e.currentTarget.value as any })}
                                    opacity={config.extractScreenshots ? 1 : 0.5}
                                >
                                    <option value="minimal">{t.dashboard.minimal}</option>
                                    <option value="moderate">{t.dashboard.moderate}</option>
                                    <option value="detailed">{t.dashboard.detailed}</option>
                                </NativeSelect.Field>
                                <NativeSelect.Indicator />
                            </NativeSelect.Root>
                        </HStack>
                    </HStack>

                    {config.extractScreenshots && systemPrompt && (
                        <Box mt={4}>
                            <Text mb={2} fontSize="sm" fontWeight="medium" color="gray.700">
                                {t.dashboard.systemPromptLabel}
                            </Text>
                            <Textarea
                                value={systemPrompt}
                                readOnly
                                h="24"
                                resize="none"
                                bg="gray.50"
                                fontSize="sm"
                                color="gray.600"
                                cursor="default"
                                _focus={{ outline: 'none' }}
                            />
                            <Text fontSize="xs" color="gray.500" mt={1}>
                                {t.dashboard.systemPromptHint}
                            </Text>
                        </Box>
                    )}
                </Box>
            )}

            <Box>
                <Text mb={2} fontSize="sm" fontWeight="medium" color="gray.700">{t.dashboard.prompt}</Text>
                <Textarea
                    value={config.prompt}
                    onChange={(e) => onChange({ ...config, prompt: e.target.value })}
                    placeholder={t.dashboard.promptPlaceholder}
                    h="32"
                    resize="none"
                />
            </Box>
        </VStack>
    );
};
