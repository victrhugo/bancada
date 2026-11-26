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

export async function chat(
  system: string,
  user: string,
  timeoutMs = 25000
): Promise<{ text: string; model: string }> {
  let lastError: unknown;
  for (const model of CHAT_MODELS) {
    try {
      const data = await post<{ choices: { message: { content: string } }[] }>(
        '/chat/completions',
        {
          model,
          temperature: 0.2,
          max_tokens: 900,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        },
        timeoutMs
      );
      const text = data.choices?.[0]?.message?.content?.trim();
      if (text) return { text, model };
      lastError = new GeminiError('resposta vazia', 502);
    } catch (error) {
      lastError = error;
      // A missing key will not get better with another model.
      if (error instanceof GeminiError && error.status === 503 && !process.env.GEMINI_API_KEY)
        break;
    }
  }
  throw lastError;
}
