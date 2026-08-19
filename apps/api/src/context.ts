import type { Corpus } from "./types.js";
import type { ChatIntents } from "./intents.js";
import { isExcludedFromSite, loadPapers, paperId, type Paper } from "./papers.js";

export type ContextBlock = {
  kind: "project" | "job" | "about" | "metric" | "skill" | "paper";
  id: string;
  title: string;
  subtitle?: string;
  body: string;
  bullets?: string[];
  href?: string;
  badge?: string;
};

const METRICS: Record<string, ContextBlock> = {
  "cycle-time": {
    kind: "metric",
    id: "cycle-time",
    title: "8–12 hours → ~30 seconds",
    subtitle: "DMA Civil 3D / Dynamo",
    body: "Python/Dynamo scripts cut repetitive Civil 3D drafting from 8–12 hours to about 30 seconds per cycle.",
    badge: "Metric",
  },
  "error-rate": {
    kind: "metric",
    id: "error-rate",
    title: "~25% fewer errors before PE review",
    subtitle: "DMA plan production",
    body: "After the automation loop was in place, roughly 25% fewer errors reached PE review.",
    badge: "Metric",
  },
  "pdf-autocheck": {
    kind: "metric",
    id: "pdf-autocheck",
    title: "PDF plan auto-check / populate",
    subtitle: "DMA production software",
    body: "Software that auto-checks and populates civil plan sets from PDFs, replacing slow manual mark-up loops.",
    badge: "Metric",
  },
};

function paperBlock(paper: Paper, index: number): ContextBlock {
  const excluded = isExcludedFromSite(paper);
  const id = paperId(paper, index);
  const blurb = paper.recruiterBlurb || paper.summary || paper.abstract || paper.note || "";
  return {
    kind: "paper",
    id,
    title: paper.title || "Untitled record",
    subtitle: excluded
      ? `Different authors · ${paper.doi || ""}`.trim()
      : [paper.venue, paper.year, paper.doi].filter(Boolean).join(" · "),
    body: excluded
      ? paper.correction ||
        `This record is not Peter A. Lilley’s work${paper.authors?.length ? ` (authors: ${paper.authors.join(", ")})` : ""}. It is listed only so chat can correct a mixed-up DOI.`
      : blurb,
    href: paper.url,
    badge: excluded ? "Not Peter’s work" : "Personal curiosity · not peer reviewed",
  };
}

export function resolveContextBlocks(corpus: Corpus, intents: ChatIntents): ContextBlock[] {
  const blocks: ContextBlock[] = [];
  const seen = new Set<string>();
  const push = (b: ContextBlock | null | undefined) => {
    if (!b || seen.has(`${b.kind}:${b.id}`)) return;
    seen.add(`${b.kind}:${b.id}`);
    blocks.push(b);
  };

  if (intents.metrics.length) {
    for (const id of intents.metrics) push(METRICS[id]);
  }

  for (const id of intents.projectIds) {
    const p = corpus.projects.find((x) => x.id === id);
    if (!p) continue;
    push({
      kind: "project",
      id: p.id,
      title: p.name,
      subtitle: p.visibility,
      body: p.summary,
      bullets: p.bullets.slice(0, 4),
      href: p.url || undefined,
      badge: p.featured ? "Featured" : "Project",
    });
  }

  for (const id of intents.jobIds) {
    const job = corpus.experience.find((x) => x.id === id);
    if (!job) continue;
    push({
      kind: "job",
      id: job.id,
      title: job.org,
      subtitle: `${job.title} · ${job.dates}`,
      body: job.bullets[0] || "",
      bullets: job.bullets.slice(0, 4),
      badge: "Experience",
    });
  }

  for (const id of intents.skillIds) {
    const g = corpus.skillGroups.find((x) => x.id === id);
    if (!g) continue;
    push({
      kind: "skill",
      id: g.id,
      title: g.label,
      body: g.items.join(" · "),
      badge: "Skills",
    });
  }

  if (intents.paperIds.length) {
    const { papers } = loadPapers();
    papers.forEach((paper, i) => {
      const id = paperId(paper, i);
      const wanted = intents.paperIds.includes(id);
      if (!wanted) return;
      push(paperBlock(paper, i));
    });
  }

  return blocks.slice(0, 5);
}
