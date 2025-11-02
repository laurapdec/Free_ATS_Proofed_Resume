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
  Text
} from '@chakra-ui/react';

interface CoverLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  isGenerating?: boolean;
}

export const CoverLetterModal = ({ isOpen, onClose, isGenerating = false }: CoverLetterModalProps) => {
  const [coverLetter, setCoverLetter] = useState('');
  const toast = useToast();

  const handleGenerate = async () => {
    // TODO: Implement cover letter generation
  };

  const handleSave = async () => {
    // TODO: Implement cover letter saving
    onClose();
    toast({
      title: 'Cover letter saved',
      status: 'success',
      duration: 3000,
    });
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