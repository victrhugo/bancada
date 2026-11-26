'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Globe,
  Layers,
  LockKeyhole,
  Network,
  Play,
  RotateCcw,
  Route,
  Server,
  Shield,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

type ScenarioId =
  | 'same-node'
  | 'cross-node'
  | 'cluster-ip'
  | 'service-discovery'
  | 'ingress'
  | 'load-balancer'
  | 'network-policy'
  | 'egress';
type Dataplane = 'overlay' | 'direct' | 'ebpf';
type ExternalTrafficPolicy = 'Cluster' | 'Local';
type PacketTone = 'translated' | 'blocked' | 'external';

interface PacketStep {
  title: string;
  packet: string;
  explanation: string;
  mutation: string;
  highlights: string[];
  tone?: PacketTone;
}

interface Scenario {
  id: ScenarioId;
  title: string;
  subtitle: string;
  lesson: string;
  icon: LucideIcon;
  steps: PacketStep[];
}

const DATAPLANES: Record<
  Dataplane,
  {
    label: string;
    shortLabel: string;
    description: string;
    servicePath: string;
    crossNodePath: string;
  }
> = {
  overlay: {
    label: 'Overlay CNI',
    shortLabel: 'VXLAN',
    description:
      'O tráfego de Pods mantém os IPs dos Pods dentro do pacote do cluster, enquanto os saltos entre nodes podem ser encapsulados em um túnel externo node a node.',
    servicePath: 'O kube-proxy programa regras iptables/IPVS para traduzir o VIP do Service.',
    crossNodePath: 'O Node A encapsula o pacote do Pod, a rede underlay o leva até o Node B, e o Node B desencapsula.',
  },
  direct: {
    label: 'Routed CNI',
    shortLabel: 'BGP / routes',
    description:
      'Os Pod CIDRs são roteáveis pela tabela de rotas do node ou da rede física, então o tráfego entre nodes pode viajar sem cabeçalho de overlay.',
    servicePath: 'O kube-proxy continua cuidando da tradução do ClusterIP, a menos que o CNI o substitua.',
    crossNodePath: 'O Node A roteia direto para o Node B porque a rede sabe onde fica o PodCIDR de destino.',
  },
  ebpf: {
    label: 'eBPF CNI',
    shortLabel: 'eBPF',
    description:
      'Programas eBPF podem aplicar policies e fazer o load balancing de Services no datapath do kernel, às vezes substituindo o kube-proxy.',
    servicePath: 'O datapath eBPF pode traduzir o VIP do Service para um backend antes de o iptables entrar em cena.',
    crossNodePath: 'O pacote segue por roteamento nativo ou túnel, com programas eBPF aplicando policy e observabilidade nos principais hooks.',
  },
};

const SCENARIOS: Scenario[] = [
  {
    id: 'same-node',
    title: 'Pod para Pod, mesmo node',
    subtitle: 'O caminho de pacote mais simples',
    lesson: 'Cada Pod recebe seu próprio IP. No mesmo node, o tráfego passa por pares veth e roteamento local, sem Service.',
    icon: Boxes,
    steps: [
      {
        title: 'A aplicação abre um socket',
        packet: 'src=10.244.1.12:43152 -> dst=10.244.1.34:8080',
        explanation:
          'O Pod frontend envia direto para o IP do Pod backend. Isso é a rede normal do Kubernetes: IPs de Pod são endereços de primeira classe dentro do cluster.',
        mutation: 'Sem NAT. O destino já é um IP de Pod.',
        highlights: ['pod-frontend', 'pod-api', 'same-node-link'],
      },
      {
        title: 'O pacote sai do namespace do Pod',
        packet: 'eth0 -> veth peer -> node network namespace',
        explanation:
          'O plugin CNI criou a interface do Pod e a conectou ao node usando um par veth ou um datapath equivalente.',
        mutation: 'O pacote sai do Pod, mas os IPs de origem e destino continuam os mesmos.',
        highlights: ['pod-frontend', 'cni-a', 'node-a'],
      },
      {
        title: 'O node roteia localmente',
        packet: 'node-a route lookup: 10.244.1.34 is local',
        explanation:
          'Como os dois Pods estão no node-a, o kernel ou o datapath do CNI encaminha localmente para a interface do Pod backend.',
        mutation: 'Não precisa consultar Service. Não precisa de túnel overlay.',
        highlights: ['node-a', 'cni-a', 'pod-api', 'same-node-link'],
      },
      {
        title: 'O backend recebe o pacote',
        packet: 'backend sees src=10.244.1.12 -> dst=10.244.1.34',
        explanation:
          'O backend identifica o Pod que chamou pelo IP dele. Esse endereçamento direto é uma das ideias centrais da rede do Kubernetes.',
        mutation: 'A identidade do Pod é preservada na camada 3.',
        highlights: ['pod-frontend', 'pod-api'],
      },
    ],
  },
  {
    id: 'cross-node',
    title: 'Pod para Pod, entre nodes',
    subtitle: 'Overlay, roteado ou eBPF',
    lesson:
      'É no tráfego entre nodes que o dataplane do CNI mais importa: ele precisa tornar os PodCIDRs alcançáveis entre nodes.',
    icon: Route,
    steps: [
      {
        title: 'O frontend mira um IP de Pod remoto',
        packet: 'src=10.244.1.12 -> dst=10.244.2.21',
        explanation:
          'A aplicação continua falando com um IP de Pod. O Kubernetes espera que isso funcione entre nodes sem a aplicação fazer nada de especial.',
        mutation: 'O pacote interno é um pacote de Pod para Pod.',
        highlights: ['pod-frontend', 'pod-payments', 'cross-node-link'],
      },
      {
        title: 'O Node A encontra o PodCIDR remoto',
        packet: '10.244.2.0/24 belongs behind node-b',
        explanation:
          'A tabela de rotas do node, o agente CNI ou um mapa eBPF informa ao datapath que o Pod de destino está no node-b.',
        mutation: 'O próximo salto passa a ser o node-b, mas o destino interno continua sendo o IP do Pod remoto.',
        highlights: ['node-a', 'cni-a', 'node-fabric', 'node-b'],
      },
      {
        title: 'O CNI leva o pacote entre os nodes',
        packet: 'node-a -> node-b transport',
        explanation:
          'Dependendo do modo do CNI, pode ser encapsulamento VXLAN/IP-in-IP, roteamento direto com BGP/rotas estáticas ou um caminho nativo em eBPF.',
        mutation: 'O salto node a node é detalhe de implementação; o pacote do Pod continua endereçado a 10.244.2.21.',
        highlights: ['cni-a', 'node-fabric', 'cni-b', 'cross-node-link'],
      },
      {
        title: 'O Node B entrega ao Pod',
        packet: 'backend sees src=10.244.1.12 -> dst=10.244.2.21',
        explanation:
          'Depois do desencapsulamento ou da entrega por rota, o node-b encaminha o pacote para a interface do Pod payments.',
        mutation: 'O Pod de destino vê o IP do Pod de origem, não um endereço qualquer de node.',
        highlights: ['node-b', 'cni-b', 'pod-payments'],
      },
    ],
  },
  {
    id: 'cluster-ip',
    title: 'ClusterIP Service',
    subtitle: 'IP virtual estável para Pods que mudam',
    lesson:
      'Services dão aos clientes um IP virtual e um nome DNS estáveis, enquanto o datapath escolhe um Pod endpoint saudável.',
    icon: Layers,
    steps: [
      {
        title: 'O DNS devolve um VIP de Service',
        packet: 'payments.default.svc.cluster.local -> 10.96.12.40',
        explanation:
          'O CoreDNS devolve o ClusterIP. Esse IP é virtual: não é um Pod e normalmente não está atribuído a nenhuma interface real.',
        mutation: 'Agora a aplicação mira um IP de Service em vez de um IP de Pod.',
        highlights: ['pod-frontend', 'dns', 'service'],
        tone: 'translated',
      },
      {
        title: 'O pacote sai rumo ao ClusterIP',
        packet: 'src=10.244.1.12 -> dst=10.96.12.40:443',
        explanation:
          'O cliente acha que está se conectando a um endpoint estável. As regras do dataplane do Kubernetes cuidam da escolha do backend.',
        mutation: 'Neste momento, o destino ainda é o VIP do Service.',
        highlights: ['pod-frontend', 'service', 'service-link'],
        tone: 'translated',
      },
      {
        title: 'A tradução do Service escolhe um endpoint',
        packet: '10.96.12.40:443 -> 10.244.2.21:8443',
        explanation:
          'O kube-proxy em modo iptables/IPVS, ou um substituto em eBPF, traduz o destino virtual do Service para um Pod endpoint real.',
        mutation: 'O IP e a porta de destino são reescritos para o Pod endpoint escolhido.',
        highlights: ['service', 'kube-proxy', 'pod-payments'],
        tone: 'translated',
      },
      {
        title: 'A resposta segue o connection tracking',
        packet: 'a resposta volta como a mesma conexão do Service',
        explanation:
          'O connection tracking ou o load balancing reverso faz a resposta casar com a conexão do cliente ao Service.',
        mutation: 'O cliente mantém sua abstração estável de Service.',
        highlights: ['pod-payments', 'service', 'pod-frontend'],
        tone: 'translated',
      },
    ],
  },
  {
    id: 'service-discovery',
    title: 'EndpointSlice e DNS headless',
    subtitle: 'Como os Services encontram os Pods',
    lesson:
      'Services do not send traffic to Pods by magic. Selectors create EndpointSlices, and dataplanes watch those slices to program real backends.',
    icon: Layers,
    steps: [
      {
        title: 'O selector do Service encontra os Pods',
        packet: 'selector app=payments -> Pods 10.244.2.21, 10.244.2.45',
        explanation:
          'O selector do Service encontra os Pods correspondentes. O Kubernetes publica esses backends em objetos EndpointSlice, em vez de obrigar os clientes a acompanhar os Pods diretamente.',
        mutation: 'As labels do workload viram um conjunto de backends.',
        highlights: ['service', 'endpoint-slice', 'pod-payments', 'pod-worker'],
        tone: 'translated',
      },
      {
        title: 'O EndpointSlice guarda os endpoints prontos',
        packet: 'EndpointSlice: [10.244.2.21:8443, 10.244.2.45:8443]',
        explanation:
          'EndpointSlices escalam melhor que o antigo objeto Endpoints e incluem readiness, topologia, tipo de endereço, portas e metadados do endpoint.',
        mutation: 'Agora o Service tem IPs e portas de endpoint concretos.',
        highlights: ['endpoint-slice', 'pod-payments', 'pod-worker'],
        tone: 'translated',
      },
      {
        title: 'O dataplane observa os EndpointSlices',
        packet: 'watch EndpointSlice -> program Service load balancing',
        explanation:
          'O kube-proxy ou um CNI eBPF observa os EndpointSlices e programa o datapath local para que o tráfego do ClusterIP seja traduzido para um Pod real.',
        mutation: 'Os dados dos endpoints viram estado de roteamento do kernel, NAT, IPVS ou eBPF.',
        highlights: ['endpoint-slice', 'kube-proxy', 'service'],
        tone: 'translated',
      },
      {
        title: 'O Service headless dispensa o VIP',
        packet: 'clusterIP=None -> DNS A records: 10.244.2.21, 10.244.2.45',
        explanation:
          'Um Service headless não aloca ClusterIP. O DNS pode devolver os IPs dos Pods diretamente, o que é comum em StatefulSets e em clientes que precisam descobrir os pares diretamente.',
        mutation: 'O DNS devolve IPs de Pod em vez de um IP virtual de Service.',
        highlights: ['dns', 'endpoint-slice', 'pod-payments', 'pod-worker'],
        tone: 'translated',
      },
    ],
  },
  {
    id: 'ingress',
    title: 'Do Ingress ao Pod',
    subtitle: 'Caminho do tráfego norte-sul',
    lesson:
      'Ingress é roteamento HTTP na borda. Normalmente aponta para Services, e os Services apontam para os Pods endpoint.',
    icon: Globe,
    steps: [
      {
        title: 'O cliente externo chega à borda',
        packet: 'client -> load balancer / ingress IP',
        explanation:
          'O tráfego de fora do cluster chega primeiro a um load balancer, a uma node port ou ao endpoint do ingress controller.',
        mutation: 'O pacote atravessa de fora do cluster para a borda do Kubernetes.',
        highlights: ['internet', 'ingress', 'ingress-link'],
        tone: 'external',
      },
      {
        title: 'O Ingress aplica o roteamento HTTP',
        packet: 'Host: shop.example.com, Path: /checkout',
        explanation:
          'O ingress controller casa as regras de host e path e encaminha para o Service backend configurado.',
        mutation: 'O roteamento L7 escolhe o Service payments.',
        highlights: ['ingress', 'service'],
        tone: 'external',
      },
      {
        title: 'O Service escolhe um Pod backend',
        packet: 'Service VIP -> endpoint 10.244.2.21:8443',
        explanation:
          'É o Service que continua escolhendo o endpoint. O ingress controller não fixa IPs de Pods no código.',
        mutation: 'O destino passa a ser o Pod endpoint escolhido.',
        highlights: ['service', 'kube-proxy', 'pod-payments'],
        tone: 'translated',
      },
      {
        title: 'A resposta volta pela borda',
        packet: 'pod -> service path -> ingress -> client',
        explanation:
          'Preservar o IP de origem depende do load balancer, do modo de proxy e da configuração de externalTrafficPolicy.',
        mutation: 'O usuário recebe a resposta da borda pública, não de um IP de Pod.',
        highlights: ['pod-payments', 'ingress', 'internet'],
        tone: 'external',
      },
    ],
  },
  {
    id: 'load-balancer',
    title: 'LoadBalancer e NodePort',
    subtitle: 'Do IP externo ao backend do Service',
    lesson:
      'Um Service LoadBalancer normalmente expõe um load balancer de nuvem que aponta para node ports, e o Kubernetes encaminha para um endpoint do Service.',
    icon: Cloud,
    steps: [
      {
        title: 'O cliente chega ao load balancer da nuvem',
        packet: 'client 203.0.113.8 -> 198.51.100.40:443',
        explanation:
          'O IP público do LoadBalancer fica fora do cluster. O load balancer do provedor encaminha o tráfego para um ou mais nodes do Kubernetes.',
        mutation: 'O tráfego entra pela infraestrutura do provedor antes de chegar a um node.',
        highlights: ['internet', 'load-balancer', 'ingress-link'],
        tone: 'external',
      },
      {
        title: 'O load balancer aponta para uma NodePort',
        packet: '198.51.100.40:443 -> node-a:30443',
        explanation:
          'Por baixo dos panos, um Service LoadBalancer costuma alocar uma NodePort. O load balancer externo manda o tráfego para essa porta nos nodes elegíveis.',
        mutation: 'O destino passa a ser um IP de node mais a NodePort alocada.',
        highlights: ['load-balancer', 'node-a', 'nodeport'],
        tone: 'external',
      },
      {
        title: 'A NodePort é mapeada para o Service',
        packet: 'node-a:30443 -> Service 10.96.12.40:443',
        explanation:
          'O datapath do node trata a NodePort como porta de entrada do Service e depois aplica a escolha normal de endpoint do Service.',
        mutation: 'O tráfego da NodePort é traduzido em tráfego para o backend do Service.',
        highlights: ['node-a', 'nodeport', 'service', 'kube-proxy'],
        tone: 'translated',
      },
      {
        title: 'O externalTrafficPolicy muda o trade-off',
        packet: 'Cluster: backends mais distribuídos, Local: preserva o IP de origem',
        explanation:
          'externalTrafficPolicy=Cluster pode encaminhar para endpoints em qualquer node, mas pode esconder o IP original do cliente. Local preserva o IP de origem usando só endpoints do próprio node, mas nodes sem endpoints locais não devem receber tráfego.',
        mutation: 'O mesmo Service público passa a ter outro comportamento de roteamento e observabilidade.',
        highlights: ['load-balancer', 'node-a', 'service', 'pod-payments'],
        tone: 'external',
      },
    ],
  },
  {
    id: 'network-policy',
    title: 'NetworkPolicy',
    subtitle: 'Permitir é uma decisão de policy',
    lesson:
      'NetworkPolicy é uma API do Kubernetes, mas quem aplica é um plugin CNI com suporte a policy.',
    icon: Shield,
    steps: [
      {
        title: 'Nenhuma policy seleciona o backend',
        packet: 'frontend -> payments:8443 allowed',
        explanation:
          'Se nenhuma NetworkPolicy seleciona um Pod, a semântica de network policy do Kubernetes o deixa sem isolamento, supondo que o cluster não tenha uma policy externa mais restrita.',
        mutation: 'O tráfego é permitido por padrão.',
        highlights: ['pod-frontend', 'pod-payments', 'policy'],
      },
      {
        title: 'O default deny isola o backend',
        packet: 'frontend -> payments:8443 blocked',
        explanation:
          'Quando uma policy seleciona o Pod payments para ingress e não há regra de allow correspondente, o tráfego de entrada é negado.',
        mutation: 'O pacote é descartado antes de a aplicação vê-lo.',
        highlights: ['pod-frontend', 'policy', 'pod-payments'],
        tone: 'blocked',
      },
      {
        title: 'A regra de allow casa labels e porta',
        packet: 'allow from app=frontend to port 8443',
        explanation:
          'Regras de NetworkPolicy casam peers, namespaces, blocos de IP, portas e direção. As labels são o ponto de controle estável.',
        mutation: 'O mesmo pacote agora é permitido porque casa com a policy.',
        highlights: ['pod-frontend', 'policy', 'pod-payments'],
      },
      {
        title: 'O CNI aplica a decisão',
        packet: 'policy verdict: forward',
        explanation:
          'O objeto da API sozinho não filtra pacotes. O plugin CNI precisa implementar NetworkPolicy para a policy ter efeito.',
        mutation: 'A aplicação da policy acontece no datapath, não na aplicação.',
        highlights: ['cni-a', 'policy', 'cni-b'],
      },
    ],
  },
  {
    id: 'egress',
    title: 'Egress do Pod para a internet',
    subtitle: 'Saindo do cluster',
    lesson:
      'Dentro do cluster, IPs de Pod são roteáveis. Na internet, normalmente não são, então o egress costuma usar SNAT no node ou um gateway.',
    icon: Server,
    steps: [
      {
        title: 'O Pod chama uma API externa',
        packet: 'src=10.244.1.12 -> dst=140.82.112.6:443',
        explanation:
          'O destino está fora do CIDR do cluster, então o pacote segue a rota padrão do node em vez da rota da rede de Pods.',
        mutation: 'O destino é externo; a origem ainda é o IP do Pod dentro do node.',
        highlights: ['pod-frontend', 'internet', 'egress-link'],
        tone: 'external',
      },
      {
        title: 'O node prepara o egress para a internet',
        packet: 'SNAT 10.244.1.12 -> node-a primary IP',
        explanation:
          'A maioria dos clusters traduz o IP de origem do Pod para um IP de node ou de gateway antes de mandar o tráfego para a internet.',
        mutation: 'O endereço de origem muda para que a rede externa tenha uma rota de volta.',
        highlights: ['node-a', 'cni-a', 'internet'],
        tone: 'translated',
      },
      {
        title: 'A policy de egress pode restringir destinos',
        packet: 'allow *.github.com:443, deny 0.0.0.0/0 otherwise',
        explanation:
          'Alguns CNIs aplicam a policy de egress antes do SNAT, preservando a identidade do workload para as decisões de policy.',
        mutation: 'A decisão de policy acontece antes de o pacote sair do cluster.',
        highlights: ['policy', 'pod-frontend', 'internet'],
        tone: 'blocked',
      },
      {
        title: 'A resposta é rastreada de volta ao Pod',
        packet: 'external API -> node IP -> 10.244.1.12',
        explanation:
          'O connection tracking associa a resposta à conexão original do Pod e a devolve ao network namespace correto.',
        mutation: 'O Pod recebe a resposta como se tivesse falado diretamente com o serviço externo.',
        highlights: ['internet', 'node-a', 'pod-frontend'],
        tone: 'external',
      },
    ],
  },
];

function getScenario(id: ScenarioId): Scenario {
  return SCENARIOS.find((scenario) => scenario.id === id) ?? SCENARIOS[0]!;
}

function toneLabel(tone: PacketTone | undefined) {
  if (tone === 'translated') return 'traduzido';
  if (tone === 'blocked') return 'bloqueado';
  if (tone === 'external') return 'externo';
  return 'encaminhado';
}

export default function KubernetesNetworkingCniSimulator() {
  const [scenarioId, setScenarioId] = useState<ScenarioId>('same-node');
  const [dataplane, setDataplane] = useState<Dataplane>('overlay');
  const [externalTrafficPolicy, setExternalTrafficPolicy] = useState<ExternalTrafficPolicy>('Cluster');
  const [stepIndex, setStepIndex] = useState(0);

  const scenario = getScenario(scenarioId);
  const step = scenario.steps[stepIndex] ?? scenario.steps[0]!;
  const progress = ((stepIndex + 1) / scenario.steps.length) * 100;
  const dataplaneCopy = DATAPLANES[dataplane];

  const scenarioCompletedCount = useMemo(() => {
    return stepIndex === scenario.steps.length - 1 ? 1 : 0;
  }, [scenario.steps.length, stepIndex]);

  const chooseScenario = (nextScenario: ScenarioId) => {
    setScenarioId(nextScenario);
    setStepIndex(0);
  };

  const nextStep = () => {
    setStepIndex((current) => (current < scenario.steps.length - 1 ? current + 1 : 0));
  };

  const previousStep = () => {
    setStepIndex((current) => (current > 0 ? current - 1 : scenario.steps.length - 1));
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName;
      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') return;

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setStepIndex((current) => (current < scenario.steps.length - 1 ? current + 1 : 0));
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setStepIndex((current) => (current > 0 ? current - 1 : scenario.steps.length - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scenario.steps.length]);

  const reset = () => {
    setScenarioId('same-node');
    setDataplane('overlay');
    setExternalTrafficPolicy('Cluster');
    setStepIndex(0);
  };

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-md border bg-muted/20 p-3 sm:p-4">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <div className="rounded-md border border-primary/30 bg-primary/10 p-2 text-primary">
              <Network className="h-6 w-6" />
            </div>
            <div>
              <p className="font-mono text-xs text-muted-foreground">// laboratório do caminho do pacote</p>
              <h2 className="text-2xl font-bold md:text-3xl">
                Simulador de rede do Kubernetes / CNI
              </h2>
            </div>
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Acompanhe pacotes pelo roteamento de IPs de Pod, dataplanes CNI, Services ClusterIP, tradução
            via kube-proxy ou eBPF, Ingress, NetworkPolicy e egress para a internet.
          </p>
        </div>

        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Caminho atual</span>
              <span className="text-sm text-muted-foreground">
                Salto {stepIndex + 1}/{scenario.steps.length}
              </span>
            </div>
            <Progress value={progress} />
            <div className="grid grid-cols-3 gap-2 text-center">
              <Metric label="Nodes" value="2" />
              <Metric label="Pod CIDRs" value="2" />
              <Metric label="Dataplane" value={dataplaneCopy.shortLabel} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="h-5 w-5" />
                Cenários de pacote
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4 pt-0">
              {SCENARIOS.map((candidate) => {
                const active = candidate.id === scenarioId;
                const Icon = candidate.icon;

                return (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => chooseScenario(candidate.id)}
                    className={cn(
                      'w-full rounded-md border p-2.5 text-left transition-colors',
                      active
                        ? 'border-primary/60 bg-primary/10'
                        : 'border-border hover:border-primary/40 hover:bg-muted/30'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('rounded-md border p-1.5', active ? 'text-primary' : 'text-muted-foreground')}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{candidate.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{candidate.subtitle}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Route className="h-5 w-5" />
                Dataplane do CNI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-0">
              <div className="grid gap-2">
                {(Object.keys(DATAPLANES) as Dataplane[]).map((mode) => (
                  <Button
                    key={mode}
                    type="button"
                    variant={dataplane === mode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDataplane(mode)}
                    className="justify-start"
                  >
                    {DATAPLANES[mode].label}
                  </Button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">{dataplaneCopy.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="h-5 w-5" />
                Tráfego externo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-0">
              <div className="grid grid-cols-2 gap-2">
                {(['Cluster', 'Local'] as ExternalTrafficPolicy[]).map((policy) => (
                  <Button
                    key={policy}
                    type="button"
                    variant={externalTrafficPolicy === policy ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setExternalTrafficPolicy(policy)}
                  >
                    {policy}
                  </Button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {externalTrafficPolicy === 'Cluster'
                  ? 'O modo Cluster pode espalhar o tráfego para endpoints em qualquer node, muitas vezes com um salto extra.'
                  : 'O modo Local preserva o IP de origem do cliente, mas só nodes com endpoints locais devem receber tráfego.'}
              </p>
            </CardContent>
          </Card>

          <Button size="sm" variant="outline" onClick={reset} className="w-full">
            <RotateCcw className="mr-1 h-4 w-4" />
            Reiniciar laboratório
          </Button>
        </div>

        <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <Card className="border-primary/40">
              <CardContent className="space-y-3 p-3 sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{scenario.title}</Badge>
                      <Badge>{toneLabel(step.tone)}</Badge>
                    </div>
                    <p className="text-sm font-medium sm:text-base">{step.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{scenario.lesson}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" variant="outline" onClick={previousStep}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button size="sm" onClick={nextStep}>
                      <Play className="mr-1 h-4 w-4" />
                      Próximo salto
                    </Button>
                    <Button size="sm" variant="outline" onClick={nextStep}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Progress value={progress} />
              </CardContent>
            </Card>

            <PacketFlowDiagram
              steps={scenario.steps}
              currentIndex={stepIndex}
              onSelect={setStepIndex}
            />

            <CurrentHopDetails step={step} />
          </div>

          <div className="space-y-4">
            <ClusterContextMap
              step={step}
              dataplane={dataplane}
              scenarioId={scenarioId}
              externalTrafficPolicy={externalTrafficPolicy}
            />
            <LearningNotes
              step={step}
              dataplane={dataplane}
              scenarioId={scenarioId}
              externalTrafficPolicy={externalTrafficPolicy}
              scenarioCompletedCount={scenarioCompletedCount}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/30 p-2">
      <p className="truncate text-sm font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function PacketFlowDiagram({
  steps,
  currentIndex,
  onSelect,
}: {
  steps: PacketStep[];
  currentIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <Card className="border-primary/30">
      <CardHeader className="p-4 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowRight className="h-5 w-5" />
            Fluxo do pacote
          </CardTitle>
          <Badge variant="secondary" className="font-mono text-[11px]">
            {steps.length} hops
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid gap-2 lg:grid-cols-4">
          {steps.map((candidate, index) => {
            const active = index === currentIndex;
            const complete = index < currentIndex;

            return (
              <button
                key={candidate.title}
                type="button"
                onClick={() => onSelect(index)}
                className={cn(
                  'relative min-w-0 rounded-md border p-3 text-left transition-colors',
                  active
                    ? 'border-primary/60 bg-primary/10'
                    : complete
                      ? 'border-emerald-500/30 bg-emerald-500/10'
                      : 'border-border hover:border-primary/40 hover:bg-muted/40'
                )}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold',
                      active && 'border-primary bg-primary text-primary-foreground',
                      complete && 'border-emerald-500 bg-emerald-500 text-white'
                    )}
                  >
                    {complete ? <CheckCircle className="h-3 w-3" /> : index + 1}
                  </span>
                  <span className="min-w-0 text-xs font-semibold leading-snug">{candidate.title}</span>
                </div>
                <p className="break-words font-mono text-[11px] leading-snug text-muted-foreground">
                  {candidate.packet}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Badge variant={active ? 'default' : 'secondary'} className="text-[10px]">
                    {toneLabel(candidate.tone)}
                  </Badge>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function CurrentHopDetails({ step }: { step: PacketStep }) {
  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ArrowRight className="h-5 w-5" />
          Salto atual
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 p-4 pt-0 md:grid-cols-2">
        <div className="rounded-md border bg-muted/20 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pacote</p>
          <p className="mt-2 break-words font-mono text-sm">{step.packet}</p>
        </div>
        <div className="rounded-md border bg-muted/20 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Mudança</p>
          <p className="mt-2 text-sm text-muted-foreground">{step.mutation}</p>
        </div>
        <div className="rounded-md border border-primary/25 bg-primary/5 p-3 md:col-span-2">
          <p className="text-sm leading-relaxed text-muted-foreground">{step.explanation}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ClusterContextMap({
  step,
  dataplane,
  scenarioId,
  externalTrafficPolicy,
}: {
  step: PacketStep;
  dataplane: Dataplane;
  scenarioId: ScenarioId;
  externalTrafficPolicy: ExternalTrafficPolicy;
}) {
  const active = (id: string) => step.highlights.includes(id);
  const blocked = step.tone === 'blocked';
  const translated = step.tone === 'translated';
  const resources: Array<{
    id: string;
    title: string;
    detail: string;
    icon: ReactNode;
    show: boolean;
    active: boolean;
    blocked?: boolean;
  }> = [
    {
      id: 'internet',
      title: scenarioId === 'ingress' || scenarioId === 'load-balancer' ? 'Cliente externo' : 'Internet',
      detail: scenarioId === 'ingress' || scenarioId === 'load-balancer' ? '203.0.113.8' : 'API pública',
      icon: <Globe className="h-4 w-4" />,
      show: active('internet') || scenarioId === 'ingress' || scenarioId === 'load-balancer' || scenarioId === 'egress',
      active: active('internet'),
    },
    {
      id: 'load-balancer',
      title: 'LoadBalancer',
      detail: '198.51.100.40:443',
      icon: <Cloud className="h-4 w-4" />,
      show: active('load-balancer') || scenarioId === 'load-balancer',
      active: active('load-balancer'),
    },
    {
      id: 'nodeport',
      title: 'NodePort',
      detail: 'node IP:30443',
      icon: <Server className="h-4 w-4" />,
      show: active('nodeport') || scenarioId === 'load-balancer',
      active: active('nodeport'),
    },
    {
      id: 'ingress',
      title: 'Ingress',
      detail: 'roteamento por host/path',
      icon: <Server className="h-4 w-4" />,
      show: active('ingress') || scenarioId === 'ingress',
      active: active('ingress'),
    },
    {
      id: 'service',
      title: 'Service',
      detail: '10.96.12.40:443',
      icon: <Layers className="h-4 w-4" />,
      show: active('service') || ['cluster-ip', 'service-discovery', 'ingress', 'load-balancer'].includes(scenarioId),
      active: active('service'),
    },
    {
      id: 'endpoint-slice',
      title: 'EndpointSlice',
      detail: '10.244.2.21, 10.244.2.45',
      icon: <Layers className="h-4 w-4" />,
      show: active('endpoint-slice') || scenarioId === 'service-discovery',
      active: active('endpoint-slice'),
    },
    {
      id: 'policy',
      title: 'NetworkPolicy',
      detail: blocked ? 'verdict: drop' : 'verdict: forward',
      icon: blocked ? <AlertTriangle className="h-4 w-4" /> : <Shield className="h-4 w-4" />,
      show: active('policy') || scenarioId === 'network-policy' || scenarioId === 'egress',
      active: active('policy'),
      blocked: blocked && active('policy'),
    },
    {
      id: 'external-policy',
      title: 'externalTrafficPolicy',
      detail: `${externalTrafficPolicy}: ${
        externalTrafficPolicy === 'Local' ? 'preserva o IP de origem' : 'distribui entre nodes'
      }`,
      icon: <Route className="h-4 w-4" />,
      show: scenarioId === 'load-balancer',
      active: active('load-balancer') || active('nodeport'),
    },
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/20 p-4 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Network className="h-5 w-5" />
            Mapa do cluster
          </CardTitle>
          <Badge variant={blocked ? 'destructive' : translated ? 'default' : 'secondary'}>
            só contexto
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative overflow-hidden bg-gradient-to-br from-background via-muted/20 to-primary/5 p-3">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:42px_42px] opacity-20" />

          <p className="relative z-10 mb-3 font-mono text-xs text-muted-foreground">
            cluster.local / pod network 10.244.0.0/16
          </p>

          <div className="relative z-10 grid gap-3">
            <div className="space-y-3">
              <NodeBox
                id="node-a"
                title="node-a"
                cidr="PodCIDR 10.244.1.0/24"
                active={active('node-a')}
                cniActive={active('cni-a')}
              >
                <PodCard
                  id="pod-frontend"
                  title="frontend"
                  ip="10.244.1.12"
                  labels="app=frontend"
                  active={active('pod-frontend')}
                />
                <PodCard
                  id="pod-api"
                  title="api"
                  ip="10.244.1.34"
                  labels="app=api"
                  active={active('pod-api')}
                />
              </NodeBox>

              <AuxiliaryCard
                id="dns"
                title="CoreDNS"
                detail="svc DNS -> ClusterIP"
                icon={<Network className="h-4 w-4" />}
                active={active('dns')}
              />
            </div>

            <div className="flex items-center justify-center gap-3 py-1">
              <Badge variant="outline" className="text-center text-[11px]">
                {DATAPLANES[dataplane].shortLabel}
              </Badge>
              <div
                className={cn(
                  'relative h-1 min-w-20 flex-1 overflow-hidden rounded-full bg-border',
                  active('node-fabric') && 'bg-primary/25'
                )}
              >
                {active('node-fabric') && (
                  <motion.div
                    className="absolute left-0 top-0 h-1 w-12 rounded-full bg-primary"
                    animate={{ x: ['0%', '650%'] }}
                    transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
                  />
                )}
              </div>
            </div>

            <div className="space-y-3">
              <NodeBox
                id="node-b"
                title="node-b"
                cidr="PodCIDR 10.244.2.0/24"
                active={active('node-b')}
                cniActive={active('cni-b')}
              >
                <PodCard
                  id="pod-payments"
                  title="payments"
                  ip="10.244.2.21"
                  labels="app=payments"
                  active={active('pod-payments')}
                  blocked={blocked && active('pod-payments')}
                />
                <PodCard
                  id="pod-worker"
                  title="worker"
                  ip="10.244.2.45"
                  labels="app=worker"
                  active={active('pod-worker')}
                />
              </NodeBox>

              <AuxiliaryCard
                id="kube-proxy"
                title={dataplane === 'ebpf' ? 'eBPF Service LB' : 'kube-proxy'}
                detail={dataplane === 'ebpf' ? 'socket / tc hooks' : 'iptables ou IPVS'}
                icon={<Zap className="h-4 w-4" />}
                active={active('kube-proxy')}
              />
            </div>
          </div>

          <div className="relative z-10 mt-3 grid gap-2 sm:grid-cols-2">
            {resources
              .filter((resource) => resource.show)
              .map((resource) => (
                <AuxiliaryCard
                  key={resource.id}
                  id={resource.id}
                  title={resource.title}
                  detail={resource.detail}
                  icon={resource.icon}
                  active={resource.active}
                  blocked={resource.blocked}
                />
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NodeBox({
  title,
  cidr,
  active,
  cniActive,
  children,
}: {
  id: string;
  title: string;
  cidr: string;
  active: boolean;
  cniActive: boolean;
  children: ReactNode;
}) {
  return (
    <div className={cn('rounded-lg border bg-card/90 p-3 shadow-sm', active && 'border-primary/60 bg-primary/10')}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{title}</p>
          <p className="font-mono text-xs text-muted-foreground">{cidr}</p>
        </div>
        <Badge variant={active ? 'default' : 'secondary'}>Ready</Badge>
      </div>
      <div className="grid gap-2">{children}</div>
      <div
        className={cn(
          'mt-3 rounded-md border p-2 text-xs text-muted-foreground',
          cniActive && 'border-primary/50 bg-primary/10 text-foreground'
        )}
      >
        <div className="flex items-center gap-2">
          <Route className="h-4 w-4" />
          Agente CNI: IPAM, rotas, veth, hooks de policy
        </div>
      </div>
    </div>
  );
}

function PodCard({
  title,
  ip,
  labels,
  active,
  blocked,
}: {
  id: string;
  title: string;
  ip: string;
  labels: string;
  active: boolean;
  blocked?: boolean;
}) {
  return (
    <div
      className={cn(
        'min-w-0 rounded-md border bg-background/80 p-2.5 transition-colors',
        active && 'border-primary/60 bg-primary/10',
        blocked && 'border-red-500/50 bg-red-500/10'
      )}
    >
      <div className="mb-2 flex min-w-0 items-center gap-2">
        <Boxes className={cn('h-4 w-4 shrink-0', active && 'text-primary', blocked && 'text-red-500')} />
        <p className="min-w-0 truncate text-sm font-semibold">{title}</p>
      </div>
      <p className="break-all font-mono text-xs leading-snug">{ip}</p>
      <p className="mt-1 break-all text-xs leading-snug text-muted-foreground">{labels}</p>
    </div>
  );
}

function AuxiliaryCard({
  title,
  detail,
  icon,
  active,
  blocked,
}: {
  id: string;
  title: string;
  detail: string;
  icon: ReactNode;
  active: boolean;
  blocked?: boolean;
}) {
  return (
    <div
      className={cn(
        'min-w-0 rounded-md border bg-card/90 p-3 transition-colors',
        active && 'border-primary/60 bg-primary/10',
        blocked && 'border-red-500/50 bg-red-500/10'
      )}
    >
      <div className="mb-1 flex min-w-0 items-center gap-2">
        <div className={cn('shrink-0 text-muted-foreground', active && 'text-primary', blocked && 'text-red-500')}>{icon}</div>
        <p className="min-w-0 truncate text-sm font-semibold">{title}</p>
      </div>
      <p className="break-words text-xs leading-snug text-muted-foreground">{detail}</p>
    </div>
  );
}

function LearningNotes({
  step,
  dataplane,
  scenarioId,
  externalTrafficPolicy,
  scenarioCompletedCount,
}: {
  step: PacketStep;
  dataplane: Dataplane;
  scenarioId: ScenarioId;
  externalTrafficPolicy: ExternalTrafficPolicy;
  scenarioCompletedCount: number;
}) {
  const scenarioNote =
    scenarioId === 'network-policy'
      ? 'NetworkPolicy exige um plugin CNI compatível. O objeto da policy pode existir e o tráfego continuar passando se o plugin não a aplicar.'
      : scenarioId === 'cluster-ip'
        ? 'Um ClusterIP é um destino virtual. O endpoint real é escolhido pelo kube-proxy ou por um datapath CNI que o substitui.'
        : scenarioId === 'service-discovery'
          ? 'Os EndpointSlices ligam o selector de um Service aos IPs concretos dos Pods que recebem o tráfego.'
          : scenarioId === 'load-balancer'
            ? externalTrafficPolicy === 'Local'
              ? 'Local preserva o IP de origem do cliente, mas nodes sem endpoints locais não são destinos válidos.'
              : 'Cluster maximiza a disponibilidade de endpoints, mas o salto extra pode esconder o IP de origem do cliente.'
            : scenarioId === 'egress'
              ? 'O egress para a internet costuma usar SNAT porque os Pod CIDRs normalmente não são roteáveis fora do cluster.'
              : 'O Kubernetes espera que Pods e nodes alcancem IPs de Pod sem que a aplicação precise saber disso.';

  const facts = [
    'O CNI configura a rede do Pod quando a sandbox do Pod é criada.',
    'Services são portas de entrada virtuais e estáveis para Pods endpoint que mudam.',
    'EndpointSlices publicam os endereços concretos dos backends por trás dos Services.',
    'A NetworkPolicy é aplicada pelo plugin de rede, não pelo kube-apiserver.',
  ];

  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <LockKeyhole className="h-5 w-5" />
          Notas de aprendizado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-4 pt-0">
        <div className="grid gap-2">
          <div className="rounded-md border bg-muted/20 p-2.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Veredito</p>
            <div className="mt-1.5 flex items-center gap-2">
            {step.tone === 'blocked' ? (
              <AlertTriangle className="h-5 w-5 text-red-500" />
            ) : (
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            )}
            <span className="font-medium">{toneLabel(step.tone)}</span>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-1">
            <InspectorRow label="Dataplane" value={DATAPLANES[dataplane].label} />
            <InspectorRow label="Concluído" value={scenarioCompletedCount ? 'sim' : 'ainda não'} />
          </div>
        </div>

        <InsightDisclosure title="Por que importa" defaultOpen>
          <p>{scenarioNote}</p>
        </InsightDisclosure>

        <InsightDisclosure title="Detalhes do dataplane">
          <div className="space-y-2">
            <p>{DATAPLANES[dataplane].description}</p>
            <p>{DATAPLANES[dataplane].servicePath}</p>
            <p>{DATAPLANES[dataplane].crossNodePath}</p>
            <p>
              {externalTrafficPolicy === 'Local'
                ? 'externalTrafficPolicy=Local preserva o IP de origem do cliente e usa só endpoints do próprio node.'
                : 'externalTrafficPolicy=Cluster pode rotear para qualquer endpoint, muitas vezes ao custo de perder o IP de origem.'}
            </p>
          </div>
        </InsightDisclosure>

        <InsightDisclosure title="Modelo mental">
          <div className="space-y-2">
            {facts.map((fact) => (
              <div key={fact} className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <p>{fact}</p>
              </div>
            ))}
          </div>
        </InsightDisclosure>
      </CardContent>
    </Card>
  );
}

function InspectorRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-2.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm text-muted-foreground">{value}</p>
    </div>
  );
}

function InsightDisclosure({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="group rounded-md border bg-muted/20 p-2.5" open={defaultOpen}>
      <summary className="cursor-pointer list-none text-sm font-medium">
        <span className="inline-flex items-center gap-2">
          <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
          {title}
        </span>
      </summary>
      <div className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </details>
  );
}
