'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowUpDown,
  BarChart3,
  BookOpen,
  Braces,
  CheckCircle,
  Circle,
  Columns3,
  Combine,
  Database,
  DollarSign,
  Filter,
  GitMerge,
  Group,
  Layers,
  Lightbulb,
  Pencil,
  Percent,
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
  normalizeSql,
  resultsMatch,
  runQuery,
  TABLES,
  type QueryResult,
} from '@/lib/games/sql-sim-engine';

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

const JOIN_QUERY =
  "SELECT o.order_id, c.name, o.status FROM orders o JOIN customers c ON c.customer_id = o.customer_id WHERE o.status = 'shipped' ORDER BY o.order_id;";

const REVENUE_QUERY =
  'SELECT c.name, SUM(oi.quantity * p.price) AS revenue FROM customers c JOIN orders o ON o.customer_id = c.customer_id JOIN order_items oi ON oi.order_id = o.order_id JOIN products p ON p.product_id = oi.product_id GROUP BY c.name ORDER BY revenue DESC;';

const SUBQUERY_QUERY =
  'SELECT name, price FROM products WHERE price > (SELECT avg(price) FROM products) ORDER BY price DESC;';

const WINDOW_QUERY =
  'SELECT name, category, price, rank() OVER (PARTITION BY category ORDER BY price DESC) AS rnk FROM products ORDER BY category, rnk;';

const LEFT_JOIN_QUERY =
  "SELECT c.name, o.order_id, o.status FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id AND o.status = 'pending' ORDER BY c.name;";

const CTE_QUERY =
  'WITH customer_spend AS (SELECT c.name, SUM(oi.quantity * p.price) AS total FROM customers c JOIN orders o ON o.customer_id = c.customer_id JOIN order_items oi ON oi.order_id = o.order_id JOIN products p ON p.product_id = oi.product_id GROUP BY c.name) SELECT name, total FROM customer_spend WHERE total > (SELECT avg(total) FROM customer_spend) ORDER BY total DESC;';

const LESSONS: Lesson[] = [
  {
    id: 'select',
    title: 'Básico do SELECT',
    description: 'Leia linhas e escolha as colunas que você quer',
    icon: <Table className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Retorne todas as colunas e linhas da tabela customers.',
        hint: 'Use "SELECT * FROM customers;".',
        expectedCommand: 'SELECT * FROM customers;',
        explanation:
          'O SELECT * lê todas as colunas. O asterisco é um atalho para listar todas as colunas da tabela.',
      },
      {
        instruction: 'Agora retorne só as colunas name e country de customers.',
        hint: 'Use "SELECT name, country FROM customers;".',
        expectedCommand: 'SELECT name, country FROM customers;',
        explanation:
          'Escolher só as colunas necessárias deixa o resultado menor e a intenção mais clara.',
      },
    ],
  },
  {
    id: 'where',
    title: 'Filtrando com WHERE',
    description: 'Mantenha só as linhas que atendem a uma condição',
    icon: <Filter className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Liste o name e o country dos clientes dos EUA (USA).',
        hint: "Use \"SELECT name, country FROM customers WHERE country = 'USA';\".",
        expectedCommand: "SELECT name, country FROM customers WHERE country = 'USA';",
        explanation:
          'O WHERE filtra as linhas antes de elas voltarem. Strings ficam entre aspas simples e são comparadas exatamente.',
      },
      {
        instruction: 'Mostre o name e o price dos produtos que custam menos de 50.',
        hint: 'Use "SELECT name, price FROM products WHERE price < 50;".',
        expectedCommand: 'SELECT name, price FROM products WHERE price < 50;',
        explanation:
          'Literais numéricos são escritos sem aspas. Operadores de comparação como <, > e <> funcionam como você espera.',
      },
    ],
  },
  {
    id: 'order-limit',
    title: 'Ordenando e limitando',
    description: 'Ordene os resultados e limite quantas linhas voltam',
    icon: <ArrowUpDown className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Mostre os cinco produtos mais caros com o preço.',
        hint: 'Use "SELECT name, price FROM products ORDER BY price DESC LIMIT 5;".',
        expectedCommand: 'SELECT name, price FROM products ORDER BY price DESC LIMIT 5;',
        explanation:
          'O ORDER BY ordena o resultado; DESC ordena do maior para o menor. O LIMIT limita o número de linhas retornadas.',
      },
    ],
  },
  {
    id: 'distinct',
    title: 'Valores distintos',
    description: 'Junte os duplicados para ver valores únicos',
    icon: <Layers className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Liste cada categoria de produto uma única vez.',
        hint: 'Use "SELECT DISTINCT category FROM products;".',
        expectedCommand: 'SELECT DISTINCT category FROM products;',
        explanation:
          'O DISTINCT tira as linhas duplicadas da saída, o que ajuda a descobrir o conjunto de valores de uma coluna.',
      },
    ],
  },
  {
    id: 'count',
    title: 'Contando linhas',
    description: 'Use uma agregação para resumir uma tabela',
    icon: <Sigma className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Conte quantos pedidos existem e chame a coluna de order_count.',
        hint: 'Use "SELECT count(*) AS order_count FROM orders;".',
        expectedCommand: 'SELECT count(*) AS order_count FROM orders;',
        explanation:
          'O count(*) conta linhas. O AS dá à coluna do resultado um nome legível em vez do padrão "count".',
      },
    ],
  },
  {
    id: 'group-by',
    title: 'GROUP BY',
    description: 'Agregue por grupo em vez da tabela inteira',
    icon: <Group className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Conte os pedidos por status, do mais comum para o menos comum.',
        hint: 'Use "SELECT status, count(*) AS orders FROM orders GROUP BY status ORDER BY orders DESC;".',
        expectedCommand:
          'SELECT status, count(*) AS orders FROM orders GROUP BY status ORDER BY orders DESC;',
        explanation:
          'O GROUP BY agrupa as linhas por uma coluna para as agregações rodarem por grupo. Dá para fazer ORDER BY pelo alias da agregação.',
      },
    ],
  },
  {
    id: 'having',
    title: 'HAVING e médias',
    description: 'Filtre grupos e arredonde valores agregados',
    icon: <Percent className="h-5 w-5" />,
    commands: [
      {
        instruction:
          'Para as categorias com mais de dois produtos, mostre a contagem e o preço médio (2 casas decimais), da maior média para a menor.',
        hint: 'Use "SELECT category, count(*) AS n, round(avg(price), 2) AS avg_price FROM products GROUP BY category HAVING count(*) > 2 ORDER BY avg_price DESC;".',
        expectedCommand:
          'SELECT category, count(*) AS n, round(avg(price), 2) AS avg_price FROM products GROUP BY category HAVING count(*) > 2 ORDER BY avg_price DESC;',
        explanation:
          'O HAVING filtra grupos depois da agregação (o WHERE filtra linhas antes). round(avg(price), 2) deixa os valores em dinheiro legíveis.',
      },
    ],
  },
  {
    id: 'join',
    title: 'Juntando tabelas',
    description: 'Combine os pedidos com os clientes que os fizeram',
    icon: <Combine className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Mostre cada pedido enviado (shipped) com o nome do cliente, ordenado por order_id.',
        hint: 'Faça JOIN de orders com customers por customer_id e filtre pelo status.',
        expectedCommand: JOIN_QUERY,
        explanation:
          'O JOIN casa linhas de tabelas diferentes usando uma chave. Aqui, orders.customer_id casa com customers.customer_id.',
      },
    ],
  },
  {
    id: 'multi-join',
    title: 'Receita com vários JOINs',
    description: 'Agregue um valor espalhado por quatro tabelas',
    icon: <DollarSign className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Mostre a receita total por cliente, da maior para a menor.',
        hint: 'Faça JOIN de customers, orders, order_items e products e depois SUM de quantity * price.',
        expectedCommand: REVENUE_QUERY,
        explanation:
          'Relatórios reais costumam envolver vários JOINs. SUM(oi.quantity * p.price) soma a receita dos itens agrupada por cliente.',
      },
    ],
  },
  {
    id: 'subquery-window',
    title: 'Subqueries e window functions',
    description: 'Compare com uma agregação e ranqueie dentro de grupos',
    icon: <BarChart3 className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Liste os produtos com preço acima da média, do mais caro para o mais barato.',
        hint: 'Compare o price com uma subquery: (SELECT avg(price) FROM products).',
        expectedCommand: SUBQUERY_QUERY,
        explanation:
          'A subquery roda primeiro e passa um único valor para a query de fora, permitindo comparar cada linha com a média.',
      },
      {
        instruction: 'Ranqueie os produtos por preço dentro de cada categoria.',
        hint: 'Use rank() OVER (PARTITION BY category ORDER BY price DESC).',
        expectedCommand: WINDOW_QUERY,
        explanation:
          'Window functions calculam sobre um conjunto de linhas sem juntá-las. O PARTITION BY reinicia o ranking a cada categoria.',
      },
    ],
  },
  {
    id: 'left-join',
    title: 'LEFT JOIN',
    description: 'Mantenha todas as linhas da esquerda, mesmo sem correspondência',
    icon: <GitMerge className="h-5 w-5" />,
    commands: [
      {
        instruction:
          'Liste todos os clientes com o id e o status do pedido pendente (pending), ordenados por nome. Clientes sem pedido pendente também devem aparecer.',
        hint: "Faça LEFT JOIN com orders e coloque o filtro de status na cláusula ON: ON o.customer_id = c.customer_id AND o.status = 'pending'.",
        expectedCommand: LEFT_JOIN_QUERY,
        explanation:
          'O LEFT JOIN mantém todas as linhas da tabela da esquerda; as colunas da direita sem correspondência voltam NULL. É filtrar o.status no ON (e não no WHERE) que preserva os clientes sem pedido pendente.',
      },
    ],
  },
  {
    id: 'dml',
    title: 'INSERT, UPDATE, DELETE',
    description: 'Grave dados e leia os command tags',
    icon: <Pencil className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Insira um novo cliente: id 9, Ivy Chen, USA, cadastrado em 2025-08-01.',
        hint: "Use \"INSERT INTO customers VALUES (9, 'Ivy Chen', 'USA', '2025-08-01');\".",
        expectedCommand: "INSERT INTO customers VALUES (9, 'Ivy Chen', 'USA', '2025-08-01');",
        explanation:
          'O INSERT adiciona linhas. O Postgres responde "INSERT 0 1" (o 0 é um OID legado, o 1 é o número de linhas). Esta demo não salva a mudança, então os dados continuam iguais para as outras lições.',
      },
      {
        instruction: 'Aumente o preço do produto 1 para 54.99.',
        hint: 'Use "UPDATE products SET price = 54.99 WHERE product_id = 1;".',
        expectedCommand: 'UPDATE products SET price = 54.99 WHERE product_id = 1;',
        explanation:
          'O UPDATE altera as linhas que atendem ao WHERE e informa quantas mudou ("UPDATE 1" aqui). A demo não salva a mudança.',
      },
      {
        instruction: 'Apague todos os pedidos cancelados (cancelled).',
        hint: "Use \"DELETE FROM orders WHERE status = 'cancelled';\".",
        expectedCommand: "DELETE FROM orders WHERE status = 'cancelled';",
        explanation:
          'O DELETE remove as linhas que batem e informa a contagem ("DELETE 2": dois pedidos estão cancelados). De novo, nada é salvo aqui, para as lições continuarem reproduzíveis.',
      },
    ],
  },
  {
    id: 'cte',
    title: 'Common table expressions (CTEs)',
    description: 'Dê nome a uma subquery com WITH e reaproveite',
    icon: <Braces className="h-5 w-5" />,
    commands: [
      {
        instruction:
          'Usando uma cláusula WITH chamada customer_spend, liste os clientes cujo gasto total está acima da média, do maior para o menor.',
        hint: 'Defina customer_spend como a query de receita por cliente, depois faça SELECT nela e compare o total com (SELECT avg(total) FROM customer_spend).',
        expectedCommand: CTE_QUERY,
        explanation:
          'A cláusula WITH (common table expression) dá nome a uma subquery para você usá-la pelo nome. Aqui, customer_spend é usada duas vezes: uma na query principal e outra dentro da subquery do AVG.',
      },
    ],
  },
];

const TOTAL_ROWS = TABLES.reduce((sum, table) => sum + table.rowCount, 0);

const HELP_TEXT = `Comandos disponíveis:
  SELECT ... FROM ...      roda uma query (queries de uma tabela rodam ao vivo)
  \\dt                      lista as tabelas e quantas linhas cada uma tem
  help                     mostra esta mensagem
  clear                    limpa o terminal

Experimente:
  SELECT * FROM customers;
  SELECT name, price FROM products ORDER BY price DESC LIMIT 5;
  SELECT status, count(*) AS orders FROM orders GROUP BY status;`;

const SCHEMA_TEXT = TABLES.map(
  (table) => `${table.name} (${table.rowCount} rows)\n  ${table.columns.map((col) => col.name).join(', ')}`,
).join('\n\n');

function isNumericColumn(rows: (string | number | null)[][], index: number): boolean {
  return rows.every((row) => {
    const value = row[index];
    return value === null || typeof value === 'number' || /^-?\d+(\.\d+)?$/.test(String(value));
  });
}

/** Render a query result as a psql-style aligned text table. */
function formatTable(result: QueryResult): string {
  const { columns, rows } = result;
  if (rows.length === 0) {
    return `${columns.join(' | ')}\n(0 rows)`;
  }

  const numeric = columns.map((_, index) => isNumericColumn(rows, index));
  const widths = columns.map((column, index) =>
    Math.max(String(column).length, ...rows.map((row) => String(row[index] ?? '').length)),
  );

  const renderCell = (value: string | number | null, index: number) => {
    const text = value === null || value === undefined ? '' : String(value);
    return numeric[index] ? text.padStart(widths[index]) : text.padEnd(widths[index]);
  };

  const header = ` ${columns.map((column, index) => (numeric[index] ? String(column).padStart(widths[index]) : String(column).padEnd(widths[index]))).join(' | ')} `;
  const separator = widths.map((width) => '-'.repeat(width + 2)).join('+');
  const body = rows.map((row) => ` ${row.map((value, index) => renderCell(value, index)).join(' | ')} `);
  const footer = `(${rows.length} row${rows.length === 1 ? '' : 's'})`;

  return [header, separator, ...body, footer].join('\n');
}

function commandMatches(cmd: string, expected: string | string[]): boolean {
  const normalized = normalizeSql(cmd);
  if (Array.isArray(expected)) {
    return expected.some((item) => normalizeSql(item) === normalized);
  }
  return normalizeSql(expected) === normalized;
}

function executeCommand(rawInput: string): ExecuteResult {
  const input = rawInput.trim();
  const bare = input.replace(/;+\s*$/, '').trim().toLowerCase();

  if (bare === 'clear') return { output: '', clear: true };
  if (bare === 'help' || bare === '\\h' || bare === '\\?') return { output: HELP_TEXT };
  if (bare === '\\dt' || bare === '\\d' || bare === '\\l' || bare === 'tables') {
    return { output: SCHEMA_TEXT };
  }

  const result = runQuery(input);
  if ('error' in result) {
    return { output: `ERROR:  ${result.error}`, type: 'error' };
  }
  if ('command' in result) {
    return { output: result.command };
  }
  return { output: formatTable(result) };
}

interface Challenge {
  id: string;
  question: string;
  solution: string;
}

const CHALLENGES: Challenge[] = [
  {
    id: 'uk-customers',
    question: 'Liste os nomes de todos os clientes do Reino Unido (UK), em ordem alfabética.',
    solution: "SELECT name FROM customers WHERE country = 'UK' ORDER BY name",
  },
  {
    id: 'top-3-expensive',
    question: 'Mostre os 3 produtos mais caros (name e price), do mais caro para o mais barato.',
    solution: 'SELECT name, price FROM products ORDER BY price DESC LIMIT 3',
  },
  {
    id: 'delivered-count',
    question: "Quantos pedidos têm o status 'delivered'?",
    solution: "SELECT count(*) FROM orders WHERE status = 'delivered'",
  },
  {
    id: 'category-stats',
    question:
      'Para cada categoria de produto, mostre a quantidade de produtos e o preço médio arredondado para 2 casas, da maior média para a menor.',
    solution:
      'SELECT category, count(*) AS n, round(avg(price),2) AS avg_price FROM products GROUP BY category ORDER BY avg_price DESC',
  },
  {
    id: 'cheap-products',
    question: 'Quais produtos custam menos de $20? Mostre name e price, do mais barato para o mais caro.',
    solution: 'SELECT name, price FROM products WHERE price < 20 ORDER BY price',
  },
  {
    id: 'products-per-category',
    question: 'Quantos produtos há em cada categoria? Da maior quantidade para a menor.',
    solution: 'SELECT category, count(*) AS n FROM products GROUP BY category ORDER BY n DESC',
  },
  {
    id: 'cheapest-product',
    question: 'Diga qual é o produto mais barato e o preço dele.',
    solution: 'SELECT name, price FROM products ORDER BY price LIMIT 1',
  },
  {
    id: 'early-signups',
    question: 'Quais clientes se cadastraram antes de março de 2025? Nomes, do mais antigo para o mais recente.',
    solution: "SELECT name FROM customers WHERE signup_date < '2025-03-01' ORDER BY signup_date",
  },
];

/** Grade a user's SQL against a challenge's reference solution. */
function gradeChallenge(
  input: string,
  challenge: Challenge,
): { lines: TerminalLine[]; solved: boolean } {
  const now = () => new Date();
  const lines: TerminalLine[] = [{ type: 'input', content: input, timestamp: now() }];

  const userResult = runQuery(input);
  if ('error' in userResult) {
    lines.push({ type: 'error', content: `ERROR:  ${userResult.error}`, timestamp: now() });
    lines.push({
      type: 'error',
      content: 'Quase: essa query não rodou. Corrija o erro e tente de novo.',
      timestamp: now(),
    });
    return { lines, solved: false };
  }
  if ('command' in userResult) {
    lines.push({ type: 'output', content: userResult.command, timestamp: now() });
    lines.push({
      type: 'error',
      content: 'Quase: o desafio espera uma query SELECT que retorne linhas.',
      timestamp: now(),
    });
    return { lines, solved: false };
  }

  lines.push({ type: 'output', content: formatTable(userResult), timestamp: now() });

  const reference = runQuery(challenge.solution);
  if (resultsMatch(userResult, reference)) {
    lines.push({
      type: 'success',
      content: 'Correto! Seu resultado bate com a solução de referência.',
      timestamp: now(),
    });
    return { lines, solved: true };
  }

  const expectedRows = 'rows' in reference ? reference.rows.length : 0;
  lines.push({
    type: 'error',
    content: `Quase: seu resultado não bate. Eram esperadas ${expectedRows} linha${expectedRows === 1 ? '' : 's'}.`,
    timestamp: now(),
  });
  return { lines, solved: false };
}

export default function SqlTerminalSimulator() {
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
      if (bare === '\\dt' || bare === '\\d' || bare === '\\l' || bare === 'tables') {
        setChallengeHistory((prev) => [
          ...prev,
          { type: 'input', content: input, timestamp: now() },
          { type: 'output', content: SCHEMA_TEXT, timestamp: now() },
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

  const switchMode = useCallback((next: 'lessons' | 'challenges') => {
    setMode(next);
    if (next === 'challenges') {
      window.setTimeout(() => challengeInputRef.current?.focus(), 0);
    } else {
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [inputRef]);

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-md border bg-muted/20 p-4">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <div className="rounded-md border border-primary/30 bg-primary/10 p-2 text-primary">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <p className="font-mono text-xs text-muted-foreground">// playground de SQL</p>
              <h2 className="text-2xl font-bold md:text-3xl">Simulador de terminal SQL</h2>
            </div>
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Pratique SQL num schema pequeno de e-commerce, num terminal seguro no navegador. Queries de uma
            tabela rodam ao vivo; as lições guiadas de JOIN, subquery, window e CTE devolvem saída real do
            Postgres. Aprenda SELECT, WHERE, ORDER BY, DISTINCT, agregações, GROUP BY, HAVING, JOINs,
            LEFT JOIN, INSERT/UPDATE/DELETE, subqueries, window functions e CTEs.
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
              <Metric label="Tabelas" value={TABLES.length} />
              <Metric label="Linhas" value={TOTAL_ROWS} />
              {mode === 'lessons' ? (
                <Metric label="Lições" value={LESSONS.length} />
              ) : (
                <Metric label="Desafios" value={CHALLENGES.length} />
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
                      <div className={cn('rounded-md border p-1.5', active ? 'text-primary' : 'text-muted-foreground')}>
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
                  <span className="ml-2 text-sm text-muted-foreground">psql</span>
                </div>
                <Badge variant="secondary" className="font-mono text-[11px]">
                  devops=#
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
                    <p>Boas-vindas ao playground de terminal SQL (estilo Postgres).</p>
                    <p className="mt-2 text-muted-foreground">
                      Digite &quot;help&quot;, rode &quot;\dt&quot; para ver as tabelas ou siga a tarefa atual acima.
                    </p>
                  </div>
                )}
                {terminalHistory.map((line, index) => (
                  <div
                    key={`${line.timestamp.getTime()}-${index}`}
                    className={cn(
                      'mb-2',
                      line.type === 'output'
                        ? 'whitespace-pre'
                        : 'whitespace-pre-wrap break-words',
                      line.type === 'input' && 'text-slate-100',
                      line.type === 'output' && 'text-slate-300',
                      line.type === 'error' && 'text-red-400',
                      line.type === 'success' &&
                        'whitespace-pre-wrap rounded-md border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-300',
                    )}
                  >
                    {line.type === 'input' && <span className="text-emerald-400">devops=# </span>}
                    {line.content}
                  </div>
                ))}
                <form onSubmit={handleSubmit} className="flex items-center">
                  <span className="whitespace-nowrap text-emerald-400">devops=#</span>
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
                    placeholder="SELECT * FROM customers;"
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
                    Escreva seu próprio SQL no terminal abaixo e aperte Enter. O resultado é comparado
                    com as linhas esperadas, ignorando os nomes das colunas.
                  </p>
                  {revealed.has(activeChallenge) && (
                    <div className="mt-2 rounded-md border border-primary/30 bg-primary/10 p-2">
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Solução de referência
                      </p>
                      <code className="block whitespace-pre-wrap break-words font-mono text-xs text-foreground">
                        {CHALLENGES[activeChallenge].solution};
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
                  <span className="ml-2 text-sm text-muted-foreground">psql</span>
                </div>
                <Badge variant="secondary" className="font-mono text-[11px]">
                  devops=#
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
                    <p>Modo desafio: escreva o SQL você mesmo.</p>
                    <p className="mt-2 text-muted-foreground">
                      Digite uma query para responder ao desafio atual, rode &quot;\dt&quot; para ver as
                      tabelas ou &quot;help&quot; para ver os comandos.
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
                    {line.type === 'input' && <span className="text-emerald-400">devops=# </span>}
                    {line.content}
                  </div>
                ))}
                <form onSubmit={handleChallengeSubmit} className="flex items-center">
                  <span className="whitespace-nowrap text-emerald-400">devops=#</span>
                  <input
                    ref={challengeInputRef}
                    type="text"
                    value={challengeInput}
                    onChange={(event) => setChallengeInput(event.target.value)}
                    className="ml-2 min-w-0 flex-1 bg-transparent text-slate-100 caret-emerald-400 outline-none"
                    spellCheck={false}
                    autoComplete="off"
                    autoCapitalize="off"
                    placeholder="SELECT ..."
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
                <Columns3 className="h-5 w-5" />
                Schema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-0">
              {TABLES.map((table) => (
                <div key={table.name} className="rounded-md border p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 font-mono text-sm font-medium">
                      <Table className="h-3.5 w-3.5 text-primary" />
                      {table.name}
                    </p>
                    <Badge variant="secondary" className="tabular-nums">
                      {table.rowCount} rows
                    </Badge>
                  </div>
                  <ul className="space-y-1">
                    {table.columns.map((column) => (
                      <li
                        key={column.name}
                        className="flex items-center justify-between gap-2 font-mono text-xs text-muted-foreground"
                      >
                        <span>{column.name}</span>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
                          {column.type}
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
              <p><code className="text-foreground">SELECT</code> colunas a ler</p>
              <p><code className="text-foreground">WHERE</code> filtra linhas</p>
              <p><code className="text-foreground">GROUP BY</code> + agregações resumem</p>
              <p><code className="text-foreground">HAVING</code> filtra grupos</p>
              <p><code className="text-foreground">ORDER BY</code> / <code className="text-foreground">LIMIT</code> ordenam e limitam</p>
              <p><code className="text-foreground">JOIN</code> / <code className="text-foreground">LEFT JOIN</code> combinam tabelas</p>
              <p><code className="text-foreground">INSERT</code> / <code className="text-foreground">UPDATE</code> / <code className="text-foreground">DELETE</code> alteram dados</p>
              <p><code className="text-foreground">WITH</code> dá nome a uma subquery (CTE)</p>
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
                  Você praticou o fluxo essencial de SQL, do SELECT e WHERE até LEFT JOINs,
                  alteração de dados, subqueries, window functions e CTEs. Vá para o modo Desafio para escrever
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
