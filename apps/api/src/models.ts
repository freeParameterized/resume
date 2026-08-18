import os from "node:os";
import fs from "node:fs";
import path from "node:path";

function ollamaHost(): string {
  return (process.env.OLLAMA_HOST || "http://127.0.0.1:11434").replace(/\/$/, "");
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
export const MODEL_CHAIN = [
  {
    id: "gemma4:26b",
    role: "default",
    why: "Strongest local general chat on this machine (25.8B, Q4_K_M, ~16.8 GB). Best GPT-like answers for a living-resume conversation.",
  },
  {
    id: "qwen3-coder:30b",
    role: "coder",
    why: "Strongest local coder (30.5B MoE, Q4_K_M, ~17.3 GB). Prefer when the visitor asks about implementation detail.",
  },
  {
    id: "gemma4:latest",
    role: "mid",
    why: "8B general (Q4_K_M, ~9 GB). Quality fallback if 26B is busy or missing.",
  },
  {
    id: "qwen3:8b",
    role: "mid",
    why: "8.2B Qwen3 (Q4_K_M, ~4.9 GB).",
  },
  {
    id: "qwen2.5-coder:7b",
    role: "fast",
    why: "7.6B coder (Q4_K_M, ~4.4 GB). Snappy demo fallback.",
  },
  {
    id: "llama3.2:3b",
    role: "small",
    why: "3.2B (Q4_K_M, ~1.9 GB). Last-resort local generate.",
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
    return names.find((n) => n === requested || n.startsWith(`${requested}:`)) || requested;
  }
  const env = process.env.OLLAMA_MODEL;
  if (env && has(env) && !isCloud(env)) {
    return names.find((n) => n === env || n.startsWith(`${env}:`)) || env;
  }
  for (const row of MODEL_CHAIN) {
    if (has(row.id)) return row.id;
  }
  return local.sort((a, b) => b.sizeBytes - a.sizeBytes)[0]?.name || null;
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
