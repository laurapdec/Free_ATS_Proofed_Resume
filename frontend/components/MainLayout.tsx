import { Box, Flex, VStack, Text, Input, Button, Divider, IconButton, Badge, Tooltip, Spinner, Image, useToast, useColorMode, useColorModeValue, Textarea } from '@chakra-ui/react';
import { useMainLayoutTheme } from '../hooks/useMainLayoutTheme';
import { AttachmentIcon, EditIcon, ArrowForwardIcon, StarIcon, ArrowBackIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';
import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import Link from 'next/link';
import { LinkedInSignIn } from './LinkedInSignIn';
import { ScanCVButton } from './ScanCVButton';
import { CoverLetterModal } from './CoverLetterModal';
import PDFViewer from './PDFViewer';
import TabbedPDFViewer from './TabbedPDFViewer';
import type { Resume } from '../types/resume';
import { isValidResume } from '../utils/validation';
import { generatePDF } from '../utils/api';
import { Header } from './Header';
import ReactMarkdown from 'react-markdown';

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
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [isPdfReviewed, setIsPdfReviewed] = useState(false);
  const [hasSentAnalysisMessage, setHasSentAnalysisMessage] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Job application details
  const [jobApplication, setJobApplication] = useState<{
    companyName?: string;
    positionName?: string;
    location?: string;
    workType?: 'remote' | 'hybrid' | 'onsite';
    salaryRange?: string;
    visaSponsorship?: boolean;
    foreignersOk?: boolean;
    companyLogo?: string;
  } | null>(null);

  // PDF viewer tab state
  const [activePdfTab, setActivePdfTab] = useState<'resume' | 'coverLetter'>('resume');

  // Chat scroll ref
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  // Cover letter file input ref
  const coverLetterFileInputRef = useRef<HTMLInputElement>(null);

  // Handle PDF generation and review
  useEffect(() => {
    if (currentPdfUrl && resumes.length > 0 && !isPdfReviewed) {
      // Mark PDF as reviewed after a short delay to simulate processing
      const timer = setTimeout(() => {
        setIsPdfReviewed(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentPdfUrl, resumes.length, isPdfReviewed]);

  // Send analysis message after PDF is reviewed
  useEffect(() => {
    if (isPdfReviewed && !hasSentAnalysisMessage && resumes.length > 0) {
      const analysisMessage = `**Your resume has been analyzed and optimized!**

---

## 📊 **ATS Score: 0%**

I've processed your resume data and created an ATS-optimized PDF. Here's what I found:

---

## ✅ **Resume Analysis Complete**

- **Contact information:** Missing email
- **Skills:** 0 skills identified
- **Experience:** 0 positions
- **Education:** 0 degrees

---

## 🚀 **Ready for Job Applications**

To optimize your resume for specific jobs, please share:

1. **📋 Job Description** - Paste the job posting or attach it
2. **📄 Cover Letter** - Upload your cover letter (optional)
3. **🎯 Target Position** - Tell me about the role you're applying for

---

I can then tailor your resume and generate customized application materials!`;

      setMessages([{
        role: 'assistant',
        content: analysisMessage
      }]);
      setHasSentAnalysisMessage(true);
    }
  }, [isPdfReviewed, hasSentAnalysisMessage, resumes]);

  // Calculate ATS score based on resume completeness and quality
  const calculateATSScore = (resume: Resume | undefined): number => {
    if (!resume) return 0;

    let score = 0;
    let maxScore = 100;

    // Contact information (25 points)
    const contact = resume.contactInfo;
    if (contact?.email) score += 8;
    if (contact?.phone) score += 8;
    if (contact?.location?.city && contact?.location?.country) score += 9;

    // Professional summary (15 points) - Note: not in current interface, but could be added
    // if (resume.summary && resume.summary.length > 50) score += 15;
    // else if (resume.summary && resume.summary.length > 20) score += 10;
    // else if (resume.summary) score += 5;

    // Skills (20 points)
    const skills = resume.skills;
    if (skills && skills.length > 0) {
      score += Math.min(20, skills.length * 4);
    }

    // Experience (20 points)
    const experiences = resume.experiences;
    if (experiences && experiences.length > 0) {
      score += Math.min(20, experiences.length * 5);
      // Bonus for detailed experience entries
      experiences.forEach(exp => {
        if (exp.title && exp.company && exp.startDate) score += 1;
      });
    }

    // Education (10 points)
    const education = resume.education;
    if (education && education.length > 0) {
      score += Math.min(10, education.length * 5);
    }

    // Languages and Publications (10 points)
    if (resume.languages && resume.languages.length > 0) score += 5;
    if (resume.publications && resume.publications.length > 0) score += 5;

    return Math.min(100, Math.round(score));
  };

  // Handle editing functions
  const handleDoubleClick = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const handleSaveEdit = () => {
    if (!editingField || !resumes.length) return;

    const updatedResume = { ...resumes[0] };
    
    // Handle contact info editing
    if (editingField.startsWith('contactInfo.')) {
      const field = editingField.split('.')[1];
      if (!updatedResume.contactInfo) updatedResume.contactInfo = {
        email: '',
        phone: '',
        location: { city: '', country: '' }
      };
      if (field === 'email') updatedResume.contactInfo.email = editValue;
      else if (field === 'phone') updatedResume.contactInfo.phone = editValue;
      else if (field === 'location') {
        // Parse the location string like "City, Country"
        const parts = editValue.split(',').map(p => p.trim());
        if (!updatedResume.contactInfo.location) updatedResume.contactInfo.location = { city: '', country: '' };
        updatedResume.contactInfo.location.city = parts[0] || '';
        updatedResume.contactInfo.location.country = parts[1] || '';
      } else if (field === 'linkedin') updatedResume.contactInfo.linkedin = editValue;
      else if (field === 'website') updatedResume.contactInfo.website = editValue;
    }
    
    // Handle skills editing
    else if (editingField.startsWith('skills[')) {
      const match = editingField.match(/skills\[(\d+)\]\.(\w+)/);
      if (match) {
        const index = parseInt(match[1]);
        const field = match[2];
        if (updatedResume.skills && updatedResume.skills[index]) {
          if (field === 'name') updatedResume.skills[index].name = editValue;
          else if (field === 'level') updatedResume.skills[index].level = editValue as any;
        }
      }
    }

    // Handle experience editing
    else if (editingField.startsWith('experiences[')) {
      const match = editingField.match(/experiences\[(\d+)\]\.(\w+)/);
      if (match) {
        const index = parseInt(match[1]);
        const field = match[2];
        if (updatedResume.experiences && updatedResume.experiences[index]) {
          if (field === 'title') updatedResume.experiences[index].title = editValue;
          else if (field === 'company') updatedResume.experiences[index].company = editValue;
          else if (field === 'location') updatedResume.experiences[index].location = editValue;
          else if (field === 'startDate') updatedResume.experiences[index].startDate = editValue;
          else if (field === 'endDate') updatedResume.experiences[index].endDate = editValue;
        }
      }
    }

    // Handle education editing
    else if (editingField.startsWith('education[')) {
      const match = editingField.match(/education\[(\d+)\]\.(\w+)/);
      if (match) {
        const index = parseInt(match[1]);
        const field = match[2];
        if (updatedResume.education && updatedResume.education[index]) {
          if (field === 'school') updatedResume.education[index].school = editValue;
          else if (field === 'degree') updatedResume.education[index].degree = editValue;
          else if (field === 'field') updatedResume.education[index].field = editValue;
          else if (field === 'startDate') updatedResume.education[index].startDate = editValue;
          else if (field === 'endDate') updatedResume.education[index].endDate = editValue;
          else if (field === 'gpa') updatedResume.education[index].gpa = parseFloat(editValue) || undefined;
        }
      }
    }

    // Handle languages editing
    else if (editingField.startsWith('languages[')) {
      const match = editingField.match(/languages\[(\d+)\]\.(\w+)/);
      if (match) {
        const index = parseInt(match[1]);
        const field = match[2];
        if (updatedResume.languages && updatedResume.languages[index]) {
          if (field === 'name') updatedResume.languages[index].name = editValue;
          else if (field === 'proficiency') updatedResume.languages[index].proficiency = editValue as any;
        }
      }
    }

    setResumes([updatedResume]);
    setEditingField(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const isAuthPage = router.pathname === '/signin';

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/auth/profile');
        if (response.ok) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        setIsLoggedIn(false);
      }
    };

    if (!isAuthPage) {
      checkAuthStatus();
    }
  }, [isAuthPage]);

  const handleMessageSubmit = async () => {
    if (!message.trim() || !resumes.length) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          resume: resumes[0], // Using the first resume
          conversationHistory: messages,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process message');
      }

      const data = await response.json();

      // Check if user mentioned cover letter to switch tabs
      const messageLower = message.toLowerCase();
      if (messageLower.includes('cover letter') || messageLower.includes('cover-letter')) {
        setActivePdfTab('coverLetter');
      }

      // Add user message and AI response to chat
      setMessages(prev => [...prev,
        { role: 'user', content: message },
        { role: 'assistant', content: data.response }
      ]);

      // If job details were extracted, update the application state
      if (data.isJobDescription && data.jobDetails) {
        setJobApplication(data.jobDetails);
      }

    } catch (error) {
      console.error('Error processing message:', error);
      setMessages(prev => [...prev,
        { role: 'user', content: message },
        { role: 'assistant', content: 'Sorry, I encountered an error processing your message. Please try again.' }
      ]);
    } finally {
      setIsLoading(false);
      setMessage('');
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (typeof window !== 'undefined' && chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

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
                    // Remove setIsLoggedIn(true) - only login with email/password
                  } catch (error) {
                    console.error('Error generating PDF:', error);
                    // You might want to show an error toast here
                  }
                }
              }}
            />
            <Divider />

            {/* Premium Features and Buy Me a Coffee - shown before CV upload */}
            <VStack spacing={4} w="full" pt={4}>
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
                        opacity={isLoggedIn ? 1 : 0.5}
                        filter={isLoggedIn ? 'none' : 'grayscale(50%)'}
                      >
                        <Box flex="1" display="flex" flexDirection="column" alignItems="center" gap={2}>
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
  
                          <Flex gap={4} alignItems="center" mt={0.2} mb={1}>
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
                        opacity={isLoggedIn ? 1 : 0.5}
                        filter={isLoggedIn ? 'none' : 'grayscale(50%)'}
                      >
                        <Box flex="1" display="flex" flexDirection="column" alignItems="center" gap={2}>
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
                          
                          <Flex gap={4} alignItems="center" mt={0.2} >
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

            {/* Buy Me a Coffee */}
            <VStack spacing={4} w="full" pt={4}>
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
        ) : (
          <VStack spacing={4} w="full">
            <Text fontSize="lg" fontWeight="bold">Application Database</Text>
            
            {/* Combined ATS Score and Data Viewer */}
            <Box
              w="full"
              p={4}
              borderRadius="lg"
              border="1px"
              borderColor={theme.borderColor}
              bg={theme.cardBg}
              maxH="600px"
              overflowY="auto"
              fontFamily="mono"
              fontSize="sm"
            >
              <VStack spacing={4} align="stretch">
                {/* ATS Score Header */}
                <Flex align="center" gap={4} pb={2} borderBottom="1px" borderColor="gray.200">
                  <DonutChart percentage={calculateATSScore(resumes[0])} size={60} />
                  <VStack spacing={0} align="start">
                    <Text fontSize="xl" fontWeight="bold" color={
                      calculateATSScore(resumes[0]) >= 90 ? "green.500" :
                      calculateATSScore(resumes[0]) >= 75 ? "blue.500" : "orange.500"
                    }>
                      {calculateATSScore(resumes[0])}%
                    </Text>
                    <Text fontSize="xs" color="gray.500">ATS Score</Text>
                  </VStack>
                </Flex>

                {/* Contact Information Section */}
                <Box>
                  <Text fontSize="xs" fontWeight="bold" color="blue.600" mb={2} textTransform="uppercase">
                    Contact Information
                  </Text>
                  <VStack spacing={1} align="stretch" pl={2}>
                    <Flex>
                      <Text w="120px" color="gray.500">email:</Text>
                      {editingField === 'contactInfo.email' ? (
                        <Flex gap={2} align="center">
                          <Input
                            size="xs"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit();
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            autoFocus
                          />
                          <IconButton
                            size="xs"
                            icon={<CheckIcon />}
                            onClick={handleSaveEdit}
                            colorScheme="green"
                            aria-label="Save"
                          />
                          <IconButton
                            size="xs"
                            icon={<CloseIcon />}
                            onClick={handleCancelEdit}
                            colorScheme="red"
                            aria-label="Cancel"
                          />
                        </Flex>
                      ) : (
                        <Text
                          color="green.600"
                          fontWeight="medium"
                          cursor="pointer"
                          onDoubleClick={() => handleDoubleClick('contactInfo.email', resumes[0]?.contactInfo?.email || '')}
                          _hover={{ bg: 'gray.100', px: 1, rounded: 'sm' }}
                        >
                          "{resumes[0]?.contactInfo?.email || 'Not provided'}"
                        </Text>
                      )}
                    </Flex>
                    <Flex>
                      <Text w="120px" color="gray.500">phone:</Text>
                      {editingField === 'contactInfo.phone' ? (
                        <Flex gap={2} align="center">
                          <Input
                            size="xs"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit();
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            autoFocus
                          />
                          <IconButton
                            size="xs"
                            icon={<CheckIcon />}
                            onClick={handleSaveEdit}
                            colorScheme="green"
                            aria-label="Save"
                          />
                          <IconButton
                            size="xs"
                            icon={<CloseIcon />}
                            onClick={handleCancelEdit}
                            colorScheme="red"
                            aria-label="Cancel"
                          />
                        </Flex>
                      ) : (
                        <Text
                          color="green.600"
                          fontWeight="medium"
                          cursor="pointer"
                          onDoubleClick={() => handleDoubleClick('contactInfo.phone', resumes[0]?.contactInfo?.phone || '')}
                          _hover={{ bg: 'gray.100', px: 1, rounded: 'sm' }}
                        >
                          "{resumes[0]?.contactInfo?.phone || 'Not provided'}"
                        </Text>
                      )}
                    </Flex>
                    <Flex>
                      <Text w="120px" color="gray.500">location:</Text>
                      {editingField === 'contactInfo.location' ? (
                        <Flex gap={2} align="center">
                          <Input
                            size="xs"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit();
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            autoFocus
                          />
                          <IconButton
                            size="xs"
                            icon={<CheckIcon />}
                            onClick={handleSaveEdit}
                            colorScheme="green"
                            aria-label="Save"
                          />
                          <IconButton
                            size="xs"
                            icon={<CloseIcon />}
                            onClick={handleCancelEdit}
                            colorScheme="red"
                            aria-label="Cancel"
                          />
                        </Flex>
                      ) : (
                        <Text
                          color="green.600"
                          fontWeight="medium"
                          cursor="pointer"
                          onDoubleClick={() => handleDoubleClick('contactInfo.location', `${resumes[0]?.contactInfo?.location?.city || ''}, ${resumes[0]?.contactInfo?.location?.country || ''}`)}
                          _hover={{ bg: 'gray.100', px: 1, rounded: 'sm' }}
                        >
                          "{`${resumes[0]?.contactInfo?.location?.city || ''}, ${resumes[0]?.contactInfo?.location?.country || ''}`.trim() || 'Not provided'}"
                        </Text>
                      )}
                    </Flex>
                    <Flex>
                      <Text w="120px" color="gray.500">linkedin:</Text>
                      {editingField === 'contactInfo.linkedin' ? (
                        <Flex gap={2} align="center">
                          <Input
                            size="xs"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit();
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            placeholder="username (after /in/)"
                            autoFocus
                          />
                          <IconButton
                            size="xs"
                            icon={<CheckIcon />}
                            onClick={handleSaveEdit}
                            colorScheme="green"
                            aria-label="Save"
                          />
                          <IconButton
                            size="xs"
                            icon={<CloseIcon />}
                            onClick={handleCancelEdit}
                            colorScheme="red"
                            aria-label="Cancel"
                          />
                        </Flex>
                      ) : (
                        <Text
                          color="green.600"
                          fontWeight="medium"
                          cursor="pointer"
                          onDoubleClick={() => handleDoubleClick('contactInfo.linkedin', resumes[0]?.contactInfo?.linkedin || '')}
                          _hover={{ bg: 'gray.100', px: 1, rounded: 'sm' }}
                        >
                          "{resumes[0]?.contactInfo?.linkedin ? `linkedin.com/in/${resumes[0].contactInfo.linkedin}` : 'Not provided'}"
                        </Text>
                      )}
                    </Flex>
                    <Flex>
                      <Text w="120px" color="gray.500">website:</Text>
                      {editingField === 'contactInfo.website' ? (
                        <Flex gap={2} align="center">
                          <Input
                            size="xs"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit();
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            autoFocus
                          />
                          <IconButton
                            size="xs"
                            icon={<CheckIcon />}
                            onClick={handleSaveEdit}
                            colorScheme="green"
                            aria-label="Save"
                          />
                          <IconButton
                            size="xs"
                            icon={<CloseIcon />}
                            onClick={handleCancelEdit}
                            colorScheme="red"
                            aria-label="Cancel"
                          />
                        </Flex>
                      ) : (
                        <Text
                          color="green.600"
                          fontWeight="medium"
                          cursor="pointer"
                          onDoubleClick={() => handleDoubleClick('contactInfo.website', resumes[0]?.contactInfo?.website || '')}
                          _hover={{ bg: 'gray.100', px: 1, rounded: 'sm' }}
                        >
                          "{resumes[0]?.contactInfo?.website || 'Not provided'}"
                        </Text>
                      )}
                    </Flex>
                  </VStack>
                </Box>

                <Divider />

                {/* Skills Array */}
                <Box>
                  <Text fontSize="xs" fontWeight="bold" color="blue.600" mb={2} textTransform="uppercase">
                    Skills Array
                  </Text>
                  <VStack spacing={1} align="stretch" pl={2}>
                    {resumes[0]?.skills?.map((skill, index) => (
                      <Flex key={index}>
                        <Text w="30px" color="gray.500">[{index}]:</Text>
                        <Text color="orange.600" fontWeight="medium">
                          {`{name: `}
                          {editingField === `skills[${index}].name` ? (
                            <Flex gap={1} align="center" display="inline-flex">
                              <Input
                                size="xs"
                                w="80px"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEdit();
                                  if (e.key === 'Escape') handleCancelEdit();
                                }}
                                autoFocus
                              />
                              <IconButton
                                size="xs"
                                icon={<CheckIcon />}
                                onClick={handleSaveEdit}
                                colorScheme="green"
                                aria-label="Save"
                              />
                              <IconButton
                                size="xs"
                                icon={<CloseIcon />}
                                onClick={handleCancelEdit}
                                colorScheme="red"
                                aria-label="Cancel"
                              />
                            </Flex>
                          ) : (
                            <Text
                              color="orange.600"
                              cursor="pointer"
                              display="inline"
                              onDoubleClick={() => handleDoubleClick(`skills[${index}].name`, skill.name)}
                              _hover={{ bg: 'gray.100', px: 1, rounded: 'sm' }}
                            >
                              "{skill.name}"
                            </Text>
                          )}
                          {`, level: `}
                          {editingField === `skills[${index}].level` ? (
                            <Flex gap={1} align="center" display="inline-flex">
                              <Input
                                size="xs"
                                w="100px"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEdit();
                                  if (e.key === 'Escape') handleCancelEdit();
                                }}
                                autoFocus
                              />
                              <IconButton
                                size="xs"
                                icon={<CheckIcon />}
                                onClick={handleSaveEdit}
                                colorScheme="green"
                                aria-label="Save"
                              />
                              <IconButton
                                size="xs"
                                icon={<CloseIcon />}
                                onClick={handleCancelEdit}
                                colorScheme="red"
                                aria-label="Cancel"
                              />
                            </Flex>
                          ) : (
                            <Text
                              color="orange.600"
                              cursor="pointer"
                              display="inline"
                              onDoubleClick={() => handleDoubleClick(`skills[${index}].level`, skill.level)}
                              _hover={{ bg: 'gray.100', px: 1, rounded: 'sm' }}
                            >
                              "{skill.level}"
                            </Text>
                          )}
                          {`}`}
                        </Text>
                      </Flex>
                    )) || (
                      <Text color="gray.400">[]</Text>
                    )}
                  </VStack>
                </Box>

                <Divider />

                {/* Experience Section */}
                <Box>
                  <Text fontSize="xs" fontWeight="bold" color="blue.600" mb={2} textTransform="uppercase">
                    Work Experience
                  </Text>
                  <VStack spacing={2} align="stretch" pl={2}>
                    {resumes[0]?.experiences?.map((exp, index) => (
                      <Box key={index}>
                        <Flex mb={1}>
                          <Text w="40px" color="gray.500">[{index}]:</Text>
                          <Text color="blue.600" fontWeight="medium">{`{`}</Text>
                        </Flex>
                        <VStack spacing={1} align="stretch" pl={6}>
                          <Flex>
                            <Text w="100px" color="gray.500">title:</Text>
                            {editingField === `experiences[${index}].title` ? (
                              <Flex gap={1} align="center" display="inline-flex">
                                <Input
                                  size="xs"
                                  w="120px"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit();
                                    if (e.key === 'Escape') handleCancelEdit();
                                  }}
                                  autoFocus
                                />
                                <IconButton
                                  size="xs"
                                  icon={<CheckIcon />}
                                  onClick={handleSaveEdit}
                                  colorScheme="green"
                                  aria-label="Save"
                                />
                                <IconButton
                                  size="xs"
                                  icon={<CloseIcon />}
                                  onClick={handleCancelEdit}
                                  colorScheme="red"
                                  aria-label="Cancel"
                                />
                              </Flex>
                            ) : (
                              <Text
                                color="green.600"
                                cursor="pointer"
                                onDoubleClick={() => handleDoubleClick(`experiences[${index}].title`, exp.title)}
                                _hover={{ bg: 'gray.100', px: 1, rounded: 'sm' }}
                              >
                                "{exp.title}"
                              </Text>
                            )}
                          </Flex>
                          <Flex>
                            <Text w="100px" color="gray.500">company:</Text>
                            {editingField === `experiences[${index}].company` ? (
                              <Flex gap={1} align="center" display="inline-flex">
                                <Input
                                  size="xs"
                                  w="120px"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit();
                                    if (e.key === 'Escape') handleCancelEdit();
                                  }}
                                  autoFocus
                                />
                                <IconButton
                                  size="xs"
                                  icon={<CheckIcon />}
                                  onClick={handleSaveEdit}
                                  colorScheme="green"
                                  aria-label="Save"
                                />
                                <IconButton
                                  size="xs"
                                  icon={<CloseIcon />}
                                  onClick={handleCancelEdit}
                                  colorScheme="red"
                                  aria-label="Cancel"
                                />
                              </Flex>
                            ) : (
                              <Text
                                color="green.600"
                                cursor="pointer"
                                onDoubleClick={() => handleDoubleClick(`experiences[${index}].company`, exp.company)}
                                _hover={{ bg: 'gray.100', px: 1, rounded: 'sm' }}
                              >
                                "{exp.company}"
                              </Text>
                            )}
                          </Flex>
                          <Flex>
                            <Text w="100px" color="gray.500">duration:</Text>
                            <Text color="green.600">"{exp.startDate} - {exp.endDate}"</Text>
                          </Flex>
                          <Flex>
                            <Text w="100px" color="gray.500">location:</Text>
                            {editingField === `experiences[${index}].location` ? (
                              <Flex gap={1} align="center" display="inline-flex">
                                <Input
                                  size="xs"
                                  w="120px"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit();
                                    if (e.key === 'Escape') handleCancelEdit();
                                  }}
                                  autoFocus
                                />
                                <IconButton
                                  size="xs"
                                  icon={<CheckIcon />}
                                  onClick={handleSaveEdit}
                                  colorScheme="green"
                                  aria-label="Save"
                                />
                                <IconButton
                                  size="xs"
                                  icon={<CloseIcon />}
                                  onClick={handleCancelEdit}
                                  colorScheme="red"
                                  aria-label="Cancel"
                                />
                              </Flex>
                            ) : (
                              <Text
                                color="green.600"
                                cursor="pointer"
                                onDoubleClick={() => handleDoubleClick(`experiences[${index}].location`, exp.location || '')}
                                _hover={{ bg: 'gray.100', px: 1, rounded: 'sm' }}
                              >
                                "{exp.location || 'Not specified'}"
                              </Text>
                            )}
                          </Flex>
                          <Flex>
                            <Text w="100px" color="gray.500">description:</Text>
                            <Text color="purple.600" fontSize="xs">
                              [{exp.description?.map(d => `"${d}"`).join(', ') || ''}]
                            </Text>
                          </Flex>
                        </VStack>
                        <Text pl={6} color="blue.600">{`}`}</Text>
                      </Box>
                    )) || (
                      <Text color="gray.400">[]</Text>
                    )}
                  </VStack>
                </Box>

                <Divider />

                {/* Education Section */}
                <Box>
                  <Text fontSize="xs" fontWeight="bold" color="blue.600" mb={2} textTransform="uppercase">
                    Education
                  </Text>
                  <VStack spacing={2} align="stretch" pl={2}>
                    {resumes[0]?.education?.map((edu, index) => (
                      <Box key={index}>
                        <Flex mb={1}>
                          <Text w="40px" color="gray.500">[{index}]:</Text>
                          <Text color="blue.600" fontWeight="medium">{`{`}</Text>
                        </Flex>
                        <VStack spacing={1} align="stretch" pl={6}>
                          <Flex>
                            <Text w="100px" color="gray.500">school:</Text>
                            {editingField === `education[${index}].school` ? (
                              <Flex gap={1} align="center" display="inline-flex">
                                <Input
                                  size="xs"
                                  w="120px"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit();
                                    if (e.key === 'Escape') handleCancelEdit();
                                  }}
                                  autoFocus
                                />
                                <IconButton
                                  size="xs"
                                  icon={<CheckIcon />}
                                  onClick={handleSaveEdit}
                                  colorScheme="green"
                                  aria-label="Save"
                                />
                                <IconButton
                                  size="xs"
                                  icon={<CloseIcon />}
                                  onClick={handleCancelEdit}
                                  colorScheme="red"
                                  aria-label="Cancel"
                                />
                              </Flex>
                            ) : (
                              <Text
                                color="green.600"
                                cursor="pointer"
                                onDoubleClick={() => handleDoubleClick(`education[${index}].school`, edu.school)}
                                _hover={{ bg: 'gray.100', px: 1, rounded: 'sm' }}
                              >
                                "{edu.school}"
                              </Text>
                            )}
                          </Flex>
                          <Flex>
                            <Text w="100px" color="gray.500">degree:</Text>
                            {editingField === `education[${index}].degree` ? (
                              <Flex gap={1} align="center" display="inline-flex">
                                <Input
                                  size="xs"
                                  w="120px"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit();
                                    if (e.key === 'Escape') handleCancelEdit();
                                  }}
                                  autoFocus
                                />
                                <IconButton
                                  size="xs"
                                  icon={<CheckIcon />}
                                  onClick={handleSaveEdit}
                                  colorScheme="green"
                                  aria-label="Save"
                                />
                                <IconButton
                                  size="xs"
                                  icon={<CloseIcon />}
                                  onClick={handleCancelEdit}
                                  colorScheme="red"
                                  aria-label="Cancel"
                                />
                              </Flex>
                            ) : (
                              <Text
                                color="green.600"
                                cursor="pointer"
                                onDoubleClick={() => handleDoubleClick(`education[${index}].degree`, edu.degree)}
                                _hover={{ bg: 'gray.100', px: 1, rounded: 'sm' }}
                              >
                                "{edu.degree}"
                              </Text>
                            )}
                          </Flex>
                          <Flex>
                            <Text w="100px" color="gray.500">field:</Text>
                            {editingField === `education[${index}].field` ? (
                              <Flex gap={1} align="center" display="inline-flex">
                                <Input
                                  size="xs"
                                  w="120px"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit();
                                    if (e.key === 'Escape') handleCancelEdit();
                                  }}
                                  autoFocus
                                />
                                <IconButton
                                  size="xs"
                                  icon={<CheckIcon />}
                                  onClick={handleSaveEdit}
                                  colorScheme="green"
                                  aria-label="Save"
                                />
                                <IconButton
                                  size="xs"
                                  icon={<CloseIcon />}
                                  onClick={handleCancelEdit}
                                  colorScheme="red"
                                  aria-label="Cancel"
                                />
                              </Flex>
                            ) : (
                              <Text
                                color="green.600"
                                cursor="pointer"
                                onDoubleClick={() => handleDoubleClick(`education[${index}].field`, edu.field)}
                                _hover={{ bg: 'gray.100', px: 1, rounded: 'sm' }}
                              >
                                "{edu.field}"
                              </Text>
                            )}
                          </Flex>
                          <Flex>
                            <Text w="100px" color="gray.500">duration:</Text>
                            <Text color="green.600">"{edu.startDate} - {edu.endDate}"</Text>
                          </Flex>
                          {edu.gpa && (
                            <Flex>
                              <Text w="100px" color="gray.500">gpa:</Text>
                              <Text color="orange.600">{edu.gpa}</Text>
                            </Flex>
                          )}
                        </VStack>
                        <Text pl={6} color="blue.600">{`}`}</Text>
                      </Box>
                    )) || (
                      <Text color="gray.400">[]</Text>
                    )}
                  </VStack>
                </Box>

                <Divider />

                {/* Publications */}
                <Box>
                  <Text fontSize="xs" fontWeight="bold" color="blue.600" mb={2} textTransform="uppercase">
                    Publications
                  </Text>
                  <VStack spacing={1} align="stretch" pl={2}>
                    {resumes[0]?.publications?.map((pub, index) => (
                      <Flex key={index}>
                        <Text w="30px" color="gray.500">[{index}]:</Text>
                        <Text color="purple.600">"{pub.title}" - {pub.publisher} ({pub.date})</Text>
                      </Flex>
                    )) || (
                      <Text color="gray.400">[]</Text>
                    )}
                  </VStack>
                </Box>

                <Divider />

                {/* Languages */}
                <Box>
                  <Text fontSize="xs" fontWeight="bold" color="blue.600" mb={2} textTransform="uppercase">
                    Languages
                  </Text>
                  <VStack spacing={1} align="stretch" pl={2}>
                    {resumes[0]?.languages?.map((lang, index) => (
                      <Flex key={index}>
                        <Text w="30px" color="gray.500">[{index}]:</Text>
                        <Text color="orange.600">
                          {editingField === `languages[${index}].name` ? (
                            <Flex gap={1} align="center" display="inline-flex">
                              <Input
                                size="xs"
                                w="80px"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEdit();
                                  if (e.key === 'Escape') handleCancelEdit();
                                }}
                                autoFocus
                              />
                              <IconButton
                                size="xs"
                                icon={<CheckIcon />}
                                onClick={handleSaveEdit}
                                colorScheme="green"
                                aria-label="Save"
                              />
                              <IconButton
                                size="xs"
                                icon={<CloseIcon />}
                                onClick={handleCancelEdit}
                                colorScheme="red"
                                aria-label="Cancel"
                              />
                            </Flex>
                          ) : (
                            <Text
                              cursor="pointer"
                              display="inline"
                              onDoubleClick={() => handleDoubleClick(`languages[${index}].name`, lang.name)}
                              _hover={{ bg: 'gray.100', px: 1, rounded: 'sm' }}
                            >
                              "{lang.name}"
                            </Text>
                          )}
                          {' ('}
                          {editingField === `languages[${index}].proficiency` ? (
                            <Flex gap={1} align="center" display="inline-flex">
                              <Input
                                size="xs"
                                w="120px"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEdit();
                                  if (e.key === 'Escape') handleCancelEdit();
                                }}
                                autoFocus
                              />
                              <IconButton
                                size="xs"
                                icon={<CheckIcon />}
                                onClick={handleSaveEdit}
                                colorScheme="green"
                                aria-label="Save"
                              />
                              <IconButton
                                size="xs"
                                icon={<CloseIcon />}
                                onClick={handleCancelEdit}
                                colorScheme="red"
                                aria-label="Cancel"
                              />
                            </Flex>
                          ) : (
                            <Text
                              cursor="pointer"
                              display="inline"
                              onDoubleClick={() => handleDoubleClick(`languages[${index}].proficiency`, lang.proficiency)}
                              _hover={{ bg: 'gray.100', px: 1, rounded: 'sm' }}
                            >
                              {lang.proficiency}
                            </Text>
                          )}
                          {')'}
                        </Text>
                      </Flex>
                    )) || (
                      <Text color="gray.400">[]</Text>
                    )}
                  </VStack>
                </Box>
              </VStack>
            </Box>

          {/* Job Application Details */}
          {jobApplication && (
            <VStack spacing={3} w="full" pt={4}>
              <Divider />
              <Text fontSize="lg" fontWeight="bold">Current Application</Text>
              <Box
                w="full"
                p={4}
                borderRadius="lg"
                border="1px"
                borderColor={theme.borderColor}
                bg={theme.cardBg}
              >
                <VStack spacing={3} align="start">
                  {jobApplication.companyLogo && (
                    <Image
                      src={jobApplication.companyLogo}
                      alt={`${jobApplication.companyName} logo`}
                      boxSize="40px"
                      objectFit="contain"
                      fallbackSrc="https://via.placeholder.com/40x40?text=Logo"
                    />
                  )}
                  <Text fontWeight="bold">{jobApplication.companyName}</Text>
                  <Text fontSize="sm" color="gray.600">{jobApplication.positionName}</Text>
                  <VStack spacing={1} align="start" w="full">
                    {jobApplication.location && (
                      <Text fontSize="sm">📍 {jobApplication.location}</Text>
                    )}
                    {jobApplication.workType && (
                      <Text fontSize="sm">🏢 {jobApplication.workType.charAt(0).toUpperCase() + jobApplication.workType.slice(1)}</Text>
                    )}
                    {jobApplication.salaryRange && (
                      <Text fontSize="sm">💰 {jobApplication.salaryRange}</Text>
                    )}
                    {jobApplication.visaSponsorship && (
                      <Text fontSize="sm">🛂 Visa Sponsorship Available</Text>
                    )}
                    {jobApplication.foreignersOk && (
                      <Text fontSize="sm">🌍 Open to International Candidates</Text>
                    )}
                  </VStack>
                </VStack>
              </Box>
            </VStack>
          )}

          <Divider />
        </VStack>
        )}

        {/* Buy Me a Coffee and Sign In - show after CV is loaded */}
        {resumes.length > 0 && (
          <VStack spacing={4} w="full" pt={4}>
            <Divider />
            <Text fontSize="sm" color="gray.600" textAlign="center">
              {isLoggedIn ? (
                "Enjoying the free service? Consider supporting us!"
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
                  to unlock all premium features and support us!
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
        )}
        
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
            <Box flex="1" position="relative" display="flex" h="full">
              {/* CV Preview */}
              <Box
                w={resumes.length ? `${splitPosition}%` : "0"}
                transition="width 0.2s"
                borderRight="1px"
                borderColor={theme.borderColor}
                bg={theme.bgColor}
                h="full"
                position="relative"
              >
                {resumes.length > 0 && (
                  <>
                    <Box p={0} h="full">
                      <Box h="full">
                        {currentPdfUrl || coverLetterPdfUrl ? (
                          <TabbedPDFViewer 
                            resumeFile={currentPdfUrl || undefined}
                            coverLetterFile={coverLetterPdfUrl || undefined}
                            activeTab={activePdfTab}
                            onTabChange={setActivePdfTab}
                          />
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
                h="full"
              >
                {/* Chat messages */}
                <Box 
                  ref={typeof window !== 'undefined' ? chatMessagesRef : undefined}
                  flex="1" 
                  overflowY="auto" 
                  p={4}
                  sx={{
                    '&::-webkit-scrollbar': {
                      width: '4px',
                    },
                    '&::-webkit-scrollbar-track': {
                      width: '6px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: 'gray.300',
                      borderRadius: 'md',
                    },
                  }}
                >
                  {resumes.length > 0 && !hasInitialPrompt && (
                    <Flex mb={4} justify="flex-start">
                      <Box
                        maxW="70%"
                        p={3}
                        bg={colors.blueHighlight}
                        borderRadius="lg"
                        borderBottomLeftRadius="0"
                        position="relative"
                        _after={{
                          content: '""',
                          position: 'absolute',
                          bottom: '-8px',
                          left: '16px',
                          width: '0',
                          height: '0',
                          borderLeft: '8px solid transparent',
                          borderRight: '8px solid transparent',
                          borderTop: `8px solid ${colors.blueHighlight}`,
                        }}
                      >
                        <Text
                          color={colors.blueText}
                          fontSize="sm"
                          lineHeight="1.4"
                          fontWeight="medium"
                        >
                          I'm analyzing your resume... This will just take a moment.
                        </Text>
                      </Box>
                    </Flex>
                  )}
                  {messages.map((message, index) => (
                    <Flex
                      key={index}
                      mb={4}
                      justify={message.role === 'user' ? 'flex-end' : 'flex-start'}
                    >
                      <Box
                        maxW="70%"
                        p={3}
                        bg={message.role === 'assistant'
                          ? colors.blueHighlight
                          : colors.blueSecondary}
                        borderRadius="lg"
                        borderBottomLeftRadius={message.role === 'assistant' ? '0' : 'lg'}
                        borderBottomRightRadius={message.role === 'user' ? '0' : 'lg'}
                        position="relative"
                        _after={{
                          content: '""',
                          position: 'absolute',
                          bottom: '-8px',
                          [message.role === 'user' ? 'right' : 'left']: '16px',
                          width: '0',
                          height: '0',
                          borderLeft: message.role === 'user' ? '8px solid transparent' : `8px solid ${colors.blueSecondary}`,
                          borderRight: message.role === 'user' ? `8px solid ${colors.blueSecondary}` : '8px solid transparent',
                          borderTop: `8px solid ${message.role === 'assistant' ? colors.blueHighlight : colors.blueSecondary}`,
                        }}
                      >
                        <ReactMarkdown
                          children={message.content}
                          components={{
                            p: ({ children }) => (
                              <Text
                                color={message.role === 'assistant'
                                  ? colors.blueText
                                  : 'white'}
                                fontSize="sm"
                                lineHeight="1.4"
                                mb={2}
                              >
                                {children}
                              </Text>
                            ),
                            strong: ({ children }) => (
                              <Text as="strong" fontWeight="bold">
                                {children}
                              </Text>
                            ),
                            h1: ({ children }) => (
                              <Text fontSize="lg" fontWeight="bold" mb={2}>
                                {children}
                              </Text>
                            ),
                            h2: ({ children }) => (
                              <Text fontSize="md" fontWeight="bold" mb={2}>
                                {children}
                              </Text>
                            ),
                            h3: ({ children }) => (
                              <Text fontSize="sm" fontWeight="bold" mb={1}>
                                {children}
                              </Text>
                            ),
                            ul: ({ children }) => (
                              <VStack align="start" spacing={1} mb={2}>
                                {children}
                              </VStack>
                            ),
                            li: ({ children }) => (
                              <Text fontSize="sm" lineHeight="1.4" pl={2}>
                                • {children}
                              </Text>
                            ),
                            hr: () => (
                              <Divider my={3} />
                            ),
                          }}
                        />
                      </Box>
                    </Flex>
                  ))}
                  {children}
                </Box>

                {/* Job description input area */}
                <Box p={4} borderTop="1px" borderColor={theme.borderColor} bg={theme.bgColor}>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    handleMessageSubmit();
                  }}>
                    <Flex gap={2}>
                      <Tooltip 
                        label="Attach Cover Letter"
                        placement="top"
                        hasArrow
                      >
                        <IconButton
                          aria-label="Attach cover letter"
                          icon={<AttachmentIcon />}
                          size="lg"
                          variant="ghost"
                          onClick={() => coverLetterFileInputRef.current?.click()}
                        />
                      </Tooltip>
                      <Input
                        flex="1"
                        placeholder={isPdfReviewed ? "Ask me anything about your job search..." : "Please wait until I analyze your resume..."}
                        size="lg"
                        variant="filled"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        disabled={isLoading || !resumes.length || !isPdfReviewed}
                      />
                      <IconButton
                        aria-label="Send"
                        icon={isLoading ? <Spinner size="sm" /> : <ArrowForwardIcon />}
                        size="lg"
                        colorScheme="blue"
                        type="submit"
                        isLoading={isLoading}
                        disabled={!message.trim() || !resumes.length || !isPdfReviewed}
                      />
                    </Flex>
                  </form>
                  
                  {/* Hidden file input for cover letter */}
                  <input
                    type="file"
                    ref={coverLetterFileInputRef}
                    style={{ display: 'none' }}
                    accept=".pdf,.doc,.docx"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file && resumes.length > 0) {
                        try {
                          const formData = new FormData();
                          formData.append('file', file);
                          formData.append('resume_id', '1'); // Using a default resume ID for now
                          
                          const response = await fetch('/api/upload-cover-letter', {
                            method: 'POST',
                            body: formData,
                          });
                          
                          if (response.ok) {
                            const data = await response.json();
                            setCoverLetterPdfUrl(data.pdf_url);
                            toast({
                              title: 'Cover letter uploaded',
                              description: 'Your cover letter has been processed successfully.',
                              status: 'success',
                              duration: 3000,
                              isClosable: true,
                            });
                          } else {
                            throw new Error('Failed to upload cover letter');
                          }
                        } catch (error) {
                          console.error('Error uploading cover letter:', error);
                          toast({
                            title: 'Upload failed',
                            description: 'Failed to upload cover letter. Please try again.',
                            status: 'error',
                            duration: 3000,
                            isClosable: true,
                          });
                        }
                      }
                      // Reset the input
                      if (coverLetterFileInputRef.current) {
                        coverLetterFileInputRef.current.value = '';
                      }
                    }}
                  />
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