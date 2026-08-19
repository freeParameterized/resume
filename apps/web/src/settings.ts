import { THEMES, type ThemeId } from "./theme";

export type Settings = {
  theme: ThemeId;
  tts: boolean;
  stt: boolean;
  model: string;
  reducedMotion: boolean;
};

const KEY = "living-resume-settings";

export const DEFAULT_SETTINGS: Settings = {
  theme: "light",
  tts: true,
  stt: true,
  model: "",
  reducedMotion: false,
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const legacyTheme = localStorage.getItem("living-resume-theme");
      const tts = localStorage.getItem("living-resume-speak");
      return {
        ...DEFAULT_SETTINGS,
        theme: THEMES.some((t) => t.id === legacyTheme) ? (legacyTheme as ThemeId) : "light",
        tts: tts !== "off",
      };
    }
    const parsed = JSON.parse(raw) as Partial<Settings>;
    const theme = THEMES.some((t) => t.id === parsed.theme) ? (parsed.theme as ThemeId) : "light";
    return {
      theme,
      tts: parsed.tts !== false,
      stt: parsed.stt !== false,
      model: typeof parsed.model === "string" ? parsed.model : "",
      reducedMotion: Boolean(parsed.reducedMotion),
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: Settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    localStorage.setItem("living-resume-theme", s.theme);
    localStorage.setItem("living-resume-speak", s.tts ? "on" : "off");
  } catch {
    /* ignore */
  }
  document.documentElement.dataset.theme = s.theme;
  document.documentElement.dataset.motion = s.reducedMotion ? "reduce" : "full";
}
