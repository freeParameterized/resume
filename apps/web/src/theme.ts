export type ThemeId = "copilot" | "xenon" | "amber" | "light" | "magenta" | "forest";

export const THEMES: { id: ThemeId; label: string; sceneBg: string; accent: string }[] = [
  { id: "copilot", label: "Copilot glass", sceneBg: "#0b1220", accent: "#7eb6ff" },
  { id: "xenon", label: "Dark xenon", sceneBg: "#07090d", accent: "#3ee0c5" },
  { id: "amber", label: "Amber engineering", sceneBg: "#0c0a07", accent: "#e8a54b" },
  { id: "light", label: "Minimal light", sceneBg: "#e8edf2", accent: "#2563eb" },
  { id: "magenta", label: "Magenta", sceneBg: "#12010e", accent: "#f472b6" },
  { id: "forest", label: "Forest night", sceneBg: "#07140f", accent: "#34d399" },
];

const KEY = "living-resume-theme";

export function readTheme(): ThemeId {
  try {
    const v = localStorage.getItem(KEY) as ThemeId | null;
    if (v && THEMES.some((t) => t.id === v)) return v;
  } catch {
    /* ignore */
  }
  return "copilot";
}

export function writeTheme(id: ThemeId) {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* ignore */
  }
  document.documentElement.dataset.theme = id;
}
