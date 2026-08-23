import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { loadSettings, saveSettings } from "./settings";

/** Printable sheet only. GitHub Pages lives at /resume/, so that path is the website, not print. */
function isResumeRoute(): boolean {
  const { pathname, hash, search } = window.location;
  if (new URLSearchParams(search).has("resume")) return true;
  if (/^#\/?resume$/.test(hash)) return true;
  const base = new URL(import.meta.env.BASE_URL || "/", "http://local").pathname.replace(/\/+$/, "");
  const path = pathname.replace(/\/+$/, "");
  if (!path || path === base) return false;
  return /\/resume$/.test(path);
}

const root = createRoot(document.getElementById("root")!);

if (isResumeRoute()) {
  document.documentElement.classList.add("print-route");
  void (async () => {
    const { ResumeSheet } = await import("./components/ResumeSheet");
    root.render(
      <StrictMode>
        <ResumeSheet />
      </StrictMode>,
    );
  })();
} else {
  saveSettings(loadSettings());
  void (async () => {
    await import("./styles/global.css");
    const { default: App } = await import("./App");
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  })();
}
