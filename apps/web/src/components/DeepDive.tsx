import { useState } from "react";
import type { Paper, Project } from "../types";

type Props = {
  projects: Project[];
  papersAvailable: boolean;
  papers: Paper[];
};

/** Records that are not Peter's work never render — they exist only so chat can correct a bad DOI. */
function isNotHis(p: Paper): boolean {
  return p.notPeters === true || /exclude/i.test(p.recommendedPlacement || "");
}

export function DeepDive({ projects, papersAvailable, papers }: Props) {
  const [open, setOpen] = useState(false);
  const mine = papers.filter((p) => !isNotHis(p));

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
              <details key={p.id} className="deep-card glass">
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

          {papersAvailable && mine.length ? (
            <div className="papers-block">
              <h3>Personal curiosity — not peer reviewed</h3>
              <p className="honesty">
                Off to the side on purpose. This is a personal write-up Peter deposited himself on Zenodo, which is an
                open archive, not a journal — nothing here was refereed. It is speculative, it was typeset with LLM
                assistance, and it has known numerical errors in it. It is here because self-directed curiosity is real,
                not because it is a credential.
              </p>
              {mine.map((p, i) => (
                <details key={p.id || p.doi || i} className="deep-card glass">
                  <summary>
                    <strong>{p.title}</strong>
                    <span className="job-meta">{p.label || "Personal curiosity · speculative · not peer reviewed"}</span>
                  </summary>
                  <p>{p.recruiterBlurb || p.summary || p.abstract || ""}</p>
                  {p.honestFraming ? <div className="honesty">{p.honestFraming}</div> : null}
                  <ul>
                    {p.resourceType ? <li>Record type: {p.resourceType} on Zenodo, a self-deposit archive.</li> : null}
                    {p.doi ? <li>DOI: {p.doi}</li> : null}
                    {p.license ? <li>License: {p.license}</li> : null}
                    <li>Deposited under Free Parameter LLC, Peter’s own company.</li>
                    <li>Known errors: dimensional and numerical mistakes he does not paper over.</li>
                  </ul>
                  {p.url ? (
                    <a href={p.url} target="_blank" rel="noreferrer">
                      Open the Zenodo record
                    </a>
                  ) : null}
                </details>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
