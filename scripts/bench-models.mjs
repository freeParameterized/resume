/**
 * Measures time-to-first-token and tokens/sec for candidate chat models so the
 * default is chosen from data rather than guessed. Run: node scripts/bench-models.mjs
 */
const HOST = "http://127.0.0.1:11434";
const MODELS = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["llama3.2:3b", "qwen3:4b", "llama3.1:8b", "qwen3:8b"];

const PROMPT = `You are Peter Lilley's resume assistant. Answer in 3 sentences.

CORPUS EXCERPT:
Peter Lilley is a software engineer in St. Louis who builds language-to-geometry systems:
natural language in, 3D CAD geometry out, with locally hosted LLM inference and
deterministic validation. He works at DMA and built Digital Twin Pro as a personal project.

QUESTION:
Who is Peter?

ANSWER:`;

async function bench(model) {
  const started = Date.now();
  let firstToken = null;
  let tokens = 0;
  let text = "";
  try {
    const res = await fetch(`${HOST}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt: model.startsWith("qwen3") ? `${PROMPT}\n/no_think` : PROMPT,
        stream: true,
        keep_alive: "30m",
        options: { temperature: 0.35, num_ctx: 2048, num_predict: 220 },
      }),
    });
    if (!res.ok || !res.body) return { model, error: `HTTP ${res.status}` };
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() || "";
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const evt = JSON.parse(line);
          if (evt.response) {
            if (firstToken === null) firstToken = Date.now() - started;
            tokens += 1;
            text += evt.response;
          }
        } catch {
          /* partial */
        }
      }
    }
    const total = Date.now() - started;
    const genMs = Math.max(1, total - (firstToken ?? 0));
    return {
      model,
      ttftMs: firstToken,
      totalMs: total,
      tokens,
      tokPerSec: Number(((tokens / genMs) * 1000).toFixed(1)),
      thinkTags: /<think>/i.test(text),
      preview: text.replace(/\s+/g, " ").trim().slice(0, 90),
    };
  } catch (err) {
    return { model, error: err.message };
  }
}

for (const model of MODELS) {
  // Cold pass reflects what the first visitor experiences; warm pass reflects steady state.
  const cold = await bench(model);
  const warm = await bench(model);
  if (cold.error) {
    console.log(`${model}: ERROR ${cold.error}`);
    continue;
  }
  console.log(
    `${model.padEnd(14)} cold ttft=${String(cold.ttftMs).padStart(6)}ms total=${String(cold.totalMs).padStart(6)}ms | ` +
      `warm ttft=${String(warm.ttftMs).padStart(5)}ms total=${String(warm.totalMs).padStart(6)}ms ` +
      `${String(warm.tokPerSec).padStart(5)} tok/s think=${warm.thinkTags}`,
  );
  console.log(`   -> ${warm.preview}`);
}
