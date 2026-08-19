import path from "node:path";
import cors from "cors";
import dotenv from "dotenv";
import express, { type Request, type Response } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { resolveContextBlocks } from "./context.js";
import { loadCorpus, repoRoot } from "./corpus.js";
import { fetchGithub } from "./github.js";
import { detectIntents } from "./intents.js";
import { modelCatalog, pickLocalModel } from "./models.js";
import { buildPrompt, generateOllama, ollamaHost, pingOllama, stripThinking, warmModel } from "./ollama.js";
import { formatPapersPolicy, loadPapers, paperChunks, papersForSite } from "./papers.js";
import { quickAnswer } from "./quick.js";
import { extractiveAnswer, retrieve } from "./retrieve.js";
import { logVisit, visitLogEnabled, type VisitEvent } from "./visits.js";
import { synthesizeWav, transcribeAudio, voiceStatus } from "./voice.js";

dotenv.config({ path: path.join(repoRoot, ".env") });

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "127.0.0.1";
const started = Date.now();

// HOOK(future): extra corpus partitions — merge sanitized JSON from data/partitions/*.json
// HOOK(future): remote viewing — authenticated read-only live session for an interviewer (not RDP)
// HOOK(future): additional remotes — CADNAT / Deduper when those repos exist under freeParameterized

const app = express();
app.disable("x-powered-by");

/**
 * Error text from child processes (whisper, ffmpeg, PowerShell) can contain absolute
 * paths and the local username, so only known-safe messages reach the client.
 */
function safeMessage(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? err.message : "";
  if (!raw) return fallback;
  const leaksPath = /[A-Za-z]:\\|\\\\|\/Users\/|\/home\/|node_modules/.test(raw);
  return leaksPath || raw.length > 200 ? fallback : raw;
}

// Nothing here should take a minute; a stuck request otherwise pins a connection open.
app.use((req, res, next) => {
  res.setTimeout(120_000, () => {
    if (!res.headersSent) res.status(504).json({ error: "Request timed out." });
    else res.end();
  });
  next();
});
if (process.env.TRUST_PROXY === "1") app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

const allowlist = (process.env.CORS_ORIGINS || "http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:4173,http://localhost:4173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) {
        cb(null, true);
        return;
      }
      if (allowlist.includes(origin)) {
        cb(null, true);
        return;
      }
      // Cloudflare quick tunnels get a random subdomain each restart, so match the
      // domain instead of hardcoding a host. Still narrower than allowing every origin.
      if (/^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/i.test(origin)) {
        cb(null, true);
        return;
      }
      cb(null, false);
    },
  }),
);

/**
 * Requests through the Cloudflare tunnel arrive on loopback carrying X-Forwarded-For, and
 * `trust proxy` stays false on purpose: a visitor could otherwise forge that header and
 * mint a fresh rate-limit bucket per request. Counting every tunnel visitor in one bucket
 * is the stricter choice, so the library's warning about it is silenced rather than fixed.
 */
const limiterValidation = { xForwardedForHeader: false as const };

const chatLimit = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate: limiterValidation,
  message: { error: "Too many questions; wait a minute." },
});
const voiceLimit = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: limiterValidation,
  message: { error: "Voice rate limit; wait a minute." },
});
const visitLimit = rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: false,
  legacyHeaders: false,
  validate: limiterValidation,
  message: { error: "Too many events." },
});

/** The client sends its own random session id; it is never derived from the request. */
function visitSession(req: Request): string {
  return String(req.headers["x-visit-session"] || "");
}

function visitClient(req: Request): string {
  return String(req.headers["user-agent"] || "");
}

app.post("/api/stt", voiceLimit, express.raw({ type: () => true, limit: "8mb" }), async (req, res) => {
  try {
    const buf = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || []);
    if (!buf.length) {
      res.status(400).json({ error: "audio body required (wav)" });
      return;
    }
    const text = await transcribeAudio(buf);
    logVisit({
      event: "voice",
      session: visitSession(req),
      userAgent: visitClient(req),
      detail: "mic",
      once: true,
    });
    res.json({ text, speaker: voiceStatus().speaker });
  } catch (err) {
    const message = safeMessage(err, "Speech-to-text failed.");
    const code = (err as { code?: string }).code === "STT_UNAVAILABLE" ? 503 : 500;
    res.status(code).json({ error: message, voice: voiceStatus() });
  }
});

app.use(express.json({ limit: "64kb" }));

app.get("/api/health", async (_req, res) => {
  const corpus = loadCorpus();
  const catalog = await modelCatalog();
  const ollama = await pingOllama();
  res.json({
    ok: true,
    service: "living-resume-api",
    uptimeSec: Math.round((Date.now() - started) / 1000),
    corpusChunks: corpus.chunks.length,
    papersAvailable: loadPapers().available,
    ollama: {
      reachable: catalog.reachable,
      host: /127\.0\.0\.1|localhost/.test(ollama.host || ollamaHost()) ? "loopback" : "remote",
      model: catalog.selected,
      defaultPresent: Boolean(catalog.selected),
      installedCount: catalog.installed.filter((m) => !m.cloud).length,
    },
    voice: voiceStatus(),
  });
});

app.get("/api/models", async (_req, res) => {
  res.json(await modelCatalog());
});

/**
 * Page views and resume downloads: the server cannot see either (the page is served by
 * Vite, the PDF is a static file), so the client reports them here. Nothing about the
 * request other than the coarse client family is kept — see visits.ts.
 */
const CLIENT_EVENTS = new Set<VisitEvent>(["page", "resume"]);

app.post("/api/visit", visitLimit, (req, res) => {
  const event = String(req.body?.event || "") as VisitEvent;
  if (!CLIENT_EVENTS.has(event)) {
    res.status(204).end();
    return;
  }
  logVisit({
    event,
    session: req.headers["x-visit-session"] || req.body?.session,
    userAgent: visitClient(req),
    detail: req.body?.detail,
  });
  res.status(204).end();
});

app.get(["/api/profile", "/api/resume"], (_req, res) => {
  const corpus = loadCorpus();
  res.json({
    profile: corpus.profile,
    howIWork: corpus.howIWork,
    aboutMe: corpus.aboutMe,
    skillGroups: corpus.skillGroups,
    experience: corpus.experience,
    education: corpus.education,
    early: corpus.early,
    meta: corpus.meta,
  });
});

app.get("/api/projects", (_req, res) => {
  const corpus = loadCorpus();
  res.json({ projects: corpus.projects });
});

/** Records that are not Peter's work are never served to the client; chat still gets them for corrections. */
app.get("/api/papers", (_req, res) => {
  const { available, papers } = loadPapers();
  res.json({ available, papers: papersForSite(papers) });
});

app.get("/api/github", async (_req, res) => {
  const payload = await fetchGithub();
  res.json(payload);
});

function wantStream(req: Request): boolean {
  const accept = String(req.headers.accept || "");
  return accept.includes("text/event-stream") || String(req.query.stream || "") === "1";
}

function citations(hits: ReturnType<typeof retrieve>) {
  return hits.map((h) => ({
    id: h.chunk.id,
    title: h.chunk.title,
    score: Number(h.score.toFixed(3)),
  }));
}

app.post(["/api/ask", "/api/chat"], chatLimit, async (req: Request, res: Response) => {
  const question = String(req.body?.question || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 2000);

  if (!question) {
    res.status(400).json({ error: "question is required" });
    return;
  }

  // Length only. The text itself is written only with VISIT_LOG_MESSAGES=1 in .env.
  logVisit({
    event: "chat",
    session: visitSession(req) || req.body?.session,
    userAgent: visitClient(req),
    chars: question.length,
    text: question,
  });

  const corpus = loadCorpus();
  const papersFile = loadPapers();
  // Three chunks, each trimmed: prefill cost is what pushed time-to-first-token past 2.5s,
  // and the extra chunks were rarely what the answer used.
  const hits = retrieve([...corpus.chunks, ...paperChunks(papersFile.papers)], question, 3);
  const context = hits
    .map((h) => `[${h.chunk.title}]\n${h.chunk.text.slice(0, 1200)}`)
    .join("\n\n");
  const prompt = buildPrompt(question, context, formatPapersPolicy(papersFile.papers));
  const stream = wantStream(req);
  const catalog = await modelCatalog(String(req.body?.model || ""));
  const model = pickLocalModel(catalog.installed, String(req.body?.model || "")) || catalog.selected;
  const ollamaUp = catalog.reachable;
  const intents = detectIntents(question);
  const contextBlocks = resolveContextBlocks(corpus, intents);

  const meta = {
    mode: ollamaUp && model ? "ollama" : "extractive",
    model: ollamaUp ? model : null,
    citations: citations(hits),
    intents,
    contextBlocks,
    offline: !ollamaUp,
  };

  // Answered from a fixed script: instant, and identical every time for the sensitive ones.
  const quick = quickAnswer(question);
  if (quick) {
    const quickMeta = { ...meta, mode: "instant", model: null, offline: false };
    if (stream) {
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      res.write(`data: ${JSON.stringify({ type: "meta", ...quickMeta })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: "token", text: quick.answer })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
      res.end();
      return;
    }
    res.json({ ...quickMeta, answer: quick.answer });
    return;
  }

  if (!ollamaUp || !model) {
    const answer = extractiveAnswer(question, hits);
    if (stream) {
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      res.write(`data: ${JSON.stringify({ type: "meta", ...meta, mode: "extractive" })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: "token", text: answer })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
      res.end();
      return;
    }
    res.json({ ...meta, mode: "extractive", answer });
    return;
  }

  try {
    const upstream = await generateOllama(prompt, stream, model);
    if (!upstream.ok || !upstream.body) {
      const answer = extractiveAnswer(question, hits);
      res.json({
        ...meta,
        mode: "extractive",
        answer,
        note: `Ollama generate failed (HTTP ${upstream.status}); extractive fallback.`,
      });
      return;
    }

    if (!stream) {
      const body = (await upstream.json()) as { response?: string };
      res.json({
        ...meta,
        answer: stripThinking(body.response || "").trim(),
      });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.write(`data: ${JSON.stringify({ type: "meta", ...meta })}\n\n`);

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let acc = "";
    let sent = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() || "";
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const evt = JSON.parse(line) as { response?: string; done?: boolean };
          if (evt.response) {
            acc += evt.response;
            // Reasoning traces are dropped rather than streamed; they read as a stall.
            const visible = stripThinking(acc);
            if (visible.length > sent.length) {
              const delta = visible.slice(sent.length);
              sent = visible;
              res.write(`data: ${JSON.stringify({ type: "token", text: delta })}\n\n`);
            }
          }
        } catch {
          /* ignore partial JSON */
        }
      }
    }
    const late = detectIntents(question, acc);
    const extra = resolveContextBlocks(corpus, late);
    res.write(`data: ${JSON.stringify({ type: "context", contextBlocks: extra, intents: late })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    res.end();
  } catch {
    const answer = extractiveAnswer(question, hits);
    if (!res.headersSent) {
      res.json({
        ...meta,
        mode: "extractive",
        answer,
        note: "Ollama threw; extractive fallback.",
      });
      return;
    }
    try {
      res.write(`data: ${JSON.stringify({ type: "token", text: `\n\n${answer}` })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    } catch {
      /* stream already closed */
    }
    res.end();
  }
});

// The client calls this when the page loads so the weights are hot before anyone types.
app.post("/api/warm", async (_req, res) => {
  const result = await warmModel();
  res.json(result);
});

app.post("/api/tts", voiceLimit, async (req, res) => {
  const text = String(req.body?.text || "").trim();
  if (!text) {
    res.status(400).json({ error: "text is required" });
    return;
  }
  try {
    const wav = await synthesizeWav(text);
    logVisit({
      event: "voice",
      session: visitSession(req),
      userAgent: visitClient(req),
      detail: "spoken",
      once: true,
    });
    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Cache-Control", "no-store");
    res.send(wav);
  } catch (err) {
    const message = safeMessage(err, "Text-to-speech failed.");
    res.status(500).json({ error: message, voice: voiceStatus() });
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: "not found" });
});

// Last line of defence: a visitor should never see a stack trace, a local path, or an
// environment detail, no matter which handler threw.
app.use((err: unknown, _req: Request, res: Response, _next: express.NextFunction) => {
  console.error("[api] unhandled", err);
  if (res.headersSent) {
    res.end();
    return;
  }
  res.status(500).json({ error: "Something went wrong on the server." });
});

process.on("unhandledRejection", (reason) => {
  console.error("[api] unhandled rejection", reason);
});

app.listen(PORT, HOST, () => {
  console.log(`living-resume api http://${HOST}:${PORT}`);
  console.log(
    visitLogEnabled()
      ? `[visits] logging to logs/visits.log (npm run visits to read it)`
      : `[visits] disabled (VISIT_LOG=0)`,
  );
  if (process.env.NO_PREWARM !== "1") {
    void warmModel().then((r) => {
      console.log(
        r.ok
          ? `[warm] ${r.model} resident in ${r.ms}ms; first visitor skips the cold load`
          : `[warm] could not preload ${r.model} (${r.ms}ms); first answer may fall back to corpus text`,
      );
    });
  }
});
