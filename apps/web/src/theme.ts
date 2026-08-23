export type ThemeId = "light" | "dark";

export const THEMES: { id: ThemeId; label: string; sceneBg: string; accent: string }[] = [
  { id: "light", label: "Professional Light", sceneBg: "#ffffff", accent: "#0f172a" },
  { id: "dark", label: "Professional Dark", sceneBg: "#0f172a", accent: "#ffffff" },
];

const KEY = "cadpal-theme";

export function readTheme(): ThemeId {
  try {
    const v = (localStorage.getItem(KEY) || localStorage.getItem("living-resume-theme")) as ThemeId | null;
    if (v && THEMES.some((t) => t.id === v)) return v;
  } catch {
    /* ignore */
  }
  return "light";
}

export function writeTheme(id: ThemeId) {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* ignore */
  }
  document.documentElement.dataset.theme = id;
}
