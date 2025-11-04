import { Box, VStack, Heading, Button } from '@chakra-ui/react';
import { EditableField } from './EditableField';
import type { Education } from '../../types/resume';
import { AddIcon } from '@chakra-ui/icons';

interface EducationSectionProps {
  education: Education[];
  onUpdate: (id: string, field: string, value: string) => void;
  onAdd: () => void;
}

export const EducationSection = ({ education, onUpdate, onAdd }: EducationSectionProps) => {
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Heading size="md">Education</Heading>
        <Button leftIcon={<AddIcon />} size="sm" onClick={onAdd}>
          Add Education
        </Button>
      </Box>
      <VStack align="stretch" spacing={6}>
        {education.map((edu) => (
          <Box key={edu.id} p={4} borderWidth="1px" borderRadius="md">
            <EditableField
              label="School"
              value={edu.school}
              onSave={(value) => onUpdate(edu.id, 'school', value)}
            />
            <EditableField
              label="Degree"
              value={edu.degree}
              onSave={(value) => onUpdate(edu.id, 'degree', value)}
            />
            <EditableField
              label="Field of Study"
              value={edu.field}
              onSave={(value) => onUpdate(edu.id, 'field', value)}
            />
            <EditableField
              label="Period"
              value={`${edu.startDate} - ${edu.endDate}`}
              onSave={(value) => {
                const [start, end] = value.split('-').map(d => d.trim());
                onUpdate(edu.id, 'startDate', start);
                onUpdate(edu.id, 'endDate', end);
              }}
            />
            {edu.gpa && (
              <EditableField
                label="GPA"
                value={edu.gpa.toString()}
                onSave={(value) => onUpdate(edu.id, 'gpa', value)}
              />
            )}
            {edu.activities && (
              <EditableField
                label="Activities"
                value={edu.activities.join(', ')}
                onSave={(value) => onUpdate(edu.id, 'activities', value)}
              />
            )}
          </Box>
        ))}
      </VStack>
    </Box>
  );
};