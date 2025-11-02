import type { AppProps } from 'next/app';
import { AppWrapper } from '../src/components/AppWrapper';
import { ErrorBoundary } from '../components/ErrorBoundary';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <AppWrapper>
        <Component {...pageProps} />
      </AppWrapper>
    </ErrorBoundary>
  );
}