import type { Metadata } from 'next';
import LinuxTerminal from '@/components/games/linux-terminal';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('linux-terminal');
}

function LinuxTerminalEducational() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">Sobre este tutorial</h3>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-3 font-semibold text-sm">O que você vai aprender</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Navegar pelo sistema de arquivos do Linux com segurança</li>
            <li>Criar, copiar, mover e apagar arquivos e diretórios</li>
            <li>Ver e buscar o conteúdo de arquivos com cat, grep, head e tail</li>
            <li>Entender e alterar permissões de arquivos</li>
            <li>Usar pipes e redirecionamento para encadear comandos</li>
            <li>Verificar recursos do sistema com df, free e env</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-sm">Comandos principais</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Navegação:</strong> pwd, ls, cd
            </li>
            <li>
              <strong className="text-foreground">Arquivos:</strong> touch, mkdir, cp, mv, rm
            </li>
            <li>
              <strong className="text-foreground">Visualização:</strong> cat, head, tail, grep, wc,
              find
            </li>
            <li>
              <strong className="text-foreground">Sistema:</strong> whoami, hostname, df, free, env
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 font-semibold text-sm">Dicas para ir bem</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>
            Use as <strong className="text-foreground">setas para cima e para baixo</strong> para
            navegar pelo histórico de comandos.
          </li>
          <li>
            Digite <strong className="text-foreground">help</strong> para ver todos os comandos
            disponíveis.
          </li>
          <li>
            Digite <strong className="text-foreground">clear</strong> para limpar a tela do terminal.
          </li>
          <li>
            Clique em <strong className="text-foreground">Mostrar dica</strong> se travar.
          </li>
        </ul>
      </div>

      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 font-semibold text-sm">Por que aprender Linux?</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>O Linux roda a grande maioria da infraestrutura de nuvem do mundo.</li>
          <li>É essencial para quem trabalha com DevOps, SRE e desenvolvimento backend.</li>
          <li>É a base dos containers (Docker, Kubernetes).</li>
          <li>Entender Linux faz de você um desenvolvedor mais eficiente.</li>
        </ul>
      </div>
    </>
  );
}

export default function LinuxTerminalPage() {
  return (
    <SimulatorShell
      slug="linux-terminal"
      fallbackTitle="Aprenda Linux: Tutorial Interativo"
      fallbackDescription="Pratique comandos Linux em um simulador de terminal interativo. Aprenda os comandos essenciais para o trabalho com DevOps por meio de desafios práticos."
      educational={<LinuxTerminalEducational />}
      shareText="Aprenda comandos Linux de forma interativa! Um ótimo tutorial para quem está começando."
    >
      <LinuxTerminal />
    </SimulatorShell>
  );
}
