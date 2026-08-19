/**
 * Reads logs/visits.log and prints who has been by, in English.
 * Usage: npm run visits            (last 7 days)
 *        npm run visits -- --days 30
 *        npm run visits -- --raw   (the last 40 log lines verbatim)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOG = path.join(repoRoot, "logs", "visits.log");
const ROTATED = path.join(repoRoot, "logs", "visits.1.log");

const args = process.argv.slice(2);
const days = Math.max(1, Number(args[args.indexOf("--days") + 1]) || 7);
const raw = args.includes("--raw");

function readLines(file) {
  try {
    return fs.readFileSync(file, "utf8").split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

/** `2026-08-19T00:12:33Z event=page session=abc client=Chrome/Windows` → object */
function parse(line) {
  const [stamp, ...rest] = line.split(" ");
  const when = new Date(stamp);
  if (Number.isNaN(when.getTime())) return null;
  const entry = { when, text: "" };
  for (const token of rest) {
    const eq = token.indexOf("=");
    if (eq < 0) continue;
    const key = token.slice(0, eq);
    const value = token.slice(eq + 1);
    if (key === "text") entry.text = rest.join(" ").replace(/^.*?text="/, "").replace(/"$/, "");
    else entry[key] = value;
  }
  return entry.event ? entry : null;
}

const lines = [...readLines(ROTATED), ...readLines(LOG)];

if (!lines.length) {
  console.log("No visits recorded yet.");
  console.log(`Log file: ${path.relative(repoRoot, LOG)} (created on the first page view)`);
  console.log("If the API is running and this stays empty, check VISIT_LOG in .env.");
  process.exit(0);
}

if (raw) {
  console.log(lines.slice(-40).join("\n"));
  process.exit(0);
}

const entries = lines.map(parse).filter(Boolean);
const cutoff = Date.now() - days * 86_400_000;
const recent = entries.filter((e) => e.when.getTime() >= cutoff);

/** Local calendar day, because "today" means his today, not UTC's. */
function dayKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const today = dayKey(new Date());
const yesterday = dayKey(new Date(Date.now() - 86_400_000));

function label(key) {
  if (key === today) return "Today";
  if (key === yesterday) return "Yesterday";
  return key;
}

function plural(n, one, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

/** "2 Chrome/Windows, 1 Safari/iOS" */
function clientBreakdown(counts) {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([client, n]) => `${n} ${client}`)
    .join(", ");
}

const byDay = new Map();
for (const e of recent) {
  const key = dayKey(e.when);
  if (!byDay.has(key)) {
    byDay.set(key, {
      visits: new Set(),
      clients: new Map(),
      chats: 0,
      resumes: 0,
      voice: new Set(),
      sessions: new Map(),
    });
  }
  const day = byDay.get(key);
  if (e.event === "page") {
    if (!day.visits.has(e.session)) {
      day.visits.add(e.session);
      day.clients.set(e.client, (day.clients.get(e.client) || 0) + 1);
    }
  }
  if (e.event === "chat") day.chats += 1;
  if (e.event === "resume") day.resumes += 1;
  if (e.event === "voice") day.voice.add(e.session);

  if (!day.sessions.has(e.session)) {
    day.sessions.set(e.session, { first: e.when, client: e.client, page: 0, chat: 0, resume: 0, voice: 0, asked: [] });
  }
  const s = day.sessions.get(e.session);
  s[e.event] = (s[e.event] || 0) + 1;
  if (e.text) s.asked.push(e.text);
}

const sortedDays = [...byDay.keys()].sort().reverse();

console.log(`Visitor log: ${path.relative(repoRoot, LOG)}`);
console.log(`${plural(entries.length, "entry", "entries")} total, last ${days} day${days === 1 ? "" : "s"} below.\n`);

for (const key of sortedDays) {
  const d = byDay.get(key);
  const bits = [];
  if (d.visits.size) bits.push(`${plural(d.visits.size, "visit")}: ${clientBreakdown(d.clients)}`);
  if (d.chats) bits.push(plural(d.chats, "chat message"));
  if (d.resumes) bits.push(plural(d.resumes, "resume download"));
  if (d.voice.size) bits.push(`voice used by ${plural(d.voice.size, "visitor")}`);
  console.log(`${label(key)} - ${bits.length ? bits.join("; ") : "no activity"}`);
}

const lastDay = byDay.get(sortedDays[0]);
if (lastDay) {
  const day = label(sortedDays[0]);
  console.log(`\nSessions ${day === "Today" || day === "Yesterday" ? day.toLowerCase() : `on ${day}`}:`);
  const sessions = [...lastDay.sessions.entries()].sort((a, b) => a[1].first - b[1].first);
  for (const [id, s] of sessions) {
    const did = [];
    if (s.page) did.push(s.page > 1 ? `${s.page} page views` : "opened the site");
    if (s.chat) did.push(plural(s.chat, "question"));
    if (s.resume) did.push(plural(s.resume, "resume download"));
    if (s.voice) did.push("used voice");
    const time = s.first.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    console.log(`  ${time}  ${(s.client || "Unknown").padEnd(16)} ${did.join(", ") || "no events"}  [${id}]`);
    for (const q of s.asked) console.log(`            asked: ${q}`);
  }
}

const anyText = recent.some((e) => e.text);
if (!anyText) {
  console.log("\nQuestion text is not recorded. Set VISIT_LOG_MESSAGES=1 in .env to record it.");
}
console.log("No IP addresses, locations, or full user-agent strings are ever written.");
