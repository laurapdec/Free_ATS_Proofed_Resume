import { Box, VStack, Heading, SimpleGrid } from '@chakra-ui/react';
import { EditableField } from './EditableField';
import type { ContactInfo } from '../../types/resume';

interface ContactSectionProps {
  contactInfo: ContactInfo;
  onUpdate: (field: string, value: string) => void;
}

export const ContactSection = ({ contactInfo, onUpdate }: ContactSectionProps) => {
  return (
    <Box>
      <Heading size="md" mb={4}>Contact Information</Heading>
      <VStack align="stretch" spacing={3}>
        <EditableField
          label="Email"
          value={contactInfo.email}
          onSave={(value) => onUpdate('email', value)}
        />
        <EditableField
          label="Phone"
          value={contactInfo.phone}
          onSave={(value) => onUpdate('phone', value)}
        />
        <SimpleGrid columns={2} spacing={3}>
          <EditableField
            label="City"
            value={contactInfo.location.city}
            onSave={(value) => onUpdate('city', value)}
          />
          <EditableField
            label="Country"
            value={contactInfo.location.country}
            onSave={(value) => onUpdate('country', value)}
          />
        </SimpleGrid>
      </VStack>
    </Box>
  );
};