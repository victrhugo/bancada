import type { Metadata } from 'next';
import ScalableSentry from '@/components/games/scalable-sentry';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('scalable-sentry');
}

export default function ScalableSentryPage() {
  return (
    <SimulatorShell
      slug="scalable-sentry"
      seoLearningPoints={[
        'Projetar arquiteturas com auto-scaling',
        'Aplicar estratégias de balanceamento de carga',
        'Construir sistemas de alta disponibilidade',
        'Lidar bem com picos de tráfego',
      ]}
    >
      <ScalableSentry />
    </SimulatorShell>
  );
}
