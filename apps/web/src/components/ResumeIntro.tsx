import resume from "@resume";

type ResumeDoc = {
  name: string;
  role?: string;
  focus?: string;
  headline: string;
  stats?: { value: string; label: string }[];
  contact: {
    location: string;
    email: string;
    phone: string;
    github: string;
    website: string;
    company: string;
  };
  summary: string;
};

const doc = resume as ResumeDoc;

function githubHref(github: string): string {
  if (/^https?:\/\//i.test(github)) return github;
  return `https://${github.replace(/^github\.com\//i, "github.com/")}`;
}

/** Name, role · focus, contact — same hierarchy as the PDF. */
export function ResumeIntro() {
  const c = doc.contact;
  const role = doc.role || doc.headline;
  return (
    <div className="resume-header">
      <div className="resume-title">
        <h1>{doc.name}</h1>
        <p className="resume-headline">
          <strong>{role}</strong>
          {doc.focus ? ` · ${doc.focus}` : ""}
        </p>
      </div>
      <p className="resume-contact">
        {c.location} | <a href={`mailto:${c.email}`}>{c.email}</a> | {c.phone} |{" "}
        <a href={githubHref(c.github)} target="_blank" rel="noreferrer">
          {c.github}
        </a>
      </p>
      {doc.stats?.length ? (
        <ul className="resume-stats">
          {doc.stats.map((s) => (
            <li key={`${s.value}-${s.label}`}>
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="lede">{doc.summary}</p>
    </div>
  );
}

export function ResumeSummary() {
  return <p className="lede">{doc.summary}</p>;
}
