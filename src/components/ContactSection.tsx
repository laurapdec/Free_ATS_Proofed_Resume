import { Box, VStack, Heading, SimpleGrid } from '@chakra-ui/react';
import { EditableField } from './EditableField';
import type { ContactInfo } from '../types/resume';

interface ContactSectionProps {
  contactInfo: ContactInfo;
  onUpdate: (field: keyof ContactInfo, value: string) => void;
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
        <EditableField
          label="Location"
          value={`${contactInfo.location.city}, ${contactInfo.location.state || ''} ${contactInfo.location.country}`}
          onSave={(value) => {
            // Simple parsing - you might want to make this more sophisticated
            const [city, stateCountry] = value.split(',').map(s => s.trim());
            const [state, country] = stateCountry.split(' ').map(s => s.trim());
            onUpdate('location', JSON.stringify({ city, state, country }));
          }}
        />
      </VStack>
    </Box>
  );
};