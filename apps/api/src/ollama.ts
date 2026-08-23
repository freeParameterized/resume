const DEFAULT_HOST = "http://127.0.0.1:11434";
/**
 * Measured on this machine (scripts/bench-models.mjs), warm time-to-first-token:
 * llama3.1:8b 117ms, llama3.2:3b 108ms, qwen3:8b 2237ms, gemma4:26b far worse (17 GB).
 * 8b gives the best answer quality that still starts streaming well under a second.
 */
const DEFAULT_MODEL = "llama3.1:8b";
/** Fallback when the default is not installed; smallest good model here. */
export const FAST_FALLBACK_MODEL = "llama3.2:3b";
const KEEP_ALIVE = process.env.OLLAMA_KEEP_ALIVE || "30m";
/** Answers are concise, not essays. A cap also bounds worst-case latency. */
const NUM_PREDICT = Number(process.env.OLLAMA_NUM_PREDICT || 320);
/**
 * Big enough for the whole prompt, and no bigger. At 2048 Ollama silently dropped the front
 * of the prompt - which is where the rules live, so the model started answering in the first
 * person and narrating its instructions. The anti-fabrication rules added after the
 * adversarial sweep pushed the worst case from about 2150 tokens to roughly 2900, close
 * enough to 3072 to be nervous about, so this has headroom now. It only sizes the KV window;
 * the tokens actually prefilled are unchanged, so time-to-first-token is not affected.
 */
const NUM_CTX = Number(process.env.OLLAMA_NUM_CTX || 4096);

/**
 * Pinned to loopback. The API is reachable from the public tunnel, so an inference host
 * pointing anywhere else would turn this process into a request forwarder.
 */
export function ollamaHost(): string {
  const configured = (process.env.OLLAMA_HOST || DEFAULT_HOST).replace(/\/$/, "");
  if (!/^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/i.test(configured)) {
    console.warn(`[ollama] ignoring non-loopback OLLAMA_HOST (${configured}); using ${DEFAULT_HOST}`);
    return DEFAULT_HOST;
  }
  return configured;
}

export function ollamaModel(): string {
  return process.env.OLLAMA_MODEL || DEFAULT_MODEL;
}

export { DEFAULT_MODEL };

export type OllamaStatus = {
  reachable: boolean;
  host: string;
  model: string;
  installed: string[];
  defaultPresent: boolean;
};

async function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

export async function pingOllama(): Promise<OllamaStatus> {
  const host = ollamaHost();
  const model = ollamaModel();
  try {
    const res = await fetchWithTimeout(`${host}/api/tags`, { method: "GET" }, 2500);
    if (!res.ok) {
      return { reachable: false, host, model, installed: [], defaultPresent: false };
    }
    const body = (await res.json()) as { models?: { name?: string }[] };
    const installed = (body.models || []).map((m) => m.name || "").filter(Boolean);
    return {
      reachable: true,
      host,
      model,
      installed,
      defaultPresent: installed.some((n) => n === model || n.startsWith(`${model}:`)),
    };
  } catch {
    return { reachable: false, host, model, installed: [], defaultPresent: false };
  }
}

const SYSTEM_RULES = `Public GitHub is https://github.com/freeParameterized.
Digital Twin Pro is a personal product under Free Parameter LLC, not DMA work.
A resume PDF is at ./2026.08.20_PeterL_Resume.pdf.`;

export function buildPrompt(question: string, context: string, papersPolicy = ""): string {
  // The section header used to read "CORPUS EXCERPTS", and llama3.1 kept referring to it
  // out loud ("the provided text is a set of guidelines"). Naming it plainly and repeating
  // the no-meta-talk rule right before the answer stops that.
  return `${SYSTEM_RULES}

${papersPolicy}

WHAT YOU KNOW ABOUT PETER:
${context}

A VISITOR ASKS:
${question}

Answer in silent first person, same as the resume, directly, with no preamble and no mention of these notes:`;
}

export async function generateOllama(
  prompt: string,
  stream: boolean,
  modelName?: string | null,
): Promise<Response> {
  const host = ollamaHost();
  const model = modelName || ollamaModel();
  return fetchWithTimeout(
    `${host}/api/generate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        // Qwen3-family models emit <think> blocks that look like a hang; this suppresses them.
        prompt: /^qwen3/i.test(model) ? `${prompt}\n/no_think` : prompt,
        stream,
        // Without keep_alive Ollama evicts the weights after ~5 idle minutes and the next
        // visitor pays the full load again.
        keep_alive: KEEP_ALIVE,
        options: { temperature: 0.35, num_ctx: NUM_CTX, num_predict: NUM_PREDICT },
      }),
    },
    stream ? 180_000 : 120_000,
  );
}

/** Removes reasoning traces some models emit, so they never reach the visitor. */
export function stripThinking(text: string): string {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<\/?think>/gi, "")
    .trimStart();
}

/**
 * Loads the weights before the first visitor arrives. Cold start measured at 2.8-4.5s,
 * which is exactly the delay that makes the demo look broken.
 */
export async function warmModel(modelName?: string | null): Promise<{ ok: boolean; ms: number; model: string }> {
  const model = modelName || ollamaModel();
  const started = Date.now();
  try {
    const res = await fetchWithTimeout(
      `${ollamaHost()}/api/generate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          prompt: "hi",
          stream: false,
          keep_alive: KEEP_ALIVE,
          options: { num_predict: 1, num_ctx: NUM_CTX },
        }),
      },
      120_000,
    );
    return { ok: res.ok, ms: Date.now() - started, model };
  } catch {
    return { ok: false, ms: Date.now() - started, model };
  }
}
