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
    jobAlerts: boolean;
    weeklyReports: boolean;
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
      <Header isLoggedIn={true} setIsLoggedIn={() => {}} />
      <Container maxW="container.lg" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <HStack justify="space-between" align="center">
            <VStack align="start" spacing={1}>
              <Heading size="lg">Account Settings</Heading>
              <Text color="gray.600">Manage your account and preferences</Text>
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
              <Tab>Subscription</Tab>
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
                      <Divider />
                      <HStack justify="space-between">
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="medium">Job Alerts</Text>
                          <Text fontSize="sm" color="gray.600">
                            Get notified when new jobs match your profile
                          </Text>
                        </VStack>
                        <Switch
                          colorScheme="blue"
                          isChecked={user.preferences.jobAlerts}
                          onChange={(e) => handlePreferenceChange('jobAlerts', e.target.checked)}
                        />
                      </HStack>
                      <Divider />
                      <HStack justify="space-between">
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="medium">Weekly Reports</Text>
                          <Text fontSize="sm" color="gray.600">
                            Receive weekly summaries of your job search activity
                          </Text>
                        </VStack>
                        <Switch
                          colorScheme="blue"
                          isChecked={user.preferences.weeklyReports}
                          onChange={(e) => handlePreferenceChange('weeklyReports', e.target.checked)}
                        />
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              </TabPanel>

              {/* Subscription Tab */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Card bg={cardBg} borderColor={borderColor}>
                    <CardHeader>
                      <HStack justify="space-between">
                        <Heading size="md">Current Plan</Heading>
                        <Badge
                          colorScheme={user.subscription.plan === 'premium' ? 'blue' : 'gray'}
                          fontSize="sm"
                        >
                          {user.subscription.plan === 'premium' ? 'Premium' : 'Free'}
                        </Badge>
                      </HStack>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <HStack justify="space-between">
                          <Text>Resume Optimizations Used</Text>
                          <Text fontWeight="medium">
                            {user.subscription.resumesUsed} / {user.subscription.resumesLimit}
                          </Text>
                        </HStack>
                        <Progress
                          value={(user.subscription.resumesUsed / user.subscription.resumesLimit) * 100}
                          colorScheme="blue"
                          size="sm"
                        />
                        {user.subscription.plan === 'free' && (
                          <Alert status="info" borderRadius="md">
                            <AlertIcon />
                            <Box>
                              <AlertTitle>Upgrade to Premium!</AlertTitle>
                              <AlertDescription>
                                Get unlimited resume optimizations, cover letter generation, and priority support.
                              </AlertDescription>
                            </Box>
                          </Alert>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>

                  {user.subscription.plan === 'free' && (
                    <Card bg={cardBg} borderColor={borderColor}>
                      <CardHeader>
                        <Heading size="md">Upgrade to Premium</Heading>
                      </CardHeader>
                      <CardBody>
                        <VStack spacing={4} align="stretch">
                          <VStack align="start" spacing={2}>
                            <Text fontWeight="medium">Premium Features:</Text>
                            <Text fontSize="sm">• Unlimited resume optimizations</Text>
                            <Text fontSize="sm">• AI-generated cover letters</Text>
                            <Text fontSize="sm">• Priority customer support</Text>
                            <Text fontSize="sm">• Advanced job matching</Text>
                            <Text fontSize="sm">• Export to multiple formats</Text>
                          </VStack>
                          <Button
                            colorScheme="blue"
                            size="lg"
                            onClick={handleUpgrade}
                            leftIcon={<SettingsIcon />}
                          >
                            Upgrade Now - $9.99/month
                          </Button>
                        </VStack>
                      </CardBody>
                    </Card>
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