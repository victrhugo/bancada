import type { Metadata } from 'next';
import Link from 'next/link';
import LatencyPercentilesSimulator from '@/components/games/latency-percentiles-simulator';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('latency-percentiles-simulator');
}

function LatencyPercentilesEducational() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">Como funcionam as latências P90, P95 e P99</h3>
      <div className="grid gap-6 md:grid-cols-3">
        <div>
          <h4 className="mb-3 text-sm font-semibold">Percentis são posições em uma lista ordenada</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">P90:</strong> ordene todas as requisições pela
              latência. O P90 é o ponto em que 90% das requisições ficam iguais ou abaixo desse valor.
            </li>
            <li>
              <strong className="text-foreground">P95:</strong> deixa só os 5% mais lentos acima do
              corte, o que o torna útil para SLOs e dashboards voltados ao usuário.
            </li>
            <li>
              <strong className="text-foreground">P99:</strong> foca no 1% mais lento, então revela
              caminhos raros, mas dolorosos, que a média costuma esconder.
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Por que a média não basta</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Algumas requisições muito lentas podem ficar invisíveis quando a mediana e a média parecem normais.</li>
            <li>
              A latência de cauda costuma vir de retries, espera por locks, cold starts, cache misses
              ou dependências lentas.
            </li>
            <li>Percentis mostram quantos usuários são afetados, e não só quão lenta é a requisição típica.</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Como usar na prática</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Use o P50 para entender o caminho normal das requisições.</li>
            <li>Use o P90 ou o P95 para acompanhar a experiência geral e a saúde dos SLOs.</li>
            <li>Use o P99 para investigar eventos de cauda, limites de capacidade e regressões de confiabilidade.</li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Continue aprendendo</h4>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            className="rounded-md border bg-background px-3 py-2 hover:border-primary/50"
            href="/games/promql-playground"
          >
            PromQL playground
          </Link>
        </div>
      </div>
    </>
  );
}

export default function LatencyPercentilesPage() {
  return (
    <SimulatorShell
      slug="latency-percentiles-simulator"
      educational={<LatencyPercentilesEducational />}
      shareText="Experimente o Simulador de Latência P90, P95 e P99 no Bancada."
      seoLearningPoints={[
        'Entender que P90, P95 e P99 são pontos de corte por percentil',
        'Visualizar como distribuições de latência criam uma cauda longa',
        'Comparar latência média, mediana e por percentil',
        'Ver por que o P99 revela requisições lentas que a média esconde',
        'Praticar a escolha da métrica de latência certa para SLOs e resposta a incidentes',
      ]}
    >
      <LatencyPercentilesSimulator />
    </SimulatorShell>
  );
}
