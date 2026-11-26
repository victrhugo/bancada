/**
 * POST /api/tutor — RAG chat over the Bancada content.
 *
 * Body: { question: string, history?: { role, content }[], page?: string }
 * Response: NDJSON stream of TutorEvent (meta → delta… → done).
 *
 * The file uses the `.api.ts` extension on purpose: next.config only registers that
 * extension on server deployments (Vercel). Static exports (Docker, Cloudflare, local
 * `out/`) skip it, so `output: 'export'` keeps working there.
 */
import { NextResponse } from 'next/server';
import { askTutor } from '@/lib/rag/server';
import type { HistoryTurn } from '@/lib/rag/retrieve';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_QUESTION = 500;
const MAX_HISTORY = 10;
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 8;

// Best-effort per-instance limit; enough to protect the free-tier quota from a loop.
const hits = new Map<string, number[]>();

function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

function parseHistory(value: unknown): HistoryTurn[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (t): t is HistoryTurn =>
        typeof t === 'object' &&
        t !== null &&
        ((t as HistoryTurn).role === 'user' || (t as HistoryTurn).role === 'assistant') &&
        typeof (t as HistoryTurn).content === 'string'
    )
    .slice(-MAX_HISTORY)
    .map((t) => ({ role: t.role, content: t.content.slice(0, 2000) }));
}

function parsePage(value: unknown): string | undefined {
  return typeof value === 'string' && /^\/[\w\-/]{0,200}$/.test(value) ? value : undefined;
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (limited(ip)) {
    return NextResponse.json(
      { error: 'Muitas perguntas em pouco tempo. Espere um minuto e tente de novo.' },
      { status: 429 }
    );
  }

  let body: { question?: unknown; history?: unknown; page?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    // fall through to validation
  }
  const question = typeof body.question === 'string' ? body.question.trim() : '';
  if (question.length < 2) {
    return NextResponse.json({ error: 'Escreva uma pergunta.' }, { status: 400 });
  }
  if (question.length > MAX_QUESTION) {
    return NextResponse.json(
      { error: `A pergunta pode ter no máximo ${MAX_QUESTION} caracteres.` },
      { status: 400 }
    );
  }

  const events = askTutor({
    question,
    history: parseHistory(body.history),
    page: parsePage(body.page),
  });
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { value, done } = await events.next();
        if (done) {
          controller.close();
          return;
        }
        controller.enqueue(encoder.encode(`${JSON.stringify(value)}\n`));
      } catch {
        controller.enqueue(
          encoder.encode(
            `${JSON.stringify({ type: 'notice', text: 'O tutor falhou ao responder. Tente de novo.' })}\n${JSON.stringify({ type: 'done', model: null })}\n`
          )
        );
        controller.close();
      }
    },
    async cancel() {
      await events.return(undefined);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Accel-Buffering': 'no',
    },
  });
}
