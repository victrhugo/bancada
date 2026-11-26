'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowUpDown,
  BarChart3,
  BookOpen,
  CheckCircle,
  Circle,
  Columns3,
  Combine,
  Database,
  Filter,
  Group,
  Layers,
  Leaf,
  Lightbulb,
  Pencil,
  Play,
  RotateCcw,
  Sigma,
  Table,
  Target,
  Terminal,
  Trophy,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  useTerminalSimulator,
  type ExecuteResult,
  type TerminalLine,
} from '@/hooks/use-terminal-simulator';
import {
  COLLECTIONS,
  formatResult,
  normalizeMongo,
  resultsMatch,
  runMongo,
} from '@/lib/games/mongo-sim-engine';

interface Lesson {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  commands: LessonCommand[];
}

interface LessonCommand {
  instruction: string;
  hint: string;
  expectedCommand: string | string[];
  explanation: string;
}

const LESSONS: Lesson[] = [
  {
    id: 'find',
    title: 'Básico do find()',
    description: 'Leia documentos de uma collection',
    icon: <Table className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Retorne todos os documentos da collection customers.',
        hint: 'Use "db.customers.find()".',
        expectedCommand: 'db.customers.find()',
        explanation:
          'O find() sem filtro retorna todos os documentos da collection, como um SELECT * no SQL.',
      },
      {
        instruction: 'Retorne só os clientes dos EUA (USA).',
        hint: 'Passe um documento de filtro: db.customers.find({ country: "USA" }).',
        expectedCommand: 'db.customers.find({ country: "USA" })',
        explanation:
          'O primeiro argumento do find() é um documento de filtro. { country: "USA" } mantém os documentos em que o campo country é igual a "USA".',
      },
    ],
  },
  {
    id: 'projection',
    title: 'Projeções',
    description: 'Retorne só os campos que você precisa',
    icon: <Columns3 className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Retorne o name e o country de todos os clientes, sem o campo _id.',
        hint: 'O segundo argumento do find() é uma projeção: db.customers.find({}, { name: 1, country: 1, _id: 0 }).',
        expectedCommand: 'db.customers.find({}, { name: 1, country: 1, _id: 0 })',
        explanation:
          'O segundo argumento do find() é uma projeção. 1 inclui um campo, 0 exclui. O _id vem por padrão, a menos que você coloque 0.',
      },
    ],
  },
  {
    id: 'operators',
    title: 'Operadores de consulta',
    description: 'Compare com $lt, $gt, $gte e $lte',
    icon: <Filter className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Retorne os produtos que custam menos de 50.',
        hint: 'Use um operador de comparação: db.products.find({ price: { $lt: 50 } }).',
        expectedCommand: 'db.products.find({ price: { $lt: 50 } })',
        explanation:
          'Operadores como $lt (menor que), $gt, $gte e $lte vão num documento aninhado do campo: { price: { $lt: 50 } }.',
      },
    ],
  },
  {
    id: 'sort-limit',
    title: 'Ordenar e limitar',
    description: 'Ordene os documentos e limite o resultado',
    icon: <ArrowUpDown className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Retorne os cinco produtos mais caros.',
        hint: 'Encadeie métodos do cursor: db.products.find().sort({ price: -1 }).limit(5).',
        expectedCommand: 'db.products.find().sort({ price: -1 }).limit(5)',
        explanation:
          'sort({ price: -1 }) ordena do maior para o menor (1 é crescente). limit(5) limita o cursor a cinco documentos. Os métodos do cursor são encadeados no find().',
      },
    ],
  },
  {
    id: 'skip',
    title: 'Paginação com skip',
    description: 'Retorne a próxima página de resultados',
    icon: <Layers className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Retorne a segunda página de cinco produtos, ordenados do maior preço para o menor.',
        hint: 'Combine skip e limit: db.products.find().sort({ price: -1 }).skip(5).limit(5).',
        expectedCommand: 'db.products.find().sort({ price: -1 }).skip(5).limit(5)',
        explanation:
          'skip(5) pula os cinco primeiros documentos; limit(5) devolve os cinco seguintes. É paginação por offset num cursor.',
      },
    ],
  },
  {
    id: 'in',
    title: 'Casando um conjunto com $in',
    description: 'Case qualquer valor de uma lista',
    icon: <Combine className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Retorne os pedidos com status shipped ou pending.',
        hint: 'Use $in com um array: db.orders.find({ status: { $in: ["shipped", "pending"] } }).',
        expectedCommand: 'db.orders.find({ status: { $in: ["shipped", "pending"] } })',
        explanation:
          'O $in casa quando o campo é igual a qualquer valor do array. É o jeito de escrever o IN (...) do SQL em documentos.',
      },
    ],
  },
  {
    id: 'count',
    title: 'Contando documentos',
    description: 'Conte os resultados sem trazê-los',
    icon: <Sigma className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Conte quantos pedidos foram entregues (delivered).',
        hint: 'Use countDocuments com um filtro: db.orders.countDocuments({ status: "delivered" }).',
        expectedCommand: 'db.orders.countDocuments({ status: "delivered" })',
        explanation:
          'O countDocuments(filter) devolve o número de documentos que casam, então você tem a contagem sem trazer os documentos.',
      },
    ],
  },
  {
    id: 'write',
    title: 'insert, update, delete',
    description: 'Grave documentos e leia o resultado',
    icon: <Pencil className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Insira um novo cliente com _id 9, name Ivy Chen e country USA.',
        hint: 'Use insertOne: db.customers.insertOne({ _id: 9, name: "Ivy Chen", country: "USA" }).',
        expectedCommand: 'db.customers.insertOne({ _id: 9, name: "Ivy Chen", country: "USA" })',
        explanation:
          'O insertOne adiciona um documento e devolve { acknowledged: true, insertedId }. Esta demo não salva a mudança, então os dados continuam iguais para as outras lições.',
      },
      {
        instruction: 'Mude o price do produto com _id 1 para 54.99.',
        hint: 'Use updateOne com $set: db.products.updateOne({ _id: 1 }, { $set: { price: 54.99 } }).',
        expectedCommand: 'db.products.updateOne({ _id: 1 }, { $set: { price: 54.99 } })',
        explanation:
          'O updateOne(filter, update) altera o primeiro documento que casa. O $set atribui campos. O resultado traz matchedCount e modifiedCount.',
      },
      {
        instruction: 'Apague todos os pedidos cancelados (cancelled).',
        hint: 'Use deleteMany: db.orders.deleteMany({ status: "cancelled" }).',
        expectedCommand: 'db.orders.deleteMany({ status: "cancelled" })',
        explanation:
          'O deleteMany remove todos os documentos que casam e devolve { deletedCount }. Aqui, dois pedidos estão cancelados, então deletedCount é 2. Nada é salvo.',
      },
    ],
  },
  {
    id: 'aggregate-group',
    title: 'Agregação: $group',
    description: 'Resuma documentos em grupos',
    icon: <Group className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Conte os pedidos por status, do mais comum para o menos comum.',
        hint: 'Encadeie $group e $sort: db.orders.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }, { $sort: { count: -1 } }]).',
        expectedCommand:
          'db.orders.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }, { $sort: { count: -1 } }])',
        explanation:
          'O aggregate() roda um array de estágios. O $group agrupa por _id (aqui, o campo $status) e { $sum: 1 } conta os documentos de cada grupo. Depois o $sort ordena os grupos.',
      },
    ],
  },
  {
    id: 'aggregate-match',
    title: 'Agregação: $match + $group',
    description: 'Filtre, depois agrupe e tire a média',
    icon: <BarChart3 className="h-5 w-5" />,
    commands: [
      {
        instruction:
          'Para os produtos com preço de 20 ou mais, mostre cada categoria com a quantidade de produtos e o preço médio, da maior média para a menor.',
        hint: 'Encadeie $match, $group e $sort no pipeline.',
        expectedCommand:
          'db.products.aggregate([{ $match: { price: { $gte: 20 } } }, { $group: { _id: "$category", n: { $sum: 1 }, avgPrice: { $avg: "$price" } } }, { $sort: { avgPrice: -1 } }])',
        explanation:
          'O $match filtra os documentos antes de agrupar (como o WHERE do SQL). Depois o $group calcula { $sum: 1 } e { $avg: "$price" } por categoria, e o $sort ordena o resultado pela média.',
      },
    ],
  },
];

const TOTAL_DOCS = COLLECTIONS.reduce((sum, collection) => sum + collection.count, 0);

const HELP_TEXT = `Comandos disponíveis:
  db.<collection>.find(filter, projection)   consulta documentos
  ...find().sort({...}).skip(n).limit(n)      molda o cursor
  db.<collection>.countDocuments(filter)      conta resultados
  db.<collection>.insertOne / updateOne / deleteMany
  db.<collection>.aggregate([ ...stages ])    roda um pipeline
  show collections                            lista as collections
  help                                        mostra esta mensagem
  clear                                       limpa o terminal

Experimente:
  db.customers.find({ country: "USA" })
  db.products.find().sort({ price: -1 }).limit(5)
  db.orders.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])`;

const COLLECTIONS_TEXT = COLLECTIONS.map((collection) => collection.name).join('\n');

function outputFor(input: string): ExecuteResult {
  const result = runMongo(input);
  if (result.kind === 'error') return { output: `Error: ${result.error}`, type: 'error' };
  if (result.kind === 'docs' && result.docs.length === 0) {
    return { output: '(nenhum documento encontrado)' };
  }
  return { output: formatResult(result) };
}

function executeCommand(rawInput: string): ExecuteResult {
  const input = rawInput.trim();
  const bare = input.replace(/;+\s*$/, '').trim().toLowerCase();

  if (bare === 'clear') return { output: '', clear: true };
  if (bare === 'help' || bare === '\\h' || bare === '\\?') return { output: HELP_TEXT };
  if (bare === 'show collections' || bare === 'show tables' || bare === 'db.getcollectionnames()') {
    return { output: COLLECTIONS_TEXT };
  }
  return outputFor(input);
}

function commandMatches(cmd: string, expected: string | string[]): boolean {
  const normalized = normalizeMongo(cmd);
  if (Array.isArray(expected)) {
    return expected.some((item) => normalizeMongo(item) === normalized);
  }
  return normalizeMongo(expected) === normalized;
}

interface Challenge {
  id: string;
  question: string;
  solution: string;
}

const CHALLENGES: Challenge[] = [
  {
    id: 'uk-customers',
    question: 'Retorne os nomes de todos os clientes do Reino Unido (UK), sem _id, em ordem alfabética.',
    solution: 'db.customers.find({ country: "UK" }, { name: 1, _id: 0 }).sort({ name: 1 })',
  },
  {
    id: 'top-3-expensive',
    question: 'Retorne os 3 produtos mais caros (name e price, sem _id), do mais caro para o mais barato.',
    solution: 'db.products.find({}, { name: 1, price: 1, _id: 0 }).sort({ price: -1 }).limit(3)',
  },
  {
    id: 'delivered-count',
    question: 'Quantos pedidos têm o status "delivered"?',
    solution: 'db.orders.countDocuments({ status: "delivered" })',
  },
  {
    id: 'cheap-products',
    question: 'Retorne os produtos abaixo de 20 (name e price, sem _id), do mais barato para o mais caro.',
    solution: 'db.products.find({ price: { $lt: 20 } }, { name: 1, price: 1, _id: 0 }).sort({ price: 1 })',
  },
  {
    id: 'products-per-category',
    question: 'Quantos produtos há em cada categoria? Da maior quantidade para a menor.',
    solution:
      'db.products.aggregate([{ $group: { _id: "$category", n: { $sum: 1 } } }, { $sort: { n: -1 } }])',
  },
  {
    id: 'cheapest-product',
    question: 'Retorne o produto mais barato (name e price, sem _id).',
    solution: 'db.products.find({}, { name: 1, price: 1, _id: 0 }).sort({ price: 1 }).limit(1)',
  },
];

function gradeChallenge(
  input: string,
  challenge: Challenge,
): { lines: TerminalLine[]; solved: boolean } {
  const now = () => new Date();
  const lines: TerminalLine[] = [{ type: 'input', content: input, timestamp: now() }];

  const userResult = runMongo(input);
  if (userResult.kind === 'error') {
    lines.push({ type: 'error', content: `Error: ${userResult.error}`, timestamp: now() });
    lines.push({
      type: 'error',
      content: 'Quase: esse comando não rodou. Corrija e tente de novo.',
      timestamp: now(),
    });
    return { lines, solved: false };
  }

  const output = formatResult(userResult);
  lines.push({
    type: 'output',
    content: userResult.kind === 'docs' && userResult.docs.length === 0 ? '(nenhum documento encontrado)' : output,
    timestamp: now(),
  });

  const reference = runMongo(challenge.solution);
  if (resultsMatch(userResult, reference)) {
    lines.push({
      type: 'success',
      content: 'Correto! Seu resultado bate com a solução de referência.',
      timestamp: now(),
    });
    return { lines, solved: true };
  }

  lines.push({
    type: 'error',
    content: 'Quase: seu resultado não bate com a saída esperada. Confira os campos, o filtro e a ordem.',
    timestamp: now(),
  });
  return { lines, solved: false };
}

export default function MongodbTerminalSimulator() {
  const {
    currentLessonIndex,
    currentCommandIndex,
    currentLesson,
    currentCommand,
    completedCommands,
    completedCount,
    totalCommands,
    progressPercentage,
    terminalHistory,
    inputValue,
    setInputValue,
    showHint,
    setShowHint,
    inputRef,
    terminalRef,
    submitCommand,
    handleSubmit,
    handleKeyDown,
    resetProgress,
    jumpToLesson,
  } = useTerminalSimulator({
    lessons: LESSONS,
    execute: executeCommand,
    matches: (cmd, command) => commandMatches(cmd, command.expectedCommand),
    successMessage: (command) => `✓ ${command.explanation}`,
    completionKeyStyle: 'index',
    advanceDelayMs: 700,
    historyStyle: 'recent-first',
    promoteOutputType: true,
    guardRepeatCompletion: true,
  });

  const resetLab = useCallback(() => {
    resetProgress();
    inputRef.current?.focus();
  }, [inputRef, resetProgress]);

  const runCurrentCommand = useCallback(() => {
    if (!currentCommand) return;
    const command = Array.isArray(currentCommand.expectedCommand)
      ? currentCommand.expectedCommand[0]
      : currentCommand.expectedCommand;
    submitCommand(command);
  }, [currentCommand, submitCommand]);

  // --- Challenge mode state -------------------------------------------------
  const [mode, setMode] = useState<'lessons' | 'challenges'>('lessons');
  const [activeChallenge, setActiveChallenge] = useState(0);
  const [challengeInput, setChallengeInput] = useState('');
  const [challengeHistory, setChallengeHistory] = useState<TerminalLine[]>([]);
  const [solvedChallenges, setSolvedChallenges] = useState<Set<number>>(new Set());
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const challengeInputRef = useRef<HTMLInputElement>(null);
  const challengeTerminalRef = useRef<HTMLDivElement>(null);
  const solvedCount = solvedChallenges.size;

  useEffect(() => {
    if (challengeTerminalRef.current) {
      challengeTerminalRef.current.scrollTop = challengeTerminalRef.current.scrollHeight;
    }
  }, [challengeHistory]);

  const submitChallenge = useCallback(
    (raw: string) => {
      const input = raw.trim();
      if (!input) return;
      setChallengeInput('');
      const bare = input.replace(/;+\s*$/, '').trim().toLowerCase();
      const now = () => new Date();

      if (bare === 'clear') {
        setChallengeHistory([]);
        return;
      }
      if (bare === 'help' || bare === '\\h' || bare === '\\?') {
        setChallengeHistory((prev) => [
          ...prev,
          { type: 'input', content: input, timestamp: now() },
          { type: 'output', content: HELP_TEXT, timestamp: now() },
        ]);
        return;
      }
      if (bare === 'show collections' || bare === 'show tables') {
        setChallengeHistory((prev) => [
          ...prev,
          { type: 'input', content: input, timestamp: now() },
          { type: 'output', content: COLLECTIONS_TEXT, timestamp: now() },
        ]);
        return;
      }

      const { lines, solved } = gradeChallenge(input, CHALLENGES[activeChallenge]);
      setChallengeHistory((prev) => [...prev, ...lines]);
      if (solved) {
        setSolvedChallenges((prev) => new Set(prev).add(activeChallenge));
        setRevealed((prev) => new Set(prev).add(activeChallenge));
      }
    },
    [activeChallenge],
  );

  const handleChallengeSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      submitChallenge(challengeInput);
    },
    [challengeInput, submitChallenge],
  );

  const selectChallenge = useCallback((index: number) => {
    setActiveChallenge(index);
    challengeInputRef.current?.focus();
  }, []);

  const revealSolution = useCallback(() => {
    setRevealed((prev) => new Set(prev).add(activeChallenge));
  }, [activeChallenge]);

  const resetChallenges = useCallback(() => {
    setActiveChallenge(0);
    setChallengeInput('');
    setChallengeHistory([]);
    setSolvedChallenges(new Set());
    setRevealed(new Set());
    challengeInputRef.current?.focus();
  }, []);

  const switchMode = useCallback(
    (next: 'lessons' | 'challenges') => {
      setMode(next);
      if (next === 'challenges') {
        window.setTimeout(() => challengeInputRef.current?.focus(), 0);
      } else {
        window.setTimeout(() => inputRef.current?.focus(), 0);
      }
    },
    [inputRef],
  );

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-md border bg-muted/20 p-4">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <div className="rounded-md border border-primary/30 bg-primary/10 p-2 text-primary">
              <Leaf className="h-6 w-6" />
            </div>
            <div>
              <p className="font-mono text-xs text-muted-foreground">// playground do shell do MongoDB</p>
              <h2 className="text-2xl font-bold md:text-3xl">Simulador de terminal MongoDB</h2>
            </div>
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Pratique queries de MongoDB num pequeno conjunto de dados de e-commerce, num terminal seguro no navegador.
            Todo comando roda ao vivo: filtre e projete com find(), molde o cursor com sort, skip
            e limit, grave com insertOne, updateOne e deleteMany e resuma com o pipeline de
            agregação. Os dados são os mesmos do simulador de SQL, então você vê os mesmos registros
            como documentos.
          </p>
          <div className="mt-4 inline-flex rounded-md border bg-background p-1">
            <button
              type="button"
              onClick={() => switchMode('lessons')}
              className={cn(
                'flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors',
                mode === 'lessons'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <BookOpen className="h-4 w-4" />
              Lições
            </button>
            <button
              type="button"
              onClick={() => switchMode('challenges')}
              className={cn(
                'flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors',
                mode === 'challenges'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Target className="h-4 w-4" />
              Desafio
            </button>
          </div>
        </div>

        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {mode === 'lessons' ? 'Progresso' : 'Desafios resolvidos'}
              </span>
              <span className="text-sm text-muted-foreground">
                {mode === 'lessons'
                  ? `${completedCount}/${totalCommands}`
                  : `${solvedCount}/${CHALLENGES.length}`}
              </span>
            </div>
            <Progress
              value={mode === 'lessons' ? progressPercentage : (solvedCount / CHALLENGES.length) * 100}
            />
            <div className="grid grid-cols-3 gap-2 text-center">
              <Metric label="Collections" value={COLLECTIONS.length} />
              <Metric label="Documents" value={TOTAL_DOCS} />
              {mode === 'lessons' ? (
                <Metric label="Lessons" value={LESSONS.length} />
              ) : (
                <Metric label="Challenges" value={CHALLENGES.length} />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_320px]">
        {mode === 'lessons' ? (
          <>
            <div className="space-y-4">
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BookOpen className="h-5 w-5" />
                    Lições
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 p-4 pt-0">
                  {LESSONS.map((lesson, lessonIndex) => {
                    const lessonCompleted = lesson.commands.every((_, commandIndex) =>
                      completedCommands.has(`${lessonIndex}-${commandIndex}`),
                    );
                    const active = lessonIndex === currentLessonIndex;

                    return (
                      <button
                        key={lesson.id}
                        type="button"
                        onClick={() => {
                          jumpToLesson(lessonIndex);
                          inputRef.current?.focus();
                        }}
                        className={cn(
                          'w-full rounded-md border p-2.5 text-left transition-colors',
                          active
                            ? 'border-primary/60 bg-primary/10'
                            : 'border-border hover:border-primary/40 hover:bg-muted/30',
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              'rounded-md border p-1.5',
                              active ? 'text-primary' : 'text-muted-foreground',
                            )}
                          >
                            {lesson.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium">{lesson.title}</p>
                              {lessonCompleted && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">{lesson.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>

              <Button size="sm" variant="outline" onClick={resetLab} className="w-full">
                <RotateCcw className="mr-1 h-4 w-4" />
                Reiniciar laboratório
              </Button>
            </div>

            <div className="space-y-4">
              <Card className="border-primary/40">
                <CardContent className="space-y-2.5 p-3.5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">
                          Lição {currentLessonIndex + 1} / {LESSONS.length}
                        </Badge>
                        <Badge>
                          Passo {currentCommandIndex + 1} / {currentLesson.commands.length}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium sm:text-base">{currentCommand?.instruction}</p>
                      {showHint && currentCommand && (
                        <p className="mt-2 rounded-md border border-primary/30 bg-primary/10 p-2 text-sm text-muted-foreground">
                          {currentCommand.hint}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button size="sm" variant="outline" onClick={() => setShowHint((value) => !value)}>
                        <Lightbulb className="mr-1 h-4 w-4" />
                        Dica
                      </Button>
                      <Button size="sm" onClick={runCurrentCommand}>
                        <Play className="mr-1 h-4 w-4" />
                        Executar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-border bg-[#171717]">
                <CardHeader className="border-b border-border/60 bg-[#262626] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="h-3 w-3 rounded-full bg-red-500" />
                        <div className="h-3 w-3 rounded-full bg-yellow-500" />
                        <div className="h-3 w-3 rounded-full bg-green-500" />
                      </div>
                      <span className="ml-2 text-sm text-muted-foreground">mongosh</span>
                    </div>
                    <Badge variant="secondary" className="font-mono text-[11px]">
                      devops&gt;
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div
                    ref={terminalRef}
                    className="h-[580px] cursor-text overflow-auto p-5 font-mono text-sm leading-relaxed sm:text-[15px]"
                    onClick={() => inputRef.current?.focus()}
                  >
                    {terminalHistory.length === 0 && (
                      <div className="mb-4 text-emerald-400">
                        <p>Boas-vindas ao playground do shell do MongoDB.</p>
                        <p className="mt-2 text-muted-foreground">
                          Digite &quot;help&quot;, rode &quot;show collections&quot; ou siga a
                          tarefa atual acima.
                        </p>
                      </div>
                    )}
                    {terminalHistory.map((line, index) => (
                      <div
                        key={`${line.timestamp.getTime()}-${index}`}
                        className={cn(
                          'mb-2',
                          line.type === 'output' ? 'whitespace-pre' : 'whitespace-pre-wrap break-words',
                          line.type === 'input' && 'text-slate-100',
                          line.type === 'output' && 'text-slate-300',
                          line.type === 'error' && 'text-red-400',
                          line.type === 'success' &&
                            'whitespace-pre-wrap rounded-md border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-300',
                        )}
                      >
                        {line.type === 'input' && <span className="text-emerald-400">devops&gt; </span>}
                        {line.content}
                      </div>
                    ))}
                    <form onSubmit={handleSubmit} className="flex items-center">
                      <span className="whitespace-nowrap text-emerald-400">devops&gt;</span>
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(event) => setInputValue(event.target.value)}
                        onKeyDown={handleKeyDown}
                        className="ml-2 min-w-0 flex-1 bg-transparent text-slate-100 caret-emerald-400 outline-none"
                        spellCheck={false}
                        autoComplete="off"
                        autoCapitalize="off"
                        placeholder="db.customers.find()"
                      />
                    </form>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-4">
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="h-5 w-5" />
                    Desafios
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 p-4 pt-0">
                  {CHALLENGES.map((challenge, index) => {
                    const solved = solvedChallenges.has(index);
                    const active = index === activeChallenge;

                    return (
                      <button
                        key={challenge.id}
                        type="button"
                        onClick={() => selectChallenge(index)}
                        className={cn(
                          'w-full rounded-md border p-2.5 text-left transition-colors',
                          active
                            ? 'border-primary/60 bg-primary/10'
                            : 'border-border hover:border-primary/40 hover:bg-muted/30',
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              'mt-0.5 shrink-0',
                              solved ? 'text-emerald-500' : active ? 'text-primary' : 'text-muted-foreground',
                            )}
                          >
                            {solved ? <CheckCircle className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-muted-foreground">
                              Desafio {index + 1}
                            </p>
                            <p className="mt-0.5 text-sm">{challenge.question}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>

              <Button size="sm" variant="outline" onClick={resetChallenges} className="w-full">
                <RotateCcw className="mr-1 h-4 w-4" />
                Reiniciar desafios
              </Button>
            </div>

            <div className="space-y-4">
              <Card className="border-primary/40">
                <CardContent className="space-y-2.5 p-3.5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">
                          Desafio {activeChallenge + 1} / {CHALLENGES.length}
                        </Badge>
                        {solvedChallenges.has(activeChallenge) && (
                          <Badge className="gap-1 bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/15">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Resolvido
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium sm:text-base">
                        {CHALLENGES[activeChallenge].question}
                      </p>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        Escreva sua própria query no terminal abaixo e aperte Enter. O resultado é comparado
                        com a saída esperada.
                      </p>
                      {revealed.has(activeChallenge) && (
                        <div className="mt-2 rounded-md border border-primary/30 bg-primary/10 p-2">
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Solução de referência
                          </p>
                          <code className="block whitespace-pre-wrap break-words font-mono text-xs text-foreground">
                            {CHALLENGES[activeChallenge].solution}
                          </code>
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button size="sm" variant="outline" onClick={revealSolution}>
                        <Lightbulb className="mr-1 h-4 w-4" />
                        Mostrar solução
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-border bg-[#171717]">
                <CardHeader className="border-b border-border/60 bg-[#262626] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="h-3 w-3 rounded-full bg-red-500" />
                        <div className="h-3 w-3 rounded-full bg-yellow-500" />
                        <div className="h-3 w-3 rounded-full bg-green-500" />
                      </div>
                      <span className="ml-2 text-sm text-muted-foreground">mongosh</span>
                    </div>
                    <Badge variant="secondary" className="font-mono text-[11px]">
                      devops&gt;
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div
                    ref={challengeTerminalRef}
                    className="h-[580px] cursor-text overflow-auto p-5 font-mono text-sm leading-relaxed sm:text-[15px]"
                    onClick={() => challengeInputRef.current?.focus()}
                  >
                    {challengeHistory.length === 0 && (
                      <div className="mb-4 text-emerald-400">
                        <p>Modo desafio: escreva a query você mesmo.</p>
                        <p className="mt-2 text-muted-foreground">
                          Digite uma query para responder ao desafio atual, rode &quot;show collections&quot;
                          ou &quot;help&quot; para ver os comandos.
                        </p>
                      </div>
                    )}
                    {challengeHistory.map((line, index) => (
                      <div
                        key={`${line.timestamp.getTime()}-${index}`}
                        className={cn(
                          'mb-2',
                          line.type === 'output' ? 'whitespace-pre' : 'whitespace-pre-wrap break-words',
                          line.type === 'input' && 'text-slate-100',
                          line.type === 'output' && 'text-slate-300',
                          line.type === 'error' && 'text-red-400',
                          line.type === 'success' &&
                            'whitespace-pre-wrap rounded-md border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-300',
                        )}
                      >
                        {line.type === 'input' && <span className="text-emerald-400">devops&gt; </span>}
                        {line.content}
                      </div>
                    ))}
                    <form onSubmit={handleChallengeSubmit} className="flex items-center">
                      <span className="whitespace-nowrap text-emerald-400">devops&gt;</span>
                      <input
                        ref={challengeInputRef}
                        type="text"
                        value={challengeInput}
                        onChange={(event) => setChallengeInput(event.target.value)}
                        className="ml-2 min-w-0 flex-1 bg-transparent text-slate-100 caret-emerald-400 outline-none"
                        spellCheck={false}
                        autoComplete="off"
                        autoCapitalize="off"
                        placeholder="db.products.find(...)"
                      />
                    </form>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        <div className="space-y-4">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="h-5 w-5" />
                Collections
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-0">
              {COLLECTIONS.map((collection) => (
                <div key={collection.name} className="rounded-md border p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 font-mono text-sm font-medium">
                      <Table className="h-3.5 w-3.5 text-primary" />
                      {collection.name}
                    </p>
                    <Badge variant="secondary" className="tabular-nums">
                      {collection.count} docs
                    </Badge>
                  </div>
                  <ul className="space-y-1">
                    {collection.fields.map((field) => (
                      <li
                        key={field.name}
                        className="flex items-center justify-between gap-2 font-mono text-xs text-muted-foreground"
                      >
                        <span>{field.name}</span>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
                          {field.type}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Terminal className="h-5 w-5" />
                Cola rápida
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4 pt-0 text-xs text-muted-foreground">
              <p><code className="text-foreground">find(filter, projection)</code> lê documentos</p>
              <p><code className="text-foreground">{'{ field: 1, _id: 0 }'}</code> inclui / exclui campos</p>
              <p><code className="text-foreground">{'$lt $gt $gte $lte $ne'}</code> comparações</p>
              <p><code className="text-foreground">{'$in'}</code> / <code className="text-foreground">{'$and'}</code> / <code className="text-foreground">{'$or'}</code> combinam</p>
              <p><code className="text-foreground">sort / skip / limit</code> moldam o cursor</p>
              <p><code className="text-foreground">countDocuments(filter)</code> conta resultados</p>
              <p><code className="text-foreground">insertOne / updateOne / deleteMany</code> gravam</p>
              <p><code className="text-foreground">aggregate([ $match, $group, $sort ])</code> pipeline</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {mode === 'lessons' && completedCount === totalCommands && (
        <Card className="mt-4 border-emerald-500/40 bg-emerald-500/10">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="font-semibold">Laboratório concluído</p>
                <p className="text-sm text-muted-foreground">
                  Você praticou o fluxo essencial do MongoDB, do find() e das projeções aos operadores,
                  ordenação, paginação, gravação e pipeline de agregação. Vá para o modo Desafio para escrever
                  queries do zero.
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={resetLab}>
              Começar de novo
            </Button>
          </CardContent>
        </Card>
      )}

      {mode === 'challenges' && solvedCount === CHALLENGES.length && (
        <Card className="mt-4 border-emerald-500/40 bg-emerald-500/10">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="font-semibold">Todos os desafios resolvidos</p>
                <p className="text-sm text-muted-foreground">
                  Mandou bem: você escreveu todas as queries sozinho. Reinicie para praticar de novo ou volte
                  para as lições.
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={resetChallenges}>
              Reiniciar desafios
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-muted/30 p-2">
      <p className="text-lg font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
