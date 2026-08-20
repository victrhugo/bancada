import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Roadmap DevSecOps - Jornada DevOps com Foco em Segurança' },
  description:
    'Um roadmap completo para integrar segurança às suas práticas de DevOps. Aprenda a construir pipelines seguros, implementar automação de segurança e trazer a segurança para as etapas iniciais do desenvolvimento.',
  alternates: {
    canonical: '/roadmap/devsecops',
  },
  openGraph: {
    title: 'Roadmap DevSecOps - Jornada DevOps com Foco em Segurança',
    description:
      'Um roadmap completo para integrar segurança às suas práticas de DevOps. Aprenda a construir pipelines seguros, implementar automação de segurança e trazer a segurança para as etapas iniciais do desenvolvimento.',
    url: 'https://bancada.app/roadmap/devsecops',
    type: 'website',
    images: [
      {
        url: 'https://bancada.app/images/devsecops-roadmap-og.png',
        width: 1200,
        height: 630,
        alt: 'Roadmap DevSecOps - DevOps com Foco em Segurança',
      },
    ],
  },
  twitter: {
    title: 'Roadmap DevSecOps - Jornada DevOps com Foco em Segurança',
    description:
      'Um roadmap completo para integrar segurança às suas práticas de DevOps. Aprenda a construir pipelines seguros, implementar automação de segurança e trazer a segurança para as etapas iniciais do desenvolvimento.',
    card: 'summary_large_image',
    images: [
      {
        url: 'https://bancada.app/images/devsecops-roadmap-og.png',
        width: 1200,
        height: 630,
        alt: 'Roadmap DevSecOps - DevOps com Foco em Segurança',
      },
    ],
  },
  keywords: [
    'DevSecOps',
    'Security DevOps',
    'Shift Left Security',
    'Secure CI/CD',
    'Application Security',
    'Infrastructure Security',
    'Security Automation',
    'Container Security',
    'Cloud Security',
    'SAST DAST',
  ],
  authors: [
    {
      name: 'Bancada',
      url: 'https://bancada.app',
    },
  ],
};

export default function DevSecOpsRoadmapLayout({ children }: { children: React.ReactNode }) {
  return children;
}
