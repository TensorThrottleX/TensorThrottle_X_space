import type { AppProps } from 'next/app';
import Head from 'next/head';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Prism Engine</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <style dangerouslySetInnerHTML={{ __html: `
        body {
          margin: 0;
          padding: 0;
          background-color: #0d0f17;
          color: #fff;
          overflow-x: hidden;
        }
      `}} />
      <Component {...pageProps} />
    </>
  );
}
