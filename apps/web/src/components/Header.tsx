import type { Health } from "../types";

type Props = {
  name: string;
  onAsk: () => void;
  onAbout: () => void;
  onSettings: () => void;
  health: Health | null;
};

export function Header({ name, onAsk, onAbout, onSettings, health }: Props) {
  const live = Boolean(health?.ok);
  return (
    <header className="app-header glass">
      <div className="brand">
        <strong>{name}</strong>
        <span>Free Parameter LLC · Chesterfield / St. Louis</span>
      </div>
      <nav className="nav" aria-label="Sections">
        <a className="hide-sm" href="#summary">
          Summary
        </a>
        <a href="#projects">Projects</a>
        <a href="#deep-dive">Deep dive</a>
        <button type="button" className="ask-launch" onClick={onAbout}>
          About Me
        </button>
        <a className="ask-launch" href={`${import.meta.env.BASE_URL}PeterLilley_Resume.pdf`} download>
          Download resume
        </a>
        <a className="hide-sm" href={`${import.meta.env.BASE_URL}?resume=1`}>
          Print view
        </a>
        <a href="https://github.com/freeParameterized" target="_blank" rel="noreferrer">
          GitHub
        </a>
        <button type="button" className="ask-launch" onClick={onSettings}>
          Settings
        </button>
        <button type="button" className="ask-launch" onClick={onAsk}>
          <span className={`status-dot${health?.ollama.reachable ? " on" : ""}`} />
          Ask
        </button>
      </nav>
      <span className="visually-hidden">{live ? "API connected" : "Static corpus mode"}</span>
    </header>
  );
}
