import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import { SITE } from '@/lib/constants';
import V2Header from '@/components/v2/V2Header';
import V2Footer from '@/components/v2/V2Footer';
import MetaPixel from '@/components/MetaPixel';
import AnalyticsTracker from '@/components/AnalyticsTracker';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    'mercado libre',
    'ofertas',
    'afiliados',
    'argentina',
    'descuentos',
    'tecnología',
    'gadgets',
    'linktree',
  ],
  authors: [{ name: SITE.name }],
  creator: SITE.name,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: SITE.url,
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: SITE.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: SITE.twitterHandle,
    creator: SITE.twitterHandle,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: SITE.themeColor,
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE.url}/buscar?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html lang="es-AR" className={inter.variable}>
      <body className="min-h-screen flex flex-col font-sans">
        <MetaPixel />
        <Suspense fallback={null}>
          <AnalyticsTracker />
        </Suspense>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <V2Header />
        <main className="flex-1">{children}</main>
        <V2Footer />
      </body>
    </html>
  );
}
