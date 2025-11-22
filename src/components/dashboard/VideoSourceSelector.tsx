import React, { useState, useEffect } from 'react';
import { Upload, Youtube, X } from 'lucide-react';
import {
    Box, Tabs, Input, VStack, Icon, Text, Flex, IconButton,
    Button
} from '@chakra-ui/react';
import { useApp } from '../../contexts/AppContext';
import type { VideoSource } from '../../types';

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

    // valueが更新されたら入力欄にも反映
    useEffect(() => {
        if (value?.type === 'youtube') {
             setYtUrl(value.youtubeUrl || '');
             setYtTitle(value.youtubeTitle || '');
        }
    }, [value]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onChange({ type: 'file', file: e.target.files[0] });
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
                    <Flex
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
                                    {value.file?.name}
                                </Text>
                                <Text fontSize="xs" color="gray.500">
                                    {(value.file!.size / (1024 * 1024)).toFixed(2)} MB
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
            </Tabs.Content>

            <Tabs.Content value="youtube" px={0} pt={4}>
                <VStack gap={4} align="stretch">
                    <Box>
                        <Text mb={2} fontSize="sm" fontWeight="medium">{t.dashboard.youtubeUrl}</Text>
                        <Input
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={ytUrl}
                            onChange={(e) => setYtUrl(e.target.value)}
                        />
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
