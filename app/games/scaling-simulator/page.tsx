import type { Metadata } from 'next';
import ScalingSimulator from '@/components/games/scaling-simulator';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('scaling-simulator');
}

function ScalingEducational() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">Entendendo estratégias de escala</h3>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-3 font-semibold text-sm">O que você vai aprender</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Escala horizontal (scale out) vs escala vertical (scale up)</li>
            <li>Quando usar cada estratégia de acordo com a carga</li>
            <li>O impacto em desempenho, custo e confiabilidade</li>
            <li>Como configurar auto-scaling e quais os benefícios</li>
            <li>Distribuição de carga com escala horizontal</li>
            <li>Gestão de orçamento e otimização de custos</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-sm">Estratégias de escala</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Escala vertical:</strong> aumentar os recursos do
              servidor (CPU, RAM, disco). Simples, mas limitada.
            </li>
            <li>
              <strong className="text-foreground">Escala horizontal:</strong> adicionar mais
              servidores atrás de um load balancer. Quase ilimitada, mas mais complexa.
            </li>
            <li>
              <strong className="text-foreground">Auto-scaling:</strong> ajustar a capacidade
              automaticamente conforme a demanda.
            </li>
            <li>
              <strong className="text-foreground">Abordagem híbrida:</strong> combinar as duas
              estratégias para o melhor resultado.
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 font-semibold text-sm">Aplicações no mundo real</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">AWS EC2:</strong> Auto Scaling Groups com ELB para
            escala horizontal.
          </li>
          <li>
            <strong className="text-foreground">Kubernetes:</strong> Horizontal Pod Autoscaler (HPA)
            para workloads em containers.
          </li>
          <li>
            <strong className="text-foreground">Bancos de dados:</strong> réplicas de leitura
            (horizontal) vs instâncias maiores (vertical).
          </li>
          <li>
            <strong className="text-foreground">Serverless:</strong> escala automática sem gerenciar
            servidores.
          </li>
        </ul>
      </div>

      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 font-semibold text-sm">Boas práticas</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>Comece pela escala vertical, que é mais simples, e depois escale na horizontal.</li>
          <li>Use auto-scaling para absorver picos de tráfego com custo controlado.</li>
          <li>Defina períodos de cooldown adequados para evitar que a escala fique oscilando.</li>
          <li>Monitore as métricas principais: CPU, memória, tempo de resposta e taxa de erro.</li>
          <li>Projete aplicações stateless para facilitar a escala horizontal.</li>
        </ul>
      </div>
    </>
  );
}

export default function ScalingSimulatorPage() {
  return (
    <SimulatorShell
      slug="scaling-simulator"
      educational={<ScalingEducational />}
      shareText="Conheça este simulador de escala! Aprenda escala horizontal vs vertical de forma interativa."
    >
      <ScalingSimulator />
    </SimulatorShell>
  );
}
