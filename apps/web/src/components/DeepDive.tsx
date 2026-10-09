import { useState } from "react";
import type { Paper, Project } from "../types";

type Props = {
  projects: Project[];
  papersAvailable: boolean;
  papers: Paper[];
};

export function DeepDive({ projects }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="deep-dive">
      <button type="button" className="deep-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        {open ? "Hide more work" : "More work"} — CAD generators, XR networking, CAD integration
      </button>
      {open ? (
        <div className="fade-in">
          <div className="project-grid">
            {projects.map((p) => (
              <details key={p.id} className="deep-card">
                <summary>
                  <strong>{p.name}</strong>
                  <span className="job-meta">{p.visibility}</span>
                </summary>
                <p>{p.summary}</p>
                <div className="stack-row">
                  {p.stack.map((s) => (
                    <span className="chip" key={s}>
                      {s}
                    </span>
                  ))}
                </div>
                <ul>
                  {p.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
                {p.url ? (
                  <a href={p.url} target="_blank" rel="noreferrer">
                    Open repository
                  </a>
                ) : (
                  <p className="job-meta">Walkthrough on request.</p>
                )}
              </details>
            ))}
          </div>

        </div>
      ) : null}
    </div>
  );
}
