#!/usr/bin/env node
/**
 * Renders data/resume.json into a standalone static HTML file, prints it to PDF with
 * headless Edge/Chrome, and writes plain-text and Markdown variants.
 *
 * Deliberately does NOT print the SPA route: an unhydrated single-page app is the classic
 * cause of a valid-but-blank PDF, and the print sheet must not depend on WebGL or JS.
 * Every output is validated before the script is allowed to succeed.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const dataPath = path.join(repoRoot, "data", "resume.json");
const publicDir = path.join(repoRoot, "apps", "web", "public");
const pdfOut = path.join(publicDir, "PeterLilley_Resume.pdf");
const txtOut = path.join(publicDir, "PeterLilley_Resume.txt");
const mdOut = path.join(publicDir, "PeterLilley_Resume.md");

function fail(message) {
  console.error(`\n[resume:pdf] FAILED — ${message}\n`);
  process.exit(1);
}

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].filter(Boolean);
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function buildHtml(doc) {
  const c = doc.contact;
  const contactLine = [
    c.location,
    c.email,
    `Phone: ${c.phone}`,
    c.github,
    c.website,
    c.company,
  ]
    .filter(Boolean)
    .map(esc)
    // Separator drawn by CSS rather than a unicode middot, which has broken in this pipeline.
    .map((part) => `<span>${part}</span>`)
    .join("");

  const skills = doc.skills
    .map((s) => `<p class="skill"><span class="k">${esc(s.label)}:</span> ${esc(s.items)}</p>`)
    .join("\n");

  /**
   * Dates sit in their own right-aligned column on the same baseline as the role, which is
   * the convention recruiters scan. Flexbox rather than a table keeps the reading order
   * linear for applicant tracking systems.
   */
  const entry = (title, subtitle, right, bullets, note) => `
    <article class="entry">
      <div class="row">
        <h3>${esc(title)}</h3>
        ${right ? `<span class="when">${esc(right)}</span>` : ""}
      </div>
      ${subtitle ? `<p class="where">${esc(subtitle)}</p>` : ""}
      ${note ? `<p class="note">${esc(note)}</p>` : ""}
      ${
        bullets && bullets.length
          ? `<ul>${bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`
          : ""
      }
    </article>`;

  const experience = doc.experience
    .map((j) => entry(`${j.org} - ${j.title}`, j.location, j.dates, j.bullets))
    .join("\n");

  const projects = doc.projects.map((p) => entry(p.name, p.meta, null, p.bullets)).join("\n");

  const education = doc.education
    .map((e) => entry(`${e.credential} - ${e.org}`, e.location, e.dates, null, e.note))
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${esc(doc.name)} — Resume</title>
<style>
  /* One family, real weights. Georgia is present on Windows and macOS and renders well
     both on screen and in print, so the recipient sees what we rendered here. */
  @page { size: letter; margin: 0.6in; }
  html, body { background: #fff; color: #000; margin: 0; padding: 0; }
  body {
    font-family: Georgia, Charter, "Times New Roman", Times, serif;
    font-size: 10.5pt;
    line-height: 1.22;
    -webkit-font-smoothing: antialiased;
  }

  /* Header: name dominant, one compact contact line beneath. */
  header { border-bottom: 1pt solid #000; padding-bottom: 6pt; margin-bottom: 11pt; }
  h1 { font-size: 22pt; line-height: 1.05; margin: 0 0 3pt; letter-spacing: -0.01em; }
  .headline { font-weight: 700; margin: 0 0 5pt; font-size: 10.5pt; }
  .contact { font-size: 9pt; margin: 0; color: #1a1a1a; }
  /* Delimiter comes from CSS so no unicode punctuation is needed in the content. */
  .contact span + span::before { content: "  |  "; color: #666; }

  /* More space above a heading than below it, so each section reads as one group. */
  section { margin: 0 0 4pt; }
  section + section { margin-top: 13pt; }
  h2 {
    font-size: 9.5pt; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700;
    border-bottom: 0.5pt solid #999; margin: 0 0 6pt; padding-bottom: 2pt;
    break-after: avoid; page-break-after: avoid;
  }

  .entry { margin-bottom: 9pt; break-inside: avoid; page-break-inside: avoid; }
  .entry:last-child { margin-bottom: 0; }
  .row { display: flex; justify-content: space-between; align-items: baseline; gap: 12pt; }
  h3 { font-size: 10.5pt; font-weight: 700; margin: 0; }
  .when { font-size: 9pt; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .where { font-size: 9pt; font-style: italic; margin: 0 0 3pt; color: #222; }
  .note { margin: 0 0 3pt; }
  p { margin: 0 0 4pt; orphans: 2; widows: 2; }

  /* Hanging indent: wrapped lines align under the text, not under the marker. */
  ul { margin: 0; padding: 0; list-style: none; }
  li {
    position: relative; padding-left: 11pt; margin-bottom: 2.5pt;
    break-inside: avoid; page-break-inside: avoid;
  }
  li::before { content: "\\2022"; position: absolute; left: 0; top: 0; }
  li:last-child { margin-bottom: 0; }

  .skill { break-inside: avoid; page-break-inside: avoid; margin: 0 0 3pt; }
  .skill .k { font-weight: 700; }
</style>
</head>
<body>
  <header>
    <h1>${esc(doc.name)}</h1>
    <p class="headline">${esc(doc.headline)}</p>
    <p class="contact">${contactLine}</p>
  </header>
  <section><h2>Summary</h2><p>${esc(doc.summary)}</p></section>
  <section><h2>Skills</h2>${skills}</section>
  <section><h2>Experience</h2>${experience}</section>
  <section><h2>Projects</h2>${projects}</section>
  <section><h2>Education</h2>${education}</section>
</body>
</html>`;
}

function buildText(doc) {
  const c = doc.contact;
  const out = [
    doc.name,
    doc.headline,
    [c.location, c.email, `Phone: ${c.phone}`, c.github, c.website, c.company].filter(Boolean).join(" | "),
    "",
    "SUMMARY",
    doc.summary,
    "",
    "SKILLS",
    ...doc.skills.map((s) => `${s.label}: ${s.items}`),
    "",
    "EXPERIENCE",
  ];
  for (const j of doc.experience) {
    out.push("", `${j.title} - ${j.org} | ${j.location} | ${j.dates}`);
    for (const b of j.bullets) out.push(`- ${b}`);
  }
  out.push("", "PROJECTS");
  for (const p of doc.projects) {
    out.push("", `${p.name} | ${p.meta}`);
    for (const b of p.bullets) out.push(`- ${b}`);
  }
  out.push("", "EDUCATION");
  for (const e of doc.education) {
    out.push("", `${e.credential} - ${e.org} | ${e.location} | ${e.dates}`);
    if (e.note) out.push(e.note);
  }
  return out.join("\n") + "\n";
}

function buildMarkdown(doc) {
  const c = doc.contact;
  const lines = [
    `# ${doc.name}`,
    "",
    `**${doc.headline}**`,
    "",
    [c.location, c.email, `Phone: ${c.phone}`, c.github, c.website, c.company].filter(Boolean).join(" · "),
    "",
    "## Summary",
    "",
    doc.summary,
    "",
    "## Skills",
    "",
    ...doc.skills.map((s) => `- **${s.label}:** ${s.items}`),
    "",
    "## Experience",
  ];
  for (const j of doc.experience) {
    lines.push("", `### ${j.title} — ${j.org}`, `*${j.location} · ${j.dates}*`, "");
    for (const b of j.bullets) lines.push(`- ${b}`);
  }
  lines.push("", "## Projects");
  for (const p of doc.projects) {
    lines.push("", `### ${p.name}`, `*${p.meta}*`, "");
    for (const b of p.bullets) lines.push(`- ${b}`);
  }
  lines.push("", "## Education");
  for (const e of doc.education) {
    lines.push("", `### ${e.credential} — ${e.org}`, `*${e.location} · ${e.dates}*`);
    if (e.note) lines.push("", e.note);
  }
  return lines.join("\n") + "\n";
}

// ---------------------------------------------------------------- generate

if (!fs.existsSync(dataPath)) fail(`missing ${dataPath}`);
const doc = JSON.parse(fs.readFileSync(dataPath, "utf8"));
fs.mkdirSync(publicDir, { recursive: true });

const html = buildHtml(doc);
const tmpHtml = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "resume-")), "resume.html");
fs.writeFileSync(tmpHtml, html, "utf8");
// Kept out of the published output; RESUME_DEBUG_HTML=1 leaves a copy to screenshot and review.
if (process.env.RESUME_DEBUG_HTML === "1") {
  const debugOut = path.join(os.tmpdir(), "resume-preview.html");
  fs.writeFileSync(debugOut, html, "utf8");
  console.log(`[resume:pdf] preview html: ${debugOut}`);
}

const browser = findBrowser();
if (!browser) {
  fail(
    "no Chrome or Edge binary found. Set CHROME_PATH to a Chromium-based browser executable and re-run.",
  );
}
console.log(`[resume:pdf] browser: ${browser}`);
console.log(`[resume:pdf] source:  ${tmpHtml}`);

if (fs.existsSync(pdfOut)) fs.rmSync(pdfOut);

const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "resume-profile-"));
try {
  execFileSync(
    browser,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--no-first-run",
      "--no-default-browser-check",
      `--user-data-dir=${profileDir}`,
      // Give the renderer time to lay the page out before the snapshot is taken.
      "--virtual-time-budget=10000",
      "--run-all-compositor-stages-before-draw",
      "--no-pdf-header-footer",
      `--print-to-pdf=${pdfOut}`,
      `file:///${tmpHtml.replace(/\\/g, "/")}`,
    ],
    { stdio: "inherit", timeout: 120_000 },
  );
} catch (err) {
  fail(`headless print did not complete: ${err.message}`);
}

// ---------------------------------------------------------------- validate

if (!fs.existsSync(pdfOut)) fail("no PDF was produced at all");

const buf = fs.readFileSync(pdfOut);
const head = buf.subarray(0, 8).toString("latin1");
const tail = buf.subarray(-1024).toString("latin1");

if (!head.startsWith("%PDF-")) {
  fail(`output is not a PDF. First bytes were: ${JSON.stringify(head)}`);
}
if (!tail.includes("%%EOF")) fail("PDF has no %%EOF trailer — the file is truncated");
if (buf.length < 10_000) fail(`PDF is only ${buf.length} bytes, which means it rendered empty`);

const pageCount = (buf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
if (pageCount < 1) fail("could not find any page objects in the PDF");
if (pageCount > 2) fail(`PDF is ${pageCount} pages; it must fit on 1–2. Trim bullets in data/resume.json.`);

// Text must be extractable, not a scanned image.
let extracted = "";
try {
  extracted = execFileSync("pdftotext", [pdfOut, "-"], { encoding: "utf8", timeout: 30_000 });
} catch {
  console.log("[resume:pdf] note: pdftotext unavailable, falling back to a raw stream check");
}
if (extracted) {
  if (!extracted.includes("Lilley")) fail("extracted text does not contain his name — the page printed blank");
  if (!/SUMMARY|Summary/.test(extracted)) fail("extracted text has no Summary heading — content did not render");
  console.log(`[resume:pdf] extracted ${extracted.trim().split(/\s+/).length} words of selectable text`);
} else if (!buf.includes(Buffer.from("Lilley", "latin1")) && !buf.includes(Buffer.from("FlateDecode"))) {
  fail("PDF contains no recognizable text streams");
}

fs.writeFileSync(txtOut, buildText(doc), "utf8");
fs.writeFileSync(mdOut, buildMarkdown(doc), "utf8");

console.log(`[resume:pdf] OK  ${pdfOut}`);
console.log(`[resume:pdf]     ${(buf.length / 1024).toFixed(1)} KB, ${pageCount} page(s), starts with ${head.trim()}`);
console.log(`[resume:pdf] OK  ${txtOut}`);
console.log(`[resume:pdf] OK  ${mdOut}`);
