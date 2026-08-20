import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Roadmaps de DevOps - Trilhas de Aprendizado para Todos os Níveis',
  description:
    'Explore trilhas estruturadas de aprendizado em DevOps. De engenheiros juniores a especialistas em segurança, encontre o roadmap ideal para seus objetivos de carreira.',
  alternates: {
    canonical: '/roadmaps',
  },
  openGraph: {
    title: 'Roadmaps de DevOps - Trilhas de Aprendizado para Todos os Níveis',
    description:
      'Explore trilhas estruturadas de aprendizado em DevOps. De engenheiros juniores a especialistas em segurança, encontre o roadmap ideal para seus objetivos de carreira.',
    url: 'https://bancada.app/roadmaps',
    type: 'website',
    images: [
      {
        url: 'https://bancada.app/images/roadmaps-og.png',
        width: 1200,
        height: 630,
        alt: 'Roadmaps de DevOps - Trilhas de Aprendizado',
      },
    ],
  },
  twitter: {
    title: 'Roadmaps de DevOps - Trilhas de Aprendizado para Todos os Níveis',
    description:
      'Explore trilhas estruturadas de aprendizado em DevOps. De engenheiros juniores a especialistas em segurança, encontre o roadmap ideal para seus objetivos de carreira.',
    card: 'summary_large_image',
    images: [
      {
        url: 'https://bancada.app/images/roadmaps-og.png',
        width: 1200,
        height: 630,
        alt: 'Roadmaps de DevOps - Trilhas de Aprendizado',
      },
    ],
  },
  keywords: [
    'Roadmaps de DevOps',
    'Trilhas de Aprendizado DevOps',
    'DevOps Júnior',
    'DevSecOps',
    'Carreira em DevOps',
    'Aprender DevOps',
    'Habilidades DevOps',
  ],
};

export default function RoadmapsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
