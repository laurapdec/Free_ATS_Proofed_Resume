import { Box, Button, Container, Flex, HStack, Text, useToast } from '@chakra-ui/react';
import { TooltipButton } from './TooltipButton';
import Link from 'next/link';
import { useRouter } from 'next/router';

export const Navigation = () => {
  const router = useRouter();
  const toast = useToast();

  const handleGeneratePDF = () => {
    toast({
      title: 'Generating PDF',
      description: 'Your resume will be generated as a professional PDF document',
      status: 'info',
      duration: 2000,
    });
  };

  const handleAttachCoverLetter = () => {
    toast({
      title: 'Attach Cover Letter',
      description: 'You can attach a customized cover letter (PDF or DOCX)',
      status: 'info',
      duration: 2000,
    });
  };

  return (
    <Box bg="white" boxShadow="sm" position="sticky" top={0} zIndex={10}>
      <Container maxW="container.xl">
        <Flex py={4} justifyContent="space-between" alignItems="center">
          <Link href="/" passHref>
            <Text fontSize="xl" fontWeight="bold" cursor="pointer">
              ATS Resume Builder
            </Text>
          </Link>

          <HStack spacing={4}>
            {router.pathname !== '/signin' && router.pathname !== '/signup' && (
              <>
                <TooltipButton
                  tooltipText="Download your resume as a professionally formatted PDF"
                  onClick={handleGeneratePDF}
                  colorScheme="blue"
                >
                  Generate PDF
                </TooltipButton>
                <TooltipButton
                  tooltipText="Attach a tailored cover letter to complement your resume"
                  onClick={handleAttachCoverLetter}
                  variant="outline"
                  colorScheme="blue"
                >
                  Attach Cover Letter
                </TooltipButton>
                <Link href="/signin" passHref>
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/signup" passHref>
                  <Button colorScheme="blue">Sign Up</Button>
                </Link>
              </>
            )}
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
};