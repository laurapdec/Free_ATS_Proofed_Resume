import { Box, VStack, Heading, Button, SimpleGrid } from '@chakra-ui/react';
import { EditableField } from './EditableField';
import type { Language } from '../types/resume';
import { AddIcon } from '@chakra-ui/icons';

interface LanguageSectionProps {
  languages: Language[];
  onUpdate: (id: string, field: keyof Language, value: string) => void;
  onAdd: () => void;
}

export const LanguageSection = ({ languages, onUpdate, onAdd }: LanguageSectionProps) => {
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Heading size="md">Languages</Heading>
        <Button leftIcon={<AddIcon />} size="sm" onClick={onAdd}>
          Add Language
        </Button>
      </Box>
      <SimpleGrid columns={[1, 2, 3]} spacing={4}>
        {languages.map((lang) => (
          <Box key={lang.id} p={4} borderWidth="1px" borderRadius="md">
            <EditableField
              label="Language"
              value={lang.name}
              onSave={(value) => onUpdate(lang.id, 'name', value)}
            />
            <EditableField
              label="Proficiency"
              value={lang.proficiency}
              onSave={(value) => onUpdate(lang.id, 'proficiency', value)}
            />
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
};