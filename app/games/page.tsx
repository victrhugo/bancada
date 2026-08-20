import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Dice6, Gamepad2, Sparkles } from 'lucide-react';
import { getAllGames } from '@/lib/games';
import { PageHero } from '@/components/page-hero';
import { GamesList } from '@/components/games-list';
import { LottiePlayer } from '@/components/lottie-player';

export const metadata: Metadata = {
  title: 'Jogos e Ferramentas Interativas de DevOps',
  description:
    'Jogos interativos e simuladores divertidos para profissionais de DevOps aprenderem e praticarem habilidades de forma lúdica. Explore nossa coleção de jogos com temática DevOps criados para aprimorar seus conhecimentos.',
  alternates: {
    canonical: '/games',
  },
  openGraph: {
    title: 'Jogos e Ferramentas Interativas de DevOps - Bancada',
    description:
      'Jogos interativos e simuladores divertidos para profissionais de DevOps aprenderem e praticarem habilidades de forma lúdica. Explore nossa coleção de jogos com temática DevOps criados para aprimorar seus conhecimentos.',
    type: 'website',
    url: '/games',
    images: [
      {
        url: '/images/pages/simulators.png',
        width: 1200,
        height: 630,
        alt: 'Jogos e Ferramentas Interativas de DevOps',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jogos e Ferramentas Interativas de DevOps - Bancada',
    description:
      'Jogos interativos e simuladores divertidos para profissionais de DevOps aprenderem e praticarem habilidades de forma lúdica. Explore nossa coleção de jogos com temática DevOps criados para aprimorar seus conhecimentos.',
    images: ['/images/pages/simulators.png'],
  },
};

export default async function GamesPage() {
  // Load games dynamically
  const games = await getAllGames();

  const availableGames = games.filter((game) => !game.isComingSoon);
  const comingSoonGames = games.filter((game) => game.isComingSoon);

  return (
    <div className="min-h-screen">
      <PageHero
        title="Jogos e Simuladores DevOps"
        accentWord="Simuladores"
        description="Domine DevOps com jogos interativos e simuladores criados por especialistas do setor. Teste seus conhecimentos, acompanhe seu progresso e conquiste medalhas à medida que avança."
        icon={Gamepad2}
        breadcrumbs={[{ label: 'Jogos e Simuladores' }]}
        stats={[
          { label: 'disponíveis', value: availableGames.length },
          { label: 'em breve', value: comingSoonGames.length },
        ]}
        sideContent={
          <LottiePlayer
            path="/lottie/games-hero.json"
            className="h-48 w-64 xl:h-56 xl:w-72"
            ariaLabel="Janela de terminal animada cercada por formas de jogos flutuantes"
          />
        }
      />

      {/* Games List with Filters */}
      <section className="py-8 container mx-auto px-4 mb-16">
        <GamesList games={games} />
      </section>

      {/* CTA Section */}
      <section className="py-16 container mx-auto px-4">
        <div className="bg-primary/5 backdrop-blur-sm border border-border/50 rounded-md p-8 md:p-12">
          <div className="max-w-3xl mx-auto text-center">
            <Sparkles className="h-12 w-12 mx-auto mb-6 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Tem uma ideia para um jogo ou simulador de DevOps?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Estamos sempre buscando expandir nossa coleção com jogos e simuladores de DevOps
              úteis. Compartilhe sua ideia e talvez a construamos em seguida.
            </p>
            <Button size="lg" asChild>
              <Link href="https://github.com/The-DevOps-Daily/devops-daily/issues/new/choose">
                <Dice6 className="mr-2 h-4 w-4" />
                Sugerir um Jogo
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
