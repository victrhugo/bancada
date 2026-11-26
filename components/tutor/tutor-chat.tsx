'use client';

import Link from 'next/link';
import { Fragment, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { AlertTriangle, ArrowUp, BookOpen, Loader2, Search, Sparkles } from 'lucide-react';
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

interface TutorResponse {
  answer: string | null;
  sources: Source[];
  retrieval: 'hybrid' | 'keyword';
  model: string | null;
  notice?: string;
  error?: string;
}

interface Turn {
  question: string;
  response?: TutorResponse;
  error?: string;
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
function renderInline(text: string, sources: Source[]): ReactNode[] {
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
                href={`#fonte-${n}`}
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

function Answer({ text, sources }: { text: string; sources: Source[] }) {
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
                    <li key={k}>{renderInline(l.replace(/^\s*([-*]|\d+\.)\s+/, ''), sources)}</li>
                  ))}
                </ul>
              ) : (
                <p key={j}>{renderInline(g.lines.join(' ').replace(/^#+\s*/, ''), sources)}</p>
              )
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

function Sources({ sources }: { sources: Source[] }) {
  return (
    <div className="mt-4 space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <BookOpen className="h-3.5 w-3.5" /> Fontes
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {sources.map((s) => (
          <Link
            key={s.n}
            id={`fonte-${s.n}`}
            href={s.url}
            className="group rounded-md border bg-background p-3 transition-colors hover:border-primary/50"
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
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{s.snippet}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function TutorChat() {
  const [question, setQuestion] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  async function ask(text: string) {
    const q = text.trim();
    if (q.length < 3 || loading) return;
    setQuestion('');
    setLoading(true);
    setTurns((prev) => [...prev, { question: q }]);
    let turn: Turn = { question: q };
    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });
      if (res.status === 404 || res.status === 405) {
        turn.error =
          'O tutor só funciona na versão publicada do site (ele precisa de uma função no servidor). Nesta versão estática ele não está disponível.';
      } else {
        const data = (await res.json()) as TutorResponse;
        turn = res.ok
          ? { question: q, response: data }
          : { question: q, error: data.error ?? 'Erro inesperado.' };
      }
    } catch {
      turn.error = 'Não consegui falar com o tutor. Verifique sua conexão e tente de novo.';
    }
    setTurns((prev) => [...prev.slice(0, -1), turn]);
    setLoading(false);
    inputRef.current?.focus();
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void ask(question);
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="space-y-6 p-4 sm:p-6">
        {turns.length === 0 && (
          <div>
            <p className="mb-3 text-sm text-muted-foreground">Experimente uma destas perguntas:</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((e) => (
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
            <div className="rounded-lg border bg-muted/20 p-4">
              {!turn.response && !turn.error && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Buscando no conteúdo da Bancada e
                  escrevendo a resposta...
                </p>
              )}
              {turn.error && (
                <p className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {turn.error}
                </p>
              )}
              {turn.response && (
                <>
                  <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Search className="h-3 w-3" />
                      {turn.response.retrieval === 'hybrid'
                        ? 'busca híbrida (palavras-chave + embeddings)'
                        : 'busca por palavras-chave (BM25)'}
                    </span>
                    {turn.response.model && (
                      <span className="inline-flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> {turn.response.model}
                      </span>
                    )}
                  </div>
                  {turn.response.answer && (
                    <Answer text={turn.response.answer} sources={turn.response.sources} />
                  )}
                  {turn.response.notice && (
                    <p className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {turn.response.notice}
                    </p>
                  )}
                  {turn.response.sources.length > 0 && <Sources sources={turn.response.sources} />}
                </>
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
          rows={2}
          placeholder="Pergunte sobre DevOps, cloud, bancos de dados ou IA..."
          aria-label="Sua pergunta para o tutor"
          className="min-h-[44px] resize-none"
          disabled={loading}
        />
        <Button
          type="submit"
          size="icon"
          disabled={loading || question.trim().length < 3}
          aria-label="Enviar pergunta"
          className={cn('h-11 w-11 shrink-0')}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
        </Button>
      </form>
      <p className="px-4 pb-3 text-[11px] text-muted-foreground">
        As respostas são geradas por IA a partir do conteúdo do site e podem conter erros. Confira
        nas fontes.
      </p>
    </div>
  );
}
