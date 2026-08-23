import { loadCorpus } from "./corpus.js";

export type GithubPayload = {
  source: "github" | "corpus";
  owner: string;
  repo: string;
  htmlUrl: string;
  description: string | null;
  language: string | null;
  stars: number | null;
  forks: number | null;
  updatedAt: string | null;
  topics: string[];
  note?: string;
};

function envRepo(): { owner: string; repo: string } {
  const gh = loadCorpus().github;
  const spec = process.env.GITHUB_REPO || `${gh.owner}/${gh.repo}`;
  const [owner, repo] = spec.split("/");
  return { owner: owner || gh.owner, repo: repo || gh.repo };
}

function fallback(note: string): GithubPayload {
  const gh = loadCorpus().github;
  const { owner, repo } = envRepo();
  return {
    source: "corpus",
    owner,
    repo,
    htmlUrl: gh.url,
    description: gh.description,
    language: gh.language,
    stars: gh.fallbackStars,
    forks: null,
    updatedAt: null,
    topics: ["flutter", "digital-twin", "dart"],
    note,
  };
}

export async function fetchGithub(): Promise<GithubPayload> {
  const gh = loadCorpus().github;
  const { owner, repo } = envRepo();
  const url = `https://api.github.com/repos/${owner}/${repo}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "cadpal-local",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!res.ok) {
      return fallback(`GitHub HTTP ${res.status}; using corpus fallback.`);
    }
    const body = (await res.json()) as {
      html_url?: string;
      description?: string | null;
      language?: string | null;
      stargazers_count?: number;
      forks_count?: number;
      updated_at?: string;
      topics?: string[];
    };
    return {
      source: "github",
      owner,
      repo,
      htmlUrl: body.html_url || gh.url,
      description: body.description ?? gh.description,
      language: body.language ?? gh.language,
      stars: typeof body.stargazers_count === "number" ? body.stargazers_count : null,
      forks: typeof body.forks_count === "number" ? body.forks_count : null,
      updatedAt: body.updated_at ?? null,
      topics: body.topics || [],
    };
  } catch {
    return fallback("GitHub unreachable; using corpus fallback.");
  } finally {
    clearTimeout(timer);
  }
}
