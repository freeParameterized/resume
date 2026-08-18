import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { loadGithub, loadHealth, loadModels, loadPapers, loadProfile, loadProjects } from "./api";
import { DEEP_DIVE_IDS, HERO_PROJECT_IDS } from "./catalog";
import { AboutPanel } from "./components/AboutPanel";
import { ChatDock } from "./components/ChatDock";
import { DeepDive } from "./components/DeepDive";
import { EducationList } from "./components/EducationList";
import { ExperienceList } from "./components/ExperienceList";
import { Footer } from "./components/Footer";
import { GithubCard } from "./components/GithubCard";
import { Header } from "./components/Header";
import { HeroCopy } from "./components/HeroCopy";
import { ProjectList } from "./components/ProjectList";
import { ProjectPanel } from "./components/ProjectPanel";
import { Section } from "./components/Section";
import { SettingsPanel } from "./components/SettingsPanel";
import { Skills } from "./components/Skills";
import { Summary } from "./components/Summary";
import { loadSettings, saveSettings, type Settings } from "./settings";
import { THEMES } from "./theme";
import type { Corpus, GithubInfo, Health, ModelCatalog, Paper, Project } from "./types";

const WorkGraph = lazy(() => import("./scene/WorkGraph").then((m) => ({ default: m.WorkGraph })));

export default function App() {
  const [corpus, setCorpus] = useState<Corpus | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [health, setHealth] = useState<Health | null>(null);
  const [github, setGithub] = useState<GithubInfo | null>(null);
  const [papers, setPapers] = useState<{ available: boolean; papers: Paper[] }>({ available: false, papers: [] });
  const [models, setModels] = useState<ModelCatalog | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [askOpen, setAskOpen] = useState(true);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(() => loadSettings());

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

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
    if (id === "about") {
      setAboutOpen(true);
      setSelectedId("about");
      return;
    }
    setSelectedId(id || null);
    if (!id) setAboutOpen(false);
  }, []);

  const onIntents = useCallback((intents: { about: boolean; projectIds: string[]; paperIds?: string[] }) => {
    if (intents.about) {
      setAboutOpen(true);
      setSelectedId("about");
    }
    if (intents.paperIds?.length) {
      setSelectedId("grok-tensor");
    }
    if (intents.projectIds[0]) {
      setSelectedId(intents.projectIds[0]);
      if (intents.projectIds[0] !== "about") setAboutOpen(false);
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

  return (
    <>
      <a className="skip" href="#summary">
        Skip to resume
      </a>
      <Header
        name={profile.name}
        onAsk={() => setAskOpen(true)}
        onAbout={() => {
          setAboutOpen(true);
          setSelectedId("about");
        }}
        onSettings={() => setSettingsOpen(true)}
        health={health}
      />
      <div className="hero">
        <Suspense fallback={<div className="scene-fallback">Loading work graph...</div>}>
          <WorkGraph
            projects={projects}
            selectedId={selectedId}
            onSelect={onSelect}
            sceneBg={sceneBg}
            reducedMotion={settings.reducedMotion}
          />
        </Suspense>
        <HeroCopy
          kicker="Software & machine-learning engineer | St. Louis"
          title={profile.name}
          subtitle="Builds production systems people depend on daily. Natural language in, 3D geometry out, with locally hosted LLM inference and deterministic validation."
          metrics={[
            "Natural language -> 3D model generation",
            "Local, offline LLM inference - nothing rented",
            "Shipped Digital Twin Pro solo, start to store",
            "8-12 hours to ~30 seconds per cycle",
          ]}
        />
      </div>
      <main className="shell">
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
      <Footer />
      <ProjectPanel project={selected && selected.id !== "about" ? selected : null} onClose={() => setSelectedId(null)} />
      <AboutPanel about={corpus.aboutMe || null} open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <ChatDock
        open={askOpen}
        onClose={() => setAskOpen(false)}
        health={health}
        settings={settings}
        projects={projects}
        papers={papers.papers}
        about={corpus.aboutMe || null}
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
