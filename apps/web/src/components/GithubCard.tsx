import type { GithubInfo } from "../types";
import { meaningful } from "./InlineContext";

export function GithubCard({ info }: { info: GithubInfo | null }) {
  if (!info) return null;
  const description = meaningful(info.description);
  return (
    <article className="gh-card">
      <h3>
        {info.owner}/{info.repo}
      </h3>
      {description ? <p>{description}</p> : null}
      {info.language ? (
        <div className="chips">
          <span className="chip">{info.language}</span>
        </div>
      ) : null}
      <p>
        <a href={info.htmlUrl} target="_blank" rel="noreferrer">
          {info.htmlUrl}
        </a>
      </p>
    </article>
  );
}
