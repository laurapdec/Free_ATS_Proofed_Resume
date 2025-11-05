import { Button, Input, useToast, Spinner } from '@chakra-ui/react';
import { useCallback, useRef, useState } from 'react';
import { AttachmentIcon } from '@chakra-ui/icons';
import type { Resume } from '../types/resume';

interface ScanCVButtonProps {
  onProfileLoaded?: (resume: Resume) => void;
}

export const ScanCVButton = ({ onProfileLoaded }: ScanCVButtonProps) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Only accept PDF and DOCX files
    if (!file.type.match('application/pdf|application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF or DOCX file',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('Uploading file:', file.name, file.type, file.size);

      const response = await fetch('/api/scan-cv', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to scan CV');
      }

      toast({
        title: 'CV Scanned Successfully',
        description: 'Processing your CV...',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onProfileLoaded?.(data);
    } catch (error) {
      console.error('Error scanning CV:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to scan your CV. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, onProfileLoaded]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <>
      <Input
        type="file"
        accept=".pdf,.docx"
        ref={fileInputRef}
        onChange={handleFileChange}
        display="none"
      />
      <Button
        size="lg"
        onClick={handleClick}
        colorScheme="blue"
        leftIcon={isLoading ? <Spinner size="sm" /> : <AttachmentIcon />}
        isDisabled={isLoading}
      >
        {isLoading ? 'Scanning...' : 'Upload your CV'}
      </Button>
    </>
  );
};