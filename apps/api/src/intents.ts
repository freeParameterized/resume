import { isExcludedFromSite, loadPapers, paperId } from "./papers.js";

export type ChatIntents = {
  projectIds: string[];
  jobIds: string[];
  skillIds: string[];
  paperIds: string[];
  metrics: string[];
};

export const PROJECT_ALIASES: Record<string, string[]> = {
  "digital-twin-pro": [
    "digital twin pro",
    "dt pro",
    "flutter",
    "dart",
    "arcore",
    "painter",
    "tote",
    "inventory twin",
    "play store",
    "apphive",
    "gemini",
  ],
  "cadnat-bridge": ["cadnat", "bridge studio", "bricscad", "hotload", "imgui studio", "com bridge"],
  "runoff-hydrology": [
    "runoff",
    "drainage",
    "hydrolog",
    "hydraulic",
    "watershed",
    "msd",
    "pipe network",
    "storm",
    "differential",
  ],
  "ctb-standards-diff": ["ctb", "plot style", "lineweight", "standards diff", "standards audit"],
  "backup-deduper": ["deduper", "dedupe", "backup", "sha-256", "sha256", "adb"],
  "maintenance-tracker": ["maintenance", "tenant", "supabase", "portal prototype"],
  hatchcalc: ["hatchcalc", "hatch calc", "template plugin"],
  "offline-cad-voice": ["cad gui", "working_cad", "whisper", "voice command", "vosk", "speech"],
  "circle-visualizer": ["circlevisualizer", "circle visualizer", "roots of unity", "harmonic"],
  "property-set": ["property set", "propertyset", "xdata"],
  "cbp-ocr": ["tesseract", "ocr", "itext"],
  "grok-tensor": ["manim", "tensor visual", "grok-tensor"],
  "local-llm": ["ollama", "lm studio", "open webui", "local llm", "local model", "local inference"],
  photogrammetry: ["colmap", "instant-ngp", "nerf"],
  "interactive-portfolio": ["this site", "this website", "interactive portfolio", "how does this work"],
};

const JOB_ALIASES: Record<string, string[]> = {
  dma: ["david mason", "dma", "staff technician", "civil 3d", "current job", "day job"],
  cbp: [
    "component bar",
    "gd&t",
    "gdt",
    "cmm",
    "quality engineer",
    "iso 9001",
    "ppap",
    "machining",
    "metrology",
    "tolerance",
  ],
  heideman: ["heideman", "revit", "mep"],
};

const SKILL_ALIASES: Record<string, string[]> = {
  llm: ["ollama", "llm", "ocr", "tesseract", "machine learning", " ml ", "whisper"],
  languages: ["c++", "c#", "csharp", "python", "lisp", "javascript", "typescript", "dart"],
  cad: ["civil 3d", "autocad", "revit", "dynamo", "xdata"],
  math: ["matrix transforms", "graph theory", "matrix", "math"],
  manufacturing: ["gd&t", "cmm", "iso 9001", "ppap", "inspection", "metrology"],
  estimating: ["takeoff", "takeoffs", "estimating", "estimate"],
};

const METRIC_ALIASES: Record<string, string[]> = {
  "cycle-time": ["8–12", "8-12", "30 second", "30 seconds", "~30"],
  "error-rate": ["25%", "fewer errors", "pe review"],
  "pdf-autocheck": ["pdf", "auto-check", "autocheck", "populate"],
};

export function detectIntents(question: string, answer = ""): ChatIntents {
  const hay = `${question}\n${answer}`.toLowerCase();

  const projectIds: string[] = [];
  for (const [id, keys] of Object.entries(PROJECT_ALIASES)) {
    if (keys.some((k) => hay.includes(k))) projectIds.push(id);
  }
  const jobIds: string[] = [];
  for (const [id, keys] of Object.entries(JOB_ALIASES)) {
    if (keys.some((k) => hay.includes(k))) jobIds.push(id);
  }
  const skillIds: string[] = [];
  for (const [id, keys] of Object.entries(SKILL_ALIASES)) {
    if (keys.some((k) => hay.includes(k))) skillIds.push(id);
  }
  const metrics: string[] = [];
  for (const [id, keys] of Object.entries(METRIC_ALIASES)) {
    if (keys.some((k) => hay.includes(k))) metrics.push(id);
  }
  const paperIds: string[] = [];
  const { papers } = loadPapers();
  papers.forEach((p, i) => {
    const id = paperId(p, i);
    const needles = [p.id, p.doi, p.conceptDoi, p.title, p.titleTranslated]
      .filter(Boolean)
      .map((s) => String(s).toLowerCase());
    if (needles.some((n) => n.length > 8 && hay.includes(n))) paperIds.push(id);
  });
  // Deliberately narrow: the Zenodo write-up is never volunteered on ML or programming questions.
  if (/\b(paper|preprint|zenodo|doi|gravity|relativity|physics|quantum)\b/.test(hay)) {
    papers.forEach((p, i) => {
      if (isExcludedFromSite(p)) return;
      paperIds.push(paperId(p, i));
    });
  }

  return {
    projectIds: [...new Set(projectIds)].slice(0, 4),
    jobIds: [...new Set(jobIds)].slice(0, 2),
    skillIds: [...new Set(skillIds)].slice(0, 2),
    paperIds: [...new Set(paperIds)].slice(0, 2),
    metrics: [...new Set(metrics)].slice(0, 3),
  };
}
