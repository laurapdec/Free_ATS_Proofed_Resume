import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { Navigation } from './Navigation';

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

export function AppWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider theme={theme}>
      <Navigation />
      {children}
    </ChakraProvider>
  );
}