import React from 'react';
import { Outlet, Link as RouterLink } from 'react-router-dom';
import { Settings, List, ChevronDown } from 'lucide-react';
import { Box, Flex, Heading, HStack, Icon, IconButton, Badge, Menu, Button, Image } from '@chakra-ui/react';
import { useApp } from '../../contexts/AppContext';
import { GEMINI_MODELS } from '../../types';

export const AppLayout: React.FC = () => {
    const { t, settings, updateSettings } = useApp();

    const currentModelName = GEMINI_MODELS.find(m => m.id === settings.model)?.name || settings.model;

    const handleModelChange = (modelId: string) => {
        updateSettings({ ...settings, model: modelId }, false);
    };

    return (
        <Box minH="100vh" bg="gray.50" display="flex" flexDirection="column">
            <Flex
                as="header"
                bg="white"
                borderBottomWidth="1px"
                borderColor="gray.200"
                py={4}
                px={6}
                align="center"
                justify="space-between"
            >
                {/* @ts-expect-error Chakra UI 'as' prop type mismatch with RouterLink */}
                <Box as={RouterLink} to="/" _hover={{ textDecoration: 'none' }}>
                    <Flex align="center" gap={2}>
                        <Image src="/favicon.svg" boxSize={8} alt="Logo" />
                        <Heading as="h1" size="md" color="gray.800">
                            {t.layout.appTitle}
                        </Heading>
                    </Flex>
                </Box>
                <HStack as="nav" gap={4}>
                    <Menu.Root>
                        <Menu.Trigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                px={2}
                                borderRadius="full"
                            >
                                <HStack gap={2}>
                                    <Badge colorScheme="purple" variant="subtle" px={2} py={1} borderRadius="full" fontSize="xs">
                                        {currentModelName}
                                    </Badge>
                                    <Icon as={ChevronDown} />
                                </HStack>
                            </Button>
                        </Menu.Trigger>
                        <Menu.Positioner>
                            <Menu.Content zIndex={10}>
                                {GEMINI_MODELS.map(model => (
                                    <Menu.Item
                                        key={model.id}
                                        value={model.id}
                                        onClick={() => handleModelChange(model.id)}
                                        fontWeight={settings.model === model.id ? 'bold' : 'normal'}
                                    >
                                        {model.name}
                                    </Menu.Item>
                                ))}
                            </Menu.Content>
                        </Menu.Positioner>
                    </Menu.Root>
                    <RouterLink to="/prompts" title={t.layout.promptPresetsTooltip}>
                        <IconButton
                            aria-label={t.layout.promptPresetsTooltip}
                            variant="ghost"
                            rounded="full"
                            color="gray.600"
                            _hover={{ bg: 'gray.100' }}
                        >
                            <List size={20} />
                        </IconButton>
                    </RouterLink>
                    <RouterLink to="/settings" title={t.layout.settingsTooltip}>
                        <IconButton
                            aria-label={t.layout.settingsTooltip}
                            variant="ghost"
                            rounded="full"
                            color="gray.600"
                            _hover={{ bg: 'gray.100' }}
                        >
                            <Settings size={20} />
                        </IconButton>
                    </RouterLink>
                </HStack>
            </Flex>
            <Box as="main" flex="1" p={6} maxW="1280px" w="100%" mx="auto">
                <Outlet />
            </Box>
        </Box>
    );
};
