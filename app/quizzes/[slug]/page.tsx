import type { Metadata } from 'next';
import { Breadcrumb } from '@/components/breadcrumb';
import { BreadcrumbSchema, LearningResourceSchema } from '@/components/schema-markup';
import GenericQuiz from '@/components/games/generic-quiz';
import { getQuizById, getAllQuizzes, getRelatedQuizzes } from '@/lib/quiz-loader';
import { truncateMetaDescription } from '@/lib/meta-description';
import { detailPageMetadata } from '@/lib/metadata-utils';
import { getSocialImagePath } from '@/lib/image-utils';
import { ReportIssue } from '@/components/report-issue';
import { Facebook, Linkedin, Twitter } from '@/components/icons/social-icons';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { RelatedQuizzes } from '@/components/related-quizzes';
import { RelatedAcrossTypes } from '@/components/related-across-types';
import { getRelatedAcrossTypes } from '@/lib/related-cross-type';
import { CarbonAds } from '@/components/carbon-ads';

export const dynamicParams = false;

export async function generateStaticParams() {
  const quizzes = await getAllQuizzes();
  return quizzes.map((quiz) => ({
    slug: quiz.id,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const quizConfig = await getQuizById(slug);

  if (!quizConfig) {
    return {};
  }

  return detailPageMetadata({
    path: `/quizzes/${slug}`,
    title: `${quizConfig.title} - Aprenda ${quizConfig.category}`,
    socialTitle: `${quizConfig.title} - Bancada`,
    description: truncateMetaDescription(quizConfig.description),
    image: getSocialImagePath(slug, 'quizzes'),
    imageAlt: quizConfig.title,
    ogType: 'website',
  });
}

export default async function QuizPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const quizConfig = await getQuizById(slug);

  if (!quizConfig) {
    notFound();
  }

  const relatedQuizzes = await getRelatedQuizzes(slug, quizConfig.category, 3);

  const crossTypeRelated = await getRelatedAcrossTypes({
    current: {
      type: 'quiz',
      id: slug,
      category: quizConfig.category,
      tags: (quizConfig.metadata?.tags || []).map((t) => String(t)),
    },
    limit: 3,
  });

  // Breadcrumb items
  const breadcrumbItems = [
    { label: 'Quizzes', href: '/quizzes' },
    { label: quizConfig.title, href: `/quizzes/${slug}`, isCurrent: true },
  ];

  const schemaItems = [
    { name: 'Início', url: '/' },
    { name: 'Quizzes', url: '/quizzes' },
    { name: quizConfig.title, url: `/quizzes/${slug}` },
  ];

  return (
    <>
      <BreadcrumbSchema items={schemaItems} />
      <LearningResourceSchema
        title={quizConfig.title}
        description={quizConfig.description}
        estimatedTime={quizConfig.metadata.estimatedTime}
        technologies={(quizConfig.metadata?.tags || []).map((t) => String(t))}
        url={`/quizzes/${slug}`}
        learningResourceType="quiz"
      />
      <div className="container px-4 py-8 mx-auto">
        <Breadcrumb items={breadcrumbItems} />

        <div className="max-w-6xl mx-auto">
          <GenericQuiz quizConfig={quizConfig} />

          {/* Quiz Description Section */}
          <div className="max-w-4xl mx-auto mt-12">
            <div className="prose dark:prose-invert max-w-none">
              <h1 className="mb-4 text-3xl font-bold">{quizConfig.title} - Visão Geral do Quiz</h1>
              <p className="mb-6 text-lg leading-relaxed">{quizConfig.description}</p>

              {/* Quiz Stats */}
              <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-3 not-prose">
                <div className="p-4 border rounded-lg bg-card">
                  <h3 className="text-sm font-semibold tracking-wide text-muted-foreground">
                    Tempo Estimado
                  </h3>
                  <p className="text-xl font-bold">{quizConfig.metadata.estimatedTime}</p>
                </div>
                <div className="p-4 border rounded-lg bg-card">
                  <h3 className="text-sm font-semibold tracking-wide text-muted-foreground">
                    Pontos Totais
                  </h3>
                  <p className="text-xl font-bold">{quizConfig.totalPoints}</p>
                </div>
                <div className="p-4 border rounded-lg bg-card">
                  <h3 className="text-sm font-semibold tracking-wide text-muted-foreground">
                    Perguntas
                  </h3>
                  <p className="text-xl font-bold">{quizConfig.questions.length}</p>
                </div>
              </div>

              {/* Difficulty Breakdown */}
              {quizConfig.metadata.difficultyLevels && (
                <div className="p-6 mb-8 border rounded-lg bg-muted/30">
                  <h2 className="mb-4 text-xl font-semibold">Distribuição de Dificuldade</h2>
                  <div className="flex flex-wrap gap-4">
                    {quizConfig.metadata.difficultyLevels.beginner > 0 && (
                      <span className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-full dark:bg-green-900/30 dark:text-green-300">
                        {quizConfig.metadata.difficultyLevels.beginner} Iniciante
                      </span>
                    )}
                    {quizConfig.metadata.difficultyLevels.intermediate > 0 && (
                      <span className="px-3 py-1 text-sm font-medium text-yellow-700 bg-yellow-100 rounded-full dark:bg-yellow-900/30 dark:text-yellow-300">
                        {quizConfig.metadata.difficultyLevels.intermediate} Intermediário
                      </span>
                    )}
                    {quizConfig.metadata.difficultyLevels.advanced > 0 && (
                      <span className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-full dark:bg-red-900/30 dark:text-red-300">
                        {quizConfig.metadata.difficultyLevels.advanced} Avançado
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Category-specific tips based on quiz configuration */}
              {quizConfig.category && (
                <div
                  className={`p-4 mt-6 border rounded-lg bg-${quizConfig.theme?.primaryColor || 'indigo'}-50 dark:bg-${quizConfig.theme?.primaryColor || 'indigo'}-950/20 border-${quizConfig.theme?.primaryColor || 'indigo'}-500/20`}
                >
                  <h2 className="mb-2 text-xl font-semibold">💡 Dica de {quizConfig.category}</h2>
                  <p className="text-sm">{getQuizTip(quizConfig.category)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Report Issue Component */}
          <div className="max-w-4xl mx-auto mt-8">
            <ReportIssue title={quizConfig.title} type="quiz" slug={slug} variant="compact" />
          </div>

          {/* Back to quizzes button */}
          <div className="max-w-4xl mx-auto mt-8">
            <Button asChild variant="outline">
              <Link href="/quizzes">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para Quizzes
              </Link>
            </Button>
          </div>

          {/* Inline ad slot at the natural break before the cross-link block. */}
          <div className="max-w-2xl mx-auto mt-12">
            <CarbonAds />
          </div>

          {/* Related Quizzes */}
          {relatedQuizzes.length > 0 && (
            <div className="max-w-4xl mx-auto mt-12">
              <RelatedQuizzes
                quizzes={relatedQuizzes.map((q) => ({
                  title: q.title,
                  slug: q.id,
                  date: q.metadata.createdDate || '',
                  readingTime: q.metadata.estimatedTime,
                }))}
                title="Quizzes Relacionados"
                className=""
              />
            </div>
          )}

          {crossTypeRelated.length > 0 && (
            <div className="max-w-4xl mx-auto mt-12">
              <RelatedAcrossTypes items={crossTypeRelated} />
            </div>
          )}

          {/* Social Share Section */}
          <div className="max-w-4xl mx-auto mt-8">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
              <div>
                <h2 className="font-semibold">Compartilhar Este Quiz</h2>
                <p className="text-sm text-muted-foreground">
                  Desafie seus colegas e amigos!
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" asChild>
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                      `https://bancada.app/quizzes/${slug}`
                    )}&text=${encodeURIComponent(
                      `Acabei de fazer o quiz ${quizConfig.title} na Bancada! Teste seus conhecimentos de ${quizConfig.category}:`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Twitter className="w-4 h-4" />
                  </a>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                      `https://bancada.app/quizzes/${slug}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                      `https://bancada.app/quizzes/${slug}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Helper function to provide category-specific tips
function getQuizTip(category: string): string {
  const tips: Record<string, string> = {
    Kubernetes:
      'O Kubernetes pode parecer complexo, mas cada conceito se constrói sobre o anterior. Comece entendendo os pods (a unidade atômica), depois services (rede), deployments (escalonamento) e avance gradualmente para tópicos mais avançados. O segredo é entender o "porquê" por trás de cada decisão de design - o Kubernetes foi criado para resolver problemas reais em escala.',
    Docker:
      'O Docker é sobre entender camadas e otimização. Cada comando no seu Dockerfile cria uma nova camada, então a ordem importa para o cache. Comece pelos arquivos que mudam com menos frequência (como o package.json) e depois adicione seu código. Sempre pense no tamanho final da imagem e na segurança - quanto menor e mais segura, melhor.',
    Terraform:
      'Infraestrutura como código é sobre pensar de forma declarativa. Em vez de "como eu crio isso?", pense "qual deve ser o estado final?". O Terraform descobre os passos necessários. Sempre rode o plan antes do apply, use módulos para reutilização e lembre-se de que o state é tudo - proteja-o!',
    Git: 'O Git é, no fundo, sobre entender o grafo de commits e como as referências se movem. Aprenda estratégias de branching, aprenda a reescrever o histórico com segurança (quando apropriado) e lembre-se de que o Git é uma ferramenta de colaboração - mensagens de commit claras e commits lógicos ajudam seus colegas de equipe a entender suas mudanças.',
    default:
      'A prática leva à perfeição! Reserve um tempo para entender cada pergunta e leia as explicações com atenção. Cenários do mundo real geralmente exigem combinar múltiplos conceitos, então pense em como essas ferramentas funcionam juntas em ambientes de produção.',
  };

  return tips[category] || tips.default;
}
