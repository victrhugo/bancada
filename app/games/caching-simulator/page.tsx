import type { Metadata } from 'next';
import CachingSimulator from '../../../components/games/caching-simulator';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('caching-simulator');
}

function CachingEducational() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">Entendendo estratégias de cache</h3>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-3 font-semibold text-sm">Políticas de remoção (eviction)</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">LRU (Least Recently Used):</strong> remove os itens
              não acessados recentemente. A mais comum na prática.
            </li>
            <li>
              <strong className="text-foreground">LFU (Least Frequently Used):</strong> remove os itens
              acessados com menos frequência. Ótima para identificar dados quentes.
            </li>
            <li>
              <strong className="text-foreground">FIFO (First In, First Out):</strong> abordagem
              simples de fila: remove primeiro os itens mais antigos.
            </li>
            <li>
              <strong className="text-foreground">TTL (Time To Live):</strong> remove os itens pelo
              tempo de expiração. Comum para sessões.
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-sm">Estratégias de escrita</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Write-through:</strong> grava no cache e no banco ao
              mesmo tempo. Consistência forte, mas latência maior.
            </li>
            <li>
              <strong className="text-foreground">Write-back:</strong> grava primeiro no cache e depois,
              de forma assíncrona, no banco. Mais desempenho, com risco de perder dados.
            </li>
            <li>
              <strong className="text-foreground">Write-around:</strong> grava direto no banco, sem
              passar pelo cache. Reduz a poluição do cache.
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 font-semibold text-sm">Conceitos-chave</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">Hit rate:</strong> porcentagem de requisições
            atendidas pelo cache (quanto maior, melhor).
          </li>
          <li>
            <strong className="text-foreground">Tamanho do cache:</strong> equilíbrio entre uso de
            memória e hit rate.
          </li>
          <li>
            <strong className="text-foreground">Dados quentes:</strong> itens acessados com
            frequência, os que mais ganham com cache.
          </li>
          <li>
            <strong className="text-foreground">Invalidação de cache:</strong> um dos problemas mais
            difíceis da computação.
          </li>
        </ul>
      </div>
    </>
  );
}

export default function CachingSimulatorPage() {
  return (
    <SimulatorShell slug="caching-simulator" educational={<CachingEducational />}>
      <CachingSimulator />
    </SimulatorShell>
  );
}
