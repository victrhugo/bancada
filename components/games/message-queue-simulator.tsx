'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Database,
  GitBranch,
  Inbox,
  Layers,
  ListRestart,
  MessageSquare,
  MessageSquareWarning,
  Package,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Server,
  Settings2,
  ShieldCheck,
  Trash2,
  Users,
  XCircle,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

type QueueMode = 'kafka' | 'rabbitmq';
type ScenarioId = 'normal' | 'lag' | 'rebalance' | 'ordering' | 'dlq' | 'backpressure';

interface Scenario {
  id: ScenarioId;
  title: string;
  badge: string;
  description: string;
  produceRate: number;
  consumerRate: number;
  defaultConsumers: number;
  defaultPartitions: number;
  failureEvery?: number;
  note: string;
}

interface SimulatorState {
  produced: number;
  processed: number;
  failed: number;
  dlq: number;
  tick: number;
  consumers: number;
  partitions: number;
  isPlaying: boolean;
  log: string[];
}

const scenarios: Scenario[] = [
  {
    id: 'normal',
    title: 'Operação normal',
    badge: 'healthy',
    description: 'Os producers publicam em ritmo constante e os consumers dão conta do backlog.',
    produceRate: 6,
    consumerRate: 3,
    defaultConsumers: 2,
    defaultPartitions: 3,
    note: 'Uma fila equilibrada mantém o lag baixo porque a capacidade dos consumers acompanha o throughput dos producers.',
  },
  {
    id: 'lag',
    title: 'Lag do consumer',
    badge: 'lag',
    description: 'Um consumer group lento fica para trás enquanto o broker continua aceitando mensagens.',
    produceRate: 9,
    consumerRate: 2,
    defaultConsumers: 2,
    defaultPartitions: 4,
    note: 'Lag nem sempre é incidente. Fica perigoso quando o backlog cresce mais rápido do que é drenado.',
  },
  {
    id: 'rebalance',
    title: 'Rebalanceamento',
    badge: 'join/leave',
    description: 'Consumers entram ou saem e a posse das partições ou filas muda de dono.',
    produceRate: 7,
    consumerRate: 3,
    defaultConsumers: 2,
    defaultPartitions: 4,
    note: 'O rebalanceamento aumenta a capacidade, mas pode pausar o processamento enquanto a posse muda.',
  },
  {
    id: 'ordering',
    title: 'Garantias de ordenação',
    badge: 'per-key',
    description: 'Mensagens com a mesma chave ficam ordenadas dentro de uma partição ou caminho de fila.',
    produceRate: 5,
    consumerRate: 2,
    defaultConsumers: 2,
    defaultPartitions: 3,
    note: 'No Kafka, a ordem vale por partição. No RabbitMQ, vale por caminho de fila e pode mudar com consumers em paralelo.',
  },
  {
    id: 'dlq',
    title: 'Tratamento de dead letter',
    badge: 'poison',
    description: 'Mensagens envenenadas falham nos retries e vão para uma dead letter queue para inspeção.',
    produceRate: 6,
    consumerRate: 3,
    defaultConsumers: 2,
    defaultPartitions: 3,
    failureEvery: 2,
    note: 'DLQs evitam que uma mensagem ruim trave o fluxo inteiro, mas ainda precisam de alertas e ferramentas de replay.',
  },
  {
    id: 'backpressure',
    title: 'Backpressure',
    badge: 'overload',
    description: 'Os producers superam a capacidade dos consumers e o broker vira um buffer de pressão.',
    produceRate: 12,
    consumerRate: 2,
    defaultConsumers: 2,
    defaultPartitions: 4,
    note: 'Backpressure é o sinal de que producers, consumers ou o broker precisam de controle de fluxo.',
  },
];

const HEALTH_LABELS: Record<string, string> = {
  healthy: 'Saudável',
  watch: 'Atenção',
  degraded: 'Degradado',
};

const modeCopy: Record<
  QueueMode,
  {
    title: string;
    broker: string;
    storage: string;
    routing: string;
    delivery: string;
    consumer: string;
  }
> = {
  kafka: {
    title: 'Tópico Kafka',
    broker: 'Log do tópico',
    storage: 'Partições append-only guardam as mensagens por offset.',
    routing: 'O hash da chave escolhe a partição; a ordem é preservada dentro dela.',
    delivery: 'Os consumers fazem commit do offset depois de processar, garantindo entrega at-least-once.',
    consumer: 'Consumer groups dividem as partições. Cada partição é lida por um único consumer do grupo.',
  },
  rabbitmq: {
    title: 'Exchange RabbitMQ',
    broker: 'Exchange + filas',
    storage: 'As filas guardam as mensagens até os consumers darem ack ou rejeitarem.',
    routing: 'Exchanges direct, fanout e topic roteiam mensagens por meio de bindings.',
    delivery: 'Acks removem as mensagens; nacks podem gerar retry ou ir para dead letter.',
    consumer: 'Os consumers competem pelas filas. O prefetch controla quantas mensagens cada um pode segurar.',
  },
};

const messageKeys = ['orders', 'billing', 'email', 'audit', 'metrics', 'alerts'];

function createState(scenario: Scenario): SimulatorState {
  return {
    produced: scenario.produceRate * 2,
    processed: scenario.consumerRate,
    failed: 0,
    dlq: 0,
    tick: 1,
    consumers: scenario.defaultConsumers,
    partitions: scenario.defaultPartitions,
    isPlaying: false,
    log: [
      `producer publicou ${scenario.produceRate * 2} mensagens`,
      `consumer group iniciado com ${scenario.defaultConsumers} consumers`,
    ],
  };
}

function getScenario(id: ScenarioId) {
  return scenarios.find((scenario) => scenario.id === id) ?? scenarios[0];
}

function shortId(value: number) {
  return `m-${String(value).padStart(3, '0')}`;
}

function getStatusColor(value: number, warning: number, danger: number) {
  if (value >= danger) return 'text-red-500';
  if (value >= warning) return 'text-amber-500';
  return 'text-emerald-500';
}

export default function MessageQueueSimulator() {
  const [mode, setMode] = useState<QueueMode>('kafka');
  const [scenarioId, setScenarioId] = useState<ScenarioId>('normal');
  const scenario = useMemo(() => getScenario(scenarioId), [scenarioId]);
  const [state, setState] = useState<SimulatorState>(() => createState(scenario));

  const backlog = Math.max(state.produced - state.processed - state.dlq, 0);
  const capacity = state.consumers * scenario.consumerRate;
  const lagSeverity = Math.min(100, Math.round((backlog / Math.max(state.produced, 1)) * 100));
  const throughput = Math.min(capacity, scenario.produceRate + Math.max(0, backlog - 4));
  const health =
    backlog > capacity * 4 || state.failed > 4
      ? 'degraded'
      : backlog > capacity * 2 || state.failed > 0
        ? 'watch'
        : 'healthy';

  const partitionLoads = useMemo(() => {
    return Array.from({ length: state.partitions }, (_, index) => {
      const key = messageKeys[index % messageKeys.length];
      const pending = Math.max(
        0,
        Math.floor(backlog / state.partitions) + ((state.produced + index) % 3) - 1
      );
      const owner = state.consumers === 0 ? 'paused' : `consumer-${(index % state.consumers) + 1}`;

      return {
        id: index,
        key,
        pending,
        owner,
        offset: Math.max(0, Math.floor(state.processed / state.partitions) + index),
      };
    });
  }, [backlog, state.consumers, state.partitions, state.processed, state.produced]);

  const visibleMessages = useMemo(() => {
    const count = Math.min(8, Math.max(3, backlog + state.dlq));
    return Array.from({ length: count }, (_, index) => ({
      id: shortId(Math.max(1, state.produced - index)),
      key: messageKeys[(state.produced + index) % messageKeys.length],
      failed: index < state.dlq && scenario.id === 'dlq',
    }));
  }, [backlog, scenario.id, state.dlq, state.produced]);

  const reset = useCallback(() => {
    setState(createState(scenario));
  }, [scenario]);

  const appendLog = useCallback((current: SimulatorState, entry: string) => {
    return [entry, ...current.log].slice(0, 7);
  }, []);

  const produce = useCallback(() => {
    setState((current) => ({
      ...current,
      produced: current.produced + scenario.produceRate,
      log: appendLog(current, `${scenario.produceRate} mensagens produzidas para ${modeCopy[mode].broker}`),
    }));
  }, [appendLog, mode, scenario.produceRate]);

  const step = useCallback(() => {
    setState((current) => {
      const currentBacklog = Math.max(current.produced - current.processed - current.dlq, 0);
      const maxProcessed = Math.min(currentBacklog, current.consumers * scenario.consumerRate);
      const shouldFail =
        scenario.failureEvery !== undefined && current.tick % scenario.failureEvery === 0 && maxProcessed > 0;
      const failures = shouldFail ? 1 : 0;
      const processed = Math.max(0, maxProcessed - failures);
      const nextProduced =
        scenario.id === 'backpressure' || scenario.id === 'lag'
          ? current.produced + scenario.produceRate
          : current.produced + Math.ceil(scenario.produceRate / 2);
      const rebalanceNote =
        scenario.id === 'rebalance' && current.tick % 3 === 0
          ? `rebalance atribuiu ${current.partitions} ${mode === 'kafka' ? 'partições' : 'filas'}`
          : `${processed} processadas, backlog ${Math.max(currentBacklog - processed - failures, 0)}`;
      const failureNote = failures > 0 ? `${failures} mensagem envenenada movida para a DLQ` : rebalanceNote;

      return {
        ...current,
        produced: nextProduced,
        processed: current.processed + processed,
        failed: current.failed + failures,
        dlq: current.dlq + failures,
        tick: current.tick + 1,
        log: appendLog(current, failureNote),
      };
    });
  }, [appendLog, mode, scenario.consumerRate, scenario.failureEvery, scenario.id, scenario.produceRate]);

  const addConsumer = useCallback(() => {
    setState((current) => ({
      ...current,
      consumers: Math.min(5, current.consumers + 1),
      log: appendLog(current, `consumer-${Math.min(5, current.consumers + 1)} entrou no grupo`),
    }));
  }, [appendLog]);

  const removeConsumer = useCallback(() => {
    setState((current) => ({
      ...current,
      consumers: Math.max(1, current.consumers - 1),
      log: appendLog(current, `consumer saiu; restam ${Math.max(1, current.consumers - 1)}`),
    }));
  }, [appendLog]);

  const triggerFailure = useCallback(() => {
    setState((current) => ({
      ...current,
      failed: current.failed + 1,
      dlq: current.dlq + 1,
      log: appendLog(current, 'mensagem envenenada reprocessada e enviada para a DLQ'),
    }));
  }, [appendLog]);

  useEffect(() => {
    setState(createState(scenario));
  }, [scenario, mode]);

  useEffect(() => {
    if (!state.isPlaying) return;

    const timer = window.setTimeout(step, 1100);
    return () => window.clearTimeout(timer);
  }, [state.isPlaying, state.tick, step]);

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-md border bg-muted/20 p-4">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <div className="rounded-md border border-primary/30 bg-primary/10 p-2 text-primary">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <p className="font-mono text-xs text-muted-foreground">// laboratório de filas de mensagens</p>
              <h2 className="text-2xl font-bold md:text-3xl">Simulador de filas de mensagens</h2>
            </div>
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Visualize producers, brokers, partições, filas, consumer groups, lag, rebalanceamento,
            backpressure e tratamento de dead letter em sistemas no estilo Kafka e RabbitMQ.
          </p>
        </div>

        <Card>
          <CardContent className="p-3">
            <div className="grid grid-cols-2 gap-2">
              {(['kafka', 'rabbitmq'] as const).map((item) => (
                <Button
                  key={item}
                  variant={mode === item ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMode(item)}
                  className="justify-start"
                >
                  {item === 'kafka' ? (
                    <Layers className="mr-2 h-4 w-4" />
                  ) : (
                    <GitBranch className="mr-2 h-4 w-4" />
                  )}
                  {item === 'kafka' ? 'Kafka' : 'RabbitMQ'}
                </Button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{modeCopy[mode].storage}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {scenarios.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setScenarioId(item.id)}
            className={cn(
              'rounded-md border p-3 text-left transition-colors',
              item.id === scenarioId
                ? 'border-primary/60 bg-primary/10'
                : 'border-border hover:border-primary/40 hover:bg-muted/30'
            )}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{item.title}</span>
              <Badge variant={item.id === scenarioId ? 'default' : 'secondary'} className="text-[10px]">
                {item.badge}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <Card>
            <CardHeader className="p-4 pb-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="h-5 w-5" />
                  Fluxo de mensagens ao vivo
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" onClick={produce}>
                    <Plus className="mr-1 h-4 w-4" />
                    Produzir
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setState((current) => ({ ...current, isPlaying: !current.isPlaying }))}
                  >
                    {state.isPlaying ? (
                      <Pause className="mr-1 h-4 w-4" />
                    ) : (
                      <Play className="mr-1 h-4 w-4" />
                    )}
                    {state.isPlaying ? 'Pausar' : 'Reproduzir'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={step}>
                    <Zap className="mr-1 h-4 w-4" />
                    Avançar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={reset}>
                    <RotateCcw className="mr-1 h-4 w-4" />
                    Reiniciar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="grid gap-3 lg:grid-cols-[1fr_auto_1.3fr_auto_1fr_auto_0.85fr]">
                <FlowNode
                  title="Producers"
                  icon={<Package className="h-5 w-5" />}
                  subtitle={`${scenario.produceRate}/tick`}
                  tone="blue"
                >
                  {visibleMessages.slice(0, 3).map((message) => (
                    <MessagePill key={message.id} id={message.id} label={message.key} />
                  ))}
                </FlowNode>

                <FlowArrow />

                <FlowNode
                  title={modeCopy[mode].title}
                  icon={<Server className="h-5 w-5" />}
                  subtitle={modeCopy[mode].broker}
                  tone="primary"
                >
                  <div className="grid gap-2">
                    {partitionLoads.map((partition) => (
                      <div key={partition.id} className="rounded-md border bg-background/70 p-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs">
                            {mode === 'kafka' ? `partition-${partition.id}` : `queue-${partition.id}`}
                          </span>
                          <Badge variant="secondary" className="text-[10px]">
                            {partition.pending} pending
                          </Badge>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${Math.min(100, partition.pending * 18)}%` }}
                          />
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          key: {partition.key} / owner: {partition.owner}
                        </p>
                      </div>
                    ))}
                  </div>
                </FlowNode>

                <FlowArrow />

                <FlowNode
                  title="Consumers"
                  icon={<Users className="h-5 w-5" />}
                  subtitle={`${state.consumers} ativos`}
                  tone="emerald"
                >
                  <div className="grid gap-2">
                    {Array.from({ length: state.consumers }, (_, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-md border bg-background/70 p-2"
                      >
                        <span className="text-sm font-medium">consumer-{index + 1}</span>
                        <Badge variant="secondary" className="text-[10px]">
                          {mode === 'kafka' ? 'offset commit' : 'manual ack'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </FlowNode>

                <FlowArrow />

                <FlowNode
                  title="DLQ"
                  icon={<Inbox className="h-5 w-5" />}
                  subtitle={`${state.dlq} com falha`}
                  tone={state.dlq > 0 ? 'red' : 'muted'}
                >
                  {state.dlq > 0 ? (
                    visibleMessages
                      .slice(0, Math.min(3, state.dlq))
                      .map((message) => <MessagePill key={message.id} id={message.id} label="poison" failed />)
                  ) : (
                    <p className="text-xs text-muted-foreground">No poison messages yet.</p>
                  )}
                </FlowNode>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <MetricCard label="Produced" value={state.produced} icon={<MessageSquare className="h-4 w-4" />} />
                <MetricCard label="Processed" value={state.processed} icon={<CheckCircle2 className="h-4 w-4" />} />
                <MetricCard label="Lag" value={backlog} icon={<Clock className="h-4 w-4" />} danger={backlog > capacity * 3} />
                <MetricCard label="DLQ" value={state.dlq} icon={<XCircle className="h-4 w-4" />} danger={state.dlq > 0} />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Database className="h-5 w-5" />
                  {mode === 'kafka' ? 'Posse das partições' : 'Bindings das filas'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-4 pt-0">
                {partitionLoads.map((partition) => (
                  <div key={partition.id} className="rounded-md border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">
                          {mode === 'kafka' ? `Partição ${partition.id}` : `Fila ${partition.id}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {mode === 'kafka'
                            ? `offset ${partition.offset}, chave ${partition.key}`
                            : `binding ${partition.key}.*, ${partition.pending} prontas`}
                        </p>
                      </div>
                      <Badge variant="secondary">{partition.owner}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ListRestart className="h-5 w-5" />
                  Log de eventos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="rounded-md border bg-[#171717] p-3 font-mono text-sm">
                  <div className="space-y-2">
                    {state.log.map((entry, index) => (
                      <p key={`${entry}-${index}`} className={index === 0 ? 'text-green-400' : 'text-slate-300'}>
                        {String(state.tick - index).padStart(2, '0')} | {entry}
                      </p>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings2 className="h-5 w-5" />
                Controles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-0">
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" onClick={addConsumer}>
                  <Plus className="mr-1 h-4 w-4" />
                  Consumer
                </Button>
                <Button size="sm" variant="outline" onClick={removeConsumer}>
                  <Trash2 className="mr-1 h-4 w-4" />
                  Remover
                </Button>
              </div>
              <Button size="sm" variant="outline" onClick={triggerFailure} className="w-full">
                <MessageSquareWarning className="mr-1 h-4 w-4" />
                Disparar mensagem envenenada
              </Button>

              <div className="rounded-md border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">Lag do consumer</span>
                  <span className={cn('text-sm font-semibold', getStatusColor(lagSeverity, 35, 65))}>
                    {lagSeverity}%
                  </span>
                </div>
                <Progress value={lagSeverity} />
              </div>

              <div className="rounded-md border p-3">
                <p className="mb-1 text-xs font-mono text-muted-foreground">// cenário selecionado</p>
                <p className="font-medium">{scenario.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{scenario.note}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-5 w-5" />
                Garantias de entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4 pt-0">
              <Guarantee label="At most once" detail="Ack antes do trabalho; rápido, mas mensagens podem sumir." />
              <Guarantee label="At least once" detail="Ack depois do trabalho; seguro, mas os handlers precisam ser idempotentes." active />
              <Guarantee label="Exactly once" detail="Exige coordenação entre broker e consumer, não só um loop de retry." />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-5 w-5" />
                Saúde do sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-0">
              <div
                className={cn(
                  'rounded-md border p-3',
                  health === 'healthy' && 'border-emerald-500/30 bg-emerald-500/10',
                  health === 'watch' && 'border-amber-500/30 bg-amber-500/10',
                  health === 'degraded' && 'border-red-500/30 bg-red-500/10'
                )}
              >
                <p className="text-sm font-medium">{HEALTH_LABELS[health]}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Throughput {throughput}/tick, capacidade {capacity}/tick, backlog {backlog}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">{modeCopy[mode].delivery}</p>
              <p className="text-sm text-muted-foreground">{modeCopy[mode].consumer}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <ComparisonCard
          title="Modelo mental do Kafka"
          icon={<Layers className="h-5 w-5" />}
          points={[
            'Tópicos são logs append-only divididos em partições.',
            'Offsets são o checkpoint do consumer group.',
            'A escala é limitada pelo número de partições por consumer group.',
            'A ordem só é confiável dentro de uma partição.',
          ]}
        />
        <ComparisonCard
          title="Modelo mental do RabbitMQ"
          icon={<GitBranch className="h-5 w-5" />}
          points={[
            'Exchanges roteiam mensagens para filas por meio de bindings.',
            'As mensagens saem da fila quando recebem ack.',
            'Prefetch e o modo de ack controlam o backpressure.',
            'Políticas de DLX roteiam mensagens rejeitadas ou expiradas para dead letter queues.',
          ]}
        />
      </div>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="hidden items-center justify-center text-muted-foreground lg:flex">
      <ArrowRight className="h-6 w-6" />
    </div>
  );
}

function FlowNode({
  title,
  subtitle,
  icon,
  tone,
  children,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  tone: 'blue' | 'primary' | 'emerald' | 'red' | 'muted';
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'min-h-52 rounded-md border p-3',
        tone === 'blue' && 'border-blue-500/30 bg-blue-500/10',
        tone === 'primary' && 'border-primary/30 bg-primary/10',
        tone === 'emerald' && 'border-emerald-500/30 bg-emerald-500/10',
        tone === 'red' && 'border-red-500/30 bg-red-500/10',
        tone === 'muted' && 'border-border bg-muted/20'
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="rounded-md border bg-background/70 p-1.5">{icon}</div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function MessagePill({ id, label, failed = false }: { id: string; label: string; failed?: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-md border bg-background/80 px-2 py-1.5 text-xs',
        failed ? 'border-red-500/40 text-red-400' : 'border-border text-foreground'
      )}
    >
      <span className="font-mono">{id}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  danger = false,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  danger?: boolean;
}) {
  return (
    <div className={cn('rounded-md border bg-card p-3', danger && 'border-amber-500/40 bg-amber-500/10')}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function Guarantee({ label, detail, active = false }: { label: string; detail: string; active?: boolean }) {
  return (
    <div className={cn('rounded-md border p-2.5', active && 'border-primary/40 bg-primary/10')}>
      <div className="flex items-center gap-2">
        {active ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Clock className="h-4 w-4 text-muted-foreground" />}
        <span className="font-medium">{label}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function ComparisonCard({
  title,
  icon,
  points,
}: {
  title: string;
  icon: ReactNode;
  points: string[];
}) {
  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <ul className="space-y-2 text-sm text-muted-foreground">
          {points.map((point) => (
            <li key={point} className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
