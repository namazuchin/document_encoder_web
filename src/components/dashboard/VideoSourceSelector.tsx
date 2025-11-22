import React, { useState } from 'react';
import { Upload, Youtube, X } from 'lucide-react';
import {
    Box, Tabs, Input, VStack, Icon, Text, Flex, IconButton,
    Button, Spinner
} from '@chakra-ui/react';
import { useApp } from '../../contexts/AppContext';
import { fetchYouTubeTitle, isValidYouTubeUrl } from '../../services/youtube';
import { toaster } from '../../../src/main';

export interface VideoSource {
    type: 'file' | 'youtube';
    files?: File[];
    youtubeUrl?: string;
    youtubeTitle?: string;
}

interface Props {
    value: VideoSource | null;
    onChange: (source: VideoSource | null) => void;
    mode: 'file' | 'youtube';
    onModeChange: (mode: 'file' | 'youtube') => void;
}

export const VideoSourceSelector: React.FC<Props> = ({ value, onChange, mode, onModeChange }) => {
    const { t } = useApp();
    const [ytUrl, setYtUrl] = useState('');
    const [ytTitle, setYtTitle] = useState('');
    const [isFetchingTitle, setIsFetchingTitle] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            // If there are existing files, append new ones, otherwise just set new ones
            // Actually, usually file input replaces selection unless we manage it manually.
            // Let's just replace for now to keep it simple, or append if we want accumulator behavior.
            // Given the UI, replacing is standard for a single input, but we might want to allow adding more.
            // For now, let's replace to match standard behavior, user can select multiple at once.
            onChange({ type: 'file', files: newFiles });
        }
    };

    const handleRemoveFile = (index: number) => {
        if (value?.type === 'file' && value.files) {
            const newFiles = value.files.filter((_, i) => i !== index);
            if (newFiles.length === 0) {
                onChange(null);
            } else {
                onChange({ ...value, files: newFiles });
            }
        }
    };

    const handleFetchTitle = async () => {
        if (!ytUrl) {
            toaster.create({
                title: t.messages.invalidYoutubeUrl,
                type: 'error',
                duration: 3000,
            });
            return;
        }

        if (!isValidYouTubeUrl(ytUrl)) {
            toaster.create({
                title: t.messages.invalidYoutubeUrl,
                type: 'error',
                duration: 3000,
            });
            return;
        }

        setIsFetchingTitle(true);
        try {
            const title = await fetchYouTubeTitle(ytUrl);
            setYtTitle(title);
            toaster.create({
                title: t.messages.titleFetchSuccess,
                type: 'success',
                duration: 2000,
            });
        } catch (error) {
            console.error('Failed to fetch YouTube title:', error);
            toaster.create({
                title: t.messages.titleFetchError,
                description: error instanceof Error ? error.message : 'Unknown error',
                type: 'error',
                duration: 4000,
            });
        } finally {
            setIsFetchingTitle(false);
        }
    };

    const handleYoutubeSubmit = () => {
        if (ytUrl && ytTitle) {
            onChange({ type: 'youtube', youtubeUrl: ytUrl, youtubeTitle: ytTitle });
        }
    };

    return (
        <Tabs.Root value={mode} onValueChange={(e) => onModeChange(e.value as 'file' | 'youtube')} variant="enclosed">
            <Tabs.List>
                <Tabs.Trigger value="file">{t.dashboard.localFileTab}</Tabs.Trigger>
                <Tabs.Trigger value="youtube">{t.dashboard.youtubeTab}</Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="file" px={0} pt={4}>
                {!value || value.type !== 'file' ? (
                    <Box
                        borderWidth={2}
                        borderStyle="dashed"
                        borderColor="gray.300"
                        rounded="lg"
                        p={8}
                        textAlign="center"
                        _hover={{ borderColor: 'blue.500' }}
                        transition="all 0.2s"
                    >
                        <Input
                            type="file"
                            id="video-upload"
                            display="none"
                            accept="video/*"
                            multiple
                            onChange={handleFileChange}
                        />
                        <label htmlFor="video-upload" style={{ cursor: 'pointer', width: '100%', display: 'block' }}>
                            <VStack gap={2}>
                                <Icon as={Upload} boxSize={8} color="gray.400" />
                                <Text fontSize="sm" color="gray.600">{t.dashboard.uploadPrompt}</Text>
                                <Text fontSize="xs" color="gray.400">{t.dashboard.uploadHint}</Text>
                            </VStack>
                        </label>
                    </Box>
                ) : (
                    <VStack align="stretch" gap={2}>
                        {value.files?.map((file, index) => (
                            <Flex
                                key={`${file.name}-${index}`}
                                align="center"
                                justify="space-between"
                                p={3}
                                bg="gray.50"
                                rounded="md"
                                borderWidth="1px"
                                borderColor="gray.200"
                            >
                                <Flex align="center" gap={3} overflow="hidden">
                                    <Box p={2} bg="blue.100" rounded="md" color="blue.600">
                                        <Icon as={Upload} boxSize={5} />
                                    </Box>
                                    <Box minW={0}>
                                        <Text fontSize="sm" fontWeight="medium" color="gray.900" truncate>
                                            {file.name}
                                        </Text>
                                        <Text fontSize="xs" color="gray.500">
                                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                                        </Text>
                                    </Box>
                                </Flex>
                                <IconButton
                                    aria-label="Remove video"
                                    size="sm"
                                    variant="ghost"
                                    color="gray.400"
                                    _hover={{ color: 'red.500', bg: 'red.50' }}
                                    onClick={() => handleRemoveFile(index)}
                                    rounded="full"
                                >
                                    <X size={18} />
                                </IconButton>
                            </Flex>
                        ))}
                        <Box
                            borderWidth={2}
                            borderStyle="dashed"
                            borderColor="gray.200"
                            rounded="lg"
                            p={4}
                            textAlign="center"
                            _hover={{ borderColor: 'blue.500' }}
                            transition="all 0.2s"
                            mt={2}
                        >
                            <Input
                                type="file"
                                id="video-upload-more"
                                display="none"
                                accept="video/*"
                                multiple
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        const newFiles = Array.from(e.target.files);
                                        onChange({
                                            type: 'file',
                                            files: [...(value.files || []), ...newFiles]
                                        });
                                    }
                                }}
                            />
                            <label htmlFor="video-upload-more" style={{ cursor: 'pointer', width: '100%', display: 'block' }}>
                                <Text fontSize="sm" color="blue.500">Add more videos</Text>
                            </label>
                        </Box>
                    </VStack>
                )}
                <Text fontSize="xs" color="gray.500" mt={2}>
                    {t.dashboard.videoUploadNotice}
                </Text>
            </Tabs.Content>

            <Tabs.Content value="youtube" px={0} pt={4}>
                <VStack gap={4} align="stretch">
                    <Box>
                        <Text mb={2} fontSize="sm" fontWeight="medium">{t.dashboard.youtubeUrl}</Text>
                        <Flex gap={2}>
                            <Input
                                placeholder="https://www.youtube.com/watch?v=..."
                                value={ytUrl}
                                onChange={(e) => setYtUrl(e.target.value)}
                                flex={1}
                            />
                            <Button
                                onClick={handleFetchTitle}
                                disabled={!ytUrl || isFetchingTitle}
                                colorScheme="gray"
                                minW="120px"
                            >
                                {isFetchingTitle ? (
                                    <>
                                        <Spinner size="sm" mr={2} />
                                        {t.dashboard.fetchingTitle}
                                    </>
                                ) : (
                                    t.dashboard.fetchTitle
                                )}
                            </Button>
                        </Flex>
                    </Box>
                    <Box>
                        <Text mb={2} fontSize="sm" fontWeight="medium">{t.dashboard.videoTitle}</Text>
                        <Input
                            placeholder={t.dashboard.videoTitle}
                            value={ytTitle}
                            onChange={(e) => setYtTitle(e.target.value)}
                        />
                    </Box>
                    <Button
                        colorScheme="blue"
                        onClick={handleYoutubeSubmit}
                        disabled={!ytUrl || !ytTitle}
                        width="full"
                    >
                        {t.dashboard.setVideo}
                    </Button>

                    {value?.type === 'youtube' && (
                        <Flex
                            align="center"
                            justify="space-between"
                            p={3}
                            bg="gray.50"
                            rounded="md"
                            borderWidth="1px"
                            borderColor="gray.200"
                            mt={2}
                        >
                            <Flex align="center" gap={3} overflow="hidden">
                                <Box p={2} bg="red.100" rounded="md" color="red.600">
                                    <Icon as={Youtube} boxSize={5} />
                                </Box>
                                <Box minW={0}>
                                    <Text fontSize="sm" fontWeight="medium" color="gray.900" truncate>
                                        {value.youtubeTitle}
                                    </Text>
                                    <Text fontSize="xs" color="gray.500" truncate>
                                        {value.youtubeUrl}
                                    </Text>
                                </Box>
                            </Flex>
                            <IconButton
                                aria-label="Remove video"
                                size="sm"
                                variant="ghost"
                                color="gray.400"
                                _hover={{ color: 'red.500', bg: 'red.50' }}
                                onClick={() => onChange(null)}
                                rounded="full"
                            >
                                <X size={18} />
                            </IconButton>
                        </Flex>
                    )}
                </VStack>
            </Tabs.Content>
        </Tabs.Root>
    );
};
