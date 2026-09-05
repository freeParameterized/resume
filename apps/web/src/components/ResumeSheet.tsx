import resume from "@resume";
import { onResumePdfClick, resumePdfLinkProps } from "../resumeDownload";
import "../styles/print.css";
import { logVisit } from "../visits";

type SkillGroup = { label: string; items: string };
type Job = { org: string; location: string; title: string; dates: string; bullets: string[]; printBullets?: string[] };
type Proj = { name: string; stack?: string; meta: string; bullets: string[]; printBullets?: string[] };
type Edu = { org: string; location: string; credential: string; dates: string; note?: string };

type ResumeDoc = {
  name: string;
  role?: string;
  focus?: string;
  headline: string;
  contact: {
    location: string;
    email: string;
    phone: string;
    address: string;
    github: string;
    website: string;
    company: string;
  };
  summary: string;
  skills: SkillGroup[];
  experience: Job[];
  projects: Proj[];
  education: Edu[];
};

const doc = resume as ResumeDoc;

/**
 * Print sheet that matches the downloadable PDF: name, role · focus, pipe-separated
 * contact, then Experience / Selected Projects / Skills / Education.
 */
export function ResumeSheet() {
  const c = doc.contact;
  const role = doc.role || doc.headline;
  const contactLine = [c.location, c.email, c.phone, c.github, c.website].filter(Boolean).join(" | ");
  return (
    <main className="sheet">
      <header className="sheet-head">
        <h1>{doc.name}</h1>
        <p className="sheet-headline">
          <strong>{role}</strong>
          {doc.focus ? ` · ${doc.focus}` : ""}
        </p>
        <p className="sheet-contact">{contactLine}</p>
        <p className="sheet-summary">{doc.summary}</p>
      </header>

      <section>
        <h2>Experience</h2>
        {doc.experience.map((j) => (
          <article className="sheet-entry" key={`${j.org}-${j.dates}`}>
            <h3>{j.title}</h3>
            <p className="sheet-org">
              {j.org} — {j.location}
            </p>
            <p className="sheet-meta">{j.dates}</p>
            <ul>
              {(j.printBullets || j.bullets).map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section>
        <h2>Selected Projects</h2>
        {doc.projects.map((p) => (
          <article className="sheet-entry" key={p.name}>
            <h3>{p.name}</h3>
            <p className="sheet-meta">{p.stack || p.meta}</p>
            <ul>
              {(p.printBullets || p.bullets).map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section>
        <h2>Skills</h2>
        <dl className="sheet-skills">
          {doc.skills.map((s) => (
            <div className="sheet-skill" key={s.label}>
              <dt>{s.label}</dt>
              <dd>{s.items}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h2>Education</h2>
        {doc.education.map((e) => (
          <article className="sheet-entry" key={e.org}>
            <h3>{e.org}</h3>
            <p className="sheet-org">{e.credential}</p>
            <p className="sheet-meta">
              {e.dates}
              {e.location ? ` · ${e.location}` : ""}
            </p>
            {e.note ? <p>{e.note}</p> : null}
          </article>
        ))}
      </section>

      <div className="sheet-actions no-print">
        <button type="button" onClick={() => window.print()}>
          Print / Save as PDF
        </button>
        <a {...resumePdfLinkProps} onClick={onResumePdfClick}>
          Download PDF
        </a>
        <a href="./PeterLilley_Resume.txt" download onClick={() => logVisit("resume", "txt")}>
          Download plain text
        </a>
        <a href="./">Back to the site</a>
      </div>
    </main>
  );
}
