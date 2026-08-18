import resume from "@resume";
import "../styles/print.css";

type SkillGroup = { label: string; items: string };
type Job = { org: string; location: string; title: string; dates: string; bullets: string[] };
type Proj = { name: string; meta: string; bullets: string[] };
type Edu = { org: string; location: string; credential: string; dates: string; note?: string };

type ResumeDoc = {
  name: string;
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
 * Print-first, single-column, real-text resume. No canvas, no gradients, no layout tables —
 * ATS parsers read this top to bottom in the same order a human does.
 */
export function ResumeSheet() {
  const c = doc.contact;
  return (
    <main className="sheet">
      <header className="sheet-head">
        <h1>{doc.name}</h1>
        <p className="sheet-headline">{doc.headline}</p>
        <p className="sheet-contact">
          {c.location} · {c.email} · Phone: {c.phone} · {c.github} · {c.website} · {c.company}
        </p>
      </header>

      <section>
        <h2>Summary</h2>
        <p>{doc.summary}</p>
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
        <h2>Experience</h2>
        {doc.experience.map((j) => (
          <article className="sheet-entry" key={`${j.org}-${j.dates}`}>
            <h3>
              {j.title} — {j.org}
            </h3>
            <p className="sheet-meta">
              {j.location} · {j.dates}
            </p>
            <ul>
              {j.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section>
        <h2>Projects</h2>
        {doc.projects.map((p) => (
          <article className="sheet-entry" key={p.name}>
            <h3>{p.name}</h3>
            <p className="sheet-meta">{p.meta}</p>
            <ul>
              {p.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section>
        <h2>Education</h2>
        {doc.education.map((e) => (
          <article className="sheet-entry" key={e.org}>
            <h3>
              {e.credential} — {e.org}
            </h3>
            <p className="sheet-meta">
              {e.location} · {e.dates}
            </p>
            {e.note ? <p>{e.note}</p> : null}
          </article>
        ))}
      </section>

      <div className="sheet-actions no-print">
        <button type="button" onClick={() => window.print()}>
          Print / Save as PDF
        </button>
        <a href="./PeterLilley_Resume.pdf" download>
          Download PDF
        </a>
        <a href="./PeterLilley_Resume.txt" download>
          Download plain text
        </a>
        <a href="./">Back to the site</a>
      </div>
    </main>
  );
}
