/**
 * POST /api/tutor — RAG over the Bancada content.
 *
 * The file uses the `.api.ts` extension on purpose: next.config only registers that
 * extension on server deployments (Vercel). Static exports (Docker, Cloudflare, local
 * `out/`) skip it, so `output: 'export'` keeps working there.
 */
import { NextResponse } from 'next/server';
import { answerQuestion } from '@/lib/rag/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const MAX_QUESTION = 500;
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

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (limited(ip)) {
    return NextResponse.json(
      { error: 'Muitas perguntas em pouco tempo. Espere um minuto e tente de novo.' },
      { status: 429 }
    );
  }

  let question = '';
  try {
    const body = (await request.json()) as { question?: unknown };
    question = typeof body.question === 'string' ? body.question.trim() : '';
  } catch {
    // fall through to validation
  }
  if (question.length < 3) {
    return NextResponse.json({ error: 'Escreva uma pergunta.' }, { status: 400 });
  }
  if (question.length > MAX_QUESTION) {
    return NextResponse.json(
      { error: `A pergunta pode ter no máximo ${MAX_QUESTION} caracteres.` },
      { status: 400 }
    );
  }

  try {
    const result = await answerQuestion(question);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json(
      { error: 'O tutor falhou ao responder. Tente de novo.' },
      { status: 500 }
    );
  }
}
