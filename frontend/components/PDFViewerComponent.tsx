import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Box, IconButton, Flex, Text, useColorModeValue } from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerComponentProps {
  file: string;
}

const PDFViewerComponent: React.FC<PDFViewerComponentProps> = ({ file }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageWidth, setPageWidth] = useState(600);

  useEffect(() => {
    setPageWidth(Math.min(600, window.innerWidth * 0.4));
    
    const handleResize = () => {
      setPageWidth(Math.min(600, window.innerWidth * 0.4));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
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
      p={4}
      display="flex"
      flexDirection="column"
      alignItems="center"
      position="relative"
    >
      <Document
        file={file}
        onLoadSuccess={onDocumentLoadSuccess}
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

      {numPages && numPages > 1 && (
        <Flex mt={4} gap={4} alignItems="center">
          <IconButton
            aria-label="Previous page"
            icon={<ChevronLeftIcon />}
            onClick={goToPrevPage}
            isDisabled={pageNumber <= 1}
            size="sm"
          />
          <Text>
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
};

export default PDFViewerComponent;