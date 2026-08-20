import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getQuestionsByTier } from '@/content/interview-questions';
import { QuestionBrowser } from '@/components/interview-questions/question-browser';
import { PageHero } from '@/components/page-hero';
import { BreadcrumbSchema } from '@/components/schema-markup';
import { Briefcase } from 'lucide-react';
import type { ExperienceTier } from '@/lib/interview-utils';

const validTiers: ExperienceTier[] = ['junior', 'mid', 'senior'];

const tierDisplayLabels: Record<ExperienceTier, string> = {
  junior: 'Júnior',
  mid: 'Pleno',
  senior: 'Sênior',
};

const tierMeta = {
  junior: {
    title: 'Perguntas de Entrevista DevOps - Júnior',
    description:
      'Perguntas de entrevista DevOps para iniciantes, cobrindo Linux, Git, fundamentos de Docker e CI/CD para profissionais com 0-2 anos de experiência.',
  },
  mid: {
    title: 'Perguntas de Entrevista DevOps - Pleno',
    description:
      'Perguntas de entrevista DevOps de nível intermediário sobre Kubernetes, Terraform, monitoramento e arquitetura para profissionais com 2-5 anos de experiência.',
  },
  senior: {
    title: 'Perguntas de Entrevista DevOps - Sênior',
    description:
      'Perguntas de entrevista DevOps avançadas sobre design de sistemas, gestão de incidentes e liderança para profissionais com mais de 5 anos de experiência.',
  },
};

interface PageProps {
  params: Promise<{ tier: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tier } = await params;

  if (!validTiers.includes(tier as ExperienceTier)) {
    return { title: 'Não encontrado' };
  }

  const meta = tierMeta[tier as ExperienceTier];

  return {
    title: { absolute: meta.title },
    description: meta.description,
    alternates: {
      canonical: `/interview-questions/${tier}`,
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: 'website',
      url: `/interview-questions/${tier}`,
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: meta.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      images: ['/og-image.png'],
    },
  };
}

export function generateStaticParams() {
  return validTiers.map((tier) => ({ tier }));
}

export default async function TierPage({ params }: PageProps) {
  const { tier } = await params;

  if (!validTiers.includes(tier as ExperienceTier)) {
    notFound();
  }

  const questions = getQuestionsByTier(tier as ExperienceTier);
  const meta = tierMeta[tier as ExperienceTier];
  const tierLabel = tierDisplayLabels[tier as ExperienceTier];

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Início', url: '/' },
          { name: 'Perguntas de Entrevista', url: '/interview-questions' },
          { name: tierLabel, url: `/interview-questions/${tier}` },
        ]}
      />
      <PageHero
        title={`Prática de Entrevista: ${tierLabel}`}
        description={meta.description}
        icon={Briefcase}
        breadcrumbs={[
          { label: 'Perguntas de Entrevista', href: '/interview-questions' },
          { label: tierLabel },
        ]}
        stats={[{ label: 'perguntas', value: questions.length }]}
      />

      <div className="container mx-auto px-4 max-w-4xl py-10">
        <QuestionBrowser questions={questions} lockedTier={tier as ExperienceTier} />
      </div>
    </>
  );
}
