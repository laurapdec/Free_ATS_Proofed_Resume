import type { AppProps } from 'next/app';
import Head from 'next/head';
import { AppWrapper } from '../src/components/AppWrapper';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Analytics } from "@vercel/analytics/next";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <title>ATS Resume Builder</title>
      </Head>
      <AppWrapper>
        <Component {...pageProps} />
      </AppWrapper>
      <Analytics />
    </ErrorBoundary>
  );
}