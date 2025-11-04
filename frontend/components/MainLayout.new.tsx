import { Box, Flex, VStack, Text, Input, Button, Divider, useColorModeValue, IconButton, Badge, Tooltip, Spinner } from '@chakra-ui/react';
import { AttachmentIcon, EditIcon, ArrowForwardIcon, StarIcon, ArrowBackIcon } from '@chakra-ui/icons';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
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

// Existing DonutChart component remains unchanged
const DonutChart: React.FC<DonutChartProps> = ({ percentage, size = 60, strokeWidth = 8 }) => {
  // ... rest of DonutChart implementation
};

export const MainLayout: React.FC<MainLayoutProps> = ({ children }): JSX.Element => {
  const router = useRouter();
  
  // Authentication and Resume states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [resumes, setResumes] = useState<Resume[]>([]);
  
  // Layout and UI states
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

  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Handle initial resume upload
  useEffect(() => {
    if (resumes.length > 0 && !hasInitialPrompt) {
      const timer = setTimeout(() => {
        setHasInitialPrompt(true);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'I have analyzed your resume. You can now paste a job description, and I will help you optimize your application.'
        }]);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [resumes.length, hasInitialPrompt]);

  // Handle job description analysis
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
          resume: resumes[0],
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
    } finally {
      setIsLoading(false);
      setJobDescription('');
    }
  };

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

  return (
    <Flex direction="column" h="100vh" overflow="hidden">
      <Header isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
      
      <Flex flex="1" overflow="hidden">
        {/* Sidebar - 30% width */}
        <Box
          w="30%"
          borderRight="1px"
          borderColor={borderColor}
          bg={bgColor}
          overflowY="auto"
        >
          {/* Sidebar content */}
        </Box>

        {/* Main content - 70% width */}
        <Flex w="70%" direction="column" h="full" id="main-content">
          {/* Split view area */}
          <Box flex="1" position="relative" display="flex">
            {/* CV Preview */}
            <Box
              w={resumes.length ? `${splitPosition}%` : "0"}
              transition="width 0.2s"
              borderRight="1px"
              borderColor={borderColor}
              bg={bgColor}
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
                          bg={useColorModeValue('white', 'gray.700')}
                          borderRadius="md"
                          p={4}
                          borderWidth="2px"
                          borderStyle="dashed"
                          borderColor={borderColor}
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

            {/* Chat area */}
            <Flex 
              direction="column"
              w={resumes.length ? `${100 - splitPosition}%` : "100%"}
              transition="width 0.2s"
            >
              {/* Messages */}
              <Box flex="1" overflowY="auto" p={4}>
                {messages.map((message, index) => (
                  <Box
                    key={index}
                    mb={4}
                    p={4}
                    bg={message.role === 'assistant' 
                      ? useColorModeValue('blue.50', 'blue.900')
                      : useColorModeValue('gray.50', 'gray.700')}
                    borderRadius="lg"
                  >
                    <Text color={message.role === 'assistant'
                      ? useColorModeValue('blue.600', 'blue.200')
                      : 'inherit'}
                    >
                      {message.content}
                    </Text>
                  </Box>
                ))}
                {children}
              </Box>

              {/* Input area */}
              <Box p={4} borderTop="1px" borderColor={borderColor} bg={bgColor}>
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
                            setCurrentPdfUrl(coverLetterPdfUrl);
                          } else {
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
                _hover={{ bg: useColorModeValue('blue.100', 'blue.700') }}
                transition="background-color 0.2s"
                onMouseDown={handleMouseDown}
                userSelect="none"
              />
            )}
          </Box>
        </Flex>
      </Flex>

      {/* Cover Letter Modal */}
      {isCoverLetterModalOpen && (
        <CoverLetterModal
          isOpen={true}
          onClose={() => setIsCoverLetterModalOpen(false)}
          isGenerating={isGeneratingCoverLetter}
          onSuccess={(pdfUrl: string) => {
            setCoverLetterPdfUrl(pdfUrl);
            setIsCoverLetterModalOpen(false);
          }}
        />
      )}
    </Flex>
  );
};