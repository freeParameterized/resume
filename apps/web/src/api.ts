import bundled from "@corpus";
import bundledPapersFile from "@papers";
import type { ContextBlock } from "./components/InlineContext";
import { API_BASE } from "./config";
import { detectIntents } from "./intents";
import { extractiveLocal, retrieveLocal } from "./retrieve";
import type { Corpus, GithubInfo, Health, ModelCatalog, Paper, Project } from "./types";
import { visitHeaders } from "./visits";

const apiBase = API_BASE;

async function getJson<T>(path: string, ms = 4000): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(`${apiBase}${path}`, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`${path} ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

export const fallbackCorpus = bundled as Corpus;
const bundledPapers = ((bundledPapersFile as { papers?: unknown[] }).papers || []) as Paper[];

function isNotHis(p: Paper): boolean {
  return p.notPeters === true || /exclude/i.test(p.recommendedPlacement || "");
}

/** Papers safe to render on the site: records that are not his are chat-correction only. */
export const fallbackPapers = bundledPapers.filter((p) => !isNotHis(p));

export async function loadHealth(): Promise<Health | null> {
  try {
    return await getJson<Health>("/api/health", 2500);
  } catch {
    return null;
  }
}

export async function loadProfile(): Promise<Corpus> {
  try {
    const data = await getJson<{
      profile: Corpus["profile"];
      howIWork?: Corpus["howIWork"];
      skillGroups: Corpus["skillGroups"];
      experience: Corpus["experience"];
      education: Corpus["education"];
      early: Corpus["early"];
      meta: Corpus["meta"];
    }>("/api/profile");
    return { ...fallbackCorpus, ...data, projects: fallbackCorpus.projects };
  } catch {
    return fallbackCorpus;
  }
}

export async function loadProjects(): Promise<Project[]> {
  try {
    const data = await getJson<{ projects: Project[] }>("/api/projects");
    return data.projects;
  } catch {
    return fallbackCorpus.projects;
  }
}

export async function loadGithub(): Promise<GithubInfo | null> {
  try {
    return await getJson<GithubInfo>("/api/github", 5000);
  } catch {
    const g = fallbackCorpus.github;
    return {
      source: "corpus",
      owner: g.owner,
      repo: g.repo,
      htmlUrl: g.url,
      description: g.description,
      language: g.language,
      stars: g.fallbackStars,
      forks: null,
      updatedAt: null,
      topics: [],
      note: "Static / offline fallback.",
    };
  }
}

export async function loadPapers(): Promise<{ available: boolean; papers: Paper[] }> {
  try {
    return await getJson<{ available: boolean; papers: Paper[] }>("/api/papers");
  } catch {
    return { available: fallbackPapers.length > 0, papers: fallbackPapers };
  }
}

export async function loadModels(): Promise<ModelCatalog | null> {
  try {
    return await getJson<ModelCatalog>("/api/models", 4000);
  } catch {
    return null;
  }
}

type AskMeta = {
  mode: string;
  model: string | null;
  citations: { id: string; title: string; score: number }[];
  intents?: { projectIds: string[]; paperIds?: string[] };
  contextBlocks?: ContextBlock[];
  offline?: boolean;
};

function offlineAsk(question: string, onToken: (text: string) => void, onMeta: (meta: AskMeta) => void) {
  const hits = retrieveLocal(fallbackCorpus.chunks, question, 5);
  // Pass the bundled papers so the static build can still correct a mistyped DOI.
  const intents = detectIntents(question, "", bundledPapers);
  onMeta({
    mode: "extractive",
    model: null,
    citations: hits.map((h) => ({ id: h.id, title: h.title, score: Number(h.score.toFixed(3)) })),
    intents,
    offline: true,
  });
  onToken(extractiveLocal(question, hits));
}

export async function askQuestion(
  question: string,
  onToken: (text: string) => void,
  onMeta: (meta: AskMeta) => void,
  model?: string,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${apiBase}/api/ask?stream=1`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...visitHeaders(),
      },
      body: JSON.stringify({ question, model: model || undefined }),
    });
  } catch {
    offlineAsk(question, onToken, onMeta);
    return;
  }
  if (!res.ok || !res.body) {
    offlineAsk(question, onToken, onMeta);
    return;
  }

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
      const line = part.split("\n").find((l) => l.startsWith("data:"));
      if (!line) continue;
      try {
        const evt = JSON.parse(line.slice(5).trim()) as {
          type: string;
          text?: string;
          mode?: string;
          model?: string | null;
          citations?: { id: string; title: string; score: number }[];
          intents?: { projectIds: string[]; paperIds?: string[] };
          contextBlocks?: ContextBlock[];
          offline?: boolean;
        };
        if (evt.type === "meta" || evt.type === "context") {
          onMeta({
            // The trailing "context" event carries no mode; never invent one or it renders as text.
            mode: evt.mode || "",
            model: evt.model ?? null,
            citations: evt.citations || [],
            intents: evt.intents,
            contextBlocks: evt.contextBlocks,
            offline: evt.offline,
          });
        } else if (evt.type === "token" && evt.text) {
          onToken(evt.text);
        }
      } catch {
        /* skip */
      }
    }
  }
}
