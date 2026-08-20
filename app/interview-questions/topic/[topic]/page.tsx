import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Briefcase } from 'lucide-react';
import {
  getAllTopics,
  getTopicBySlug,
  getQuestionsByTopicSlug,
} from '@/content/interview-questions';
import { QuestionBrowser } from '@/components/interview-questions/question-browser';
import { PageHero } from '@/components/page-hero';
import { BreadcrumbSchema } from '@/components/schema-markup';

interface PageProps {
  params: Promise<{ topic: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllTopics().map((t) => ({ topic: t.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { topic: topicSlug } = await params;
  const topic = getTopicBySlug(topicSlug);

  if (!topic) {
    return { title: 'Não encontrado' };
  }

  const title = `Perguntas de Entrevista de ${topic.name}`;
  const description = `${topic.count} perguntas de entrevista DevOps sobre ${topic.name} com respostas ocultas, exemplos de código e explicações, dos níveis júnior, pleno e sênior.`;

  return {
    title: { absolute: `${title} | Bancada` },
    description,
    alternates: {
      canonical: `/interview-questions/topic/${topic.slug}`,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `/interview-questions/topic/${topic.slug}`,
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },
  };
}

export default async function TopicPage({ params }: PageProps) {
  const { topic: topicSlug } = await params;
  const topic = getTopicBySlug(topicSlug);

  if (!topic) {
    notFound();
  }

  const questions = getQuestionsByTopicSlug(topic.slug);

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Início', url: '/' },
          { name: 'Perguntas de Entrevista', url: '/interview-questions' },
          { name: topic.name, url: `/interview-questions/topic/${topic.slug}` },
        ]}
      />
      <PageHero
        title={`Perguntas de Entrevista de ${topic.name}`}
        description={`Pratique ${topic.count} perguntas de entrevista de ${topic.name} em todos os níveis de experiência. Pense em cada uma, depois revele a resposta modelo.`}
        icon={Briefcase}
        breadcrumbs={[
          { label: 'Perguntas de Entrevista', href: '/interview-questions' },
          { label: topic.name },
        ]}
        stats={[{ label: 'perguntas', value: topic.count }]}
      />

      <div className="container mx-auto px-4 max-w-4xl py-10">
        <QuestionBrowser questions={questions} lockedTopicSlug={topic.slug} />
      </div>
    </>
  );
}
