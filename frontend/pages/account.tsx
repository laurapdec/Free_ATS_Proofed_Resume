import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Text,
  VStack,
  HStack,
  Avatar,
  Badge,
  Divider,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Switch,
  useToast,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  IconButton,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Progress,
  Flex,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Header } from '../components/Header';
import { EditIcon, EmailIcon, LockIcon, BellIcon, SettingsIcon, DownloadIcon } from '@chakra-ui/icons';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  createdAt: string;
  subscription: {
    plan: 'free' | 'premium';
    status: 'active' | 'inactive' | 'trial';
    expiresAt?: string;
    resumesUsed: number;
    resumesLimit: number;
  };
  preferences: {
    emailNotifications: boolean;
  };
}

export default function Account() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const router = useRouter();
  const toast = useToast();

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/auth/profile');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
        });
      } else {
        router.push('/signin');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      router.push('/signin');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setIsEditing(false);
        toast({
          title: 'Profile updated',
          description: 'Your profile has been successfully updated.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (response.ok) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        toast({
          title: 'Password changed',
          description: 'Your password has been successfully changed.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error('Failed to change password');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to change password. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handlePreferenceChange = async (key: string, value: boolean) => {
    if (!user) return;

    try {
      const response = await fetch('/api/auth/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...user.preferences,
          [key]: value,
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        toast({
          title: 'Preferences updated',
          description: 'Your preferences have been saved.',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update preferences.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleUpgrade = () => {
    // TODO: Implement payment flow
    toast({
      title: 'Coming Soon',
      description: 'Premium upgrade will be available soon!',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  if (isLoading) {
    return (
      <Box minH="100vh" bg={bgColor}>
        <Header isLoggedIn={true} setIsLoggedIn={() => {}} />
        <Container maxW="container.lg" py={8}>
          <Text>Loading...</Text>
        </Container>
      </Box>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Box minH="100vh" bg={bgColor}>
      <Head>
        <title>Extensions & Integrations - ATS Resume</title>
        <meta name="description" content="Manage your extensions and integrations to enhance your resume building experience" />
      </Head>
      <Header isLoggedIn={true} setIsLoggedIn={() => {}} />
      <Container maxW="container.lg" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <HStack justify="space-between" align="center">
            <VStack align="start" spacing={1}>
              <Heading size="lg">Extensions & Integrations</Heading>
              <Text color="gray.600">Manage your extensions and enhance your resume building experience</Text>
            </VStack>
            <Badge
              colorScheme={user.subscription.plan === 'premium' ? 'blue' : 'gray'}
              fontSize="sm"
              px={3}
              py={1}
            >
              {user.subscription.plan === 'premium' ? 'Premium' : 'Free'} Plan
            </Badge>
          </HStack>

          <Tabs variant="enclosed" colorScheme="blue">
            <TabList>
              <Tab>Profile</Tab>
              <Tab>Security</Tab>
              <Tab>Preferences</Tab>
              <Tab>Extensions</Tab>
            </TabList>

            <TabPanels>
              {/* Profile Tab */}
              <TabPanel>
                <Card bg={cardBg} borderColor={borderColor}>
                  <CardHeader>
                    <HStack justify="space-between">
                      <Heading size="md">Profile Information</Heading>
                      <IconButton
                        aria-label="Edit profile"
                        icon={<EditIcon />}
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditing(!isEditing)}
                      />
                    </HStack>
                  </CardHeader>
                  <CardBody>
                    <Grid templateColumns={{ base: '1fr', md: '200px 1fr' }} gap={6}>
                      <GridItem>
                        <VStack spacing={4}>
                          <Avatar
                            size="xl"
                            name={`${user.firstName} ${user.lastName}`}
                            src={user.avatar}
                          />
                          <Button size="sm" leftIcon={<DownloadIcon />}>
                            Change Photo
                          </Button>
                        </VStack>
                      </GridItem>
                      <GridItem>
                        <VStack spacing={4} align="stretch">
                          <HStack spacing={4}>
                            <FormControl>
                              <FormLabel>First Name</FormLabel>
                              <Input
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                isReadOnly={!isEditing}
                              />
                            </FormControl>
                            <FormControl>
                              <FormLabel>Last Name</FormLabel>
                              <Input
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                isReadOnly={!isEditing}
                              />
                            </FormControl>
                          </HStack>
                          <FormControl>
                            <FormLabel>Email</FormLabel>
                            <Input
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              isReadOnly={!isEditing}
                            />
                          </FormControl>
                          {isEditing && (
                            <HStack spacing={4}>
                              <Button colorScheme="blue" onClick={handleProfileUpdate}>
                                Save Changes
                              </Button>
                              <Button variant="ghost" onClick={() => setIsEditing(false)}>
                                Cancel
                              </Button>
                            </HStack>
                          )}
                        </VStack>
                      </GridItem>
                    </Grid>
                  </CardBody>
                </Card>
              </TabPanel>

              {/* Security Tab */}
              <TabPanel>
                <Card bg={cardBg} borderColor={borderColor}>
                  <CardHeader>
                    <Heading size="md">Change Password</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch" maxW="400px">
                      <FormControl>
                        <FormLabel>Current Password</FormLabel>
                        <Input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>New Password</FormLabel>
                        <Input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Confirm New Password</FormLabel>
                        <Input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </FormControl>
                      <Button
                        colorScheme="blue"
                        onClick={handlePasswordChange}
                        leftIcon={<LockIcon />}
                        isDisabled={!currentPassword || !newPassword || !confirmPassword}
                      >
                        Change Password
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              </TabPanel>

              {/* Preferences Tab */}
              <TabPanel>
                <Card bg={cardBg} borderColor={borderColor}>
                  <CardHeader>
                    <Heading size="md">Notification Preferences</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={6} align="stretch">
                      <HStack justify="space-between">
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="medium">Email Notifications</Text>
                          <Text fontSize="sm" color="gray.600">
                            Receive emails about your account activity
                          </Text>
                        </VStack>
                        <Switch
                          colorScheme="blue"
                          isChecked={user.preferences.emailNotifications}
                          onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                        />
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              </TabPanel>

              {/* Extensions Tab */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Card bg={cardBg} borderColor={borderColor}>
                    <CardHeader>
                      <HStack justify="space-between">
                        <Heading size="md">Available Extensions</Heading>
                        <Badge colorScheme="blue" fontSize="sm">
                          {user.subscription.plan === 'premium' ? 'Premium Access' : 'Limited Access'}
                        </Badge>
                      </HStack>
                    </CardHeader>
                    <CardBody>
                      <Text color="gray.600" mb={4}>
                        Enhance your resume building experience with powerful extensions and integrations.
                      </Text>
                      <VStack spacing={4} align="stretch">
                        {/* LinkedIn Integration Extension */}
                        <Card bg={useColorModeValue('gray.50', 'gray.700')} borderColor={borderColor}>
                          <CardBody>
                            <HStack justify="space-between" align="start">
                              <VStack align="start" spacing={2} flex="1">
                                <HStack>
                                  <Box boxSize="24px" color="blue.500">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                    </svg>
                                  </Box>
                                  <Heading size="sm">LinkedIn Integration</Heading>
                                </HStack>
                                <Text fontSize="sm" color="gray.600">
                                  Automatically import your LinkedIn profile data and keep your resume synchronized.
                                </Text>
                                <HStack spacing={2}>
                                  <Badge colorScheme="green" fontSize="xs">Installed</Badge>
                                  <Badge colorScheme="blue" fontSize="xs">Active</Badge>
                                </HStack>
                              </VStack>
                              <VStack spacing={2}>
                                <Button 
                                  size="sm" 
                                  colorScheme="blue" 
                                  variant="outline"
                                  onClick={() => {
                                    // Redirect to LinkedIn OAuth
                                    window.location.href = '/api/auth/linkedin';
                                  }}
                                >
                                  Configure
                                </Button>
                                <Button size="sm" colorScheme="red" variant="ghost">
                                  Uninstall
                                </Button>
                              </VStack>
                            </HStack>
                          </CardBody>
                        </Card>

                        {/* Firefox Extension */}
                        <Card bg={useColorModeValue('gray.50', 'gray.700')} borderColor={borderColor}>
                          <CardBody>
                            <HStack justify="space-between" align="start">
                              <VStack align="start" spacing={2} flex="1">
                                <HStack>
                                  <Box boxSize="24px" color="orange.500">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                    </svg>
                                  </Box>
                                  <Heading size="sm">Firefox Extension</Heading>
                                </HStack>
                                <Text fontSize="sm" color="gray.600">
                                  Browser extension for quick resume optimization and job application tracking.
                                </Text>
                                <HStack spacing={2}>
                                  <Badge colorScheme="yellow" fontSize="xs">Not Installed</Badge>
                                </HStack>
                              </VStack>
                              <VStack spacing={2}>
                                <Button size="sm" colorScheme="blue">
                                  Install
                                </Button>
                              </VStack>
                            </HStack>
                          </CardBody>
                        </Card>
                      </VStack>
                    </CardBody>
                  </Card>

                  {user.subscription.plan === 'free' && (
                    <Alert status="info" borderRadius="md">
                      <AlertIcon />
                      <Box>
                        <AlertTitle>Unlock Premium Extensions!</AlertTitle>
                        <AlertDescription>
                          Upgrade to Premium to access advanced extensions like Job Board Integrations, Resume Templates Pro, and Interview Preparation tools.
                        </AlertDescription>
                      </Box>
                    </Alert>
                  )}
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Container>
    </Box>
  );
}