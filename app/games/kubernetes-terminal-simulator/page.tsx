import type { Metadata } from 'next';
import KubernetesTerminalSimulator from '@/components/games/kubernetes-terminal-simulator';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('kubernetes-terminal-simulator');
}

function KubernetesTerminalEducational() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">Sobre este simulador de Kubernetes</h3>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-3 text-sm font-semibold">O que você vai aprender</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Como o kubectl escolhe um cluster por meio dos contextos do kubeconfig</li>
            <li>A relação entre Nodes, Pods, Deployments, ReplicaSets e Services</li>
            <li>Como labels e selectors ligam workloads a endpoints de rede estáveis</li>
            <li>Como escalar e fazer rolling updates muda o estado desejado</li>
            <li>Como logs, describe, exec e eventos ajudam no debugging</li>
            <li>Como ConfigMaps e rotinas de limpeza entram na operação do dia a dia</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Comandos principais</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Cluster:</strong> kubectl version, config
              current-context, cluster-info, get nodes
            </li>
            <li>
              <strong className="text-foreground">Workloads:</strong> create deployment, get pods, get
              deployments
            </li>
            <li>
              <strong className="text-foreground">Rede:</strong> expose deployment, get svc, describe
              service
            </li>
            <li>
              <strong className="text-foreground">Operação:</strong> scale, rollout status, set
              image, logs, describe, exec, events
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Seguro para o navegador</h4>
        <p className="text-sm text-muted-foreground">
          Este laboratório não se conecta a um cluster Kubernetes real. Ele simula os objetos da API do
          Kubernetes no navegador, para você praticar comandos, ver causa e efeito e ganhar confiança
          antes de usar o kubectl em ambientes compartilhados.
        </p>
      </div>

      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Por que aprender Kubernetes assim?</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>Kubernetes parece abstrato até você ver como os controllers reconciliam o estado.</li>
          <li>A maior parte do debugging do dia a dia começa com um pequeno conjunto de comandos kubectl.</li>
          <li>Entender Pods, Deployments, Services e eventos deixa os incidentes em produção menos misteriosos.</li>
        </ul>
      </div>
    </>
  );
}

export default function KubernetesTerminalSimulatorPage() {
  return (
    <SimulatorShell
      slug="kubernetes-terminal-simulator"
      fallbackTitle="Simulador de Terminal Kubernetes"
      fallbackDescription="Pratique comandos Kubernetes em um terminal interativo no navegador. Aprenda contextos do kubectl, nodes, Pods, Deployments, Services, rollouts, logs, exec, eventos, ConfigMaps e rotinas de limpeza."
      educational={<KubernetesTerminalEducational />}
      shareText="Pratique kubectl no navegador com este simulador interativo de terminal Kubernetes."
    >
      <KubernetesTerminalSimulator />
    </SimulatorShell>
  );
}
