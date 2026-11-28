import type { Metadata } from 'next';
import LoadBalancerSimulator from '../../../components/games/load-balancer-simulator';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('load-balancer-simulator');
}

function LoadBalancerEducational() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">Entendendo o balanceamento de carga</h3>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-3 font-semibold text-sm">O que você vai aprender</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Como diferentes algoritmos de balanceamento distribuem o tráfego</li>
            <li>Quando usar cada algoritmo de acordo com o seu caso de uso</li>
            <li>Como os load balancers lidam com falhas de servidores</li>
            <li>A diferença entre balanceamento na camada 4 e na camada 7</li>
            <li>O efeito dos pesos dos servidores na distribuição do tráfego</li>
            <li>Como medir o equilíbrio da distribuição e o desempenho</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-sm">Algoritmos de balanceamento</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Round Robin:</strong> distribuição simples e
              uniforme para servidores parecidos.
            </li>
            <li>
              <strong className="text-foreground">Least Connections:</strong> o melhor para conexões
              longas.
            </li>
            <li>
              <strong className="text-foreground">IP Hash:</strong> mantém a sessão no mesmo servidor
              (sticky sessions).
            </li>
            <li>
              <strong className="text-foreground">Least Response Time:</strong> ideal quando o
              desempenho dos servidores varia.
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 font-semibold text-sm">Aplicações no mundo real</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">NGINX/HAProxy:</strong> load balancers open source
            populares, com suporte a todos esses algoritmos.
          </li>
          <li>
            <strong className="text-foreground">AWS ELB:</strong> Application Load Balancer (camada 7)
            vs Network Load Balancer (camada 4).
          </li>
          <li>
            <strong className="text-foreground">Kubernetes:</strong> balanceamento de Services pelo
            kube-proxy, usando iptables/IPVS.
          </li>
          <li>
            <strong className="text-foreground">Cloudflare:</strong> balanceamento global com
            roteamento geográfico e health checks.
          </li>
        </ul>
      </div>

      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 font-semibold text-sm">Boas práticas</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>Use algoritmos com peso quando os servidores têm capacidades diferentes.</li>
          <li>Implemente health checks ativos para detectar falhas rapidamente.</li>
          <li>Considere roteamento geográfico em aplicações globais.</li>
          <li>Use a camada 7 para roteamento por conteúdo e terminação SSL.</li>
          <li>Monitore o equilíbrio da distribuição e a utilização dos servidores.</li>
        </ul>
      </div>
    </>
  );
}

export default function LoadBalancerSimulatorPage() {
  return (
    <SimulatorShell
      slug="load-balancer-simulator"
      educational={<LoadBalancerEducational />}
      shareText="Conheça este simulador de algoritmos de load balancer! Ótimo para aprender estratégias de distribuição de tráfego."
    >
      <LoadBalancerSimulator />
    </SimulatorShell>
  );
}
