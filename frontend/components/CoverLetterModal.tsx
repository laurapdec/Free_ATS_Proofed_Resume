import { useState } from 'react';
import { 
  Modal, 
  ModalOverlay, 
  ModalContent, 
  ModalHeader, 
  ModalFooter, 
  ModalBody, 
  ModalCloseButton,
  Button,
  Textarea,
  VStack,
  useToast,
  Text,
  Divider
} from '@chakra-ui/react';
import { EditIcon } from '@chakra-ui/icons';
import { FileUpload } from './FileUpload';

interface CoverLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  isGenerating?: boolean;
  onSuccess?: (pdfUrl: string) => void;
}

export const CoverLetterModal = ({ isOpen, onClose, isGenerating = false, onSuccess }: CoverLetterModalProps) => {
  const [coverLetter, setCoverLetter] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const toast = useToast();

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-cover-letter', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload cover letter');
      }

      const data = await response.json();
      onSuccess?.(data.url);
      onClose();
      
      toast({
        title: 'Upload successful',
        description: 'Your cover letter has been uploaded.',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error uploading cover letter:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload your cover letter. Please try again.',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerate = async () => {
    // TODO: Implement cover letter generation
  };

  const handleSave = async () => {
    try {
      // TODO: Implement actual PDF generation
      const pdfUrl = '/sample-cover-letter.pdf'; // This should be replaced with actual PDF generation
      onSuccess?.(pdfUrl);
      onClose();
      toast({
        title: 'Cover letter saved',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error saving cover letter:', error);
      toast({
        title: 'Error saving cover letter',
        status: 'error',
        duration: 3000,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {isGenerating ? 'Generate Cover Letter' : 'Upload Cover Letter'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            {isGenerating ? (
              <Text fontSize="sm" color="gray.600">
                We'll use AI to generate a personalized cover letter based on your resume and the job description.
              </Text>
            ) : (
              <Text fontSize="sm" color="gray.600">
                Paste or type your cover letter below.
              </Text>
            )}
            <Textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder={isGenerating ? 'Generated cover letter will appear here...' : 'Enter your cover letter...'}
              minH="300px"
              isDisabled={isGenerating}
            />
          </VStack>
        </ModalBody>

        <ModalFooter gap={2}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          {isGenerating ? (
            <Button 
              colorScheme="blue" 
              onClick={handleGenerate}
              isLoading={isGenerating}
              loadingText="Generating..."
            >
              Generate
            </Button>
          ) : (
            <Button 
              colorScheme="blue" 
              onClick={handleSave}
            >
              Save
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};