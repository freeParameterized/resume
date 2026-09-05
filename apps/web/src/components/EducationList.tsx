import type { Education } from "../types";

export function EducationList({ items, early }: { items: Education[]; early?: string[] }) {
  const earlyLine = (early || []).join(" ").trim();
  return (
    <>
      <div className="edu-list">
        {items.map((ed) => (
          <article key={ed.id} className="edu-row">
            <h3>{ed.org}</h3>
            <p>{ed.credential}</p>
            <p className="role-dates">
              {ed.dates}
              {ed.location ? ` · ${ed.location}` : ""}
            </p>
            {ed.notes?.length
              ? ed.notes.map((n) => (
                  <p key={n} className="edu-note">
                    {n}
                  </p>
                ))
              : null}
          </article>
        ))}
      </div>
      {earlyLine ? (
        <p className="lede" style={{ marginTop: 18 }}>
          Early foundation: {earlyLine}
        </p>
      ) : null}
    </>
  );
}
