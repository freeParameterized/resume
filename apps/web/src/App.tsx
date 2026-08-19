import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { loadGithub, loadHealth, loadModels, loadPapers, loadProfile, loadProjects } from "./api";
import { DEEP_DIVE_IDS, HERO_PROJECT_IDS } from "./catalog";
import { ChatDock } from "./components/ChatDock";
import { DeepDive } from "./components/DeepDive";
import { EducationList } from "./components/EducationList";
import { ExperienceList } from "./components/ExperienceList";
import { Footer } from "./components/Footer";
import { GithubCard } from "./components/GithubCard";
import { Header } from "./components/Header";
import { ProjectList } from "./components/ProjectList";
import { ProjectPanel } from "./components/ProjectPanel";
import { Section } from "./components/Section";
import { SettingsPanel } from "./components/SettingsPanel";
import { Skills } from "./components/Skills";
import { Summary } from "./components/Summary";
import { loadSettings, saveSettings, type Settings } from "./settings";
import { THEMES } from "./theme";
import type { Corpus, GithubInfo, Health, ModelCatalog, Paper, Project } from "./types";
import { logVisit } from "./visits";

const WorkGraph = lazy(() => import("./scene/WorkGraph").then((m) => ({ default: m.WorkGraph })));

/** StrictMode runs mount effects twice in dev; one page view per load is the truth. */
let pageViewSent = false;

export default function App() {
  const [corpus, setCorpus] = useState<Corpus | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [health, setHealth] = useState<Health | null>(null);
  const [github, setGithub] = useState<GithubInfo | null>(null);
  const [papers, setPapers] = useState<{ available: boolean; papers: Paper[] }>({ available: false, papers: [] });
  const [models, setModels] = useState<ModelCatalog | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [askOpen, setAskOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [viewVersion, setViewVersion] = useState<"welcome" | "professional" | "interactive">("welcome");

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
      const [p, proj, h, gh, pap, mods] = await Promise.all([
        loadProfile(),
        loadProjects(),
        loadHealth(),
        loadGithub(),
        loadPapers(),
        loadModels(),
      ]);
      if (!alive) return;
      setCorpus(p);
      setProjects(proj);
      setHealth(h);
      setGithub(gh);
      setPapers(pap);
      setModels(mods);
      setSettings((prev) => ({
        ...prev,
        model: prev.model || mods?.selected || "",
      }));
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

  const onIntents = useCallback((intents: { projectIds: string[]; paperIds?: string[] }) => {
    if (intents.paperIds?.length) {
      setSelectedId("grok-tensor");
    }
    if (intents.projectIds[0]) {
      setSelectedId(intents.projectIds[0]);
    }
  }, []);

  if (!corpus) {
    return (
      <div className="scene-fallback" style={{ minHeight: "100svh" }}>
        Initializing spatial graph...
      </div>
    );
  }

  const { profile } = corpus;
  const sceneBg = THEMES.find((t) => t.id === settings.theme)?.sceneBg || "#0b1220";

  if (viewVersion === "welcome") {
    return (
      <main className="shell" style={{ display: "flex", flexDirection: "column", minHeight: "100svh", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <h1 style={{ fontSize: "3rem", marginBottom: "1rem" }}>{profile.name}</h1>
        <p className="lede" style={{ marginBottom: "3rem" }}>Select a resume experience.</p>
        
        <div style={{ display: "grid", gap: "24px", width: "100%", maxWidth: "800px" }}>
          <button 
            onClick={() => setViewVersion("professional")}
            style={{ padding: "24px", background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "var(--rad)", cursor: "pointer", textAlign: "left", display: "block", color: "inherit", textDecoration: "none" }}
          >
            <h2 style={{ margin: "0 0 8px", fontSize: "1.4rem" }}>Version 1: Professional 2D</h2>
            <p style={{ margin: 0, color: "var(--muted)" }}>A clean, minimalist, high-contrast layout. Optimized for left-brained reading.</p>
          </button>
          
          <button 
            onClick={() => setViewVersion("interactive")}
            style={{ padding: "24px", background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "var(--rad)", cursor: "pointer", textAlign: "left", display: "block", color: "inherit", textDecoration: "none" }}
          >
            <h2 style={{ margin: "0 0 8px", fontSize: "1.4rem" }}>Version 2: Interactive 3D Graph</h2>
            <p style={{ margin: 0, color: "var(--muted)" }}>A spatial representation of work history using React Three Fiber.</p>
          </button>
          
          <a 
            href="?resume=1" 
            target="_blank"
            style={{ padding: "24px", background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "var(--rad)", cursor: "pointer", textAlign: "left", display: "block", color: "inherit", textDecoration: "none" }}
          >
            <h2 style={{ margin: "0 0 8px", fontSize: "1.4rem" }}>Version 3: Printable PDF</h2>
            <p style={{ margin: 0, color: "var(--muted)" }}>A stark, black-and-white traditional document format ready for print or saving.</p>
          </a>
        </div>
      </main>
    );
  }

  return (
    <>
      <a className="skip" href="#summary">
        Skip to resume
      </a>
      <Header
        name={profile.name}
        onAsk={() => setAskOpen(true)}
        onSettings={() => setSettingsOpen(true)}
        health={health}
      />
      <div style={{ padding: "12px 22px", background: "var(--panel)", borderBottom: "1px solid var(--line)", fontSize: "0.85rem", display: "flex", justifyContent: "center" }}>
        <button 
          onClick={() => setViewVersion("welcome")}
          style={{ background: "transparent", border: "none", color: "var(--brass)", cursor: "pointer", fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "0.1em" }}
        >
          ← Back to Welcome
        </button>
      </div>
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
            <li>40 layouts renamed in under 1.7 seconds</li>
            <li>8-12 hour drafting cycle cut to ~30 seconds</li>
            <li>Digital Twin Pro shipped solo to Play beta</li>
          </ul>
        </div>
        
        <Section id="summary" index="01" title="Professional summary">
          <Summary profile={profile} />
        </Section>
        
        <Section id="skills" index={viewVersion === "interactive" ? "02" : "02"} title="Core stack">
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
          
          <div className="hero-constrained" style={{ marginTop: 'var(--sp-8)' }}>
            <div className="hero-constrained-header">Interactive Architecture Graph</div>
            <Suspense fallback={<div className="scene-fallback">Loading work graph...</div>}>
              <WorkGraph
                projects={projects}
                selectedId={selectedId}
                onSelect={onSelect}
                sceneBg={sceneBg}
                reducedMotion={settings.reducedMotion}
              />
            </Suspense>
          </div>

          <div style={{ marginTop: 22 }}>
            <GithubCard info={github} />
          </div>
        </Section>
        <Section id="deep-dive" index="07" title="Deep dive">
          <DeepDive projects={deepProjects} papersAvailable={papers.available} papers={papers.papers} />
        </Section>
      </main>
      <Footer />
      <ProjectPanel project={selected} onClose={() => setSelectedId(null)} />
      <ChatDock
        open={askOpen}
        onClose={() => setAskOpen(false)}
        health={health}
        settings={settings}
        projects={projects}
        papers={papers.papers}
        onIntents={onIntents}
      />
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onChange={setSettings}
        models={models}
        ollamaReachable={Boolean(health?.ollama.reachable)}
      />
    </>
  );
}
