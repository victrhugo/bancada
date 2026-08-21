import type { Metadata } from 'next';
import DockerUnderTheHoodSimulator from '@/components/games/docker-under-the-hood-simulator';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('docker-under-the-hood-simulator');
}

const seoLearningPoints = [
  'O que realmente acontece quando você roda docker run -p 8080:80 nginx, camada por camada',
  'Por que o CLI do docker é só um cliente REST que conversa com o daemon por um socket',
  'Como o dockerd delega ao containerd, e o que o containerd faz com as camadas da imagem',
  'O que é um bundle de runtime OCI: um config.json mais um rootfs',
  'Como o runc transforma esse bundle num processo em execução usando namespaces e cgroups',
  'Por que um container é um processo normal do host, não uma pequena máquina virtual',
];

function DockerEducational() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">
        Sobre este simulador de &quot;como o Docker funciona&quot;
      </h3>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-3 text-sm font-semibold">O que você vai aprender</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>O caminho completo do seu terminal até o kernel Linux</li>
            <li>As funções reais do CLI, dockerd, containerd e runc, e por que existem quatro deles</li>
            <li>O que é baixado de um registry, e que só camadas faltando são baixadas</li>
            <li>Como o bundle OCI (config.json + rootfs) descreve o container antes dele existir</li>
            <li>Quais features do kernel fazem o isolamento real: namespaces, cgroups, rede, mounts</li>
            <li>O comando real em cada passo, para você reproduzir tudo você mesmo</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">A pilha, de cima a baixo</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">docker CLI:</strong> transforma seu comando numa
              chamada de API sobre /var/run/docker.sock
            </li>
            <li>
              <strong className="text-foreground">dockerd:</strong> o motor; checa a imagem, prepara a
              config, baixa se necessário
            </li>
            <li>
              <strong className="text-foreground">containerd:</strong> desempacota camadas, rastreia
              estado, prepara o bundle de runtime
            </li>
            <li>
              <strong className="text-foreground">runc:</strong> cria os namespaces e o cgroup, depois
              faz exec do seu processo
            </li>
            <li>
              <strong className="text-foreground">o kernel:</strong> o kernel compartilhado do host é a
              fronteira real
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Um container não é uma pequena VM</h4>
        <p className="text-sm text-muted-foreground">
          A ideia mais importante do simulador é o último passo. Uma VM inicializa um sistema
          operacional convidado inteiro sobre hardware virtual. Um container não: o nginx é um processo
          normal no seu host, e a única coisa separando ele de tudo mais é um conjunto de features do
          kernel. Namespaces controlam o que ele pode ver, cgroups controlam o que ele pode usar, e os
          dois são só o kernel do host fazendo contabilidade. É por isso que um container inicia em
          milissegundos enquanto uma VM leva segundos.
        </p>
      </div>

      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Experimente num host real</h4>
        <p className="text-sm text-muted-foreground">
          Todo comando no simulador é real. A forma limpa de mexer com namespaces e cgroups sem tocar
          no seu laptop é uma máquina Linux descartável: suba um{' '}
          <a
            href="https://m.do.co/c/2a9bba940f39"
            rel="nofollow sponsored"
            className="font-medium text-primary underline underline-offset-2"
          >
            droplet da DigitalOcean
          </a>
          , rode o container nginx, depois use lsns, runc list, e cat /sys/fs/cgroup para observar as
          mesmas peças que o simulador mostra. Delete o droplet quando terminar.
        </p>
      </div>

      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Vá mais fundo</h4>
        <p className="text-sm text-muted-foreground">
          O post relacionado,{' '}
          <a
            href="https://bancada.app/posts/how-docker-works-under-the-hood"
            className="font-medium text-primary underline underline-offset-2"
          >
            How Docker Really Works, From docker run to the Kernel
          </a>
          , percorre o mesmo caminho em profundidade com os comandos para rodar num host real, e
          explica por que a divisão entre dockerd, containerd e runc existe.
        </p>
      </div>
    </>
  );
}

export default function DockerUnderTheHoodSimulatorPage() {
  return (
    <SimulatorShell
      slug="docker-under-the-hood-simulator"
      fallbackTitle="Como o Docker Funciona por Baixo dos Panos"
      fallbackDescription="Percorra o que realmente acontece quando você roda docker run -p 8080:80 nginx: o CLI, o dockerd, o pull do registry, o containerd, o bundle OCI, o runc, e o kernel Linux compartilhado, com o comando real em cada camada."
      educational={<DockerEducational />}
      seoLearningPoints={seoLearningPoints}
      shareText="O que realmente acontece quando você roda um container docker? Percorra toda a pilha do CLI até o kernel neste simulador interativo."
    >
      <DockerUnderTheHoodSimulator />
    </SimulatorShell>
  );
}
