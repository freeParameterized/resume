import type { Chunk, ScoredChunk } from "./types.js";

const STOP = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "are",
  "was",
  "were",
  "his",
  "her",
  "you",
  "your",
  "about",
  "what",
  "when",
  "where",
  "which",
  "who",
  "how",
  "does",
  "did",
  "can",
  "into",
  "onto",
  "over",
  "than",
  "then",
  "them",
  "they",
  "have",
  "has",
  "had",
  "not",
  "but",
  "any",
  "all",
  "also",
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+.#/]+/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !STOP.has(t));
}

export function retrieve(chunks: Chunk[], question: string, k = 5): ScoredChunk[] {
  const qTokens = tokenize(question);
  const scored = chunks.map((chunk) => {
    const hay = `${chunk.title} ${chunk.text} ${chunk.tags.join(" ")}`;
    const tokens = tokenize(hay);
    const tf = new Map<string, number>();
    for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);

    let score = 0;
    if (qTokens.length === 0) {
      return { chunk, score: 0 };
    }
    for (const q of qTokens) {
      const f = tf.get(q) || 0;
      if (f > 0) score += 1 + Math.log(1 + f);
      if (chunk.title.toLowerCase().includes(q)) score += 2.4;
      if (chunk.tags.some((tag) => tag.toLowerCase().includes(q))) score += 1.4;
      if (chunk.text.toLowerCase().includes(q)) score += 0.15;
    }
    return { chunk, score };
  });

  const hits = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
  if (hits.length > 0) return hits.slice(0, k);

  const fallbackIds = new Set(["summary", "identity", "this-site"]);
  return chunks
    .filter((c) => fallbackIds.has(c.id))
    .map((chunk) => ({ chunk, score: 0 }))
    .slice(0, k);
}

export function extractiveAnswer(question: string, hits: ScoredChunk[]): string {
  const lines = [
    "Ollama is not reachable, so inference is offline. This is an extractive answer from the sanitized local corpus — not a live model.",
    "",
    `Question: ${question}`,
    "",
  ];
  if (hits.length === 0) {
    lines.push("No matching corpus chunks. Try asking about Digital Twin Pro, CADNAT, DMA, skills, or education.");
    return lines.join("\n");
  }
  for (const hit of hits) {
    lines.push(`## ${hit.chunk.title}`);
    lines.push(hit.chunk.text);
    lines.push("");
  }
  lines.push("Start Ollama on 127.0.0.1:11434 for a synthesized answer over the same corpus.");
  return lines.join("\n");
}
