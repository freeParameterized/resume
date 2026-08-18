import type { Education } from "../types";

export function EducationList({ items, early }: { items: Education[]; early: string[] }) {
  return (
    <>
      <div className="edu-grid">
        {items.map((ed) => (
          <article key={ed.id} className="edu-card">
            <div className="job-meta">
              {ed.dates} · {ed.location}
            </div>
            <h3>{ed.org}</h3>
            <p>{ed.credential}</p>
            {ed.notes ? (
              <div className="chips">
                {ed.notes.map((n) => (
                  <span className="chip" key={n}>
                    {n}
                  </span>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
      <p className="lede" style={{ marginTop: 18 }}>
        Early foundation: {early.join(" ")}
      </p>
    </>
  );
}
