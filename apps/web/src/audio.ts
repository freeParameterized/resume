import { API_BASE } from "./config";

export type LiveRecorder = {
  start: () => Promise<void>;
  stop: () => Promise<Blob>;
};

/** iOS Safari only exposes getUserMedia in a secure context: https, or localhost. A LAN IP will not do. */
export function micSupported(): { ok: boolean; reason?: string } {
  if (typeof window === "undefined") return { ok: false, reason: "No browser context." };
  if (!window.isSecureContext) {
    return {
      ok: false,
      reason: "Microphone needs a secure connection (https). Open the https demo link rather than a local network address.",
    };
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    return { ok: false, reason: "This browser does not expose microphone capture." };
  }
  return { ok: true };
}

let unlocked: HTMLAudioElement | null = null;

/**
 * iOS refuses to play audio that was not started inside a user gesture, and an awaited
 * fetch loses that gesture. Priming one element on the first tap keeps later replies playable.
 */
export function unlockAudioPlayback(): void {
  if (unlocked) return;
  const el = new Audio();
  el.muted = true;
  // 1-frame silent wav; enough to satisfy the gesture requirement.
  el.src =
    "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YQAAAAA=";
  void el.play().then(
    () => {
      el.pause();
      el.muted = false;
      unlocked = el;
    },
    () => {
      /* still locked; a later tap can retry */
    },
  );
}

/**
 * Containers in preference order. Chrome and Firefox take the first, Safari only offers mp4.
 * The server decodes whichever one arrives, so the browser never has to resample.
 */
const CANDIDATE_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4;codecs=mp4a.40.2",
  "audio/mp4",
];

export function pickRecordingType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  for (const type of CANDIDATE_TYPES) {
    if (MediaRecorder.isTypeSupported?.(type)) return type;
  }
  return ""; // let the browser choose its own default
}

let lastNegotiatedType = "";

/** What the browser actually recorded with, for diagnostics in the UI and logs. */
export function negotiatedRecordingType(): string {
  return lastNegotiatedType;
}

export function createLiveRecorder(): LiveRecorder {
  let recorder: MediaRecorder | null = null;
  let stream: MediaStream | null = null;
  let chunks: Blob[] = [];

  return {
    async start() {
      chunks = [];
      const support = micSupported();
      if (!support.ok) throw new Error(support.reason);
      if (typeof MediaRecorder === "undefined") {
        throw new Error("This browser cannot record audio.");
      }
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickRecordingType();
      // Deliberately no forced sample rate anywhere: Firefox and Safari refuse to bridge a
      // 16 kHz context to a 48 kHz microphone, so conversion happens server-side instead.
      recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      lastNegotiatedType = recorder.mimeType || mimeType || "browser default";
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size) chunks.push(e.data);
      };
      recorder.start();
    },
    async stop() {
      const active = recorder;
      recorder = null;
      const type = lastNegotiatedType;
      const finished = new Promise<void>((resolve) => {
        if (!active || active.state === "inactive") {
          resolve();
          return;
        }
        active.onstop = () => resolve();
        active.stop();
      });
      await finished;
      stream?.getTracks().forEach((t) => t.stop());
      stream = null;
      const blob = new Blob(chunks, { type: type.split(";")[0] || "application/octet-stream" });
      chunks = [];
      return blob;
    },
  };
}

export async function transcribeWav(blob: Blob): Promise<string> {
  const res = await fetch(`${API_BASE}/api/stt`, {
    method: "POST",
    headers: { "Content-Type": blob.type || "application/octet-stream" },
    body: blob,
  });
  const data = (await res.json()) as { text?: string; error?: string };
  if (!res.ok) throw new Error(data.error || "Speech-to-text unavailable");
  return (data.text || "").trim();
}

let current: HTMLAudioElement | null = null;

export function stopSpeech() {
  if (!current) return;
  current.pause();
  current.removeAttribute("src");
  current.load();
  current = null;
}

export async function speakText(text: string): Promise<HTMLAudioElement> {
  stopSpeech();
  const res = await fetch(`${API_BASE}/api/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || "Text-to-speech unavailable");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const audio = unlocked || new Audio();
  audio.src = url;
  current = audio;
  audio.onended = () => {
    URL.revokeObjectURL(url);
    if (current === audio) current = null;
  };
  await audio.play();
  return audio;
}
