export type SkillGroup = {
  id: string;
  label: string;
  items: string[];
};

export type Experience = {
  id: string;
  org: string;
  location: string;
  title: string;
  dates: string;
  bullets: string[];
  projects?: string[];
  notForDma?: string;
};

export type Education = {
  id: string;
  org: string;
  location: string;
  credential: string;
  dates: string;
  notes?: string[];
};

export type Project = {
  id: string;
  name: string;
  shortName: string;
  status: string;
  featured?: boolean;
  owner?: string;
  visibility: string;
  version?: string | null;
  url: string | null;
  sourcePath?: string;
  remote?: string | null;
  stack: string[];
  honesty: string;
  summary: string;
  bullets: string[];
};

export type AboutMe = {
  source: string;
  headline: string;
  body: string;
};

export type Profile = {
  name: string;
  title: string;
  location: string;
  phone: string;
  email: string;
  company: string;
  website: string;
  github: string;
  identity: string;
  summary: string;
};

export type Corpus = {
  meta: {
    title: string;
    sanitized: boolean;
    privacy: string;
    githubAccount: string;
    githubAccountNote: string;
    ageAndDatesPolicy?: string;
    digitalTwinDisambiguation?: string;
    toneRules?: string;
    paperPolicy?: string;
  };
  profile: Profile;
  howIWork?: { headline: string; points: string[] };
  aboutMe?: AboutMe;
  early: string[];
  skillGroups: SkillGroup[];
  experience: Experience[];
  education: Education[];
  github: {
    owner: string;
    repo: string;
    url: string;
    language: string;
    description: string;
    fallbackStars: number | null;
    fallbackNote: string;
  };
  projects: Project[];
  chunks: { id: string; title: string; tags: string[]; text: string }[];
};

export type Health = {
  ok: boolean;
  service: string;
  uptimeSec: number;
  corpusChunks: number;
  ollama: {
    reachable: boolean;
    host: string;
    model: string;
    defaultPresent: boolean;
    installedCount: number;
  };
  voice?: {
    speaker: string;
    tts: { available: boolean; engine: string; voice: string; note: string };
    stt: { available: boolean; engine: string; binary?: string | null; model?: string | null };
  };
};

export type GithubInfo = {
  source: "github" | "corpus";
  owner: string;
  repo: string;
  htmlUrl: string;
  description: string | null;
  language: string | null;
  stars: number | null;
  forks: number | null;
  updatedAt: string | null;
  topics: string[];
  note?: string;
};

export type Paper = {
  id?: string;
  title?: string;
  titleTranslated?: string;
  url?: string;
  doi?: string;
  conceptDoi?: string;
  summary?: string;
  abstract?: string;
  venue?: string;
  year?: string | number;
  label?: string;
  authorshipVerified?: boolean;
  authorshipNote?: string;
  notPeters?: boolean;
  optional?: boolean;
  authors?: string[];
  note?: string;
  correction?: string;
  honestFraming?: string;
  license?: string;
  resourceType?: string;
  recruiterBlurb?: string;
  resumeBulletWarning?: string;
  recommendedPlacement?: string;
};

export type InstalledModel = {
  name: string;
  sizeGB: number;
  parameterSize: string | null;
  quantization: string | null;
  family: string | null;
  cloud: boolean;
};

export type ModelCatalog = {
  reachable: boolean;
  selected: string | null;
  installed: InstalledModel[];
  chain: { id: string; role: string; why: string; present: boolean }[];
  lmStudioGgufs: string[];
  lmStudioNote: string;
  diskLibraries?: string[];
};

export type Chunk = { id: string; title: string; tags: string[]; text: string };

export type AskCitation = { id: string; title: string; score: number };

export type AskJson = {
  mode: "ollama" | "extractive";
  model: string | null;
  answer: string;
  citations: AskCitation[];
  note?: string;
};
