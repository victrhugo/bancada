import type { Metadata } from 'next';
import KubernetesNetworkingCniSimulator from '@/components/games/kubernetes-networking-cni-simulator';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('kubernetes-networking-cni-simulator');
}

function KubernetesNetworkingEducational() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">Sobre este simulador de redes Kubernetes</h3>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-3 text-sm font-semibold">O que você vai aprender</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Como os Pods se comunicam pelo IP do Pod, no mesmo node e entre nodes</li>
            <li>O que um plugin CNI faz quando o namespace de rede de um Pod é criado</li>
            <li>Por que Services ClusterIP são IPs virtuais que apontam para Pods reais</li>
            <li>Como os EndpointSlices ligam os selectors de um Service aos endereços dos backends</li>
            <li>Onde entram kube-proxy, IPVS, iptables e o roteamento de Services no estilo eBPF</li>
            <li>Como o tráfego de Ingress, LoadBalancer e NodePort chega a um Pod de backend</li>
            <li>Como o externalTrafficPolicy muda a preservação do IP de origem e as escolhas de roteamento</li>
            <li>Por que a NetworkPolicy precisa de um plugin de rede capaz de aplicá-la</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Caminhos de pacote cobertos</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Rede de Pods:</strong> fluxos entre Pods no mesmo
              node e entre nodes
            </li>
            <li>
              <strong className="text-foreground">Rede de Services:</strong> DNS, ClusterIP,
              EndpointSlices, escolha de endpoint, Services headless e rastreamento de respostas
            </li>
            <li>
              <strong className="text-foreground">Tráfego de borda:</strong> cliente externo até
              LoadBalancer, NodePort, Ingress, Service e Pod
            </li>
            <li>
              <strong className="text-foreground">Segurança:</strong> default-deny, regras de
              liberação, controle de saída e aplicação de políticas pelo CNI
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">CNI vs roteamento de Services</h4>
        <p className="text-sm text-muted-foreground">
          Os plugins CNI fazem a rede dos Pods funcionar: interfaces, IPAM, rotas, overlays ou
          roteamento nativo e, muitas vezes, políticas. Os Services do Kubernetes são uma abstração
          separada, que liga IPs virtuais e nomes DNS estáveis a Pods que mudam o tempo todo.
        </p>
      </div>

      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Seguro para o navegador</h4>
        <p className="text-sm text-muted-foreground">
          Este simulador não se conecta a um cluster real. Ele reproduz no navegador o caminho dos
          pacotes e as decisões do dataplane, para você entender a rede do Kubernetes antes de
          investigar iptables, mapas eBPF, agentes CNI ou load balancers de nuvem em produção.
        </p>
      </div>
    </>
  );
}

export default function KubernetesNetworkingCniSimulatorPage() {
  return (
    <SimulatorShell
      slug="kubernetes-networking-cni-simulator"
      fallbackTitle="Simulador de Redes Kubernetes / CNI"
      fallbackDescription="Visualize a rede do Kubernetes e os caminhos de pacotes do CNI. Aprenda roteamento entre Pods, Services ClusterIP, kube-proxy, eBPF, Ingress, NetworkPolicy e saída para a internet em um simulador interativo."
      educational={<KubernetesNetworkingEducational />}
      shareText="Aprenda redes do Kubernetes e caminhos de pacotes do CNI com este simulador interativo."
    >
      <KubernetesNetworkingCniSimulator />
    </SimulatorShell>
  );
}
