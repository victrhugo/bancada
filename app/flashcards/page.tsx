import type { Metadata } from 'next'
import { getAllFlashCardSets } from '@/lib/flashcard-loader'
import { PageHero } from '@/components/page-hero'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  BookOpen,
  Clock,
  Layers,
  Sparkles,
  GitFork,
  Zap,
  ArrowRight,
  Target,
  Activity,
  Trophy,
} from 'lucide-react'
import Link from 'next/link'
import * as Icons from 'lucide-react'

export const metadata: Metadata = {
  title: 'Flashcards de DevOps',
  description:
    'Flashcards interativos de DevOps cobrindo Kubernetes, Docker, Terraform, Git, Linux e CI/CD. Úteis para preparação de entrevistas, estudo para certificações e prática diária.',
  alternates: {
    canonical: '/flashcards',
  },
  openGraph: {
    title: 'Flashcards de DevOps - Bancada',
    description:
      'Domine conceitos de DevOps com flashcards interativos cobrindo Kubernetes, Docker, Terraform, Git e muito mais.',
    type: 'website',
    url: '/flashcards',
    images: [
      {
        url: '/images/flashcards/flashcards-og.png',
        width: 1200,
        height: 630,
        alt: 'Flashcards de DevOps',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Flashcards de DevOps - Bancada',
    description:
      'Domine conceitos de DevOps com flashcards interativos cobrindo Kubernetes, Docker, Terraform, Git e muito mais.',
    images: ['/images/flashcards/flashcards-og.png'],
  },
}

export default async function FlashcardsPage() {
  const flashcardSets = await getAllFlashCardSets()

  return (
    <div className="min-h-screen">
      <PageHero
        title="Aprenda Conceitos de DevOps"
        accentWord="Conceitos"
        description="Aprenda e memorize os principais conceitos de DevOps com flashcards interativos. Perfeito para provas, entrevistas ou prática diária."
        icon={Layers}
        breadcrumbs={[{ label: 'Flashcards' }]}
        stats={[{ label: 'conjuntos de flashcards', value: flashcardSets.length }]}
      />

      {/* Flashcard Sets Grid */}
      {flashcardSets.length > 0 ? (
        <section className="py-12 container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Conjuntos de Flashcards Disponíveis</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Escolha um tópico para começar a aprender. Acompanhe seu progresso e revise os cartões que ainda não domina.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {flashcardSets.map((set) => {
              const IconComponent = Icons[set.icon as keyof typeof Icons] || BookOpen
              const difficultyColors = {
                beginner: 'bg-green-500',
                intermediate: 'bg-yellow-500',
                advanced: 'bg-red-500',
              }
              return (
                <Link
                  key={set.id}
                  href={`/flashcards/${set.id}`}
                  className="group relative overflow-hidden rounded-md border border-border bg-card hover:border-primary/40 hover:bg-muted/30 transition-colors"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
                        style={{
                          background: `linear-gradient(135deg, ${set.theme.gradientFrom}, ${set.theme.gradientTo})`,
                        }}
                      >
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <Badge
                        variant="secondary"
                        className={`${difficultyColors[set.difficulty]} text-white`}
                      >
                        {set.difficulty}
                      </Badge>
                    </div>

                    <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                      {set.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">{set.description}</p>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        <span>{set.cardCount} cartões</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{set.estimatedTime}</span>
                      </div>
                    </div>
                  </div>

                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at center, ${set.theme.primaryColor}15 0%, transparent 70%)`,
                    }}
                  />
                </Link>
              )
            })}
          </div>
        </section>
      ) : (
        <section className="py-16 container mx-auto px-4">
          <div className="text-center">
            <BookOpen className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-4">Nenhum Conjunto de Flashcards Disponível</h2>
            <p className="text-muted-foreground mb-8">
              Estamos trabalhando para adicionar mais conjuntos de flashcards. Volte em breve!
            </p>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Por Que Usar Flashcards?</h2>
            <p className="text-muted-foreground">
              Flashcards usam repetição espaçada para ajudar você a reter informações por mais tempo
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-md border border-border bg-card/50 backdrop-blur-sm">
              <div className="w-12 h-12 mx-auto mb-4 rounded-md bg-primary/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Recordação Ativa</h3>
              <p className="text-muted-foreground">
                Teste a si mesmo recordando ativamente as informações, o que fortalece a memória melhor do que a leitura passiva.
              </p>
            </div>

            <div className="text-center p-6 rounded-md border border-border bg-card/50 backdrop-blur-sm">
              <div className="w-12 h-12 mx-auto mb-4 rounded-md bg-primary/10 flex items-center justify-center">
                <Activity className="w-6 h-6 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Acompanhe o Progresso</h3>
              <p className="text-muted-foreground">
                Marque os cartões como dominados ou não e concentre seu tempo de estudo nos conceitos que precisa revisar.
              </p>
            </div>

            <div className="text-center p-6 rounded-md border border-border bg-card/50 backdrop-blur-sm">
              <div className="w-12 h-12 mx-auto mb-4 rounded-md bg-primary/10 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Sessões Rápidas</h3>
              <p className="text-muted-foreground">
                Estude em sessões curtas, perfeitas para intervalos, deslocamentos ou sempre que tiver alguns minutos livres.
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
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Quer contribuir com flashcards?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Ajude a expandir nossa coleção de flashcards contribuindo com cartões para tecnologias que você domina.
              Compartilhe seu conhecimento com a comunidade DevOps!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg">
                <GitFork className="mr-2 h-4 w-4" />
                <Link href="https://github.com/The-DevOps-Daily/devops-daily/issues/new/choose">
                  Contribuir com Flashcards
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/quizzes">
                  <Zap className="mr-2 h-4 w-4" />
                  Experimente os Quizzes de DevOps
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
