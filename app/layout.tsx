import type React from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ThemeProvider } from '@/components/theme-provider';
import { OrganizationSchema, WebsiteSchema } from '@/components/schema-markup';
import { CookieBanner } from '@/components/cookie-banner';
import { PWAInstaller } from '@/components/pwa-installer';
import { SkipToContent } from '@/components/skip-to-content';
import { SiteAnalytics } from '@/components/site-analytics';
import { DeferredSiteExtras } from '@/components/deferred-site-extras';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Optimize font loading
  variable: '--font-inter',
});

// Define viewport metadata separately for better type checking and organization
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export const metadata: Metadata = {
  title: {
    default: 'Bancada - Pratique DevOps com exercícios, quizzes e simuladores',
    template: '%s | Bancada',
  },
  description:
    'Aprenda DevOps na prática. Exercícios, quizzes, flashcards, checklists e simuladores interativos sobre Docker, Kubernetes, Terraform, CI/CD e mais.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://bancada.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: '/',
    siteName: 'Bancada',
    title: 'Bancada - Pratique DevOps com exercícios, quizzes e simuladores',
    description:
      'Aprenda DevOps na prática. Exercícios, quizzes, flashcards, checklists e simuladores interativos.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Bancada',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bancada - Pratique DevOps com exercícios, quizzes e simuladores',
    description:
      'Aprenda DevOps na prática. Exercícios, quizzes, flashcards, checklists e simuladores interativos.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  generator: 'Next.js',
  applicationName: 'Bancada',
  referrer: 'origin-when-cross-origin',
  keywords: [
    'DevOps',
    'CI/CD',
    'Cloud',
    'Kubernetes',
    'Docker',
    'Exercícios',
    'Quizzes',
    'Infrastructure as Code',
  ],
  authors: [{ name: 'Bancada' }],
  category: 'Technology',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/site.webmanifest',
  verification: {
    // TODO: Add verification codes when ready:
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
  other: {
    'facebook-domain-verification': 'j9iuktnx8kdm881pb70zvbkjept48t',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <OrganizationSchema />
        <WebsiteSchema />
      </head>
      <body
        className={`${inter.className} min-h-screen flex flex-col bg-background text-foreground antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SkipToContent />
          <Header />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
          <CookieBanner />
          <PWAInstaller />
          <SiteAnalytics />
          <DeferredSiteExtras />
        </ThemeProvider>
      </body>
    </html>
  );
}
