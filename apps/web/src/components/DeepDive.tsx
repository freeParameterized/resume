import { useState } from "react";
import type { Paper, Project } from "../types";

type Props = {
  projects: Project[];
  papersAvailable: boolean;
  papers: Paper[];
};

export function DeepDive({ projects, papersAvailable, papers }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="deep-dive">
      <button type="button" className="deep-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        {open ? "Hide deep dive" : "Open deep dive"} — CAD tooling, C++ systems, prototypes, personal curiosities
      </button>
      {open ? (
        <div className="fade-in">
          <p className="lede">
            Longer technical detail that does not belong up front, listed at true size — including the small prototypes
            and the things that are experiments rather than products.
          </p>
          <div className="project-grid">
            {projects.map((p) => (
              <details key={p.id} className="deep-card">
                <summary>
                  <strong>{p.name}</strong>
                  <span className="job-meta">{p.visibility}</span>
                </summary>
                <p>{p.summary}</p>
                <div className="honesty">{p.honesty}</div>
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
                  <p className="job-meta">Local repository — no remote.</p>
                )}
              </details>
            ))}
          </div>

        </div>
      ) : null}
    </div>
  );
}
