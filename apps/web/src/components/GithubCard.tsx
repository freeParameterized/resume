import type { GithubInfo } from "../types";
import { meaningful } from "./InlineContext";

export function GithubCard({ info }: { info: GithubInfo | null }) {
  if (!info) return null;
  const note = meaningful(info.note);
  const description = meaningful(info.description);
  return (
    <article className="gh-card">
      <div className="job-meta">
        {info.source === "github" ? "Live GitHub metadata" : "Offline fallback"}
        {note ? ` · ${note}` : ""}
      </div>
      <h3>
        {info.owner}/{info.repo}
      </h3>
      {description ? <p>{description}</p> : null}
      <div className="chips">
        {info.language ? <span className="chip">{info.language}</span> : null}
        {typeof info.stars === "number" ? <span className="chip">★ {info.stars}</span> : null}
        {typeof info.forks === "number" ? <span className="chip">forks {info.forks}</span> : null}
      </div>
      <p>
        <a href={info.htmlUrl} target="_blank" rel="noreferrer">
          {info.htmlUrl}
        </a>
      </p>
    </article>
  );
}
