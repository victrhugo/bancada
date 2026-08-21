'use client';

import { useMemo, useState } from 'react';
import {
  ACTION_LABELS,
  BOUNCE_SCENARIOS,
  KIND_HINTS,
  KIND_LABELS,
  type BounceAction,
  type BounceKind,
  type BounceScenario,
} from '@/lib/games/bounce-scenarios';

const KINDS: BounceKind[] = ['hard', 'soft', 'block', 'complaint'];
const ACTIONS: BounceAction[] = ['suppress', 'retry', 'fix-content', 'slow-down'];

interface Answer {
  kind: BounceKind | null;
  action: BounceAction | null;
}

function scoreOf(scenario: BounceScenario, answer: Answer) {
  const kindRight = answer.kind === scenario.kind;
  const actionRight = answer.action === scenario.action;
  return { kindRight, actionRight, both: kindRight && actionRight };
}

export default function BounceTriageSimulator() {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<Answer>({ kind: null, action: null });
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);

  const scenario = BOUNCE_SCENARIOS[index];
  const isLast = index === BOUNCE_SCENARIOS.length - 1;
  const finished = results.length === BOUNCE_SCENARIOS.length;

  const result = useMemo(
    () => (revealed ? scoreOf(scenario, answer) : null),
    [revealed, scenario, answer],
  );

  const correctCount = results.filter(Boolean).length;

  function submit() {
    if (!answer.kind || !answer.action || revealed) return;
    setRevealed(true);
    setResults((prev) => [...prev, scoreOf(scenario, answer).both]);
  }

  function next() {
    if (isLast) return;
    setIndex((i) => i + 1);
    setAnswer({ kind: null, action: null });
    setRevealed(false);
  }

  function restart() {
    setIndex(0);
    setAnswer({ kind: null, action: null });
    setRevealed(false);
    setResults([]);
  }

  if (finished && revealed && isLast) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Triagem concluída</p>
          <p className="mt-3 font-mono text-5xl font-semibold tabular-nums">
            {correctCount}
            <span className="text-2xl text-muted-foreground">/{BOUNCE_SCENARIOS.length}</span>
          </p>
          <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
            {correctCount === BOUNCE_SCENARIOS.length
              ? 'Todas certas, incluindo os códigos 5xx que não são permanentes. Essa distinção é a que a maioria dos remetentes erra.'
              : correctCount >= BOUNCE_SCENARIOS.length - 3
                ? 'Sólido. As que as pessoas costumam errar são as respostas 5xx que na verdade são sobre conteúdo ou ritmo, não o endereço.'
                : 'Vale outra rodada. O padrão pra guardar: o dígito da classe é uma dica, não a resposta.'}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-1.5">
            {results.map((ok, i) => (
              <span
                key={i}
                title={BOUNCE_SCENARIOS[i].response.slice(0, 60)}
                className={`h-2.5 w-2.5 rounded-full ${ok ? 'bg-emerald-500' : 'bg-rose-500'}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={restart}
            className="mt-8 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Rodar de novo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Progress */}
      <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Bounce {index + 1} de {BOUNCE_SCENARIOS.length}
        </span>
        <span className="tabular-nums">
          {correctCount} corretas
        </span>
      </div>
      <div className="mb-6 h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${(results.length / BOUNCE_SCENARIOS.length) * 100}%` }}
        />
      </div>

      {/* The bounce itself */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>
            Para <span className="font-mono text-foreground">{scenario.recipient}</span>
          </span>
          <span>via {scenario.provider}</span>
        </div>
        <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-md bg-muted/60 p-4 font-mono text-sm leading-relaxed text-foreground">
{scenario.response}
        </pre>
      </div>

      {/* Question 1 */}
      <fieldset className="mt-6" disabled={revealed}>
        <legend className="mb-2 text-sm font-semibold">Que tipo de falha é essa?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {KINDS.map((kind) => {
            const selected = answer.kind === kind;
            const isCorrect = revealed && kind === scenario.kind;
            const isWrongPick = revealed && selected && kind !== scenario.kind;
            return (
              <button
                key={kind}
                type="button"
                onClick={() => setAnswer((a) => ({ ...a, kind }))}
                className={`rounded-md border p-3 text-left text-sm transition-colors ${
                  isCorrect
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : isWrongPick
                      ? 'border-rose-500 bg-rose-500/10'
                      : selected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                }`}
              >
                <span className="font-medium">{KIND_LABELS[kind]}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{KIND_HINTS[kind]}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Question 2 */}
      <fieldset className="mt-5" disabled={revealed}>
        <legend className="mb-2 text-sm font-semibold">O que você faz com isso?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {ACTIONS.map((action) => {
            const selected = answer.action === action;
            const isCorrect = revealed && action === scenario.action;
            const isWrongPick = revealed && selected && action !== scenario.action;
            return (
              <button
                key={action}
                type="button"
                onClick={() => setAnswer((a) => ({ ...a, action }))}
                className={`rounded-md border p-3 text-left text-sm transition-colors ${
                  isCorrect
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : isWrongPick
                      ? 'border-rose-500 bg-rose-500/10'
                      : selected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                }`}
              >
                <span className="font-medium">{ACTION_LABELS[action]}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Answer */}
      {revealed && result && (
        <div className="mt-6 rounded-lg border border-border bg-card p-5">
          <p
            className={`text-sm font-semibold ${
              result.both ? 'text-emerald-500' : 'text-rose-500'
            }`}
          >
            {result.both
              ? 'As duas certas.'
              : result.kindRight
                ? 'Diagnóstico certo, tratamento errado.'
                : result.actionRight
                  ? 'Ação certa, mas pelo motivo errado.'
                  : 'Não dessa vez.'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="text-foreground">{KIND_LABELS[scenario.kind]}</span>
            {' · '}
            <span className="text-foreground">{ACTION_LABELS[scenario.action]}</span>
          </p>

          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{scenario.explanation}</p>

          <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              O que custa errar essa
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{scenario.consequence}</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={restart}
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Recomeçar
        </button>

        {!revealed ? (
          <button
            type="button"
            onClick={submit}
            disabled={!answer.kind || !answer.action}
            className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Fazer triagem
          </button>
        ) : !isLast ? (
          <button
            type="button"
            onClick={next}
            className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Próximo bounce
          </button>
        ) : null}
      </div>
    </div>
  );
}
