/**
 * Server-side RAG chat pipeline:
 *
 *   history + question ─► rewrite (follow-ups become standalone queries)
 *                       ─► hybrid retrieval (BM25 + embeddings, boosted for the current page)
 *                       ─► grounded generation, streamed token by token
 *
 * The index is loaded once per serverless instance.
 */
// Bundled with the function at build time; regenerate with `pnpm rag:index`.
import indexData from '@/data/rag/index.json';
import {
  buildBm25,
  buildChatMessages,
  buildRewritePrompt,
  decodeVector,
  hybridSearch,
  quantize,
  type Bm25Model,
  type HistoryTurn,
  type RagChunk,
  type RagIndex,
  type ScoredChunk,
} from './retrieve';
import { chat, chatStream, embed } from './gemini';

interface LoadedIndex {
  chunks: RagChunk[];
  vectors: (Int8Array | null)[];
  bm25: Bm25Model;
  hasVectors: boolean;
}

let cached: LoadedIndex | null = null;

export function loadIndex(raw: RagIndex = indexData as RagIndex): LoadedIndex {
  if (cached) return cached;
  const vectors = raw.vectors.map((v) => (v ? decodeVector(v) : null));
  cached = {
    chunks: raw.chunks,
    vectors,
    bm25: buildBm25(raw.chunks),
    hasVectors: vectors.some(Boolean),
  };
  return cached;
}

export interface TutorSource {
  n: number;
  title: string;
  section?: string;
  url: string;
  type: string;
  snippet: string;
}

/** Events sent to the browser, one JSON object per line (NDJSON). */
export type TutorEvent =
  | {
      type: 'meta';
      sources: TutorSource[];
      /** 'hybrid' when the query was embedded, 'keyword' when only BM25 ran. */
      retrieval: 'hybrid' | 'keyword';
      /** The standalone query used for retrieval, when the question was rewritten. */
      searchQuery?: string;
    }
  | { type: 'delta'; text: string }
  | { type: 'done'; model: string | null }
  | { type: 'notice'; text: string };

function toSources(results: ScoredChunk[]): TutorSource[] {
  return results.map((r, i) => ({
    n: i + 1,
    title: r.chunk.title,
    section: r.chunk.section,
    url: r.chunk.url,
    type: r.chunk.type,
    snippet: r.chunk.text.length > 280 ? `${r.chunk.text.slice(0, 277)}...` : r.chunk.text,
  }));
}

/** Follow-ups need the conversation to be searchable; first questions do not. */
async function standaloneQuery(question: string, history: HistoryTurn[]): Promise<string> {
  if (history.length === 0 || !process.env.GEMINI_API_KEY) return question;
  try {
    const { text } = await chat(buildRewritePrompt(question, history), {
      timeoutMs: 8000,
      maxTokens: 80,
    });
    const line = text
      .split('\n')[0]
      .replace(/^["'“]|["'”]$/g, '')
      .trim();
    return line.length >= 3 && line.length <= 300 ? line : question;
  } catch {
    // Cheap fallback: the previous question usually carries the missing subject.
    const lastUser = [...history].reverse().find((t) => t.role === 'user')?.content ?? '';
    return `${lastUser} ${question}`.trim();
  }
}

export interface AskInput {
  question: string;
  history?: HistoryTurn[];
  page?: string;
}

export async function* askTutor({
  question,
  history = [],
  page,
}: AskInput): AsyncGenerator<TutorEvent> {
  const index = loadIndex();
  const searchQuery = await standaloneQuery(question, history);

  let queryVector: Int8Array | null = null;
  if (index.hasVectors && process.env.GEMINI_API_KEY) {
    try {
      const [v] = await embed([searchQuery], 8000);
      queryVector = quantize(v);
    } catch {
      // Embedding quota or outage: keyword retrieval still works.
    }
  }

  const results = hybridSearch(index.chunks, index.bm25, index.vectors, searchQuery, queryVector, {
    limit: 6,
    pageUrl: page,
  });

  yield {
    type: 'meta',
    sources: toSources(results),
    retrieval: queryVector ? 'hybrid' : 'keyword',
    searchQuery: searchQuery !== question ? searchQuery : undefined,
  };

  if (results.length === 0) {
    yield {
      type: 'delta',
      text: 'Não encontrei nada no conteúdo da Bancada sobre isso. Tente reformular com termos técnicos (por exemplo, "rollback no Kubernetes" ou "o que é embedding") ou explore as trilhas do site.',
    };
    yield { type: 'done', model: null };
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    yield {
      type: 'notice',
      text: 'A geração de respostas não está configurada neste deploy. Estes são os trechos mais relevantes.',
    };
    yield { type: 'done', model: null };
    return;
  }

  let model: string | null = null;
  let wrote = false;
  try {
    for await (const chunk of chatStream(buildChatMessages(question, results, history))) {
      model = chunk.model;
      wrote = true;
      yield { type: 'delta', text: chunk.delta };
    }
  } catch {
    yield {
      type: 'notice',
      text: wrote
        ? 'A resposta foi interrompida (limite do plano gratuito ou instabilidade). Confira as fontes abaixo.'
        : 'O modelo de linguagem não respondeu agora (limite do plano gratuito ou instabilidade). Estes são os trechos mais relevantes.',
    };
  }
  yield { type: 'done', model };
}
