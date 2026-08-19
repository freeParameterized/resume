import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { loadSettings, saveSettings } from "./settings";
import { PasswordGate } from "./components/PasswordGate";

/** /resume, #/resume, or ?resume=1 all render the printable sheet with no app chrome. */
function isResumeRoute(): boolean {
  const { pathname, hash, search } = window.location;
  return (
    /\/resume\/?$/.test(pathname) ||
    /^#\/?resume$/.test(hash) ||
    new URLSearchParams(search).has("resume")
  );
}

const root = createRoot(document.getElementById("root")!);

if (isResumeRoute()) {
  document.documentElement.classList.add("print-route");
  void (async () => {
    const { ResumeSheet } = await import("./components/ResumeSheet");
    root.render(
      <StrictMode>
        <PasswordGate>
          <ResumeSheet />
        </PasswordGate>
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
        <PasswordGate>
          <App />
        </PasswordGate>
      </StrictMode>,
    );
  })();
}
