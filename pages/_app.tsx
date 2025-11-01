import type { AppProps } from 'next/app';
import { AppWrapper } from '../src/components/AppWrapper';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AppWrapper>
      <Component {...pageProps} />
    </AppWrapper>
  );
}