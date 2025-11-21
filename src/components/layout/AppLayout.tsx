import React from 'react';
import { Outlet, Link as RouterLink } from 'react-router-dom';
import { Settings, FileText, List } from 'lucide-react';
import { Box, Flex, Heading, HStack, Icon, IconButton } from '@chakra-ui/react';
import { useApp } from '../../contexts/AppContext';

export const AppLayout: React.FC = () => {
    const { t } = useApp();

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
                {/* @ts-ignore */}
                <Box as={RouterLink} to="/" _hover={{ textDecoration: 'none' }}>
                    <Flex align="center" gap={2}>
                        <Icon as={FileText} color="blue.500" boxSize={6} />
                        <Heading as="h1" size="md" color="gray.800">
                            {t.layout.appTitle}
                        </Heading>
                    </Flex>
                </Box>
                <HStack as="nav" gap={4}>
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
