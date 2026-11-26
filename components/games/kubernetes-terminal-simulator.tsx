'use client';

import type { ReactNode } from 'react';
import { useCallback, useState } from 'react';
import {
  Boxes,
  CheckCircle,
  CircleDot,
  Cloud,
  Code2,
  FileText,
  Globe,
  Lightbulb,
  Network,
  Play,
  RotateCcw,
  Server,
  Terminal,
  Trophy,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  useTerminalSimulator,
  type ExecuteResult,
  type TerminalLine,
} from '@/hooks/use-terminal-simulator';

type PodPhase = 'Running' | 'Pending' | 'CrashLoopBackOff';

interface KubeNode {
  name: string;
  status: 'Ready' | 'NotReady';
  role: 'control-plane' | 'worker';
  version: string;
  cpu: string;
  memory: string;
}

interface KubePod {
  name: string;
  app: string;
  image: string;
  status: PodPhase;
  restarts: number;
  age: string;
  node: string;
  logs: string[];
}

interface KubeDeployment {
  name: string;
  image: string;
  replicas: number;
  readyReplicas: number;
  generation: number;
  strategy: 'RollingUpdate' | 'Recreate';
}

interface KubeService {
  name: string;
  type: 'ClusterIP' | 'NodePort' | 'LoadBalancer';
  selector: string;
  port: number;
  targetPort: number;
  clusterIP: string;
}

interface KubeConfigMap {
  name: string;
  data: Record<string, string>;
}

interface KubeEvent {
  type: 'Normal' | 'Warning';
  reason: string;
  object: string;
  message: string;
}

interface KubeClusterState {
  context: string;
  namespace: string;
  nodes: KubeNode[];
  deployments: KubeDeployment[];
  pods: KubePod[];
  services: KubeService[];
  configMaps: KubeConfigMap[];
  events: KubeEvent[];
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  commands: LessonCommand[];
}

interface LessonCommand {
  instruction: string;
  hint: string;
  expectedCommand: string | string[];
  explanation: string;
}


const SAMPLE_DEPLOYMENT = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: nginx
          image: nginx:1.27
          ports:
            - containerPort: 80`;

const SAMPLE_SERVICE = `apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  type: ClusterIP
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 80`;

const LESSONS: Lesson[] = [
  {
    id: 'cluster',
    title: 'Básico do cluster',
    description: 'Inspecione o contexto atual, o API server e os nodes',
    icon: <Cloud className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Comece verificando as versões do kubectl e do cluster.',
        hint: 'Use "kubectl version --short".',
        expectedCommand: ['kubectl version --short', 'kubectl version'],
        explanation:
          'O kubectl conversa com o API server do Kubernetes. Checar a versão confirma que o cliente alcança o cluster.',
      },
      {
        instruction: 'Mostre o contexto ativo do kubeconfig.',
        hint: 'Use "kubectl config current-context".',
        expectedCommand: 'kubectl config current-context',
        explanation:
          'O contexto define qual cluster e qual namespace o kubectl usa. Sempre confira antes de mexer em produção.',
      },
      {
        instruction: 'Mostre os endpoints do control plane do cluster.',
        hint: 'Use "kubectl cluster-info".',
        expectedCommand: 'kubectl cluster-info',
        explanation:
          'O cluster-info é um teste rápido de acesso à API e mostra onde ficam os serviços do control plane.',
      },
      {
        instruction: 'Liste todos os nodes, workers e control plane.',
        hint: 'Use "kubectl get nodes".',
        expectedCommand: 'kubectl get nodes',
        explanation:
          'Nodes são as máquinas que rodam os Pods. O readiness dos nodes é o primeiro sinal da capacidade do cluster.',
      },
    ],
  },
  {
    id: 'workloads',
    title: 'Pods e Deployments',
    description: 'Crie um Deployment e inspecione os Pods que ele gerencia',
    icon: <Boxes className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Leia o manifesto de Deployment de exemplo.',
        hint: 'Use "cat deployment.yaml".',
        expectedCommand: 'cat deployment.yaml',
        explanation:
          'Um Deployment descreve o estado desejado: número de réplicas, labels, template do Pod e estratégia de rollout.',
      },
      {
        instruction: 'Crie um Deployment web pela linha de comando.',
        hint: 'Use "kubectl create deployment web --image=nginx:1.27".',
        expectedCommand: [
          'kubectl create deployment web --image=nginx:1.27',
          'kubectl create deployment web --image nginx:1.27',
        ],
        explanation:
          'O controller do Deployment cria um ReplicaSet, e o ReplicaSet cria Pods até chegar ao estado desejado.',
      },
      {
        instruction: 'Liste os Deployments do namespace default.',
        hint: 'Use "kubectl get deployments".',
        expectedCommand: ['kubectl get deployments', 'kubectl get deploy'],
        explanation:
          'Os Deployments mostram as réplicas desejadas, as disponíveis e se o rollout terminou.',
      },
      {
        instruction: 'Liste os Pods criados pelo Deployment.',
        hint: 'Use "kubectl get pods".',
        expectedCommand: ['kubectl get pods', 'kubectl get po'],
        explanation:
          'Pods são a menor unidade que pode ser agendada. Deployments são donos de ReplicaSets, e ReplicaSets são donos de Pods.',
      },
    ],
  },
  {
    id: 'services',
    title: 'Services e rede',
    description: 'Exponha Pods com um IP virtual estável e um selector',
    icon: <Network className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Leia o manifesto de Service de exemplo.',
        hint: 'Use "cat service.yaml".',
        expectedCommand: 'cat service.yaml',
        explanation:
          'Services selecionam Pods por labels e oferecem um endpoint estável mesmo quando os Pods são trocados.',
      },
      {
        instruction: 'Exponha o Deployment web na porta 80.',
        hint: 'Use "kubectl expose deployment web --port=80 --target-port=80".',
        expectedCommand: [
          'kubectl expose deployment web --port=80 --target-port=80',
          'kubectl expose deployment web --port 80 --target-port 80',
        ],
        explanation:
          'Um Service ClusterIP dá ao Deployment um nome DNS interno e um IP virtual estáveis.',
      },
      {
        instruction: 'Liste os Services do namespace.',
        hint: 'Use "kubectl get svc".',
        expectedCommand: ['kubectl get svc', 'kubectl get services'],
        explanation:
          'Services são o jeito normal de outros workloads acharem seus Pods sem conhecer os IPs deles.',
      },
      {
        instruction: 'Descreva o Service web e inspecione o selector dele.',
        hint: 'Use "kubectl describe svc web".',
        expectedCommand: ['kubectl describe svc web', 'kubectl describe service web'],
        explanation:
          'O describe mostra selectors, portas, endpoints e eventos. É um dos comandos mais rápidos para depurar rede.',
      },
    ],
  },
  {
    id: 'rollouts',
    title: 'Escala e rollouts',
    description: 'Escale réplicas e faça uma atualização gradual de imagem',
    icon: <Play className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Escale o Deployment web para quatro réplicas.',
        hint: 'Use "kubectl scale deployment web --replicas=4".',
        expectedCommand: [
          'kubectl scale deployment web --replicas=4',
          'kubectl scale deployment/web --replicas=4',
          'kubectl scale deployment web --replicas 4',
          'kubectl scale deployment/web --replicas 4',
        ],
        explanation:
          'Escalar muda o estado desejado. O controller do Deployment cria ou remove Pods até a realidade bater.',
      },
      {
        instruction: 'Acompanhe o status do rollout do Deployment.',
        hint: 'Use "kubectl rollout status deployment/web".',
        expectedCommand: 'kubectl rollout status deployment/web',
        explanation:
          'O rollout status fica esperando até o Deployment ter o número esperado de Pods disponíveis.',
      },
      {
        instruction: 'Atualize a imagem do container nginx para uma tag mais nova.',
        hint: 'Use "kubectl set image deployment/web nginx=nginx:1.28".',
        expectedCommand: 'kubectl set image deployment/web nginx=nginx:1.28',
        explanation:
          'Mudar o template do Pod inicia um novo rollout. O Kubernetes troca os Pods aos poucos pela imagem nova.',
      },
      {
        instruction: 'Mostre o histórico de rollouts do Deployment.',
        hint: 'Use "kubectl rollout history deployment/web".',
        expectedCommand: 'kubectl rollout history deployment/web',
        explanation:
          'O histórico de rollouts mostra as revisões e dá um alvo de rollback quando um release falha.',
      },
    ],
  },
  {
    id: 'debugging',
    title: 'Depurando workloads',
    description: 'Use logs, describe, exec e eventos para inspecionar o comportamento',
    icon: <Terminal className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Leia os logs do Deployment web.',
        hint: 'Use "kubectl logs deployment/web".',
        expectedCommand: 'kubectl logs deployment/web',
        explanation:
          'Os logs do Deployment escolhem um Pod por trás dele. Para depurar com precisão, use o nome de um Pod específico.',
      },
      {
        instruction: 'Descreva um Pod web para ver detalhes de agendamento e readiness.',
        hint: 'Use "kubectl describe pod web".',
        expectedCommand: 'kubectl describe pod web',
        explanation:
          'O describe pod mostra containers, readiness, restarts, volumes, em qual node está e os eventos recentes.',
      },
      {
        instruction: 'Rode um comando dentro do Deployment web.',
        hint: 'Use "kubectl exec deployment/web -- printenv".',
        expectedCommand: 'kubectl exec deployment/web -- printenv',
        explanation:
          'O exec inicia um processo dentro de um container existente. Use com moderação em produção e prefira logs e métricas antes.',
      },
      {
        instruction: 'Liste os eventos recentes do namespace.',
        hint: 'Use "kubectl get events".',
        expectedCommand: 'kubectl get events',
        explanation:
          'Os eventos mostram agendamento, download de imagens, escala e alertas. Muitas vezes são o contexto que falta durante um incidente.',
      },
    ],
  },
  {
    id: 'config-cleanup',
    title: 'Configuração e limpeza',
    description: 'Crie dados de configuração e remova objetos com segurança',
    icon: <FileText className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Crie um ConfigMap para as configurações da aplicação.',
        hint: 'Use "kubectl create configmap app-config --from-literal=LOG_LEVEL=debug".',
        expectedCommand: [
          'kubectl create configmap app-config --from-literal=LOG_LEVEL=debug',
          'kubectl create configmap app-config --from-literal LOG_LEVEL=debug',
        ],
        explanation:
          'ConfigMaps guardam configurações não sigilosas fora das imagens, para você mudar o comportamento sem gerar a imagem de novo.',
      },
      {
        instruction: 'Liste os ConfigMaps.',
        hint: 'Use "kubectl get configmaps".',
        expectedCommand: ['kubectl get configmaps', 'kubectl get cm'],
        explanation:
          'ConfigMaps são objetos da API com escopo de namespace. Os Pods podem usá-los como variáveis de ambiente ou arquivos montados.',
      },
      {
        instruction: 'Apague o Service web.',
        hint: 'Use "kubectl delete svc web".',
        expectedCommand: ['kubectl delete svc web', 'kubectl delete service web'],
        explanation:
          'Apagar um Service remove o endpoint de rede estável dele, mas não apaga os Pods que ele selecionava.',
      },
      {
        instruction: 'Apague o Deployment web e os Pods que ele gerencia.',
        hint: 'Use "kubectl delete deployment web".',
        expectedCommand: ['kubectl delete deployment web', 'kubectl delete deploy web'],
        explanation:
          'Apagar um Deployment remove o estado desejado. O ReplicaSet e os Pods dele são limpos pelas owner references.',
      },
    ],
  },
];

function createInitialState(): KubeClusterState {
  return {
    context: 'devops-lab',
    namespace: 'default',
    nodes: [
      {
        name: 'control-plane-1',
        status: 'Ready',
        role: 'control-plane',
        version: 'v1.32.4',
        cpu: '22%',
        memory: '41%',
      },
      {
        name: 'worker-1',
        status: 'Ready',
        role: 'worker',
        version: 'v1.32.4',
        cpu: '18%',
        memory: '37%',
      },
      {
        name: 'worker-2',
        status: 'Ready',
        role: 'worker',
        version: 'v1.32.4',
        cpu: '27%',
        memory: '46%',
      },
    ],
    deployments: [],
    pods: [],
    services: [
      {
        name: 'kubernetes',
        type: 'ClusterIP',
        selector: 'component=apiserver',
        port: 443,
        targetPort: 6443,
        clusterIP: '10.96.0.1',
      },
    ],
    configMaps: [],
    events: [
      {
        type: 'Normal',
        reason: 'Starting',
        object: 'node/worker-1',
        message: 'Starting kubelet.',
      },
      {
        type: 'Normal',
        reason: 'NodeReady',
        object: 'node/worker-2',
        message: 'Node worker-2 status is now: NodeReady.',
      },
    ],
  };
}

function splitCommand(input: string): string[] {
  const matches = input.match(/"[^"]*"|'[^']*'|\S+/g) || [];
  return matches.map((part) => part.replace(/^["']|["']$/g, ''));
}

function commandMatches(cmd: string, expected: string | string[]) {
  const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').replace(/^k\s+/, 'kubectl ');
  const normalized = normalize(cmd);

  if (Array.isArray(expected)) {
    return expected.some((item) => normalize(item) === normalized);
  }

  return normalize(expected) === normalized;
}

function deploymentHash(deployment: KubeDeployment) {
  return deployment.generation === 1 ? '5d8f7c9b7b' : `6c${deployment.generation}f8d9a4`;
}

function makePods(deployment: KubeDeployment, nodes: KubeNode[]): KubePod[] {
  const hash = deploymentHash(deployment);

  return Array.from({ length: deployment.replicas }, (_, index) => ({
    name: `${deployment.name}-${hash}-${index}`,
    app: deployment.name,
    image: deployment.image,
    status: 'Running' as const,
    restarts: 0,
    age: deployment.generation === 1 ? '45s' : '8s',
    node: nodes[(index % Math.max(nodes.length - 1, 1)) + 1]?.name ?? nodes[0].name,
    logs: [
      `${deployment.name}: starting nginx worker process`,
      `${deployment.name}: GET /healthz 200`,
      `${deployment.name}: ready to serve traffic on port 80`,
    ],
  }));
}

function addEvent(state: KubeClusterState, event: KubeEvent): KubeClusterState {
  return {
    ...state,
    events: [event, ...state.events].slice(0, 8),
  };
}

function normalizeKind(kind: string) {
  if (kind === 'po') return 'pods';
  if (kind === 'pod') return 'pods';
  if (kind === 'deploy') return 'deployments';
  if (kind === 'deployment') return 'deployments';
  if (kind === 'svc') return 'services';
  if (kind === 'service') return 'services';
  if (kind === 'cm') return 'configmaps';
  if (kind === 'configmap') return 'configmaps';
  if (kind === 'node') return 'nodes';
  return kind;
}

function nameFromResource(resource: string) {
  return resource.includes('/') ? resource.split('/')[1] : resource;
}

function getFlagValue(args: string[], flag: string) {
  const inlineValue = args.find((arg) => arg.startsWith(`${flag}=`));
  if (inlineValue) return inlineValue.slice(flag.length + 1);

  const flagIndex = args.indexOf(flag);
  if (flagIndex >= 0) return args[flagIndex + 1];

  return undefined;
}

function formatNodes(nodes: KubeNode[]) {
  return [
    'NAME              STATUS   ROLES           AGE   VERSION',
    ...nodes.map((node) =>
      `${node.name.padEnd(17)} ${node.status.padEnd(8)} ${node.role.padEnd(15)} 14d   ${node.version}`
    ),
  ].join('\n');
}

function formatPods(pods: KubePod[]) {
  if (pods.length === 0) return 'No resources found in default namespace.';

  return [
    'NAME                       READY   STATUS    RESTARTS   AGE',
    ...pods.map((pod) =>
      `${pod.name.padEnd(26)} 1/1     ${pod.status.padEnd(9)} ${String(pod.restarts).padEnd(10)} ${pod.age}`
    ),
  ].join('\n');
}

function formatDeployments(deployments: KubeDeployment[]) {
  if (deployments.length === 0) return 'No resources found in default namespace.';

  return [
    'NAME   READY   UP-TO-DATE   AVAILABLE   AGE',
    ...deployments.map((deployment) =>
      `${deployment.name.padEnd(6)} ${`${deployment.readyReplicas}/${deployment.replicas}`.padEnd(7)} ${String(deployment.replicas).padEnd(12)} ${String(deployment.readyReplicas).padEnd(11)} 45s`
    ),
  ].join('\n');
}

function formatServices(services: KubeService[]) {
  return [
    'NAME         TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)   AGE',
    ...services.map((service) =>
      `${service.name.padEnd(12)} ${service.type.padEnd(11)} ${service.clusterIP.padEnd(14)} <none>        ${service.port}/TCP   1m`
    ),
  ].join('\n');
}

function formatConfigMaps(configMaps: KubeConfigMap[]) {
  if (configMaps.length === 0) return 'No resources found in default namespace.';

  return [
    'NAME         DATA   AGE',
    ...configMaps.map((configMap) =>
      `${configMap.name.padEnd(12)} ${String(Object.keys(configMap.data).length).padEnd(6)} 5s`
    ),
  ].join('\n');
}

function formatEvents(events: KubeEvent[]) {
  if (events.length === 0) return 'No events found in default namespace.';

  return [
    'TYPE      REASON              OBJECT                 MESSAGE',
    ...events.map((event) =>
      `${event.type.padEnd(9)} ${event.reason.padEnd(19)} ${event.object.padEnd(22)} ${event.message}`
    ),
  ].join('\n');
}

function formatAllResources(state: KubeClusterState) {
  return [
    'Pods:',
    formatPods(state.pods),
    '',
    'Deployments:',
    formatDeployments(state.deployments),
    '',
    'Services:',
    formatServices(state.services),
  ].join('\n');
}

function statusColor(status: PodPhase) {
  if (status === 'Running') return 'text-emerald-500';
  if (status === 'Pending') return 'text-amber-500';
  return 'text-red-500';
}

export default function KubernetesTerminalSimulator() {
  const [clusterState, setClusterState] = useState<KubeClusterState>(createInitialState);

  const webDeployment = clusterState.deployments.find((deployment) => deployment.name === 'web');
  const webService = clusterState.services.find((service) => service.name === 'web');

  const findPod = useCallback(
    (name: string) => clusterState.pods.find((pod) => pod.name === name || pod.name.startsWith(name)),
    [clusterState.pods]
  );

  const findDeployment = useCallback(
    (name: string) => clusterState.deployments.find((deployment) => deployment.name === nameFromResource(name)),
    [clusterState.deployments]
  );

  const findService = useCallback(
    (name: string) => clusterState.services.find((service) => service.name === nameFromResource(name)),
    [clusterState.services]
  );

  const createDeployment = useCallback(
    (args: string[]) => {
      const name = args[1];
      const image = getFlagValue(args, '--image');

      if (!name || !image) {
        return 'error: required flag(s) "image" not set';
      }
      if (clusterState.deployments.some((deployment) => deployment.name === name)) {
        return `Error from server (AlreadyExists): deployments.apps "${name}" already exists`;
      }

      const deployment: KubeDeployment = {
        name,
        image,
        replicas: 1,
        readyReplicas: 1,
        generation: 1,
        strategy: 'RollingUpdate',
      };
      const pods = makePods(deployment, clusterState.nodes);

      setClusterState((prev) =>
        addEvent(
          {
            ...prev,
            deployments: [...prev.deployments, deployment],
            pods: [...prev.pods, ...pods],
          },
          {
            type: 'Normal',
            reason: 'ScalingReplicaSet',
            object: `deployment/${name}`,
            message: `Scaled up replica set ${name}-${deploymentHash(deployment)} to 1.`,
          }
        )
      );

      return `deployment.apps/${name} created`;
    },
    [clusterState.deployments, clusterState.nodes]
  );

  const createConfigMap = useCallback(
    (args: string[]) => {
      const name = args[1];
      const pair = getFlagValue(args, '--from-literal');
      const [key, ...valueParts] = pair?.split('=') ?? [];

      if (!name || !key) {
        return 'error: configmap name and --from-literal are required';
      }
      if (clusterState.configMaps.some((configMap) => configMap.name === name)) {
        return `Error from server (AlreadyExists): configmaps "${name}" already exists`;
      }

      setClusterState((prev) =>
        addEvent(
          {
            ...prev,
            configMaps: [...prev.configMaps, { name, data: { [key]: valueParts.join('=') } }],
          },
          {
            type: 'Normal',
            reason: 'Created',
            object: `configmap/${name}`,
            message: `Created ConfigMap ${name}.`,
          }
        )
      );

      return `configmap/${name} created`;
    },
    [clusterState.configMaps]
  );

  const exposeDeployment = useCallback(
    (args: string[]) => {
      const target = args[0]?.includes('/') ? args[0] : args[1];
      const name = nameFromResource(target || '');
      const deployment = findDeployment(name);
      const port = Number(getFlagValue(args, '--port') ?? 80);
      const targetPort = Number(getFlagValue(args, '--target-port') ?? port);
      const type = (getFlagValue(args, '--type') ?? 'ClusterIP') as KubeService['type'];

      if (!deployment) {
        return `Error from server (NotFound): deployments.apps "${name}" not found`;
      }
      if (clusterState.services.some((service) => service.name === name)) {
        return `Error from server (AlreadyExists): services "${name}" already exists`;
      }

      const service: KubeService = {
        name,
        type,
        selector: `app=${name}`,
        port,
        targetPort,
        clusterIP: `10.96.${20 + clusterState.services.length}.17`,
      };

      setClusterState((prev) =>
        addEvent(
          {
            ...prev,
            services: [...prev.services, service],
          },
          {
            type: 'Normal',
            reason: 'Created',
            object: `service/${name}`,
            message: `Created ${type} service for deployment ${name}.`,
          }
        )
      );

      return `service/${name} exposed`;
    },
    [clusterState.services, findDeployment]
  );

  const scaleDeployment = useCallback(
    (args: string[]) => {
      const resource = args[0];
      const name = resource?.includes('/') ? nameFromResource(resource) : args[1] || '';
      const replicas = Number(getFlagValue(args, '--replicas'));
      const deployment = findDeployment(name);

      if (!deployment) return `Error from server (NotFound): deployments.apps "${name}" not found`;
      if (!Number.isFinite(replicas) || replicas < 0) return 'error: --replicas must be a non-negative integer';

      const nextDeployment = {
        ...deployment,
        replicas,
        readyReplicas: replicas,
      };
      const nextPods = makePods(nextDeployment, clusterState.nodes);

      setClusterState((prev) =>
        addEvent(
          {
            ...prev,
            deployments: prev.deployments.map((item) => (item.name === name ? nextDeployment : item)),
            pods: [...prev.pods.filter((pod) => pod.app !== name), ...nextPods],
          },
          {
            type: 'Normal',
            reason: 'ScalingReplicaSet',
            object: `deployment/${name}`,
            message: `Scaled ${name} to ${replicas} replicas.`,
          }
        )
      );

      return `deployment.apps/${name} scaled`;
    },
    [clusterState.nodes, findDeployment]
  );

  const setImage = useCallback(
    (args: string[]) => {
      const resource = args[0];
      const resourceUsesSlash = resource?.includes('/');
      const name = resourceUsesSlash ? nameFromResource(resource || '') : args[1] || '';
      const imagePair = resourceUsesSlash ? args[1] || '' : args[2] || '';
      const [, image] = imagePair.split('=');
      const deployment = findDeployment(name);

      if (!deployment) return `Error from server (NotFound): deployments.apps "${name}" not found`;
      if (!image) return 'error: expected CONTAINER=IMAGE after deployment name';

      const nextDeployment = {
        ...deployment,
        image,
        generation: deployment.generation + 1,
        readyReplicas: deployment.replicas,
      };
      const nextPods = makePods(nextDeployment, clusterState.nodes);

      setClusterState((prev) =>
        addEvent(
          {
            ...prev,
            deployments: prev.deployments.map((item) => (item.name === name ? nextDeployment : item)),
            pods: [...prev.pods.filter((pod) => pod.app !== name), ...nextPods],
          },
          {
            type: 'Normal',
            reason: 'RollingUpdate',
            object: `deployment/${name}`,
            message: `Updated container image to ${image}.`,
          }
        )
      );

      return `deployment.apps/${name} image updated`;
    },
    [clusterState.nodes, findDeployment]
  );

  const deleteResource = useCallback(
    (args: string[]) => {
      const rawResource = args[0] || '';
      const [rawKind, rawName] = rawResource.includes('/') ? rawResource.split('/') : [rawResource, args[1]];
      const kind = normalizeKind(rawKind || '');
      const name = rawName;

      if (!kind || !name) return 'error: resource type and name are required';

      if (kind === 'services') {
        const service = findService(name);
        if (!service) return `Error from server (NotFound): services "${name}" not found`;

        setClusterState((prev) =>
          addEvent(
            {
              ...prev,
              services: prev.services.filter((item) => item.name !== service.name),
            },
            {
              type: 'Normal',
              reason: 'Deleted',
              object: `service/${service.name}`,
              message: `Deleted service ${service.name}.`,
            }
          )
        );
        return `service "${service.name}" deleted`;
      }

      if (kind === 'deployments') {
        const deployment = findDeployment(name);
        if (!deployment) return `Error from server (NotFound): deployments.apps "${name}" not found`;

        setClusterState((prev) =>
          addEvent(
            {
              ...prev,
              deployments: prev.deployments.filter((item) => item.name !== deployment.name),
              pods: prev.pods.filter((pod) => pod.app !== deployment.name),
            },
            {
              type: 'Normal',
              reason: 'Deleted',
              object: `deployment/${deployment.name}`,
              message: `Deleted deployment and owned Pods.`,
            }
          )
        );
        return `deployment.apps "${deployment.name}" deleted`;
      }

      return `error: delete for ${kind} is not implemented in this lab`;
    },
    [findDeployment, findService]
  );

  const describeResource = useCallback(
    (args: string[]) => {
      const kind = normalizeKind(args[0] || '');
      const name = args[1];

      if (kind === 'pods') {
        const pod = name ? findPod(name) : null;
        if (!pod) return `Error from server (NotFound): pods "${name}" not found`;
        return `Name:         ${pod.name}
Namespace:    ${clusterState.namespace}
Node:         ${pod.node}
Status:       ${pod.status}
IP:           10.244.${pod.name.endsWith('-0') ? '1.23' : '2.41'}
Containers:
  nginx:
    Image:      ${pod.image}
    Ready:      True
    Restarts:   ${pod.restarts}
Events:
  Normal  Scheduled  Successfully assigned default/${pod.name} to ${pod.node}
  Normal  Pulled     Container image "${pod.image}" already present
  Normal  Started    Started container nginx`;
      }

      if (kind === 'services') {
        const service = name ? findService(name) : null;
        if (!service) return `Error from server (NotFound): services "${name}" not found`;
        const endpoints = clusterState.pods
          .filter((pod) => pod.app === service.selector.replace('app=', ''))
          .map((pod, index) => `10.244.${index + 1}.${20 + index}:${service.targetPort}`)
          .join(',');

        return `Name:              ${service.name}
Namespace:         ${clusterState.namespace}
Type:              ${service.type}
IP:                ${service.clusterIP}
Port:              ${service.port}/TCP
TargetPort:        ${service.targetPort}/TCP
Selector:          ${service.selector}
Endpoints:         ${endpoints || '<none>'}`;
      }

      if (kind === 'deployments') {
        const deployment = name ? findDeployment(name) : null;
        if (!deployment) return `Error from server (NotFound): deployments.apps "${name}" not found`;
        return `Name:                   ${deployment.name}
Namespace:              ${clusterState.namespace}
Replicas:               ${deployment.replicas} desired | ${deployment.readyReplicas} available
StrategyType:           ${deployment.strategy}
Pod Template:
  Labels:               app=${deployment.name}
  Containers:
   nginx:
    Image:              ${deployment.image}`;
      }

      return `error: describe for ${kind || 'resource'} is not implemented in this lab`;
    },
    [clusterState.namespace, clusterState.pods, findDeployment, findPod, findService]
  );

  const executeKubectlCommand = useCallback(
    (args: string[]) => {
      const command = args[0];
      const rest = args.slice(1);

      switch (command) {
        case 'version':
          return `Client Version: v1.32.4
Server Version: v1.32.4`;

        case 'config':
          if (rest[0] === 'current-context') return clusterState.context;
          return 'Usage: kubectl config current-context';

        case 'cluster-info':
          return `Kubernetes control plane is running at https://devops-lab.example:6443
CoreDNS is running at https://devops-lab.example:6443/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy`;

        case 'get': {
          const kind = normalizeKind(rest[0] || '');
          if (kind === 'nodes') return formatNodes(clusterState.nodes);
          if (kind === 'pods') return formatPods(clusterState.pods);
          if (kind === 'deployments') return formatDeployments(clusterState.deployments);
          if (kind === 'services') return formatServices(clusterState.services);
          if (kind === 'configmaps') return formatConfigMaps(clusterState.configMaps);
          if (kind === 'events') return formatEvents(clusterState.events);
          if (kind === 'all') return formatAllResources(clusterState);
          return `error: the server does not have a resource type "${rest[0] || ''}"`;
        }

        case 'create':
          if (rest[0] === 'deployment') return createDeployment(rest);
          if (rest[0] === 'configmap') return createConfigMap(rest);
          return 'Usage: kubectl create [deployment|configmap]';

        case 'expose':
          if (rest[0] === 'deployment' || rest[0]?.startsWith('deployment/')) return exposeDeployment(rest);
          return 'Usage: kubectl expose deployment NAME --port=PORT';

        case 'scale':
          return scaleDeployment(rest);

        case 'set':
          if (rest[0] === 'image') return setImage(rest.slice(1));
          return 'Usage: kubectl set image deployment/NAME CONTAINER=IMAGE';

        case 'rollout': {
          const action = rest[0];
          const resource = rest[1];
          const deployment = resource ? findDeployment(resource) : null;
          const name = resource ? nameFromResource(resource) : '';
          if (!deployment) return `Error from server (NotFound): deployments.apps "${name}" not found`;
          if (action === 'status') {
            return `Waiting for deployment "${deployment.name}" rollout to finish: ${deployment.readyReplicas} of ${deployment.replicas} updated replicas are available...
deployment "${deployment.name}" successfully rolled out`;
          }
          if (action === 'history') {
            return `deployment.apps/${deployment.name}
REVISION  CHANGE-CAUSE
1         kubectl create deployment ${deployment.name} --image=nginx:1.27
${deployment.generation > 1 ? `${deployment.generation}         kubectl set image deployment/${deployment.name} nginx=${deployment.image}` : ''}`.trim();
          }
          return 'Usage: kubectl rollout [status|history] deployment/NAME';
        }

        case 'logs': {
          const target = rest[0];
          if (!target) return 'error: logs requires a Pod or workload name';
          if (target.startsWith('deployment/')) {
            const deployment = findDeployment(target);
            const pod = deployment ? clusterState.pods.find((item) => item.app === deployment.name) : null;
            if (!pod) return `Error from server (NotFound): deployments.apps "${nameFromResource(target)}" not found`;
            return pod.logs.join('\n');
          }
          const pod = findPod(target);
          if (!pod) return `Error from server (NotFound): pods "${target}" not found`;
          return pod.logs.join('\n');
        }

        case 'describe':
          return describeResource(rest);

        case 'exec': {
          const target = rest[0];
          const commandStart = rest.indexOf('--');
          const commandText = commandStart >= 0 ? rest.slice(commandStart + 1).join(' ') : rest.slice(1).join(' ');
          const deployment = target?.startsWith('deployment/') ? findDeployment(target) : null;
          const pod = deployment ? clusterState.pods.find((item) => item.app === deployment.name) : target ? findPod(target) : null;
          if (!pod) return `Error from server (NotFound): pods "${target || ''}" not found`;
          if (commandText === 'printenv') {
            return `KUBERNETES_SERVICE_HOST=10.96.0.1
KUBERNETES_SERVICE_PORT=443
HOSTNAME=${pod.name}
NGINX_VERSION=${pod.image.replace('nginx:', '')}`;
          }
          if (commandText === 'hostname') return pod.name;
          return `executed "${commandText}" in ${pod.name}`;
        }

        case 'delete':
          return deleteResource(rest);

        default:
          return `kubectl: unknown command "${command || ''}"`;
      }
    },
    [
      clusterState,
      createConfigMap,
      createDeployment,
      deleteResource,
      describeResource,
      exposeDeployment,
      findDeployment,
      findPod,
      scaleDeployment,
      setImage,
    ]
  );

  const executeCommand = useCallback(
    (rawInput: string): ExecuteResult => {
      const input = rawInput.trim();

      let output = '';
      let outputType: TerminalLine['type'] = 'output';

      const args = splitCommand(input);
      const command = args[0];

      if (input === 'clear') {
        return { output: '', clear: true };
      }

      if (command === 'help') {
        output = `Comandos disponíveis:
  kubectl version --short
  kubectl config current-context
  kubectl cluster-info
  kubectl get nodes|pods|deployments|svc|events|all
  kubectl create deployment web --image=nginx:1.27
  kubectl expose deployment web --port=80 --target-port=80
  kubectl scale deployment/web --replicas=4
  kubectl rollout status deployment/web
  kubectl logs deployment/web
  kubectl describe pod web
  kubectl exec deployment/web -- printenv
  ls, ls -l, pwd, cat deployment.yaml, cat service.yaml, clear`;
      } else if (command === 'pwd') {
        output = '/home/devops/kubernetes-lab';
      } else if (command === 'ls') {
        output = args.includes('-l')
          ? `-rw-r--r--  1 devops  devops  334 deployment.yaml
-rw-r--r--  1 devops  devops  156 service.yaml`
          : 'deployment.yaml  service.yaml';
      } else if (input === 'cat deployment.yaml' || input === 'cat ./deployment.yaml') {
        output = SAMPLE_DEPLOYMENT;
      } else if (input === 'cat service.yaml' || input === 'cat ./service.yaml') {
        output = SAMPLE_SERVICE;
      } else {
        if (args[0] === 'kubectl') {
          output = executeKubectlCommand(args.slice(1));
        } else if (args[0] === 'k') {
          output = executeKubectlCommand(args.slice(1));
        } else {
          output = `command not found: ${args[0] || ''}`;
          outputType = 'error';
        }
      }

      if (output.toLowerCase().startsWith('error') || output.includes('unknown command')) {
        outputType = 'error';
      }

      return { output, type: outputType };
    },
    [executeKubectlCommand]
  );

  const onReset = useCallback(() => {
    setClusterState(createInitialState());
  }, []);

  const {
    currentLessonIndex,
    currentCommandIndex,
    currentLesson,
    currentCommand,
    completedCommands,
    completedCount,
    totalCommands,
    progressPercentage,
    terminalHistory,
    inputValue,
    setInputValue,
    showHint,
    setShowHint,
    inputRef,
    terminalRef,
    submitCommand,
    handleSubmit,
    handleKeyDown,
    resetProgress,
    jumpToLesson,
  } = useTerminalSimulator({
    lessons: LESSONS,
    execute: executeCommand,
    matches: (cmd, command) => commandMatches(cmd, command.expectedCommand),
    successMessage: (command) => `✓ ${command.explanation}`,
    completionKeyStyle: 'index',
    advanceDelayMs: 700,
    historyStyle: 'recent-first',
    promoteOutputType: true,
    guardRepeatCompletion: true,
    onReset,
  });

  const resetLab = useCallback(() => {
    resetProgress();
    inputRef.current?.focus();
  }, [inputRef, resetProgress]);

  const runCurrentCommand = useCallback(() => {
    if (!currentCommand) return;
    const command = Array.isArray(currentCommand.expectedCommand)
      ? currentCommand.expectedCommand[0]
      : currentCommand.expectedCommand;
    submitCommand(command);
  }, [currentCommand, submitCommand]);

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-md border bg-muted/20 p-4">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <div className="rounded-md border border-primary/30 bg-primary/10 p-2 text-primary">
              <Boxes className="h-6 w-6" />
            </div>
            <div>
              <p className="font-mono text-xs text-muted-foreground">// laboratório de kubectl</p>
              <h2 className="text-2xl font-bold md:text-3xl">Simulador de terminal Kubernetes</h2>
            </div>
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Pratique comandos do Kubernetes num laboratório seguro no navegador. Aprenda contextos, nodes, Pods,
            Deployments, Services, rollouts, logs, exec, eventos, ConfigMaps e fluxos de limpeza.
          </p>
        </div>

        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progresso</span>
              <span className="text-sm text-muted-foreground">
                {completedCount}/{totalCommands}
              </span>
            </div>
            <Progress value={progressPercentage} />
            <div className="grid grid-cols-3 gap-2 text-center">
              <Metric label="Nodes" value={clusterState.nodes.length} />
              <Metric label="Pods" value={clusterState.pods.length} />
              <Metric label="Services" value={clusterState.services.length} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_310px]">
        <div className="space-y-4">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpenIcon />
                Lições
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4 pt-0">
              {LESSONS.map((lesson, lessonIndex) => {
                const lessonCompleted = lesson.commands.every((_, commandIndex) =>
                  completedCommands.has(`${lessonIndex}-${commandIndex}`)
                );
                const active = lessonIndex === currentLessonIndex;

                return (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => {
                      jumpToLesson(lessonIndex);
                      inputRef.current?.focus();
                    }}
                    className={cn(
                      'w-full rounded-md border p-2.5 text-left transition-colors',
                      active
                        ? 'border-primary/60 bg-primary/10'
                        : 'border-border hover:border-primary/40 hover:bg-muted/30'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('rounded-md border p-1.5', active ? 'text-primary' : 'text-muted-foreground')}>
                        {lesson.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium">{lesson.title}</p>
                          {lessonCompleted && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{lesson.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Button size="sm" variant="outline" onClick={resetLab} className="w-full">
            <RotateCcw className="mr-1 h-4 w-4" />
            Reiniciar laboratório
          </Button>
        </div>

        <div className="space-y-4">
          <Card className="border-primary/40">
            <CardContent className="space-y-2.5 p-3.5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      Lição {currentLessonIndex + 1} / {LESSONS.length}
                    </Badge>
                    <Badge>
                      Passo {currentCommandIndex + 1} / {currentLesson.commands.length}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium sm:text-base">{currentCommand?.instruction}</p>
                  {showHint && currentCommand && (
                    <p className="mt-2 rounded-md border border-primary/30 bg-primary/10 p-2 text-sm text-muted-foreground">
                      {currentCommand.hint}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="outline" onClick={() => setShowHint((value) => !value)}>
                    <Lightbulb className="mr-1 h-4 w-4" />
                    Dica
                  </Button>
                  <Button size="sm" onClick={runCurrentCommand}>
                    <Play className="mr-1 h-4 w-4" />
                    Executar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border bg-[#171717]">
            <CardHeader className="border-b border-border/60 bg-[#262626] p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                  </div>
                  <span className="ml-2 text-sm text-muted-foreground">kubectl</span>
                </div>
                <Badge variant="secondary" className="font-mono text-[11px]">
                  {clusterState.context}/{clusterState.namespace}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div
                ref={terminalRef}
                className="h-[580px] cursor-text overflow-y-auto p-5 font-mono text-sm leading-relaxed sm:text-[15px]"
                onClick={() => inputRef.current?.focus()}
              >
                {terminalHistory.length === 0 && (
                  <div className="mb-4 text-emerald-400">
                    <p>Boas-vindas ao laboratório de terminal Kubernetes.</p>
                    <p className="mt-2 text-muted-foreground">
                      Digite "help", rode "ls" ou siga a tarefa atual acima.
                    </p>
                  </div>
                )}
                {terminalHistory.map((line, index) => (
                  <div
                    key={`${line.timestamp.getTime()}-${index}`}
                    className={cn(
                      'mb-2 whitespace-pre-wrap break-words',
                      line.type === 'input' && 'text-slate-100',
                      line.type === 'output' && 'text-slate-300',
                      line.type === 'error' && 'text-red-400',
                      line.type === 'success' &&
                        'rounded-md border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-300'
                    )}
                  >
                    {line.type === 'input' && <span className="text-emerald-400">$ </span>}
                    {line.content}
                  </div>
                ))}
                <form onSubmit={handleSubmit} className="flex items-center">
                  <span className="text-emerald-400">$</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    onKeyDown={handleKeyDown}
                    className="ml-2 min-w-0 flex-1 bg-transparent text-slate-100 caret-emerald-400 outline-none"
                    spellCheck={false}
                    autoComplete="off"
                    autoCapitalize="off"
                    placeholder="kubectl get pods"
                  />
                </form>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <ManifestCard title="deployment.yaml" content={SAMPLE_DEPLOYMENT} />
            <ManifestCard title="service.yaml" content={SAMPLE_SERVICE} />
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Server className="h-5 w-5" />
                Cluster
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4 pt-0">
              {clusterState.nodes.map((node) => (
                <div key={node.name} className="rounded-md border p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="font-medium">{node.name}</p>
                    <Badge variant={node.status === 'Ready' ? 'default' : 'secondary'}>{node.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <span>{node.role}</span>
                    <span>{node.version}</span>
                    <span>cpu {node.cpu}</span>
                    <span>mem {node.memory}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Boxes className="h-5 w-5" />
                Workloads
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-0">
              {webDeployment ? (
                <div className="rounded-md border border-primary/30 bg-primary/10 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">deployment/{webDeployment.name}</p>
                    <Badge variant="secondary">
                      {webDeployment.readyReplicas}/{webDeployment.replicas}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">image {webDeployment.image}</p>
                </div>
              ) : (
                <p className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
                  Nenhum Deployment de aplicação ainda.
                </p>
              )}

              <div className="space-y-2">
                {clusterState.pods.map((pod) => (
                  <div key={pod.name} className="rounded-md border p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-mono text-xs">{pod.name}</p>
                      <span className={cn('text-xs font-medium', statusColor(pod.status))}>{pod.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{pod.node}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="h-5 w-5" />
                Rede
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4 pt-0">
              {webService ? (
                <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3">
                  <p className="font-medium">service/{webService.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {webService.clusterIP}:{webService.port} {'->'} app=
                    {webService.selector.replace('app=', '')}
                  </p>
                </div>
              ) : (
                <p className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
                  Exponha um Deployment para criar um endpoint estável de Service.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <CircleDot className="h-5 w-5" />
                Eventos recentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4 pt-0">
              {clusterState.events.slice(0, 4).map((event, index) => (
                <div key={`${event.reason}-${index}`} className="rounded-md border p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{event.reason}</p>
                    <Badge variant={event.type === 'Normal' ? 'secondary' : 'destructive'}>
                      {event.type}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{event.message}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {completedCount === totalCommands && (
        <Card className="mt-4 border-emerald-500/40 bg-emerald-500/10">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="font-semibold">Laboratório concluído</p>
                <p className="text-sm text-muted-foreground">
                  Você praticou o fluxo essencial do kubectl, da inspeção do cluster até a limpeza.
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={resetLab}>
              Começar de novo
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function BookOpenIcon() {
  return <Code2 className="h-5 w-5" />;
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-muted/30 p-2">
      <p className="text-lg font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function ManifestCard({ title, content }: { title: string; content: string }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/30 p-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <FileText className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <pre className="max-h-64 overflow-auto p-3 text-xs text-muted-foreground">
          <code>{content}</code>
        </pre>
      </CardContent>
    </Card>
  );
}
