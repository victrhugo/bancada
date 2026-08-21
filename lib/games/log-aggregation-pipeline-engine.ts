/**
 * Pure state machine for the log aggregation pipeline simulator.
 *
 * A tick advances one stage, not the whole pipeline. Keeping this logic free
 * from React makes the teaching flow deterministic and lets tests enforce the
 * same conservation rules an operator expects from a real pipeline.
 */

export type PipelineStageId =
  | 'sources'
  | 'collector'
  | 'processor'
  | 'buffer'
  | 'storage'
  | 'query';

export type LogScenarioId = 'healthy' | 'spike' | 'parse-failure' | 'slow-index';
export type ParserMode = 'json' | 'grok';
export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export interface PipelineStage {
  id: PipelineStageId;
  shortLabel: string;
  title: string;
  role: string;
  watches: string;
}

export const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 'sources',
    shortLabel: 'Fontes',
    title: 'Apps e hosts',
    role: 'Aplicações, containers e hosts emitem eventos de log brutos.',
    watches: 'Observe a taxa de entrada. Um aumento repentino costuma ser o primeiro sinal de um incidente.',
  },
  {
    id: 'collector',
    shortLabel: 'Coletar',
    title: 'Fluent Bit',
    role: 'Um agente leve segue arquivos (tail) e encaminha cada evento.',
    watches: 'A fila de origem cresce quando os agentes não conseguem encaminhar tão rápido quanto os logs chegam.',
  },
  {
    id: 'processor',
    shortLabel: 'Processar',
    title: 'Parse e filtro',
    role: 'O processador extrai campos, enriquece eventos, e remove ruído.',
    watches: 'Rejeições de parser significam que o formato de entrada não bate mais com o parser configurado.',
  },
  {
    id: 'buffer',
    shortLabel: 'Buffer',
    title: 'Buffer durável',
    role: 'Uma fila limitada absorve rajadas curtas e desacopla o parsing da indexação.',
    watches: 'Um buffer crescendo é backpressure. Um buffer cheio transforma pressão em logs descartados.',
  },
  {
    id: 'storage',
    shortLabel: 'Indexar',
    title: 'Cluster de busca',
    role: 'Shards no estilo Elasticsearch indexam os eventos aceitos e estruturados.',
    watches: 'Shards desbalanceados ou saturados aumentam a latência de indexação e consulta.',
  },
  {
    id: 'query',
    shortLabel: 'Buscar',
    title: 'Explorar logs',
    role: 'Operadores consultam campos indexados para investigar o comportamento em produção.',
    watches:
      'Só logs indexados são pesquisáveis; logs filtrados, rejeitados e descartados nunca chegam aqui.',
  },
];

export interface LogScenario {
  id: LogScenarioId;
  label: string;
  summary: string;
  sourceRate: number;
  sourceCapacity: number;
  collectorCapacity: number;
  processorCapacity: number;
  bufferCapacity: number;
  indexCapacity: number;
  parseFailureRate: number;
  noiseRate: number;
}

export const LOG_SCENARIOS: Record<LogScenarioId, LogScenario> = {
  healthy: {
    id: 'healthy',
    label: 'Fluxo saudável',
    summary: 'Todo estágio tem capacidade suficiente, então as filas escoam normalmente.',
    sourceRate: 24,
    sourceCapacity: 100,
    collectorCapacity: 32,
    processorCapacity: 30,
    bufferCapacity: 120,
    indexCapacity: 28,
    parseFailureRate: 0,
    noiseRate: 0.2,
  },
  spike: {
    id: 'spike',
    label: 'Pico de tráfego',
    summary: 'Uma rajada ultrapassa a coleta e cria pressão na borda.',
    sourceRate: 84,
    sourceCapacity: 150,
    collectorCapacity: 38,
    processorCapacity: 34,
    bufferCapacity: 130,
    indexCapacity: 30,
    parseFailureRate: 0,
    noiseRate: 0.18,
  },
  'parse-failure': {
    id: 'parse-failure',
    label: 'Incompatibilidade de parser',
    summary: 'Um deployment muda o formato do log e o parsing estruturado rejeita eventos.',
    sourceRate: 30,
    sourceCapacity: 110,
    collectorCapacity: 36,
    processorCapacity: 34,
    bufferCapacity: 120,
    indexCapacity: 30,
    parseFailureRate: 0.45,
    noiseRate: 0.15,
  },
  'slow-index': {
    id: 'slow-index',
    label: 'Indexação lenta',
    summary: 'O armazenamento não consegue acompanhar, então o buffer durável absorve o backpressure.',
    sourceRate: 36,
    sourceCapacity: 120,
    collectorCapacity: 40,
    processorCapacity: 38,
    bufferCapacity: 105,
    indexCapacity: 9,
    parseFailureRate: 0,
    noiseRate: 0.12,
  },
};

export interface IndexedLog {
  id: string;
  cycle: number;
  level: LogLevel;
  service: 'api' | 'worker' | 'checkout';
  message: string;
  parser: ParserMode;
  shard: number;
}

export interface PipelineState {
  scenarioId: LogScenarioId;
  parserMode: ParserMode;
  filterNoise: boolean;
  /** The next stage that will run. */
  stageIndex: number;
  cycle: number;
  sourceQueue: number;
  processQueue: number;
  bufferQueue: number;
  generated: number;
  collected: number;
  processed: number;
  filtered: number;
  parseFailed: number;
  indexed: number;
  dropped: number;
  shardLoads: [number, number, number];
  indexedLogs: IndexedLog[];
  lastEvent: string;
}

export interface PipelineSettings {
  scenarioId?: LogScenarioId;
  parserMode?: ParserMode;
  filterNoise?: boolean;
}

export function createPipelineState(settings: PipelineSettings = {}): PipelineState {
  return {
    scenarioId: settings.scenarioId ?? 'healthy',
    parserMode: settings.parserMode ?? 'json',
    filterNoise: settings.filterNoise ?? true,
    stageIndex: 0,
    cycle: 1,
    sourceQueue: 0,
    processQueue: 0,
    bufferQueue: 0,
    generated: 0,
    collected: 0,
    processed: 0,
    filtered: 0,
    parseFailed: 0,
    indexed: 0,
    dropped: 0,
    shardLoads: [0, 0, 0],
    indexedLogs: [],
    lastEvent: 'Pronto. Gere um lote para iniciar o pipeline.',
  };
}

function nextStage(state: PipelineState, changes: Partial<PipelineState>): PipelineState {
  const stageIndex = (state.stageIndex + 1) % PIPELINE_STAGES.length;
  return {
    ...state,
    ...changes,
    stageIndex,
    cycle: stageIndex === 0 ? state.cycle + 1 : state.cycle,
  };
}

function deterministicLoss(amount: number, rate: number): number {
  if (amount === 0 || rate === 0) return 0;
  return Math.max(1, Math.floor(amount * rate));
}

const SAMPLE_LOGS: Array<Pick<IndexedLog, 'level' | 'service' | 'message'>> = [
  { level: 'INFO', service: 'api', message: 'request completed status=200 latency=42ms' },
  { level: 'WARN', service: 'worker', message: 'job retry scheduled attempt=2' },
  { level: 'ERROR', service: 'checkout', message: 'payment provider timeout after=3s' },
  { level: 'INFO', service: 'checkout', message: 'cart converted order_id=ord_1042' },
  { level: 'WARN', service: 'api', message: 'rate limit at 82 percent capacity' },
  { level: 'INFO', service: 'worker', message: 'queue batch processed count=24' },
];

function makeIndexedLogs(
  state: PipelineState,
  count: number,
  shardLoads: [number, number, number]
): IndexedLog[] {
  if (count === 0) return state.indexedLogs;

  // Keep the browser table useful without pretending to render every event.
  const sampleCount = Math.min(4, count);
  const added = Array.from({ length: sampleCount }, (_, offset) => {
    const sequence = state.indexed + offset;
    const sample = SAMPLE_LOGS[sequence % SAMPLE_LOGS.length];
    const shard = sequence % shardLoads.length;
    return {
      ...sample,
      id: `log-${state.cycle}-${sequence}`,
      cycle: state.cycle,
      parser: state.parserMode,
      shard,
    };
  });

  return [...added, ...state.indexedLogs].slice(0, 24);
}

export function advancePipeline(state: PipelineState): PipelineState {
  const scenario = LOG_SCENARIOS[state.scenarioId];
  const stage = PIPELINE_STAGES[state.stageIndex].id;

  if (stage === 'sources') {
    const queued = state.sourceQueue + scenario.sourceRate;
    const overflow = Math.max(0, queued - scenario.sourceCapacity);
    return nextStage(state, {
      generated: state.generated + scenario.sourceRate,
      sourceQueue: queued - overflow,
      dropped: state.dropped + overflow,
      lastEvent: overflow
        ? `As fontes emitiram ${scenario.sourceRate} logs; ${overflow} foram descartados antes da coleta.`
        : `As fontes emitiram ${scenario.sourceRate} logs brutos na fila de coleta.`,
    });
  }

  if (stage === 'collector') {
    const moved = Math.min(state.sourceQueue, scenario.collectorCapacity);
    return nextStage(state, {
      sourceQueue: state.sourceQueue - moved,
      processQueue: state.processQueue + moved,
      collected: state.collected + moved,
      lastEvent: moved
        ? `O Fluent Bit encaminhou ${moved} logs para o processador.`
        : 'O coletor não encontrou logs novos para encaminhar.',
    });
  }

  if (stage === 'processor') {
    const moved = Math.min(state.processQueue, scenario.processorCapacity);
    const filtered = state.filterNoise ? deterministicLoss(moved, scenario.noiseRate) : 0;
    const parseCandidates = moved - filtered;
    const parserPenalty = state.parserMode === 'grok' ? 0.08 : 0;
    const parseFailed = deterministicLoss(
      parseCandidates,
      Math.min(0.9, scenario.parseFailureRate + parserPenalty)
    );
    const accepted = parseCandidates - parseFailed;
    const details = [
      `${accepted} aceitos`,
      filtered ? `${filtered} filtrados como ruído` : null,
      parseFailed ? `${parseFailed} rejeitados pelo parser` : null,
    ]
      .filter(Boolean)
      .join(', ');

    return nextStage(state, {
      processQueue: state.processQueue - moved,
      bufferQueue: state.bufferQueue + accepted,
      processed: state.processed + moved,
      filtered: state.filtered + filtered,
      parseFailed: state.parseFailed + parseFailed,
      lastEvent: moved
        ? `O processador tratou ${moved} logs: ${details}.`
        : 'A fila do processador está vazia.',
    });
  }

  if (stage === 'buffer') {
    const overflow = Math.max(0, state.bufferQueue - scenario.bufferCapacity);
    return nextStage(state, {
      bufferQueue: state.bufferQueue - overflow,
      dropped: state.dropped + overflow,
      lastEvent: overflow
        ? `O buffer atingiu a capacidade e descartou os ${overflow} logs mais antigos.`
        : `${state.bufferQueue} logs estão em buffer com segurança para indexação.`,
    });
  }

  if (stage === 'storage') {
    const indexedNow = Math.min(state.bufferQueue, scenario.indexCapacity);
    const shardLoads: [number, number, number] = [
      state.shardLoads[0],
      state.shardLoads[1],
      state.shardLoads[2],
    ];
    for (let i = 0; i < indexedNow; i += 1) {
      shardLoads[(state.indexed + i) % shardLoads.length] += 1;
    }

    return nextStage(state, {
      bufferQueue: state.bufferQueue - indexedNow,
      indexed: state.indexed + indexedNow,
      shardLoads,
      indexedLogs: makeIndexedLogs(state, indexedNow, shardLoads),
      lastEvent: indexedNow
        ? `O cluster de busca indexou ${indexedNow} logs entre três shards.`
        : 'O indexador não encontrou logs em buffer para escrever.',
    });
  }

  return nextStage(state, {
    lastEvent: state.indexed
      ? `Busca atualizada. ${state.indexed} logs indexados agora são pesquisáveis.`
      : 'Busca atualizada, mas nenhum log chegou ao índice ainda.',
  });
}

export function updatePipelineSettings(
  state: PipelineState,
  settings: PipelineSettings
): PipelineState {
  return createPipelineState({
    scenarioId: settings.scenarioId ?? state.scenarioId,
    parserMode: settings.parserMode ?? state.parserMode,
    filterNoise: settings.filterNoise ?? state.filterNoise,
  });
}

export function getAccountedLogCount(state: PipelineState): number {
  return (
    state.sourceQueue +
    state.processQueue +
    state.bufferQueue +
    state.filtered +
    state.parseFailed +
    state.indexed +
    state.dropped
  );
}

export function getPipelineHealth(state: PipelineState): {
  tone: 'healthy' | 'warning' | 'critical';
  label: string;
  explanation: string;
} {
  const scenario = LOG_SCENARIOS[state.scenarioId];
  const bufferRatio = state.bufferQueue / scenario.bufferCapacity;

  if (state.dropped > 0) {
    return {
      tone: 'critical',
      label: 'Logs estão sendo perdidos',
      explanation:
        'Uma fila limitada transbordou. Reduza a entrada, adicione capacidade, ou restaure o estágio lento.',
    };
  }
  if (state.parseFailed > 0) {
    return {
      tone: 'critical',
      label: 'Rejeições de parser detectadas',
      explanation:
        'Eventos que parecem válidos estão falhando antes da indexação. Compare o parser com o novo formato de log.',
    };
  }
  if (bufferRatio >= 0.65 || state.sourceQueue >= scenario.collectorCapacity) {
    return {
      tone: 'warning',
      label: 'Backpressure se acumulando',
      explanation: 'Uma fila upstream está crescendo. O buffer ganha tempo, mas não é infinito.',
    };
  }
  return {
    tone: 'healthy',
    label: 'Pipeline está saudável',
    explanation: 'A capacidade está acompanhando e os logs aceitos estão progredindo até a busca.',
  };
}
