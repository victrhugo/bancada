import { Hero } from '@/components/hero';
import FeaturedExercises from '@/components/featured-exercises';
import FeaturedQuizzes from '@/components/featured-quizzes';
import { SectionHeader } from '@/components/section-header';
import { SectionSeparator } from '@/components/section-separator';
import { ArrowRight, Globe, Anchor, Scale, GitBranch, Database, Shield } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getActiveGames } from '@/lib/games';

export const metadata: Metadata = {
  title: 'Bancada - Pratique DevOps com Exercícios, Quizzes e Simuladores',
  description:
    'Aprenda DevOps na prática. Exercícios, quizzes, flashcards, checklists e simuladores interativos sobre Docker, Kubernetes, Terraform, CI/CD e mais.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Bancada - Pratique DevOps com Exercícios, Quizzes e Simuladores',
    description:
      'Aprenda DevOps na prática. Exercícios, quizzes, flashcards, checklists e simuladores interativos.',
    url: '/',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Bancada',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bancada - Pratique DevOps com Exercícios, Quizzes e Simuladores',
    description:
      'Aprenda DevOps na prática. Exercícios, quizzes, flashcards, checklists e simuladores interativos.',
    images: ['/og-image.png'],
  },
};

const FEATURED_SIMULATORS = [
  {
    title: 'Simulador de Resolução DNS',
    description: 'Percorra todo o processo de resolução DNS passo a passo',
    href: '/games/dns-simulator',
    icon: Globe,
  },
  {
    title: 'Escalonador do Kubernetes',
    description: 'Posicione pods em nós com base em requisições de recursos e restrições',
    href: '/games/k8s-scheduler',
    icon: Anchor,
  },
  {
    title: 'Simulador de Load Balancer',
    description: 'Compare round-robin, least connections e algoritmos ponderados',
    href: '/games/load-balancer-simulator',
    icon: Scale,
  },
  {
    title: 'Construtor de Pipeline CI/CD',
    description: 'Projete um pipeline de deploy com estágios, gates e rollbacks',
    href: '/games/cicd-stack-generator',
    icon: GitBranch,
  },
  {
    title: 'Simulador de Cache',
    description: 'Veja como a taxa de acerto do cache muda com diferentes estratégias',
    href: '/games/caching-simulator',
    icon: Database,
  },
  {
    title: 'Defesa contra DDoS',
    description: 'Proteja sua infraestrutura de padrões de ataque simulados',
    href: '/games/ddos-simulator',
    icon: Shield,
  },
];

export default async function Home() {
  const activeToolCount = (await getActiveGames()).length;

  return (
    <div>
      {/* Full-width hero with dot-grid background */}
      <div className="relative overflow-x-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 opacity-[0.07] dark:opacity-[0.09]"
          style={{
            backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
          }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/[0.04] via-transparent to-transparent" />
        <div className="container px-4 pt-8 mx-auto">
          <Hero />
        </div>
      </div>

      <div className="container px-4 mx-auto">
        <SectionSeparator command="ls /simulators" />

        {/* Featured Simulators */}
        <section className="my-16">
          <SectionHeader label="destaque" title="Simuladores Interativos" viewAllHref="/games" />
          <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-3 bg-border border rounded-md overflow-hidden">
            {FEATURED_SIMULATORS.map((sim) => {
              const Icon = sim.icon;
              return (
                <Link
                  key={sim.href}
                  href={sim.href}
                  className="group bg-card p-5 transition-colors hover:bg-muted/40"
                >
                  <Icon
                    className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors mb-3"
                    strokeWidth={1.5}
                  />
                  <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                    {sim.title}
                  </h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">{sim.description}</p>
                </Link>
              );
            })}
          </div>
          <Link
            href="/games"
            className="sm:hidden inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors mt-4"
          >
            Ver todos os simuladores
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        <SectionSeparator command="ls /exercises --recent" />

        <FeaturedExercises className="my-16" />

        <SectionSeparator command="ls /quizzes --latest" />

        <FeaturedQuizzes className="my-16" />

        {/* About - editorial identity block, citable for AI search */}
        <section className="my-16 max-w-4xl mx-auto px-4" aria-label="Sobre o Bancada">
          <p className="text-xs font-mono text-muted-foreground mb-3">{'// sobre'}</p>
          <p className="text-xl sm:text-2xl leading-relaxed tracking-tight">
            <span className="font-semibold text-foreground">Bancada</span>{' '}
            <span className="text-muted-foreground">
              é uma plataforma de prática gratuita e independente para engenheiros que querem
              aprender executando coisas de verdade, não lendo slides. Kubernetes, Docker,
              Terraform, CI/CD, observabilidade e segurança, através de
            </span>{' '}
            <span className="text-foreground">
              simuladores práticos, quizzes, exercícios, flashcards e checklists.
            </span>
          </p>
          <dl className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-px bg-border border rounded-md overflow-hidden font-mono">
            <div className="bg-card p-4">
              <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Grátis</dt>
              <dd className="text-lg tabular-nums font-semibold mt-1">$0</dd>
              <dd className="text-xs text-muted-foreground/80 mt-0.5">para sempre</dd>
            </div>
            <div className="bg-card p-4">
              <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Ferramentas</dt>
              <dd className="text-lg tabular-nums font-semibold mt-1">{activeToolCount}</dd>
              <dd className="text-xs text-muted-foreground/80 mt-0.5">interativas</dd>
            </div>
            <div className="bg-card p-4">
              <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Foco
              </dt>
              <dd className="text-lg tabular-nums font-semibold mt-1">Prática</dd>
              <dd className="text-xs text-muted-foreground/80 mt-0.5">não teoria</dd>
            </div>
            <div className="bg-card p-4">
              <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Acesso
              </dt>
              <dd className="text-lg tabular-nums font-semibold mt-1">Aberto</dd>
              <dd className="text-xs text-muted-foreground/80 mt-0.5">sem cadastro</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
