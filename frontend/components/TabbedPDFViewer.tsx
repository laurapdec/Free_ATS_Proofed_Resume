import React, { useState, useEffect, memo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Box, IconButton, Flex, Text, useColorModeValue, Tabs, TabList, TabPanels, Tab, TabPanel, Spinner } from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import mammoth from 'mammoth';

// Configure PDF.js worker - use version matching react-pdf 9.2.1
pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.mjs';

interface TabbedPDFViewerProps {
  resumeFile?: string;
  coverLetterFile?: string;
  onTabChange?: (tab: 'resume' | 'coverLetter') => void;
  activeTab?: 'resume' | 'coverLetter';
}

const TabbedPDFViewer: React.FC<TabbedPDFViewerProps> = memo(({ resumeFile, coverLetterFile, onTabChange, activeTab }) => {
  const [internalActiveTab, setInternalActiveTab] = useState<'resume' | 'coverLetter'>('resume');
  const currentActiveTab = activeTab !== undefined ? activeTab : internalActiveTab;
  const [resumePages, setResumePages] = useState<number | null>(null);
  const [coverLetterPages, setCoverLetterPages] = useState<number | null>(null);
  const [resumePageNumber, setResumePageNumber] = useState(1);
  const [coverLetterPageNumber, setCoverLetterPageNumber] = useState(1);
  const [pageWidth, setPageWidth] = useState(600);
  
  // DOCX content states
  const [resumeDocxContent, setResumeDocxContent] = useState<string | null>(null);
  const [coverLetterDocxContent, setCoverLetterDocxContent] = useState<string | null>(null);
  const [isLoadingDocx, setIsLoadingDocx] = useState(false);

  useEffect(() => {
    console.log('TabbedPDFViewer received files:', { resumeFile, coverLetterFile });
    setPageWidth(Math.min(500, window.innerWidth * 0.35));
    
    // Process files when they change
    if (resumeFile) {
      processFile(resumeFile, 'resume');
    }
    if (coverLetterFile) {
      processFile(coverLetterFile, 'coverLetter');
    }

    const handleResize = () => {
      setPageWidth(Math.min(500, window.innerWidth * 0.35));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [resumeFile, coverLetterFile]);

  const processFile = async (fileUrl: string, type: 'resume' | 'coverLetter') => {
    const isDocx = fileUrl.toLowerCase().includes('.docx') || fileUrl.toLowerCase().includes('.doc');
    
    if (isDocx) {
      setIsLoadingDocx(true);
      try {
        const response = await fetch(fileUrl);
        const arrayBuffer = await response.arrayBuffer();
        
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const htmlContent = result.value;
        
        if (type === 'resume') {
          setResumeDocxContent(htmlContent);
        } else {
          setCoverLetterDocxContent(htmlContent);
        }
      } catch (error) {
        console.error('Error processing DOCX file:', error);
        if (type === 'resume') {
          setResumeDocxContent('<p>Error loading DOCX file</p>');
        } else {
          setCoverLetterDocxContent('<p>Error loading DOCX file</p>');
        }
      } finally {
        setIsLoadingDocx(false);
      }
    } else {
      // Clear DOCX content for PDF files
      if (type === 'resume') {
        setResumeDocxContent(null);
      } else {
        setCoverLetterDocxContent(null);
      }
    }
  };  useEffect(() => {
    // Auto-switch to cover letter tab if cover letter is available and resume is not
    if (coverLetterFile && !resumeFile) {
      handleTabChange('coverLetter');
    } else if (resumeFile) {
      handleTabChange('resume');
    }
  }, [resumeFile, coverLetterFile]);

  const handleTabChange = (tab: 'resume' | 'coverLetter') => {
    if (activeTab === undefined) {
      setInternalActiveTab(tab);
    }
    onTabChange?.(tab);
  };

  function onResumeDocumentLoadSuccess({ numPages }: { numPages: number }) {
    console.log('Resume PDF loaded successfully with', numPages, 'pages');
    setResumePages(numPages);
  }

  function onCoverLetterDocumentLoadSuccess({ numPages }: { numPages: number }) {
    console.log('Cover Letter PDF loaded successfully with', numPages, 'pages');
    setCoverLetterPages(numPages);
  }

  function onDocumentLoadError(error: Error) {
    console.error('PDF load error:', error);
  }

  const goToPrevPage = (isResume: boolean) => {
    if (isResume) {
      setResumePageNumber(page => Math.max(1, page - 1));
    } else {
      setCoverLetterPageNumber(page => Math.max(1, page - 1));
    }
  };

  const goToNextPage = (isResume: boolean) => {
    if (isResume) {
      setResumePageNumber(page => Math.min(resumePages || page, page + 1));
    } else {
      setCoverLetterPageNumber(page => Math.min(coverLetterPages || page, page + 1));
    }
  };

  const renderDocumentViewer = (file: string, pageNumber: number, numPages: number | null, docxContent: string | null, isResume: boolean) => {
    const isDocx = file.toLowerCase().includes('.docx') || file.toLowerCase().includes('.doc');
    
    return (
      <Box
        w="full"
        h="full"
        bg={useColorModeValue('white', 'gray.700')}
        borderRadius="md"
        p={3}
        display="flex"
        flexDirection="column"
        alignItems="center"
      >
        {isDocx ? (
          // DOCX viewer
          <Box 
            flex="1" 
            w="full" 
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
            {isLoadingDocx ? (
              <Flex justify="center" align="center" h="full">
                <Spinner size="lg" />
                <Text ml={3}>Loading document...</Text>
              </Flex>
            ) : docxContent ? (
              <Box
                dangerouslySetInnerHTML={{ __html: docxContent }}
                sx={{
                  '& h1, & h2, & h3, & h4, & h5, & h6': {
                    marginTop: '1rem',
                    marginBottom: '0.5rem',
                    fontWeight: 'bold',
                  },
                  '& p': {
                    marginBottom: '0.5rem',
                    lineHeight: '1.6',
                  },
                  '& ul, & ol': {
                    marginLeft: '1.5rem',
                    marginBottom: '0.5rem',
                  },
                  '& li': {
                    marginBottom: '0.25rem',
                  },
                  '& strong, & b': {
                    fontWeight: 'bold',
                  },
                  '& em, & i': {
                    fontStyle: 'italic',
                  },
                }}
              />
            ) : (
              <Flex justify="center" align="center" h="full">
                <Text color="gray.500">Failed to load document</Text>
              </Flex>
            )}
          </Box>
        ) : (
          // PDF viewer
          <>
            <Box flex="1" display="flex" alignItems="center" justifyContent="center" w="full">
              <Document
                file={file}
                onLoadSuccess={isResume ? onResumeDocumentLoadSuccess : onCoverLetterDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <Box p={4}>
                    <Text>Loading PDF...</Text>
                  </Box>
                }
                error={
                  <Box p={4}>
                    <Text color="red.500">Failed to load PDF. Please try again.</Text>
                  </Box>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  width={pageWidth}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>
            </Box>

            {numPages && numPages > 1 && (
              <Flex mt={2} gap={2} alignItems="center" justifyContent="center" w="full">
                <IconButton
                  aria-label="Previous page"
                  icon={<ChevronLeftIcon />}
                  onClick={() => goToPrevPage(isResume)}
                  isDisabled={pageNumber <= 1}
                  size="sm"
                />
                <Text fontSize="sm" minW="fit-content">
                  Page {pageNumber} of {numPages}
                </Text>
                <IconButton
                  aria-label="Next page"
                  icon={<ChevronRightIcon />}
                  onClick={() => goToNextPage(isResume)}
                  isDisabled={pageNumber >= (numPages || 1)}
                  size="sm"
                />
              </Flex>
            )}
          </>
        )}
      </Box>
    );
  };

  const hasResume = !!resumeFile;
  const hasCoverLetter = !!coverLetterFile;

  // If only one document exists, show it directly without tabs
  if (hasResume && !hasCoverLetter) {
    return renderDocumentViewer(resumeFile!, resumePageNumber, resumePages, resumeDocxContent, true);
  }

  if (!hasResume && hasCoverLetter) {
    return renderDocumentViewer(coverLetterFile!, coverLetterPageNumber, coverLetterPages, coverLetterDocxContent, false);
  }

  // If no documents, show placeholder
  if (!hasResume && !hasCoverLetter) {
    return (
      <Box
        w="full"
        h="full"
        bg={useColorModeValue('white', 'gray.700')}
        borderRadius="md"
        p={4}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text color="gray.500">
          Your documents will appear here
        </Text>
      </Box>
    );
  }

  // Show tabs when both documents exist
  return (
    <Box w="full" h="full">
      <Tabs
        variant="enclosed"
        colorScheme="blue"
        index={currentActiveTab === 'resume' ? 0 : 1}
        onChange={(index) => handleTabChange(index === 0 ? 'resume' : 'coverLetter')}
      >
        <TabList>
          <Tab isDisabled={!hasResume}>Resume</Tab>
          <Tab isDisabled={!hasCoverLetter}>Cover Letter</Tab>
        </TabList>
        <TabPanels h="full">
          <TabPanel h="full" p={0}>
            {hasResume && renderDocumentViewer(resumeFile!, resumePageNumber, resumePages, resumeDocxContent, true)}
          </TabPanel>
          <TabPanel h="full" p={0}>
            {hasCoverLetter && renderDocumentViewer(coverLetterFile!, coverLetterPageNumber, coverLetterPages, coverLetterDocxContent, false)}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
});

export default memo(TabbedPDFViewer);