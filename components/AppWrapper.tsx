import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import type { ReactNode } from 'react';

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: 'gray.50',
      },
    },
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'blue',
      },
    },
  },
});

interface AppWrapperProps {
  children: ReactNode;
}

export function AppWrapper({ children }: AppWrapperProps) {
  return <ChakraProvider theme={theme}>{children}</ChakraProvider>;
}