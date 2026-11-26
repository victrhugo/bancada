'use client';

import React, { useCallback, useRef, useState } from 'react';
import {
  BookOpen,
  CheckCircle,
  ChevronRight,
  Container,
  Cpu,
  Database,
  FileText,
  HardDrive,
  Lightbulb,
  Network,
  Play,
  RotateCcw,
  Server,
  Square,
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

type ContainerStatus = 'running' | 'exited' | 'created';

interface DockerImage {
  repository: string;
  tag: string;
  id: string;
  created: string;
  size: string;
  layers: string[];
  description: string;
}

interface DockerContainer {
  id: string;
  name: string;
  image: string;
  command: string;
  status: ContainerStatus;
  created: string;
  ports: string[];
  env: Record<string, string>;
  network: string;
  volumes: string[];
  logs: string[];
  health?: 'starting' | 'healthy' | 'unhealthy';
}

interface DockerNetwork {
  name: string;
  driver: 'bridge' | 'host' | 'none';
  containers: string[];
}

interface DockerVolume {
  name: string;
  mountpoint: string;
  usedBy: string[];
}

interface DockerDaemonState {
  images: DockerImage[];
  containers: DockerContainer[];
  networks: DockerNetwork[];
  volumes: DockerVolume[];
  composeRunning: boolean;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  commands: LessonCommand[];
}

interface LessonCommand {
  instruction: string;
  hint: string;
  expectedCommand: string | string[];
  explanation: string;
}


const REGISTRY_IMAGES: Record<string, DockerImage> = {
  'hello-world:latest': {
    repository: 'hello-world',
    tag: 'latest',
    id: '9c7a54a9a43c',
    created: '3 weeks ago',
    size: '13.3kB',
    description: 'Imagem mínima que prova que o Docker consegue baixar e rodar containers.',
    layers: ['scratch base', 'hello binary'],
  },
  'nginx:alpine': {
    repository: 'nginx',
    tag: 'alpine',
    id: 'b8c1701fcf89',
    created: '2 weeks ago',
    size: '48.2MB',
    description: 'Imagem pequena do servidor web NGINX, baseada no Alpine Linux.',
    layers: ['alpine:3.20', 'nginx package', 'default config', 'html assets'],
  },
  'postgres:16-alpine': {
    repository: 'postgres',
    tag: '16-alpine',
    id: 'f1299d8c7a4e',
    created: '9 days ago',
    size: '274MB',
    description: 'Imagem do servidor PostgreSQL com camadas base do Alpine.',
    layers: ['alpine:3.20', 'postgres binaries', 'entrypoint scripts', 'database defaults'],
  },
  'redis:7-alpine': {
    repository: 'redis',
    tag: '7-alpine',
    id: '38f7f2b5f7c8',
    created: '11 days ago',
    size: '41.5MB',
    description: 'Imagem de cache Redis para desenvolvimento local leve.',
    layers: ['alpine:3.20', 'redis package', 'redis.conf', 'entrypoint'],
  },
  'node:20-alpine': {
    repository: 'node',
    tag: '20-alpine',
    id: 'cb7f6f92b18f',
    created: '6 days ago',
    size: '132MB',
    description: 'Runtime Node.js usado como base da imagem da API de exemplo.',
    layers: ['alpine:3.20', 'node runtime', 'npm', 'corepack'],
  },
};

const SAMPLE_DOCKERFILE = `FROM node:20-alpine
WORKDIR /app
COPY package.json .
RUN npm ci --omit=dev
COPY server.js .
EXPOSE 3000
CMD ["node", "server.js"]`;

const SAMPLE_COMPOSE = `services:
  api:
    image: devops-api:1.0
    ports:
      - "3000:3000"
    networks:
      - appnet
  db:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - appnet

networks:
  appnet:

volumes:
  pgdata:`;

const createInitialState = (): DockerDaemonState => ({
  images: [
    REGISTRY_IMAGES['hello-world:latest'],
    REGISTRY_IMAGES['alpine:3.19'] ?? {
      repository: 'alpine',
      tag: '3.19',
      id: '05455a08881e',
      created: '4 weeks ago',
      size: '7.4MB',
      description: 'Imagem base Linux minúscula, muito usada em containers.',
      layers: ['alpine rootfs'],
    },
  ],
  containers: [
    {
      id: 'd4f33b720a2a',
      name: 'hello-demo',
      image: 'hello-world:latest',
      command: '/hello',
      status: 'exited',
      created: '12 minutes ago',
      ports: [],
      env: {},
      network: 'bridge',
      volumes: [],
      logs: [
        'Hello from Docker!',
        'This message shows that your installation appears to be working correctly.',
      ],
    },
  ],
  networks: [
    { name: 'bridge', driver: 'bridge', containers: [] },
    { name: 'host', driver: 'host', containers: [] },
    { name: 'none', driver: 'none', containers: [] },
  ],
  volumes: [],
  composeRunning: false,
});

const LESSONS: Lesson[] = [
  {
    id: 'daemon',
    title: 'Básico do daemon do Docker',
    description: 'Inspecione o engine local do Docker e o repositório de imagens',
    icon: <Server className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Comece verificando as versões do cliente e do servidor Docker.',
        hint: 'Use "docker version" para ver as versões do cliente e do daemon.',
        expectedCommand: 'docker version',
        explanation:
          'Os comandos da CLI do Docker conversam com um daemon. A maior parte do troubleshooting começa provando que o cliente alcança esse daemon.',
      },
      {
        instruction: 'Mostre um resumo do estado do daemon.',
        hint: 'Use "docker info" para ver containers, imagens, storage driver e detalhes do runtime.',
        expectedCommand: 'docker info',
        explanation:
          'O docker info dá um check-up rápido do engine: contagens, runtime, cgroup driver e storage driver.',
      },
      {
        instruction: 'Baixe uma imagem pequena do NGINX de um registry.',
        hint: 'Use "docker pull nginx:alpine". Tags importam: nginx:latest e nginx:alpine são imagens diferentes.',
        expectedCommand: 'docker pull nginx:alpine',
        explanation:
          'O docker pull baixa as camadas da imagem de um registry e guarda localmente para os próximos containers.',
      },
      {
        instruction: 'Liste as imagens que agora estão disponíveis localmente.',
        hint: 'Use "docker images" ou "docker image ls".',
        expectedCommand: ['docker images', 'docker image ls'],
        explanation:
          'Imagens são templates imutáveis. Containers são instâncias em execução criadas a partir delas.',
      },
    ],
  },
  {
    id: 'lifecycle',
    title: 'Ciclo de vida do container',
    description: 'Rode, inspecione, pare e liste containers',
    icon: <Container className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Rode o NGINX em segundo plano num container chamado web, publicando a porta 8080 do host na porta 80 do container.',
        hint: 'Use "docker run -d --name web -p 8080:80 nginx:alpine".',
        expectedCommand: [
          'docker run -d --name web -p 8080:80 nginx:alpine',
          'docker container run -d --name web -p 8080:80 nginx:alpine',
        ],
        explanation:
          'O -d roda em segundo plano, o --name dá um nome fixo ao container e o -p leva o tráfego do seu computador para dentro do container.',
      },
      {
        instruction: 'Liste só os containers em execução.',
        hint: 'Use "docker ps". Depois, adicione -a quando quiser ver também os containers parados.',
        expectedCommand: ['docker ps', 'docker container ls'],
        explanation:
          'O docker ps mostra os containers em execução. É o jeito mais rápido de confirmar que um serviço está de pé.',
      },
      {
        instruction: 'Leia os logs do container web.',
        hint: 'Use "docker logs web". Funciona tanto com o nome quanto com o ID do container.',
        expectedCommand: 'docker logs web',
        explanation:
          'O Docker captura o stdout e o stderr do processo principal. Os logs costumam ser a primeira parada na depuração.',
      },
      {
        instruction: 'Pare o container web de forma graciosa.',
        hint: 'Use "docker stop web". Ele manda SIGTERM e, depois de um timeout, SIGKILL.',
        expectedCommand: 'docker stop web',
        explanation:
          'Parar um container mantém a camada gravável dele, então dá para iniciar de novo ou inspecionar depois.',
      },
      {
        instruction: 'Liste todos os containers, inclusive os parados.',
        hint: 'Use "docker ps -a".',
        expectedCommand: ['docker ps -a', 'docker container ls -a'],
        explanation:
          'A flag -a mostra os containers encerrados. É assim que você acha execuções antigas que talvez precisem de limpeza.',
      },
    ],
  },
  {
    id: 'debugging',
    title: 'Depurando containers',
    description: 'Inicie um container, inspecione e rode comandos dentro dele',
    icon: <Cpu className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Inicie o container web de novo.',
        hint: 'Use "docker start web".',
        expectedCommand: 'docker start web',
        explanation:
          'O docker start reaproveita um container parado. O docker run cria um container novo.',
      },
      {
        instruction: 'Rode um comando dentro do container web em execução para ver o hostname dele.',
        hint: 'Use "docker exec web hostname".',
        expectedCommand: ['docker exec web hostname', 'docker container exec web hostname'],
        explanation:
          'O docker exec inicia um processo extra dentro de um container existente. É útil para diagnósticos rápidos.',
      },
      {
        instruction: 'Inspecione os metadados do container em formato parecido com JSON.',
        hint: 'Use "docker inspect web".',
        expectedCommand: 'docker inspect web',
        explanation:
          'O docker inspect mostra metadados de baixo nível: ID da imagem, rede, portas, mounts, variáveis de ambiente e estado.',
      },
    ],
  },
  {
    id: 'builds',
    title: 'Gerar imagens',
    description: 'Leia um Dockerfile e gere uma imagem própria da API',
    icon: <FileText className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Leia o Dockerfile de exemplo deste workspace.',
        hint: 'Use "cat Dockerfile".',
        expectedCommand: 'cat Dockerfile',
        explanation:
          'O Dockerfile é a receita de uma imagem. Cada instrução pode virar uma camada em cache.',
      },
      {
        instruction: 'Gere a imagem da API de exemplo com a tag devops-api:1.0.',
        hint: 'Use "docker build -t devops-api:1.0 .".',
        expectedCommand: ['docker build -t devops-api:1.0 .', 'docker image build -t devops-api:1.0 .'],
        explanation:
          'A tag dá à imagem um nome fácil de lembrar. Sem tags, você acaba caçando IDs de imagem.',
      },
      {
        instruction: 'Inspecione as camadas da imagem devops-api:1.0.',
        hint: 'Use "docker history devops-api:1.0".',
        expectedCommand: 'docker history devops-api:1.0',
        explanation:
          'O histórico de camadas ajuda a entender o tamanho da imagem, os cache hits e por que a ordem das instruções importa.',
      },
    ],
  },
  {
    id: 'data-networking',
    title: 'Dados e rede',
    description: 'Crie volumes e redes e depois rode um container de banco de dados',
    icon: <Database className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Crie um volume nomeado para os dados do PostgreSQL.',
        hint: 'Use "docker volume create pgdata".',
        expectedCommand: 'docker volume create pgdata',
        explanation:
          'Volumes nomeados guardam os dados fora da camada gravável do container. Remover o container não apaga o volume.',
      },
      {
        instruction: 'Crie uma rede bridge para a aplicação.',
        hint: 'Use "docker network create appnet".',
        expectedCommand: 'docker network create appnet',
        explanation:
          'Redes bridge criadas por você oferecem DNS pelo nome do serviço entre os containers.',
      },
      {
        instruction: 'Rode o PostgreSQL na appnet usando o volume pgdata e uma variável de ambiente com a senha.',
        hint: 'Use "docker run -d --name db --network appnet -v pgdata:/var/lib/postgresql/data -e POSTGRES_PASSWORD=secret postgres:16-alpine".',
        expectedCommand: [
          'docker run -d --name db --network appnet -v pgdata:/var/lib/postgresql/data -e POSTGRES_PASSWORD=secret postgres:16-alpine',
          'docker container run -d --name db --network appnet -v pgdata:/var/lib/postgresql/data -e POSTGRES_PASSWORD=secret postgres:16-alpine',
        ],
        explanation:
          'Isso junta um volume persistente, uma rede privada e configuração por ambiente: um fluxo realista de banco de dados local.',
      },
      {
        instruction: 'Liste as redes do Docker para confirmar que a appnet existe.',
        hint: 'Use "docker network ls".',
        expectedCommand: 'docker network ls',
        explanation:
          'Redes são objetos de primeira classe no Docker. Dar nome a elas facilita entender setups com vários containers.',
      },
    ],
  },
  {
    id: 'compose',
    title: 'Fluxo com Compose',
    description: 'Use o Docker Compose para gerenciar uma stack pequena',
    icon: <Network className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Leia o arquivo compose de exemplo.',
        hint: 'Use "cat compose.yaml".',
        expectedCommand: ['cat compose.yaml', 'cat docker-compose.yml'],
        explanation:
          'O Compose descreve de forma declarativa uma aplicação com vários containers: serviços, redes, volumes, portas e ambiente.',
      },
      {
        instruction: 'Suba a stack do compose em segundo plano.',
        hint: 'Use "docker compose up -d".',
        expectedCommand: ['docker compose up -d', 'docker-compose up -d'],
        explanation:
          'O Compose cria a rede, o volume e os containers que faltam e sobe a stack como uma unidade.',
      },
      {
        instruction: 'Mostre os serviços do compose e o estado deles.',
        hint: 'Use "docker compose ps".',
        expectedCommand: ['docker compose ps', 'docker-compose ps'],
        explanation:
          'O docker compose ps é a visão da stack; o docker ps é a visão do daemon.',
      },
      {
        instruction: 'Derrube a stack do compose mantendo os volumes nomeados.',
        hint: 'Use "docker compose down".',
        expectedCommand: ['docker compose down', 'docker-compose down'],
        explanation:
          'O compose down remove os containers dos serviços e a rede. Os volumes nomeados ficam, a menos que você adicione --volumes.',
      },
    ],
  },
];

function normalizeImageRef(ref: string) {
  if (!ref.includes(':')) return `${ref}:latest`;
  return ref;
}

function imageName(image: DockerImage) {
  return `${image.repository}:${image.tag}`;
}

function cloneImage(image: DockerImage): DockerImage {
  return {
    ...image,
    layers: [...image.layers],
  };
}

function splitCommand(input: string): string[] {
  const matches = input.match(/"[^"]*"|'[^']*'|\S+/g) || [];
  return matches.map((part) => part.replace(/^["']|["']$/g, ''));
}

function commandMatches(cmd: string, expected: string | string[]) {
  const normalize = (value: string) => value.trim().replace(/\s+/g, ' ');
  const normalized = normalize(cmd);

  if (Array.isArray(expected)) {
    return expected.some((item) => normalize(item) === normalized);
  }

  return normalize(expected) === normalized;
}

function idFromName(name: string, salt: number) {
  const hex = Array.from(`${name}-${salt}`)
    .reduce((acc, char) => acc + char.charCodeAt(0), 0)
    .toString(16)
    .padStart(4, '0');
  return `${hex}${Math.random().toString(16).slice(2, 10)}`.slice(0, 12);
}

function formatImageTable(images: DockerImage[]) {
  const rows = images.map((image) =>
    `${image.repository.padEnd(18)} ${image.tag.padEnd(12)} ${image.id.padEnd(14)} ${image.created.padEnd(14)} ${image.size}`
  );

  return ['REPOSITORY         TAG          IMAGE ID       CREATED        SIZE', ...rows].join('\n');
}

function formatContainerTable(containers: DockerContainer[], all = false) {
  const visible = all ? containers : containers.filter((container) => container.status === 'running');

  if (visible.length === 0) {
    return 'CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES';
  }

  const rows = visible.map((container) => {
    const status =
      container.status === 'running'
        ? `Up ${container.health ? `(${container.health})` : '2 minutes'}`
        : 'Exited (0) 1 minute ago';

    return `${container.id.slice(0, 12).padEnd(14)} ${container.image.padEnd(22)} ${container.command.padEnd(18)} ${container.created.padEnd(14)} ${status.padEnd(20)} ${(container.ports.join(', ') || '-').padEnd(18)} ${container.name}`;
  });

  return ['CONTAINER ID   IMAGE                  COMMAND            CREATED        STATUS               PORTS              NAMES', ...rows].join('\n');
}

function formatNetworks(networks: DockerNetwork[]) {
  return [
    'NETWORK ID     NAME      DRIVER    SCOPE',
    ...networks.map((network, index) =>
      `${String(8_100 + index).padEnd(14)} ${network.name.padEnd(9)} ${network.driver.padEnd(9)} local`
    ),
  ].join('\n');
}

function formatVolumes(volumes: DockerVolume[]) {
  if (volumes.length === 0) return 'DRIVER    VOLUME NAME';
  return ['DRIVER    VOLUME NAME', ...volumes.map((volume) => `local     ${volume.name}`)].join('\n');
}

function statusColor(status: ContainerStatus) {
  if (status === 'running') return 'text-emerald-500';
  if (status === 'created') return 'text-yellow-500';
  return 'text-muted-foreground';
}

const AVAILABLE_COMMANDS = [
  'docker',
  'docker version',
  'docker info',
  'docker pull',
  'docker images',
  'docker ps',
  'docker run',
  'docker logs',
  'docker stop',
  'docker start',
  'docker exec',
  'docker inspect',
  'docker build',
  'docker history',
  'docker network',
  'docker volume',
  'docker compose',
  'cat Dockerfile',
  'cat compose.yaml',
  'clear',
  'help',
];

export default function DockerTerminalSimulator() {
  const [dockerState, setDockerState] = useState<DockerDaemonState>(createInitialState);
  const idCounter = useRef(1);

  const runningContainers = dockerState.containers.filter((container) => container.status === 'running');

  const findContainer = useCallback(
    (nameOrId: string) =>
      dockerState.containers.find(
        (container) => container.name === nameOrId || container.id.startsWith(nameOrId)
      ),
    [dockerState.containers]
  );

  const findImage = useCallback(
    (ref: string) => {
      const normalized = normalizeImageRef(ref);
      return dockerState.images.find((image) => imageName(image) === normalized);
    },
    [dockerState.images]
  );

  const pullImage = useCallback((ref: string) => {
    const normalized = normalizeImageRef(ref);
    const registryImage = REGISTRY_IMAGES[normalized];

    if (!registryImage) {
      return `Error response from daemon: manifest for ${normalized} not found: manifest unknown`;
    }

    setDockerState((prev) => {
      if (prev.images.some((image) => imageName(image) === normalized)) return prev;

      return {
        ...prev,
        images: [...prev.images, cloneImage(registryImage)],
      };
    });

    return `Using default tag: ${normalized.split(':')[1]}
${registryImage.id.slice(0, 12)}: Pull complete
Digest: sha256:${registryImage.id}${registryImage.id}
Status: Downloaded newer image for ${normalized}
docker.io/library/${normalized}`;
  }, []);

  const runContainer = useCallback(
    (args: string[]) => {
      let detached = false;
      let name = '';
      let network = 'bridge';
      const ports: string[] = [];
      const volumes: string[] = [];
      const env: Record<string, string> = {};
      const remaining: string[] = [];

      for (let i = 0; i < args.length; i += 1) {
        const arg = args[i];
        if (arg === '-d' || arg === '--detach') {
          detached = true;
        } else if (arg === '--name') {
          name = args[i + 1] || '';
          i += 1;
        } else if (arg === '-p' || arg === '--publish') {
          const mapping = args[i + 1];
          if (mapping) ports.push(`${mapping}->tcp`);
          i += 1;
        } else if (arg === '--network' || arg === '--net') {
          network = args[i + 1] || 'bridge';
          i += 1;
        } else if (arg === '-v' || arg === '--volume') {
          const mapping = args[i + 1];
          if (mapping) volumes.push(mapping);
          i += 1;
        } else if (arg === '-e' || arg === '--env') {
          const pair = args[i + 1] || '';
          const [key, ...value] = pair.split('=');
          if (key) env[key] = value.join('=');
          i += 1;
        } else {
          remaining.push(arg);
        }
      }

      const imageRef = normalizeImageRef(remaining[0] || '');
      const command = remaining.slice(1).join(' ');

      if (!imageRef) return 'docker: "run" requires at least 1 argument.';

      let image = findImage(imageRef);
      let pullOutput = '';
      if (!image) {
        const registryImage = REGISTRY_IMAGES[imageRef];
        if (!registryImage) {
          return `Unable to find image '${imageRef}' locally
docker: Error response from daemon: pull access denied for ${imageRef}, repository does not exist or may require 'docker login'.`;
        }
        image = registryImage;
        pullOutput = `Unable to find image '${imageRef}' locally
${imageRef}: Pulling from library/${image.repository}
${image.id.slice(0, 12)}: Pull complete
Status: Downloaded newer image for ${imageRef}
`;
      }

      if (dockerState.containers.some((container) => container.name === name && name)) {
        return `docker: Error response from daemon: Conflict. The container name "/${name}" is already in use.`;
      }

      if (network && !dockerState.networks.some((item) => item.name === network)) {
        return `docker: Error response from daemon: network ${network} not found.`;
      }

      const containerName = name || `${image.repository.replace(/[^\w-]/g, '-')}-${idCounter.current}`;
      const id = idFromName(containerName, idCounter.current);
      idCounter.current += 1;

      const logs =
        image.repository === 'nginx'
          ? [
              '/docker-entrypoint.sh: Configuration complete; ready for start up',
              'nginx/1.27.0 started, listening on 0.0.0.0:80',
              'GET / HTTP/1.1 200 -',
            ]
          : image.repository === 'postgres'
            ? [
                'PostgreSQL Database directory appears to contain a database; Skipping initialization',
                'database system is ready to accept connections',
              ]
            : image.repository === 'redis'
              ? ['Ready to accept connections tcp-port=6379']
              : ['Application started on port 3000', 'GET /health 200 ok'];

      const container: DockerContainer = {
        id,
        name: containerName,
        image: imageRef,
        command: command || (image.repository === 'nginx' ? 'nginx -g daemon off;' : '/entrypoint.sh'),
        status: detached ? 'running' : 'exited',
        created: 'Less than a second ago',
        ports,
        env,
        network,
        volumes,
        logs,
        health: detached ? 'healthy' : undefined,
      };

      setDockerState((prev) => {
        const nextImages = prev.images.some((item) => imageName(item) === imageRef)
          ? prev.images
          : [...prev.images, cloneImage(image!)];

        const nextNetworks = prev.networks.map((item) =>
          item.name === network
            ? { ...item, containers: Array.from(new Set([...item.containers, containerName])) }
            : item
        );

        const nextVolumes = prev.volumes.map((volume) => ({
          ...volume,
          usedBy: [...volume.usedBy],
        }));
        for (const volumeMount of volumes) {
          const [volumeName] = volumeMount.split(':');
          const existing = nextVolumes.find((volume) => volume.name === volumeName);
          if (existing) {
            existing.usedBy = Array.from(new Set([...existing.usedBy, containerName]));
          } else if (volumeName && !volumeName.includes('/')) {
            nextVolumes.push({
              name: volumeName,
              mountpoint: `/var/lib/docker/volumes/${volumeName}/_data`,
              usedBy: [containerName],
            });
          }
        }

        return {
          ...prev,
          images: nextImages,
          containers: [...prev.containers, container],
          networks: nextNetworks,
          volumes: nextVolumes,
        };
      });

      return `${pullOutput}${detached ? id : logs.join('\n')}`;
    },
    [dockerState.containers, dockerState.networks, findImage]
  );

  const executeDockerCommand = useCallback(
    (args: string[]) => {
      let subcommand = args[0];
      let commandGroup = '';
      let rest = args.slice(1);

      if (subcommand === 'container' || subcommand === 'image') {
        commandGroup = subcommand;
        subcommand = rest[0];
        rest = rest.slice(1);
      }

      switch (subcommand) {
        case 'version':
          return `Client: Docker Engine - Community
 Version:           27.5.1
 API version:       1.47
 Go version:        go1.23.4

Server: Docker Engine - Community
 Engine:
  Version:          27.5.1
  Storage Driver:   overlay2
  Cgroup Driver:    systemd`;

        case 'info':
          return `Client: Docker Engine - Community
Server:
 Containers: ${dockerState.containers.length}
  Running: ${runningContainers.length}
  Paused: 0
  Stopped: ${dockerState.containers.length - runningContainers.length}
 Images: ${dockerState.images.length}
 Server Version: 27.5.1
 Storage Driver: overlay2
 Logging Driver: json-file
 Cgroup Driver: systemd
 Default Runtime: runc`;

        case 'images':
        case 'ls':
          if (commandGroup === 'container') {
            return formatContainerTable(
              dockerState.containers,
              rest.includes('-a') || rest.includes('--all')
            );
          }
          return formatImageTable(dockerState.images);

        case 'pull': {
          const ref = rest[0];
          if (!ref) return 'docker pull requires exactly 1 argument.';
          return pullImage(ref);
        }

        case 'ps':
          return formatContainerTable(dockerState.containers, rest.includes('-a') || rest.includes('--all'));

        case 'run':
          return runContainer(rest);

        case 'stop': {
          const target = rest[0];
          const container = target ? findContainer(target) : null;
          if (!target) return 'docker stop requires at least 1 argument.';
          if (!container) return `Error response from daemon: No such container: ${target}`;

          setDockerState((prev) => ({
            ...prev,
            containers: prev.containers.map((item) =>
              item.id === container.id ? { ...item, status: 'exited', health: undefined } : item
            ),
          }));
          return container.name;
        }

        case 'start': {
          const target = rest[0];
          const container = target ? findContainer(target) : null;
          if (!target) return 'docker start requires at least 1 argument.';
          if (!container) return `Error response from daemon: No such container: ${target}`;

          setDockerState((prev) => ({
            ...prev,
            containers: prev.containers.map((item) =>
              item.id === container.id ? { ...item, status: 'running', health: 'healthy' } : item
            ),
          }));
          return container.name;
        }

        case 'restart': {
          const target = rest[0];
          const container = target ? findContainer(target) : null;
          if (!target) return 'docker restart requires at least 1 argument.';
          if (!container) return `Error response from daemon: No such container: ${target}`;

          setDockerState((prev) => ({
            ...prev,
            containers: prev.containers.map((item) =>
              item.id === container.id ? { ...item, status: 'running', health: 'healthy' } : item
            ),
          }));
          return container.name;
        }

        case 'rm': {
          const force = rest.includes('-f') || rest.includes('--force');
          const target = rest.find((arg) => !arg.startsWith('-'));
          const container = target ? findContainer(target) : null;
          if (!target) return 'docker rm requires at least 1 argument.';
          if (!container) return `Error: No such container: ${target}`;
          if (container.status === 'running' && !force) {
            return `Error response from daemon: You cannot remove a running container ${container.id.slice(0, 12)}. Stop the container before attempting removal or force remove.`;
          }

          setDockerState((prev) => ({
            ...prev,
            containers: prev.containers.filter((item) => item.id !== container.id),
            networks: prev.networks.map((network) => ({
              ...network,
              containers: network.containers.filter((name) => name !== container.name),
            })),
            volumes: prev.volumes.map((volume) => ({
              ...volume,
              usedBy: volume.usedBy.filter((name) => name !== container.name),
            })),
          }));
          return container.name;
        }

        case 'logs': {
          const target = rest.find((arg) => !arg.startsWith('-'));
          const container = target ? findContainer(target) : null;
          if (!target) return 'docker logs requires exactly 1 argument.';
          if (!container) return `Error response from daemon: No such container: ${target}`;
          return container.logs.join('\n');
        }

        case 'exec': {
          const filtered = rest.filter((arg) => !['-it', '-i', '-t'].includes(arg));
          const target = filtered[0];
          const command = filtered.slice(1).join(' ');
          const container = target ? findContainer(target) : null;
          if (!target || !command) return 'docker exec requires a container and command.';
          if (!container) return `Error response from daemon: No such container: ${target}`;
          if (container.status !== 'running') {
            return `Error response from daemon: Container ${container.name} is not running`;
          }

          if (command === 'hostname') return container.id.slice(0, 12);
          if (command === 'printenv' || command === 'env') {
            return Object.entries({
              HOSTNAME: container.id.slice(0, 12),
              PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
              ...container.env,
            })
              .map(([key, value]) => `${key}=${value}`)
              .join('\n');
          }
          if (command === 'ls /') return 'bin\ndev\netc\nhome\nlib\nproc\ntmp\nusr\nvar';
          return `executed "${command}" in ${container.name}`;
        }

        case 'inspect': {
          const target = rest[0];
          const container = target ? findContainer(target) : null;
          if (!target) return 'docker inspect requires at least 1 argument.';
          if (!container) return `Error: No such object: ${target}`;

          return JSON.stringify(
            [
              {
                Id: container.id,
                Name: `/${container.name}`,
                Config: {
                  Image: container.image,
                  Env: Object.entries(container.env).map(([key, value]) => `${key}=${value}`),
                },
                State: {
                  Status: container.status,
                  Running: container.status === 'running',
                  Health: container.health ? { Status: container.health } : undefined,
                },
                NetworkSettings: {
                  Networks: {
                    [container.network]: {
                      NetworkID: `${container.network}-id`,
                      Aliases: [container.name],
                    },
                  },
                  Ports: container.ports,
                },
                Mounts: container.volumes,
              },
            ],
            null,
            2
          );
        }

        case 'build': {
          const tagIndex = rest.findIndex((arg) => arg === '-t' || arg === '--tag');
          const tag = tagIndex >= 0 ? rest[tagIndex + 1] : 'devops-api:latest';
          const context = rest[rest.length - 1];
          if (!context || context.startsWith('-')) return 'docker build requires a build context.';

          const image: DockerImage = {
            repository: tag.split(':')[0],
            tag: tag.split(':')[1] || 'latest',
            id: 'cafe42f00d11',
            created: 'Less than a second ago',
            size: '189MB',
            description: 'Imagem da API Node.js de exemplo, gerada a partir do Dockerfile do tutorial.',
            layers: [
              'FROM node:20-alpine',
              'WORKDIR /app',
              'COPY package.json .',
              'RUN npm ci --omit=dev',
              'COPY server.js .',
              'CMD node server.js',
            ],
          };

          setDockerState((prev) => ({
            ...prev,
            images: [...prev.images.filter((item) => imageName(item) !== imageName(image)), image],
          }));

          return `#1 [internal] load build definition from Dockerfile
#2 [internal] load metadata for docker.io/library/node:20-alpine
#3 [1/5] FROM docker.io/library/node:20-alpine
#4 [2/5] WORKDIR /app
#5 [3/5] COPY package.json .
#6 [4/5] RUN npm ci --omit=dev
#7 [5/5] COPY server.js .
#8 exporting to image
#8 naming to docker.io/library/${tag}
Successfully built ${image.id}
Successfully tagged ${tag}`;
        }

        case 'history': {
          const ref = rest[0];
          const image = ref ? findImage(ref) : null;
          if (!ref) return 'docker history requires exactly 1 argument.';
          if (!image) return `Error response from daemon: No such image: ${ref}`;
          return [
            'IMAGE          CREATED          CREATED BY                         SIZE',
            ...image.layers.map((layer, index) =>
              `${image.id.slice(0, 12).padEnd(14)} ${`${index + 1} minutes ago`.padEnd(16)} ${layer.padEnd(34)} ${index === 0 ? image.size : '<missing>'}`
            ),
          ].join('\n');
        }

        case 'network': {
          const action = rest[0];
          if (action === 'ls') return formatNetworks(dockerState.networks);
          if (action === 'create') {
            const name = rest[1];
            if (!name) return 'docker network create requires exactly 1 argument.';
            if (dockerState.networks.some((network) => network.name === name)) return name;

            setDockerState((prev) => ({
              ...prev,
              networks: [...prev.networks, { name, driver: 'bridge', containers: [] }],
            }));
            return `${name}`;
          }
          return 'Usage: docker network [create|ls]';
        }

        case 'volume': {
          const action = rest[0];
          if (action === 'ls') return formatVolumes(dockerState.volumes);
          if (action === 'create') {
            const name = rest[1];
            if (!name) return 'docker volume create requires exactly 1 argument.';
            if (dockerState.volumes.some((volume) => volume.name === name)) return name;

            setDockerState((prev) => ({
              ...prev,
              volumes: [
                ...prev.volumes,
                {
                  name,
                  mountpoint: `/var/lib/docker/volumes/${name}/_data`,
                  usedBy: [],
                },
              ],
            }));
            return name;
          }
          return 'Usage: docker volume [create|ls]';
        }

        case 'system': {
          if (rest[0] === 'df') {
            return `TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE
Images          ${dockerState.images.length}         ${runningContainers.length}         682MB     138MB (20%)
Containers      ${dockerState.containers.length}         ${runningContainers.length}         24MB      12MB (50%)
Local Volumes   ${dockerState.volumes.length}         ${dockerState.volumes.filter((volume) => volume.usedBy.length > 0).length}         128MB     0B`;
          }
          return 'Usage: docker system df';
        }

        case 'compose':
          return executeComposeCommand(rest);

        default:
          return `docker: '${subcommand || ''}' is not a docker command.
See 'docker --help'.`;
      }
    },
    [
      dockerState,
      executeComposeCommand,
      findContainer,
      findImage,
      pullImage,
      runContainer,
      runningContainers.length,
    ]
  );

  function executeComposeCommand(args: string[]) {
      const action = args[0];

      if (action === 'up') {
        const detached = args.includes('-d') || args.includes('--detach');
        const apiExists = dockerState.containers.some((container) => container.name === 'docker-sim-api-1');
        const dbExists = dockerState.containers.some((container) => container.name === 'docker-sim-db-1');

        setDockerState((prev) => {
          const images = [...prev.images];
          for (const ref of ['devops-api:1.0', 'postgres:16-alpine']) {
            if (!images.some((image) => imageName(image) === ref)) {
              const registryImage = REGISTRY_IMAGES[ref];
              if (registryImage) images.push(cloneImage(registryImage));
            }
          }

          if (!images.some((image) => imageName(image) === 'devops-api:1.0')) {
            images.push({
              repository: 'devops-api',
              tag: '1.0',
              id: 'cafe42f00d11',
              created: 'Less than a second ago',
              size: '189MB',
              description: 'Imagem da API Node.js de exemplo, gerada a partir do Dockerfile do tutorial.',
              layers: ['FROM node:20-alpine', 'WORKDIR /app', 'COPY app', 'CMD node server.js'],
            });
          }

          const networks = prev.networks.some((network) => network.name === 'appnet')
            ? prev.networks
            : [...prev.networks, { name: 'appnet', driver: 'bridge' as const, containers: [] }];

          const volumes = prev.volumes.some((volume) => volume.name === 'pgdata')
            ? prev.volumes
            : [
                ...prev.volumes,
                {
                  name: 'pgdata',
                  mountpoint: '/var/lib/docker/volumes/pgdata/_data',
                  usedBy: [],
                },
              ];

          const containers = [...prev.containers];
          if (!apiExists) {
            containers.push({
              id: idFromName('docker-sim-api-1', idCounter.current++),
              name: 'docker-sim-api-1',
              image: 'devops-api:1.0',
              command: 'node server.js',
              status: 'running',
              created: 'Less than a second ago',
              ports: ['3000:3000->tcp'],
              env: { NODE_ENV: 'production' },
              network: 'appnet',
              volumes: [],
              logs: ['api listening on :3000', 'connected to db:5432', 'GET /health 200 ok'],
              health: 'healthy',
            });
          }
          if (!dbExists) {
            containers.push({
              id: idFromName('docker-sim-db-1', idCounter.current++),
              name: 'docker-sim-db-1',
              image: 'postgres:16-alpine',
              command: 'docker-entrypoint.sh postgres',
              status: 'running',
              created: 'Less than a second ago',
              ports: ['5432/tcp'],
              env: { POSTGRES_PASSWORD: 'secret' },
              network: 'appnet',
              volumes: ['pgdata:/var/lib/postgresql/data'],
              logs: ['database system is ready to accept connections'],
              health: 'healthy',
            });
          }

          return {
            ...prev,
            images,
            containers,
            networks: networks.map((network) =>
              network.name === 'appnet'
                ? {
                    ...network,
                    containers: Array.from(
                      new Set([...network.containers, 'docker-sim-api-1', 'docker-sim-db-1'])
                    ),
                  }
                : network
            ),
            volumes: volumes.map((volume) =>
              volume.name === 'pgdata'
                ? { ...volume, usedBy: Array.from(new Set([...volume.usedBy, 'docker-sim-db-1'])) }
                : volume
            ),
            composeRunning: true,
          };
        });

        return `${detached ? '' : '[+] Running 2/2\n'} Network docker-sim_appnet  Created
 Container docker-sim-db-1   Started
 Container docker-sim-api-1  Started`;
      }

      if (action === 'ps') {
        const composeContainers = dockerState.containers.filter((container) =>
          container.name.startsWith('docker-sim-')
        );
        if (composeContainers.length === 0) return 'NAME      IMAGE     SERVICE   STATUS    PORTS';
        return [
          'NAME                IMAGE                SERVICE   STATUS       PORTS',
          ...composeContainers.map((container) =>
            `${container.name.padEnd(20)} ${container.image.padEnd(20)} ${container.name.includes('api') ? 'api'.padEnd(9) : 'db'.padEnd(9)} ${container.status.padEnd(12)} ${container.ports.join(', ') || '-'}`
          ),
        ].join('\n');
      }

      if (action === 'logs') {
        const target = args[1];
        const containers = dockerState.containers.filter((container) =>
          target
            ? container.name === `docker-sim-${target}-1` || container.name.includes(target)
            : container.name.startsWith('docker-sim-')
        );

        return containers
          .flatMap((container) => container.logs.map((line) => `${container.name}  | ${line}`))
          .join('\n');
      }

      if (action === 'down') {
        setDockerState((prev) => ({
          ...prev,
          containers: prev.containers.filter((container) => !container.name.startsWith('docker-sim-')),
          networks: prev.networks
            .filter((network) => network.name !== 'docker-sim_default')
            .map((network) =>
              network.name === 'appnet'
                ? {
                    ...network,
                    containers: network.containers.filter((name) => !name.startsWith('docker-sim-')),
                  }
                : network
            ),
          volumes: prev.volumes.map((volume) => ({
            ...volume,
            usedBy: volume.usedBy.filter((name) => !name.startsWith('docker-sim-')),
          })),
          composeRunning: false,
        }));

        return `Container docker-sim-api-1  Removed
Container docker-sim-db-1   Removed
Network docker-sim_default  Removed`;
      }

    return 'Usage: docker compose [up|ps|logs|down]';
  }

  const executeCommand = useCallback(
    (cmd: string): ExecuteResult => {
      const trimmed = cmd.trim();
      const parts = splitCommand(trimmed);
      const command = parts[0];

      if (!command) return { output: '', type: 'output' };

      if (command === 'clear') {
        return { output: '', type: 'output', clear: true };
      }

      if (command === 'help') {
        return {
          type: 'output',
          output: `Comandos disponíveis:
  docker version
  docker info
  docker pull IMAGE
  docker images
  docker ps [-a]
  docker run [options] IMAGE
  docker stop|start|restart CONTAINER
  docker logs CONTAINER
  docker exec CONTAINER COMMAND
  docker inspect CONTAINER
  docker build -t NAME:TAG .
  docker history IMAGE
  docker network create|ls
  docker volume create|ls
  docker compose up|ps|logs|down
  cat Dockerfile
  cat compose.yaml
  clear`,
        };
      }

      if (command === 'ls') {
        return { type: 'output', output: 'Dockerfile  compose.yaml  package.json  server.js' };
      }

      if (command === 'cat') {
        const target = parts[1];
        if (target === 'Dockerfile') return { type: 'output', output: SAMPLE_DOCKERFILE };
        if (target === 'compose.yaml' || target === 'docker-compose.yml') {
          return { type: 'output', output: SAMPLE_COMPOSE };
        }
        if (target === 'package.json') {
          return {
            type: 'output',
            output: '{\n  "scripts": { "start": "node server.js" },\n  "dependencies": { "fastify": "^5.0.0" }\n}',
          };
        }
        return { type: 'error', output: `cat: ${target || ''}: No such file or directory` };
      }

      if (command === 'docker-compose') {
        return { type: 'output', output: executeComposeCommand(parts.slice(1)) };
      }

      if (command === 'docker') {
        const output = executeDockerCommand(parts.slice(1));
        const type = output.includes('Error') || output.includes('not found') ? 'error' : 'output';
        return { output, type };
      }

      return { type: 'error', output: `${command}: command not found` };
    },
    [executeComposeCommand, executeDockerCommand]
  );

  const onReset = useCallback(() => {
    setDockerState(createInitialState());
    idCounter.current = 1;
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
    handleSubmit,
    handleKeyDown,
    resetProgress,
    jumpToLesson,
  } = useTerminalSimulator({
    lessons: LESSONS,
    execute: executeCommand,
    matches: (cmd, command) => commandMatches(cmd, command.expectedCommand),
    successMessage: (command) => `OK: ${command.explanation}`,
    availableCommands: AVAILABLE_COMMANDS,
    onReset,
  });

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="mb-5 text-center">
        <div className="mb-3 flex items-center justify-center gap-2.5">
          <Container className="h-8 w-8 text-primary" strokeWidth={1.5} />
          <h2 className="text-2xl font-bold md:text-3xl">Laboratório de terminal Docker</h2>
        </div>
        <p className="mx-auto max-w-2xl text-base text-muted-foreground">
          Pratique fluxos reais da CLI do Docker num simulador seguro no navegador. Rode containers, leia
          logs, gere imagens, conecte redes, guarde dados em volumes e gerencie uma stack do Compose
          sem precisar de um daemon Docker local.
        </p>
      </div>

      <Card className="mb-4">
        <CardContent className="px-4 py-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="font-medium">Progresso</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {completedCount}/{totalCommands} comandos concluídos
            </span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
          {progressPercentage === 100 && (
            <p className="mt-2 text-center font-medium text-emerald-600">
              Concluído! Agora você pode refazer o laboratório ou experimentar à vontade.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[270px_minmax(0,1fr)_330px]">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-5 w-5" />
              Lições
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4 pt-0">
            {LESSONS.map((lesson, index) => {
              const lessonCompletedCount = lesson.commands.filter((_, commandIndex) =>
                completedCommands.has(`${lesson.id}-${commandIndex}`)
              ).length;
              const isComplete = lessonCompletedCount === lesson.commands.length;
              const isCurrent = index === currentLessonIndex;

              return (
                <button
                  key={lesson.id}
                  onClick={() => jumpToLesson(index)}
                  className={cn(
                    'w-full rounded-md border p-2.5 text-left transition-colors',
                    isCurrent
                      ? 'border-primary/60 bg-primary/10'
                      : 'border-transparent hover:bg-muted'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isComplete ? (
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                      ) : (
                        lesson.icon
                      )}
                      <span className="text-sm font-medium">{lesson.title}</span>
                    </div>
                    <Badge variant={isComplete ? 'default' : 'secondary'}>
                      {lessonCompletedCount}/{lesson.commands.length}
                    </Badge>
                  </div>
                  <p className="mt-1 pl-7 text-xs text-muted-foreground">{lesson.description}</p>
                </button>
              );
            })}

            <Button variant="outline" onClick={resetProgress} className="mt-3 w-full">
              <RotateCcw className="mr-2 h-4 w-4" />
              Reiniciar laboratório
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {currentCommand && (
            <Card className="border-primary/50">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ChevronRight className="h-5 w-5 text-primary" />
                    Tarefa atual
                  </CardTitle>
                  <Badge>
                    Passo {currentCommandIndex + 1}/{currentLesson.commands.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="mb-3 text-base">{currentCommand.instruction}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHint((value) => !value)}
                  className="text-muted-foreground"
                >
                  <Lightbulb className="mr-1 h-4 w-4" />
                  {showHint ? 'Esconder dica' : 'Mostrar dica'}
                </Button>
                {showHint && (
                  <div className="mt-3 rounded-md border border-yellow-200 bg-yellow-50 p-2.5 dark:border-yellow-800 dark:bg-yellow-950/30">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Dica: {currentCommand.hint}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="border-border bg-[#171717]">
            <CardHeader className="border-b border-border/60 bg-[#262626] p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  </div>
                  <span className="ml-2 text-sm text-muted-foreground">docker-lab ~/app</span>
                </div>
                <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
                  <span>{dockerState.images.length} images</span>
                  <span>{runningContainers.length} running</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div
                ref={terminalRef}
                onClick={() => inputRef.current?.focus()}
                className="h-[25rem] cursor-text overflow-y-auto p-3 font-mono text-[13px] sm:text-sm"
              >
                {terminalHistory.length === 0 && (
                  <div className="mb-4 text-green-400">
                    <p>Boas-vindas ao laboratório de terminal Docker.</p>
                    <p className="mt-2 text-muted-foreground">
                      Digite "help" para ver os comandos disponíveis ou siga a tarefa atual.
                    </p>
                  </div>
                )}

                {terminalHistory.map((line, index) => (
                  <div
                    key={`${line.timestamp.getTime()}-${index}`}
                    className={cn(
                      'mb-1',
                      line.type === 'input' && 'text-white',
                      line.type === 'output' && 'text-slate-300',
                      line.type === 'error' && 'text-red-400',
                      line.type === 'success' &&
                        'my-2 rounded border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-300'
                    )}
                  >
                    {line.type === 'input' && <span className="text-green-400">$ </span>}
                    <span className="whitespace-pre-wrap break-words">{line.content}</span>
                  </div>
                ))}

                <form onSubmit={handleSubmit} className="flex items-center">
                  <span className="text-green-400">$ </span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    onKeyDown={handleKeyDown}
                    className="ml-1 flex-1 bg-transparent text-white caret-green-400 outline-none"
                    spellCheck={false}
                    autoComplete="off"
                    autoCapitalize="off"
                  />
                </form>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base">Referência rápida</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ['docker ps', 'Containers em execução'],
                  ['docker logs web', 'Lê stdout/stderr'],
                  ['docker exec web sh', 'Roda dentro de um container'],
                  ['docker compose up -d', 'Sobe uma stack'],
                ].map(([command, label]) => (
                  <div key={command} className="rounded-md bg-muted p-2">
                    <code className="text-primary">{command}</code>
                    <p className="mt-1 text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Server className="h-5 w-5" />
                Daemon do Docker
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-0">
              <div className="grid grid-cols-2 gap-2">
                <Metric label="Imagens" value={dockerState.images.length} icon={<HardDrive />} />
                <Metric label="Rodando" value={runningContainers.length} icon={<Play />} />
                <Metric label="Redes" value={dockerState.networks.length} icon={<Network />} />
                <Metric label="Volumes" value={dockerState.volumes.length} icon={<Database />} />
              </div>
              <div className="rounded-md border bg-muted/40 p-2.5">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium">Engine</span>
                  <Badge variant="secondary">overlay2</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Containers compartilham o kernel do host, isolam processos com namespaces e guardam
                  dados mutáveis em volumes.
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Container className="h-5 w-5" />
                Containers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4 pt-0">
              {dockerState.containers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum container ainda.</p>
              ) : (
                dockerState.containers.map((container) => (
                  <div key={container.id} className="rounded-md border p-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium">{container.name}</div>
                        <div className="text-xs text-muted-foreground">{container.image}</div>
                      </div>
                      <Badge
                        variant={container.status === 'running' ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {container.status}
                      </Badge>
                    </div>
                    <div className="mt-2 grid gap-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        {container.status === 'running' ? (
                          <Play className={cn('h-3.5 w-3.5', statusColor(container.status))} />
                        ) : (
                          <Square className={cn('h-3.5 w-3.5', statusColor(container.status))} />
                        )}
                        {container.ports.length ? container.ports.join(', ') : 'nenhuma porta publicada'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Network className="h-3.5 w-3.5" />
                        {container.network}
                      </div>
                      {container.volumes.length > 0 && (
                        <div className="flex items-center gap-2">
                          <HardDrive className="h-3.5 w-3.5" />
                          {container.volumes.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <HardDrive className="h-5 w-5" />
                Imagens
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4 pt-0">
              {dockerState.images.map((image) => (
                <div key={imageName(image)} className="rounded-md border p-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <code className="text-sm font-semibold text-primary">{imageName(image)}</code>
                    <span className="text-xs text-muted-foreground">{image.size}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{image.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {image.layers.slice(0, 4).map((layer) => (
                      <span
                        key={layer}
                        className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {layer}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Network className="h-5 w-5" />
                Redes e volumes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-0">
              <div className="space-y-2">
                {dockerState.networks.map((network) => (
                  <div
                    key={network.name}
                    className="flex items-center justify-between rounded-md border px-2.5 py-2 text-sm"
                  >
                    <span>{network.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {network.driver} / {network.containers.length} attached
                    </span>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {dockerState.volumes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum volume nomeado ainda.</p>
                ) : (
                  dockerState.volumes.map((volume) => (
                    <div
                      key={volume.name}
                      className="flex items-center justify-between rounded-md border px-2.5 py-2 text-sm"
                    >
                      <span>{volume.name}</span>
                      <span className="text-xs text-muted-foreground">
                        used by {volume.usedBy.length}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactElement<{ className?: string; strokeWidth?: number }>;
}) {
  return (
    <div className="rounded-md border bg-card p-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        {React.cloneElement(icon, {
          className: 'h-4 w-4 text-primary',
          strokeWidth: 1.5,
        })}
        <span className="text-xl font-bold tabular-nums">{value}</span>
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
