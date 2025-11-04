import { Button, Input, useToast, Spinner } from '@chakra-ui/react';
import { useCallback, useRef, useState } from 'react';
import { AttachmentIcon } from '@chakra-ui/icons';

interface FileUploadProps {
  onFileSelected: (file: File) => Promise<void>;
  label: string;
  accept?: string;
}

export const FileUpload = ({ onFileSelected, label, accept = ".pdf,.docx" }: FileUploadProps) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
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
      await onFileSelected(file);
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: 'Error',
        description: 'Failed to process your file. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [onFileSelected, toast]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <>
      <Input
        type="file"
        accept={accept}
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
        width="full"
      >
        {isLoading ? 'Processing...' : label}
      </Button>
    </>
  );
};