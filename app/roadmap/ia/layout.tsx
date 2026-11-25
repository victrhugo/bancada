import React from 'react';
import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site';

const TITLE = 'Roadmap de Engenharia de IA - LLMs, RAG, Agentes e Produção';
const DESCRIPTION =
  'Um roadmap prático em português para construir produtos com IA generativa: fundamentos de LLMs, prompt engineering, embeddings, RAG, avaliação, agentes com ferramentas, segurança, LGPD e custo.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: {
    canonical: '/roadmap/ia',
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/roadmap/ia`,
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/images/roadmaps-og.png`,
        width: 1200,
        height: 630,
        alt: 'Roadmap de Engenharia de IA',
      },
    ],
  },
  twitter: {
    title: TITLE,
    description: DESCRIPTION,
    card: 'summary_large_image',
    images: [`${SITE_URL}/images/roadmaps-og.png`],
  },
  keywords: [
    'Engenharia de IA',
    'LLM',
    'RAG',
    'Retrieval-Augmented Generation',
    'Embeddings',
    'pgvector',
    'Agentes de IA',
    'Prompt Engineering',
    'Avaliação de LLM',
    'Prompt Injection',
    'LGPD',
  ],
  authors: [
    {
      name: 'Bancada',
      url: SITE_URL,
    },
  ],
};

export default function AiRoadmapLayout({ children }: { children: React.ReactNode }) {
  return children;
}
