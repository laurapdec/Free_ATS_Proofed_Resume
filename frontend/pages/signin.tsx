import { Box, Button, Container, FormControl, FormLabel, Input, Stack, Text, VStack, useToast } from '@chakra-ui/react';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Add your sign-in logic here
      // For now, let's just redirect to the editor
      router.push('/editor');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign in',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="container.sm" py={10}>
      <VStack spacing={8}>
        <Text fontSize="2xl" fontWeight="bold">Sign In</Text>
        
        <Box as="form" onSubmit={handleSubmit} width="100%">
          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </FormControl>

            <Button type="submit" colorScheme="blue" size="lg" width="100%">
              Sign In
            </Button>

            <Text textAlign="center">
              Don&apos;t have an account?{' '}
              <Link href="/signup" passHref>
                <Box as="span" color="blue.500" _hover={{ textDecoration: 'underline' }}>
                  Sign Up
                </Box>
              </Link>
            </Text>
          </Stack>
        </Box>
      </VStack>
    </Container>
  );
}