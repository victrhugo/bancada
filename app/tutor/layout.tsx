import React from 'react';
import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site';

const TITLE = 'Tutor com IA - Pergunte sobre DevOps, cloud e IA';
const DESCRIPTION =
  'Um tutor com RAG que responde em português usando o conteúdo da Bancada como base: busca híbrida (palavras-chave + embeddings), resposta gerada por LLM e citações para cada fonte.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: '/tutor' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/tutor`,
    type: 'website',
    images: [
      { url: `${SITE_URL}/images/roadmaps-og.png`, width: 1200, height: 630, alt: 'Tutor com IA' },
    ],
  },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function TutorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
