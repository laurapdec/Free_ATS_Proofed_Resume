import { ArrowBackIcon } from '@chakra-ui/icons';
import { Box, Button, Flex, Text, useColorModeValue } from '@chakra-ui/react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface HeaderProps {
  isLoggedIn: boolean;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
}

export function Header({ isLoggedIn, setIsLoggedIn }: HeaderProps) {
  // Theme hooks must be called first
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const bgColor = useColorModeValue('white', 'gray.800');
  
  // Router hooks
  const router = useRouter();
  
  // Derived state
  const isAuthPage = router.pathname === '/signin' || router.pathname === '/signin';
  const isEditorPage = router.pathname === '/editor';

  return (
    <Box 
      w="full" 
      py={4} 
      px={6} 
      borderBottom="1px" 
      borderColor={borderColor}
      bg={bgColor}
      >
        <Flex justify="space-between" align="center">
          <Flex align="center" gap={4}>
            {(isAuthPage || isEditorPage) && (
              <Link href="/" passHref>
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<ArrowBackIcon />}
                >
                  Back to Home
                </Button>
              </Link>
            )}
            <Text fontSize="xl" fontWeight="bold">
              Free ATS-Optimized Resume Generator
            </Text>
          </Flex>
          <Flex gap={6} align="center">
            {isLoggedIn ? (
              <Flex gap={3}>
                <Link href="/account" passHref>
                  <Button
                    size="sm"
                    variant="ghost"
                    colorScheme="blue"
                  >
                    Manage Account
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="solid"
                  colorScheme="blue"
                  onClick={() => {
                    setIsLoggedIn(false);
                    router.push('/');
                  }}
                >
                  Logout
                </Button>
              </Flex>
            ) : (
              <Flex gap={3}>
                <Link href="/signin" passHref>
                  <Button
                    size="sm"
                    variant="ghost"
                    colorScheme="blue"
                    isDisabled={isAuthPage && router.pathname === '/signin'}
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/signin" passHref>
                  <Button
                    size="sm"
                    variant="solid"
                    colorScheme="blue"
                    isDisabled={isAuthPage && router.pathname === '/signin'}
                  >
                    Register
                  </Button>
                </Link>
              </Flex>
            )}
          </Flex>
        </Flex>
      </Box>
    );
}

            
