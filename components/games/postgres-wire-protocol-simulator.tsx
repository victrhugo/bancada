'use client';

import { useEffect, useMemo, useState, type ComponentType } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Binary,
  Braces,
  CheckCircle2,
  Clock,
  Code2,
  Database,
  Gauge,
  KeyRound,
  Lock,
  Network,
  Pause,
  Play,
  Rows3,
  Server,
  ShieldCheck,
  Shuffle,
  Terminal,
  TimerReset,
  Unplug,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

type Scenario = 'startup' | 'simple' | 'extended' | 'copy';
type Direction = 'client' | 'server' | 'both';
type MessageTone = 'startup' | 'query' | 'data' | 'auth' | 'ready' | 'error';

interface ProtocolStep {
  id: string;
  code: string;
  label: string;
  from: Direction;
  tone: MessageTone;
  bytes: number;
  rtt: number;
  payload: string;
  fields: string[];
  note: string;
}

interface ScenarioConfig {
  title: string;
  subtitle: string;
  icon: ComponentType<{ className?: string }>;
  query: string;
  steps: ProtocolStep[];
}

const BASE_SCENARIOS: Record<Scenario, ScenarioConfig> = {
  startup: {
    title: 'Inicialização e autenticação',
    subtitle: 'Negociação de SSL, parâmetros de inicialização, desafio SCRAM, configurações da sessão e estado pronto.',
    icon: KeyRound,
    query: 'psql "postgres://app@db.prod:5432/app"',
    steps: [
      {
        id: 'ssl-request',
        code: 'SSLRequest',
        label: 'Pede TLS',
        from: 'client',
        tone: 'startup',
        bytes: 8,
        rtt: 0.5,
        payload: 'Int32 length=8, Int32 code=80877103',
        fields: ['length: 8', 'magic: 0x04D2162F', 'sem byte de tipo'],
        note: 'O cliente pode perguntar se o servidor aceita SSL antes de enviar os parâmetros de inicialização.',
      },
      {
        id: 'ssl-ok',
        code: 'S',
        label: 'TLS aceito',
        from: 'server',
        tone: 'auth',
        bytes: 1,
        rtt: 0.5,
        payload: 'Resposta de um único byte: S',
        fields: ['S: segue com TLS', 'N: só texto puro'],
        note: 'Depois do S, o handshake TLS acontece fora do fluxo de mensagens do PostgreSQL.',
      },
      {
        id: 'startup',
        code: 'StartupMessage',
        label: 'Envia os parâmetros de inicialização',
        from: 'client',
        tone: 'startup',
        bytes: 92,
        rtt: 1,
        payload: 'protocol=3.0 user=app database=app application_name=wire_lab',
        fields: ['length', 'versão do protocolo', 'user', 'database', 'options'],
        note: 'A StartupMessage tem tamanho e versão do protocolo, mas não começa com byte de tipo.',
      },
      {
        id: 'auth-sasl',
        code: 'R',
        label: 'AuthenticationSASL',
        from: 'server',
        tone: 'auth',
        bytes: 33,
        rtt: 1.5,
        payload: 'SCRAM-SHA-256 oferecido',
        fields: ['type: R', 'length', 'auth code: 10', 'mechanisms'],
        note: 'O PostgreSQL moderno costuma usar SCRAM-SHA-256 para autenticação por senha.',
      },
      {
        id: 'sasl-initial',
        code: 'p',
        label: 'SASLInitialResponse',
        from: 'client',
        tone: 'auth',
        bytes: 86,
        rtt: 2,
        payload: 'client-first-message com nonce',
        fields: ['type: p', 'mechanism', 'tamanho da resposta inicial', 'nonce do cliente'],
        note: 'O cliente prova que conhece a senha sem enviar a senha.',
      },
      {
        id: 'sasl-continue',
        code: 'R',
        label: 'AuthenticationSASLContinue',
        from: 'server',
        tone: 'auth',
        bytes: 96,
        rtt: 2.5,
        payload: 'nonce do servidor, salt, número de iterações',
        fields: ['auth code: 11', 'salt', 'iterations', 'nonce do servidor'],
        note: 'O desafio do servidor amarra os dois nonces e o verificador armazenado.',
      },
      {
        id: 'sasl-final',
        code: 'p',
        label: 'SASLResponse',
        from: 'client',
        tone: 'auth',
        bytes: 112,
        rtt: 3,
        payload: 'prova do cliente',
        fields: ['client-final-message', 'flag de channel binding', 'proof'],
        note: 'O cliente envia uma prova derivada da senha, do salt e da troca de nonces.',
      },
      {
        id: 'auth-ok',
        code: 'R',
        label: 'AuthenticationOk',
        from: 'server',
        tone: 'ready',
        bytes: 9,
        rtt: 3.5,
        payload: 'auth code 0',
        fields: ['type: R', 'length: 8', 'auth code: 0'],
        note: 'A autenticação terminou; agora o backend pode anunciar o estado da sessão.',
      },
      {
        id: 'parameter-status',
        code: 'S',
        label: 'ParameterStatus',
        from: 'server',
        tone: 'ready',
        bytes: 128,
        rtt: 3.5,
        payload: 'server_version, TimeZone, client_encoding',
        fields: ['server_version', 'server_encoding', 'DateStyle', 'integer_datetimes'],
        note: 'Os drivers guardam essas configurações em cache porque elas afetam como os dados são interpretados e exibidos.',
      },
      {
        id: 'ready-startup',
        code: 'Z',
        label: 'ReadyForQuery',
        from: 'server',
        tone: 'ready',
        bytes: 6,
        rtt: 4,
        payload: 'status da transação: idle',
        fields: ['type: Z', 'length: 5', 'status: I'],
        note: 'O ReadyForQuery avisa ao cliente que ele já pode enviar o próximo comando com segurança.',
      },
    ],
  },
  simple: {
    title: 'Protocolo de query simples',
    subtitle: 'Entra uma mensagem Query, sai um fluxo de linhas e o status de conclusão.',
    icon: Terminal,
    query: 'SELECT id, email, plan FROM users WHERE active = true LIMIT 3;',
    steps: [
      {
        id: 'query',
        code: 'Q',
        label: 'Query',
        from: 'client',
        tone: 'query',
        bytes: 74,
        rtt: 0.5,
        payload: 'String SQL terminada por byte zero',
        fields: ['type: Q', 'length', 'string da query em UTF-8', 'terminador zero'],
        note: 'O protocolo simples envia o SQL inteiro em uma única mensagem Query.',
      },
      {
        id: 'row-desc',
        code: 'T',
        label: 'RowDescription',
        from: 'server',
        tone: 'data',
        bytes: 168,
        rtt: 1,
        payload: '3 colunas: id, email, plan',
        fields: ['número de campos', 'name', 'OID do tipo', 'tamanho do tipo', 'código de formato'],
        note: 'O RowDescription diz ao driver como decodificar cada campo do DataRow.',
      },
      {
        id: 'data-row',
        code: 'D',
        label: 'Fluxo de DataRow',
        from: 'server',
        tone: 'data',
        bytes: 240,
        rtt: 1.25,
        payload: 'As linhas chegam uma mensagem por vez',
        fields: ['column count', 'tamanho do valor', 'bytes do valor', '-1 para NULL'],
        note: 'Cada linha retornada é uma mensagem DataRow separada.',
      },
      {
        id: 'command-complete',
        code: 'C',
        label: 'CommandComplete',
        from: 'server',
        tone: 'ready',
        bytes: 16,
        rtt: 1.5,
        payload: 'SELECT 3',
        fields: ['type: C', 'length', 'command tag'],
        note: 'O command tag traz o tipo do comando e, quando faz sentido, o número de linhas.',
      },
      {
        id: 'ready-simple',
        code: 'Z',
        label: 'ReadyForQuery',
        from: 'server',
        tone: 'ready',
        bytes: 6,
        rtt: 1.5,
        payload: 'status da transação: idle',
        fields: ['I: idle', 'T: em transação', 'E: transação com falha'],
        note: 'Os drivers esperam o ReadyForQuery antes de considerar a troca concluída.',
      },
    ],
  },
  extended: {
    title: 'Protocolo de query estendido',
    subtitle: 'Parse, Bind, Describe, Execute e Sync para queries preparadas e parametrizadas.',
    icon: Braces,
    query: 'SELECT * FROM orders WHERE customer_id = $1 AND created_at > $2;',
    steps: [
      {
        id: 'parse',
        code: 'P',
        label: 'Parse',
        from: 'client',
        tone: 'query',
        bytes: 112,
        rtt: 0.25,
        payload: 'nome do statement, SQL, OIDs dos tipos dos parâmetros',
        fields: ['nome do statement', 'string da query', 'número de tipos de parâmetro', 'OIDs dos tipos'],
        note: 'O Parse cria um prepared statement no backend.',
      },
      {
        id: 'bind',
        code: 'B',
        label: 'Bind',
        from: 'client',
        tone: 'query',
        bytes: 96,
        rtt: 0.3,
        payload: 'nome do portal e valores dos parâmetros',
        fields: ['nome do portal', 'nome do statement', 'códigos de formato', 'valores dos parâmetros'],
        note: 'O Bind fornece valores concretos e cria um portal pronto para executar.',
      },
      {
        id: 'describe',
        code: 'D',
        label: 'Describe',
        from: 'client',
        tone: 'query',
        bytes: 18,
        rtt: 0.35,
        payload: 'descreve o formato do resultado do portal',
        fields: ['alvo: portal', 'nome do portal'],
        note: 'O Describe pede os metadados antes de as linhas chegarem.',
      },
      {
        id: 'execute',
        code: 'E',
        label: 'Execute',
        from: 'client',
        tone: 'query',
        bytes: 16,
        rtt: 0.4,
        payload: 'nome do portal, max rows=0',
        fields: ['nome do portal', 'max rows'],
        note: 'O Execute começa a ler do portal vinculado.',
      },
      {
        id: 'sync',
        code: 'S',
        label: 'Sync',
        from: 'client',
        tone: 'query',
        bytes: 5,
        rtt: 0.5,
        payload: 'fim do ciclo de query estendida',
        fields: ['type: S', 'length: 4'],
        note: 'O Sync pede ao backend que termine o lote e devolva o ReadyForQuery.',
      },
      {
        id: 'parse-complete',
        code: '1',
        label: 'ParseComplete',
        from: 'server',
        tone: 'ready',
        bytes: 5,
        rtt: 1,
        payload: 'parse concluído',
        fields: ['type: 1', 'length: 4'],
        note: 'O backend confirma cada etapa em ordem.',
      },
      {
        id: 'bind-complete',
        code: '2',
        label: 'BindComplete',
        from: 'server',
        tone: 'ready',
        bytes: 5,
        rtt: 1.05,
        payload: 'bind concluído',
        fields: ['type: 2', 'length: 4'],
        note: 'O portal está pronto para executar.',
      },
      {
        id: 'row-desc-extended',
        code: 'T',
        label: 'RowDescription',
        from: 'server',
        tone: 'data',
        bytes: 184,
        rtt: 1.15,
        payload: 'orders result columns',
        fields: ['metadados dos campos', 'OID da tabela', 'número do atributo', 'código de formato'],
        note: 'Os códigos de formato podem ser texto ou binário, por coluna.',
      },
      {
        id: 'data-extended',
        code: 'D',
        label: 'Fluxo de DataRow',
        from: 'server',
        tone: 'data',
        bytes: 420,
        rtt: 1.25,
        payload: 'pedidos encontrados',
        fields: ['row values', 'codificado em binário ou texto', 'NULL como tamanho -1'],
        note: 'Queries parametrizadas continuam devolvendo mensagens DataRow comuns.',
      },
      {
        id: 'ready-extended',
        code: 'Z',
        label: 'ReadyForQuery',
        from: 'server',
        tone: 'ready',
        bytes: 6,
        rtt: 1.5,
        payload: 'idle',
        fields: ['status da transação'],
        note: 'O ciclo estendido terminou.',
      },
    ],
  },
  copy: {
    title: 'Streaming com COPY',
    subtitle: 'Importação e exportação em massa usam CopyInResponse, pedaços de CopyData e CopyDone.',
    icon: Rows3,
    query: "COPY events FROM STDIN WITH (FORMAT csv);",
    steps: [
      {
        id: 'copy-query',
        code: 'Q',
        label: 'Comando COPY',
        from: 'client',
        tone: 'query',
        bytes: 48,
        rtt: 0.5,
        payload: 'COPY events FROM STDIN',
        fields: ['type: Q', 'COPY SQL'],
        note: 'O COPY pode ser iniciado pelo protocolo de query.',
      },
      {
        id: 'copy-in',
        code: 'G',
        label: 'CopyInResponse',
        from: 'server',
        tone: 'data',
        bytes: 18,
        rtt: 1,
        payload: 'o servidor está pronto para receber o fluxo',
        fields: ['formato geral', 'column count', 'códigos de formato por coluna'],
        note: 'O servidor entra no modo COPY-in.',
      },
      {
        id: 'copy-data',
        code: 'd',
        label: 'Pedaços de CopyData',
        from: 'client',
        tone: 'data',
        bytes: 1024,
        rtt: 1.15,
        payload: 'bytes de CSV enviados em pedaços',
        fields: ['type: d', 'length', 'bytes opacos do pedaço'],
        note: 'Para a camada de protocolo, os dados do COPY são um fluxo opaco de bytes.',
      },
      {
        id: 'copy-done',
        code: 'c',
        label: 'CopyDone',
        from: 'client',
        tone: 'ready',
        bytes: 5,
        rtt: 1.4,
        payload: 'o cliente terminou de enviar as linhas',
        fields: ['type: c', 'length: 4'],
        note: 'O CopyDone encerra o fluxo com sucesso. O CopyFail aborta.',
      },
      {
        id: 'copy-complete',
        code: 'C',
        label: 'CommandComplete',
        from: 'server',
        tone: 'ready',
        bytes: 19,
        rtt: 1.8,
        payload: 'COPY 25000',
        fields: ['command tag', 'row count'],
        note: 'O command tag informa quantas linhas foram copiadas.',
      },
      {
        id: 'ready-copy',
        code: 'Z',
        label: 'ReadyForQuery',
        from: 'server',
        tone: 'ready',
        bytes: 6,
        rtt: 1.9,
        payload: 'idle',
        fields: ['status da transação'],
        note: 'A conexão volta ao modo normal de comandos.',
      },
    ],
  },
};

const toneStyles: Record<MessageTone, string> = {
  startup: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-100',
  query: 'border-blue-400/40 bg-blue-400/10 text-blue-100',
  data: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100',
  auth: 'border-amber-400/40 bg-amber-400/10 text-amber-100',
  ready: 'border-violet-400/40 bg-violet-400/10 text-violet-100',
  error: 'border-red-400/40 bg-red-400/10 text-red-100',
};

const providers = [
  {
    name: 'DigitalOcean Managed PostgreSQL',
    label: 'Gerenciado',
    href: 'https://www.digitalocean.com/',
    description: 'Postgres gerenciado com backups, nós standby, rede VPC e preço simples.',
  },
  {
    name: 'Neon',
    label: 'Serverless',
    href: 'https://neon.com',
    description: 'Postgres serverless com branching, autoscaling e restauração instantânea.',
  },
  {
    name: 'Supabase',
    label: 'Plataforma de apps',
    href: 'https://supabase.com/database',
    description: 'Postgres gerenciado com auth, storage, realtime, edge functions e painel de gestão.',
  },
  {
    name: 'Crunchy Bridge',
    label: 'Especialistas em Postgres',
    href: 'https://www.crunchydata.com/products/crunchy-bridge',
    description: 'Postgres totalmente gerenciado, com suporte da Crunchy Data e deploy multi-cloud.',
  },
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function flowDirection(step: ProtocolStep) {
  if (step.from === 'client') return 'Client to server';
  if (step.from === 'server') return 'Server to client';
  return 'Nos dois sentidos';
}

function compactCode(code: string) {
  const compact: Record<string, string> = {
    SSLRequest: 'SSL',
    StartupMessage: 'START',
  };

  return compact[code] ?? code;
}

function getScenarioSteps(scenario: Scenario, tlsEnabled: boolean, rowCount: number, injectError: boolean) {
  let steps = BASE_SCENARIOS[scenario].steps;

  if (!tlsEnabled && scenario === 'startup') {
    steps = steps.filter((step) => step.id !== 'ssl-request' && step.id !== 'ssl-ok');
  }

  const rowMultiplier = Math.max(1, Math.ceil(rowCount / 3));
  steps = steps.map((step) => {
    if (step.id.includes('data') || step.id === 'data-row' || step.id === 'copy-data') {
      return {
        ...step,
        bytes: step.id === 'copy-data' ? Math.max(1024, rowCount * 58) : step.bytes * rowMultiplier,
        payload:
          step.id === 'copy-data'
            ? `${rowCount.toLocaleString()} linhas de CSV enviadas em pedaços`
            : `${rowCount.toLocaleString()} linha${rowCount === 1 ? '' : 's'} retornada${rowCount === 1 ? '' : 's'}`,
      };
    }
    if (step.id.includes('command-complete') || step.id === 'copy-complete') {
      return {
        ...step,
        payload: step.id === 'copy-complete' ? `COPY ${rowCount}` : `SELECT ${rowCount}`,
      };
    }
    return step;
  });

  if (injectError && scenario !== 'startup') {
    const errorStep: ProtocolStep = {
      id: 'error-response',
      code: 'E',
      label: 'ErrorResponse',
      from: 'server',
      tone: 'error',
      bytes: 142,
      rtt: 1.2,
      payload: 'SQLSTATE 42P01: a relation não existe',
      fields: ['severity', 'SQLSTATE', 'message', 'detail', 'position'],
      note: 'Erros vêm em campos estruturados; depois o servidor segue até o ReadyForQuery, após o Sync ou o fim da query.',
    };
    const readyStep: ProtocolStep = {
      id: 'ready-after-error',
      code: 'Z',
      label: 'ReadyForQuery',
      from: 'server',
      tone: 'ready',
      bytes: 6,
      rtt: 1.4,
      payload: 'transação com falha ou idle',
      fields: ['I: idle', 'E: transação com falha'],
      note: 'O driver deve checar o status da transação antes de tentar de novo.',
    };
    steps = [...steps.slice(0, Math.min(2, steps.length)), errorStep, readyStep];
  }

  return steps;
}

function MessageRail({
  steps,
  activeIndex,
  onSelect,
}: {
  steps: ProtocolStep[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  const visibleSteps = steps.slice(0, activeIndex + 1);

  return (
    <div className="relative overflow-hidden rounded-lg border bg-zinc-950 p-4 text-slate-100">
      <div
        className={cn(
          'mb-4 grid grid-cols-[minmax(0,1fr)_84px_minmax(0,1fr)] items-center gap-4 text-xs',
          'font-medium uppercase tracking-wide text-slate-400'
        )}
      >
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4" />
          Cliente
        </div>
        <div className="text-center">Wire</div>
        <div className="flex items-center justify-end gap-2">
          <Server className="h-4 w-4" />
          Servidor
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 top-14 w-px bg-slate-700" />
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {visibleSteps.map((step, index) => {
            const isClient = step.from === 'client';
            const isServer = step.from === 'server';
            const isActive = index === activeIndex;
            return (
              <motion.button
                key={step.id}
                type="button"
                onClick={() => onSelect(index)}
                className={cn(
                  'grid w-full grid-cols-[minmax(0,1fr)_84px_minmax(0,1fr)] items-center gap-4',
                  'rounded-md p-1 text-left',
                  'transition-colors hover:bg-white/5',
                  isActive && 'bg-white/10'
                )}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <div className={cn('min-w-0', isClient ? 'opacity-100' : 'opacity-25')}>
                  {isClient && <Packet step={step} active={isActive} />}
                </div>
                <div className="relative flex h-10 items-center justify-center">
                  <motion.div
                    className={cn(
                      'h-2.5 w-2.5 rounded-full border bg-zinc-950',
                      isActive ? 'border-primary shadow-[0_0_20px_rgba(34,197,94,0.7)]' : 'border-slate-600'
                    )}
                    animate={isActive ? { scale: [1, 1.35, 1] } : { scale: 1 }}
                    transition={{ repeat: isActive ? Infinity : 0, duration: 1.1 }}
                  />
                  <ArrowRight
                    className={cn(
                      'absolute h-4 w-4 text-slate-500',
                      isServer && 'rotate-180',
                      step.from === 'both' && 'opacity-0'
                    )}
                  />
                  {step.from === 'both' && <Shuffle className="absolute h-4 w-4 text-slate-400" />}
                </div>
                <div className={cn('min-w-0', isServer ? 'opacity-100' : 'opacity-25')}>
                  {isServer && <Packet step={step} active={isActive} />}
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Packet({ step, active }: { step: ProtocolStep; active: boolean }) {
  return (
    <div
      className={cn(
        'rounded-md border px-3 py-2 shadow-sm',
        toneStyles[step.tone],
        active && 'ring-1 ring-white/30'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            title={step.code}
            className="flex h-6 min-w-8 max-w-16 shrink-0 items-center justify-center truncate
              rounded bg-black/35 px-2 font-mono text-[11px]"
          >
            {compactCode(step.code)}
          </span>
          <span className="truncate text-sm font-semibold">{step.label}</span>
        </div>
        <span className="shrink-0 font-mono text-[11px] opacity-70">{formatBytes(step.bytes)}</span>
      </div>
      <p className="mt-1 truncate text-xs opacity-75">{step.payload}</p>
    </div>
  );
}

function MessageInspector({ step }: { step: ProtocolStep }) {
  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Binary className="h-5 w-5 text-primary" />
              Inspetor de mensagens
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{flowDirection(step)}</p>
          </div>
          <Badge variant="secondary" className="font-mono" title={step.code}>
            {compactCode(step.code)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-sm font-semibold">{step.label}</span>
            <span className="font-mono text-xs text-muted-foreground">{formatBytes(step.bytes)}</span>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{step.note}</p>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Code2 className="h-4 w-4 text-primary" />
            Formato do payload
          </div>
          <div className="grid gap-2">
            {step.fields.map((field) => (
              <div
                key={field}
                className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="font-mono text-xs">{field}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-zinc-950 p-3 text-slate-100">
          <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">Esboço do frame</div>
          <div
            className={cn(
              'grid grid-cols-[46px_68px_1fr] overflow-hidden rounded border',
              'border-slate-700 text-center font-mono text-[11px]'
            )}
          >
            <div className="border-r border-slate-700 bg-slate-800 px-2 py-2">type</div>
            <div className="border-r border-slate-700 bg-slate-800 px-2 py-2">length</div>
            <div className="bg-slate-800 px-2 py-2">payload</div>
            <div className="border-r border-t border-slate-700 px-2 py-3 text-primary">
              {compactCode(step.code)}
            </div>
            <div className="border-r border-t border-slate-700 px-2 py-3">{step.bytes}</div>
            <div className="truncate border-t border-slate-700 px-2 py-3 text-left">{step.payload}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'default',
}: {
  label: string;
  value: string;
  detail: string;
  icon: ComponentType<{ className?: string }>;
  tone?: 'default' | 'good' | 'warn' | 'bad';
}) {
  const tones = {
    default: 'border-border bg-card',
    good: 'border-emerald-500/30 bg-emerald-500/5',
    warn: 'border-amber-500/30 bg-amber-500/5',
    bad: 'border-red-500/30 bg-red-500/5',
  };

  return (
    <div className={cn('rounded-lg border p-4', tones[tone])}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function ControlSlider({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <Badge variant="secondary" className="shrink-0">
          {value.toLocaleString()}
          {suffix}
        </Badge>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([next]) => onChange(next ?? value)} />
    </div>
  );
}

export default function PostgresWireProtocolSimulator() {
  const [scenario, setScenario] = useState<Scenario>('startup');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tlsEnabled, setTlsEnabled] = useState(true);
  const [pipelineEnabled, setPipelineEnabled] = useState(true);
  const [injectError, setInjectError] = useState(false);
  const [rowCount, setRowCount] = useState(3);
  const [latency, setLatency] = useState(42);

  const steps = useMemo(
    () => getScenarioSteps(scenario, tlsEnabled, rowCount, injectError),
    [injectError, rowCount, scenario, tlsEnabled]
  );
  const activeStep = steps[Math.min(activeIndex, steps.length - 1)] ?? steps[0];
  const config = BASE_SCENARIOS[scenario];
  const ScenarioIcon = config.icon;

  const metrics = useMemo(() => {
    const payloadBytes = steps.reduce((sum, step) => sum + step.bytes, 0);
    const serverTurns = steps.filter((step) => step.from === 'server').length;
    const clientTurns = steps.filter((step) => step.from === 'client').length;
    const baseRoundTrips = Math.max(...steps.map((step) => step.rtt));
    const pipelineSavings = scenario === 'extended' && pipelineEnabled ? 1.1 : 0;
    const roundTrips = Math.max(1, baseRoundTrips - pipelineSavings);
    const totalMs = Math.round(roundTrips * latency + payloadBytes / 520);
    const decodeCost = Math.round(rowCount * (scenario === 'copy' ? 0.06 : 0.18) + steps.length * 0.9);

    return {
      payloadBytes,
      roundTrips,
      totalMs,
      decodeCost,
      serverTurns,
      clientTurns,
    };
  }, [latency, pipelineEnabled, rowCount, scenario, steps]);

  useEffect(() => {
    setActiveIndex(0);
    setIsPlaying(false);
    if (scenario === 'startup') {
      setInjectError(false);
    }
  }, [scenario]);

  useEffect(() => {
    setActiveIndex((index) => Math.min(index, Math.max(steps.length - 1, 0)));
  }, [steps.length]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setTimeout(() => {
      setActiveIndex((index) => {
        if (index >= steps.length - 1) {
          setIsPlaying(false);
          return index;
        }
        return index + 1;
      });
    }, 920);
    return () => window.clearTimeout(timer);
  }, [activeIndex, isPlaying, steps.length]);

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-primary/20">
        <div className="bg-zinc-950 p-5 text-slate-100 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge className="bg-emerald-500 text-emerald-950 hover:bg-emerald-500">Protocolo PostgreSQL v3</Badge>
                <Badge variant="outline" className="border-slate-600 text-slate-300">
                  mensagens frontend/backend
                </Badge>
              </div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Veja cada byte trocado entre um cliente e um servidor Postgres.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
                Step through connection startup, SCRAM authentication, simple queries,
                prepared statements, streaming de linhas, erros e COPY. O laboratório mostra o que os drivers
                realmente enviam pela rede.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                label="Idas e voltas"
                value={metrics.roundTrips.toFixed(1)}
                detail={pipelineEnabled && scenario === 'extended' ? 'pipelining ativado' : 'trocas de protocolo'}
                icon={Network}
                tone={metrics.roundTrips <= 2 ? 'good' : 'warn'}
              />
              <MetricCard
                label="Bytes na rede"
                value={formatBytes(metrics.payloadBytes)}
                detail={`${metrics.clientTurns} mensagens do cliente, ${metrics.serverTurns} do servidor`}
                icon={Binary}
              />
              <MetricCard
                label="Latência estimada"
                value={`${metrics.totalMs} ms`}
                detail={`${latency} ms de latência base da rede`}
                icon={Clock}
                tone={metrics.totalMs < 160 ? 'good' : metrics.totalMs < 320 ? 'warn' : 'bad'}
              />
              <MetricCard
                label="Custo de decodificação"
                value={`${metrics.decodeCost} ms`}
                detail={`${rowCount.toLocaleString()} linhas simuladas`}
                icon={Gauge}
              />
            </div>
          </div>
        </div>

        <CardContent className="p-4 sm:p-6">
          <Tabs value={scenario} onValueChange={(value) => setScenario(value as Scenario)}>
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 lg:grid-cols-4">
              {(Object.keys(BASE_SCENARIOS) as Scenario[]).map((key) => {
                const TabIcon = BASE_SCENARIOS[key].icon;
                return (
                  <TabsTrigger key={key} value={key} className="gap-2 py-2">
                    <TabIcon className="h-4 w-4" />
                    {BASE_SCENARIOS[key].title.split(' ')[0]}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {(Object.keys(BASE_SCENARIOS) as Scenario[]).map((key) => (
              <TabsContent key={key} value={key} className="mt-6">
                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="flex items-center gap-2 text-xl font-semibold">
                      <ScenarioIcon className="h-5 w-5 text-primary" />
                      {config.title}
                    </h3>
                    <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{config.subtitle}</p>
                    <pre className="mt-3 overflow-x-auto rounded-md border bg-muted/35 px-3 py-2 text-xs">
                      <code>{config.query}</code>
                    </pre>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setIsPlaying((value) => !value)}
                      className="gap-2"
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      {isPlaying ? 'Pausar' : 'Reproduzir'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setActiveIndex(0);
                        setIsPlaying(false);
                      }}
                      className="gap-2"
                    >
                      <TimerReset className="h-4 w-4" />
                      Reiniciar
                    </Button>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-4">
              <MessageRail
                steps={steps}
                activeIndex={Math.min(activeIndex, steps.length - 1)}
                onSelect={setActiveIndex}
              />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {steps.map((step, index) => (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={cn(
                      'rounded-md border px-3 py-2 text-left text-xs transition-colors hover:border-primary/50',
                      index === activeIndex ? 'border-primary bg-primary/10' : 'bg-muted/20'
                    )}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="font-mono font-semibold">{step.code}</span>
                      <span className="text-muted-foreground">{index + 1}</span>
                    </div>
                    <div className="truncate font-medium">{step.label}</div>
                  </button>
                ))}
              </div>
              <div className="grid gap-2 rounded-lg border bg-muted/20 p-3 text-xs sm:grid-cols-3">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-cyan-500/15 px-2 py-1 font-mono text-cyan-600 dark:text-cyan-300">
                    START
                  </span>
                  Pacotes de inicialização não têm byte de tipo.
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'rounded bg-emerald-500/15 px-2 py-1 font-mono',
                      'text-emerald-600 dark:text-emerald-300'
                    )}
                  >
                    D
                  </span>
                  Cada mensagem DataRow carrega uma linha.
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'rounded bg-violet-500/15 px-2 py-1 font-mono',
                      'text-violet-600 dark:text-violet-300'
                    )}
                  >
                    Z
                  </span>
                  O ReadyForQuery encerra a troca.
                </div>
              </div>
            </div>

            {activeStep && <MessageInspector step={activeStep} />}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-primary" />
              Controles do laboratório
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <ControlSlider
              label="Linhas retornadas"
              value={rowCount}
              min={1}
              max={scenario === 'copy' ? 25000 : 250}
              step={scenario === 'copy' ? 500 : 1}
              onChange={setRowCount}
            />
            <ControlSlider
              label="Latência de rede"
              value={latency}
              min={5}
              max={180}
              step={1}
              suffix=" ms"
              onChange={setLatency}
            />

            <div className="grid gap-2">
              <Button
                type="button"
                variant={tlsEnabled ? 'default' : 'outline'}
                onClick={() => setTlsEnabled((value) => !value)}
                className="justify-start gap-2"
              >
                {tlsEnabled ? <Lock className="h-4 w-4" /> : <Unplug className="h-4 w-4" />}
                TLS negotiation {tlsEnabled ? 'on' : 'off'}
              </Button>
              <Button
                type="button"
                variant={pipelineEnabled ? 'default' : 'outline'}
                onClick={() => setPipelineEnabled((value) => !value)}
                className="justify-start gap-2"
                disabled={scenario !== 'extended'}
              >
                <Zap className="h-4 w-4" />
                Extended pipelining {pipelineEnabled ? 'on' : 'off'}
              </Button>
              <Button
                type="button"
                variant={injectError ? 'destructive' : 'outline'}
                onClick={() => setInjectError((value) => !value)}
                className="justify-start gap-2"
                disabled={scenario === 'startup'}
              >
                <AlertTriangle className="h-4 w-4" />
                Injetar ErrorResponse
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Modelo mental do driver
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border bg-muted/20 p-4">
                <CheckCircle2 className="mb-3 h-5 w-5 text-emerald-500" />
                <h4 className="mb-2 text-sm font-semibold">Sempre espere o Z</h4>
                <p className="text-sm text-muted-foreground">
                  O ReadyForQuery é a fronteira da conexão. Ele diz ao pooler se a sessão está
                  ociosa, dentro de uma transação ou presa em uma transação com falha.
                </p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-4">
                <CheckCircle2 className="mb-3 h-5 w-5 text-emerald-500" />
                <h4 className="mb-2 text-sm font-semibold">As linhas vêm em frames</h4>
                <p className="text-sm text-muted-foreground">
                  Cada DataRow traz o tamanho dos campos, então o cliente decodifica NULLs, textos e
                  valores binários sem precisar adivinhar delimitadores.
                </p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-4">
                <CheckCircle2 className="mb-3 h-5 w-5 text-emerald-500" />
                <h4 className="mb-2 text-sm font-semibold">Queries preparadas dividem o trabalho</h4>
                <p className="text-sm text-muted-foreground">
                  Parse e Bind separam a estrutura do SQL dos valores, o que ajuda a reaproveitar planos e
                  mantém os parâmetros longe da concatenação de strings.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="h-5 w-5 text-primary" />
            Experimente Postgres sem manter seu próprio servidor
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Estes provedores oferecem um endpoint Postgres de verdade, então o mesmo protocolo mostrado acima
            é o que o driver da sua aplicação fala em produção.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {providers.map((provider) => (
              <a
                key={provider.name}
                href={provider.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'rounded-lg border bg-muted/20 p-4 transition-colors',
                  'hover:border-primary/50 hover:bg-muted/35'
                )}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h4 className="text-sm font-semibold leading-snug">{provider.name}</h4>
                  <Badge variant="secondary" className="shrink-0">
                    {provider.label}
                  </Badge>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{provider.description}</p>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
