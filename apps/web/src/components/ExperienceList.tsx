import type { Experience } from "../types";

export function ExperienceList({ jobs }: { jobs: Experience[] }) {
  return (
    <div className="role-list">
      {jobs.map((job) => (
        <article key={job.id} className="role-block">
          <h3>{job.title}</h3>
          <p className="role-org">
            {job.org} — {job.location}
          </p>
          <p className="role-dates">{job.dates}</p>
          <ul>
            {job.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
