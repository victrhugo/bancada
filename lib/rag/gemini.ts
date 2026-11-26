/**
 * Minimal client for the Gemini API through its OpenAI-compatible endpoint.
 *
 * The free tier of Google AI Studio covers both calls used here: embeddings for the
 * query and a Flash model for the answer. The key is read from GEMINI_API_KEY on the
 * server only; it never reaches the browser.
 */

const BASE = 'https://generativelanguage.googleapis.com/v1beta/openai';

export const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';
export const EMBEDDING_DIMENSIONS = 256;
/** Tried in order; the first that answers wins. Aliases keep working as Google retires versions. */
export const CHAT_MODELS = (
  process.env.GEMINI_CHAT_MODELS || 'gemini-flash-lite-latest,gemini-flash-latest'
)
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);

export class GeminiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new GeminiError('GEMINI_API_KEY não configurada', 503);
  return key;
}

async function post<T>(pathname: string, body: unknown, timeoutMs: number): Promise<T> {
  const res = await fetch(`${BASE}${pathname}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey()}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    throw new GeminiError(`Gemini ${pathname} ${res.status}: ${detail}`, res.status);
  }
  return (await res.json()) as T;
}

export async function embed(texts: string[], timeoutMs = 20000): Promise<number[][]> {
  const data = await post<{ data: { embedding: number[]; index: number }[] }>(
    '/embeddings',
    { model: EMBEDDING_MODEL, input: texts, dimensions: EMBEDDING_DIMENSIONS },
    timeoutMs
  );
  return data.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function chat(
  messages: ChatMessage[],
  { timeoutMs = 25000, maxTokens = 900 }: { timeoutMs?: number; maxTokens?: number } = {}
): Promise<{ text: string; model: string }> {
  let lastError: unknown;
  for (const model of CHAT_MODELS) {
    try {
      const data = await post<{ choices: { message: { content: string } }[] }>(
        '/chat/completions',
        { model, temperature: 0.2, max_tokens: maxTokens, messages },
        timeoutMs
      );
      const text = data.choices?.[0]?.message?.content?.trim();
      if (text) return { text, model };
      lastError = new GeminiError('resposta vazia', 502);
    } catch (error) {
      lastError = error;
      if (!process.env.GEMINI_API_KEY) break;
    }
  }
  throw lastError;
}

/**
 * Streams the answer token by token (Server-Sent Events from the OpenAI-compatible
 * endpoint). Falls back to the next model only if the stream fails before the first
 * token; after that, the partial answer is kept and the error is rethrown.
 */
export async function* chatStream(
  messages: ChatMessage[],
  { timeoutMs = 45000, maxTokens = 900 }: { timeoutMs?: number; maxTokens?: number } = {}
): AsyncGenerator<{ model: string; delta: string }> {
  let lastError: unknown;
  for (const model of CHAT_MODELS) {
    let started = false;
    try {
      const res = await fetch(`${BASE}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey()}` },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          max_tokens: maxTokens,
          messages,
          stream: true,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok || !res.body) {
        const detail = (await res.text()).slice(0, 300);
        throw new GeminiError(`Gemini stream ${res.status}: ${detail}`, res.status);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (payload === '[DONE]') return;
          try {
            const json = JSON.parse(payload) as { choices?: { delta?: { content?: string } }[] };
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              started = true;
              yield { model, delta };
            }
          } catch {
            // ignore keep-alive or partial lines
          }
        }
      }
      if (started) return;
      lastError = new GeminiError('resposta vazia', 502);
    } catch (error) {
      if (started) throw error;
      lastError = error;
      if (!process.env.GEMINI_API_KEY) break;
    }
  }
  throw lastError;
}
