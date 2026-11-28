import type { Metadata } from 'next';
import Link from 'next/link';
import DatabaseReplicationShardingScaling from '@/components/games/database-replication-sharding-scaling';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('database-replication-sharding-scaling');
}

function DatabaseScalingEducational() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">
        Replicação, sharding e escala de banco de dados: as contrapartidas
      </h3>
      <div className="grid gap-6 md:grid-cols-3">
        <div>
          <h4 className="mb-3 text-sm font-semibold">Replicação</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Escala de leitura:</strong> réplicas podem atender
              leituras, mas as escritas continuam precisando de coordenação.
            </li>
            <li>
              <strong className="text-foreground">Lag:</strong> a replicação assíncrona aumenta o
              throughput, mas permite leituras desatualizadas.
            </li>
            <li>
              <strong className="text-foreground">Failover:</strong> perder o primário exige promoção,
              consenso ou comportamento de quórum.
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Sharding</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Escala de escrita:</strong> os dados são divididos
              em shards, então vários primários podem aceitar escritas.
            </li>
            <li>
              <strong className="text-foreground">Shard keys:</strong> chaves desbalanceadas criam hot
              spots e consultas scatter/gather.
            </li>
            <li>
              <strong className="text-foreground">Rebalanceamento:</strong> adicionar shards pode
              mover muitos dados se a estratégia de particionamento for ruim.
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Escala</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Escala vertical:</strong> mais simples, mas uma hora
              esbarra nos limites de hardware e de custo.
            </li>
            <li>
              <strong className="text-foreground">Réplicas de leitura:</strong> ótimas para cargas com
              muita leitura, fracas para cargas com muita escrita.
            </li>
            <li>
              <strong className="text-foreground">Desenhos combinados:</strong> shards replicados são
              comuns em grandes sistemas de produção.
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Continue aprendendo</h4>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link className="rounded-md border bg-background px-3 py-2 hover:border-primary/50" href="/games/db-indexing-simulator">
            Simulador de índices de banco de dados
          </Link>
          <Link className="rounded-md border bg-background px-3 py-2 hover:border-primary/50" href="/games/dbms-simulator">
            Simulador de SGBDs
          </Link>
        </div>
      </div>
    </>
  );
}

export default function DatabaseReplicationShardingScalingPage() {
  return (
    <SimulatorShell
      slug="database-replication-sharding-scaling"
      educational={<DatabaseScalingEducational />}
      shareText="Experimente o simulador de Replicação, Sharding e Escala de Banco de Dados no Bancada."
      seoLearningPoints={[
        'Entender quando a replicação ajuda nas leituras e na disponibilidade',
        'Ver por que o sharding é necessário para escalar escritas',
        'Comparar as contrapartidas da replicação síncrona e assíncrona',
        'Explorar a escolha da shard key e o comportamento de hot spots',
        'Equilibrar desempenho, confiabilidade e custo do banco de dados',
      ]}
    >
      <DatabaseReplicationShardingScaling />
    </SimulatorShell>
  );
}
