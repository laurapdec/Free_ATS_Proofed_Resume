import { Box, VStack, Heading, Button, SimpleGrid } from '@chakra-ui/react';
import { EditableField } from './EditableField';
import type { Skill } from '../../types/resume';
import { AddIcon } from '@chakra-ui/icons';

interface SkillsSectionProps {
  skills: Skill[];
  onUpdate: (id: string, field: string, value: string) => void;
  onAdd: () => void;
}

export const SkillsSection = ({ skills, onUpdate, onAdd }: SkillsSectionProps) => {
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Heading size="md">Skills</Heading>
        <Button leftIcon={<AddIcon />} size="sm" onClick={onAdd}>
          Add Skill
        </Button>
      </Box>
      <SimpleGrid columns={[1, 2, 3]} spacing={4}>
        {skills.map((skill) => (
          <Box key={skill.id} p={4} borderWidth="1px" borderRadius="md">
            <EditableField
              label="Skill"
              value={skill.name}
              onSave={(value) => onUpdate(skill.id, 'name', value)}
            />
            <EditableField
              label="Level"
              value={skill.level}
              onSave={(value) => onUpdate(skill.id, 'level', value)}
            />
            {skill.endorsements !== undefined && (
              <EditableField
                label="Endorsements"
                value={skill.endorsements.toString()}
                onSave={(value) => onUpdate(skill.id, 'endorsements', value)}
              />
            )}
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
};