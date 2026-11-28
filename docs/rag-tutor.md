# Tutor com IA (RAG)

O tutor é um chatbot com RAG: responde em português usando o conteúdo da Bancada como base, cita as
fontes e lembra da conversa. Está em `/tutor` e num balão flutuante em todas as páginas.

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
4. **Conversa (chatbot)**
   - **Memória:** o navegador envia as últimas 3 trocas (pergunta + resposta) junto com a
     pergunta nova. O servidor corta respostas longas para o prompt continuar pequeno.
   - **Reescrita da pergunta:** quando há histórico, um passo curto do LLM transforma uma
     continuação ("e no Kubernetes?") numa pergunta completa ("Como ver os logs de um container
     no Kubernetes?") antes da busca. Se esse passo falhar, a busca usa a pergunta anterior +
     a atual. A pergunta reescrita aparece na tela ("buscou: …").
   - **Streaming:** a resposta chega token a token. A API devolve NDJSON: `meta` (fontes, tipo
     de busca, pergunta reescrita), vários `delta` (texto), `notice` (avisos) e `done`.
   - **Contexto da página:** o balão envia a página atual; os trechos dela ganham um bônus na
     fusão dos rankings (como se fossem o 1º lugar de um terceiro buscador), mas só quando já
     são relevantes para a pergunta.
   - A conversa fica no `sessionStorage` (some ao fechar a aba) e é compartilhada entre o
     balão e a página `/tutor`.
5. **API** (`app/api/tutor/route.api.ts`): `POST /api/tutor { "question", "history"?, "page"? }`,
   com limite de 8 perguntas por minuto por IP, no máximo 500 caracteres por pergunta e 10
   mensagens de histórico.

## Deploy

- Na Vercel (`VERCEL` definido), o Next roda em modo servidor e a rota `/api/tutor` vira uma
  função serverless. O balão só é incluído nesse modo (`NEXT_PUBLIC_TUTOR_ENABLED`). Em qualquer outro lugar (Docker, Cloudflare, `out/` local) o site continua
  como export estático; a extensão `.api.ts` só é registrada no modo servidor.
- Variável obrigatória na Vercel: `GEMINI_API_KEY` (chave gratuita em
  <https://aistudio.google.com/apikey>). Sem ela, o tutor mostra só os trechos encontrados.
- Opcionais: `GEMINI_CHAT_MODELS`, `GEMINI_EMBEDDING_MODEL`.

## Plano gratuito do Gemini

- Embeddings: 1.000 requisições por dia, e **cada trecho conta como uma requisição**. Gerar o
  índice completo leva dois dias. Rode `pnpm rag:index` de novo no dia seguinte: ele continua de
  onde parou. Em tempo de execução, cada pergunta usa 1 embedding e até 2 chamadas ao LLM (reescrita, só em continuações, e resposta).
- Enquanto o índice não tem vetores, a busca usa só BM25 (a resposta indica "busca por
  palavras-chave").
- Os dados enviados no plano gratuito podem ser usados pelo Google para melhorar os modelos. Aqui
  só trafega conteúdo público do site e a pergunta do usuário; não envie dados pessoais.

## Regerar o índice

```bash
GEMINI_API_KEY=... pnpm rag:index
```

Variáveis de ritmo: `RAG_BATCH` (padrão 20) e `RAG_DELAY_MS` (padrão 15000).
