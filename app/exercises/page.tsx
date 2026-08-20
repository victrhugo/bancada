import { ExercisesList } from '@/components/exercises-list';
import { getAllExercises, getExerciseStats } from '@/lib/exercises';
import { Target } from 'lucide-react';
import type { Metadata } from 'next';
import { PageHero } from '@/components/page-hero';

export const metadata: Metadata = {
  title: 'Exercícios e Laboratórios de DevOps - Aprendizado na Prática',
  description:
    'Pratique habilidades reais de DevOps com nossa coleção completa de exercícios práticos e laboratórios. De Docker a Kubernetes, CI/CD a Infrastructure as Code.',
  alternates: {
    canonical: '/exercises',
  },
  openGraph: {
    title: 'Exercícios e Laboratórios de DevOps - Aprendizado na Prática | Bancada',
    description:
      'Pratique habilidades reais de DevOps com nossa coleção completa de exercícios práticos e laboratórios. De Docker a Kubernetes, CI/CD a Infrastructure as Code.',
    url: '/exercises',
    type: 'website',
    images: [
      {
        url: 'https://bancada.app/images/exercises-og-image.png',
        width: 1200,
        height: 630,
        alt: 'Exercícios e Laboratórios de DevOps',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Exercícios e Laboratórios de DevOps - Aprendizado na Prática | Bancada',
    description:
      'Pratique habilidades reais de DevOps com nossa coleção completa de exercícios práticos e laboratórios.',
    images: ['https://bancada.app/images/exercises-og-image.png'],
  },
};

export default async function ExercisesPage() {
  const [exercises, stats] = await Promise.all([getAllExercises(), getExerciseStats()]);

  return (
    <div className="min-h-screen">
      <PageHero
        title="Aprenda DevOps Através de Exercícios Reais"
        accentWord="Reais"
        description="Fortaleça sua expertise em DevOps com exercícios práticos criados para simular ambientes reais. Desenvolva habilidades através da prática, não da teoria."
        icon={Target}
        breadcrumbs={[{ label: 'Exercícios' }]}
        stats={[
          { label: 'exercícios', value: stats.total },
          { label: 'min. tempo médio', value: Math.round(stats.averageTime) },
        ]}
      />

      <div className="py-8 container mx-auto px-4">
        <ExercisesList exercises={exercises} />
      </div>
    </div>
  );
}
