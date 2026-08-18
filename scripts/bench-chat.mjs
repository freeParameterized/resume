/**
 * End-to-end chat latency through the real API (SSE), not against Ollama directly.
 * Usage: node scripts/bench-chat.mjs [baseUrl]
 */
const BASE = process.argv[2] || "http://127.0.0.1:8787";
const QUESTIONS = [
  "Who is Peter",
  "What is your ML experience",
  "Tell me about Digital Twin Pro",
];

async function ask(question) {
  const started = Date.now();
  let ttft = null;
  let firstBlock = null;
  let text = "";
  let mode = "";
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify({ question, stream: true }),
  });
  if (!res.ok || !res.body) return { question, error: `HTTP ${res.status}` };
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const parts = buf.split("\n\n");
    buf = parts.pop() || "";
    for (const part of parts) {
      const line = part.replace(/^data: /, "").trim();
      if (!line) continue;
      try {
        const evt = JSON.parse(line);
        if (evt.type === "meta") {
          mode = evt.mode || "";
          if (firstBlock === null && (evt.contextBlocks?.length || evt.instantAnswer)) {
            firstBlock = Date.now() - started;
          }
        }
        if (evt.type === "token" && evt.text) {
          if (ttft === null) ttft = Date.now() - started;
          text += evt.text;
        }
      } catch {
        /* partial */
      }
    }
  }
  return {
    question,
    mode,
    ttftMs: ttft,
    firstVisualMs: firstBlock,
    totalMs: Date.now() - started,
    chars: text.length,
    preview: text.replace(/\s+/g, " ").trim().slice(0, 80),
    thinkLeak: /<think>/i.test(text),
  };
}

console.log(`target: ${BASE}`);
for (const q of QUESTIONS) {
  const r = await ask(q);
  if (r.error) {
    console.log(`"${q}" -> ERROR ${r.error}`);
    continue;
  }
  console.log(
    `"${r.question}" [${r.mode}] first-token=${String(r.ttftMs).padStart(5)}ms ` +
      `first-visual=${String(r.firstVisualMs).padStart(5)}ms total=${String(r.totalMs).padStart(6)}ms ` +
      `chars=${r.chars} thinkLeak=${r.thinkLeak}`,
  );
  console.log(`   -> ${r.preview}`);
}
