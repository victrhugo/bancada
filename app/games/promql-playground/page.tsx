import type { Metadata } from 'next';
import PromqlPlayground from '../../../components/games/promql-playground';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('promql-playground');
}

function PromqlEducational() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">Entendendo Prometheus e PromQL</h3>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-3 font-semibold text-sm">Conceitos principais</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Série temporal:</strong> um fluxo de valores com
              timestamp, identificado por um nome de métrica e por labels (pares chave-valor).
            </li>
            <li>
              <strong className="text-foreground">Instant vector:</strong> um conjunto de séries com
              uma amostra por série em um único instante.
            </li>
            <li>
              <strong className="text-foreground">Range vector:</strong> um conjunto de séries com
              várias amostras ao longo de um intervalo (por exemplo, [5m]).
            </li>
            <li>
              <strong className="text-foreground">Scalar:</strong> um valor numérico simples de ponto
              flutuante.
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-sm">Funções comuns</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">rate():</strong> calcula a taxa por segundo ao longo
              de um intervalo (para counters).
            </li>
            <li>
              <strong className="text-foreground">irate():</strong> taxa instantânea baseada nas duas
              últimas amostras (reage mais rápido).
            </li>
            <li>
              <strong className="text-foreground">sum/avg/max/min:</strong> operadores de agregação
              sobre várias séries.
            </li>
            <li>
              <strong className="text-foreground">histogram_quantile():</strong> calcula percentis a
              partir dos buckets de um histograma.
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 font-semibold text-sm">Tipos de métrica</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">Counters:</strong> valores que só crescem (use rate()
            ou increase()).
          </li>
          <li>
            <strong className="text-foreground">Gauges:</strong> valores que sobem e descem (use
            diretamente).
          </li>
          <li>
            <strong className="text-foreground">Histograms:</strong> observações agrupadas em buckets
            por valor (use histogram_quantile()).
          </li>
          <li>
            <strong className="text-foreground">Summaries:</strong> quantis pré-calculados (use
            diretamente, sem histogram_quantile()).
          </li>
        </ul>
      </div>

      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 font-semibold text-sm">Filtro por labels</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>
            <code className="rounded bg-muted px-1 py-0.5">=</code> igual a:{' '}
            <code className="rounded bg-muted px-1 py-0.5">method=&quot;GET&quot;</code>
          </li>
          <li>
            <code className="rounded bg-muted px-1 py-0.5">!=</code> diferente de:{' '}
            <code className="rounded bg-muted px-1 py-0.5">status!=&quot;500&quot;</code>
          </li>
          <li>
            <code className="rounded bg-muted px-1 py-0.5">=~</code> casa com a regex:{' '}
            <code className="rounded bg-muted px-1 py-0.5">path=~&quot;/api/.*&quot;</code>
          </li>
          <li>
            <code className="rounded bg-muted px-1 py-0.5">!~</code> não casa com a regex:{' '}
            <code className="rounded bg-muted px-1 py-0.5">job!~&quot;dev-.*&quot;</code>
          </li>
        </ul>
      </div>
    </>
  );
}

export default function PromqlPlaygroundPage() {
  return (
    <SimulatorShell
      slug="promql-playground"
      educational={<PromqlEducational />}
      shareText="Domine a linguagem de consultas do Prometheus com este PromQL Playground interativo!"
    >
      <PromqlPlayground />
    </SimulatorShell>
  );
}
