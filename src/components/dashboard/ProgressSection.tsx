import React from 'react';
import { VStack, Flex, Text, Box } from '@chakra-ui/react';
import { useApp } from '../../contexts/AppContext';


interface Props {
    progress: number;
    statusMessage: string;
}

export const ProgressSection: React.FC<Props> = ({ progress, statusMessage }) => {
    const { t } = useApp();

    return (
        <VStack gap={2} align="stretch">
            <Flex justify="space-between">
                <Text fontSize="sm" fontWeight="medium" color="gray.700">
                    {statusMessage || t.messages.done}
                </Text>
                <Text fontSize="sm" fontWeight="medium" color="gray.700">
                    {Math.round(progress)}%
                </Text>
            </Flex>
            <Box w="full" bg="gray.200" rounded="full" h="2.5" overflow="hidden">
                <Box
                    bg="blue.600"
                    h="2.5"
                    rounded="full"
                    transition="all 0.3s"
                    width={`${Math.max(0, Math.min(100, progress))}%`}
                />
            </Box>
        </VStack>
    );
};
