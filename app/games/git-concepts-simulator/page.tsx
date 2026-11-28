import type { Metadata } from 'next';
import GitConceptsSimulator from '@/components/games/git-concepts-simulator';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('git-concepts-simulator');
}

function GitConceptsEducational() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">Sobre este simulador de Git</h3>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-3 text-sm font-semibold">O que você vai aprender</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Como se relacionam o diretório de trabalho, a staging area, o repositório local e o remoto</li>
            <li>Por que commits no Git são snapshots ligados ao commit pai</li>
            <li>Como branches e o HEAD funcionam como ponteiros móveis</li>
            <li>Quando um merge é fast-forward em vez de um merge commit</li>
            <li>Como o fetch atualiza as branches remotas sem mexer no seu trabalho</li>
            <li>Como o rebase reaplica commits sobre uma nova base</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Comandos principais</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Inspecionar:</strong> git status, git diff, git log,
              git branch
            </li>
            <li>
              <strong className="text-foreground">Registrar:</strong> git add, git commit
            </li>
            <li>
              <strong className="text-foreground">Branches:</strong> git switch, git merge
            </li>
            <li>
              <strong className="text-foreground">Remoto:</strong> git push, git fetch, git rebase
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Conceitos primeiro</h4>
        <p className="text-sm text-muted-foreground">
          Este laboratório segue a ideia de &quot;aprender os conceitos do Git, não os comandos&quot;:
          os comandos fazem mais sentido quando você vê o que se moveu entre a árvore de trabalho, o
          índice, os commits, os rótulos das branches e os remotos.
        </p>
      </div>

      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Seguro para o navegador</h4>
        <p className="text-sm text-muted-foreground">
          Este simulador não roda o Git de verdade. Ele simula um pequeno repositório no navegador para
          você experimentar com segurança e construir o modelo mental antes de usar os comandos em um
          trabalho real.
        </p>
      </div>
    </>
  );
}

export default function GitConceptsSimulatorPage() {
  return (
    <SimulatorShell
      slug="git-concepts-simulator"
      fallbackTitle="Simulador de Conceitos de Git"
      fallbackDescription="Pratique Git em um terminal interativo no navegador. Aprenda o diretório de trabalho, a staging area, commits, branches, remotos, merge, fetch e rebase com um modelo visual do repositório."
      educational={<GitConceptsEducational />}
      shareText="Aprenda os conceitos do Git com um terminal interativo e um modelo visual do repositório."
    >
      <GitConceptsSimulator />
    </SimulatorShell>
  );
}
