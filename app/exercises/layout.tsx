import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Exercícios e Laboratórios de DevOps',
  description:
    'Pratique habilidades reais de DevOps com nossa coleção completa de exercícios práticos e laboratórios. De Docker a Kubernetes, CI/CD a Infrastructure as Code.',
  openGraph: {
    title: 'Exercícios e Laboratórios de DevOps - Aprendizado na Prática | Bancada',
    description:
      'Pratique habilidades reais de DevOps com nossa coleção completa de exercícios práticos e laboratórios. De Docker a Kubernetes, CI/CD a Infrastructure as Code.',
    url: 'https://bancada.app/exercises',
    images: [
      {
        url: '/images/exercises-og-image.png',
        width: 1200,
        height: 630,
        alt: 'Exercícios e Laboratórios de DevOps - Aprendizado na Prática',
      },
    ],
  },
  twitter: {
    title: 'Exercícios e Laboratórios de DevOps - Aprendizado na Prática | Bancada',
    description:
      'Pratique habilidades reais de DevOps com nossa coleção completa de exercícios práticos e laboratórios.',
    card: 'summary_large_image',
    images: [
      {
        url: '/images/exercises-og-image.png',
        width: 1200,
        height: 630,
        alt: 'Exercícios e Laboratórios de DevOps - Aprendizado na Prática',
      },
    ],
  },
  keywords: [
    'Exercícios de DevOps',
    'Laboratórios Práticos',
    'Exercícios de Docker',
    'Laboratórios de Kubernetes',
    'Prática de CI/CD',
    'Infrastructure as Code',
    'Aprendizado de DevOps',
    'Tutoriais Interativos',
    'Habilidades de DevOps',
    'Exercícios Técnicos',
    'Prática de DevOps',
    'Cenários Reais',
  ],
  authors: [
    {
      name: 'Bancada',
      url: 'https://bancada.app',
    },
  ],
};

export default function ExercisesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
