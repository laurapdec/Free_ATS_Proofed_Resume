import { Box, VStack, Heading, Button } from '@chakra-ui/react';
import { EditableField } from './EditableField';
import type { Experience } from '../types/resume';
import { AddIcon } from '@chakra-ui/icons';

interface ExperienceSectionProps {
  experiences: Experience[];
  onUpdate: (id: string, field: keyof Experience, value: string) => void;
  onAdd: () => void;
}

export const ExperienceSection = ({ experiences, onUpdate, onAdd }: ExperienceSectionProps) => {
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Heading size="md">Professional Experience</Heading>
        <Button leftIcon={<AddIcon />} size="sm" onClick={onAdd}>
          Add Experience
        </Button>
      </Box>
      <VStack align="stretch" spacing={6}>
        {experiences.map((exp) => (
          <Box key={exp.id} p={4} borderWidth="1px" borderRadius="md">
            <EditableField
              label="Title"
              value={exp.title}
              onSave={(value) => onUpdate(exp.id, 'title', value)}
            />
            <EditableField
              label="Company"
              value={exp.company}
              onSave={(value) => onUpdate(exp.id, 'company', value)}
            />
            <EditableField
              label="Location"
              value={exp.location}
              onSave={(value) => onUpdate(exp.id, 'location', value)}
            />
            <EditableField
              label="Period"
              value={`${exp.startDate} - ${exp.endDate}`}
              onSave={(value) => {
                const [start, end] = value.split('-').map(d => d.trim());
                onUpdate(exp.id, 'startDate', start);
                onUpdate(exp.id, 'endDate', end);
              }}
            />
            <EditableField
              label="Description"
              value={exp.description.join('\n')}
              isMultiline
              onSave={(value) => onUpdate(exp.id, 'description', value)}
            />
            <EditableField
              label="Skills"
              value={exp.skills.join(', ')}
              onSave={(value) => onUpdate(exp.id, 'skills', value)}
            />
          </Box>
        ))}
      </VStack>
    </Box>
  );
};