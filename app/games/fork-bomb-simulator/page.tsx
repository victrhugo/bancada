import type { Metadata } from 'next';
import ForkBombSimulator from '@/components/games/fork-bomb-simulator';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('fork-bomb-simulator');
}

export default function ForkBombSimulatorPage() {
  return (
    <SimulatorShell
      slug="fork-bomb-simulator"
      seoLearningPoints={[
        'Entender como uma fork bomb faz os processos crescerem exponencialmente',
        'Ver como o esgotamento de recursos derruba o sistema',
        'Aprender a evitar fork bombs com ulimit, cgroups e systemd',
      ]}
    >
      <ForkBombSimulator />
    </SimulatorShell>
  );
}
