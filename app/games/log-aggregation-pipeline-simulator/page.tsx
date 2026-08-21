import type { Metadata } from 'next';
import LogAggregationPipelineSimulator from '@/components/games/log-aggregation-pipeline-simulator';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('log-aggregation-pipeline-simulator');
}

const seoLearningPoints = [
  'Como logs de aplicação se movem por coletores, processadores, buffers, índices e busca',
  'Por que parsing e filtragem acontecem antes da indexação durável',
  'Como buffers limitados absorvem rajadas curtas mas eventualmente transbordam',
  'Como picos de tráfego, incompatibilidades de parser e indexação lenta criam sinais de falha diferentes',
  'Como o roteamento de documentos distribui logs indexados entre shards de busca',
  'Por que eventos filtrados, rejeitados e descartados nunca aparecem nos resultados de busca',
];

function LogAggregationEducational() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">Como um pipeline de logs se mantém confiável</h3>
      <div className="grid gap-6 md:grid-cols-3">
        <div>
          <h4 className="mb-2 text-sm font-semibold">1. Colete perto da fonte</h4>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Agentes leves seguem (tail) arquivos ou a saída de containers e encaminham eventos.
            Filas locais evitam que um problema breve de rede perca logs imediatamente.
          </p>
        </div>
        <div>
          <h4 className="mb-2 text-sm font-semibold">2. Estruture antes do armazenamento</h4>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Parsers extraem campos pesquisáveis, enriquecimento adiciona contexto, e filtros removem
            ruído conhecido. Contadores de rejeição expõem mudanças de formato antes que virem pontos cegos.
          </p>
        </div>
        <div>
          <h4 className="mb-2 text-sm font-semibold">3. Faça buffer da diferença de ritmo</h4>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Coleta e indexação raramente rodam exatamente no mesmo ritmo. Um buffer durável e limitado
            absorve rajadas enquanto alertas de fila dão tempo aos operadores para restaurar capacidade.
          </p>
        </div>
      </div>

      <div className="mt-6 border-t border-border pt-5">
        <h4 className="mb-2 text-sm font-semibold">O que alertar em produção</h4>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Monitore a taxa de entrada, idade e profundidade da fila, taxa de rejeição do parser,
          utilização do buffer, eventos descartados, latência de indexação, e balanço de shards
          juntos. Uma única consulta de busca saudável não prova que o pipeline está completo: logs
          faltando podem ter sido rejeitados bem antes de chegar ao índice.
        </p>
      </div>
    </>
  );
}

export default function LogAggregationPipelineSimulatorPage() {
  return (
    <SimulatorShell
      slug="log-aggregation-pipeline-simulator"
      fallbackTitle="Simulador de Pipeline de Agregação de Logs"
      fallbackDescription="Acompanhe logs pela coleta, parsing, buffer, indexação em shards, e busca."
      educational={<LogAggregationEducational />}
      seoLearningPoints={seoLearningPoints}
      shareText="Veja como logs de produção se movem de aplicações até shards pesquisáveis—e onde falhas de parser e backpressure podem perdê-los."
    >
      <LogAggregationPipelineSimulator />
    </SimulatorShell>
  );
}
