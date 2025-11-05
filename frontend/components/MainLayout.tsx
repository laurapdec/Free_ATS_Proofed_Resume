import { Box, Flex, VStack, Text, Input, Button, Divider, IconButton, Badge, Tooltip, Spinner, Image, useToast, useColorMode, useColorModeValue } from '@chakra-ui/react';
import { useMainLayoutTheme } from '../hooks/useMainLayoutTheme';
import { AttachmentIcon, EditIcon, ArrowForwardIcon, StarIcon, ArrowBackIcon } from '@chakra-ui/icons';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { LinkedInSignIn } from './LinkedInSignIn';
import { ScanCVButton } from './ScanCVButton';
import { CoverLetterModal } from './CoverLetterModal';
import PDFViewer from './PDFViewer';
import type { Resume } from '../types/resume';
import { isValidResume } from '../utils/validation';
import { generatePDF } from '../utils/api';
import { Header } from './Header';

interface MainLayoutProps {
  children?: React.ReactNode;
}

interface DonutChartProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

interface CoverLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  isGenerating: boolean;
  onSuccess?: (pdfUrl: string) => void;
}

const DonutChart: React.FC<DonutChartProps> = ({ percentage, size = 60, strokeWidth = 8 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  // Individual color hooks
  const greenColor = useColorModeValue('#48BB78', '#68D391');
  const blueColor = useColorModeValue('#4299E1', '#63B3ED');
  const orangeColor = useColorModeValue('#ED8936', '#F6AD55');
  const bgColor = useColorModeValue('#EDF2F7', '#2D3748');
  
  const getColor = (score: number) => {
    if (score >= 90) return greenColor;
    if (score >= 75) return blueColor;
    return orangeColor;
  };

  return (
    <Box position="relative" w={`${size}px`} h={`${size}px`}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        {/* Score circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor(percentage)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <Flex
        position="absolute"
        top="0"
        left="0"
        w="100%"
        h="100%"
        alignItems="center"
        justifyContent="center"
      >
        <Text fontSize={size > 50 ? "md" : "2xs"} fontWeight="bold">
          {percentage}%
        </Text>
      </Flex>
    </Box>
  );
};

// Icon components
const DocumentIcon: React.FC = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const EyeIcon: React.FC = () => (
  <svg 
    viewBox="0 0 24 24" 
    width="16" 
    height="16" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

import { useRouter } from 'next/router';

export const MainLayout: React.FC<MainLayoutProps> = ({ children }): JSX.Element => {
  // All hooks must be called at the top level and in the same order
  const router = useRouter();
  const theme = useMainLayoutTheme();
  const toast = useToast();
  
  // Theme colors that might be needed throughout the component
  const whiteColor = useColorModeValue('white', 'gray.700');
  const grayColor = useColorModeValue('gray.50', 'gray.700');
  const grayTextColor = useColorModeValue('gray.600', 'gray.400');
  const blueHighlightBg = useColorModeValue('blue.50', 'blue.900');
  const blueHighlightText = useColorModeValue('blue.600', 'blue.200');
  const blueSecondaryText = useColorModeValue('blue.500', 'blue.300');

  // State hooks
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [splitPosition, setSplitPosition] = useState(50);
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string | null>(null);
  const [coverLetterPdfUrl, setCoverLetterPdfUrl] = useState<string | null>(null);
  
  // Modal states
  const [isCoverLetterModalOpen, setIsCoverLetterModalOpen] = useState(false);
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  
  // AI and messaging states
  const [hasInitialPrompt, setHasInitialPrompt] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);

  const isAuthPage = router.pathname === '/signin';

  const handleJobDescriptionSubmit = async () => {
    if (!jobDescription.trim() || !resumes.length) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/analyze-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobDescription,
          resume: resumes[0], // Using the first resume
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze job description');
      }

      const data = await response.json();
      setMessages(prev => [...prev, 
        { role: 'user', content: jobDescription },
        { role: 'assistant', content: data.analysis }
      ]);
    } catch (error) {
      console.error('Error analyzing job description:', error);
      // You might want to show an error toast here
    } finally {
      setIsLoading(false);
      setJobDescription('');
    }
  };

  // Handle initial resume upload
  useEffect(() => {
    if (resumes.length > 0 && !hasInitialPrompt && isLoggedIn && currentPdfUrl) {
      // Only show the message after we have a valid PDF and the user is logged in
      const timer = setTimeout(() => {
        setHasInitialPrompt(true);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'I have analyzed your resume. You can now paste a job description, and I will help you optimize your application.'
        }]);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [resumes.length, hasInitialPrompt, isLoggedIn, currentPdfUrl]);

  // Handle split view resizing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.pageX;
    const startSplit = splitPosition;

    const handleMouseMove = (e: MouseEvent) => {
      const containerWidth = document.getElementById('main-content')?.offsetWidth || 0;
      const dx = e.pageX - startX;
      const newSplit = Math.min(Math.max(20, startSplit + (dx / containerWidth * 100)), 80);
      setSplitPosition(newSplit);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [splitPosition]);

  // Get color mode values at the top level
  const colors = {
    white: useColorModeValue('white', 'gray.700'),
    gray: useColorModeValue('gray.50', 'gray.700'),
    grayText: useColorModeValue('gray.600', 'gray.400'),
    blueHighlight: useColorModeValue('blue.50', 'blue.900'),
    blueText: useColorModeValue('blue.600', 'blue.200'),
    blueSecondary: useColorModeValue('blue.500', 'blue.300'),
    darkWhite: useColorModeValue('white', 'gray.600'),
    coverLetterBg: useColorModeValue('white', 'gray.600'),
    coverLetterText: useColorModeValue('gray.600', 'gray.400'),
    resizerHover: useColorModeValue('blue.100', 'blue.700')
  };
  
  const renderSidebar = () => {
    return (
      <VStack spacing={4} w="full" p={4}>
        {!resumes.length ? (
          <VStack spacing={4} w="full" mt={4}>
            <LinkedInSignIn
              onProfileLoaded={async (resume) => {
                try {
                  if (!isValidResume(resume)) {
                    throw new Error('Invalid resume data received');
                  }

                  setResumes([resume]);
                  const url = await generatePDF(resume);
                  if (!url) {
                    throw new Error('Failed to generate PDF');
                  }

                  setCurrentPdfUrl(url);
                  setIsLoggedIn(true);
                  
                  toast({
                    title: 'Resume uploaded successfully',
                    description: 'Your resume has been processed and is ready for optimization.',
                    status: 'success',
                    duration: 5000,
                    isClosable: true,
                  });
                } catch (error) {
                  console.error('Error processing resume:', error);
                  toast({
                    title: 'Error processing resume',
                    description: error instanceof Error ? error.message : 'Failed to process your resume. Please try again.',
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                  });
                  // Reset states on error
                  setResumes([]);
                  setCurrentPdfUrl(null);
                  setIsLoggedIn(false);
                }
              }}
            />
            <Text>or</Text>
            <ScanCVButton
              onProfileLoaded={async (resume) => {
                if (isValidResume(resume)) {
                  setResumes([resume]);
                  try {
                    const url = await generatePDF(resume);
                    setCurrentPdfUrl(url);
                    setIsLoggedIn(true); // Set login state
                  } catch (error) {
                    console.error('Error generating PDF:', error);
                    // You might want to show an error toast here
                  }
                }
              }}
            />
            <Divider />
          </VStack>
        ) : (
          <VStack spacing={4} w="full">
            <Text fontSize="lg" fontWeight="bold">Your CVs</Text>
          {resumes.map((resume, index) => (
            <Button
              key={index}
              variant="outline"
              w="full"
              justifyContent="flex-start"
              leftIcon={<DocumentIcon />}
            >
              {resume?.contactInfo?.email
                ? `${resume.contactInfo.email.split('@')[0]}'s CV`
                : `CV ${index + 1}`}
            </Button>
          ))}
          <Button
            colorScheme="blue"
            w="full"
            onClick={() => {
              // TODO: Open modal for choosing import method
            }}
          >
            Add Another CV
          </Button>
          <Divider />
        </VStack>
        )}
        
        <VStack spacing={4} w="full" opacity={isLoggedIn ? 1 : 0.7} pointerEvents={isLoggedIn ? "auto" : "none"}>
          <VStack spacing={4} w="full" opacity={isLoggedIn ? 1 : 0.85}>
            <Text fontWeight="semibold">Premium Features</Text>
            <Text fontSize="md" color="blue.600" fontWeight="medium">
              AI Generated Cover Letters and CVs
            </Text>
            <Box
              w="full"
              p={8}
              borderRadius="xl"
              border="1px"
              borderColor={theme.borderColor}
              bg={theme.cardBg}
            >
              <VStack spacing={8}>
                <Box
                  w="full"
                  py={3}
                  px={4}
                  borderRadius="lg"
                  bg={colors.blueHighlight}
                >
                  <Text textAlign="center" fontSize="lg" fontWeight="bold" color={colors.blueText}>
                    100% Free ATS-Proofed CV
                  </Text>
                  <Text textAlign="center" fontSize="sm" color={colors.blueSecondary}>
                    No hidden costs or catches
                  </Text>
                </Box>
                <Flex gap={10} justify="center">
                  {/* CV Document */}
                  <Box position="relative" cursor={isLoggedIn ? "pointer" : "not-allowed"}>
                    <Box
                      w="140px"
                      h="200px"
                      borderRadius="md"
                      border="1px"
                      borderColor={theme.borderColor}
                      p={4}
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      justifyContent="space-between"
                      bg={colors.darkWhite}
                      onClick={() => isLoggedIn && setIsCoverLetterModalOpen(true)}
                      transition="transform 0.2s"
                      _hover={{ transform: isLoggedIn ? 'scale(1.05)' : 'none' }}
                    >
                      <Box flex="1" display="flex" flexDirection="column" alignItems="center" gap={3}>
                        <Box w="full">
                          <Flex w="full" alignItems="center" gap={1}>
                            <Box boxSize="16px" display="flex" alignItems="center" m={1}>
                              <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                              </svg>
                            </Box>
                            <Text   ml={1.5} fontSize="sm" fontWeight="medium">
                              Google
                            </Text>
                          </Flex>
                          <Text  ml={1.5} w="100%" fontSize="xs"  textAlign="center" color={colors.grayText} mt={0.5}>
                            Software Engineer - ML Platform
                          </Text>
                        </Box>
  
                        <DonutChart percentage={92} size={48} />
  
                        <Flex gap={4} alignItems="center" mt={0.2}>
                          <VStack spacing={0.5}>
                            <DonutChart percentage={88} size={34} strokeWidth={3} />
                            <Text fontSize="2xs" color={colors.grayText}>CV</Text>
                          </VStack>
                          <VStack spacing={0.5}>
                            <DonutChart percentage={86} size={34} strokeWidth={3} />
                            <Text fontSize="2xs" color={colors.grayText}>CL</Text>
                          </VStack>
                        </Flex>
  
                      </Box>
                    </Box>
                    <Badge
                      position="absolute"
                      top="-2"
                      right="-2"
                      colorScheme="yellow"
                      borderRadius="full"
                      p={1}
                    >
                      <StarIcon boxSize={3} />
                    </Badge>
                  </Box>

                  {/* Cover Letter Document */}
                  <Box position="relative" cursor={isLoggedIn ? "pointer" : "not-allowed"}>
                    <Box
                      w="140px"
                      h="200px"
                      borderRadius="md"
                      border="1px"
                      borderColor={theme.borderColor}
                      p={4}
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      justifyContent="space-between"
                      bg={colors.coverLetterBg}
                      onClick={() => {
                        if (isLoggedIn) {
                          setIsGeneratingCoverLetter(true);
                          setIsCoverLetterModalOpen(true);
                        }
                      }}
                      transition="transform 0.2s"
                      _hover={{ transform: isLoggedIn ? 'scale(1.05)' : 'none' }}
                    >
                      <Box flex="1" display="flex" flexDirection="column" alignItems="center" gap={3}>
                        <Box w="full">
                          <Flex w="full" alignItems="center" gap={2}>
                            <Box boxSize="16px" display="flex" alignItems="center" m={1}>
                              <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
                              </svg>
                            </Box>
                            <Text  ml={1.5}  fontSize="sm" fontWeight="medium">
                              Apple
                            </Text>
                          </Flex>
                          <Text  ml={1.5} w="100%" fontSize="xs"  textAlign="center" color={colors.coverLetterText} mt={0.5}>
                            Senior Product Designer
                          </Text>
                        </Box>
                        
                        <DonutChart percentage={90} size={48} />
                        
                        <Flex gap={4} alignItems="center" mt={0.2}>
                          <VStack spacing={0.5}>
                            <DonutChart percentage={88} size={34} strokeWidth={3} />
                            <Text fontSize="2xs" color={colors.coverLetterText}>CV</Text>
                          </VStack>
                          <VStack spacing={0.5}>
                            <DonutChart percentage={92} size={34} strokeWidth={3} />
                            <Text fontSize="2xs" color={colors.coverLetterText}>CL</Text>
                          </VStack>
                        </Flex>
                      </Box>
                    </Box>
                    <Badge
                      position="absolute"
                      top="-2"
                      right="-2"
                      colorScheme="yellow"
                      borderRadius="full"
                      p={1}
                    >
                      <StarIcon boxSize={3} />
                    </Badge>
                  </Box>
                </Flex>
              </VStack>
            </Box>
          </VStack>
      </VStack>
      <VStack spacing={4} w="full" pt={8} pb={4}>
      <Text fontSize="sm" color="gray.600" textAlign="center">
        {isLoggedIn ? (
          "Start optimizing your applications"
        ) : (
          <>
            <Link href="/signin" passHref>
              <Button
                variant="link"
                color="blue.500"
                fontWeight="medium"
              >
                Sign in
              </Button>
            </Link>
            {" "}
            to unlock all premium features
          </>
        )}
      </Text>
      <Box as="a" href="https://www.buymeacoffee.com/atsproofedcv" target="_blank" rel="noopener noreferrer">
        <Image
          src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
          alt="Buy Me A Coffee"
          height="30px"
          width="108.5px"
        />
      </Box>
    </VStack>
    </VStack>
    );
  };

  return (
    <Flex direction="column" h="100vh" overflow="hidden">
      <Header isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
      <Flex flex="1" overflow="hidden">
        {/* Sidebar - 30% width */}
        <Box
          w="30%"
          borderRight="1px"
          borderColor={theme.borderColor}
          bg={theme.bgColor}
          overflowY="auto"
        >
          {renderSidebar()}
        </Box>

        {/* Main content - 70% width */}
        <Box w="70%" position="relative">
          <Flex direction="column" h="full" id="main-content">
            {/* Split view area */}
            <Box flex="1" position="relative" display="flex">
              {/* CV Preview */}
              <Box
                w={resumes.length ? `${splitPosition}%` : "0"}
                transition="width 0.2s"
                borderRight="1px"
                borderColor={theme.borderColor}
                bg={theme.bgColor}
                overflowY="auto"
                position="relative"
              >
                {resumes.length > 0 && (
                  <>
                    <Box p={0} h="full">
                      <Box h="calc(100% )">
                        {currentPdfUrl ? (
                          <PDFViewer file={currentPdfUrl} />
                        ) : (
                          <Flex
                            h="full"
                            alignItems="center"
                            justifyContent="center"
                            bg={colors.white}
                            borderRadius="md"
                            p={4}
                            borderWidth="2px"
                            borderStyle="dashed"
                            borderColor={theme.borderColor}
                          >
                            <Text color="gray.500">
                              Your resume preview will appear here
                            </Text>
                          </Flex>
                        )}
                      </Box>
                    </Box>
                  </>
                )}
              </Box>

              {/* Chat area with input */}
              <Flex 
                direction="column"
                w={resumes.length ? `${100 - splitPosition}%` : "100%"}
                transition="width 0.2s"
              >
                {/* Chat messages */}
                <Box 
                  flex="1" 
                  overflowY="auto" 
                  p={4}
                >
                  {resumes.length > 0 && !hasInitialPrompt && (
                    <Box 
                      p={4} 
                      bg={colors.blueHighlight} 
                      borderRadius="lg"
                      mb={4}
                    >
                      <Text fontWeight="medium" color={colors.blueText}>
                        I'm analyzing your resume... This will just take a moment.
                      </Text>
                    </Box>
                  )}
                  {messages.map((message, index) => (
                    <Box
                      key={index}
                      mb={4}
                      p={4}
                      bg={message.role === 'assistant' 
                        ? colors.blueHighlight
                        : colors.gray}
                      borderRadius="lg"
                    >
                      <Text
                        color={message.role === 'assistant'
                          ? colors.blueText
                          : 'inherit'}
                      >
                        {message.content}
                      </Text>
                    </Box>
                  ))}
                  {children}
                </Box>

                {/* Job description input area */}
                <Box p={4} borderTop="1px" borderColor={theme.borderColor} bg={theme.bgColor}>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    handleJobDescriptionSubmit();
                  }}>
                    <Flex gap={2}>
                      <Tooltip 
                        label="Open Cover Letter"
                        placement="top"
                        hasArrow
                      >
                        <IconButton
                          aria-label="Open cover letter"
                          icon={<AttachmentIcon />}
                          size="lg"
                          variant="ghost"
                          onClick={() => {
                            if (coverLetterPdfUrl) {
                              // If we already have a cover letter PDF, show it in the PDFViewer
                              setCurrentPdfUrl(coverLetterPdfUrl);
                            } else {
                              // If no cover letter yet, open the modal to generate one
                              setIsCoverLetterModalOpen(true);
                            }
                          }}
                        />
                      </Tooltip>
                      <Input
                        flex="1"
                        placeholder="Paste the job description"
                        size="lg"
                        variant="filled"
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        disabled={isLoading || !resumes.length}
                      />
                      <IconButton
                        aria-label="Send"
                        icon={isLoading ? <Spinner size="sm" /> : <ArrowForwardIcon />}
                        size="lg"
                        colorScheme="blue"
                        type="submit"
                        isLoading={isLoading}
                        disabled={!jobDescription.trim() || !resumes.length}
                      />
                    </Flex>
                  </form>
                </Box>
              </Flex>
            </Box>

            {/* Resizer */}
            {resumes.length > 0 && (
              <Box
                position="absolute"
                left={`${splitPosition}%`}
                top={0}
                bottom={0}
                w="4px"
                transform="translateX(-50%)"
                cursor="col-resize"
                bg="transparent"
                _hover={{ bg: colors.resizerHover }}
                transition="background-color 0.2s"
                onMouseDown={handleMouseDown}
                userSelect="none"
              />
            )}
          </Flex>
        </Box>
      </Flex>

      {/* Cover Letter Modal */}
      {isCoverLetterModalOpen && (
        <CoverLetterModal
          isOpen={true}
          onClose={() => setIsCoverLetterModalOpen(false)}
          isGenerating={isGeneratingCoverLetter}
          onSuccess={(pdfUrl) => {
            setCoverLetterPdfUrl(pdfUrl);
            setIsCoverLetterModalOpen(false);
          }}
        />
      )}
    </Flex>
  );
};