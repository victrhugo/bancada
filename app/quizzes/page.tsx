import type { Metadata } from 'next';
import { QuizManager } from '@/components/games/quiz-manager';
import { getQuizMetadata } from '@/lib/quiz-loader';
import { PageHero } from '@/components/page-hero';
import { Button } from '@/components/ui/button';
import {
  Trophy,
  Target,
  Sparkles,
  BookOpen,
  ArrowRight,
  Activity,
  Zap,
  GitFork,
} from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Quizzes e Testes de DevOps',
  description:
    'Quizzes interativos para testar e aprimorar seus conhecimentos de DevOps em diversas tecnologias e práticas.',
  alternates: {
    canonical: '/quizzes',
  },
  openGraph: {
    title: 'Quizzes e Testes de DevOps - Bancada',
    description:
      'Teste seus conhecimentos de DevOps com quizzes interativos sobre Git, Docker, Kubernetes, Terraform e muito mais.',
    type: 'website',
    url: '/quizzes',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Quizzes de DevOps',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Quizzes e Testes de DevOps - Bancada',
    description:
      'Teste seus conhecimentos de DevOps com quizzes interativos sobre Git, Docker, Kubernetes, Terraform e muito mais.',
    images: ['/og-image.png'],
  },
};

export default async function QuizzesPage() {
  const quizzes = await getQuizMetadata();

  return (
    <div className="min-h-screen">
      <PageHero
        title="Desafie-se e Evolua Suas Habilidades"
        accentWord="Evolua Suas Habilidades"
        description="Domine DevOps com quizzes interativos criados por especialistas do setor. Teste seus conhecimentos, acompanhe seu progresso e conquiste medalhas à medida que avança."
        icon={Trophy}
        breadcrumbs={[{ label: 'Quizzes' }]}
        stats={[{ label: 'quizzes', value: quizzes.length }]}
      />

      {/* Quizzes Section */}
      {quizzes.length > 0 ? (
        <section className="py-8 container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Quizzes Disponíveis</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Escolha entre nossa coleção de quizzes de DevOps criados para testar seu conhecimento
              prático e ajudar você a identificar áreas para desenvolver suas habilidades.
            </p>
          </div>

          <QuizManager quizzes={quizzes} className="mb-16" />
        </section>
      ) : (
        <section className="py-16 container mx-auto px-4">
          <div className="text-center">
            <BookOpen className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-4">Nenhum Quiz Disponível</h2>
            <p className="text-muted-foreground mb-8">
              Estamos trabalhando para adicionar mais quizzes. Volte em breve!
            </p>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Por Que Fazer Nossos Quizzes?</h2>
            <p className="text-muted-foreground">
              Nossos quizzes foram criados para proporcionar experiências de aprendizado prático
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm">
              <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-linear-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Avaliação de Habilidades</h3>
              <p className="text-muted-foreground">
                Avalie seu conhecimento atual e identifique áreas de melhoria em diferentes
                tecnologias de DevOps.
              </p>
            </div>

            <div className="text-center p-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm">
              <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Aprendizado Interativo</h3>
              <p className="text-muted-foreground">
                Receba feedback imediato sobre suas respostas com explicações detalhadas para ajudar
                você a aprender com os erros.
              </p>
            </div>

            <div className="text-center p-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm">
              <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-linear-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Acompanhe seu Progresso</h3>
              <p className="text-muted-foreground">
                Monitore sua evolução ao longo do tempo e veja como você se compara a outros
                profissionais de DevOps.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 container mx-auto px-4">
        <div className="bg-primary/5 backdrop-blur-sm border border-border/50 rounded-md p-8 md:p-12">
          <div className="max-w-3xl mx-auto text-center">
            <Sparkles className="h-12 w-12 mx-auto mb-6 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Quer contribuir com um quiz?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Ajude-nos a expandir nossa coleção de quizzes contribuindo com perguntas sobre
              tecnologias que você domina. Compartilhe seu conhecimento com a comunidade DevOps!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg">
                <GitFork className="mr-2 h-4 w-4" />
                <Link href="https://github.com/The-DevOps-Daily/devops-daily/issues/new/choose">
                  Contribuir com Perguntas
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/games">
                  <Zap className="mr-2 h-4 w-4" />
                  Experimente os Jogos Interativos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
