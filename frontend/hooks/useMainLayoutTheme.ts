import { useColorModeValue } from '@chakra-ui/react';

export const useMainLayoutTheme = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const highlightBg = useColorModeValue('blue.50', 'blue.900');
  const highlightColor = useColorModeValue('blue.600', 'blue.200');

  return {
    bgColor,
    borderColor,
    cardBg,
    textColor,
    highlightBg,
    highlightColor,
  };
};