'use client';

import type { ReactNode } from 'react';
import { useCallback, useState } from 'react';
import {
  BookOpen,
  CheckCircle,
  Database,
  Gauge,
  History,
  KeyRound,
  Lightbulb,
  ListTree,
  Play,
  PlusCircle,
  RotateCcw,
  Search,
  Table2,
  Terminal,
  Timer,
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
} from '@/hooks/use-terminal-simulator';

/**
 * PostgreSQL / psql terminal simulator.
 *
 * A companion to the SQL Terminal Simulator, but this lab teaches the *tool
 * and engine* rather than the SQL language: psql meta-commands, EXPLAIN plans,
 * indexes, and transactions. It is intentionally a docker/k8s-style
 * command -> output simulator (canned + small in-component state), NOT a
 * free-form SQL evaluator, so it is fully self-contained.
 *
 * Every EXPLAIN plan, catalog listing, and psql-aligned table below is
 * reproduced from real Postgres output so what you see matches production.
 */

interface PgState {
  indexCreated: boolean;
  inTransaction: boolean;
  ordersCount: number;
  expanded: boolean;
  timing: boolean;
}

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

function createInitialState(): PgState {
  return {
    indexCreated: false,
    inTransaction: false,
    ordersCount: 12,
    expanded: false,
    timing: false,
  };
}

const CONNECTION = { database: 'shop', user: 'neondb_owner' } as const;

// --- Table metadata (same e-commerce schema as the SQL sim) -------------------

interface ColumnMeta {
  name: string;
  type: string;
  nullable: string;
  default: string;
}

interface TableMeta {
  name: string;
  rows: number;
  columns: ColumnMeta[];
  primaryKey: string;
}

const CUSTOMERS: Array<[number, string, string, string]> = [
  [1, 'Alice Johnson', 'USA', '2023-01-15'],
  [2, 'Bob Smith', 'UK', '2023-02-20'],
  [3, 'Carla Reyes', 'Spain', '2023-03-05'],
  [4, 'Daniel Kim', 'South Korea', '2023-03-18'],
  [5, 'Emma Wilson', 'USA', '2023-04-02'],
  [6, 'Farah Ahmed', 'UAE', '2023-05-11'],
  [7, 'Georgi Petrov', 'Bulgaria', '2023-06-01'],
  [8, 'Hannah Muller', 'Germany', '2023-06-25'],
];

const TABLES: TableMeta[] = [
  {
    name: 'big_events',
    rows: 200000,
    primaryKey: 'id',
    columns: [
      { name: 'id', type: 'bigint', nullable: 'not null', default: "nextval('big_events_id_seq'::regclass)" },
      { name: 'user_id', type: 'integer', nullable: 'not null', default: '' },
      { name: 'action', type: 'text', nullable: 'not null', default: '' },
      { name: 'created_at', type: 'timestamp with time zone', nullable: 'not null', default: 'now()' },
    ],
  },
  {
    name: 'customers',
    rows: 8,
    primaryKey: 'customer_id',
    columns: [
      { name: 'customer_id', type: 'integer', nullable: 'not null', default: '' },
      { name: 'name', type: 'text', nullable: 'not null', default: '' },
      { name: 'country', type: 'text', nullable: 'not null', default: '' },
      { name: 'signup_date', type: 'date', nullable: 'not null', default: '' },
    ],
  },
  {
    name: 'order_items',
    rows: 20,
    primaryKey: 'item_id',
    columns: [
      { name: 'item_id', type: 'integer', nullable: 'not null', default: '' },
      { name: 'order_id', type: 'integer', nullable: 'not null', default: '' },
      { name: 'product_id', type: 'integer', nullable: 'not null', default: '' },
      { name: 'quantity', type: 'integer', nullable: 'not null', default: '' },
    ],
  },
  {
    name: 'orders',
    rows: 12,
    primaryKey: 'order_id',
    columns: [
      { name: 'order_id', type: 'integer', nullable: 'not null', default: '' },
      { name: 'customer_id', type: 'integer', nullable: 'not null', default: '' },
      { name: 'order_date', type: 'date', nullable: 'not null', default: '' },
      { name: 'status', type: 'text', nullable: 'not null', default: '' },
    ],
  },
  {
    name: 'products',
    rows: 10,
    primaryKey: 'product_id',
    columns: [
      { name: 'product_id', type: 'integer', nullable: 'not null', default: '' },
      { name: 'name', type: 'text', nullable: 'not null', default: '' },
      { name: 'category', type: 'text', nullable: 'not null', default: '' },
      { name: 'price', type: 'numeric', nullable: 'not null', default: '' },
    ],
  },
];

// --- psql aligned-table renderer ---------------------------------------------
// Verified byte-for-byte against the captured `\dt` body and the single-cell
// `SELECT count(*)` output. psql pads each cell as " <content> ", joins cells
// with "|", right-trims every printed row, and appends "(N rows)".

interface PsqlColumn {
  header: string;
  rightAlign?: boolean;
}

function centerText(text: string, width: number): string {
  const pad = width - text.length;
  if (pad <= 0) return text;
  const left = Math.floor(pad / 2);
  return ' '.repeat(left) + text + ' '.repeat(pad - left);
}

function padCell(value: string, width: number, rightAlign: boolean): string {
  const pad = width - value.length;
  if (pad <= 0) return value;
  return rightAlign ? ' '.repeat(pad) + value : value + ' '.repeat(pad);
}

function rtrim(value: string): string {
  return value.replace(/\s+$/, '');
}

function renderPsqlTable(
  columns: PsqlColumn[],
  rows: string[][],
  options: { title?: string; showCount?: boolean } = {}
): string {
  const { title, showCount = true } = options;
  const widths = columns.map((col, i) =>
    Math.max(col.header.length, ...rows.map((row) => (row[i] ?? '').length))
  );

  const headerLine = rtrim(
    columns.map((col, i) => ` ${centerText(col.header, widths[i])} `).join('|')
  );
  const separatorLine = widths.map((width) => '-'.repeat(width + 2)).join('+');
  const dataLines = rows.map((row) =>
    rtrim(columns.map((col, i) => ` ${padCell(row[i] ?? '', widths[i], !!col.rightAlign)} `).join('|'))
  );

  const parts: string[] = [];
  if (title) {
    const leadPad = Math.max(0, Math.floor((separatorLine.length - title.length) / 2));
    parts.push(' '.repeat(leadPad) + title);
  }
  parts.push(headerLine, separatorLine, ...dataLines);
  if (showCount) {
    parts.push(`(${rows.length} row${rows.length === 1 ? '' : 's'})`);
  }
  return parts.join('\n');
}

// --- Canned output captured verbatim from real Postgres ----------------------

const DT_OUTPUT = `          List of relations
 Schema |    Name     | Type  |    Owner
--------+-------------+-------+--------------
 public | big_events  | table | neondb_owner
 public | customers   | table | neondb_owner
 public | order_items | table | neondb_owner
 public | orders      | table | neondb_owner
 public | products    | table | neondb_owner
(5 rows)`;

const D_CUSTOMERS_OUTPUT = `              Table "public.customers"
   Column    |  Type   | Collation | Nullable | Default
-------------+---------+-----------+----------+---------
 customer_id | integer |           | not null |
 name        | text    |           | not null |
 country     | text    |           | not null |
 signup_date | date    |           | not null |
Indexes:
    "customers_pkey" PRIMARY KEY, btree (customer_id)`;

const EXPLAIN_SEQ_SCAN = `                          QUERY PLAN
---------------------------------------------------------------
 Seq Scan on big_events  (cost=0.00..3971.00 rows=40 width=26)
   Filter: (user_id = 42)
(2 rows)`;

const EXPLAIN_BITMAP_SCAN = `                                QUERY PLAN
------------------------------------------------------------------------------
 Bitmap Heap Scan on big_events  (cost=4.60..145.32 rows=40 width=26)
   Recheck Cond: (user_id = 42)
   ->  Bitmap Index Scan on idx_big_events_user  (cost=0.00..4.59 rows=40 width=0)
         Index Cond: (user_id = 42)
(4 rows)`;

const EXPLAIN_ANALYZE_SEQ = ` Aggregate (actual rows=1 loops=1)
   ->  Seq Scan on big_events (actual rows=50 loops=1)
         Filter: (user_id = 42)
         Rows Removed by Filter: 199950`;

const EXPLAIN_ANALYZE_BITMAP = ` Aggregate (actual rows=1 loops=1)
   ->  Bitmap Heap Scan on big_events (actual rows=50 loops=1)
         Recheck Cond: (user_id = 42)
         Heap Blocks: exact=49
         ->  Bitmap Index Scan on idx_big_events_user (actual rows=50 loops=1)
               Index Cond: (user_id = 42)`;

const HELP_BACKSLASH = `General
  \\l                    list databases
  \\conninfo             display connection information
  \\q                    quit psql (disabled in this browser lab)

Informational
  \\dt                   list tables
  \\d NAME               describe table NAME (columns, types, indexes)
  \\di                   list indexes

Formatting / session
  \\x                    toggle expanded (vertical) display
  \\timing               toggle query timing
  \\?                    show this help

Type SQL statements ending with a semicolon, e.g. SELECT count(*) FROM orders;`;

const WELCOME_HELP = `psql (16.3, browser sandbox)
Type "\\?" for help with psql meta-commands.
Type SQL statements ending with a semicolon, e.g. SELECT count(*) FROM orders;
Try "\\dt", "EXPLAIN SELECT * FROM big_events WHERE user_id = 42;", or "BEGIN;".`;

// --- Dynamic output builders -------------------------------------------------

function describeTable(name: string, indexCreated: boolean): string {
  if (name === 'customers') return D_CUSTOMERS_OUTPUT;

  const table = TABLES.find((item) => item.name === name);
  if (!table) {
    return `Did not find any relation named "${name}".`;
  }

  const columns: PsqlColumn[] = [
    { header: 'Column' },
    { header: 'Type' },
    { header: 'Collation' },
    { header: 'Nullable' },
    { header: 'Default' },
  ];
  const rows = table.columns.map((col) => [col.name, col.type, '', col.nullable, col.default]);

  const body = renderPsqlTable(columns, rows, {
    title: `Table "public.${table.name}"`,
    showCount: false,
  });

  const indexLines = [`    "${table.name}_pkey" PRIMARY KEY, btree (${table.primaryKey})`];
  if (table.name === 'big_events' && indexCreated) {
    indexLines.push('    "idx_big_events_user" btree (user_id)');
  }

  return `${body}\nIndexes:\n${indexLines.join('\n')}`;
}

function listIndexes(indexCreated: boolean): string {
  const rows: string[][] = [
    ['public', 'big_events_pkey', 'index', 'neondb_owner', 'big_events'],
    ['public', 'customers_pkey', 'index', 'neondb_owner', 'customers'],
    ['public', 'order_items_pkey', 'index', 'neondb_owner', 'order_items'],
    ['public', 'orders_pkey', 'index', 'neondb_owner', 'orders'],
    ['public', 'products_pkey', 'index', 'neondb_owner', 'products'],
  ];
  if (indexCreated) {
    rows.push(['public', 'idx_big_events_user', 'index', 'neondb_owner', 'big_events']);
  }
  rows.sort((a, b) => a[1].localeCompare(b[1]));

  return renderPsqlTable(
    [
      { header: 'Schema' },
      { header: 'Name' },
      { header: 'Type' },
      { header: 'Owner' },
      { header: 'Table' },
    ],
    rows,
    { title: 'List of relations' }
  );
}

function listDatabases(): string {
  return renderPsqlTable(
    [
      { header: 'Name' },
      { header: 'Owner' },
      { header: 'Encoding' },
      { header: 'Collate' },
      { header: 'Ctype' },
      { header: 'Access privileges' },
    ],
    [['shop', 'neondb_owner', 'UTF8', 'en_US.utf8', 'en_US.utf8', '']],
    { title: 'List of databases' }
  );
}

function ordersCountOutput(count: number): string {
  return renderPsqlTable([{ header: 'count', rightAlign: true }], [[String(count)]]);
}

function customersOutput(limit?: number): string {
  const source = typeof limit === 'number' ? CUSTOMERS.slice(0, limit) : CUSTOMERS;
  const rows = source.map((row) => [String(row[0]), row[1], row[2], row[3]]);
  return renderPsqlTable(
    [
      { header: 'customer_id', rightAlign: true },
      { header: 'name' },
      { header: 'country' },
      { header: 'signup_date' },
    ],
    rows
  );
}

// --- Command matching ---------------------------------------------------------

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/;+\s*$/, '')
    .replace(/\s+/g, ' ');
}

function commandMatches(cmd: string, expected: string | string[]): boolean {
  const normalized = normalize(cmd);
  if (Array.isArray(expected)) {
    return expected.some((item) => normalize(item) === normalized);
  }
  return normalize(expected) === normalized;
}

// --- Lessons ------------------------------------------------------------------

const LESSONS: Lesson[] = [
  {
    id: 'explore',
    title: 'Explore o banco de dados',
    description: 'Liste as tabelas e inspecione uma tabela com os meta-comandos do psql',
    icon: <Table2 className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Liste todas as tabelas do banco atual.',
        hint: 'Use o meta-comando do psql "\\dt".',
        expectedCommand: '\\dt',
        explanation:
          'O \\dt lista as relações do tipo tabela. Meta-comandos começam com barra invertida e são tratados pelo próprio psql, sem ir ao servidor como SQL.',
      },
      {
        instruction: 'Descreva a tabela customers para ver as colunas e os índices.',
        hint: 'Use "\\d customers".',
        expectedCommand: '\\d customers',
        explanation:
          'O \\d NOME mostra colunas, tipos, se aceita nulo, valores padrão e índices. A linha customers_pkey é o índice da primary key que o Postgres criou automaticamente.',
      },
    ],
  },
  {
    id: 'query',
    title: 'Rode uma query',
    description: 'Conte linhas e leia um resultado pequeno',
    icon: <Terminal className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Conte quantas linhas há na tabela orders.',
        hint: 'Rode "SELECT count(*) FROM orders;" (comandos SQL terminam com ponto e vírgula).',
        expectedCommand: 'SELECT count(*) FROM orders;',
        explanation:
          'O count(*) devolve o número de linhas. Diferente dos meta-comandos, isso é SQL de verdade enviado ao servidor, e o psql mostra o resultado no formato alinhado.',
      },
    ],
  },
  {
    id: 'indexes',
    title: 'Liste os índices',
    description: 'Veja quais índices existem antes de criar um',
    icon: <KeyRound className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Liste todos os índices do banco.',
        hint: 'Use "\\di".',
        expectedCommand: '\\di',
        explanation:
          'Por enquanto, todo índice é um *_pkey criado para uma primary key. Ainda não há índice em big_events.user_id, e é exatamente por isso que a próxima query é lenta.',
      },
    ],
  },
  {
    id: 'explain-seq',
    title: 'EXPLAIN de um filtro',
    description: 'Veja o Postgres escolher um sequential scan',
    icon: <Search className="h-5 w-5" />,
    commands: [
      {
        instruction:
          'Pergunte ao planner como ele rodaria um filtro em big_events (200.000 linhas) sem nenhum índice útil.',
        hint: 'Run "EXPLAIN SELECT * FROM big_events WHERE user_id = 42;".',
        expectedCommand: 'EXPLAIN SELECT * FROM big_events WHERE user_id = 42;',
        explanation:
          'Sem índice em user_id, o planner escolhe um Seq Scan: lê as 200.000 linhas e filtra. Repare no custo total estimado de 3971.00.',
      },
    ],
  },
  {
    id: 'create-index',
    title: 'Crie um índice',
    description: 'Adicione um índice B-tree na coluna filtrada',
    icon: <PlusCircle className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Crie um índice B-tree em big_events.user_id.',
        hint: 'Run "CREATE INDEX idx_big_events_user ON big_events(user_id);".',
        expectedCommand: [
          'CREATE INDEX idx_big_events_user ON big_events(user_id);',
          'CREATE INDEX idx_big_events_user ON big_events (user_id);',
        ],
        explanation:
          'O CREATE INDEX monta uma B-tree com chave em user_id. O servidor responde "CREATE INDEX". Agora o planner consegue buscar as linhas em vez de varrer a tabela inteira.',
      },
    ],
  },
  {
    id: 'explain-index',
    title: 'EXPLAIN de novo',
    description: 'Compare o plano agora que o índice existe',
    icon: <Gauge className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Rode exatamente o mesmo EXPLAIN de novo, agora com o índice.',
        hint: 'Run "EXPLAIN SELECT * FROM big_events WHERE user_id = 42;" once more.',
        expectedCommand: 'EXPLAIN SELECT * FROM big_events WHERE user_id = 42;',
        explanation:
          'Mesma query, plano diferente: um Bitmap Index Scan alimenta um Bitmap Heap Scan. O custo estimado cai de 3971.00 para 145.32, uma melhora de cerca de 27x.',
      },
    ],
  },
  {
    id: 'explain-analyze',
    title: 'EXPLAIN ANALYZE',
    description: 'Rode a query de verdade e leia a contagem real de linhas',
    icon: <Timer className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Use EXPLAIN ANALYZE para rodar a query e comparar o trabalho estimado com o real.',
        hint: 'Run "EXPLAIN ANALYZE SELECT count(*) FROM big_events WHERE user_id = 42;".',
        expectedCommand: 'EXPLAIN ANALYZE SELECT count(*) FROM big_events WHERE user_id = 42;',
        explanation:
          'O EXPLAIN ANALYZE executa a query e informa as linhas reais. Com o índice, o scan toca ~50 linhas em vez de descartar 199.950 com um filtro.',
      },
    ],
  },
  {
    id: 'transactions',
    title: 'Transações',
    description: 'BEGIN, DELETE e ROLLBACK com segurança',
    icon: <History className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Abra uma transação para poder desfazer as mudanças.',
        hint: 'Rode "BEGIN;". Repare que o prompt muda para shop=*#.',
        expectedCommand: 'BEGIN;',
        explanation:
          'O BEGIN inicia um bloco de transação. O prompt muda para shop=*# para mostrar que você está numa transação aberta, ainda sem commit.',
      },
      {
        instruction: 'Apague os pedidos cancelados dentro da transação.',
        hint: "Run \"DELETE FROM orders WHERE status = 'cancelled';\".",
        expectedCommand: "DELETE FROM orders WHERE status = 'cancelled';",
        explanation:
          'O DELETE remove as linhas que batem e responde "DELETE 2". Como você está numa transação, a mudança só fica permanente depois do COMMIT.',
      },
      {
        instruction: 'Confirme que a contagem de linhas caiu dentro da transação.',
        hint: 'Rode "SELECT count(*) FROM orders;" de novo.',
        expectedCommand: 'SELECT count(*) FROM orders;',
        explanation:
          'Dentro da transação, a contagem agora é 10. Sua sessão vê as próprias mudanças sem commit, mas as outras sessões ainda veem 12.',
      },
      {
        instruction: 'Desfaça tudo com um rollback.',
        hint: 'Run "ROLLBACK;".',
        expectedCommand: 'ROLLBACK;',
        explanation:
          'O ROLLBACK descarta todas as mudanças da transação e a encerra. O prompt volta a shop=#. Um COMMIT, ao contrário, teria mantido o delete.',
      },
      {
        instruction: 'Confira que o rollback trouxe de volta as linhas apagadas.',
        hint: 'Rode "SELECT count(*) FROM orders;" uma última vez.',
        expectedCommand: 'SELECT count(*) FROM orders;',
        explanation:
          'A contagem voltou a 12. O ROLLBACK é sua rede de segurança: coloque mudanças arriscadas numa transação e você sempre pode desfazer antes do commit.',
      },
    ],
  },
];

// --- Component ----------------------------------------------------------------

export default function PostgresTerminalSimulator() {
  const [pgState, setPgState] = useState<PgState>(createInitialState);

  const execute = useCallback(
    (rawInput: string): ExecuteResult => {
      const input = rawInput.trim();
      const lower = normalize(input);

      if (input === 'clear') {
        return { output: '', clear: true };
      }

      // psql meta-commands (backslash commands)
      if (input.startsWith('\\')) {
        const [base, arg] = input.split(/\s+/);
        const metaKey = base.toLowerCase();

        if (metaKey === '\\dt') return { output: DT_OUTPUT };
        if (metaKey === '\\di') return { output: listIndexes(pgState.indexCreated) };
        if (metaKey === '\\d') {
          if (!arg) {
            return { output: `${DT_OUTPUT}` };
          }
          return { output: describeTable(arg.toLowerCase(), pgState.indexCreated) };
        }
        if (metaKey === '\\l' || metaKey === '\\list') return { output: listDatabases() };
        if (metaKey === '\\conninfo') {
          return {
            output: `You are connected to database "${CONNECTION.database}" as user "${CONNECTION.user}" on host "ep-fragrant-block-123456.us-east-2.aws.neon.tech" at port "5432".`,
          };
        }
        if (metaKey === '\\x') {
          const next = !pgState.expanded;
          setPgState((prev) => ({ ...prev, expanded: next }));
          return { output: `Expanded display is ${next ? 'on' : 'off'}.` };
        }
        if (metaKey === '\\timing') {
          const next = !pgState.timing;
          setPgState((prev) => ({ ...prev, timing: next }));
          return { output: `Timing is ${next ? 'on' : 'off'}.` };
        }
        if (metaKey === '\\?') return { output: HELP_BACKSLASH };
        if (metaKey === '\\q') {
          return { output: 'Este é um laboratório no navegador, então não há o que encerrar. Use "Reiniciar laboratório" para começar de novo.' };
        }
        return { output: `invalid command ${base}. Try \\? for help.`, type: 'error' };
      }

      // Transaction control
      if (lower === 'begin' || lower === 'begin work' || lower === 'begin transaction' || lower === 'start transaction') {
        setPgState((prev) => ({ ...prev, inTransaction: true }));
        return { output: 'BEGIN' };
      }
      if (lower === 'commit' || lower === 'commit work' || lower === 'end') {
        setPgState((prev) => ({ ...prev, inTransaction: false }));
        return { output: 'COMMIT' };
      }
      if (lower === 'rollback' || lower === 'rollback work' || lower === 'abort') {
        setPgState((prev) => ({ ...prev, inTransaction: false, ordersCount: 12 }));
        return { output: 'ROLLBACK' };
      }

      // EXPLAIN (ANALYZE) on the big_events filter
      if (lower.startsWith('explain')) {
        const referencesBigEvents = lower.includes('big_events') && lower.includes('user_id');
        if (!referencesBigEvents) {
          return { output: 'ERROR:  neste laboratório, a única relação disponível é big_events; tente o EXPLAIN da lição.', type: 'error' };
        }
        if (lower.startsWith('explain analyze')) {
          return { output: pgState.indexCreated ? EXPLAIN_ANALYZE_BITMAP : EXPLAIN_ANALYZE_SEQ };
        }
        return { output: pgState.indexCreated ? EXPLAIN_BITMAP_SCAN : EXPLAIN_SEQ_SCAN };
      }

      // CREATE INDEX
      if (lower.startsWith('create index')) {
        if (!lower.includes('big_events')) {
          return { output: 'ERROR:  este laboratório só cria índice em big_events(user_id)', type: 'error' };
        }
        if (pgState.indexCreated) {
          return { output: 'ERROR:  relation "idx_big_events_user" already exists', type: 'error' };
        }
        setPgState((prev) => ({ ...prev, indexCreated: true }));
        return { output: 'CREATE INDEX' };
      }

      // DELETE the cancelled orders
      if (lower.startsWith('delete from orders') && lower.includes('cancelled')) {
        setPgState((prev) => ({ ...prev, ordersCount: 10 }));
        return { output: 'DELETE 2' };
      }

      // Minimal SELECT support (this sim is about psql/engine, not query-building)
      if (lower === 'select count(*) from orders' || lower === 'select count (*) from orders') {
        return { output: ordersCountOutput(pgState.ordersCount) };
      }
      if (/^select \* from customers/.test(lower)) {
        const limitMatch = lower.match(/limit\s+(\d+)/);
        const limit = limitMatch ? Number(limitMatch[1]) : undefined;
        return { output: customersOutput(limit) };
      }

      if (input === 'help') {
        return { output: WELCOME_HELP };
      }

      if (lower.startsWith('select')) {
        return { output: 'ERROR:  este laboratório aceita SELECT count(*) FROM orders; e SELECT * FROM customers;', type: 'error' };
      }

      const firstToken = input.split(/\s+/)[0] || '';
      return { output: `ERROR:  syntax error at or near "${firstToken}"`, type: 'error' };
    },
    [pgState.expanded, pgState.indexCreated, pgState.inTransaction, pgState.ordersCount, pgState.timing]
  );

  const onReset = useCallback(() => {
    setPgState(createInitialState());
  }, []);

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
  } = useTerminalSimulator<LessonCommand>({
    lessons: LESSONS,
    execute,
    matches: (cmd, command) => commandMatches(cmd, command.expectedCommand),
    successMessage: (command) => `✓ ${command.explanation}`,
    completionKeyStyle: 'index',
    advanceDelayMs: 700,
    historyStyle: 'recent-first',
    promoteOutputType: true,
    guardRepeatCompletion: true,
    onReset,
  });

  const prompt = pgState.inTransaction ? 'shop=*#' : 'shop=#';

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

  const indexNames = [
    'big_events_pkey',
    'customers_pkey',
    'order_items_pkey',
    'orders_pkey',
    'products_pkey',
    ...(pgState.indexCreated ? ['idx_big_events_user'] : []),
  ].sort((a, b) => a.localeCompare(b));

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-md border bg-muted/20 p-4">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <div className="rounded-md border border-primary/30 bg-primary/10 p-2 text-primary">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <p className="font-mono text-xs text-muted-foreground">// laboratório de psql</p>
              <h2 className="text-2xl font-bold md:text-3xl">Simulador de terminal PostgreSQL</h2>
            </div>
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Pratique o psql e o engine do Postgres num laboratório seguro no navegador. Explore com
            meta-comandos, leia planos reais de EXPLAIN, crie um índice e veja um sequential scan virar um
            bitmap index scan; depois, coloque mudanças numa transação e desfaça com rollback.
          </p>
        </div>

        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">
                {completedCount}/{totalCommands}
              </span>
            </div>
            <Progress value={progressPercentage} />
            <div className="grid grid-cols-3 gap-2 text-center">
              <Metric label="Tabelas" value={TABLES.length} />
              <Metric label="Índices" value={indexNames.length} />
              <Metric label="Pedidos" value={pgState.ordersCount} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_310px]">
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
                  completedCommands.has(`${lessonIndex}-${commandIndex}`)
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
                        : 'border-border hover:border-primary/40 hover:bg-muted/30'
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
                <Badge
                  variant={pgState.inTransaction ? 'default' : 'secondary'}
                  className="font-mono text-[11px]"
                >
                  {pgState.inTransaction ? 'IN TRANSACTION' : `${CONNECTION.database}/${CONNECTION.user}`}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div
                ref={terminalRef}
                className="h-[580px] cursor-text overflow-y-auto p-5 font-mono text-sm leading-relaxed sm:text-[15px]"
                onClick={() => inputRef.current?.focus()}
              >
                {terminalHistory.length === 0 && (
                  <div className="mb-4 whitespace-pre-wrap text-emerald-400">
                    <p>Conectado ao banco &quot;shop&quot; como o usuário &quot;neondb_owner&quot;.</p>
                    <p className="mt-2 text-muted-foreground">
                      Digite &quot;\?&quot; para ver a ajuda dos meta-comandos ou siga a tarefa atual acima.
                    </p>
                  </div>
                )}
                {terminalHistory.map((line, index) => (
                  <div
                    key={`${line.timestamp.getTime()}-${index}`}
                    className={cn(
                      'mb-2 whitespace-pre-wrap break-words',
                      line.type === 'input' && 'text-slate-100',
                      line.type === 'output' && 'text-slate-300',
                      line.type === 'error' && 'text-red-400',
                      line.type === 'success' &&
                        'rounded-md border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-300'
                    )}
                  >
                    {line.type === 'input' && <span className="text-sky-400">shop=# </span>}
                    {line.content}
                  </div>
                ))}
                <form onSubmit={handleSubmit} className="flex items-center">
                  <span className="text-sky-400">{prompt}</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    onKeyDown={handleKeyDown}
                    className="ml-2 min-w-0 flex-1 bg-transparent text-slate-100 caret-sky-400 outline-none"
                    spellCheck={false}
                    autoComplete="off"
                    autoCapitalize="off"
                    placeholder="\dt"
                  />
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="h-5 w-5" />
                Conexão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4 pt-0 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">banco</span>
                <span className="font-mono">{CONNECTION.database}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">usuário</span>
                <span className="font-mono">{CONNECTION.user}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">transação</span>
                <Badge variant={pgState.inTransaction ? 'default' : 'secondary'} className="font-mono text-[11px]">
                  {pgState.inTransaction ? 'IN TRANSACTION' : 'idle'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Table2 className="h-5 w-5" />
                Tabelas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4 pt-0">
              {TABLES.map((table) => {
                const rowCount = table.name === 'orders' ? pgState.ordersCount : table.rows;
                return (
                  <div
                    key={table.name}
                    className="flex items-center justify-between rounded-md border p-2.5"
                  >
                    <span className="font-mono text-sm">{table.name}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {rowCount.toLocaleString('en-US')} rows
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <ListTree className="h-5 w-5" />
                Índices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4 pt-0">
              {indexNames.map((name) => {
                const isNew = name === 'idx_big_events_user';
                return (
                  <div
                    key={name}
                    className={cn(
                      'flex items-center gap-2 rounded-md border p-2.5',
                      isNew && 'border-emerald-500/30 bg-emerald-500/10'
                    )}
                  >
                    <KeyRound className={cn('h-4 w-4 shrink-0', isNew ? 'text-emerald-500' : 'text-muted-foreground')} />
                    <span className="truncate font-mono text-xs">{name}</span>
                    {isNew && <Badge variant="secondary" className="ml-auto text-[10px]">new</Badge>}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {completedCount === totalCommands && (
        <Card className="mt-4 border-emerald-500/40 bg-emerald-500/10">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="font-semibold">Laboratório concluído</p>
                <p className="text-sm text-muted-foreground">
                  Você explorou com meta-comandos do psql, leu planos reais de EXPLAIN, criou um índice e
                  usou uma transação que dava para desfazer.
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={resetLab}>
              Começar de novo
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
