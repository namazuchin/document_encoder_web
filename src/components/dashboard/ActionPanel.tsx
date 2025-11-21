import React from 'react';
import { Play } from 'lucide-react';
import { Box, Button } from '@chakra-ui/react';
import { useApp } from '../../contexts/AppContext';

interface Props {
    onGenerate: () => void;
    isProcessing: boolean;
    disabled: boolean;
}

export const ActionPanel: React.FC<Props> = ({ onGenerate, isProcessing, disabled }) => {
    const { t } = useApp();
    return (
        <Box pt={4} borderTopWidth="1px" borderColor="gray.200">
            <Button
                width="full"
                size="lg"
                colorScheme="blue"
                onClick={onGenerate}
                disabled={disabled || isProcessing}
                loading={isProcessing}
                loadingText={t.dashboard.processing}
            >
                <Play fill="currentColor" style={{ marginRight: '8px' }} />
                {t.common.generate}
            </Button>
        </Box>
    );
};
