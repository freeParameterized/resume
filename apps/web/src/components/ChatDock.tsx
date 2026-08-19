import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { askQuestion } from "../api";
import { createLiveRecorder, micSupported, speakText, stopSpeech, transcribeWav, unlockAudioPlayback } from "../audio";
import { detectIntents } from "../intents";
import type { Settings } from "../settings";
import type { Health, Paper, Project } from "../types";
import { logVisit } from "../visits";
import {
  InlineContext,
  RESUME_PDF_URL,
  meaningful,
  paperToBlock,
  projectToBlock,
  resumeToBlock,
  type ContextBlock,
} from "./InlineContext";

/** "can I get your resume", "send me your CV", "download the pdf", "resume please", … */
const RESUME_RE = /\b(resume|résumé|cv|curriculum vitae|pdf|download)\b/i;

/** Questions about his work history are a natural moment to offer the resume once. */
const EXPERIENCE_RE = /\b(experience|background|work history|employ|career|job|hire|qualif)\b/i;

type Turn = {
  q: string;
  a: string;
  mode?: string;
  model?: string | null;
  cites?: string[];
  blocks: ContextBlock[];
  offline?: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  health: Health | null;
  settings: Settings;
  projects: Project[];
  papers: Paper[];
  onIntents: (intents: { projectIds: string[]; paperIds?: string[] }) => void;
};

function mergeBlocks(existing: ContextBlock[], incoming: ContextBlock[] | undefined): ContextBlock[] {
  const out = [...existing];
  const seen = new Set(out.map((b) => `${b.kind}:${b.id}`));
  for (const b of incoming || []) {
    const k = `${b.kind}:${b.id}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(b);
  }
  return out;
}

export function ChatDock({ open, onClose, health, settings, projects, papers, onIntents }: Props) {
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [recording, setRecording] = useState(false);
  const rec = useRef(createLiveRecorder());
  const logRef = useRef<HTMLDivElement>(null);
  // Offer the resume proactively only once, so it never reads as spam.
  const resumeOffered = useRef(false);

  const liveIntents = useMemo(() => detectIntents(question, "", papers), [question, papers]);
  const liveBlocks = useMemo(() => {
    const blocks: ContextBlock[] = [];
    for (const id of liveIntents.projectIds) {
      const p = projects.find((x) => x.id === id);
      if (p) blocks.push(projectToBlock(p));
    }
    papers.forEach((p, i) => {
      const id = p.id || p.doi || `paper-${i}`;
      if (liveIntents.paperIds.includes(id)) blocks.push(paperToBlock(p, i));
    });
    return blocks.slice(0, 3);
  }, [liveIntents, projects, papers]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, busy]);

  useEffect(() => {
    if (!question.trim()) return;
    const t = window.setTimeout(() => onIntents(liveIntents), 180);
    return () => window.clearTimeout(t);
  }, [liveIntents, onIntents, question]);

  // useEffect(() => {
  //   if (!settings.tts) stopSpeech();
  // }, [settings.tts]);

  if (!open) return null;

  // No API reachable at all (e.g. the static GitHub Pages build): voice is impossible, so hide it.
  const apiUp = Boolean(health?.ok);
  // const mic = micSupported();
  // const sttUp = Boolean(health?.voice?.stt.available) && settings.stt;
  // const ttsUp = Boolean(health?.voice?.tts.available) && settings.tts;

  async function submitText(q: string) {
    const text = q.trim();
    if (!text || busy) return;
    // Runs inside the submit gesture so iOS will allow the spoken reply that follows.
    unlockAudioPlayback();
    const intentsNow = detectIntents(text, "", papers);
    const seed: ContextBlock[] = [];
    for (const id of intentsNow.projectIds) {
      const p = projects.find((x) => x.id === id);
      if (p) seed.push(projectToBlock(p));
    }
    papers.forEach((p, i) => {
      const id = p.id || p.doi || `paper-${i}`;
      if (intentsNow.paperIds.includes(id)) seed.push(paperToBlock(p, i));
    });
    // Deterministic: whatever the model says, an asked-for resume always gets a real download link.
    const wantsResume = RESUME_RE.test(text);
    if (wantsResume || (!resumeOffered.current && EXPERIENCE_RE.test(text))) {
      seed.push(resumeToBlock());
      resumeOffered.current = true;
    }
    setBusy(true);
    setError(null);
    setQuestion("");
    const turn: Turn = { q: text, a: "", blocks: seed.slice(0, 4) };
    setTurns((prev) => [...prev, turn]);
    onIntents(intentsNow);
    try {
      await askQuestion(
        text,
        (tok) => {
          turn.a += tok;
          setTurns((prev) => [...prev.slice(0, -1), { ...turn }]);
        },
        (meta) => {
          // Only overwrite when the event actually carries a value — the trailing
          // context event has no mode, and a placeholder would render as visible text.
          if (meaningful(meta.mode)) turn.mode = meta.mode;
          if (meaningful(meta.model)) turn.model = meta.model;
          if (meta.citations.length) turn.cites = meta.citations.map((c) => c.title);
          if (typeof meta.offline === "boolean") turn.offline = meta.offline;
          turn.blocks = mergeBlocks(turn.blocks, meta.contextBlocks);
          setTurns((prev) => [...prev.slice(0, -1), { ...turn }]);
          if (meta.intents) onIntents(meta.intents);
        },
        settings.model || undefined,
      );
      // if (settings.tts && ttsUp && turn.a) {
      //   try {
      //     await speakText(turn.a);
      //   } catch (err) {
      //     setError(err instanceof Error ? err.message : "Voice playback failed");
      //   }
      // }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ask failed");
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await submitText(question);
  }

  // async function toggleMic() {
  //   if (!settings.stt) return;
  //   if (recording) {
  //     setRecording(false);
  //     try {
  //       const blob = await rec.current.stop();
  //       const transcript = await transcribeWav(blob);
  //       if (transcript) {
  //         setQuestion(transcript);
  //         await submitText(transcript);
  //       } else setError("Heard silence — try again.");
  //     } catch (err) {
  //       setError(err instanceof Error ? err.message : "Mic failed");
  //     }
  //     return;
  //   }
  //   try {
  //     await rec.current.start();
  //     setRecording(true);
  //     setError(null);
  //   } catch (err) {
  //     setError(err instanceof Error ? err.message : "Microphone permission denied");
  //   }
  // }

  return (
    <aside className="chat-dock fade-in" role="dialog" aria-labelledby="chat-title">
      <div className="chat-head">
        <div>
          <div className="hero-kicker">Ask about my code</div>
          <h2 id="chat-title">Local inference</h2>
        </div>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close chat">
          ×
        </button>
      </div>
      <p className="ask-note">
        {apiUp
          ? health?.ollama.reachable
            ? `Live Ollama · ${settings.model || health.ollama.model || "auto"}`
            : "Inference offline — answers come from the curated corpus, not a live model."
          : "The live AI demo runs on Peter’s workstation — ask him for the live link. Until then this answers straight from the curated corpus."}
        {/* {apiUp ? ` · Voice ${settings.tts ? "on" : "off"} · Mic ${settings.stt ? "on" : "off"}` : ""} */}
      </p>
      <div className="ask-log" ref={logRef} aria-live="polite">
        {turns.length === 0 ? (
          <div className="bubble a muted">
            Try “How does Digital Twin Pro render 3D?” Context cards stream into the
            thread as we talk.
          </div>
        ) : null}
        {turns.map((t, i) => (
          <div key={`${t.q}-${i}`} className="fade-in">
            <div className="bubble q">{t.q}</div>
            <div className="bubble a">
              {t.offline ? <div className="cites">Offline extractive answer</div> : null}
              {t.a || (busy && i === turns.length - 1 ? "Thinking…" : "")}
              {t.blocks.length ? (
                <div className="inline-stack">
                  {t.blocks.map((b) => (
                    <InlineContext key={`${b.kind}-${b.id}`} block={b} />
                  ))}
                </div>
              ) : null}
              {meaningful(t.mode) ? (
                <div className="cites">
                  {t.mode}
                  {meaningful(t.model) ? ` · ${t.model}` : ""}
                  {t.cites?.length ? ` · ${t.cites.join(" · ")}` : ""}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
      {liveBlocks.length && !busy ? (
        <div className="compose-preview" aria-live="polite">
          {liveBlocks.map((b) => (
            <InlineContext key={`live-${b.kind}-${b.id}`} block={b} />
          ))}
        </div>
      ) : null}
      {error ? <p className="honesty">{error}</p> : null}
      <form className="ask-form" onSubmit={onSubmit}>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={busy}
          placeholder="Ask in plain language…"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void submitText(question);
            }
          }}
        />
        <div className="chat-actions">
          <button type="submit" disabled={busy}>
            {busy ? "Thinking" : "Send"}
          </button>
          {/* {!apiUp ? null : settings.stt ? (
            <button
              type="button"
              className={recording ? "mic hot" : "mic"}
              onClick={() => {
                unlockAudioPlayback();
                void toggleMic();
              }}
              disabled={busy || !sttUp || !mic.ok}
              title={!mic.ok ? mic.reason : sttUp ? "Tap to record, tap again to send" : "Whisper STT unavailable"}
            >
              {recording ? "Stop · send" : "Mic"}
            </button>
          ) : (
            <span className="job-meta">Mic disabled in settings</span>
          )} */}
        </div>
        <a
          className="download-link chat-resume"
          href={RESUME_PDF_URL}
          download="PeterLilley_Resume.pdf"
          onClick={() => logVisit("resume", "pdf")}
        >
          Download my resume (PDF)
        </a>
      </form>
    </aside>
  );
}
