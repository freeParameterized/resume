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

type AudioCtor = typeof AudioContext;

function audioContextCtor(): AudioCtor | null {
  const w = window as unknown as { AudioContext?: AudioCtor; webkitAudioContext?: AudioCtor };
  return w.AudioContext || w.webkitAudioContext || null;
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

export function createLiveRecorder(): LiveRecorder {
  let ctx: AudioContext | null = null;
  let source: MediaStreamAudioSourceNode | null = null;
  let processor: ScriptProcessorNode | null = null;
  let stream: MediaStream | null = null;
  const chunks: Float32Array[] = [];
  let sampleRate = 16000;

  return {
    async start() {
      chunks.length = 0;
      const support = micSupported();
      if (!support.ok) throw new Error(support.reason);
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const Ctor = audioContextCtor();
      if (!Ctor) throw new Error("This browser cannot capture audio.");
      // Safari ignores (and older versions throw on) a forced sample rate, so fall back to
      // the hardware rate and let the server resample for whisper.
      try {
        ctx = new Ctor({ sampleRate: 16000 });
      } catch {
        ctx = new Ctor();
      }
      if (ctx.state === "suspended") await ctx.resume();
      sampleRate = ctx.sampleRate;
      source = ctx.createMediaStreamSource(stream);
      processor = ctx.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = (e) => {
        chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      };
      source.connect(processor);
      processor.connect(ctx.destination);
    },
    async stop() {
      processor?.disconnect();
      source?.disconnect();
      stream?.getTracks().forEach((t) => t.stop());
      const rate = sampleRate;
      await ctx?.close();
      ctx = null;
      const length = chunks.reduce((n, c) => n + c.length, 0);
      const pcm = new Float32Array(length);
      let o = 0;
      for (const c of chunks) {
        pcm.set(c, o);
        o += c.length;
      }
      chunks.length = 0;
      return encodeWav(pcm, rate);
    },
  };
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buf);
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i += 1) view.setUint8(off + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, samples.length * 2, true);
  let off = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    off += 2;
  }
  return new Blob([buf], { type: "audio/wav" });
}

export async function transcribeWav(blob: Blob): Promise<string> {
  const res = await fetch(`${API_BASE}/api/stt`, {
    method: "POST",
    headers: { "Content-Type": "audio/wav" },
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
