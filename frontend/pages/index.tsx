import { Box, Container, VStack, Heading, Text, Button, Center } from '@chakra-ui/react';
import { LinkedInSignIn } from '../components/LinkedInSignIn';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function HomePage() {
  const router = useRouter();

  // Handle direct navigation to editor if needed
  useEffect(() => {
    const { redirectToEditor } = router.query;
    if (redirectToEditor === 'true') {
      router.push('/editor');
    }
  }, [router, router.query]);

  return (
    <Container maxW="container.xl" py={16}>
      <VStack spacing={8} align="center">
        <Heading as="h1" size="2xl" textAlign="center">
          Create your ATS Proofed CV
        </Heading>
        
        <Text fontSize="xl" color="gray.600" textAlign="center" maxW="2xl">
          In seconds. For Free. 
        </Text>
        <Text fontSize="xl" color="gray.600" textAlign="center" maxW="2xl">
          Transform your LinkedIn profile into a professional, ATS-friendly resume that helps you stand out and get more interviews.
        </Text>
        <Text fontSize="xl" color="gray.600" textAlign="center" maxW="2xl">
          No watermarks, no credit card, no hassle.
        </Text>

        <Box py={8}>
          <LinkedInSignIn />
        </Box>

        <VStack spacing={4} pt={8}>
          <Text fontSize="md" color="gray.500">
            Already imported your profile?
          </Text>
          <Button
            variant="outline"
            onClick={() => router.push('/editor')}
          >
            Go to Resume Editor
          </Button>
        </VStack>
      </VStack>
    </Container>
  );
}