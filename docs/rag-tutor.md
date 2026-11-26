# Tutor com IA (RAG)

O `/tutor` responde perguntas em português usando o conteúdo da Bancada como base e cita as fontes.

## Como funciona

1. **Base de conhecimento** (`pnpm rag:index` → `data/rag/index.json`)
   - `lib/rag/chunks.ts` transforma quizzes, flashcards, checklists, exercícios, perguntas de
     entrevista, simuladores e a trilha de IA em ~1.700 trechos curtos, cada um com título,
     seção e URL.
   - `scripts/build-rag-index.ts` gera um embedding por trecho com o Gemini
     (`gemini-embedding-001`, 256 dimensões), quantiza para int8 e grava o índice. É
     incremental: trechos que não mudaram reaproveitam o vetor anterior.
2. **Busca híbrida** (`lib/rag/retrieve.ts`)
   - BM25 sobre o texto (sempre disponível, sem API) + similaridade de cosseno entre o
     embedding da pergunta e os vetores do índice.
   - Os dois rankings são combinados com Reciprocal Rank Fusion (k = 60), no máximo 2
     trechos por página, top 6.
3. **Geração** (`lib/rag/server.ts`, `lib/rag/gemini.ts`)
   - Os 6 trechos viram fontes numeradas no prompt; o modelo responde só com base nelas e
     cita com `[n]`.
   - Modelos tentados em ordem: `GEMINI_CHAT_MODELS` (padrão
     `gemini-flash-lite-latest,gemini-flash-latest`).
   - Se a geração falhar (cota, instabilidade), a API devolve só as fontes.
4. **API** (`app/api/tutor/route.api.ts`): `POST /api/tutor { "question": "..." }`, com limite
   de 8 perguntas por minuto por IP e no máximo 500 caracteres.

## Deploy

- Na Vercel (`VERCEL` definido), o Next roda em modo servidor e a rota `/api/tutor` vira uma
  função serverless. Em qualquer outro lugar (Docker, Cloudflare, `out/` local) o site continua
  como export estático; a extensão `.api.ts` só é registrada no modo servidor.
- Variável obrigatória na Vercel: `GEMINI_API_KEY` (chave gratuita em
  <https://aistudio.google.com/apikey>). Sem ela, o tutor mostra só os trechos encontrados.
- Opcionais: `GEMINI_CHAT_MODELS`, `GEMINI_EMBEDDING_MODEL`.

## Plano gratuito do Gemini

- Embeddings: 1.000 requisições por dia, e **cada trecho conta como uma requisição**. Gerar o
  índice completo leva dois dias. Rode `pnpm rag:index` de novo no dia seguinte: ele continua de
  onde parou. Em tempo de execução, cada pergunta usa 1 embedding.
- Enquanto o índice não tem vetores, a busca usa só BM25 (a resposta indica "busca por
  palavras-chave").
- Os dados enviados no plano gratuito podem ser usados pelo Google para melhorar os modelos. Aqui
  só trafega conteúdo público do site e a pergunta do usuário; não envie dados pessoais.

## Regerar o índice

```bash
GEMINI_API_KEY=... pnpm rag:index
```

Variáveis de ritmo: `RAG_BATCH` (padrão 20) e `RAG_DELAY_MS` (padrão 15000).
