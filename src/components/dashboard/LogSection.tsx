import React, { useRef, useEffect } from 'react';
import { Box, Flex, Text, IconButton, VStack } from '@chakra-ui/react';
import type { ProcessingLog } from '../../types';
import { Trash2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

interface Props {
    logs: ProcessingLog[];
    onClear: () => void;
}

export const LogSection: React.FC<Props> = ({ logs, onClear }) => {
    const { t } = useApp();
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <Box h="64" borderWidth="1px" borderColor="gray.200" rounded="lg" overflow="hidden" bg="gray.900" color="gray.100" fontFamily="mono" fontSize="xs" display="flex" flexDirection="column">
            <Flex align="center" justify="space-between" px={3} py={2} bg="gray.800" borderBottomWidth="1px" borderColor="gray.700">
                <Text fontWeight="semibold" color="gray.300">{t.dashboard.logsTitle}</Text>
                <IconButton
                    aria-label="Clear logs"
                    size="xs"
                    variant="ghost"
                    color="gray.400"
                    _hover={{ color: 'white' }}
                    onClick={onClear}
                >
                    <Trash2 size={14} />
                </IconButton>
            </Flex>
            <Box flex="1" overflowY="auto" p={3}>
                <VStack align="stretch" gap={1}>
                    {logs.length === 0 && (
                        <Text color="gray.500" fontStyle="italic">No logs yet...</Text>
                    )}
                    {logs.map((log, i) => (
                        <Box key={i} color={log.type === 'error' ? 'red.400' : log.type === 'success' ? 'green.400' : 'gray.300'}>
                            <Box as="span" color="gray.500" mr={2}>[{new Date(log.timestamp).toLocaleTimeString()}]</Box>
                            {log.message}
                        </Box>
                    ))}
                    <div ref={endRef} />
                </VStack>
            </Box>
        </Box>
    );
};
