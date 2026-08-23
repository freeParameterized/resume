import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/**
 * Local voice facade.
 *
 * STT reuses the whisper.cpp tree already on this machine (WORKING_CAD_GUI / OfflineLLMGui).
 * Override with WHISPER_BIN / WHISPER_MODEL. TTS is Windows SAPI male (not Peter's clone).
 * Future: VOICE_CLONE_PATH for RVC/XTTS — do not claim the current voice is his.
 */
export const voiceConfig = {
  speaker: process.env.VOICE_SPEAKER || "male-default",
  ttsVoice: process.env.TTS_VOICE || "Microsoft David Desktop",
  clonePath: process.env.VOICE_CLONE_PATH || "",
};

const WHISPER_CANDIDATES = [
  process.env.WHISPER_BIN,
  "D:\\OfflineLLMGui\\whisper.cpp\\build\\bin\\Release\\whisper-cli.exe",
  "D:\\OfflineLLMGui\\whisper.cpp\\build\\Release\\whisper-cli.exe",
].filter(Boolean) as string[];

export function whisperBinary(): string | null {
  return WHISPER_CANDIDATES.find((p) => fs.existsSync(p)) || null;
}

export function whisperModel(): string {
  return (
    process.env.WHISPER_MODEL || "D:\\OfflineLLMGui\\whisper.cpp\\ggml-base.en.bin"
  );
}

export function voiceStatus() {
  const bin = whisperBinary();
  const model = whisperModel();
  const modelOk = Boolean(model && fs.existsSync(model));
  return {
    speaker: voiceConfig.speaker,
    tts: {
      available: process.platform === "win32",
      engine: "windows-sapi",
      voice: voiceConfig.ttsVoice,
      note: "Male default (Microsoft David). Not Peter's cloned voice.",
    },
    stt: {
      available: Boolean(bin && modelOk),
      engine: bin ? "whisper.cpp" : "none",
      // Deliberately not the absolute paths: this object is returned to every visitor
      // by /api/health, and the real paths would expose the local directory layout.
      binary: bin ? "configured" : null,
      model: modelOk ? path.basename(model) : null,
      converter: ffmpegBinary() ? "ffmpeg" : null,
    },
    clone: {
      configured: Boolean(voiceConfig.clonePath),
    },
  };
}

function tmp(ext: string) {
  return path.join(os.tmpdir(), `cadpal-${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`);
}

const FFMPEG_CANDIDATES = [
  process.env.FFMPEG_BIN,
  "ffmpeg",
  "C:\\Users\\peter\\scoop\\shims\\ffmpeg.exe",
].filter(Boolean) as string[];

let ffmpegCache: string | null | undefined;

export function ffmpegBinary(): string | null {
  if (ffmpegCache !== undefined) return ffmpegCache;
  for (const candidate of FFMPEG_CANDIDATES) {
    if (candidate.includes("\\") || candidate.includes("/")) {
      if (fs.existsSync(candidate)) {
        ffmpegCache = candidate;
        return ffmpegCache;
      }
      continue;
    }
    // A bare name only counts if it is genuinely resolvable, otherwise /api/health would
    // advertise a converter that does not exist.
    const dirs = (process.env.PATH || "").split(path.delimiter).filter(Boolean);
    const exts = process.platform === "win32" ? [".exe", ".cmd", ".bat", ""] : [""];
    for (const dir of dirs) {
      for (const ext of exts) {
        if (fs.existsSync(path.join(dir, candidate + ext))) {
          ffmpegCache = path.join(dir, candidate + ext);
          return ffmpegCache;
        }
      }
    }
  }
  ffmpegCache = null;
  return ffmpegCache;
}

/**
 * Containers we may receive. Chrome/Edge send WAV (the client encodes PCM itself),
 * but Safari's MediaRecorder path produces audio/mp4 (AAC) and Firefox ogg/opus.
 */
function sniffContainer(buf: Buffer): "wav" | "mp4" | "webm" | "ogg" | "unknown" {
  const ascii = (start: number, len: number) => buf.slice(start, start + len).toString("latin1");
  if (buf.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 4) === "WAVE") return "wav";
  if (buf.length >= 12 && ascii(4, 4) === "ftyp") return "mp4"; // mp4/m4a/aac from iOS Safari
  if (buf.length >= 4 && buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return "webm";
  if (buf.length >= 4 && ascii(0, 4) === "OggS") return "ogg";
  if (buf.length >= 2 && buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0) return "mp4"; // raw ADTS AAC/MP3
  return "unknown";
}

/** whisper.cpp only accepts 16 kHz mono PCM WAV, so read the header before trusting a .wav. */
function isWav16kMono(buf: Buffer): boolean {
  if (buf.length < 44) return false;
  const channels = buf.readUInt16LE(22);
  const rate = buf.readUInt32LE(24);
  const bits = buf.readUInt16LE(34);
  return channels === 1 && rate === 16000 && bits === 16;
}

async function toWav16kMono(buf: Buffer, container: string): Promise<Buffer> {
  const ffmpeg = ffmpegBinary();
  if (!ffmpeg) {
    const err = new Error(
      `Received ${container} audio, which needs conversion to 16 kHz mono WAV, but ffmpeg was not found. Install ffmpeg (scoop install ffmpeg) or set FFMPEG_BIN.`,
    );
    (err as Error & { code: string }).code = "STT_UNAVAILABLE";
    throw err;
  }
  const inPath = tmp(container === "unknown" ? "bin" : container);
  const outPath = tmp("wav");
  fs.writeFileSync(inPath, buf);
  try {
    await execFileAsync(ffmpeg, ["-y", "-i", inPath, "-ac", "1", "-ar", "16000", "-f", "wav", outPath], {
      timeout: 60_000,
      windowsHide: true,
      maxBuffer: 8 * 1024 * 1024,
    });
    return fs.readFileSync(outPath);
  } catch (cause) {
    const err = new Error(
      `Could not convert ${container} audio to 16 kHz mono WAV. ${cause instanceof Error ? cause.message : ""}`.trim(),
    );
    (err as Error & { code: string }).code = "STT_UNAVAILABLE";
    throw err;
  } finally {
    for (const p of [inPath, outPath]) {
      try {
        fs.unlinkSync(p);
      } catch {
        /* ignore */
      }
    }
  }
}

/** Accepts wav/mp4/m4a/aac/webm/ogg and normalises to what whisper.cpp expects. */
export async function transcribeAudio(buf: Buffer): Promise<string> {
  const container = sniffContainer(buf);
  if (container === "wav" && isWav16kMono(buf)) return transcribeWav(buf);
  return transcribeWav(await toWav16kMono(buf, container));
}

export async function transcribeWav(wavBuf: Buffer): Promise<string> {
  const bin = whisperBinary();
  const model = whisperModel();
  if (!bin || !fs.existsSync(model)) {
    const err = new Error("Whisper.cpp CLI is not built yet. Text chat still works.");
    (err as Error & { code: string }).code = "STT_UNAVAILABLE";
    throw err;
  }
  const wavPath = tmp("wav");
  fs.writeFileSync(wavPath, wavBuf);
  try {
    const { stdout, stderr } = await execFileAsync(
      bin,
      ["-m", model, "-f", wavPath, "-nt", "-np", "-otxt"],
      { timeout: 120_000, windowsHide: true, maxBuffer: 8 * 1024 * 1024 },
    );
    const txtPath = `${wavPath}.txt`;
    if (fs.existsSync(txtPath)) {
      const text = fs.readFileSync(txtPath, "utf8").trim();
      fs.unlinkSync(txtPath);
      if (text) return text;
    }
    const combined = `${stdout || ""}\n${stderr || ""}`;
    const lines = combined
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("whisper_") && !l.startsWith("main:") && !l.includes("loading"));
    return lines.join(" ").trim();
  } finally {
    try {
      fs.unlinkSync(wavPath);
    } catch {
      /* ignore */
    }
  }
}

export async function synthesizeWav(text: string): Promise<Buffer> {
  const spoken = text.replace(/\s+/g, " ").trim().slice(0, 4000);
  if (!spoken) {
    throw new Error("Nothing to speak");
  }
  const wavPath = tmp("wav");
  const txtPath = tmp("txt");
  fs.writeFileSync(txtPath, spoken, "utf8");
  const script = [
    "Add-Type -AssemblyName System.Speech",
    `$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer`,
    `try { $synth.SelectVoice('${voiceConfig.ttsVoice.replace(/'/g, "''")}') } catch { $synth.SelectVoiceByHints([System.Speech.Synthesis.VoiceGender]::Male) }`,
    `$synth.Rate = 1`,
    `$synth.SetOutputToWaveFile('${wavPath.replace(/'/g, "''")}')`,
    `$text = Get-Content -Raw -Encoding UTF8 '${txtPath.replace(/'/g, "''")}'`,
    `$synth.Speak($text)`,
    `$synth.Dispose()`,
  ].join("; ");
  try {
    await execFileAsync(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", script],
      { timeout: 60_000, windowsHide: true },
    );
    return fs.readFileSync(wavPath);
  } finally {
    try {
      fs.unlinkSync(wavPath);
    } catch {
      /* ignore */
    }
    try {
      fs.unlinkSync(txtPath);
    } catch {
      /* ignore */
    }
  }
}
