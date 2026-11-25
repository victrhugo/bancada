import { describe, expect, it } from 'vitest';
import {
  INJECTION_ANSWER,
  PRESET_QUESTIONS,
  REFUSAL,
  chunkDocuments,
  cosine,
  DOCUMENTS,
  embed,
  runRag,
  tokenize,
  type RagSettings,
} from '@/lib/games/rag-pipeline-engine';

const base: RagSettings = {
  chunkSize: 30,
  overlapPercent: 15,
  topK: 3,
  mode: 'hybrid',
  grounding: true,
  includeMaliciousDoc: false,
};

const preset = (id: string) => {
  const found = PRESET_QUESTIONS.find((q) => q.id === id);
  if (!found) throw new Error(`missing preset ${id}`);
  return found;
};

const ask = (id: string, overrides: Partial<RagSettings> = {}) =>
  runRag(preset(id).question, { ...base, ...overrides }, preset(id));

describe('rag pipeline engine: building blocks', () => {
  it('tokenizes without accents and keeps literal codes intact', () => {
    expect(tokenize('O código PAG-4021 está ÓTIMO')).toEqual(['codigo', 'pag-4021', 'otimo']);
  });

  it('maps paraphrases to the same concept and ignores codes in the embedding', () => {
    expect(cosine(embed('mercadoria estragada'), embed('produto danificado'))).toBeCloseTo(1);
    expect(embed('PAG-4021').size).toBe(0);
  });

  it('chunks with overlap and never produces empty chunks', () => {
    const chunks = chunkDocuments(DOCUMENTS, 20, 25);
    expect(chunks.length).toBeGreaterThan(DOCUMENTS.length);
    expect(chunks.every((c) => c.wordCount > 0 && c.wordCount <= 20)).toBe(true);
    const [first, second] = chunks.filter((c) => c.docId === 'trocas');
    const firstWords = first.text.split(' ');
    expect(second.text.startsWith(firstWords.slice(-5).join(' '))).toBe(true);
  });
});

describe('rag pipeline engine: teaching scenarios', () => {
  it('semantic search finds a paraphrase that keyword search misses', () => {
    expect(ask('paraphrase', { mode: 'semantic' }).outcome).toBe('correct');
    expect(ask('paraphrase', { mode: 'keyword' }).outcome).toBe('missed');
  });

  it('keyword search finds an exact error code that semantic search confuses', () => {
    expect(ask('error-code', { mode: 'keyword', topK: 1 }).outcome).toBe('correct');
    expect(ask('error-code', { mode: 'semantic', topK: 1 }).outcome).toBe('missed');
    expect(ask('error-code', { mode: 'hybrid', topK: 1 }).outcome).toBe('correct');
  });

  it('tiny chunks split the answer sentence and lose recall', () => {
    expect(ask('refund-pix').recallHit).toBe(true);
    const tiny = ask('refund-pix', { chunkSize: 8, overlapPercent: 0 });
    expect(tiny.recallHit).toBe(false);
    expect(tiny.answer).toBe(REFUSAL);
  });

  it('bigger chunks and higher top-k cost more context tokens', () => {
    const small = ask('refund-pix', { chunkSize: 20, topK: 2 });
    const big = ask('refund-pix', { chunkSize: 100, topK: 5 });
    expect(big.contextTokens).toBeGreaterThan(small.contextTokens);
  });

  it('grounding turns an out-of-scope hallucination into an honest refusal', () => {
    expect(ask('out-of-scope').outcome).toBe('correct-refusal');
    const ungrounded = ask('out-of-scope', { grounding: false });
    expect(ungrounded.outcome).toBe('hallucination');
    expect(ungrounded.answer).toBe(preset('out-of-scope').hallucination);
  });

  it('cites the source chunk only when grounding is on', () => {
    const grounded = ask('privacy');
    expect(grounded.citation).not.toBeNull();
    expect(grounded.answer).toContain(`[${grounded.citation}]`);
    expect(ask('privacy', { grounding: false }).citation).toBeNull();
  });

  it('an injected instruction only wins when data and instructions are not separated', () => {
    const attacked = ask('refund-pix', { includeMaliciousDoc: true, grounding: false });
    expect(attacked.injectionRetrieved).toBe(true);
    expect(attacked.outcome).toBe('injection');
    expect(attacked.answer).toBe(INJECTION_ANSWER);

    const defended = ask('refund-pix', { includeMaliciousDoc: true });
    expect(defended.injectionRetrieved).toBe(true);
    expect(defended.outcome).toBe('correct');
  });

  it('answers free-form questions from context and refuses unrelated ones', () => {
    const hours = runRag('Qual o horário do chat?', base, null);
    expect(hours.outcome).toBe('custom-answer');
    expect(hours.answer).toContain('8h às 22h');
    expect(runRag('Qual a capital da Austrália?', base, null).outcome).toBe('custom-refusal');
  });
});
