import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { HeroDemoTerminal } from '@/components/hero-demo-terminal';
import { getActiveGames } from '@/lib/games';
import { getAllQuizzes } from '@/lib/quiz-loader';
import { getAllExercises } from '@/lib/exercises';
import { getAllChecklists } from '@/lib/checklists';
import { getAllFlashCardSets } from '@/lib/flashcard-loader';

export async function Hero() {
  const [games, quizzes, exercises, checklists, flashcards] = await Promise.all([
    getActiveGames(),
    getAllQuizzes(),
    getAllExercises(),
    getAllChecklists(),
    getAllFlashCardSets(),
  ]);

  const totalContent =
    games.length + quizzes.length + exercises.length + checklists.length + flashcards.length;

  return (
    <div className="pb-8">
      <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-start pt-8 sm:pt-12 relative z-10">
        <div className="lg:col-span-7 max-w-3xl">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
            Aprenda DevOps{' '}
            <span className="text-primary relative inline-block">
              praticando
              <svg
                className="absolute -bottom-2 left-0 w-full h-3 text-primary/40"
                viewBox="0 0 120 12"
                preserveAspectRatio="none"
              >
                <path
                  d="M2 9 Q15 2 30 8 Q45 1 60 7 Q75 2 90 9 Q105 4 118 7"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            ,<br />
            não só lendo.
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed">
            <span className="font-mono tabular-nums text-foreground">{totalContent}+</span>{' '}
            exercícios, quizzes e ferramentas práticas para engenheiros que preferem um terminal a
            uma apresentação de slides.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap items-center gap-3 mt-8">
            <Button asChild size="lg">
              <Link href="/games" className="group">
                Testar um Simulador
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/exercises">Começar um Exercício</Link>
            </Button>
          </div>
        </div>

        {/* Right column — animated command demo terminal */}
        <div className="lg:col-span-5 w-full lg:pt-4">
          <HeroDemoTerminal />
        </div>
      </div>

      {/* Terminal-style stats block */}
      <div className="mt-10 max-w-2xl relative z-10">
        <div className="rounded-md border border-border/80 bg-card overflow-hidden font-mono text-sm">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/60 border-b border-border/80">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
              <div className="w-3 h-3 rounded-full bg-green-400/70" />
            </div>
            <span className="text-xs text-muted-foreground ml-2">bancada --stats</span>
          </div>
          <div className="px-4 py-3 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-green-500">$</span>
              <span className="text-muted-foreground">cat content-overview.txt</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4 pl-4 py-1">
              <Link
                href="/games"
                className="group hover:bg-muted/50 rounded px-1.5 py-0.5 -mx-1.5 transition-colors whitespace-nowrap"
              >
                <span className="text-primary font-semibold tabular-nums">{games.length}</span>
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                  {' '}
                  ferramentas
                </span>
              </Link>
              <Link
                href="/quizzes"
                className="group hover:bg-muted/50 rounded px-1.5 py-0.5 -mx-1.5 transition-colors whitespace-nowrap"
              >
                <span className="text-primary font-semibold tabular-nums">{quizzes.length}</span>
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                  {' '}
                  quizzes
                </span>
              </Link>
              <Link
                href="/exercises"
                className="group hover:bg-muted/50 rounded px-1.5 py-0.5 -mx-1.5 transition-colors whitespace-nowrap"
              >
                <span className="text-primary font-semibold tabular-nums">{exercises.length}</span>
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                  {' '}
                  exercícios
                </span>
              </Link>
              <Link
                href="/checklists"
                className="group hover:bg-muted/50 rounded px-1.5 py-0.5 -mx-1.5 transition-colors whitespace-nowrap"
              >
                <span className="text-primary font-semibold tabular-nums">{checklists.length}</span>
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                  {' '}
                  checklists
                </span>
              </Link>
              <Link
                href="/flashcards"
                className="group hover:bg-muted/50 rounded px-1.5 py-0.5 -mx-1.5 transition-colors whitespace-nowrap"
              >
                <span className="text-primary font-semibold tabular-nums">{flashcards.length}</span>
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                  {' '}
                  flashcards
                </span>
              </Link>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground/50">
              <span className="text-green-500/70">$</span>
              <span className="inline-block w-[0.6em] h-[1em] align-middle bg-foreground/60 animate-cursor-blink" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
