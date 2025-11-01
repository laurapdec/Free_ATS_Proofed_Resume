import { Button, useToast } from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import type { Resume } from '../types/resume';

interface LinkedInSignInProps {
  onProfileLoaded?: (resume: Resume) => void;
}

export const LinkedInSignIn = ({ onProfileLoaded }: LinkedInSignInProps) => {
  const router = useRouter();
  const toast = useToast();
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID;
    if (!clientId || clientId === 'your_actual_client_id_here') {
      console.error('LinkedIn Client ID not configured');
      toast({
        title: 'Configuration Error',
        description: 'LinkedIn integration is not properly configured.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsConfigured(false);
    } else {
      setIsConfigured(true);
    }
  }, [toast]);

  const handleSignIn = useCallback(() => {
    // Store redirect preference
    sessionStorage.setItem('redirect_after_auth', '/editor');
    
    // Use backend auth endpoint to initiate OAuth flow
    window.location.href = '/api/v1/linkedin/auth';
  }, []);

  return (
    <Button
      size="lg"
      onClick={handleSignIn}
      bg="#0A66C2"
      color="white"
      _hover={{ bg: "#084c84" }}
      isDisabled={!isConfigured}
      title={!isConfigured ? 'LinkedIn integration not configured' : 'Import your LinkedIn profile'}
      leftIcon={
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
        </svg>
      }
    >
      Import from LinkedIn
    </Button>
  );
};