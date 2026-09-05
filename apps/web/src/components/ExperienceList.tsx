import { useState } from "react";
import type { Experience } from "../types";

export function ExperienceList({ jobs }: { jobs: Experience[] }) {
  const [openExp, setOpenExp] = useState(0);
  return (
    <div className="role-list">
      {jobs.map((job, i) => {
        const open = openExp === i;
        return (
          <article key={job.id} className={open ? "role-block is-open" : "role-block"}>
            <button
              type="button"
              className="role-toggle"
              aria-expanded={open}
              onClick={() => setOpenExp(open ? -1 : i)}
            >
              <h3>{job.title}</h3>
              <p className="role-org">
                {job.org} — {job.location}
              </p>
              <p className="role-dates">{job.dates}</p>
            </button>
            {open ? (
              <ul>
                {job.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
