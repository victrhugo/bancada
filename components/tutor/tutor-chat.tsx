'use client';

import Link from 'next/link';
import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import {
  AlertTriangle,
  ArrowUp,
  BookOpen,
  Loader2,
  RotateCcw,
  Search,
  Sparkles,
  Square,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface Source {
  n: number;
  title: string;
  section?: string;
  url: string;
  type: string;
  snippet: string;
}

type TutorEvent =
  | { type: 'meta'; sources: Source[]; retrieval: 'hybrid' | 'keyword'; searchQuery?: string }
  | { type: 'delta'; text: string }
  | { type: 'done'; model: string | null }
  | { type: 'notice'; text: string };

interface Turn {
  question: string;
  answer: string;
  sources: Source[];
  retrieval?: 'hybrid' | 'keyword';
  searchQuery?: string;
  model?: string | null;
  notice?: string;
  error?: string;
  status: 'searching' | 'streaming' | 'done';
}

const EXAMPLES = [
  'O que é RAG e quando usar em vez de fine-tuning?',
  'Como faço rollback de um deploy no Kubernetes?',
  'Qual a diferença entre um Service ClusterIP e um NodePort?',
  'Como funciona um índice B-tree no PostgreSQL?',
];

const TYPE_LABELS: Record<string, string> = {
  quiz: 'Quiz',
  flashcard: 'Flashcard',
  checklist: 'Checklist',
  exercise: 'Exercício',
  'interview-question': 'Entrevista',
  game: 'Simulador',
  roadmap: 'Trilha',
};

/** Render **bold**, `code` and [n] citations; paragraphs and "- " lists. */
function renderInline(text: string, sources: Source[], prefix: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[\d+(?:,\s*\d+)*\])/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`'))
      return (
        <code key={i} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
          {part.slice(1, -1)}
        </code>
      );
    const cite = part.match(/^\[(\d+(?:,\s*\d+)*)\]$/);
    if (cite) {
      return (
        <Fragment key={i}>
          {cite[1].split(/,\s*/).map((n) => {
            const source = sources.find((s) => s.n === Number(n));
            return source ? (
              <a
                key={n}
                href={`#${prefix}-fonte-${n}`}
                title={source.title}
                className="mx-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded bg-primary/15 px-1 align-super text-[10px] font-semibold text-primary no-underline hover:bg-primary/25"
              >
                {n}
              </a>
            ) : null;
          })}
        </Fragment>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

function Answer({ text, sources, prefix }: { text: string; sources: Source[]; prefix: string }) {
  // Split out fenced code first so blank lines inside code do not break it apart.
  const segments = text.split(/(```[\s\S]*?```)/g);
  const blocks = segments.flatMap((seg) => (seg.startsWith('```') ? [seg] : seg.split(/\n{2,}/)));
  return (
    <div className="space-y-3 text-sm leading-relaxed">
      {blocks.map((block, i) => {
        if (block.startsWith('```')) {
          const code = block
            .replace(/^```[\w-]*\n?/, '')
            .replace(/```$/, '')
            .trimEnd();
          return (
            <pre
              key={i}
              className="overflow-x-auto rounded-md bg-slate-950 p-3 font-mono text-xs text-slate-100"
            >
              <code>{code}</code>
            </pre>
          );
        }
        if (!block.trim()) return null;
        // Group consecutive list lines into <ul>; everything else becomes a paragraph.
        const isItem = (l: string) => /^\s*([-*]|\d+\.)\s+/.test(l);
        const groups: { list: boolean; lines: string[] }[] = [];
        for (const line of block.split('\n').filter((l) => l.trim())) {
          const last = groups[groups.length - 1];
          if (last && last.list === isItem(line) && last.list) last.lines.push(line);
          else if (last && !last.list && !isItem(line)) last.lines.push(line);
          else groups.push({ list: isItem(line), lines: [line] });
        }
        return (
          <Fragment key={i}>
            {groups.map((g, j) =>
              g.list ? (
                <ul key={j} className="list-disc space-y-1 pl-5">
                  {g.lines.map((l, k) => (
                    <li key={k}>
                      {renderInline(l.replace(/^\s*([-*]|\d+\.)\s+/, ''), sources, prefix)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p key={j}>
                  {renderInline(g.lines.join(' ').replace(/^#+\s*/, ''), sources, prefix)}
                </p>
              )
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

function Sources({
  sources,
  prefix,
  compact = false,
}: {
  sources: Source[];
  prefix: string;
  compact?: boolean;
}) {
  return (
    <div className="mt-4 space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <BookOpen className="h-3.5 w-3.5" /> Fontes
      </p>
      <div className={cn('grid grid-cols-1 gap-2', !compact && 'sm:grid-cols-2')}>
        {sources.map((s) => (
          <Link
            key={s.n}
            id={`${prefix}-fonte-${s.n}`}
            href={s.url}
            className={cn(
              'group min-w-0 overflow-hidden rounded-md border bg-background transition-colors hover:border-primary/50',
              compact ? 'px-3 py-2' : 'p-3'
            )}
          >
            <div className="mb-1 flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/15 text-[11px] font-semibold text-primary">
                {s.n}
              </span>
              <span className="truncate text-sm font-medium group-hover:text-primary">
                {s.title}
              </span>
              <Badge variant="secondary" className="ml-auto shrink-0 text-[10px]">
                {TYPE_LABELS[s.type] ?? s.type}
              </Badge>
            </div>
            {s.section && <p className="truncate text-xs text-muted-foreground">{s.section}</p>}
            {!compact && (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{s.snippet}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

const STORAGE_KEY = 'bancada-tutor-chat';
const STATIC_MESSAGE =
  'O tutor só funciona na versão publicada do site (ele precisa de uma função no servidor). Nesta versão estática ele não está disponível.';

function loadTurns(): Turn[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const turns = raw ? (JSON.parse(raw) as Turn[]) : [];
    return Array.isArray(turns) ? turns.filter((t) => t.status === 'done') : [];
  } catch {
    return [];
  }
}

function saveTurns(turns: Turn[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(turns.slice(-20)));
  } catch {
    // private mode or quota: the chat still works, it just is not restored
  }
}

/** Conversation memory sent to the API: completed turns only, answers trimmed server-side. */
function toHistory(turns: Turn[]) {
  return turns
    .filter((t) => t.status === 'done' && t.answer)
    .slice(-3)
    .flatMap((t) => [
      { role: 'user' as const, content: t.question },
      { role: 'assistant' as const, content: t.answer },
    ]);
}

export interface TutorChatProps {
  /** `page` is the full /tutor layout; `widget` is the compact floating panel. */
  variant?: 'page' | 'widget';
  /** Path the reader is on, so retrieval can favor that page's content. */
  page?: string;
}

export function TutorChat({ variant = 'page', page }: TutorChatProps) {
  const compact = variant === 'widget';
  const [question, setQuestion] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Restore the conversation after a reload; shared by the page and the floating widget.
  // Done after mount (not in the initial state) so server and client render the same HTML.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setTurns(loadTurns()), []);
  useEffect(() => {
    if (!loading) saveTurns(turns);
  }, [turns, loading]);
  useEffect(() => {
    const el = scrollRef.current;
    if (compact && el) el.scrollTop = el.scrollHeight;
  }, [turns, compact]);

  const update = useCallback((patch: (t: Turn) => Turn) => {
    setTurns((prev) => [...prev.slice(0, -1), patch(prev[prev.length - 1])]);
  }, []);

  async function ask(text: string) {
    const q = text.trim();
    if (q.length < 2 || loading) return;
    const history = toHistory(turns);
    setQuestion('');
    setLoading(true);
    setTurns((prev) => [...prev, { question: q, answer: '', sources: [], status: 'searching' }]);

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, history, page }),
        signal: controller.signal,
      });
      if (res.status === 404 || res.status === 405) {
        update((t) => ({ ...t, error: STATIC_MESSAGE, status: 'done' }));
      } else if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        update((t) => ({ ...t, error: data.error ?? 'Erro inesperado.', status: 'done' }));
      } else {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, nl).trim();
            buffer = buffer.slice(nl + 1);
            if (!line) continue;
            const event = JSON.parse(line) as TutorEvent;
            if (event.type === 'meta') {
              update((t) => ({
                ...t,
                sources: event.sources,
                retrieval: event.retrieval,
                searchQuery: event.searchQuery,
                status: 'streaming',
              }));
            } else if (event.type === 'delta') {
              update((t) => ({ ...t, answer: t.answer + event.text, status: 'streaming' }));
            } else if (event.type === 'notice') {
              update((t) => ({ ...t, notice: event.text }));
            } else if (event.type === 'done') {
              update((t) => ({ ...t, model: event.model, status: 'done' }));
            }
          }
        }
        update((t) => ({ ...t, status: 'done' }));
      }
    } catch (error) {
      const aborted = (error as Error).name === 'AbortError';
      update((t) => ({
        ...t,
        status: 'done',
        notice: aborted ? 'Resposta interrompida.' : t.notice,
        error:
          aborted || t.answer
            ? t.error
            : 'Não consegui falar com o tutor. Verifique sua conexão e tente de novo.',
      }));
    }
    abortRef.current = null;
    setLoading(false);
    inputRef.current?.focus();
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void ask(question);
  }

  function reset() {
    abortRef.current?.abort();
    setTurns([]);
    saveTurns([]);
  }

  const examples = compact ? EXAMPLES.slice(0, 2) : EXAMPLES;

  return (
    <div
      className={cn(
        'flex flex-col bg-card',
        compact ? 'h-full min-h-0' : 'rounded-xl border shadow-sm'
      )}
    >
      <div
        ref={scrollRef}
        className={cn('space-y-6', compact ? 'min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4' : 'p-4 sm:p-6')}
      >
        {turns.length === 0 && (
          <div>
            <p className="mb-3 text-sm text-muted-foreground">
              {compact
                ? 'Pergunte qualquer coisa sobre o conteúdo do site. Eu respondo com base nele e mostro as fontes.'
                : 'Experimente uma destas perguntas:'}
            </p>
            <div className="flex flex-wrap gap-2">
              {examples.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => void ask(e)}
                  className="rounded-full border px-3 py-1.5 text-left text-sm transition-colors hover:border-primary/50 hover:bg-primary/5"
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        )}

        {turns.map((turn, i) => (
          <div key={i} className="space-y-3">
            <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-sm text-primary-foreground">
              {turn.question}
            </div>
            <div className={cn('rounded-lg border bg-muted/20', compact ? 'p-3' : 'p-4')}>
              {turn.status === 'searching' && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Buscando no conteúdo da Bancada...
                </p>
              )}
              {turn.retrieval && (
                <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Search className="h-3 w-3" />
                    {turn.retrieval === 'hybrid'
                      ? 'busca híbrida (palavras-chave + embeddings)'
                      : 'busca por palavras-chave (BM25)'}
                  </span>
                  {turn.searchQuery && (
                    <span className="italic" title="Pergunta reescrita com o contexto da conversa">
                      buscou: “{turn.searchQuery}”
                    </span>
                  )}
                  {turn.model && (
                    <span className="inline-flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> {turn.model}
                    </span>
                  )}
                </div>
              )}
              {turn.answer && (
                <Answer text={turn.answer} sources={turn.sources} prefix={`${variant}-${i}`} />
              )}
              {turn.status === 'streaming' && !turn.answer && !turn.notice && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Escrevendo a resposta...
                </p>
              )}
              {turn.status === 'streaming' && turn.answer && (
                <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-primary/60 align-middle" />
              )}
              {(turn.notice || turn.error) && (
                <p className="mt-2 flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {turn.error ?? turn.notice}
                </p>
              )}
              {turn.status === 'done' && turn.sources.length > 0 && (
                <Sources sources={turn.sources} prefix={`${variant}-${i}`} compact={compact} />
              )}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} className="flex items-end gap-2 border-t p-3 sm:p-4">
        <Textarea
          ref={inputRef}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void ask(question);
            }
          }}
          maxLength={500}
          rows={compact ? 1 : 2}
          placeholder={
            turns.length
              ? 'Pergunte mais...'
              : compact
                ? 'Faça uma pergunta...'
                : 'Pergunte sobre DevOps, cloud, bancos de dados ou IA...'
          }
          aria-label="Sua pergunta para o tutor"
          className="min-h-[44px] resize-none"
          disabled={loading}
        />
        {loading ? (
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => abortRef.current?.abort()}
            aria-label="Parar resposta"
            className="h-11 w-11 shrink-0"
          >
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            disabled={question.trim().length < 2}
            aria-label="Enviar pergunta"
            className="h-11 w-11 shrink-0"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        )}
      </form>
      <div className="flex items-center justify-between gap-2 px-4 pb-3 text-[11px] text-muted-foreground">
        <p>Respostas geradas por IA a partir do site; podem conter erros. Confira nas fontes.</p>
        {turns.length > 0 && !loading && (
          <button
            type="button"
            onClick={reset}
            className="inline-flex shrink-0 items-center gap-1 hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" /> Nova conversa
          </button>
        )}
      </div>
    </div>
  );
}
