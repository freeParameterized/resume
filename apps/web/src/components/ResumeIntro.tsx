import resume from "@resume";

type ResumeDoc = {
  name: string;
  headline: string;
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

/** Name, headline, contact — same copy as the PDF. */
export function ResumeIntro() {
  const c = doc.contact;
  return (
    <div className="resume-header">
      <div className="resume-title">
        <h1>{doc.name}</h1>
        <p className="resume-headline">{doc.headline}</p>
      </div>
      <p className="resume-contact">
        {c.location} · <a href={`mailto:${c.email}`}>{c.email}</a> · Phone: {c.phone} ·{" "}
        <a href={githubHref(c.github)} target="_blank" rel="noreferrer">
          {c.github}
        </a>{" "}
        · {c.company}
      </p>
    </div>
  );
}

export function ResumeSummary() {
  return <p className="lede">{doc.summary}</p>;
}
