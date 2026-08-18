import type { Experience } from "../types";

export function ExperienceList({ jobs }: { jobs: Experience[] }) {
  return (
    <div className="timeline">
      {jobs.map((job) => (
        <article key={job.id} className="job">
          <div className="job-meta">
            {job.dates} · {job.location}
          </div>
          <h3>{job.org}</h3>
          <div className="role">{job.title}</div>
          <ul>
            {job.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          {job.projects && job.projects.length > 0 ? (
            <div className="chips" aria-label="Named project contexts">
              {job.projects.map((p) => (
                <span className="chip" key={p}>
                  {p}
                </span>
              ))}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
