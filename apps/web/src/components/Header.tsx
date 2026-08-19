import type { Health } from "../types";
import { logVisit } from "../visits";

type Props = {
  name: string;
  onAsk: () => void;
  onSettings: () => void;
  health: Health | null;
};

export function Header({ name, onAsk, onSettings, health }: Props) {
  const live = Boolean(health?.ok);
  return (
    <header className="app-header">
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
        <a
          className="ask-launch"
          href={`${import.meta.env.BASE_URL}PeterLilley_Resume.pdf`}
          download
          onClick={() => logVisit("resume", "pdf")}
        >
          Download resume
        </a>
        <a className="hide-sm" href={`${import.meta.env.BASE_URL}?resume=1`}>
          Print view
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
