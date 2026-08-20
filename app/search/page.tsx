import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SearchPageClient } from '@/components/search-page-client';

export const metadata: Metadata = {
  title: 'Busca',
  // The results are client-rendered, so there is nothing here for a crawler to
  // index. follow is kept so the links out of it still pass through.
  robots: { index: false, follow: true },
  description: 'Busque exercícios, quizzes, flashcards, checklists, jogos e perguntas de entrevista sobre Docker, Kubernetes, AWS, CI/CD e mais.',
  alternates: {
    canonical: '/search',
  },
  openGraph: {
    title: 'Busca | Bancada',
    description: 'Busque exercícios, quizzes, flashcards, checklists, jogos e perguntas de entrevista sobre Docker, Kubernetes, AWS, CI/CD e mais.',
    type: 'website',
    url: '/search',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Busca no Bancada',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Busca | Bancada',
    description: 'Busque exercícios, quizzes, flashcards, checklists, jogos e perguntas de entrevista sobre Docker, Kubernetes, AWS, CI/CD e mais.',
    images: ['/og-image.png'],
  },
};

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-10 bg-muted rounded w-full max-w-xl mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    }>
      <SearchPageClient />
    </Suspense>
  );
}
