import React, { useRef, useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
  Text,
  Progress,
} from '@chakra-ui/react';
import { AttachmentIcon } from '@chakra-ui/icons';

interface FileUploadFormProps {
  onSuccess?: (data: any) => void;
}

export const FileUploadForm: React.FC<FileUploadFormProps> = ({ onSuccess }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);
    setProgress(0);

    const formData = new FormData(e.currentTarget);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/resumes/upload/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      toast({
        title: 'Upload successful',
        description: 'Your files have been uploaded successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      if (onSuccess) {
        onSuccess(data);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'There was an error uploading your files.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 10;
        if (next >= 90) {
          clearInterval(interval);
        }
        return next;
      });
    }, 500);
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg">
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <FormControl isRequired>
            <FormLabel>Name</FormLabel>
            <Input name="name" placeholder="Your full name" />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Email</FormLabel>
            <Input name="email" type="email" placeholder="Your email" />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Role</FormLabel>
            <Input name="role" placeholder="Position you're applying for" />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Resume/CV</FormLabel>
            <Input
              name="cv"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={() => simulateProgress()}
              ref={fileInputRef}
              display="none"
            />
            <Button
              leftIcon={<AttachmentIcon />}
              onClick={() => fileInputRef.current?.click()}
              width="full"
            >
              Select Resume
            </Button>
            {fileInputRef.current?.files?.length ? (
              <Text mt={2} fontSize="sm">
                Selected: {fileInputRef.current.files[0].name}
              </Text>
            ) : null}
          </FormControl>

          <FormControl>
            <FormLabel>Cover Letter (Optional)</FormLabel>
            <Input
              name="cover_letter"
              type="file"
              accept=".pdf,.doc,.docx"
            />
          </FormControl>

          {progress > 0 && (
            <Progress
              value={progress}
              width="100%"
              size="sm"
              colorScheme="blue"
            />
          )}

          <Button
            type="submit"
            colorScheme="blue"
            width="full"
            isLoading={uploading}
          >
            Upload Files
          </Button>
        </VStack>
      </form>
    </Box>
  );
};