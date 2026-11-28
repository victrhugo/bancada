import type { Metadata } from 'next';
import UptimeDefender from '@/components/games/uptime-defender';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('uptime-defender');
}

export default function UptimeDefenderPage() {
  return (
    <SimulatorShell
      slug="uptime-defender"
      seoLearningPoints={[
        'Praticar fluxos de resposta a incidentes',
        'Priorizar e fazer a triagem de problemas em produção',
        'Aprender sobre SLAs, SLOs e error budgets',
        'Lidar com falhas em cascata',
      ]}
    >
      <UptimeDefender />
    </SimulatorShell>
  );
}
