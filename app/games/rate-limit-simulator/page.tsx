import type { Metadata } from 'next';
import RateLimitSimulator from '../../../components/games/rate-limit-simulator';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('rate-limit-simulator');
}

function RateLimitEducational() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">Entendendo rate limiting</h3>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-3 font-semibold text-sm">O que você vai aprender</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Como o rate limiting protege APIs contra abuso</li>
            <li>Diferentes estratégias de backoff e quando usar cada uma</li>
            <li>Como ler e entender os headers de rate limit</li>
            <li>Como lidar bem com respostas HTTP 429</li>
            <li>Como otimizar o padrão de requisições para ganhar throughput</li>
            <li>Exemplos reais de rate limiting em APIs</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-sm">Estratégias de backoff</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Atraso fixo:</strong> simples, mas pode causar o
              efeito manada (thundering herd).
            </li>
            <li>
              <strong className="text-foreground">Backoff linear:</strong> aumento previsível do atraso.
            </li>
            <li>
              <strong className="text-foreground">Backoff exponencial:</strong> reduz rapidamente a
              carga sobre os servidores.
            </li>
            <li>
              <strong className="text-foreground">Exponencial com jitter:</strong> evita retries
              sincronizados.
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 font-semibold text-sm">Dicas</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>Em produção, use sempre backoff exponencial com jitter.</li>
          <li>Monitore os headers de rate limit para antecipar o throttling antes que ele aconteça.</li>
          <li>Use circuit breakers para evitar falhas em cascata.</li>
          <li>Considere limites diferentes por plano de usuário (gratuito vs pago).</li>
        </ul>
      </div>
    </>
  );
}

export default function RateLimitSimulatorPage() {
  return (
    <SimulatorShell
      slug="rate-limit-simulator"
      educational={<RateLimitEducational />}
      shareText="Conheça este simulador de rate limit! Ótimo para aprender throttling de APIs e estratégias de backoff."
    >
      <RateLimitSimulator />
    </SimulatorShell>
  );
}
