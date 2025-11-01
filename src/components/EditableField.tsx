import { Box, IconButton, Input, Text, Textarea, useDisclosure } from '@chakra-ui/react';
import { EditIcon } from '@chakra-ui/icons';
import { useState } from 'react';

interface EditableFieldProps {
  value: string;
  label: string;
  isMultiline?: boolean;
  onSave: (newValue: string) => void;
}

export const EditableField = ({ value, label, isMultiline = false, onSave }: EditableFieldProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onSave(editValue);
    onClose();
  };

  return (
    <Box position="relative" mb={2}>
      {isOpen ? (
        <>
          {isMultiline ? (
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              autoFocus
            />
          ) : (
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              autoFocus
            />
          )}
        </>
      ) : (
        <Box display="flex" alignItems="center">
          <Text fontWeight={label ? 'bold' : 'normal'}>
            {label && `${label}: `}{value}
          </Text>
          <IconButton
            aria-label="Edit"
            icon={<EditIcon />}
            size="sm"
            variant="ghost"
            ml={2}
            onClick={onOpen}
          />
        </Box>
      )}
    </Box>
  );
};