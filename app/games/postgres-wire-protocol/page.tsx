import type { Metadata } from 'next';
import Link from 'next/link';
import PostgresWireProtocolSimulator from '@/components/games/postgres-wire-protocol-simulator';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('postgres-wire-protocol');
}

function PostgresWireProtocolEducational() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">Como funciona o protocolo de rede do PostgreSQL</h3>
      <div className="grid gap-6 md:grid-cols-3">
        <div>
          <h4 className="mb-3 text-sm font-semibold">Inicialização</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">SSLRequest:</strong> o cliente pode perguntar se o
              servidor aceita TLS antes de enviar os parâmetros de inicialização.
            </li>
            <li>
              <strong className="text-foreground">StartupMessage:</strong> leva a versão do
              protocolo, o usuário, o banco e as opções da sessão.
            </li>
            <li>
              <strong className="text-foreground">ReadyForQuery:</strong> indica que a conexão está
              pronta para o próximo comando.
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Execução de consultas</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Simple query:</strong> envia uma única string SQL e
              recebe metadados, linhas, conclusão e o estado de pronto.
            </li>
            <li>
              <strong className="text-foreground">Extended query:</strong> divide o trabalho em
              Parse, Bind, Describe, Execute e Sync.
            </li>
            <li>
              <strong className="text-foreground">COPY:</strong> muda para um modo de streaming para
              importação ou exportação em massa.
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Por que isso importa</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Connection poolers precisam do estado da transação informado no ReadyForQuery.</li>
            <li>Os drivers usam o RowDescription para decodificar valores em texto e binário corretamente.</li>
            <li>Prepared statements reduzem o risco de SQL injection e podem reduzir o custo de parsing.</li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Continue aprendendo</h4>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            className="rounded-md border bg-background px-3 py-2 hover:border-primary/50"
            href="/games/database-replication-sharding-scaling"
          >
            Simulador de escala de banco de dados
          </Link>
          <Link
            className="rounded-md border bg-background px-3 py-2 hover:border-primary/50"
            href="/games/db-indexing-simulator"
          >
            Simulador de índices de banco de dados
          </Link>
        </div>
      </div>
    </>
  );
}

export default function PostgresWireProtocolPage() {
  return (
    <SimulatorShell
      slug="postgres-wire-protocol"
      educational={<PostgresWireProtocolEducational />}
      shareText="Experimente o Simulador do Protocolo de Rede do PostgreSQL no Bancada."
      seoLearningPoints={[
        'Visualizar as mensagens do protocolo entre cliente e servidor do PostgreSQL',
        'Entender StartupMessage, AuthenticationSASL e ReadyForQuery',
        'Comparar os fluxos de simple query e extended query',
        'Ver como as mensagens RowDescription e DataRow codificam o resultado',
        'Aprender como o COPY transmite dados em massa pela rede',
      ]}
    >
      <PostgresWireProtocolSimulator />
    </SimulatorShell>
  );
}
