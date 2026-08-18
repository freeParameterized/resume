import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Corpus } from "./types.js";

const here = path.dirname(fileURLToPath(import.meta.url));

/** Repo root: apps/api/src → ../../../ */
export const repoRoot = path.resolve(here, "../../..");
const corpusPath = path.join(repoRoot, "data", "corpus.json");

let cached: { mtimeMs: number; data: Corpus } | null = null;

export function loadCorpus(): Corpus {
  const st = fs.statSync(corpusPath);
  if (cached && cached.mtimeMs === st.mtimeMs) return cached.data;
  const data = JSON.parse(fs.readFileSync(corpusPath, "utf8")) as Corpus;
  cached = { mtimeMs: st.mtimeMs, data };
  return data;
}

/** Prefer loadCorpus() per request so data/corpus.json edits apply without a full restart. */
export const corpus = loadCorpus();
