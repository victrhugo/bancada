import type { Metadata } from 'next';
import DbmsSimulator from '@/components/games/dbms-simulator';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('dbms-simulator');
}

export default function DbmsSimulatorPage() {
  return (
    <SimulatorShell
      slug="dbms-simulator"
      seoLearningPoints={[
        'Escrever e executar consultas SQL',
        'Entender transações e as propriedades ACID',
        'Aprender estratégias de indexação para desempenho',
      ]}
    >
      <DbmsSimulator />
    </SimulatorShell>
  );
}
