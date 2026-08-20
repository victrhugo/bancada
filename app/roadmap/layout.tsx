import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Roadmap DevOps - Seu Caminho para a Maestria em DevOps' },
  description:
    'Trilha de aprendizado estratégica para futuros engenheiros de DevOps. Descubra as habilidades, tecnologias e a progressão de carreira do nível iniciante ao avançado.',
  alternates: {
    canonical: '/roadmap',
  },
  openGraph: {
    title: 'Roadmap DevOps - Seu Caminho para a Maestria em DevOps',
    description:
      'Trilha de aprendizado estratégica para futuros engenheiros de DevOps. Descubra as habilidades, tecnologias e a progressão de carreira do nível iniciante ao avançado.',
    url: 'https://bancada.app/roadmap',
    type: 'website',
    images: [
      {
        url: 'https://bancada.app/images/roadmap.png',
        width: 1200,
        height: 630,
        alt: 'Roadmap de Aprendizado DevOps - Trilha de Habilidades e Tecnologias',
      },
    ],
  },
  twitter: {
    title: 'Roadmap DevOps - Seu Caminho para a Maestria em DevOps',
    description:
      'Trilha de aprendizado estratégica para futuros engenheiros de DevOps. Descubra as habilidades, tecnologias e a progressão de carreira do nível iniciante ao avançado.',
    card: 'summary_large_image',
    images: [
      {
        url: 'https://bancada.app/images/roadmap.png',
        width: 1200,
        height: 630,
        alt: 'Roadmap de Aprendizado DevOps - Trilha de Habilidades e Tecnologias',
      },
    ],
  },
  keywords: [
    'DevOps Roadmap',
    'DevOps Career Path',
    'DevOps Skills Map',
    'DevOps Learning Path',
    'DevOps Engineer Skills',
    'DevOps Technology Stack',
    'DevOps Career Progression',
    'Infrastructure as Code',
    'Cloud Native Technologies',
    'DevOps Fundamentals',
    'Container Orchestration',
    'CI/CD Pipeline',
  ],
  authors: [
    {
      name: 'Bancada',
      url: 'https://bancada.app',
    },
  ],
};

const stagesJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Roadmap de Aprendizado DevOps',
  description:
    'Trilha de aprendizado por etapas para engenheiros de DevOps, dos fundamentos até habilidades avançadas de plataforma.',
  itemListElement: [
    'Fundamentos',
    'Infraestrutura como Código',
    'Conteinerização e Orquestração',
    'Pipelines de CI/CD',
    'Plataformas de Nuvem',
    'Monitoramento e Observabilidade',
    'Segurança e Conformidade',
    'Gerenciamento de Banco de Dados',
    'Aprendizado Contínuo',
  ].map((name, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name,
    url: 'https://bancada.app/roadmap',
  })),
};

export default function RoadmapLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(stagesJsonLd) }}
      />
      {children}
    </>
  );
}
