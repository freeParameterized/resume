import os from "node:os";
import fs from "node:fs";
import path from "node:path";

const LOOPBACK_OLLAMA = "http://127.0.0.1:11434";

function ollamaHost(): string {
  const configured = (process.env.OLLAMA_HOST || LOOPBACK_OLLAMA).replace(/\/$/, "");
  return /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/i.test(configured) ? configured : LOOPBACK_OLLAMA;
}

export type InstalledModel = {
  name: string;
  sizeBytes: number;
  sizeGB: number;
  parameterSize: string | null;
  quantization: string | null;
  family: string | null;
  cloud: boolean;
};

/** Preference order for resume chat. Cloud tags are never auto-selected. */
/**
 * Order matters: the first installed entry becomes the default. Chosen from measured
 * warm time-to-first-token on this machine (scripts/bench-models.mjs), because a slow
 * first answer reads as a broken demo. The large models stay selectable in the UI.
 */
export const MODEL_CHAIN = [
  {
    id: "llama3.1:8b",
    role: "default",
    why: "8B general chat (~4.9 GB). Measured 117 ms to first token warm, ~90 tok/s: good answers that start instantly.",
  },
  {
    id: "llama3.2:3b",
    role: "fast",
    why: "3.2B (~2 GB). Measured 108 ms to first token, ~175 tok/s. Pick this on a busy or low-memory machine.",
  },
  {
    id: "gemma4:latest",
    role: "mid",
    why: "8B general (~9 GB). Quality alternative when there is memory headroom.",
  },
  {
    id: "qwen3:8b",
    role: "mid",
    why: "8.2B Qwen3 (~5.2 GB). Emits reasoning traces, so it is suppressed and stripped; measured 2.2 s to first token.",
  },
  {
    id: "qwen3-coder:30b",
    role: "coder",
    why: "30.5B MoE coder (~18 GB). Optional pick for deep implementation questions; slow to start.",
  },
  {
    id: "gemma4:26b",
    role: "showcase",
    why: "25.8B (~17 GB). The biggest model here; selectable to show local capability, too slow as a default.",
  },
] as const;

function isCloud(name: string): boolean {
  return /cloud/i.test(name) || /:cloud$/i.test(name);
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

export async function listOllamaModels(): Promise<InstalledModel[]> {
  try {
    const res = await fetchWithTimeout(`${ollamaHost()}/api/tags`, 2500);
    if (!res.ok) return [];
    const body = (await res.json()) as {
      models?: {
        name?: string;
        size?: number;
        details?: { parameter_size?: string; quantization_level?: string; family?: string };
      }[];
    };
    return (body.models || [])
      .map((m) => {
        const name = m.name || "";
        const sizeBytes = Number(m.size || 0);
        return {
          name,
          sizeBytes,
          sizeGB: Math.round((sizeBytes / 1024 ** 3) * 100) / 100,
          parameterSize: m.details?.parameter_size || null,
          quantization: m.details?.quantization_level || null,
          family: m.details?.family || null,
          cloud: isCloud(name),
        };
      })
      .filter((m) => m.name);
  } catch {
    return [];
  }
}

export function pickLocalModel(installed: InstalledModel[], requested?: string | null): string | null {
  const local = installed.filter((m) => !m.cloud);
  const names = local.map((m) => m.name);
  const has = (id: string) => names.some((n) => n === id || n.startsWith(`${id}:`) || n === `${id}`);
  if (requested && has(requested) && !isCloud(requested)) {
    // Only ever return a name we actually have installed. Echoing the request back would
    // let a visitor push arbitrary model strings through to the inference server.
    return names.find((n) => n === requested || n.startsWith(`${requested}:`)) || null;
  }
  const env = process.env.OLLAMA_MODEL;
  if (env && has(env) && !isCloud(env)) {
    return names.find((n) => n === env || n.startsWith(`${env}:`)) || env;
  }
  for (const row of MODEL_CHAIN) {
    if (has(row.id)) return row.id;
  }
  // Smallest, not largest: an unknown machine should still answer quickly.
  return local.sort((a, b) => a.sizeBytes - b.sizeBytes)[0]?.name || null;
}

function walkGguf(dir: string, acc: string[], depth: number) {
  if (depth < 0 || !fs.existsSync(dir) || acc.length > 40) return;
  let entries: fs.Dirent[] = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isFile() && e.name.toLowerCase().endsWith(".gguf")) acc.push(full);
    else if (e.isDirectory()) walkGguf(full, acc, depth - 1);
  }
}

export function listLmStudioGgufs(): string[] {
  const home = os.homedir();
  const roots = [
    path.join(home, ".lmstudio"),
    path.join(home, ".cache", "lm-studio", "models"),
  ];
  const found: string[] = [];
  for (const root of roots) walkGguf(root, found, 8);
  return [...new Set(found)];
}

export function listOllamaDiskLibraries(): string[] {
  const home = os.homedir();
  const lib = path.join(home, ".ollama", "models", "manifests", "registry.ollama.ai", "library");
  if (!fs.existsSync(lib)) return [];
  const out: string[] = [];
  try {
    for (const name of fs.readdirSync(lib, { withFileTypes: true })) {
      if (!name.isDirectory()) continue;
      const inner = path.join(lib, name.name);
      try {
        const tags = fs.readdirSync(inner, { withFileTypes: true }).filter((e) => e.isFile() || e.isDirectory());
        if (tags.length === 0) out.push(name.name);
        for (const t of tags) out.push(`${name.name}:${t.name}`);
      } catch {
        out.push(name.name);
      }
    }
  } catch {
    return [];
  }
  return out.sort();
}

export async function modelCatalog(requested?: string | null) {
  const installed = await listOllamaModels();
  const selected = pickLocalModel(installed, requested);
  const lmStudio = listLmStudioGgufs();
  const diskLibraries = listOllamaDiskLibraries();
  return {
    host: ollamaHost(),
    reachable: installed.length > 0,
    selected,
    chain: MODEL_CHAIN.map((c) => ({
      ...c,
      present: installed.some((m) => !m.cloud && (m.name === c.id || m.name.startsWith(`${c.id}:`))),
    })),
    installed,
    diskLibraries,
    lmStudioGgufs: lmStudio.map((p) => path.basename(p)),
    lmStudioNote:
      lmStudio.length === 0
        ? "No GGUF files found under ~/.lmstudio on this scan. Ollama tags are the source of truth for chat."
        : "LM Studio GGUFs listed for inventory only — chat still goes through Ollama. Embedding GGUFs are not used as chat models.",
  };
}
