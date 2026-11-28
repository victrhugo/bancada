// scripts/build-rag-index.ts
//
// Builds the knowledge base for the Bancada tutor (RAG):
//   1. collect small chunks from the site's content (quizzes, flashcards, exercises...)
//   2. embed every chunk with Gemini (free tier) and quantize the vectors to int8
//   3. write data/rag/index.json, which the /api/tutor function loads at runtime
//
// Without GEMINI_API_KEY the index is still written with chunks only, and the tutor
// falls back to keyword (BM25) retrieval. Unchanged chunks reuse their previous
// embedding, so re-running after a small content edit only pays for the new text.
//
// Usage: pnpm rag:index  (needs GEMINI_API_KEY for embeddings)

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { getActiveGames } from '../lib/games.js';
import { milestones } from '../lib/roadmap-ia-data.js';
import { collectChunks } from '../lib/rag/chunks.js';
import { encodeVector, quantize, type RagIndex } from '../lib/rag/retrieve.js';
import { embed, EMBEDDING_DIMENSIONS, EMBEDDING_MODEL, GeminiError } from '../lib/rag/gemini.js';

const OUT = path.join(process.cwd(), 'data', 'rag', 'index.json');
// Free tier counts every input as a request (about 100/min), so go in small, paced batches.
const BATCH = Number(process.env.RAG_BATCH || 20);
const DELAY_MS = Number(process.env.RAG_DELAY_MS || 15000);

const hash = (s: string) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 16);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function embedWithRetry(texts: string[]): Promise<number[][]> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await embed(texts, 60000);
    } catch (error) {
      const status = error instanceof GeminiError ? error.status : 0;
      if (attempt >= 3 || (status !== 429 && status < 500 && status !== 0)) throw error;
      const wait = 15000 * 2 ** attempt;
      console.log(`  … ${status || 'erro de rede'}, tentando de novo em ${wait / 1000}s`);
      await sleep(wait);
    }
  }
}

async function main() {
  const games = await getActiveGames();
  const chunks = collectChunks({
    games: games.map((g) => ({
      id: g.id,
      title: g.title,
      description: g.description,
      href: g.href,
    })),
    aiMilestones: milestones,
  });
  console.log(`📚 ${chunks.length} chunks`);

  // Reuse embeddings from the previous index when the chunk text did not change.
  const previous = new Map<string, string>();
  try {
    const old = JSON.parse(await fs.readFile(OUT, 'utf-8')) as RagIndex & { hashes?: string[] };
    if (old.model === EMBEDDING_MODEL && old.dimensions === EMBEDDING_DIMENSIONS && old.hashes) {
      old.chunks.forEach((c, i) => {
        const v = old.vectors[i];
        if (v && old.hashes?.[i]) previous.set(old.hashes[i], v);
      });
    }
  } catch {
    // first build
  }

  const hashes = chunks.map((c) => hash(`${c.title}\n${c.section ?? ''}\n${c.text}`));
  const vectors: (string | null)[] = hashes.map((h) => previous.get(h) ?? null);
  const missing = vectors.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);

  let model: string | null = EMBEDDING_MODEL;
  if (!process.env.GEMINI_API_KEY) {
    console.log('⚠️  GEMINI_API_KEY ausente: índice só com texto (busca por palavras-chave).');
    if (previous.size === 0) model = null;
  } else if (missing.length) {
    console.log(`🧮 Gerando ${missing.length} embeddings (${previous.size} reaproveitados)...`);
    for (let i = 0; i < missing.length; i += BATCH) {
      const ids = missing.slice(i, i + BATCH);
      const texts = ids.map(
        (j) => `${chunks[j].title}. ${chunks[j].section ?? ''}\n${chunks[j].text}`
      );
      try {
        const result = await embedWithRetry(texts);
        ids.forEach((j, k) => (vectors[j] = encodeVector(quantize(result[k]))));
      } catch (error) {
        // Daily quota or a persistent error: keep what we have. The next run resumes here.
        console.log(
          `\n⚠️  Parando em ${i}/${missing.length}: ${(error as Error).message.slice(0, 160)}`
        );
        break;
      }
      console.log(`  ${Math.min(i + BATCH, missing.length)}/${missing.length}`);
      if (i + BATCH < missing.length) await sleep(DELAY_MS);
    }
  }

  const index: RagIndex & { hashes: string[] } = {
    model,
    dimensions: EMBEDDING_DIMENSIONS,
    createdAt: new Date().toISOString(),
    chunks,
    vectors,
    hashes,
  };
  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(OUT, JSON.stringify(index));
  const withVectors = vectors.filter(Boolean).length;
  const size = (await fs.stat(OUT)).size;
  console.log(
    `✅ ${OUT} (${(size / 1024).toFixed(0)} KB, ${withVectors}/${chunks.length} com embedding)`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
