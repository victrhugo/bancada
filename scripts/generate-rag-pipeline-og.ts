#!/usr/bin/env tsx

/**
 * Social card for the RAG pipeline simulator, built with the shared site
 * template so it matches the other generated OG images.
 */

import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { buildSiteOgSvg, convertSvgToPng } from './og-utils';

async function generate() {
  const svg = buildSiteOgSvg({
    eyebrow: 'simulador de IA',
    sectionLabel: '/games/rag-pipeline-simulator',
    title: 'Simulador de Pipeline RAG',
    description:
      'Chunking, embeddings, busca híbrida, grounding e prompt injection, na prática e em português.',
    features: [
      { title: 'Chunking', description: 'tamanho e overlap' },
      { title: 'Busca híbrida', description: 'cosseno + BM25' },
      { title: 'Grounding', description: 'citar ou recusar' },
    ],
  });

  const tmpSvg = path.join(os.tmpdir(), 'rag-pipeline-simulator-og.svg');
  const pngPath = path.join(process.cwd(), 'public/images/games/rag-pipeline-simulator-og.png');
  await fs.writeFile(tmpSvg, svg);
  await convertSvgToPng(tmpSvg, pngPath);
  await fs.unlink(tmpSvg);
  console.log(`Wrote ${path.relative(process.cwd(), pngPath)}`);
}

generate().catch((error) => {
  console.error(error);
  process.exit(1);
});
