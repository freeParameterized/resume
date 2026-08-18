import fs from "node:fs";
import path from "node:path";
import { repoRoot } from "./corpus.js";
import type { Chunk } from "./types.js";

export type Paper = {
  id?: string;
  title?: string;
  titleTranslated?: string;
  url?: string;
  doi?: string;
  conceptDoi?: string;
  summary?: string;
  abstract?: string;
  venue?: string;
  year?: string | number;
  label?: string;
  authorshipVerified?: boolean;
  authorshipNote?: string;
  notPeters?: boolean;
  optional?: boolean;
  authors?: string[];
  note?: string;
  notes?: string;
  correction?: string;
  honestFraming?: string;
  recruiterBlurb?: string;
  resumeBulletWarning?: string;
  recommendedPlacement?: string;
  volunteerPolicy?: string;
};

export type PapersFile = {
  available: boolean;
  papers: Paper[];
};

function normalize(raw: unknown): Paper[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as Paper[];
  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.papers)) return obj.papers as Paper[];
    if (Array.isArray(obj.items)) return obj.items as Paper[];
  }
  return [];
}

export function loadPapers(): PapersFile {
  const p = path.join(repoRoot, "data", "papers.json");
  if (!fs.existsSync(p)) {
    return { available: false, papers: [] };
  }
  try {
    const raw = JSON.parse(fs.readFileSync(p, "utf8")) as unknown;
    return { available: true, papers: normalize(raw) };
  } catch {
    return { available: false, papers: [] };
  }
}

export function paperId(paper: Paper, index: number): string {
  return paper.id || paper.doi || `paper-${index}`;
}

/** Records that must never be shown on the site (they are not Peter's work). */
export function isExcludedFromSite(paper: Paper): boolean {
  return paper.notPeters === true || /exclude/i.test(paper.recommendedPlacement || "");
}

/** Deep-dive listing: only records that are his, always labeled as personal curiosity. */
export function papersForSite(papers: Paper[]): Paper[] {
  return papers.filter((p) => !isExcludedFromSite(p));
}

export function formatPapersPolicy(papers: Paper[]): string {
  if (!papers.length) return "";
  const lines = [
    "ZENODO / WRITE-UP POLICY (authoritative; do not override):",
    "- Zenodo is an unrefereed self-deposit archive. NEVER say published research, published paper, or peer reviewed. NEVER call Peter a physicist or a quantum gravity researcher.",
    "- Acceptable phrasing: 'a speculative preprint he wrote', 'a self-deposited Zenodo proposal', 'a DOI-archived personal write-up'.",
    "- Do NOT bring the write-up up when the question is about machine learning, programming ability, or engineering experience. Only discuss it if the visitor asks about the paper, the DOI, Zenodo, physics, or gravity.",
    "- Frame it as personal curiosity and self-awareness, never as a credential.",
  ];
  papers.forEach((p, i) => {
    const id = paperId(p, i);
    if (isExcludedFromSite(p)) {
      lines.push(
        `- ${id}: NOT PETER'S WORK. ${p.correction || `Authors: ${(p.authors || []).join(", ") || "see record"}. If asked about this DOI or URL, say it is unrelated to Peter.`}`,
      );
      return;
    }
    lines.push(
      `- ${id}: Peter A. Lilley wrote this; it is deposited under his own company Free Parameter LLC. Title: ${p.title || "Untitled"}. ${p.recruiterBlurb || ""} ${p.resumeBulletWarning || ""}`.trim(),
    );
  });
  return lines.join("\n");
}

export function paperChunks(papers: Paper[]): Chunk[] {
  return papers.map((p, i) => {
    const id = paperId(p, i);
    const excluded = isExcludedFromSite(p);
    const blurb = p.recruiterBlurb || p.summary || p.abstract || "";
    const text = excluded
      ? `NOT PETER'S WORK. ${p.title || "Untitled"}. ${p.correction || ""} Authors: ${(p.authors || []).join(", ")}. If a visitor cites this DOI or URL, correct them: it is a different authors' paper, unrelated to Peter A. Lilley.`
      : `Peter A. Lilley wrote this and registered himself as its author; it is deposited under his own company, Free Parameter LLC. ${blurb} ${p.honestFraming || ""} It is a speculative, self-deposited Zenodo record typed as a Proposal on an unrefereed archive — not peer reviewed and not published research in the academic sense. Its own metadata notes the LaTeX was generated with LLM assistance, and it contains known numerical and dimensional errors. Only discuss it if the visitor asks about the paper, the DOI, Zenodo, physics, or gravity — never volunteer it in answers about machine learning or programming ability. ${p.resumeBulletWarning || ""}`;
    return {
      id: `paper-${id}`,
      title: p.title || "Zenodo record",
      tags: excluded
        ? ["paper", "zenodo", "not-his", "correction", "17443953"]
        : ["paper", "zenodo", "gravity", "tensor", "doi", "personal curiosity", "speculative"],
      text,
    };
  });
}
