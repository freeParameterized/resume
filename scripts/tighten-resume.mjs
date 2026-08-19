/**
 * One-shot content tightening for data/resume.json: every bullet trimmed to 1-2 rendered
 * lines, present tense for the current role and past tense for prior ones, and plain ASCII
 * punctuation throughout because this text also feeds the PDF and plain-text exports.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(root, "data", "resume.json");
const doc = JSON.parse(fs.readFileSync(file, "utf8"));

doc.summary =
  "Software engineer who ships production systems other professionals use daily. Built a language-to-geometry pipeline: a plain-language interface that generates 3D models and sets up engineering deliverables, with locally hosted LLM inference handling intent and deterministic C#/.NET code owning geometry construction and validation. Also builds OCR ingestion and automation that cut repetitive drafting from 8-12 hours to about 30 seconds per cycle. Works in C#, Python, C++17, TypeScript, and Dart.";

const bullets = {
  "David Mason & Associates": [
    "Build CAD generation tooling that turns natural-language input into 3D models and drawing setup, using local LLM inference for intent and deterministic C#/.NET for geometry and validation; introduced this capability at the firm.",
    "Built OCR ingestion that parses existing PDF plan sets to auto-check and auto-populate them, replacing a manual mark-up loop.",
    "Automate repetitive drafting with Python and Dynamo, cutting cycles from 8-12 hours to about 30 seconds and reducing errors reaching licensed-engineer review by roughly 25%.",
    "Design typed metadata schemas carried on model entities, and coordinate standards automation across civil, mechanical, plumbing, and architectural disciplines.",
  ],
  "Component Bar Products": [
    "Programmed and operated coordinate measuring machines, verifying precision-machined parts to +/-0.001 inch or tighter against GD&T specifications.",
    "Validated dimensional tolerances against CAD models and customer prints so machining problems surfaced as geometry mismatches, not downstream scrap.",
    "Enforced ISO 9001 across production lines, integrated Production Part Approval Process documentation, and managed calibration and traceability of metrology assets.",
  ],
  "Menard, Inc.": [
    "Produced quantity takeoffs and commercial and residential material estimates under deadline, and handled contractor-facing pro sales that turned vague requirements into exact material lists.",
    "Supervised department staff in a high-volume Building Materials department, and ran inventory, pricing data, and freight quality control.",
  ],
  "Heideman & Associates, Inc.": [
    "Produced mechanical and plumbing construction documents and as-built models in Revit and AutoCAD, auditing standards for cross-discipline consistency.",
    "Built automated data libraries for building-system objects and standardized hundreds of outdated details.",
  ],
};

for (const job of doc.experience) {
  if (bullets[job.org]) job.bullets = bullets[job.org];
}

const projectBullets = {
  "Digital Twin Pro": [
    "Designed, funded, and shipped a cross-platform 3D inventory application to a Google Play beta, plus a Windows desktop build.",
    "Wrote the 3D renderer by hand instead of using a game engine: painter's-algorithm scene rendering with a Z-sorted draw queue and custom projection.",
    "Added photo-based item detection and voice entry via a paid Gemini API, SQLite persistence with a move audit log, QR booklets, and CSV/JSON export.",
  ],
  "CAD integration bridge": [
    "Built a C++17 Dear ImGui host that COM-bridges BricsCAD, AutoCAD, and Civil 3D, discovers installed SDKs at runtime, and hot-loads LISP, C#, and BRX plugins (~14k lines).",
  ],
  "Living resume (this site)": [
    "Built a React Three Fiber portfolio over an Express API that retrieves from a curated corpus and answers through a local model, with on-device speech, degrading to extractive answers when no model runs.",
  ],
};

for (const project of doc.projects) {
  if (projectBullets[project.name]) project.bullets = projectBullets[project.name];
}

for (const school of doc.education) {
  if (school.note) {
    school.note = "Object-oriented C++ and linear algebra coursework. Technical fluency in Spanish.";
  }
}

/** Smart punctuation has broken twice in this pipeline; keep the data plain. */
function asciify(value) {
  if (typeof value === "string") {
    return value
      .replace(/[\u2014\u2013]/g, "-")
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201c\u201d]/g, '"')
      .replace(/\u2026/g, "...")
      .replace(/\u00b7/g, "|")
      .replace(/\u00b1/g, "+/-")
      .replace(/\u2192/g, "->");
  }
  if (Array.isArray(value)) return value.map(asciify);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, asciify(v)]));
  }
  return value;
}

const cleaned = asciify(doc);
fs.writeFileSync(file, `${JSON.stringify(cleaned, null, 2)}\n`, { encoding: "utf8" });

const nonAscii = JSON.stringify(cleaned).match(/[^\x00-\x7F]/g);
console.log(`resume.json rewritten; summary ${cleaned.summary.length} chars`);
console.log(`non-ascii characters remaining: ${nonAscii ? [...new Set(nonAscii)].join(" ") : "none"}`);
