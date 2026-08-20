import { Metadata } from 'next';
import Link from 'next/link';
import { Briefcase, ArrowRight, Users, TrendingUp, Award, Shuffle, RotateCcw } from 'lucide-react';
import {
  interviewQuestions,
  getQuestionCountsByTier,
  getAllTopics,
} from '@/content/interview-questions';
import { PageHero } from '@/components/page-hero';
import { QuestionBrowser } from '@/components/interview-questions/question-browser';
import type { ExperienceTier } from '@/lib/interview-utils';

export const metadata: Metadata = {
  title: 'Perguntas de Entrevista DevOps | Bancada',
  description:
    'Pratique mais de 110 perguntas reais de entrevista de DevOps com respostas ocultas, exemplos de código e explicações. Busque por tópico, treine por nível de experiência e compartilhe qualquer pergunta. Kubernetes, Terraform, CI/CD, GitOps, SRE e muito mais.',
  keywords: [
    'perguntas de entrevista devops',
    'entrevista kubernetes',
    'entrevista docker',
    'entrevista terraform',
    'entrevista cicd',
    'entrevista aws',
  ],
  authors: [{ name: 'Bancada' }],
  creator: 'Bancada',
  publisher: 'Bancada',
  applicationName: 'Bancada',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: '/interview-questions',
  },
  openGraph: {
    title: 'Perguntas de Entrevista DevOps - Bancada',
    description:
      'Pratique perguntas reais de entrevista de DevOps com respostas ocultas, exemplos de código e explicações. Busque por tópico, treine por nível e compartilhe qualquer pergunta.',
    type: 'website',
    url: '/interview-questions',
    siteName: 'Bancada',
    locale: 'pt_BR',
    images: [
      {
        url: '/images/interview-questions/interview-questions-og.png',
        width: 1200,
        height: 630,
        alt: 'Perguntas de Entrevista DevOps',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@TheDevOpsDaily',
    creator: '@TheDevOpsDaily',
    title: 'Perguntas de Entrevista DevOps - Bancada',
    description:
      'Pratique perguntas reais de entrevista de DevOps com respostas ocultas, exemplos de código e explicações.',
    images: ['/images/interview-questions/interview-questions-og.png'],
  },
};

const tierConfig = {
  junior: {
    title: 'Júnior',
    range: '0-2 anos',
    description: 'Linux, Git, fundamentos de Docker e CI/CD.',
    icon: Users,
    dot: 'bg-emerald-500',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  mid: {
    title: 'Pleno',
    range: '2-5 anos',
    description: 'Kubernetes, Terraform, monitoramento e arquitetura.',
    icon: TrendingUp,
    dot: 'bg-primary',
    iconColor: 'text-primary',
  },
  senior: {
    title: 'Sênior',
    range: '5+ anos',
    description: 'Design de sistemas, resposta a incidentes e liderança técnica.',
    icon: Award,
    dot: 'bg-violet-500',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
} as const;

export default function InterviewQuestionsPage() {
  const questionsByTier = getQuestionCountsByTier();
  const topics = getAllTopics();
  const tiers = ['junior', 'mid', 'senior'] as ExperienceTier[];

  return (
    <div className="min-h-screen">
      <PageHero
        icon={Briefcase}
        title="Perguntas de Entrevista DevOps"
        accentWord="Entrevista"
        description={`Pratique ${interviewQuestions.length} perguntas reais de entrevista com respostas ocultas. Pense em cada uma, revele a resposta modelo e compartilhe as mais difíceis.`}
        breadcrumbs={[{ label: 'Perguntas de Entrevista' }]}
        badge="Simulado de Entrevista"
        stats={[
          { label: 'perguntas', value: interviewQuestions.length },
          { label: 'tópicos', value: topics.length },
          { label: 'níveis', value: 3 },
        ]}
      />

      <div className="container mx-auto px-4 max-w-4xl py-10">
        {/* Browse by level — the first decision most people make */}
        <section className="mb-12">
          <p className="text-xs font-mono text-muted-foreground mb-3">// escolha seu nível</p>
          <div className="grid gap-px grid-cols-1 sm:grid-cols-3 bg-border border rounded-md overflow-hidden">
            {tiers.map((tier) => {
              const config = tierConfig[tier];
              const Icon = config.icon;
              const count = questionsByTier[tier] || 0;
              return (
                <Link
                  key={tier}
                  href={`/interview-questions/${tier}`}
                  className="group bg-card p-5 flex flex-col transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-center justify-between mb-4">
                    <Icon className={`w-5 h-5 ${config.iconColor}`} strokeWidth={1.5} />
                    <span className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/80 uppercase tracking-wider">
                      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                      {config.range}
                    </span>
                  </div>
                  <h3 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors">
                    {config.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed flex-1">
                    {config.description}
                  </p>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/60">
                    <span className="text-xs font-mono text-muted-foreground">
                      {count} perguntas
                    </span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground transition-all group-hover:text-primary group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Browse / search all questions */}
        <section className="mb-12">
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="text-xs font-mono text-muted-foreground">
              // ver todas as perguntas
            </p>
            <div className="flex items-center gap-3 text-xs font-mono">
              <Link
                href="/interview-questions/practice?random=1"
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary"
              >
                <Shuffle className="w-3.5 h-3.5" strokeWidth={1.5} />
                aleatório
              </Link>
              <Link
                href="/interview-questions/practice?mode=review"
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary"
              >
                <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
                pilha de revisão
              </Link>
            </div>
          </div>
          <QuestionBrowser questions={interviewQuestions} />
        </section>

        {/* Browse by topic */}
        <section className="mb-12">
          <p className="text-xs font-mono text-muted-foreground mb-3">// ver por tópico</p>
          <div className="flex flex-wrap gap-2">
            {topics.map((topic) => (
              <Link
                key={topic.slug}
                href={`/interview-questions/topic/${topic.slug}`}
                className="inline-flex items-center gap-1.5 rounded-md border bg-card px-2.5 py-1 text-xs transition-colors hover:border-primary/40 hover:text-primary"
              >
                <span>{topic.name}</span>
                <span className="font-mono text-muted-foreground/70">{topic.count}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Cross-links */}
        <section className="rounded-md border bg-muted/20 p-5 text-center">
          <p className="text-sm text-muted-foreground">
            Prefere avaliações com pontuação? Experimente os{' '}
            <Link href="/quizzes" className="text-primary hover:underline font-medium">
              quizzes de DevOps
            </Link>{' '}
            ou treine conceitos com{' '}
            <Link href="/flashcards" className="text-primary hover:underline font-medium">
              flashcards
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
