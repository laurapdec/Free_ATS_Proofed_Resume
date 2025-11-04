import { Box, Button, Container, FormControl, FormLabel, Input, Stack, Text, VStack, useToast } from '@chakra-ui/react';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      // Add your sign-up logic here
      // For now, let's just redirect to the editor
      router.push('/editor');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign up',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="container.sm" py={10}>
      <VStack spacing={8}>
        <Text fontSize="2xl" fontWeight="bold">Create Account</Text>
        
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

            <FormControl isRequired>
              <FormLabel>Confirm Password</FormLabel>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
              />
            </FormControl>

            <Button type="submit" colorScheme="blue" size="lg" width="100%">
              Sign Up
            </Button>

            <Text textAlign="center">
              Already have an account?{' '}
              <Link href="/signin" passHref>
                <Box as="span" color="blue.500" _hover={{ textDecoration: 'underline' }}>
                  Sign In
                </Box>
              </Link>
            </Text>
          </Stack>
        </Box>
      </VStack>
    </Container>
  );
}