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

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [signinEmail, setsigninEmail] = useState('');
  const [signinPassword, setsigninPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signinFirstName, setsigninFirstName] = useState('');
  const [signinLastName, setsigninLastName] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetCode, setShowResetCode] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Sign in successful',
          description: 'Welcome back!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        // Redirect to home page
        router.push('/');
      } else {
        const errorData = await response.json();
        toast({
          title: 'Sign in failed',
          description: errorData.message || 'Invalid email or password',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign in. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });

      if (response.ok) {
        toast({
          title: 'Reset code sent',
          description: 'Please check your email for a 6-digit reset code.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        setShowForgotPassword(false);
        setShowResetCode(true);
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.message || 'Failed to send password reset code.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send password reset code. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmNewPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure your passwords match.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters long.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: resetCode,
          new_password: newPassword,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Password reset successful',
          description: 'Your password has been reset. You can now sign in with your new password.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        // Reset form and go back to sign in
        setShowResetCode(false);
        setResetCode('');
        setNewPassword('');
        setConfirmNewPassword('');
        setForgotPasswordEmail('');
      } else {
        const errorData = await response.json();
        toast({
          title: 'Reset failed',
          description: errorData.message || 'Failed to reset password.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reset password. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signinPassword !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure your passwords match.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: signinEmail, 
          password: signinPassword,
          firstName: signinFirstName,
          lastName: signinLastName
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Account created successfully',
          description: 'Please sign in with your new account.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        // Clear signup form
        setsigninEmail('');
        setsigninPassword('');
        setConfirmPassword('');
        setsigninFirstName('');
        setsigninLastName('');
      } else {
        const errorData = await response.json();
        toast({
          title: 'Sign up failed',
          description: errorData.message || 'Failed to create account',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create account. Please try again.',
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
        
        <Box as="form" onSubmit={handleSignup}>
          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel>First Name</FormLabel>
              <Input
                type="text"
                value={signinFirstName}
                onChange={(e) => setsigninFirstName(e.target.value)}
                placeholder="Enter your first name"
                size="lg"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Last Name</FormLabel>
              <Input
                type="text"
                value={signinLastName}
                onChange={(e) => setsigninLastName(e.target.value)}
                placeholder="Enter your last name"
                size="lg"
              />
            </FormControl>

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
                <Text fontSize="2xl" fontWeight="bold">
                  {showForgotPassword ? 'Reset Password' : showResetCode ? 'Enter Reset Code' : 'Sign In'}
                </Text>
              </VStack>

              {showResetCode ? (
                <Box as="form" onSubmit={handleResetPassword}>
                  <Stack spacing={4}>
                    <Text textAlign="center" color="gray.600" mb={4}>
                      Enter the 6-digit code sent to {forgotPasswordEmail} and your new password.
                    </Text>
                    <FormControl isRequired>
                      <FormLabel>Reset Code</FormLabel>
                      <Input
                        type="text"
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                        placeholder="Enter 6-digit code"
                        size="lg"
                        maxLength={6}
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>New Password</FormLabel>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter your new password"
                        size="lg"
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>Confirm New Password</FormLabel>
                      <Input
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Confirm your new password"
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
                      Reset Password
                    </Button>

                    <Text
                      textAlign="center"
                      color="blue.500"
                      fontSize="sm"
                      mt={2}
                      position="relative"
                      zIndex={2}
                      cursor="pointer"
                      onClick={() => {
                        setShowResetCode(false);
                        setResetCode('');
                        setNewPassword('');
                        setConfirmNewPassword('');
                        setForgotPasswordEmail('');
                      }}
                      _hover={{ textDecoration: 'underline' }}
                    >
                      Back to Sign In
                    </Text>
                  </Stack>
                </Box>
              ) : showForgotPassword ? (
                <Box as="form" onSubmit={handleForgotPassword}>
                  <Stack spacing={4}>
                    <Text textAlign="center" color="gray.600" mb={4}>
                      Enter your email address and we'll send you a link to reset your password.
                    </Text>
                    <FormControl isRequired>
                      <FormLabel>Email</FormLabel>
                      <Input
                        type="email"
                        value={forgotPasswordEmail}
                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                        placeholder="Enter your email"
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
                      Send Reset Link
                    </Button>

                    <Text
                      textAlign="center"
                      color="blue.500"
                      fontSize="sm"
                      mt={2}
                      position="relative"
                      zIndex={2}
                      cursor="pointer"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setForgotPasswordEmail('');
                      }}
                      _hover={{ textDecoration: 'underline' }}
                    >
                      Back to Sign In
                    </Text>
                  </Stack>
                </Box>
              ) : (
                <Box as="form" onSubmit={handleSubmit}>
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

                    <Text textAlign="center" color="gray.500" fontSize="sm" mt={2} position="relative" zIndex={1}>
                      or
                    </Text>

                    <Button
                      colorScheme="linkedin"
                      size="lg"
                      width="100%"
                      mt={2}
                      position="relative"
                      zIndex={2}
                      leftIcon={
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      }
                      onClick={() => {
                        // TODO: Implement LinkedIn OAuth
                        toast({
                          title: 'Coming Soon',
                          description: 'LinkedIn sign-in will be available soon!',
                          status: 'info',
                          duration: 3000,
                          isClosable: true,
                        });
                      }}
                    >
                      Continue with LinkedIn
                    </Button>

                    <Text
                      textAlign="center"
                      color="blue.500"
                      fontSize="sm"
                      mt={2}
                      position="relative"
                      zIndex={2}
                      cursor="pointer"
                      onClick={() => setShowForgotPassword(true)}
                      _hover={{ textDecoration: 'underline' }}
                    >
                      Forgot your account?
                    </Text>
                  </Stack>
                </Box>
              )}
            </VStack>
          </Container>
        </Box>
      </Flex>
    </Box>
  );
}