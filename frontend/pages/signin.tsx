import { Box, Button, Container, FormControl, FormLabel, Input, Stack, Text, VStack, useToast, useColorModeValue, Flex } from '@chakra-ui/react';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Header } from '../components/Header';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Add your sign-in logic here
      // Redirect to home page
      router.push('/');
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

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [signinEmail, setsigninEmail] = useState('');
  const [signinPassword, setsigninPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handlesignin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signinPassword !== confirmPassword) {
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
      router.push('/');
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

  const rendersigninComponent = () => (
    <Container maxW="container.sm">
      <VStack spacing={8} align="stretch">
        <VStack spacing={3}>
          <Text fontSize="2xl" fontWeight="bold">Create Account</Text>
        </VStack>
        
        <Box as="form" onSubmit={handlesignin}>
          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                value={signinEmail}
                onChange={(e) => setsigninEmail(e.target.value)}
                placeholder="Enter your email"
                size="lg"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                value={signinPassword}
                onChange={(e) => setsigninPassword(e.target.value)}
                placeholder="Enter your password"
                size="lg"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Confirm Password</FormLabel>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                size="lg"
              />
            </FormControl>

            <Button
              type="submit"
              colorScheme="blue"
              size="lg"
              width="100%"
              mt={4}
              position="relative"
              zIndex={1}
            >
              Create Account
            </Button>

            <Text textAlign="center" color="gray.500" fontSize="sm" mt={2} position="relative" zIndex={1}>
              or
            </Text>
          </Stack>
        </Box>
      </VStack>
    </Container>
  );

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.800')}>
      <Header isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
      <Flex h="calc(100vh - 72px)" overflow="auto">
        {/* Left side - Sign Up Component */}
        <Box
          w="30%"
          borderRight="1px"
          borderColor={useColorModeValue('gray.200', 'gray.700')}
          bg={useColorModeValue('white', 'gray.800')}
          p={10}
          display="flex"
          alignItems="flex-start"
          justifyContent="center"
          overflowY="auto"
        >
          {rendersigninComponent()}
        </Box>

        {/* Right side - Sign In Form */}
        <Box w="70%" p={10} display="flex" alignItems="flex-start" justifyContent="center" overflowY="auto">
          <Container maxW="container.sm">
            <VStack spacing={8} align="stretch">
              <VStack spacing={3}>
                <Text fontSize="2xl" fontWeight="bold">Sign In</Text>
              </VStack>              <Box as="form" onSubmit={handleSubmit}>
                <Stack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      size="lg"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Password</FormLabel>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      size="lg"
                    />
                  </FormControl>

                  <Button 
                    type="submit" 
                    colorScheme="blue" 
                    size="lg" 
                    width="100%"
                    mt={4}
                    position="relative"
                    zIndex={2}
                  >
                    Sign In
                  </Button>

                  <Text textAlign="center" color="gray.500" fontSize="sm" mt={2} position="relative" zIndex={2}>
                    Sign in to unlock all premium features
                  </Text>
                </Stack>
              </Box>
            </VStack>
          </Container>
        </Box>
      </Flex>
    </Box>
  );
}