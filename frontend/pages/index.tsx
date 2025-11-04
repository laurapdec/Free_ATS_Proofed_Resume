import { Box, Text } from '@chakra-ui/react';
import { MainLayout } from '../components/MainLayout';
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
    <MainLayout>
      <Box textAlign="center" py={20}>
        <Text fontSize="xl" color="gray.500">
          Welcome ! Let's create an application that stands out.
        </Text>
      </Box>
    </MainLayout>
  );
}