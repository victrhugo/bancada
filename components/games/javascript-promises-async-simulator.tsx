'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Braces,
  CheckCircle2,
  Clock3,
  Code2,
  FastForward,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Timer,
  Workflow,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

type ScenarioId = 'microtasks' | 'async-await' | 'rejection' | 'promise-all';
type PromiseStatus = 'none' | 'pending' | 'fulfilled' | 'rejected';
type PanelTone = 'default' | 'active' | 'wait' | 'success' | 'danger';
type StepFocus = 'code' | 'stack' | 'webapi' | 'microtask' | 'task' | 'console' | 'promise';

interface PromiseState {
  label: string;
  status: PromiseStatus;
  value: string;
}

interface StepState {
  title: string;
  explanation: string;
  activeLine: number;
  callStack: string[];
  webApis: string[];
  microtasks: string[];
  taskQueue: string[];
  console: string[];
  promise: PromiseState;
  focus: StepFocus;
}

interface Prediction {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

interface Scenario {
  id: ScenarioId;
  title: string;
  subtitle: string;
  concept: string;
  code: string[];
  steps: StepState[];
  prediction: Prediction;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'microtasks',
    title: 'Microtasks passam na frente dos timers',
    subtitle: 'Por que callbacks de Promise rodam antes de setTimeout(..., 0)',
    concept: 'O event loop esvazia a fila de microtasks antes de pegar a próxima task.',
    code: [
      "console.log('Start');",
      '',
      "setTimeout(() => console.log('Timeout'), 0);",
      '',
      "Promise.resolve('Promise').then(value => {",
      '  console.log(value);',
      '});',
      '',
      "console.log('End');",
    ],
    prediction: {
      question: 'O que é impresso primeiro depois de Start?',
      options: ['Timeout', 'Promise', 'End'],
      answer: 'End',
      explanation:
        'O código síncrono continua rodando até a call stack ficar vazia. O callback da promise espera na fila de microtasks, e o timer espera na fila de tasks.',
    },
    steps: [
      {
        title: 'Começa na execução global',
        explanation: 'O script começa na call stack. Nada assíncrono foi agendado ainda.',
        activeLine: 1,
        callStack: ['global script', "console.log('Start')"],
        webApis: [],
        microtasks: [],
        taskQueue: [],
        console: ['Start'],
        promise: { label: 'Promise.resolve', status: 'none', value: '-' },
        focus: 'stack',
      },
      {
        title: 'O callback do timer sai do JavaScript',
        explanation:
          'O setTimeout é tratado pelo navegador ou pelo runtime. O callback só pode rodar quando o script atual terminar e houver uma vez livre na fila de tasks.',
        activeLine: 3,
        callStack: ['global script', 'setTimeout(...)'],
        webApis: ['timer: 0ms'],
        microtasks: [],
        taskQueue: [],
        console: ['Start'],
        promise: { label: 'Promise.resolve', status: 'none', value: '-' },
        focus: 'webapi',
      },
      {
        title: 'A Promise resolve na hora',
        explanation:
          'O Promise.resolve cria uma promise já fulfilled, mas o handler do then não é chamado na hora. Ele entra na fila como microtask.',
        activeLine: 5,
        callStack: ['global script', 'Promise.resolve(...).then(...)'],
        webApis: [],
        microtasks: ["then: console.log('Promise')"],
        taskQueue: ["timer: console.log('Timeout')"],
        console: ['Start'],
        promise: { label: 'Promise.resolve', status: 'fulfilled', value: "'Promise'" },
        focus: 'promise',
      },
      {
        title: 'O código síncrono termina primeiro',
        explanation:
          'O último console.log ainda roda antes dos callbacks enfileirados, porque o script global não terminou.',
        activeLine: 9,
        callStack: ['global script', "console.log('End')"],
        webApis: [],
        microtasks: ["then: console.log('Promise')"],
        taskQueue: ["timer: console.log('Timeout')"],
        console: ['Start', 'End'],
        promise: { label: 'Promise.resolve', status: 'fulfilled', value: "'Promise'" },
        focus: 'console',
      },
      {
        title: 'A fila de microtasks é esvaziada',
        explanation:
          'Quando a call stack fica vazia, o event loop roda todas as microtasks enfileiradas antes de mexer na fila de tasks.',
        activeLine: 6,
        callStack: ["then callback", "console.log('Promise')"],
        webApis: [],
        microtasks: [],
        taskQueue: ["timer: console.log('Timeout')"],
        console: ['Start', 'End', 'Promise'],
        promise: { label: 'Promise.resolve', status: 'fulfilled', value: "'Promise'" },
        focus: 'microtask',
      },
      {
        title: 'Finalmente chega a vez do timer',
        explanation:
          'Só depois que a stack e a fila de microtasks estão vazias o event loop roda a próxima task.',
        activeLine: 3,
        callStack: ['timer callback', "console.log('Timeout')"],
        webApis: [],
        microtasks: [],
        taskQueue: [],
        console: ['Start', 'End', 'Promise', 'Timeout'],
        promise: { label: 'Promise.resolve', status: 'fulfilled', value: "'Promise'" },
        focus: 'task',
      },
    ],
  },
  {
    id: 'async-await',
    title: 'O await suspende a função',
    subtitle: 'O resto de uma função async continua como microtask',
    concept: 'O await pausa a função async e deixa o código síncrono de fora continuar.',
    code: [
      'async function run() {',
      "  console.log('Inside');",
      "  const value = await Promise.resolve('Data');",
      "  console.log(value);",
      '}',
      '',
      "console.log('Before');",
      'run();',
      "console.log('After');",
    ],
    prediction: {
      question: 'Quando Data é impresso?',
      options: ['Antes de After', 'Entre Inside e After', 'Depois que o script de fora termina'],
      answer: 'Depois que o script de fora termina',
      explanation:
        'A função async roda até o await. A continuação entra na fila como microtask depois que a promise aguardada é fulfilled.',
    },
    steps: [
      {
        title: 'O script de fora começa',
        explanation: 'O script global loga Before antes de chamar a função async.',
        activeLine: 7,
        callStack: ['global script', "console.log('Before')"],
        webApis: [],
        microtasks: [],
        taskQueue: [],
        console: ['Before'],
        promise: { label: 'run()', status: 'pending', value: '-' },
        focus: 'console',
      },
      {
        title: 'No começo, a função async roda de forma síncrona',
        explanation: 'Chamar uma função async executa o corpo dela na hora, até chegar ao await.',
        activeLine: 2,
        callStack: ['global script', 'run()', "console.log('Inside')"],
        webApis: [],
        microtasks: [],
        taskQueue: [],
        console: ['Before', 'Inside'],
        promise: { label: 'run()', status: 'pending', value: '-' },
        focus: 'stack',
      },
      {
        title: 'O await pausa run()',
        explanation:
          'A promise aguardada é fulfilled, mas o resto do corpo da função vai para a fila de microtasks.',
        activeLine: 3,
        callStack: ['global script', 'run()', "await Promise.resolve('Data')"],
        webApis: [],
        microtasks: ['resume run() after await'],
        taskQueue: [],
        console: ['Before', 'Inside'],
        promise: { label: 'awaited promise', status: 'fulfilled', value: "'Data'" },
        focus: 'microtask',
      },
      {
        title: 'O script de fora continua',
        explanation:
          'A função async está suspensa, então quem chamou continua e loga After antes de a continuação do await rodar.',
        activeLine: 9,
        callStack: ['global script', "console.log('After')"],
        webApis: [],
        microtasks: ['resume run() after await'],
        taskQueue: [],
        console: ['Before', 'Inside', 'After'],
        promise: { label: 'run()', status: 'pending', value: '-' },
        focus: 'console',
      },
      {
        title: 'A continuação async é retomada',
        explanation: 'A microtask retoma run() de onde parou e atribui o valor resolvido.',
        activeLine: 4,
        callStack: ['run() continuation', "console.log('Data')"],
        webApis: [],
        microtasks: [],
        taskQueue: [],
        console: ['Before', 'Inside', 'After', 'Data'],
        promise: { label: 'run()', status: 'fulfilled', value: 'undefined' },
        focus: 'microtask',
      },
    ],
  },
  {
    id: 'rejection',
    title: 'Rejeições pulam para o catch',
    subtitle: 'o then é pulado, o catch trata o erro e o finally ainda roda',
    concept: 'Uma promise rejeitada pula os handlers de sucesso até um handler de rejeição capturá-la.',
    code: [
      "Promise.reject('Network failed')",
      "  .then(value => console.log('then', value))",
      "  .catch(error => console.log('catch', error))",
      "  .finally(() => console.log('cleanup'));",
      '',
      "console.log('Request started');",
    ],
    prediction: {
      question: 'Qual handler roda primeiro?',
      options: ['then', 'catch', 'finally'],
      answer: 'catch',
      explanation:
        'A promise já está rejeitada, então o handler de sucesso é pulado e o handler de rejeição entra na fila como microtask.',
    },
    steps: [
      {
        title: 'A promise rejeitada é criada',
        explanation: 'O Promise.reject devolve uma promise rejeitada com o motivo informado.',
        activeLine: 1,
        callStack: ['global script', "Promise.reject('Network failed')"],
        webApis: [],
        microtasks: ['catch handler'],
        taskQueue: [],
        console: [],
        promise: { label: 'request promise', status: 'rejected', value: "'Network failed'" },
        focus: 'promise',
      },
      {
        title: 'O log síncrono ainda roda',
        explanation: 'Os handlers vão para a fila. O script atual continua e loga Request started.',
        activeLine: 6,
        callStack: ['global script', "console.log('Request started')"],
        webApis: [],
        microtasks: ['catch handler'],
        taskQueue: [],
        console: ['Request started'],
        promise: { label: 'request promise', status: 'rejected', value: "'Network failed'" },
        focus: 'console',
      },
      {
        title: 'O catch trata a rejeição',
        explanation: 'O handler do then pulado não roda. O catch recebe o motivo da rejeição.',
        activeLine: 3,
        callStack: ['catch callback', "console.log('catch', error)"],
        webApis: [],
        microtasks: ['finally handler'],
        taskQueue: [],
        console: ['Request started', 'catch Network failed'],
        promise: { label: 'chain promise', status: 'fulfilled', value: 'undefined' },
        focus: 'microtask',
      },
      {
        title: 'O finally roda para fazer a limpeza',
        explanation: 'O finally roda depois que a cadeia termina, tenha ela resolvido ou rejeitado.',
        activeLine: 4,
        callStack: ['finally callback', "console.log('cleanup')"],
        webApis: [],
        microtasks: [],
        taskQueue: [],
        console: ['Request started', 'catch Network failed', 'cleanup'],
        promise: { label: 'chain promise', status: 'fulfilled', value: 'undefined' },
        focus: 'microtask',
      },
    ],
  },
  {
    id: 'promise-all',
    title: 'Combinadores de Promise',
    subtitle: 'O Promise.all espera todas as entradas ou rejeita na primeira falha',
    concept: 'Combinadores criam uma nova promise que acompanha várias promises ao mesmo tempo.',
    code: [
      'const user = fetchUser();',
      'const repos = fetchRepos();',
      'const billing = fetchBilling();',
      '',
      'Promise.all([user, repos, billing])',
      '  .then(([user, repos, billing]) => renderDashboard())',
      '  .catch(showError);',
    ],
    prediction: {
      question: 'Quando o Promise.all é fulfilled?',
      options: ['Depois que a primeira promise é fulfilled', 'Depois que todas as promises são fulfilled', 'Immediately'],
      answer: 'Depois que todas as promises são fulfilled',
      explanation:
        'O Promise.all preserva a ordem e só é fulfilled quando todas as entradas são. Uma única rejeição rejeita a promise combinada.',
    },
    steps: [
      {
        title: 'Três jobs assíncronos começam',
        explanation: 'Cada fetch devolve uma promise pending enquanto o runtime espera o I/O.',
        activeLine: 1,
        callStack: ['global script', 'fetchUser()', 'fetchRepos()', 'fetchBilling()'],
        webApis: ['network: user', 'network: repos', 'network: billing'],
        microtasks: [],
        taskQueue: [],
        console: [],
        promise: { label: 'Promise.all', status: 'pending', value: '-' },
        focus: 'webapi',
      },
      {
        title: 'A primeira promise resolve',
        explanation: 'O Promise.all guarda o resultado de user, mas ainda não pode ser fulfilled porque outras entradas estão pending.',
        activeLine: 5,
        callStack: [],
        webApis: ['network: repos', 'network: billing'],
        microtasks: ['guarda o resultado de user'],
        taskQueue: [],
        console: [],
        promise: { label: 'Promise.all', status: 'pending', value: '1 de 3 concluídas' },
        focus: 'promise',
      },
      {
        title: 'A segunda promise resolve',
        explanation: 'A promise combinada continua pending. O Promise.all espera todas as posições.',
        activeLine: 5,
        callStack: [],
        webApis: ['network: billing'],
        microtasks: ['guarda o resultado de repos'],
        taskQueue: [],
        console: [],
        promise: { label: 'Promise.all', status: 'pending', value: '2 de 3 concluídas' },
        focus: 'promise',
      },
      {
        title: 'Todas as entradas estão fulfilled',
        explanation:
          'Quando a última promise é fulfilled, o Promise.all enfileira o callback do then com o array de resultados em ordem.',
        activeLine: 6,
        callStack: [],
        webApis: [],
        microtasks: ['then: renderDashboard()'],
        taskQueue: [],
        console: [],
        promise: { label: 'Promise.all', status: 'fulfilled', value: '[user, repos, billing]' },
        focus: 'microtask',
      },
      {
        title: 'O dashboard é renderizado',
        explanation: 'O callback do then roda como microtask e recebe os três valores juntos.',
        activeLine: 6,
        callStack: ['then callback', 'renderDashboard()'],
        webApis: [],
        microtasks: [],
        taskQueue: [],
        console: ['Dashboard rendered'],
        promise: { label: 'Promise.all', status: 'fulfilled', value: '[user, repos, billing]' },
        focus: 'console',
      },
    ],
  },
];

const PANEL_TONES: Record<PanelTone, string> = {
  default: 'border-border bg-card',
  active: 'border-border bg-card',
  wait: 'border-border bg-card',
  success: 'border-border bg-card',
  danger: 'border-border bg-card',
};

const PHASES: Array<{
  id: StepFocus;
  label: string;
  description: string;
}> = [
  { id: 'stack', label: 'Stack', description: 'O código normal roda primeiro.' },
  { id: 'webapi', label: 'Runtime', description: 'Timers esperam fora do JS.' },
  { id: 'promise', label: 'Promise', description: 'O estado da Promise muda.' },
  { id: 'microtask', label: 'Microtask', description: 'Callbacks de Promise rodam em seguida.' },
  { id: 'task', label: 'Task', description: 'Timers rodam depois das microtasks.' },
  { id: 'console', label: 'Console', description: 'Os logs aparecem em ordem.' },
];

function getScenario(id: ScenarioId) {
  return SCENARIOS.find((scenario) => scenario.id === id) ?? SCENARIOS[0]!;
}

function statusTone(status: PromiseStatus): PanelTone {
  if (status === 'fulfilled') return 'success';
  if (status === 'rejected') return 'danger';
  if (status === 'pending') return 'wait';
  return 'default';
}

function statusLabel(status: PromiseStatus) {
  if (status === 'none') return 'não criada';
  return status;
}

export default function JavascriptPromisesAsyncSimulator() {
  const [scenarioId, setScenarioId] = useState<ScenarioId>('microtasks');
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1500);
  const [prediction, setPrediction] = useState<string | null>(null);

  const scenario = getScenario(scenarioId);
  const activeStepIndex = Math.min(stepIndex, scenario.steps.length - 1);
  const step = scenario.steps[activeStepIndex] ?? scenario.steps[0]!;
  const progress = ((activeStepIndex + 1) / scenario.steps.length) * 100;
  const isCorrect = prediction === scenario.prediction.answer;

  useEffect(() => {
    setStepIndex(0);
    setIsPlaying(false);
    setPrediction(null);
  }, [scenarioId]);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = window.setInterval(() => {
      setStepIndex((current) => {
        if (current >= scenario.steps.length - 1) {
          setIsPlaying(false);
          return current;
        }

        return current + 1;
      });
    }, speed);

    return () => window.clearInterval(timer);
  }, [isPlaying, scenario.steps.length, speed]);

  const selectScenario = (nextScenarioId: ScenarioId) => {
    setScenarioId(nextScenarioId);
    setStepIndex(0);
    setIsPlaying(false);
    setPrediction(null);
  };

  const goToStep = (nextStep: number) => {
    setIsPlaying(false);
    setStepIndex(Math.min(Math.max(nextStep, 0), scenario.steps.length - 1));
  };

  const reset = () => {
    setIsPlaying(false);
    setStepIndex(0);
    setPrediction(null);
  };

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/20 p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="rounded-md border border-primary/30 bg-primary/10 p-2 text-primary">
                <Braces className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-xs text-muted-foreground">// laboratório do event loop</p>
                <CardTitle className="text-xl md:text-2xl">
                  Simulador de Promises e async/await em JavaScript
                </CardTitle>
              </div>
            </div>
            <Badge variant="secondary" className="shrink-0">
              passo {activeStepIndex + 1}/{scenario.steps.length}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 p-3 sm:p-4">
          <WorkbenchToolbar
            scenario={scenario}
            activeStepIndex={activeStepIndex}
            stepCount={scenario.steps.length}
            isPlaying={isPlaying}
            progress={progress}
            speed={speed}
            onScenarioSelect={selectScenario}
            onPrevious={() => goToStep(activeStepIndex - 1)}
            onNext={() => goToStep(activeStepIndex + 1)}
            onTogglePlay={() => setIsPlaying((playing) => !playing)}
            onReset={reset}
            onSpeedChange={setSpeed}
          />

          <div className="rounded-md border border-primary/25 bg-primary/5 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Workflow className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">{step.title}</p>
              <Badge variant="secondary" className="ml-auto capitalize">
                {phaseLabel(step.focus)}
              </Badge>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.explanation}</p>
          </div>

          <div className="grid gap-3 xl:grid-cols-[300px_minmax(0,1fr)_300px]">
            <div className="order-2 space-y-3 xl:order-1">
              <CodePanel code={scenario.code} activeLine={step.activeLine} compact />
              <MentalModelPanel scenarioId={scenario.id} />
            </div>

            <div className="order-1 xl:order-2">
              <EventLoopBoard step={step} />
            </div>

            <div className="order-3 grid gap-3 lg:grid-cols-2 xl:grid-cols-1">
              <ConsolePanel items={step.console} />
              <PredictionCard
                prediction={scenario.prediction}
                selected={prediction}
                isCorrect={isCorrect}
                onSelect={setPrediction}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function WorkbenchToolbar({
  scenario,
  activeStepIndex,
  stepCount,
  isPlaying,
  progress,
  speed,
  onScenarioSelect,
  onPrevious,
  onNext,
  onTogglePlay,
  onReset,
  onSpeedChange,
}: {
  scenario: Scenario;
  activeStepIndex: number;
  stepCount: number;
  isPlaying: boolean;
  progress: number;
  speed: number;
  onScenarioSelect: (scenarioId: ScenarioId) => void;
  onPrevious: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
  onReset: () => void;
  onSpeedChange: (value: number) => void;
}) {
  return (
    <div className="rounded-md border bg-background/80 p-3">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {SCENARIOS.map((candidate) => {
            const active = candidate.id === scenario.id;

            return (
              <button
                key={candidate.id}
                type="button"
                onClick={() => onScenarioSelect(candidate.id)}
                className={cn(
                  'min-w-[170px] rounded-md border px-3 py-2 text-left transition-colors xl:min-w-[190px]',
                  active ? 'border-primary/60 bg-primary/10' : 'border-border hover:bg-muted/30'
                )}
              >
                <span className="block text-sm font-semibold">{candidate.title}</span>
                <span className="mt-1 block text-xs leading-snug text-muted-foreground">{candidate.subtitle}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          <Button type="button" variant="outline" size="icon" onClick={onPrevious} disabled={activeStepIndex === 0}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            className="min-w-[108px]"
            onClick={onTogglePlay}
            disabled={activeStepIndex === stepCount - 1 && !isPlaying}
          >
            {isPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
            {isPlaying ? 'Pausar' : 'Reproduzir'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onNext}
            disabled={activeStepIndex === stepCount - 1}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="icon" onClick={onReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <FastForward className="h-4 w-4" />
            <select
              value={speed}
              onChange={(event) => onSpeedChange(Number(event.target.value))}
              className="h-9 rounded-md border bg-background px-2 text-sm text-foreground"
            >
              <option value={1500}>Lento</option>
              <option value={1100}>Normal</option>
              <option value={650}>Rápido</option>
            </select>
          </label>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Progress value={progress} className="flex-1" />
        <Badge variant="secondary" className="shrink-0">
          {activeStepIndex + 1}/{stepCount}
        </Badge>
      </div>
    </div>
  );
}

function CodePanel({ code, activeLine, compact = false }: { code: string[]; activeLine: number; compact?: boolean }) {
  return (
    <div className="overflow-hidden rounded-md border bg-[#09090b]">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
        <span className="font-mono text-xs text-slate-400">async-lab.js</span>
      </div>
      <div
        className={cn(
          'overflow-x-auto font-mono text-slate-200',
          compact ? 'max-h-[320px] p-3 text-xs leading-6' : 'p-4 text-sm leading-7'
        )}
      >
        {code.map((line, index) => {
          const lineNumber = index + 1;
          const active = lineNumber === activeLine;

          return (
            <div
              key={`${lineNumber}-${line}`}
              className={cn(
                'grid grid-cols-[2.25rem_minmax(0,1fr)] rounded px-2',
                active && 'bg-primary/20 text-primary'
              )}
            >
              <span className="select-none pr-3 text-right text-slate-500">{lineNumber}</span>
              <span className="whitespace-pre">{line || ' '}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EventLoopBoard({ step }: { step: StepState }) {
  return (
    <div className="space-y-3 rounded-md border bg-muted/10 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Estado do runtime</p>
          <p className="text-xs text-muted-foreground">
            Leia primeiro a trilha de fases e depois veja nas caixas abaixo o que mudou.
          </p>
        </div>
        <Badge variant="default" className="capitalize">
          {phaseLabel(step.focus)}
        </Badge>
      </div>

      <PhaseRail focus={step.focus} />

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
        <RuntimePanel
          title="Call Stack"
          icon={<Braces className="h-4 w-4" />}
          items={step.callStack}
          empty="stack vazia"
          tone="default"
          size="large"
        />

        <div className="grid gap-3">
          <RuntimePanel
            title="Runtime APIs"
            icon={<Clock3 className="h-4 w-4" />}
            items={step.webApis}
            empty="nenhum trabalho externo"
            tone="default"
            size="compact"
          />
          <RuntimePanel
            title="Inspetor de Promise"
            icon={<Workflow className="h-4 w-4" />}
            items={[`${step.promise.label}: ${statusLabel(step.promise.status)}`, `value: ${step.promise.value}`]}
            empty="não criada"
            tone={statusTone(step.promise.status)}
            size="compact"
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <RuntimePanel
          title="Fila de microtasks"
          icon={<Sparkles className="h-4 w-4" />}
          items={step.microtasks}
          empty="nenhum trabalho de promise na fila"
          tone="default"
          size="compact"
        />
        <RuntimePanel
          title="Fila de tasks"
          icon={<Timer className="h-4 w-4" />}
          items={step.taskQueue}
          empty="nenhuma task de timer ou evento"
          tone="default"
          size="compact"
        />
      </div>
    </div>
  );
}

function phaseLabel(focus: StepFocus) {
  if (focus === 'webapi') return 'runtime';
  if (focus === 'microtask') return 'microtask';
  if (focus === 'task') return 'task';
  if (focus === 'promise') return 'promise';
  if (focus === 'console') return 'output';
  return 'stack';
}

function PhaseRail({ focus }: { focus: StepFocus }) {
  const currentPhase = PHASES.find((phase) => phase.id === focus) ?? PHASES[0]!;

  return (
    <div className="rounded-md border bg-background/70 p-2">
      <div className="mb-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
        <span className="font-semibold text-primary">Você está aqui:</span>{' '}
        <span className="font-medium">{currentPhase.label}</span>
        <span className="text-muted-foreground"> - {currentPhase.description}</span>
      </div>
      <div className="grid gap-2 md:grid-cols-3">
        {PHASES.map((phase, index) => {
          const active = phase.id === focus || (focus === 'code' && phase.id === 'stack');

          return (
            <div
              key={phase.id}
              className={cn(
                'rounded-md border p-2 transition-colors',
                active ? 'border-primary/60 bg-primary/10' : 'border-border bg-muted/20'
              )}
            >
              <div className="mb-1 flex min-w-0 items-center gap-1.5">
                <span
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[9px] font-semibold',
                    active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background'
                  )}
                >
                  {index + 1}
                </span>
                <span className={cn('min-w-0 whitespace-nowrap text-xs font-semibold leading-tight', active && 'text-primary')}>
                  {phase.label}
                </span>
              </div>
              <p className="text-[11px] leading-snug text-muted-foreground">{phase.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RuntimePanel({
  title,
  icon,
  items,
  empty,
  tone,
  size = 'normal',
}: {
  title: string;
  icon: ReactNode;
  items: string[];
  empty: string;
  tone: PanelTone;
  size?: 'compact' | 'normal' | 'large';
}) {
  return (
    <div
      className={cn(
        'rounded-md border p-3 transition-colors',
        size === 'large' ? 'min-h-[112px]' : size === 'compact' ? 'min-h-[88px]' : 'min-h-[104px]',
        PANEL_TONES[tone]
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          {icon}
          {title}
        </div>
        <Badge variant="secondary">{items.length}</Badge>
      </div>
      <div className="space-y-2">
        {items.length ? (
          items.map((item, index) => (
            <div
              key={`${item}-${index}`}
              className="overflow-hidden rounded-md border bg-background/80 px-2.5 py-1.5 font-mono text-xs leading-relaxed shadow-sm"
            >
              <span className="break-words">{item}</span>
            </div>
          ))
        ) : (
          <div className="rounded-md border border-dashed bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            {empty}
          </div>
        )}
      </div>
    </div>
  );
}

function ConsolePanel({ items }: { items: string[] }) {
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Code2 className="h-4 w-4" />
          Console
        </div>
        <Badge variant="secondary">{items.length}</Badge>
      </div>
      <div className="space-y-2">
        {items.length ? (
          items.map((item, index) => (
            <div key={`${item}-${index}`} className="rounded-md border bg-background/80 px-3 py-2 font-mono text-xs">
              {index + 1}. {item}
            </div>
          ))
        ) : (
          <div className="rounded-md border border-dashed bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            nada logado ainda
          </div>
        )}
      </div>
    </div>
  );
}

function MentalModelPanel({ scenarioId }: { scenarioId: ScenarioId }) {
  return (
    <div className="rounded-md border bg-muted/10 p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <Timer className="h-4 w-4" />
        Modelo mental
      </div>
      <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 xl:grid-cols-1">
        <ModelRule number="1" text="Primeiro roda a stack." />
        <ModelRule number="2" text="Esvazia as microtasks antes das tasks." />
        <ModelRule number="3" text="Timers e I/O esperam como tasks." />
        <ModelRule number="4" text="O await é retomado como microtask." active={scenarioId === 'async-await'} />
      </div>
    </div>
  );
}

function PredictionCard({
  prediction,
  selected,
  isCorrect,
  onSelect,
}: {
  prediction: Prediction;
  selected: string | null;
  isCorrect: boolean;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="mb-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <CheckCircle2 className="h-5 w-5" />
          Faça sua previsão
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">{prediction.question}</p>
        <div className="space-y-2">
          {prediction.options.map((option) => {
            const chosen = selected === option;
            const correct = selected && option === prediction.answer;

            return (
              <button
                key={option}
                type="button"
                onClick={() => onSelect(option)}
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm transition-colors',
                  chosen ? 'border-primary/60 bg-primary/10' : 'hover:bg-muted/30',
                  correct && 'border-emerald-500/50 bg-emerald-500/10'
                )}
              >
                <span className="min-w-0 flex-1 break-words">{option}</span>
                {chosen &&
                  (isCorrect ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                  ))}
              </button>
            );
          })}
        </div>
        {selected && (
          <div
            className={cn(
              'rounded-md border p-3 text-sm',
              isCorrect ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-amber-500/30 bg-amber-500/10'
            )}
          >
            <p className="font-medium">{isCorrect ? 'Correto' : `Quase. Resposta: ${prediction.answer}`}</p>
            <p className="mt-1 text-muted-foreground">{prediction.explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ModelRule({ number, text, active = false }: { number: string; text: string; active?: boolean }) {
  return (
    <div className={cn('flex gap-2 rounded-md border p-2', active ? 'border-primary/50 bg-primary/10' : 'bg-muted/20')}>
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
        {number}
      </span>
      <span className="leading-snug">{text}</span>
    </div>
  );
}
