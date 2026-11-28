import { describe, expect, it } from 'vitest';
import {
  bm25Scores,
  buildBm25,
  buildChatMessages,
  buildRewritePrompt,
  trimHistory,
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

describe('chat prompts', () => {
  const bm25 = buildBm25(chunks);
  const results = hybridSearch(chunks, bm25, [], 'rollback kubernetes', null);

  it('numbers the sources and keeps the grounding rules', () => {
    const messages = buildChatMessages('Como faço rollback?', results);
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toContain('SOMENTE as fontes');
    const last = messages[messages.length - 1];
    expect(last.content).toContain('[1] Rollback no Kubernetes');
    expect(last.content).toContain('Pergunta: Como faço rollback?');
  });

  it('places the conversation between the rules and the new question', () => {
    const history = [
      { role: 'user' as const, content: 'O que é um Deployment?' },
      { role: 'assistant' as const, content: 'Um Deployment gerencia réplicas.' },
    ];
    const messages = buildChatMessages('E como faço rollback?', results, history);
    expect(messages.map((m) => m.role)).toEqual(['system', 'user', 'assistant', 'user']);
  });

  it('trims long history so the prompt stays small', () => {
    const long = { role: 'assistant' as const, content: 'x'.repeat(5000) };
    const trimmed = trimHistory(Array(10).fill(long), 6, 600);
    expect(trimmed).toHaveLength(6);
    expect(trimmed[0].content.length).toBeLessThanOrEqual(601);
  });

  it('asks the rewrite step for a standalone question with the conversation', () => {
    const [system, user] = buildRewritePrompt('e no Docker?', [
      { role: 'user', content: 'Como ver logs no Kubernetes?' },
    ]);
    expect(system.content).toContain('pergunta completa e independente');
    expect(user.content).toContain('Pessoa: Como ver logs no Kubernetes?');
    expect(user.content).toContain('Última pergunta: e no Docker?');
  });
});

describe('page boost', () => {
  it('favors chunks from the page the reader is on', () => {
    const bm25 = buildBm25(chunks);
    const without = hybridSearch(chunks, bm25, [], 'rag embeddings chunking índice', null);
    const withPage = hybridSearch(chunks, bm25, [], 'rag embeddings chunking índice', null, {
      pageUrl: '/b',
    });
    expect(withPage[0].chunk.url).toBe('/b');
    expect(without[0].chunk.url).not.toBe('/b');
  });
});

describe('clean', () => {
  it('removes code fences and markdown, and caps the length at a sentence', () => {
    expect(clean('Use **isso**.\n```bash\nrm -rf /\n```\nFim.')).toBe('Use isso. Fim.');
    const long = 'Frase curta. '.repeat(200);
    expect(clean(long, 100).endsWith('…')).toBe(true);
  });
});
