import type { Metadata } from 'next';
import DockerTerminalSimulator from '@/components/games/docker-terminal-simulator';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('docker-terminal-simulator');
}

function DockerTerminalEducational() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">Sobre este simulador de Docker</h3>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-3 text-sm font-semibold">O que você vai aprender</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Como a CLI do Docker conversa com um daemon local</li>
            <li>A diferença entre imagens, containers, camadas e tags</li>
            <li>Comandos do ciclo de vida de containers: run, ps, logs, stop, start, exec, inspect</li>
            <li>Como a publicação de portas liga o tráfego do host aos processos do container</li>
            <li>Por que volumes e redes definidas pelo usuário importam para aplicações com estado</li>
            <li>Como o Docker Compose coordena uma stack com vários containers</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Comandos principais</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Básico:</strong> docker version, docker info, docker
              images
            </li>
            <li>
              <strong className="text-foreground">Containers:</strong> docker run, ps, logs, stop,
              start, exec, inspect
            </li>
            <li>
              <strong className="text-foreground">Builds:</strong> Dockerfile, docker build, docker
              history
            </li>
            <li>
              <strong className="text-foreground">Estado:</strong> docker volume, docker network,
              docker compose
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Seguro para o navegador</h4>
        <p className="text-sm text-muted-foreground">
          Este laboratório não roda containers de verdade. Ele simula o estado do daemon do Docker no
          navegador para você praticar comandos com segurança, entender causa e efeito e criar memória
          muscular antes de usar o Docker na sua máquina ou no CI.
        </p>
      </div>

      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Por que aprender Docker?</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>O Docker empacota aplicações junto com as dependências de execução.</li>
          <li>Containers deixam o desenvolvimento local, o CI e os deploys em produção mais consistentes.</li>
          <li>Os fundamentos de Docker valem diretamente para Kubernetes e plataformas de containers na nuvem.</li>
        </ul>
      </div>
    </>
  );
}

export default function DockerTerminalSimulatorPage() {
  return (
    <SimulatorShell
      slug="docker-terminal-simulator"
      fallbackTitle="Simulador de Terminal Docker"
      fallbackDescription="Pratique comandos Docker em um terminal interativo no navegador. Aprenda imagens, containers, logs, exec, builds, volumes, redes e Docker Compose com lições guiadas."
      educational={<DockerTerminalEducational />}
      shareText="Pratique comandos Docker no navegador com este simulador interativo de terminal Docker."
    >
      <DockerTerminalSimulator />
    </SimulatorShell>
  );
}
