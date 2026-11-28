import type { Metadata } from 'next';
import InfraTarot from '../../../components/games/infra-tarot';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('infra-tarot');
}

function InfraTarotEducational() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">A arte de adivinhar o futuro da infraestrutura</h3>
      <p className="mb-3 text-sm text-muted-foreground">
        Não dá para prever o futuro da sua infraestrutura com cartas místicas, mas este jogo mostra
        desafios reais de DevOps de um jeito divertido. Cada carta representa um cenário que times de
        infraestrutura enfrentam de verdade, de quedas e limites de orçamento a desafios de escala e
        preocupações com segurança.
      </p>
      <p className="text-sm text-muted-foreground">
        A melhor &quot;previsão&quot; para a sua infraestrutura vem de um bom monitoramento, testes
        automatizados, infraestrutura como código e boas práticas de DevOps. Mas, às vezes, um pouco
        de humor ajuda a lidar com o caos dos sistemas distribuídos.
      </p>
    </>
  );
}

export default function InfraTarotPage() {
  return (
    <SimulatorShell
      slug="infra-tarot"
      educational={<InfraTarotEducational />}
      seoLearningPoints={[
        'Conhecer modos comuns de falha em infraestrutura',
        'Entender boas práticas de DevOps por meio de metáforas',
        'Explorar cenários de resposta a incidentes',
      ]}
    >
      <InfraTarot />
    </SimulatorShell>
  );
}
