import { describe, expect, it } from 'vitest';
import {
  bm25Scores,
  buildBm25,
  buildPrompt,
  cosineInt8,
  decodeVector,
  encodeVector,
  hybridSearch,
  quantize,
  tokenize,
  type RagChunk,
} from '@/lib/rag/retrieve';
import { clean } from '@/lib/rag/chunks';

const chunks: RagChunk[] = [
  {
    id: 'a',
    title: 'Rollback no Kubernetes',
    url: '/a',
    type: 'quiz',
    text: 'kubectl rollout undo volta o Deployment para a revisão anterior.',
  },
  {
    id: 'b',
    title: 'Índices no PostgreSQL',
    url: '/b',
    type: 'exercise',
    text: 'Um índice B-tree acelera buscas por igualdade e por faixa.',
  },
  {
    id: 'c',
    title: 'O que é RAG',
    url: '/c',
    type: 'flashcard',
    text: 'RAG busca trechos relevantes e os entrega como contexto para o LLM.',
  },
  {
    id: 'd',
    title: 'O que é RAG',
    url: '/c',
    type: 'flashcard',
    text: 'Embeddings representam o significado do texto como vetores.',
  },
  {
    id: 'e',
    title: 'O que é RAG',
    url: '/c',
    type: 'flashcard',
    text: 'Chunking divide documentos em pedaços pequenos para o RAG.',
  },
];

describe('tokenize', () => {
  it('lowercases, strips accents and stopwords', () => {
    expect(tokenize('O Índice da Tabela é rápido')).toEqual(['indice', 'tabela', 'rapido']);
  });
});

describe('bm25', () => {
  it('ranks the document that contains the query terms first', () => {
    const model = buildBm25(chunks);
    const scores = bm25Scores(model, 'como fazer rollback kubernetes');
    expect(scores.indexOf(Math.max(...scores))).toBe(0);
    expect(scores[1]).toBe(0);
  });
});

describe('vectors', () => {
  it('round-trips int8 vectors through base64', () => {
    const v = quantize([0.1, -0.5, 0.3, 0.9]);
    expect(Array.from(decodeVector(encodeVector(v)))).toEqual(Array.from(v));
  });

  it('gives ~1 for identical directions and ~0 for orthogonal ones', () => {
    expect(cosineInt8(quantize([1, 2, 3]), quantize([2, 4, 6]))).toBeGreaterThan(0.99);
    expect(Math.abs(cosineInt8(quantize([1, 0]), quantize([0, 1])))).toBeLessThan(0.01);
  });
});

describe('hybridSearch', () => {
  const bm25 = buildBm25(chunks);
  const vectors = [
    quantize([1, 0, 0]),
    quantize([0, 1, 0]),
    quantize([0, 0, 1]),
    quantize([0, 0.1, 1]),
    quantize([0.1, 0, 1]),
  ];

  it('works with keywords only when there is no query vector', () => {
    const r = hybridSearch(chunks, bm25, vectors, 'índice b-tree postgresql', null);
    expect(r[0].chunk.id).toBe('b');
    expect(r[0].vectorRank).toBeUndefined();
  });

  it('finds a semantic match that has no shared keyword', () => {
    const r = hybridSearch(chunks, bm25, vectors, 'desfazer versão publicada', quantize([1, 0, 0]));
    expect(r[0].chunk.id).toBe('a');
    expect(r[0].vectorRank).toBe(1);
  });

  it('keeps at most two chunks from the same page', () => {
    const r = hybridSearch(chunks, bm25, vectors, 'rag embeddings chunking', quantize([0, 0, 1]), {
      limit: 6,
    });
    expect(r.filter((x) => x.chunk.url === '/c')).toHaveLength(2);
  });
});

describe('buildPrompt', () => {
  it('numbers the sources and keeps the grounding rules', () => {
    const bm25 = buildBm25(chunks);
    const results = hybridSearch(chunks, bm25, [], 'rollback kubernetes', null);
    const { system, user } = buildPrompt('Como faço rollback?', results);
    expect(system).toContain('SOMENTE as fontes');
    expect(user).toContain('[1] Rollback no Kubernetes');
    expect(user).toContain('Pergunta: Como faço rollback?');
  });
});

describe('clean', () => {
  it('removes code fences and markdown, and caps the length at a sentence', () => {
    expect(clean('Use **isso**.\n```bash\nrm -rf /\n```\nFim.')).toBe('Use isso. Fim.');
    const long = 'Frase curta. '.repeat(200);
    expect(clean(long, 100).endsWith('…')).toBe(true);
  });
});
