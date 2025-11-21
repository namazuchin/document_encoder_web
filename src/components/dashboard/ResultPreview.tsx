import React from 'react';
import { Download, Copy, Check } from 'lucide-react';
import { Box, Flex, Heading, Button, Textarea, HStack } from '@chakra-ui/react';
import { useApp } from '../../contexts/AppContext';

interface Props {
    content: string;
    onDownload: () => void;
}

export const ResultPreview: React.FC<Props> = ({ content, onDownload }) => {
    const { t } = useApp();
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!content) return null;

    return (
        <Box display="flex" flexDirection="column" h="full">
            <Flex align="center" justify="space-between" mb={2}>
                <Heading size="sm" color="gray.700">{t.dashboard.resultTitle}</Heading>
                <HStack gap={2}>
                    <Button
                        onClick={handleCopy}
                        size="xs"
                        variant="outline"
                    >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        <Box as="span" ml={1}>{copied ? t.common.copied : t.common.copy}</Box>
                    </Button>
                    <Button
                        onClick={onDownload}
                        size="xs"
                        colorScheme="blue"
                    >
                        <Download size={14} />
                        <Box as="span" ml={1}>{t.common.download}</Box>
                    </Button>
                </HStack>
            </Flex>
            <Textarea
                flex="1"
                w="full"
                p={4}
                borderWidth="1px"
                borderColor="gray.200"
                rounded="lg"
                fontFamily="mono"
                fontSize="sm"
                bg="gray.50"
                resize="none"
                _focus={{ outline: 'none', borderColor: 'blue.500', ring: 1, ringColor: 'blue.500' }}
                value={content}
                readOnly
            />
        </Box>
    );
};
