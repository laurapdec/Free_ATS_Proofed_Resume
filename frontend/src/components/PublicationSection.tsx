import { Box, VStack, Heading, Button } from '@chakra-ui/react';
import { EditableField } from './EditableField';
import type { Publication } from '../../types/resume';
import { AddIcon } from '@chakra-ui/icons';

interface PublicationSectionProps {
  publications: Publication[];
  onUpdate: (id: string, field: string, value: string) => void;
  onAdd: () => void;
}

export const PublicationSection = ({ publications, onUpdate, onAdd }: PublicationSectionProps) => {
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Heading size="md">Publications</Heading>
        <Button leftIcon={<AddIcon />} size="sm" onClick={onAdd}>
          Add Publication
        </Button>
      </Box>
      <VStack align="stretch" spacing={6}>
        {publications.map((pub) => (
          <Box key={pub.id} p={4} borderWidth="1px" borderRadius="md">
            <EditableField
              label="Title"
              value={pub.title}
              onSave={(value) => onUpdate(pub.id, 'title', value)}
            />
            <EditableField
              label="Publisher"
              value={pub.publisher}
              onSave={(value) => onUpdate(pub.id, 'publisher', value)}
            />
            <EditableField
              label="Date"
              value={pub.date}
              onSave={(value) => onUpdate(pub.id, 'date', value)}
            />
            <EditableField
              label="Authors"
              value={pub.authors.join(', ')}
              onSave={(value) => onUpdate(pub.id, 'authors', value)}
            />
            {pub.url && (
              <EditableField
                label="URL"
                value={pub.url}
                onSave={(value) => onUpdate(pub.id, 'url', value)}
              />
            )}
            {pub.description && (
              <EditableField
                label="Description"
                value={pub.description}
                isMultiline
                onSave={(value) => onUpdate(pub.id, 'description', value)}
              />
            )}
          </Box>
        ))}
      </VStack>
    </Box>
  );
};