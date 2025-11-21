import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { GEMINI_MODELS } from '../types';
import { Box, Heading, VStack, Text, Input, NativeSelect, Button, HStack } from '@chakra-ui/react';

export const Settings: React.FC = () => {
    const { settings, updateSettings, t } = useApp();
    const [tempSettings, setTempSettings] = useState(settings);
    const [hasChanges, setHasChanges] = useState(false);

    const handleFieldChange = (newSettings: typeof tempSettings) => {
        setTempSettings(newSettings);
        setHasChanges(true);
    };

    const handleSave = () => {
        updateSettings(tempSettings);
        setHasChanges(false);
    };

    const handleReset = () => {
        setTempSettings(settings);
        setHasChanges(false);
    };

    return (
        <Box maxW="2xl" mx="auto" bg="white" rounded="lg" shadow="sm" p={6} borderWidth="1px" borderColor="gray.200">
            <Heading size="md" color="gray.800" mb={6}>{t.settings.title}</Heading>

            <VStack gap={6} align="stretch">
                <Box>
                    <Text mb={2} fontSize="sm" fontWeight="medium" color="gray.700">{t.settings.apiKeyLabel}</Text>
                    <Input
                        type="password"
                        value={tempSettings.apiKey}
                        onChange={(e) => handleFieldChange({ ...tempSettings, apiKey: e.target.value })}
                        placeholder={t.settings.apiKeyPlaceholder}
                    />
                    <Text fontSize="xs" color="gray.500" mt={1}>
                        {t.settings.apiKeyHint}
                    </Text>
                </Box>

                <Box>
                    <Text mb={2} fontSize="sm" fontWeight="medium" color="gray.700">{t.settings.modelLabel}</Text>
                    <NativeSelect.Root>
                        <NativeSelect.Field
                            value={tempSettings.model}
                            onChange={(e) => handleFieldChange({ ...tempSettings, model: e.currentTarget.value })}
                        >
                            {GEMINI_MODELS.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                    </NativeSelect.Root>
                </Box>

                <Box>
                    <Text mb={2} fontSize="sm" fontWeight="medium" color="gray.700">{t.settings.languageLabel}</Text>
                    <NativeSelect.Root>
                        <NativeSelect.Field
                            value={tempSettings.language}
                            onChange={(e) => handleFieldChange({ ...tempSettings, language: e.currentTarget.value as 'ja' | 'en' })}
                        >
                            <option value="ja">{t.dashboard.japanese}</option>
                            <option value="en">{t.dashboard.english}</option>
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                    </NativeSelect.Root>
                </Box>

                <Box>
                    <Text mb={2} fontSize="sm" fontWeight="medium" color="gray.700">{t.settings.maxFileSizeLabel}</Text>
                    <Input
                        type="number"
                        value={tempSettings.maxFileSize}
                        onChange={(e) => handleFieldChange({ ...tempSettings, maxFileSize: parseInt(e.target.value) || 0 })}
                    />
                    <Text fontSize="xs" color="gray.500" mt={1}>
                        {t.settings.maxFileSizeHint}
                    </Text>
                </Box>

                <HStack gap={3} pt={4}>
                    <Button
                        onClick={handleSave}
                        disabled={!hasChanges}
                        colorScheme="blue"
                        px={6}
                    >
                        {t.common.save}
                    </Button>
                    <Button
                        onClick={handleReset}
                        disabled={!hasChanges}
                        variant="outline"
                        px={6}
                    >
                        {t.common.reset}
                    </Button>
                </HStack>

                {hasChanges && (
                    <Text fontSize="sm" color="orange.600" mt={2}>
                        {t.common.unsavedChanges}
                    </Text>
                )}
            </VStack>
        </Box>
    );
};
