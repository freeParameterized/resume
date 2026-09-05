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
const pdfOut = path.join(publicDir, "2026.08.20_PeterL_Resume.pdf");
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
  const role = doc.role || doc.headline;
  const focus = doc.focus || "";
  const contactLine = [c.location, c.email, c.phone, c.github, c.website].filter(Boolean).map(esc);

  const skills = doc.skills
    .map((s) => `<p class="skill"><span class="k">${esc(s.label)}</span> ${esc(s.items)}</p>`)
    .join("\n");

  const bullets = (items) =>
    items && items.length ? `<ul>${items.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : "";

  const experience = doc.experience
    .map(
      (j) => `
    <article class="entry">
      <h3>${esc(j.title)}</h3>
      <p class="where">${esc(j.org)} — ${esc(j.location)}</p>
      <p class="when">${esc(j.dates)}</p>
      ${bullets(j.printBullets || j.bullets)}
    </article>`,
    )
    .join("\n");

  const projects = doc.projects
    .map(
      (p) => `
    <article class="entry">
      <h3>${esc(p.name)}</h3>
      <p class="stack">${esc(p.stack || p.meta)}</p>
      ${bullets(p.printBullets || p.bullets)}
    </article>`,
    )
    .join("\n");

  const education = doc.education
    .map(
      (e) => `
    <article class="entry">
      <h3>${esc(e.org)}</h3>
      <p class="where">${esc(e.credential)}</p>
      <p class="when">${esc(e.dates)}${e.location ? ` · ${esc(e.location)}` : ""}</p>
      ${e.note ? `<p class="note">${esc(e.note)}</p>` : ""}
    </article>`,
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${esc(doc.name)} — Resume</title>
<style>
  @page { size: letter; margin: 0.55in; }
  html, body { background: #fff; color: #111; margin: 0; padding: 0; }
  body {
    font-family: Georgia, Charter, "Times New Roman", Times, serif;
    font-size: 10pt;
    line-height: 1.28;
    -webkit-font-smoothing: antialiased;
  }
  header { margin-bottom: 10pt; }
  h1 { font-size: 20pt; line-height: 1.05; margin: 0 0 3pt; letter-spacing: -0.01em; }
  .headline { margin: 0 0 4pt; font-size: 10.5pt; }
  .headline .role { font-weight: 700; }
  .contact { font-size: 9pt; margin: 0 0 8pt; color: #222; }
  .contact span + span::before { content: "  |  "; color: #666; }
  .summary { margin: 0; }
  section { margin: 11pt 0 0; }
  h2 {
    font-size: 9pt; text-transform: uppercase; letter-spacing: 0.12em; font-weight: 700;
    border-bottom: 0.6pt solid #111; margin: 0 0 6pt; padding-bottom: 2pt;
    break-after: avoid; page-break-after: avoid;
  }
  .entry { margin-bottom: 8pt; break-inside: avoid; page-break-inside: avoid; }
  .entry:last-child { margin-bottom: 0; }
  h3 { font-size: 10.5pt; font-weight: 700; margin: 0; }
  .where { font-size: 9pt; margin: 0; color: #222; }
  .when { font-size: 9pt; margin: 0 0 2pt; color: #333; font-variant-numeric: tabular-nums; }
  .stack { font-size: 9pt; font-style: italic; margin: 0 0 2pt; color: #222; }
  .note { margin: 2pt 0 0; font-size: 9.5pt; }
  p { margin: 0 0 4pt; orphans: 2; widows: 2; }
  ul { margin: 0; padding: 0; list-style: none; }
  li {
    position: relative; padding-left: 12pt; margin-bottom: 2pt;
    break-inside: avoid; page-break-inside: avoid;
  }
  li::before { content: "\\2013"; position: absolute; left: 0; top: 0; }
  li:last-child { margin-bottom: 0; }
  .skill { break-inside: avoid; page-break-inside: avoid; margin: 0 0 2.5pt; }
  .skill .k { font-weight: 700; margin-right: 6pt; }
</style>
</head>
<body>
  <header>
    <h1>${esc(doc.name)}</h1>
    <p class="headline"><span class="role">${esc(role)}</span>${focus ? ` · ${esc(focus)}` : ""}</p>
    <p class="contact">${contactLine.map((part) => `<span>${part}</span>`).join("")}</p>
    <p class="summary">${esc(doc.summary)}</p>
  </header>
  <section><h2>Experience</h2>${experience}</section>
  <section><h2>Selected Projects</h2>${projects}</section>
  <section><h2>Skills</h2>${skills}</section>
  <section><h2>Education</h2>${education}</section>
</body>
</html>`;
}

function buildText(doc) {
  const c = doc.contact;
  const role = doc.role || doc.headline;
  const out = [
    doc.name,
    [role, doc.focus].filter(Boolean).join(" · "),
    [c.location, c.email, c.phone, c.github, c.website].filter(Boolean).join(" | "),
    "",
    doc.summary,
    "",
    "EXPERIENCE",
  ].filter((line) => line != null);
  for (const j of doc.experience) {
    out.push("", j.title, `${j.org} — ${j.location}`, j.dates);
    for (const b of j.printBullets || j.bullets) out.push(`– ${b}`);
  }
  out.push("", "SELECTED PROJECTS");
  for (const p of doc.projects) {
    out.push("", p.name, p.stack || p.meta);
    for (const b of p.printBullets || p.bullets) out.push(`– ${b}`);
  }
  out.push("", "SKILLS");
  for (const s of doc.skills) out.push(`${s.label} ${s.items}`);
  out.push("", "EDUCATION");
  for (const e of doc.education) {
    out.push("", e.org, e.credential, e.dates);
    if (e.note) out.push(e.note);
  }
  return out.join("\n") + "\n";
}

function buildMarkdown(doc) {
  const c = doc.contact;
  const role = doc.role || doc.headline;
  const lines = [
    `# ${doc.name}`,
    "",
    `**${[role, doc.focus].filter(Boolean).join(" · ")}**`,
    "",
    [c.location, c.email, c.phone, c.github, c.website].filter(Boolean).join(" | "),
    "",
    doc.summary,
    "",
    "## Experience",
  ];
  for (const j of doc.experience) {
    lines.push("", `### ${j.title}`, `${j.org} — ${j.location}`, j.dates, "");
    for (const b of j.printBullets || j.bullets) lines.push(`- ${b}`);
  }
  lines.push("", "## Selected Projects");
  for (const p of doc.projects) {
    lines.push("", `### ${p.name}`, `*${p.stack || p.meta}*`, "");
    for (const b of p.printBullets || p.bullets) lines.push(`- ${b}`);
  }
  lines.push("", "## Skills", "");
  for (const s of doc.skills) lines.push(`**${s.label}** ${s.items}`);
  lines.push("", "## Education");
  for (const e of doc.education) {
    lines.push("", `### ${e.org}`, e.credential, e.dates);
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
    { stdio: "inherit", timeout: 180_000 },
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
  if (!/EXPERIENCE|Experience/.test(extracted)) fail("extracted text has no Experience heading — content did not render");
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
