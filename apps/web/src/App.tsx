import { useEffect, useMemo, useState } from "react";
import resume from "@resume";
import { loadGithub, loadHealth, loadPapers, loadProfile, loadProjects } from "./api";
import { DEEP_DIVE_IDS } from "./catalog";
import { DeepDive } from "./components/DeepDive";
import { EducationList } from "./components/EducationList";
import { ExperienceList } from "./components/ExperienceList";
import { GithubCard } from "./components/GithubCard";
import { Header } from "./components/Header";
import { ResumeIntro } from "./components/ResumeIntro";
import { Section } from "./components/Section";
import { Skills } from "./components/Skills";
import { TabletFrame } from "./components/TabletFrame";
import { loadSettings, saveSettings, type Settings } from "./settings";
import type { Corpus, GithubInfo, Health, Paper, Project } from "./types";
import { logVisit } from "./visits";

/** StrictMode runs mount effects twice in dev; one page view per load is the truth. */
let pageViewSent = false;

type ResumeDoc = {
  skills: { label: string; items: string }[];
  experience: { org: string; location: string; title: string; dates: string; bullets: string[] }[];
  projects: { name: string; stack?: string; meta: string; bullets: string[] }[];
  education: { org: string; location: string; credential: string; dates: string; note?: string }[];
};

const doc = resume as ResumeDoc;

export default function App() {
  const [corpus, setCorpus] = useState<Corpus | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [health, setHealth] = useState<Health | null>(null);
  const [github, setGithub] = useState<GithubInfo | null>(null);
  const [papers, setPapers] = useState<{ available: boolean; papers: Paper[] }>({ available: false, papers: [] });
  const [settings, setSettings] = useState<Settings>(() => loadSettings());

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (pageViewSent) return;
    pageViewSent = true;
    logVisit("page");
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [p, proj, h, gh, pap] = await Promise.all([
        loadProfile(),
        loadProjects(),
        loadHealth(),
        loadGithub(),
        loadPapers(),
      ]);
      if (!alive) return;
      setCorpus(p);
      setProjects(proj);
      setHealth(h);
      setGithub(gh);
      setPapers(pap);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const deepProjects = useMemo(
    () => projects.filter((p) => (DEEP_DIVE_IDS as readonly string[]).includes(p.id)),
    [projects],
  );

  if (!corpus) {
    return (
      <div className="scene-fallback" style={{ minHeight: "100svh" }}>
        Initializing resume...
      </div>
    );
  }

  const { profile } = corpus;

  return (
    <>
      <a className="skip" href="#work">
        Skip to resume
      </a>
      <Header
        name={profile.name}
        theme={settings.theme}
        onToggleTheme={() =>
          setSettings((prev) => ({ ...prev, theme: prev.theme === "light" ? "dark" : "light" }))
        }
        health={health}
      />
      <main className="shell">
        <ResumeIntro />

        <Section id="work" index="" title="Experience">
          <ExperienceList
            jobs={doc.experience.map((job) => ({
              id: `${job.org}-${job.dates}`,
              org: job.org,
              location: job.location,
              title: job.title,
              dates: job.dates,
              bullets: job.bullets,
            }))}
          />
        </Section>

        <Section id="projects" index="" title="Selected Projects">
          <div className="role-list">
            {doc.projects.map((p) => (
              <article className="role-block is-open" key={p.name}>
                <h3>{p.name}</h3>
                <p className="role-org">{p.stack || p.meta}</p>
                <ul>
                  {p.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
                {p.name === "Digital Twin Pro" ? <TabletFrame title={p.name} /> : null}
              </article>
            ))}
          </div>
        </Section>

        <Section id="skills" index="" title="Skills">
          <Skills groups={doc.skills} />
        </Section>

        <Section id="education" index="" title="Education">
          <EducationList
            items={doc.education.map((ed) => ({
              id: ed.org,
              org: ed.org,
              location: ed.location,
              credential: ed.credential,
              dates: ed.dates,
              notes: ed.note ? [ed.note] : undefined,
            }))}
          />
        </Section>

        <Section id="contact" index="" title="Contact">
          <p className="lede">
            Open to software and CAD-automation roles, remote or {profile.location}. Reach me at{" "}
            <a href={`mailto:${profile.email}`}>{profile.email}</a>, or read the code at{" "}
            <a href={profile.github} target="_blank" rel="noreferrer">
              {profile.github.replace(/^https:\/\//, "")}
            </a>
            . Download or print a copy from the header.
          </p>
        </Section>

        <Section id="github" index="" title="GitHub">
          <GithubCard info={github} />
        </Section>

        <Section id="deep-dive" index="" title="Deep dive">
          <DeepDive projects={deepProjects} papersAvailable={papers.available} papers={papers.papers} />
        </Section>
      </main>
    </>
  );
}
