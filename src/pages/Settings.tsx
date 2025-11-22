import React, { useState, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { GEMINI_MODELS } from '../types';
import { Box, Heading, VStack, Text, Input, NativeSelect, Button, HStack } from '@chakra-ui/react';
import { Download, Upload, Trash2 } from 'lucide-react';
import { StorageService } from '../services/storage';

export const Settings: React.FC = () => {
    const { settings, updateSettings, t, updatePresets, language, addLog } = useApp();
    const [tempSettings, setTempSettings] = useState(settings);
    const [hasChanges, setHasChanges] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFieldChange = (newSettings: typeof tempSettings) => {
        setTempSettings(newSettings);
        setHasChanges(true);
    };

    const handleSave = async () => {
        await updateSettings(tempSettings);
        setHasChanges(false);
    };

    const handleReset = () => {
        setTempSettings(settings);
        setHasChanges(false);
    };

    const handleExport = async () => {
        const configJson = await StorageService.exportConfiguration();
        const blob = new Blob([configJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'document_encoder_config.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        addLog(t.settings.exportConfig, 'success');
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target?.result as string;
            const result = await StorageService.importConfiguration(content);

            if (result.success) {
                // Reload settings and presets from storage
                const newSettings = await StorageService.getSettings();
                const newPresets = StorageService.getPresets();
                setTempSettings(newSettings);
                await updateSettings(newSettings);
                updatePresets(newPresets);
                setHasChanges(false);

                addLog(t.settings.importSuccess, 'success');
            } else {
                addLog(`${t.settings.importError}: ${result.message || ''}`, 'error');
            }
        };
        reader.readAsText(file);

        // Reset file input
        event.target.value = '';
    };

    const handleClearStorage = async () => {
        if (!window.confirm(t.settings.clearStorageConfirm)) {
            return;
        }

        // Clear all localStorage data
        StorageService.clearSettings();
        StorageService.clearDashboardState();
        localStorage.clear();

        // Reset to default settings
        const defaultSettings = await StorageService.getSettings();
        const defaultPresets = StorageService.getPresets();
        setTempSettings(defaultSettings);
        await updateSettings(defaultSettings);
        updatePresets(defaultPresets);
        setHasChanges(false);

        addLog(t.settings.clearStorageSuccess, 'success');
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
                        value={tempSettings.maxFileSize / (1024 * 1024 * 1024)}
                        onChange={(e) => handleFieldChange({ ...tempSettings, maxFileSize: parseFloat(e.target.value) * 1024 * 1024 * 1024 || 0 })}
                        step="0.1"
                        min="0.1"
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

                <Box borderTopWidth="1px" borderColor="gray.200" pt={6}>
                    <Text mb={4} fontSize="sm" fontWeight="medium" color="gray.700">{t.settings.configManagement}</Text>
                    <HStack gap={3}>
                        <Button onClick={handleExport} variant="outline" colorScheme="blue">
                            <Download size={16} />
                            <Box as="span" ml={2}>{t.settings.exportConfig}</Box>
                        </Button>
                        <Button onClick={handleImportClick} variant="outline" colorScheme="green">
                            <Upload size={16} />
                            <Box as="span" ml={2}>{t.settings.importConfig}</Box>
                        </Button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="application/json"
                            onChange={handleImportFile}
                            style={{ display: 'none' }}
                        />
                    </HStack>
                    <Text fontSize="xs" color="gray.500" mt={2}>
                        {language === 'ja'
                            ? 'エクスポートにはAPIキーは含まれません。インポート時は既存のAPIキーが保持されます。'
                            : 'Export does not include API key. Existing API key will be preserved on import.'}
                    </Text>
                    <Box mt={4}>
                        <Button onClick={handleClearStorage} variant="outline" colorScheme="red" size="sm">
                            <Trash2 size={16} />
                            <Box as="span" ml={2}>{t.settings.clearStorage}</Box>
                        </Button>
                    </Box>
                </Box>
            </VStack>
        </Box>
    );
};
