import type { Metadata } from 'next';
import PacketJourney from '@/components/games/packet-journey';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('packet-journey');
}

export default function PacketJourneyPage() {
  return (
    <SimulatorShell
      slug="packet-journey"
      seoLearningPoints={[
        'Entender o modelo de rede TCP/IP',
        'Seguir o roteamento de um pacote pelos saltos da rede',
        'Aprender sobre resolução DNS, NAT e firewalls',
      ]}
    >
      <PacketJourney />
    </SimulatorShell>
  );
}
