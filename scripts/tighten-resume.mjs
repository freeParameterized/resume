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
  "I am a software engineer. I build production systems that other professionals use daily. I built software that makes 3D CAD models from text commands. This software also sets up construction drawings. It uses a local language model for intent and C#/.NET code for geometry and validation. I also built software that reads PDF plans to check and fill them automatically. This reduced a manual task from 8 to 12 hours to about 30 seconds. I write code in C#, Python, C++17, TypeScript, and Dart.";

const bullets = {
  "David Mason & Associates": [
    "I built software that makes 3D CAD models from text commands. This software also sets up construction drawings. I introduced this tool to the firm.",
    "I built software that reads PDF plans to check and fill them automatically. This replaced a manual review process.",
    "I wrote Python and Dynamo scripts to automate repetitive drawing tasks. This reduced task time from 8 to 12 hours to about 30 seconds. It also reduced errors by about 25 percent.",
    "I designed data structures for 3D model parts. I coordinated drawing standards across civil, mechanical, plumbing, and architectural teams.",
  ],
  "Component Bar Products": [
    "I programmed and operated machines to measure parts. I checked parts to a tolerance of 0.001 inches or better.",
    "I compared part dimensions to 3D models and drawings. This found geometry errors before they caused scrap.",
    "I enforced ISO 9001 standards across production lines. I managed the calibration and tracking of measurement tools.",
  ],
  "Heideman & Associates, Inc.": [
    "I made mechanical and plumbing drawings in Revit and AutoCAD. I checked drawing standards for consistency.",
    "I built automated data libraries for building parts. I updated hundreds of old drawing details.",
  ],
};

for (const job of doc.experience) {
  if (bullets[job.org]) job.bullets = bullets[job.org];
}

const projectBullets = {
  "Digital Twin Pro": [
    "I designed, funded, and released a 3D inventory application. I published it to a Google Play beta and Windows desktop.",
    "I wrote the 3D graphics code by hand. I used a custom projection and depth sorting method.",
    "I added photo detection and voice input using a paid Google API. I added local database storage and data export.",
  ],
  "CAD integration bridge": [
    "I built a C++ desktop application. It connects to BricsCAD, AutoCAD, and Civil 3D. It finds installed tools and loads plugins while running.",
  ],
  "Interactive portfolio (this site)": [
    "I built a portfolio website. It uses a local language model to answer questions. It can use speech for input and output.",
  ],
  "Interactive portfolio (this site)": [
    "I built a portfolio website. It uses a local language model to answer questions. It can use speech for input and output.",
  ],
};

for (const project of doc.projects) {
  if (projectBullets[project.name]) project.bullets = projectBullets[project.name];
}

for (const school of doc.education) {
  if (school.note) {
    school.note = "General education and freshman-level coursework. Technical fluency in Spanish.";
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
