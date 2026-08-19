import { useCallback, useEffect, useMemo, useState } from "react";
import { loadGithub, loadHealth, loadPapers, loadProfile, loadProjects } from "./api";
import { DEEP_DIVE_IDS, HERO_PROJECT_IDS } from "./catalog";
import { DeepDive } from "./components/DeepDive";
import { EducationList } from "./components/EducationList";
import { ExperienceList } from "./components/ExperienceList";
import { GithubCard } from "./components/GithubCard";
import { Header } from "./components/Header";
import { ProjectList } from "./components/ProjectList";
import { ProjectPanel } from "./components/ProjectPanel";
import { Section } from "./components/Section";
import { Skills } from "./components/Skills";
import { Summary } from "./components/Summary";
import { loadSettings, saveSettings, type Settings } from "./settings";
import type { Corpus, GithubInfo, Health, Paper, Project } from "./types";
import { logVisit } from "./visits";

/** StrictMode runs mount effects twice in dev; one page view per load is the truth. */
let pageViewSent = false;

export default function App() {
  const [corpus, setCorpus] = useState<Corpus | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [health, setHealth] = useState<Health | null>(null);
  const [github, setGithub] = useState<GithubInfo | null>(null);
  const [papers, setPapers] = useState<{ available: boolean; papers: Paper[] }>({ available: false, papers: [] });
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  const selected = useMemo(
    () => projects.find((p) => p.id === selectedId) || null,
    [projects, selectedId],
  );
  const heroProjects = useMemo(
    () => projects.filter((p) => (HERO_PROJECT_IDS as readonly string[]).includes(p.id)),
    [projects],
  );
  const deepProjects = useMemo(
    () => projects.filter((p) => (DEEP_DIVE_IDS as readonly string[]).includes(p.id)),
    [projects],
  );

  const onSelect = useCallback((id: string) => {
    setSelectedId(id || null);
  }, []);

  if (!corpus) {
    return (
      <div className="scene-fallback" style={{ minHeight: "100svh" }}>
        Initializing spatial graph...
      </div>
    );
  }

  const { profile } = corpus;

  return (
    <>
      <a className="skip" href="#summary">
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
        <div className="resume-header">
          <div className="resume-title">
            <h1>{profile.name}</h1>
            <div className="resume-kicker">Software engineer - systems, geometry, automation | St. Louis</div>
          </div>
          <p className="resume-subtitle">
            Writes deterministic C#, C++17, and Python against the Civil 3D, AutoCAD, and Revit APIs. Constrains model output to a typed command schema, then lets compiled code construct and validate the geometry.
          </p>
          <ul className="resume-metrics">
            <li>C# / .NET plugins in daily production use</li>
            <li>C++17 COM bridge across three CAD platforms</li>
            <li>8-12 hour drafting cycle cut to ~30 seconds</li>
            <li>Digital Twin Pro shipped solo to Play beta</li>
          </ul>
        </div>
        
        <Section id="summary" index="01" title="Professional summary">
          <Summary profile={profile} />
        </Section>
        
        <Section id="skills" index="02" title="Core stack">
          <Skills groups={corpus.skillGroups} />
        </Section>
        {corpus.howIWork ? (
          <Section id="how-i-work" index="03" title={corpus.howIWork.headline}>
            <ul className="how-list">
              {corpus.howIWork.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </Section>
        ) : null}
        <Section id="experience" index="04" title="Experience">
          <ExperienceList jobs={corpus.experience} />
        </Section>
        <Section id="education" index="05" title="Education">
          <EducationList items={corpus.education} early={corpus.early} />
        </Section>
        <Section id="projects" index="06" title="Projects">
          <p className="lede" style={{ marginTop: 0 }}>
            Digital Twin Pro and DMA automation - the work that should lead a programming conversation.
          </p>
          <ProjectList projects={heroProjects} selectedId={selectedId} onSelect={onSelect} />

          <div style={{ marginTop: 22 }}>
            <GithubCard info={github} />
          </div>
        </Section>
        <Section id="deep-dive" index="07" title="Deep dive">
          <DeepDive projects={deepProjects} papersAvailable={papers.available} papers={papers.papers} />
        </Section>
      </main>
      <ProjectPanel project={selected} onClose={() => setSelectedId(null)} />
    </>
  );
}
