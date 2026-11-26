/**
 * Server-side RAG pipeline: load the index once per instance, retrieve, generate.
 */
// Bundled with the function at build time; regenerate with `pnpm rag:index`.
import indexData from '@/data/rag/index.json';
import {
  buildBm25,
  buildPrompt,
  decodeVector,
  hybridSearch,
  quantize,
  type Bm25Model,
  type RagChunk,
  type RagIndex,
  type ScoredChunk,
} from './retrieve';
import { chat, embed } from './gemini';

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

export interface TutorAnswer {
  answer: string | null;
  sources: TutorSource[];
  /** 'hybrid' when the query was embedded, 'keyword' when only BM25 ran. */
  retrieval: 'hybrid' | 'keyword';
  model: string | null;
  /** Set when generation failed and only the sources are returned. */
  notice?: string;
}

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

export async function answerQuestion(question: string): Promise<TutorAnswer> {
  const index = loadIndex();

  let queryVector: Int8Array | null = null;
  if (index.hasVectors && process.env.GEMINI_API_KEY) {
    try {
      const [v] = await embed([question], 8000);
      queryVector = quantize(v);
    } catch {
      // Embedding quota or outage: keyword retrieval still works.
    }
  }

  const results = hybridSearch(index.chunks, index.bm25, index.vectors, question, queryVector, {
    limit: 6,
  });
  const sources = toSources(results);
  const retrieval = queryVector ? 'hybrid' : 'keyword';

  if (results.length === 0) {
    return {
      answer:
        'Não encontrei nada no conteúdo da Bancada sobre isso. Tente reformular com termos técnicos (por exemplo, "rollback no Kubernetes" ou "o que é embedding") ou explore as trilhas do site.',
      sources,
      retrieval,
      model: null,
    };
  }

  if (!process.env.GEMINI_API_KEY) {
    return {
      answer: null,
      sources,
      retrieval,
      model: null,
      notice:
        'A geração de respostas não está configurada neste deploy. Estes são os trechos mais relevantes.',
    };
  }

  try {
    const { system, user } = buildPrompt(question, results);
    const { text, model } = await chat(system, user);
    return { answer: text, sources, retrieval, model };
  } catch {
    return {
      answer: null,
      sources,
      retrieval,
      model: null,
      notice:
        'O modelo de linguagem não respondeu agora (limite do plano gratuito ou instabilidade). Estes são os trechos mais relevantes.',
    };
  }
}
