import type { Metadata } from 'next';
import K8sScheduler from '@/components/games/k8s-scheduler';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('k8s-scheduler');
}

export default function K8sSchedulerPage() {
  return (
    <SimulatorShell
      slug="k8s-scheduler"
      shareText="Encare o Desafio do Scheduler do Kubernetes: posicione pods nos nodes respeitando as regras do K8s."
      seoLearningPoints={[
        'Entender o algoritmo de agendamento de pods do Kubernetes',
        'Configurar requests e limits de recursos',
        'Usar node affinity, taints e tolerations',
        'Investigar falhas de agendamento',
      ]}
    >
      <K8sScheduler />
    </SimulatorShell>
  );
}
