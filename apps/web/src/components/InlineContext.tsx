import type { AboutMe, Experience, Paper, Project } from "../types";
import { logVisit } from "../visits";

export type ContextBlock = {
  kind: "project" | "job" | "about" | "metric" | "skill" | "paper" | "resume";
  id: string;
  title: string;
  subtitle?: string;
  body: string;
  bullets?: string[];
  href?: string;
  badge?: string;
  download?: string;
  linkLabel?: string;
};

const PLACEHOLDERS = new Set(["unknown", "undefined", "null", "n/a", "na", "none", "tbd"]);

/** Never render a missing value as text: omit the element instead. */
export function meaningful(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (PLACEHOLDERS.has(trimmed.toLowerCase())) return null;
  return trimmed;
}

export const RESUME_PDF_URL = `${import.meta.env.BASE_URL}PeterLilley_Resume.pdf`;
export const RESUME_TEXT_URL = `${import.meta.env.BASE_URL}PeterLilley_Resume.txt`;

export function resumeToBlock(): ContextBlock {
  return {
    kind: "resume",
    id: "resume-download",
    title: "Download my resume (PDF)",
    subtitle: "One to two pages, plain and printable",
    body: "Here it is — a standard resume you can save or forward. There is a plain-text version too if a job portal wants pasteable text.",
    href: RESUME_PDF_URL,
    download: "PeterLilley_Resume.pdf",
    linkLabel: "Download my resume (PDF)",
    badge: "Resume",
  };
}

export function InlineContext({ block }: { block: ContextBlock }) {
  const badge = meaningful(block.badge);
  const subtitle = meaningful(block.subtitle);
  const body = meaningful(block.body);
  const href = meaningful(block.href);
  const bullets = (block.bullets || []).map(meaningful).filter((b): b is string => Boolean(b));

  return (
    <article className={`inline-card fade-in kind-${block.kind}`}>
      {badge ? <div className="status">{badge}</div> : null}
      <h3>{block.title}</h3>
      {subtitle ? <p className="job-meta">{subtitle}</p> : null}
      {body ? <p>{body}</p> : null}
      {bullets.length ? (
        <ul>
          {bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      ) : null}
      {href ? (
        block.download ? (
          <a
            className="download-link"
            href={href}
            download={block.download}
            onClick={() => logVisit("resume", "pdf")}
          >
            {block.linkLabel || "Download"}
          </a>
        ) : (
          <a href={href} target="_blank" rel="noreferrer">
            {block.linkLabel || "Open"}
          </a>
        )
      ) : null}
    </article>
  );
}

export function projectToBlock(p: Project): ContextBlock {
  return {
    kind: "project",
    id: p.id,
    title: p.name,
    subtitle: p.visibility,
    body: p.summary,
    bullets: p.bullets.slice(0, 4),
    href: p.url || undefined,
    linkLabel: "Open repository",
    badge: p.featured ? "Featured" : "Project",
  };
}

export function jobToBlock(job: Experience): ContextBlock {
  return {
    kind: "job",
    id: job.id,
    title: job.org,
    subtitle: `${job.title} · ${job.dates}`,
    body: job.bullets[0] || "",
    bullets: job.bullets.slice(0, 4),
    badge: "Experience",
  };
}

export function aboutToBlock(about: AboutMe): ContextBlock {
  return {
    kind: "about",
    id: "about",
    title: about.headline,
    subtitle: "About Me",
    body: about.body,
    badge: "About",
  };
}

export function paperToBlock(paper: Paper, index: number): ContextBlock {
  const notHis = paper.notPeters === true || /exclude/i.test(paper.recommendedPlacement || "");
  const blurb = paper.recruiterBlurb || paper.summary || paper.abstract || paper.note || "";
  return {
    kind: "paper",
    id: paper.id || paper.doi || `paper-${index}`,
    title: paper.title || "Zenodo record",
    subtitle: notHis
      ? "A different authors' paper"
      : [paper.venue, paper.year, paper.doi].filter(Boolean).join(" · "),
    body: notHis
      ? paper.correction ||
        `This record is not Peter A. Lilley’s work${paper.authors?.length ? ` (authors: ${paper.authors.join(", ")})` : ""}.`
      : blurb,
    href: paper.url,
    linkLabel: "Open the Zenodo record",
    badge: notHis ? "Not Peter’s work" : "Personal curiosity · not peer reviewed",
  };
}
