import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
  VStack,
  Text,
  useToast,
} from '@chakra-ui/react';
import { Header } from '../components/Header';

export default function ResetPassword() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    // Redirect to signin page with forgot password shown
    toast({
      title: 'Password Reset',
      description: 'Please use the sign-in page to reset your password.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
    router.push('/signin?reset=true');
  }, [router, toast]);

  return (
    <Box minH="100vh" bg="gray.50">
      <Header isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
      <Container maxW="container.sm" pt={20}>
        <VStack spacing={8} align="stretch">
          <VStack spacing={3}>
            <Text fontSize="2xl" fontWeight="bold">
              Redirecting...
            </Text>
            <Text textAlign="center" color="gray.600">
              Taking you to the sign-in page to reset your password.
            </Text>
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
}