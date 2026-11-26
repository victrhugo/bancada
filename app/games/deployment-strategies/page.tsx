import type { Metadata } from 'next';
import DeploymentStrategiesSimulator from '../../../components/games/deployment-strategies-simulator';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('deployment-strategies');
}

function DeploymentStrategiesEducational() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">Entendendo estratégias de deploy</h3>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-3 font-semibold text-sm">O que você vai aprender</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Como diferentes estratégias de deploy reduzem o risco e o tempo fora do ar</li>
            <li>As contrapartidas entre velocidade, segurança e custo de recursos no deploy</li>
            <li>Quando usar cada estratégia de acordo com as necessidades da aplicação</li>
            <li>Como o roteamento do tráfego muda durante um deploy</li>
            <li>O papel das feature toggles nas práticas modernas de deploy</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-sm">Estratégias comparadas</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Recreate:</strong> simples, mas causa downtime.
              Derruba tudo e depois sobe tudo.
            </li>
            <li>
              <strong className="text-foreground">Rolling Update:</strong> o padrão do Kubernetes.
              Substituição gradual, sem downtime.
            </li>
            <li>
              <strong className="text-foreground">Blue-Green:</strong> dois ambientes, troca
              instantânea e rollback instantâneo.
            </li>
            <li>
              <strong className="text-foreground">Canary:</strong> mudança gradual do tráfego, teste
              com usuários reais e liberação guiada por dados.
            </li>
            <li>
              <strong className="text-foreground">Feature Toggles:</strong> separam o deploy do
              lançamento, com segmentação por usuário.
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 font-semibold text-sm">Implementações no mundo real</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">Kubernetes:</strong> suporte nativo a Rolling Update e
            Recreate na spec do Deployment.
          </li>
          <li>
            <strong className="text-foreground">Argo Rollouts:</strong> Blue-Green e Canary avançados,
            com análise automatizada.
          </li>
          <li>
            <strong className="text-foreground">Istio/Linkerd:</strong> divisão de tráfego via service
            mesh para deploys Canary.
          </li>
          <li>
            <strong className="text-foreground">LaunchDarkly/Unleash:</strong> plataformas de feature
            flags para lançamentos com toggles.
          </li>
          <li>
            <strong className="text-foreground">AWS CodeDeploy:</strong> serviço gerenciado de deploy
            com suporte a várias estratégias.
          </li>
        </ul>
      </div>

      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 font-semibold text-sm">Boas práticas</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>Tenha sempre um plano de rollback antes de ir para produção.</li>
          <li>Use health checks e readiness probes para validar as novas versões.</li>
          <li>Tenha monitoramento e alertas adequados durante o deploy.</li>
          <li>Cuidado com migrações de banco de dados: elas costumam exigir tratamento especial.</li>
          <li>Comece com um raio de impacto menor (Canary) em serviços críticos.</li>
          <li>Remova as feature flags depois que a funcionalidade estiver totalmente liberada.</li>
        </ul>
      </div>
    </>
  );
}

export default function DeploymentStrategiesPage() {
  return (
    <SimulatorShell
      slug="deployment-strategies"
      educational={<DeploymentStrategiesEducational />}
      shareText="Conheça este simulador de estratégias de deploy! Aprenda Blue-Green, Canary, Rolling Update e mais."
    >
      <DeploymentStrategiesSimulator />
    </SimulatorShell>
  );
}
