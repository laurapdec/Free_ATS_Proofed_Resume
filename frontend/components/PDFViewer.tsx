import dynamic from 'next/dynamic';
import { Box, Text, useColorModeValue } from '@chakra-ui/react';

// Create a loading component
const LoadingPDF = () => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  
  return (
    <Box
      w="full"
      h="full"
      bg={bgColor}
      borderRadius="md"
      p={4}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Text color={textColor}>Loading PDF viewer...</Text>
    </Box>
  );
};

interface PDFViewerProps {
  file: string;
}

// Dynamically import the PDFViewer component with SSR disabled
const PDFViewer: React.FC<PDFViewerProps> = (props) => {
  const DynamicPDFViewer = dynamic(
    () => import('./PDFViewerComponent'),
    {
      ssr: false,
      loading: LoadingPDF
    }
  );

  return <DynamicPDFViewer {...props} />;
};

export default PDFViewer;