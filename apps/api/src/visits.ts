/**
 * Visitor log: enough to know someone opened the link and what they did, and nothing
 * that identifies them.
 *
 * Recorded: UTC timestamp, event type, a coarse browser/OS family, and a random session
 * id the client generates so events from one sitting group together.
 *
 * Deliberately NOT recorded: IP addresses, geolocation, raw user-agent strings, screen
 * size, language, or anything else fingerprint-grade. Chat text is off unless
 * VISIT_LOG_MESSAGES=1 is set in .env.
 *
 * The file lives at logs/visits.log — gitignored, outside apps/web/public, and denied by
 * the dev server's fs rules, so it is not reachable over HTTP or the tunnel.
 */
import fs from "node:fs";
import path from "node:path";
import { repoRoot } from "./corpus.js";

export type VisitEvent = "page" | "chat" | "resume" | "voice";

export type VisitInput = {
  event: VisitEvent;
  session?: unknown;
  userAgent?: string;
  /** Chat only: how long the question was. The text itself needs VISIT_LOG_MESSAGES=1. */
  chars?: number;
  /** Free-form small detail, e.g. "pdf" for a download or "stt" for the mic. */
  detail?: unknown;
  /** Chat text, written only when message logging is enabled. */
  text?: string;
  /** Record this event/detail once per session (used for voice, which fires per reply). */
  once?: boolean;
};

const LOG_DIR = path.join(repoRoot, "logs");
const LOG_PATH = path.join(LOG_DIR, "visits.log");
/** One rotation only: worst case on disk is two files at this size. */
const ROTATED_PATH = path.join(LOG_DIR, "visits.1.log");
const MAX_BYTES = Math.max(64 * 1024, Number(process.env.VISIT_LOG_MAX_BYTES || 1_048_576));
/** A single entry can never grow past this, whatever a visitor sends. */
const MAX_LINE = 400;
/** Cheap flood guard so a scripted client cannot spin the file through rotations. */
const MAX_PER_MINUTE = 240;

const enabled = process.env.VISIT_LOG !== "0";
const logMessages = process.env.VISIT_LOG_MESSAGES === "1";
const bell = process.env.VISIT_BELL !== "0";

export function visitLogPath(): string {
  return LOG_PATH;
}

export function visitLogEnabled(): boolean {
  return enabled;
}

let windowStart = 0;
let windowCount = 0;

/** Sessions already greeted with a bell, so one visitor rings once. */
const greeted = new Set<string>();
/** Keys already written for `once` events, e.g. "abc123:voice:tts". */
const seen = new Set<string>();

const BROWSERS: [RegExp, string][] = [
  [/\bEdg(?:e|A|iOS)?\//, "Edge"],
  [/\b(?:OPR|Opera)\//, "Opera"],
  [/\bSamsungBrowser\//, "Samsung"],
  [/\bFirefox\/|\bFxiOS\//, "Firefox"],
  [/\bCriOS\//, "Chrome"],
  [/\bChrome\//, "Chrome"],
  [/\bSafari\//, "Safari"],
  [/\bcurl\/|\bWget\/|\bPostmanRuntime\//, "Tool"],
  [/\bbot\b|\bcrawler\b|\bspider\b/i, "Bot"],
];

const SYSTEMS: [RegExp, string][] = [
  [/\biPhone\b|\biPad\b|\biPod\b/, "iOS"],
  [/\bAndroid\b/, "Android"],
  [/\bWindows NT\b/, "Windows"],
  [/\bMac OS X\b|\bMacintosh\b/, "macOS"],
  [/\bCrOS\b/, "ChromeOS"],
  [/\bLinux\b|\bX11\b/, "Linux"],
];

/**
 * Family only, never a version. "Chrome/Windows" is useful for knowing the demo worked on
 * the reviewer's machine; "Chrome/126.0.6478.127 on Windows 10 x64" is a fingerprint.
 * Slash-joined with no spaces so a log line stays trivially splittable.
 */
export function clientFamily(userAgent: string | undefined): string {
  const ua = String(userAgent || "");
  if (!ua) return "Unknown/Unknown";
  // iOS Safari also says "Safari" for every wrapped browser, so order matters above.
  const browser = BROWSERS.find(([re]) => re.test(ua))?.[1] || "Other";
  const system = SYSTEMS.find(([re]) => re.test(ua))?.[1] || "Other";
  return `${browser}/${system}`;
}

/** Client-generated ids only; anything unexpected becomes a fixed placeholder. */
function safeSession(value: unknown): string {
  const s = String(value || "").trim();
  return /^[a-z0-9]{6,24}$/i.test(s) ? s.toLowerCase() : "unknown";
}

function safeDetail(value: unknown): string {
  return String(value || "")
    .replace(/[^a-z0-9._-]/gi, "")
    .slice(0, 24);
}

/** One line, no newlines, no quotes that would break a naive reader. */
function safeText(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/["\\]/g, "'")
    .trim()
    .slice(0, 160);
}

function rotateIfNeeded(nextLineBytes: number): void {
  let size = 0;
  try {
    size = fs.statSync(LOG_PATH).size;
  } catch {
    return; // no file yet
  }
  if (size + nextLineBytes <= MAX_BYTES) return;
  try {
    fs.rmSync(ROTATED_PATH, { force: true });
    fs.renameSync(LOG_PATH, ROTATED_PATH);
  } catch {
    /* if rotation fails, truncating is still better than growing without bound */
    try {
      fs.truncateSync(LOG_PATH, 0);
    } catch {
      /* give up quietly; logging must never break a request */
    }
  }
}

function ring(client: string, session: string): void {
  if (!bell) return;
  const when = new Date().toLocaleTimeString();
  // \x07 is the terminal bell; VISIT_BELL=0 turns the whole line off.
  process.stdout.write(`\x07[visit] someone opened the site - ${client} at ${when} (session ${session})\n`);
}

/**
 * Appends one entry. Never throws: a logging failure must not turn into a 500 for a
 * visitor who is just reading the page.
 */
export function logVisit(input: VisitInput): void {
  if (!enabled) return;
  try {
    const now = Date.now();
    if (now - windowStart > 60_000) {
      windowStart = now;
      windowCount = 0;
    }
    windowCount += 1;
    if (windowCount > MAX_PER_MINUTE) return;

    const session = safeSession(input.session);
    const client = clientFamily(input.userAgent);
    const detailKey = safeDetail(input.detail);
    if (input.once) {
      const key = `${session}:${input.event}:${detailKey}`;
      if (seen.has(key)) return;
      if (seen.size > 1000) seen.clear();
      seen.add(key);
    }
    const parts = [
      new Date(now).toISOString().replace(/\.\d{3}Z$/, "Z"),
      `event=${input.event}`,
      `session=${session}`,
      `client=${client}`,
    ];
    if (typeof input.chars === "number" && Number.isFinite(input.chars)) {
      parts.push(`chars=${Math.max(0, Math.min(9999, Math.round(input.chars)))}`);
    }
    if (detailKey) parts.push(`detail=${detailKey}`);
    if (logMessages && input.text) parts.push(`text="${safeText(input.text)}"`);

    const line = `${parts.join(" ").slice(0, MAX_LINE)}\n`;
    fs.mkdirSync(LOG_DIR, { recursive: true });
    rotateIfNeeded(Buffer.byteLength(line));
    fs.appendFileSync(LOG_PATH, line, "utf8");

    if (input.event === "page" && session !== "unknown" && !greeted.has(session)) {
      // Bounded so a long-running server cannot accumulate ids forever.
      if (greeted.size > 500) greeted.clear();
      greeted.add(session);
      ring(client, session);
    }
  } catch {
    /* logging is best-effort by design */
  }
}
