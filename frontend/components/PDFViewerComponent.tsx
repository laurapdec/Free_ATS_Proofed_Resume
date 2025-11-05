import React, { useState, useEffect, memo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Box, IconButton, Flex, Text, useColorModeValue } from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';

// Configure PDF.js worker - use version matching react-pdf 9.2.1
pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.mjs';

interface PDFViewerComponentProps {
  file: string;
}

const PDFViewerComponent: React.FC<PDFViewerComponentProps> = memo(({ file }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageWidth, setPageWidth] = useState(600);

  useEffect(() => {
    console.log('PDFViewerComponent received file:', file);
    setPageWidth(Math.min(500, window.innerWidth * 0.35));
    
    const handleResize = () => {
      setPageWidth(Math.min(500, window.innerWidth * 0.35));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [file]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    console.log('PDF loaded successfully with', numPages, 'pages');
    setNumPages(numPages);
  }

  function onDocumentLoadError(error: Error) {
    console.error('PDF load error:', error);
  }

  const goToPrevPage = () => {
    setPageNumber(page => Math.max(1, page - 1));
  };

  const goToNextPage = () => {
    setPageNumber(page => Math.min(numPages || page, page + 1));
  };

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
      position="relative"
    >
      <Box flex="1" display="flex" alignItems="center" justifyContent="center" w="full">
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
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
            onClick={goToPrevPage}
            isDisabled={pageNumber <= 1}
            size="sm"
          />
          <Text fontSize="sm" minW="fit-content">
            Page {pageNumber} of {numPages}
          </Text>
          <IconButton
            aria-label="Next page"
            icon={<ChevronRightIcon />}
            onClick={goToNextPage}
            isDisabled={pageNumber >= (numPages || 1)}
            size="sm"
          />
        </Flex>
      )}
    </Box>
  );
},
);

export default memo(PDFViewerComponent);