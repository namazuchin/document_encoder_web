import React, { useState, useEffect } from 'react';
import {
    Dialog,
    Button,
    Text,
    VStack,
    Box,
    HStack,
    Heading,
    Icon,
    Flex
} from '@chakra-ui/react';
import {
    FileVideo,
    Shield,
    Layers,
    Settings,
    AlertTriangle,
    ChevronRight,
    Check
} from 'lucide-react';

const INTRO_STORAGE_KEY = 'hasSeenIntro_v1';

interface IntroStep {
    title: string;
    description: string;
    icon: React.ElementType;
    color: string;
}

const steps: IntroStep[] = [
    {
        title: "サービスの概要",
        description: "Geminiを利用して動画ファイルからドキュメントをスクリーンショット付きで生成できます。",
        icon: FileVideo,
        color: "blue.500"
    },
    {
        title: "プライバシーとセキュリティ",
        description: "データはGoogle Geminiへのアップロードとローカルのみに保持され、外部サーバーには保存されません。",
        icon: Shield,
        color: "green.500"
    },
    {
        title: "複数動画のサポート",
        description: "複数の動画ファイルをアップロードし、一つのドキュメントとして纏めることができます。",
        icon: Layers,
        color: "purple.500"
    },
    {
        title: "カスタマイズ可能なプロンプト",
        description: "プロンプトは自由にカスタマイズでき、テンプレートとして保存して再利用可能です。",
        icon: Settings,
        color: "orange.500"
    },
    {
        title: "注意点",
        description: "大容量の動画ファイルはブラウザのメモリ制限により、処理中にエラーが発生する可能性があります。",
        icon: AlertTriangle,
        color: "red.500"
    }
];

export const IntroModal: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        const hasSeen = localStorage.getItem(INTRO_STORAGE_KEY);
        if (!hasSeen) {
            setIsOpen(true);
        }
    }, []);

    const handleClose = () => {
        localStorage.setItem(INTRO_STORAGE_KEY, 'true');
        setIsOpen(false);
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleClose();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    // Using static colors for now as useColorModeValue might differ in v3
    const bgColor = 'gray.50';
    const iconBgColor = 'white';

    const step = steps[currentStep];

    return (
        <Dialog.Root open={isOpen} onOpenChange={(e) => setIsOpen(e.open)} size="xl" placement="center">
            <Dialog.Backdrop backdropFilter="blur(4px)" />
            <Dialog.Positioner>
                <Dialog.Content borderRadius="xl" overflow="hidden">
                    <Dialog.Body p={0}>
                        <Flex direction={{ base: 'column', md: 'row' }} minH="400px">
                            {/* Image/Icon Area */}
                            <Box
                                flex="1"
                                bg={bgColor}
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                p={8}
                                position="relative"
                                overflow="hidden"
                            >
                                {/* Decorative circles */}
                                <Box position="absolute" top="-20%" left="-20%" w="200px" h="200px" borderRadius="full" bg={step.color} opacity="0.1" />
                                <Box position="absolute" bottom="-10%" right="-10%" w="150px" h="150px" borderRadius="full" bg={step.color} opacity="0.1" />

                                <VStack gap={6} zIndex={1}>
                                    <Box
                                        p={8}
                                        bg={iconBgColor}
                                        borderRadius="full"
                                        boxShadow="lg"
                                        transition="all 0.3s ease"
                                    >
                                        <Icon as={step.icon} w={16} h={16} color={step.color} />
                                    </Box>
                                </VStack>
                            </Box>

                            {/* Content Area */}
                            <Box flex="1" p={8} display="flex" flexDirection="column">
                                <VStack align="start" gap={4} flex="1" justify="center">
                                    <Text
                                        fontSize="xs"
                                        fontWeight="bold"
                                        textTransform="uppercase"
                                        letterSpacing="wider"
                                        color={step.color}
                                    >
                                        Step {currentStep + 1} of {steps.length}
                                    </Text>
                                    <Heading size="lg">{step.title}</Heading>
                                    <Text fontSize="md" color="gray.500" lineHeight="tall">
                                        {step.description}
                                    </Text>
                                </VStack>

                                {/* Dots Indicator */}
                                <HStack gap={2} mt={8} justify="center" w="full">
                                    {steps.map((_, idx) => (
                                        <Box
                                            key={idx}
                                            w={2}
                                            h={2}
                                            borderRadius="full"
                                            bg={idx === currentStep ? step.color : 'gray.200'}
                                            transition="all 0.3s"
                                        />
                                    ))}
                                </HStack>
                            </Box>
                        </Flex>
                    </Dialog.Body>

                    <Dialog.Footer borderTopWidth="1px" borderColor="gray.100" p={4}>
                        <HStack w="full" justify="space-between">
                            <Button variant="ghost" onClick={handleClose} size="sm">
                                スキップ
                            </Button>
                            <HStack>
                                {currentStep > 0 && (
                                    <Button variant="ghost" onClick={handleBack}>
                                        戻る
                                    </Button>
                                )}
                                <Button
                                    colorPalette={currentStep === steps.length - 1 ? "green" : "blue"}
                                    onClick={handleNext}
                                >
                                    {currentStep === steps.length - 1 ? "始める" : "次へ"}
                                    {currentStep === steps.length - 1 ? <Check size={16} /> : <ChevronRight size={16} />}
                                </Button>
                            </HStack>
                        </HStack>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Positioner>
        </Dialog.Root>
    );
};
