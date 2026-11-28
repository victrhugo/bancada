'use client';

import { useMemo, useState, type ComponentType } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Boxes,
  CircuitBoard,
  Clock,
  Database,
  Gauge,
  GitBranch,
  HardDrive,
  Layers3,
  Network,
  RefreshCw,
  Route,
  Server,
  ShieldCheck,
  Shuffle,
  SlidersHorizontal,
  Split,
  TrendingUp,
  WalletCards,
  X,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  SimulatorAdvisorCard,
  SimulatorControlSlider,
  SimulatorFlowLine,
  SimulatorMetricCard,
  SimulatorModeButton,
  SimulatorNodeCard,
} from '@/components/games/simulator-primitives';
import { cn } from '@/lib/utils';

type ReplicationMode = 'async' | 'sync';
type ReplicationTopology = 'single-leader' | 'multi-leader' | 'leaderless';
type PartitioningMode = 'hash' | 'range';
type ShardKey = 'user_id' | 'region' | 'created_at' | 'tenant_id';

const shardKeyLabels: Record<ShardKey, string> = {
  user_id: 'user_id',
  region: 'region',
  created_at: 'created_at',
  tenant_id: 'tenant_id',
};

const querySamples = [
  'user_id = 18429',
  "region = 'us-east'",
  "created_at > now() - '1 day'",
  "tenant_id = 'enterprise-7'",
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function pct(value: number) {
  return `${Math.round(value)}%`;
}

function ms(value: number) {
  return `${Math.round(value)} ms`;
}

function money(value: number) {
  return `$${Math.round(value)}/mo`;
}

function ReplicationModePanel() {
  const [mode, setMode] = useState<ReplicationMode>('async');
  const [topology, setTopology] = useState<ReplicationTopology>('single-leader');
  const [replicas, setReplicas] = useState(3);
  const [load, setLoad] = useState(650);
  const [writePercent, setWritePercent] = useState(28);
  const [consistency, setConsistency] = useState(55);
  const [primaryDown, setPrimaryDown] = useState(false);

  const metrics = useMemo(() => {
    const readQps = load * (1 - writePercent / 100);
    const writeQps = load * (writePercent / 100);
    const nodes = replicas + 1;
    const readCapacity = topology === 'leaderless' ? nodes * 230 : replicas * 260 + 130;
    const writeCapacity = primaryDown
      ? topology === 'single-leader'
        ? 0
        : replicas * 120
      : topology === 'leaderless'
        ? nodes * 115
        : topology === 'multi-leader'
          ? nodes * 150
          : mode === 'sync'
            ? 190
            : 280;
    const writePressure = writeCapacity === 0 ? 3 : writeQps / writeCapacity;
    const readPressure = readQps / Math.max(readCapacity, 1);
    const pressure = Math.max(writePressure, readPressure);
    const baseLag =
      mode === 'sync'
        ? 12 + pressure * 18
        : 80 + pressure * 220 + (100 - consistency) * 2.4;
    const lag = primaryDown && topology === 'single-leader' ? 0 : baseLag;
    const latency =
      30 +
      pressure * 75 +
      (mode === 'sync' ? consistency * 0.75 : (100 - consistency) * 0.18) +
      (primaryDown ? 90 : 0);
    const availability =
      primaryDown && topology === 'single-leader'
        ? 62
        : primaryDown
          ? 91 - (100 - consistency) * 0.08
          : 99.4 - pressure * 1.1;
    const staleReadRisk = mode === 'async' ? clamp(100 - consistency + pressure * 24, 4, 96) : clamp(12 - consistency * 0.08, 1, 12);
    const splitBrainRisk =
      topology === 'multi-leader' && primaryDown
        ? clamp(72 - consistency * 0.45, 20, 82)
        : topology === 'leaderless'
          ? clamp(35 - consistency * 0.22, 8, 35)
          : 4;

    return {
      readQps,
      writeQps,
      lag,
      latency,
      availability,
      staleReadRisk,
      splitBrainRisk,
      pressure: clamp(pressure * 100, 0, 140),
      writeCapacity,
    };
  }, [consistency, load, mode, primaryDown, replicas, topology, writePercent]);

  const leaderLabel =
    topology === 'single-leader'
      ? 'Primário'
      : topology === 'multi-leader'
        ? 'Líder A'
        : 'Coordenador';

  return (
    <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-primary" />
                Topologia de replicação
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                As escritas chegam aos líderes, as leituras se espalham pelas réplicas, e o lag aparece
                quando durabilidade e latência puxam para lados opostos.
              </p>
            </div>
            <Button
              type="button"
              variant={primaryDown ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => setPrimaryDown((value) => !value)}
            >
              {primaryDown ? <RefreshCw className="mr-2 h-4 w-4" /> : <X className="mr-2 h-4 w-4" />}
              {primaryDown ? 'Recuperar o primário' : 'Derrubar o primário'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border bg-linear-to-br from-zinc-950 via-neutral-950 to-stone-950 p-4 text-slate-100">
            <div className="grid gap-4 lg:grid-cols-[1fr_140px_1fr]">
              <div className="space-y-3">
                <SimulatorNodeCard
                  title={leaderLabel}
                  subtitle={primaryDown ? 'fora do ar, precisa de failover' : `${Math.round(metrics.writeQps)} escritas/s`}
                  status={primaryDown ? 'down' : metrics.pressure > 95 ? 'hot' : 'healthy'}
                  load={metrics.pressure}
                  icon={Database}
                />
                {topology === 'multi-leader' && (
                  <SimulatorNodeCard
                    title="Líder B"
                    subtitle="aceita escritas regionais"
                    status={metrics.splitBrainRisk > 50 ? 'lagging' : 'healthy'}
                    load={Math.min(metrics.pressure * 0.75, 100)}
                    icon={Split}
                  />
                )}
              </div>

              <div className="hidden items-center gap-2 lg:flex">
                <SimulatorFlowLine tone={mode === 'sync' ? 'success' : 'primary'} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: replicas }, (_, index) => (
                  <SimulatorNodeCard
                    key={index}
                    title={`Réplica ${index + 1}`}
                    subtitle={
                      primaryDown && topology !== 'single-leader'
                        ? index === 0
                          ? 'líder promovido'
                          : 'atendendo leituras'
                        : `${Math.round(metrics.readQps / replicas)} reads/sec`
                    }
                    status={
                      primaryDown && topology === 'single-leader'
                        ? 'lagging'
                        : metrics.lag > 250
                          ? 'lagging'
                          : 'healthy'
                    }
                    load={clamp(metrics.readQps / replicas / 2.6, 8, 100)}
                    icon={Server}
                  />
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-slate-400">Caminho de escrita</div>
                <div className="mt-1 font-medium">
                  {topology === 'single-leader' ? 'só no líder' : topology === 'multi-leader' ? 'líderes regionais' : 'escritas por quórum'}
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-slate-400">Caminho de leitura</div>
                <div className="mt-1 font-medium">
                  {consistency > 74 ? 'leituras no líder/quórum' : 'leituras nas réplicas'}
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-slate-400">Comportamento em falha</div>
                <div className="mt-1 font-medium">
                  {primaryDown
                    ? topology === 'single-leader'
                      ? 'escritas indisponíveis'
                      : 'failover automático'
                    : 'operação normal'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <SlidersHorizontal className="h-4 w-4" />
              Controles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="mb-2 text-sm font-medium">Topology</div>
              <div className="flex flex-wrap gap-2">
                <SimulatorModeButton value="single-leader" current={topology} onClick={setTopology}>
                  Líder único
                </SimulatorModeButton>
                <SimulatorModeButton value="multi-leader" current={topology} onClick={setTopology}>
                  Vários líderes
                </SimulatorModeButton>
                <SimulatorModeButton value="leaderless" current={topology} onClick={setTopology}>
                  Sem líder
                </SimulatorModeButton>
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-medium">Modo de commit</div>
              <div className="flex gap-2">
                <SimulatorModeButton value="async" current={mode} onClick={setMode}>
                  Assíncrono
                </SimulatorModeButton>
                <SimulatorModeButton value="sync" current={mode} onClick={setMode}>
                  Síncrono
                </SimulatorModeButton>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">Réplicas</span>
                <Badge variant="secondary">{replicas}</Badge>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setReplicas((v) => clamp(v - 1, 1, 5))}>
                  -
                </Button>
                <Button size="sm" variant="outline" onClick={() => setReplicas((v) => clamp(v + 1, 1, 5))}>
                  +
                </Button>
              </div>
            </div>

            <SimulatorControlSlider label="Carga" value={load} min={100} max={1600} step={50} suffix=" qps" onChange={setLoad} />
            <SimulatorControlSlider label="Escritas" value={writePercent} min={5} max={80} step={5} suffix="%" onChange={setWritePercent} />
            <SimulatorControlSlider label="Preferência por consistência" value={consistency} min={0} max={100} step={5} suffix="%" onChange={setConsistency} />
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <SimulatorMetricCard
            label="Lag de replicação"
            value={ms(metrics.lag)}
            icon={Clock}
            tone={metrics.lag > 260 ? 'warn' : 'good'}
            detail={mode === 'sync' ? 'menos lag, escrita mais lenta' : 'mais throughput, leituras possivelmente desatualizadas'}
          />
          <SimulatorMetricCard
            label="Capacidade de escrita"
            value={`${Math.round(metrics.writeCapacity)} qps`}
            icon={Zap}
            tone={metrics.writeCapacity < metrics.writeQps ? 'bad' : 'good'}
            detail={`${Math.round(metrics.writeQps)} qps solicitados`}
          />
          <SimulatorMetricCard
            label="Disponibilidade"
            value={pct(metrics.availability)}
            icon={ShieldCheck}
            tone={metrics.availability > 98 ? 'good' : metrics.availability > 85 ? 'warn' : 'bad'}
            detail="efeitos de failover e quórum"
          />
          <SimulatorMetricCard
            label="Risco de split-brain"
            value={pct(metrics.splitBrainRisk)}
            icon={AlertTriangle}
            tone={metrics.splitBrainRisk > 45 ? 'bad' : metrics.splitBrainRisk > 18 ? 'warn' : 'good'}
            detail="menor com coordenação mais forte"
          />
        </div>

        <SimulatorAdvisorCard
          title="Leitura para quem opera"
          icon={Activity}
          tone={primaryDown && topology === 'single-leader' ? 'bad' : metrics.lag > 260 ? 'warn' : 'primary'}
        >
          {primaryDown && topology === 'single-leader'
            ? 'O primário caiu e esta topologia não aceita escritas até uma réplica ser promovida.'
            : metrics.lag > 260
              ? 'O lag está subindo. Leve as leituras críticas para o líder, reduza a pressão de escrita ou aumente a consistência para leituras mais seguras.'
              : 'Esta configuração está saudável para a carga atual. As leituras estão distribuídas e as escritas continuam coordenadas.'}
        </SimulatorAdvisorCard>
      </div>
    </div>
  );
}

function ShardingModePanel() {
  const [partitioning, setPartitioning] = useState<PartitioningMode>('hash');
  const [shardKey, setShardKey] = useState<ShardKey>('user_id');
  const [shards, setShards] = useState(4);
  const [rows, setRows] = useState(120);
  const [query, setQuery] = useState(querySamples[0]);

  const distribution = useMemo(() => {
    const skewByKey: Record<ShardKey, number[]> = {
      user_id: [1.04, 0.98, 1.01, 0.97, 1.02, 1.0],
      region: [1.75, 0.82, 0.7, 0.58, 0.5, 0.43],
      created_at: [0.35, 0.5, 0.72, 1.08, 1.58, 2.1],
      tenant_id: [2.15, 0.62, 0.55, 0.5, 0.46, 0.42],
    };
    const base = Array.from({ length: shards }, (_, index) => {
      const even = rows / shards;
      const skew = partitioning === 'hash' ? skewByKey[shardKey][index % 6] : 0.55 + index * (1.1 / Math.max(shards - 1, 1));
      return Math.round(even * skew);
    });
    const total = base.reduce((sum, value) => sum + value, 0);
    return base.map((value) => Math.max(4, Math.round((value / total) * rows)));
  }, [partitioning, rows, shardKey, shards]);

  const shardLoads = useMemo(() => {
    const max = Math.max(...distribution);
    const avg = distribution.reduce((sum, value) => sum + value, 0) / distribution.length;
    const hotspot = max / avg;
    const queryIndex =
      partitioning === 'hash'
        ? Math.abs([...query].reduce((sum, char) => sum + char.charCodeAt(0), 0)) % shards
        : query.includes('now')
          ? shards - 1
          : query.includes('us-east') || query.includes('enterprise')
            ? 0
            : Math.floor(shards / 2);
    const rebalanceCost = partitioning === 'hash' ? Math.round(rows / shards) : Math.round(rows * 0.42);
    return { max, avg, hotspot, queryIndex, rebalanceCost };
  }, [distribution, partitioning, query, rows, shards]);

  const hotSpotTone = shardLoads.hotspot > 1.65 ? 'bad' : shardLoads.hotspot > 1.25 ? 'warn' : 'good';

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Boxes className="h-5 w-5 text-primary" />
            Mapa de shards
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Mude a estratégia de particionamento e a shard key para ver hot spots e o roteamento das consultas.
          </p>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border bg-linear-to-br from-zinc-950 via-neutral-950 to-stone-950 p-4 text-slate-100">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
                Router hashes <span className="text-primary">{shardKeyLabels[shardKey]}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-500" />
              <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
                Query sent to <span className="text-primary">shard {shardLoads.queryIndex + 1}</span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {distribution.map((count, index) => {
                const load = (count / shardLoads.max) * 100;
                const isQueryShard = index === shardLoads.queryIndex;
                const isHot = count / shardLoads.avg > 1.35;
                return (
                  <div
                    key={index}
                    className={cn(
                      'rounded-lg border p-4',
                      isQueryShard
                        ? 'border-primary bg-primary/15'
                        : isHot
                          ? 'border-yellow-400/70 bg-yellow-500/10'
                          : 'border-white/10 bg-white/5'
                    )}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="font-semibold">Shard {index + 1}</div>
                      {isQueryShard && <Badge className="bg-primary text-primary-foreground">consulta</Badge>}
                    </div>
                    <div className="flex h-28 items-end gap-1 rounded-md border border-white/10 bg-black/20 p-2">
                      {Array.from({ length: 9 }, (_, bar) => (
                        <div
                          key={bar}
                          className={cn(
                            'flex-1 rounded-t-sm',
                            isHot ? 'bg-yellow-400' : isQueryShard ? 'bg-primary' : 'bg-emerald-400'
                          )}
                          style={{ height: `${clamp(load - bar * 5, 12, 100)}%`, opacity: 0.38 + bar * 0.055 }}
                        />
                      ))}
                    </div>
                    <div className="mt-3 text-sm text-slate-300">{count}k rows</div>
                    <div className="text-xs text-slate-500">{pct(load)} of hottest shard</div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Route className="h-4 w-4" />
              Controles de particionamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="mb-2 text-sm font-medium">Particionamento</div>
              <div className="flex gap-2">
                <SimulatorModeButton value="hash" current={partitioning} onClick={setPartitioning}>
                  Hash
                </SimulatorModeButton>
                <SimulatorModeButton value="range" current={partitioning} onClick={setPartitioning}>
                  Faixa (range)
                </SimulatorModeButton>
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-medium">Exercício de shard key</div>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(shardKeyLabels) as ShardKey[]).map((key) => (
                  <Button
                    key={key}
                    size="sm"
                    variant={key === shardKey ? 'default' : 'outline'}
                    onClick={() => setShardKey(key)}
                    className="h-auto min-h-8 break-all px-2 text-xs sm:text-sm"
                  >
                    {shardKeyLabels[key]}
                  </Button>
                ))}
              </div>
            </div>

            <SimulatorControlSlider label="Linhas" value={rows} min={40} max={320} step={20} suffix="k" onChange={setRows} />

            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">Shards</span>
                <Badge variant="secondary">{shards}</Badge>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setShards((v) => clamp(v - 1, 2, 6))}>
                  -
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShards((v) => clamp(v + 1, 2, 6))}>
                  +
                </Button>
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-medium">Simulador de consultas</div>
              <div className="grid gap-2">
                {querySamples.map((sample) => (
                  <Button
                    key={sample}
                    type="button"
                    size="sm"
                    variant={query === sample ? 'default' : 'outline'}
                    onClick={() => setQuery(sample)}
                    className="h-auto min-h-8 justify-start whitespace-normal break-all py-2 text-left font-mono text-xs leading-snug"
                  >
                    {sample}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <SimulatorMetricCard
            label="Concentração de hot spot"
            value={`${shardLoads.hotspot.toFixed(2)}x`}
            icon={AlertTriangle}
            tone={hotSpotTone}
            detail="shard mais quente comparado à média"
          />
          <SimulatorMetricCard
            label="Movimentação no rebalanceamento"
            value={`${shardLoads.rebalanceCost}k linhas`}
            icon={Shuffle}
            tone={partitioning === 'hash' ? 'good' : 'warn'}
            detail={partitioning === 'hash' ? 'menor com consistent hashing' : 'divisões por faixa podem mover blocos grandes'}
          />
          <SimulatorMetricCard
            label="Fanout da consulta"
            value={query.includes('created_at') && partitioning === 'hash' ? `${shards} shards` : '1 shard'}
            icon={Network}
            tone={query.includes('created_at') && partitioning === 'hash' ? 'warn' : 'good'}
            detail="consultas scatter/gather aumentam a latência"
          />
        </div>

        <SimulatorAdvisorCard title="Leitura do roteamento" icon={Route} tone={hotSpotTone === 'bad' ? 'bad' : hotSpotTone === 'warn' ? 'warn' : 'primary'}>
          {hotSpotTone === 'bad'
            ? 'A shard key está concentrando os dados. Escolha uma chave com cardinalidade maior ou adicione uma camada de roteamento que divida os tenants mais quentes.'
            : query.includes('created_at') && partitioning === 'hash'
              ? 'Com particionamento por hash, esta consulta se espalha por vários shards. Um índice por faixa de tempo ou uma tabela auxiliar de busca a deixaria mais barata.'
              : 'O roteador consegue mirar um único shard, então esta consulta continua previsível conforme os dados crescem.'}
        </SimulatorAdvisorCard>
      </div>
    </div>
  );
}

function ScalingModePanel() {
  const [load, setLoad] = useState(1200);
  const [writePercent, setWritePercent] = useState(35);
  const [verticalTier, setVerticalTier] = useState(2);
  const [replicas, setReplicas] = useState(2);
  const [shards, setShards] = useState(2);
  const [pooling, setPooling] = useState(true);

  const metrics = useMemo(() => {
    const readQps = load * (1 - writePercent / 100);
    const writeQps = load * (writePercent / 100);
    const verticalRead = 340 * verticalTier * (1 + Math.log2(verticalTier) * 0.18);
    const verticalWrite = 170 * verticalTier * (1 + Math.log2(verticalTier) * 0.12);
    const readCapacity = verticalRead + replicas * 300 + (pooling ? 180 : 0);
    const writeCapacity = verticalWrite * shards;
    const readPressure = readQps / readCapacity;
    const writePressure = writeQps / writeCapacity;
    const pressure = Math.max(readPressure, writePressure);
    const latency = 24 + pressure * 130 + (pooling ? -14 : 30) + (verticalTier > 4 ? 22 : 0);
    const errorRate = clamp((pressure - 0.92) * 38, 0, 42);
    const cost = verticalTier * 95 + replicas * 55 + shards * 140 + (pooling ? 30 : 0);
    const throughput = Math.min(load, readCapacity + writeCapacity);
    const writeBottleneck = writePressure > readPressure;
    return {
      readQps,
      writeQps,
      readCapacity,
      writeCapacity,
      pressure: pressure * 100,
      latency,
      errorRate,
      cost,
      throughput,
      writeBottleneck,
    };
  }, [load, pooling, replicas, shards, verticalTier, writePercent]);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Laboratório de escala
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Comece com um banco sobrecarregado e combine escala vertical, réplicas de leitura,
            sharding e pooling para dar conta da carga.
          </p>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border bg-linear-to-br from-zinc-950 via-neutral-950 to-stone-950 p-4 text-slate-100">
            <div className="mb-5 grid gap-3 md:grid-cols-4">
              <ArchitectureBlock label="Pool da aplicação" value={pooling ? 'com pool' : 'direto'} icon={CircuitBoard} active={pooling} />
              <ArchitectureBlock label="Porte do primário" value={`${verticalTier * 2} vCPU`} icon={HardDrive} active />
              <ArchitectureBlock label="Réplicas de leitura" value={`${replicas}`} icon={Server} active={replicas > 0} />
              <ArchitectureBlock label="Shards de escrita" value={`${shards}`} icon={Layers3} active={shards > 1} />
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_72px_1fr_72px_1fr]">
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold">Application load</span>
                  <Badge className="bg-primary text-primary-foreground">{load} qps</Badge>
                </div>
                <div className="space-y-2 text-sm text-slate-300">
                  <div className="flex justify-between">
                    <span>Leituras</span>
                    <span>{Math.round(metrics.readQps)} qps</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Escritas</span>
                    <span>{Math.round(metrics.writeQps)} qps</span>
                  </div>
                </div>
              </div>
              <div className="hidden items-center md:flex">
                <SimulatorFlowLine tone="primary" />
              </div>
              <div className="space-y-3">
                <SimulatorNodeCard
                  title="Banco primário"
                  subtitle={`capacidade de ${Math.round(metrics.writeCapacity)} qps de escrita`}
                  status={metrics.writeBottleneck && metrics.pressure > 90 ? 'hot' : 'healthy'}
                  load={metrics.writeQps / Math.max(metrics.writeCapacity, 1) * 100}
                  icon={Database}
                />
                <SimulatorNodeCard
                  title="Pool de conexões"
                  subtitle={pooling ? 'reaproveita as sessões dos clientes' : 'desativado'}
                  status={pooling ? 'routing' : 'lagging'}
                  load={pooling ? 38 : 88}
                  icon={CircuitBoard}
                />
              </div>
              <div className="hidden items-center md:flex">
                <SimulatorFlowLine tone="success" delay={0.35} />
              </div>
              <div className="space-y-3">
                {Array.from({ length: Math.max(replicas, 1) }, (_, index) => (
                  <SimulatorNodeCard
                    key={index}
                    title={index < replicas ? `Réplica ${index + 1}` : 'Sem réplicas'}
                    subtitle={index < replicas ? 'só tráfego de leitura' : 'as leituras vão ao primário'}
                    status={index < replicas ? 'healthy' : 'lagging'}
                    load={index < replicas ? metrics.readQps / Math.max(replicas, 1) / 3 : 90}
                    icon={Server}
                  />
                )).slice(0, 4)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gauge className="h-4 w-4" />
              Controles de escala
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <SimulatorControlSlider label="Carga" value={load} min={250} max={4200} step={50} suffix=" qps" onChange={setLoad} />
            <SimulatorControlSlider label="Tráfego de escrita" value={writePercent} min={5} max={85} step={5} suffix="%" onChange={setWritePercent} />
            <SimulatorControlSlider label="Porte vertical" value={verticalTier} min={1} max={6} step={1} suffix="x" onChange={setVerticalTier} />
            <SimulatorControlSlider label="Réplicas de leitura" value={replicas} min={0} max={5} step={1} onChange={setReplicas} />
            <SimulatorControlSlider label="Shards de escrita" value={shards} min={1} max={6} step={1} onChange={setShards} />
            <Button
              type="button"
              variant={pooling ? 'default' : 'outline'}
              onClick={() => setPooling((value) => !value)}
              className="w-full"
            >
              <CircuitBoard className="mr-2 h-4 w-4" />
              {pooling ? 'Connection pooling ativado' : 'Ativar connection pooling'}
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <SimulatorMetricCard
            label="Latência"
            value={ms(metrics.latency)}
            icon={Clock}
            tone={metrics.latency < 140 ? 'good' : metrics.latency < 260 ? 'warn' : 'bad'}
            detail={metrics.writeBottleneck ? 'o gargalo são as escritas' : 'o gargalo são as leituras'}
          />
          <SimulatorMetricCard
            label="Throughput"
            value={`${Math.round(metrics.throughput)} qps`}
            icon={Activity}
            tone={metrics.throughput >= load ? 'good' : 'bad'}
            detail={`${Math.round(metrics.pressure)}% de pressão`}
          />
          <SimulatorMetricCard
            label="Taxa de erro"
            value={pct(metrics.errorRate)}
            icon={AlertTriangle}
            tone={metrics.errorRate < 2 ? 'good' : metrics.errorRate < 10 ? 'warn' : 'bad'}
            detail="timeouts e conexões saturadas"
          />
          <SimulatorMetricCard
            label="Custo"
            value={money(metrics.cost)}
            icon={WalletCards}
            tone={metrics.cost < 650 ? 'good' : metrics.cost < 1050 ? 'warn' : 'bad'}
            detail="gasto mensal estimado com infraestrutura"
          />
        </div>

        <SimulatorAdvisorCard
          title="Leitura da escala"
          icon={Gauge}
          tone={metrics.errorRate > 10 ? 'bad' : metrics.pressure > 90 ? 'warn' : 'primary'}
        >
          {metrics.errorRate > 10
            ? 'O sistema está sobrecarregado. Adicione capacidade no caminho do gargalo antes de aumentar o tráfego.'
            : metrics.writeBottleneck
              ? 'As escritas estão limitando o throughput. Réplicas de leitura não resolvem isso; use sharding ou um primário maior.'
              : 'A escala de leitura e o pooling estão absorvendo a maior parte da pressão. O custo é a próxima contrapartida a observar.'}
        </SimulatorAdvisorCard>
      </div>
    </div>
  );
}

function ArchitectureBlock({
  label,
  value,
  icon: Icon,
  active,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border p-3',
        active ? 'border-primary/40 bg-primary/10' : 'border-white/10 bg-white/5'
      )}
    >
      <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

export default function DatabaseReplicationShardingScaling() {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-primary/20 bg-linear-to-br from-background via-background to-muted/30">
        <CardContent className="p-0">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-6 sm:p-8">
              <Badge variant="secondary" className="mb-4">
                Laboratório interativo de arquitetura
              </Badge>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Veja como bancos de dados sobrevivem a carga, falhas e crescimento
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
                A replicação melhora a disponibilidade e o throughput de leitura. O sharding distribui
                os dados e a pressão de escrita. A escala combina os dois com nodes maiores, pools e
                contrapartidas de custo.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <MiniOutcome icon={GitBranch} label="Replicação" value="lag e failover" />
                <MiniOutcome icon={Boxes} label="Sharding" value="hot spots e roteamento" />
                <MiniOutcome icon={TrendingUp} label="Escala" value="custo vs capacidade" />
              </div>
            </div>
            <div className="relative min-h-[260px] overflow-hidden border-t bg-zinc-950 p-6 text-slate-100 lg:border-l lg:border-t-0">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,hsl(var(--primary)_/_0.26),transparent_34%),radial-gradient(circle_at_78%_72%,hsl(var(--primary)_/_0.14),transparent_38%)]" />
              <div className="relative grid h-full grid-cols-3 items-center gap-3">
                <SimulatorNodeCard title="Primary" subtitle="writes" load={66} icon={Database} />
                <div className="space-y-5">
                  <SimulatorFlowLine tone="primary" />
                  <SimulatorFlowLine tone="success" delay={0.35} />
                  <SimulatorFlowLine tone="warn" delay={0.7} />
                </div>
                <div className="space-y-3">
                  <SimulatorNodeCard title="Shard 1" subtitle="replicated" load={48} icon={Layers3} />
                  <SimulatorNodeCard title="Shard 2" subtitle="hot tenant" load={86} status="hot" icon={Layers3} />
                  <SimulatorNodeCard title="Replica" subtitle="reads" load={36} icon={Server} />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="replication" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-3 gap-1 bg-muted/40 p-1">
          <TabsTrigger value="replication" className="gap-1 px-2 text-xs sm:gap-2 sm:text-sm">
            <GitBranch className="h-4 w-4" />
            Replicação
          </TabsTrigger>
          <TabsTrigger value="sharding" className="gap-1 px-2 text-xs sm:gap-2 sm:text-sm">
            <Boxes className="h-4 w-4" />
            Sharding
          </TabsTrigger>
          <TabsTrigger value="scaling" className="gap-1 px-2 text-xs sm:gap-2 sm:text-sm">
            <TrendingUp className="h-4 w-4" />
            Escala
          </TabsTrigger>
        </TabsList>
        <TabsContent value="replication" className="mt-6">
          <ReplicationModePanel />
        </TabsContent>
        <TabsContent value="sharding" className="mt-6">
          <ShardingModePanel />
        </TabsContent>
        <TabsContent value="scaling" className="mt-6">
          <ScalingModePanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MiniOutcome({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
