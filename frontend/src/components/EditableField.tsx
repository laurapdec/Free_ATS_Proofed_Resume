import { Box, IconButton, Input, Text, Textarea, useDisclosure } from '@chakra-ui/react';
import { EditIcon } from '@chakra-ui/icons';
import { useState } from 'react';

interface EditableFieldProps {
  value: string;
  label: string;
  isMultiline?: boolean;
  onSave: (newValue: string) => void;
  textAlign?: string;
  fontSize?: string;
  fontWeight?: string;
  sx?: Record<string, any>;
}

export const EditableField = ({ 
  value, 
  label, 
  isMultiline = false, 
  onSave,
  textAlign,
  fontSize,
  fontWeight,
  sx = {}
}: EditableFieldProps) => {
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
        <Box display="flex" alignItems="center" justifyContent={textAlign === 'center' ? 'center' : 'flex-start'} width="100%">
          <Text 
            fontWeight={fontWeight || (label ? 'bold' : 'normal')}
            fontSize={fontSize}
            textAlign={textAlign as any}
            sx={sx}
          >
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