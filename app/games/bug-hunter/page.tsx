import type { Metadata } from 'next';
import BugHunter from '@/components/games/bug-hunter';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('bug-hunter');
}

export default function BugHunterPage() {
  return (
    <SimulatorShell
      slug="bug-hunter"
      fallbackTitle="Bug Hunter"
      seoLearningPoints={[
        'Identificar bugs comuns de código',
        'Depurar scripts shell e arquivos de configuração',
        'Melhorar suas habilidades de code review',
      ]}
    >
      <BugHunter />
    </SimulatorShell>
  );
}
