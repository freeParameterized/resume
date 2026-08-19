import { useEffect } from "react";
import type { Project } from "../types";
import { meaningful } from "./InlineContext";

type Props = {
  project: Project | null;
  onClose: () => void;
};

export function ProjectPanel({ project, onClose }: Props) {
  useEffect(() => {
    if (!project) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [project, onClose]);

  if (!project) return null;

  return (
    <>
      <button type="button" className="drawer-backdrop" aria-label="Close project panel" onClick={onClose} />
      <aside className="drawer fade-in" role="dialog" aria-labelledby="project-title">
        <div className="drawer-head">
          <div>
            <div className="status" style={{ fontFamily: "var(--mono)", fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--brass)" }}>
              {project.visibility}
              {project.version ? ` · ${project.version}` : ""}
            </div>
            <h2 id="project-title">{project.name}</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="drawer-body">
          {project.id === "digital-twin-pro" && (
            <div className="project-gallery" aria-label="Digital Twin Pro Screenshots">
              {Array.from({ length: 50 }).map((_, i) => {
                const imgNum = (i % 4) + 1;
                const ext = imgNum === 1 || imgNum === 4 ? "jpg" : "png";
                return (
                  <div className="gallery-item" key={i}>
                    <img src={`/images/digital-twin-pro/screenshot${imgNum}.${ext}`} alt={`Digital Twin Pro screenshot ${i + 1}`} loading="lazy" />
                  </div>
                );
              })}
            </div>
          )}
          {meaningful(project.summary) ? <p>{project.summary}</p> : null}
          {meaningful(project.owner) ? <p className="job-meta">{project.owner}</p> : null}
          {meaningful(project.honesty) ? <div className="honesty">{project.honesty}</div> : null}
          <div className="stack-row">
            {project.stack.map((s) => (
              <span className="chip" key={s}>
                {s}
              </span>
            ))}
          </div>
          <ul>
            {project.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          {meaningful(project.url) ? (
            <p>
              <a href={project.url as string} target="_blank" rel="noreferrer">
                Open repository
              </a>
            </p>
          ) : (
            <p className="job-meta">Local repository — not pushed to a public remote.</p>
          )}
        </div>
      </aside>
    </>
  );
}
