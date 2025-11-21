import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { type PromptPreset } from '../types';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { Box, Heading, Button, VStack, HStack, Input, Textarea, Text, IconButton, Flex } from '@chakra-ui/react';

export const PromptManager: React.FC = () => {
    const { presets, updatePresets, t } = useApp();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<PromptPreset | null>(null);

    const handleCreate = () => {
        const newPreset: PromptPreset = {
            id: crypto.randomUUID(),
            name: t.promptManager.newPreset,
            content: '',
            isDefault: false
        };
        setEditForm(newPreset);
        setEditingId(newPreset.id);
    };

    const handleEdit = (preset: PromptPreset) => {
        setEditForm({ ...preset });
        setEditingId(preset.id);
    };

    const handleDelete = (id: string) => {
        if (confirm(t.promptManager.deleteConfirm)) {
            updatePresets(presets.filter(p => p.id !== id));
        }
    };

    const handleSave = () => {
        if (!editForm) return;

        if (presets.find(p => p.id === editForm.id)) {
            updatePresets(presets.map(p => p.id === editForm.id ? editForm : p));
        } else {
            updatePresets([...presets, editForm]);
        }
        setEditingId(null);
        setEditForm(null);
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditForm(null);
    };

    return (
        <Box maxW="4xl" mx="auto" bg="white" rounded="lg" shadow="sm" p={6} borderWidth="1px" borderColor="gray.200">
            <Flex justify="space-between" align="center" mb={6}>
                <Heading size="md" color="gray.800">{t.promptManager.title}</Heading>
                {!editingId && (
                    <Button onClick={handleCreate} colorScheme="blue">
                        <Plus size={16} />
                        <Box as="span" ml={2}>{t.promptManager.newPreset}</Box>
                    </Button>
                )}
            </Flex>

            {editingId && editForm ? (
                <Box bg="gray.50" p={4} rounded="lg" borderWidth="1px" borderColor="blue.200" mb={6}>
                    <Heading size="sm" mb={4} color="blue.800">
                        {presets.find(p => p.id === editForm.id) ? t.promptManager.editPreset : t.promptManager.newPreset}
                    </Heading>
                    <VStack gap={4} align="stretch">
                        <Box>
                            <Text mb={2} fontSize="sm" fontWeight="medium" color="gray.700">{t.promptManager.nameLabel}</Text>
                            <Input
                                type="text"
                                value={editForm.name}
                                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                bg="white"
                            />
                        </Box>
                        <Box>
                            <Text mb={2} fontSize="sm" fontWeight="medium" color="gray.700">{t.promptManager.contentLabel}</Text>
                            <Textarea
                                h="48"
                                value={editForm.content}
                                onChange={e => setEditForm({ ...editForm, content: e.target.value })}
                                bg="white"
                            />
                        </Box>
                        <HStack gap={2} justify="flex-end">
                            <Button onClick={handleCancel} variant="ghost">
                                <X size={16} />
                                <Box as="span" ml={2}>{t.common.cancel}</Box>
                            </Button>
                            <Button onClick={handleSave} colorScheme="blue">
                                <Save size={16} />
                                <Box as="span" ml={2}>{t.common.save}</Box>
                            </Button>
                        </HStack>
                    </VStack>
                </Box>
            ) : (
                <VStack gap={3} align="stretch">
                    {presets.length === 0 && (
                        <Text textAlign="center" color="gray.500" py={8}>
                            {t.promptManager.noPresets}
                        </Text>
                    )}
                    {presets.map(preset => (
                        <Flex
                            key={preset.id}
                            align="center"
                            justify="space-between"
                            p={4}
                            bg="gray.50"
                            rounded="lg"
                            borderWidth="1px"
                            borderColor="gray.200"
                            _hover={{ borderColor: 'blue.300' }}
                            transition="all 0.2s"
                        >
                            <Box overflow="hidden" mr={4}>
                                <Heading size="sm" color="gray.900" mb={1}>{preset.name}</Heading>
                                <Text fontSize="sm" color="gray.500" truncate maxW="md">{preset.content}</Text>
                            </Box>
                            <HStack gap={2}>
                                <IconButton
                                    aria-label="Edit"
                                    onClick={() => handleEdit(preset)}
                                    variant="ghost"
                                    color="gray.600"
                                    _hover={{ color: 'blue.600', bg: 'blue.50' }}
                                    rounded="full"
                                >
                                    <Edit2 size={18} />
                                </IconButton>
                                <IconButton
                                    aria-label="Delete"
                                    onClick={() => handleDelete(preset.id)}
                                    variant="ghost"
                                    color="gray.600"
                                    _hover={{ color: 'red.600', bg: 'red.50' }}
                                    rounded="full"
                                >
                                    <Trash2 size={18} />
                                </IconButton>
                            </HStack>
                        </Flex>
                    ))}
                </VStack>
            )}
        </Box>
    );
};
