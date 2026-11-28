import type { Metadata } from 'next';
import DDoSSimulator from '@/components/games/ddos-simulator';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('ddos-simulator');
}

export default function DDoSSimulatorPage() {
  return (
    <SimulatorShell
      slug="ddos-simulator"
      seoLearningPoints={[
        'Reconhecer os diferentes tipos de ataque DDoS',
        'Implementar rate limiting e filtragem de tráfego',
        'Projetar arquiteturas resilientes contra DDoS',
      ]}
    >
      <DDoSSimulator />
    </SimulatorShell>
  );
}
