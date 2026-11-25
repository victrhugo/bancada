import React from 'react';
import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: { absolute: 'Roadmap DevOps Júnior - Comece Sua Jornada em DevOps' },
  description:
    'Um roadmap amigável para iniciantes, criado especialmente para futuros engenheiros de DevOps. Uma trilha de aprendizado clara e focada, sem sobrecarga.',
  alternates: {
    canonical: '/roadmap/junior',
  },
  openGraph: {
    title: 'Roadmap DevOps Júnior - Comece Sua Jornada em DevOps',
    description:
      'Um roadmap amigável para iniciantes, criado especialmente para futuros engenheiros de DevOps. Uma trilha de aprendizado clara e focada, sem sobrecarga.',
    url: `${SITE_URL}/roadmap/junior`,
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/images/junior-roadmap-og.png`,
        width: 1200,
        height: 630,
        alt: 'Roadmap DevOps Júnior - Comece Sua Jornada',
      },
    ],
  },
  twitter: {
    title: 'Roadmap DevOps Júnior - Comece Sua Jornada em DevOps',
    description:
      'Um roadmap amigável para iniciantes, criado especialmente para futuros engenheiros de DevOps. Uma trilha de aprendizado clara e focada, sem sobrecarga.',
    card: 'summary_large_image',
    images: [
      {
        url: `${SITE_URL}/images/junior-roadmap-og.png`,
        width: 1200,
        height: 630,
        alt: 'Roadmap DevOps Júnior - Comece Sua Jornada',
      },
    ],
  },
  keywords: [
    'Junior DevOps',
    'DevOps for Beginners',
    'Entry Level DevOps',
    'DevOps Career Start',
    'Learning DevOps',
    'DevOps First Steps',
    'Beginner DevOps Roadmap',
    'Getting Started with DevOps',
  ],
  authors: [
    {
      name: 'Bancada',
      url: SITE_URL,
    },
  ],
};

export default function JuniorRoadmapLayout({ children }: { children: React.ReactNode }) {
  return children;
}
