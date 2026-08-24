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
  overview?: string;
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

export type Chunk = {
  id: string;
  title: string;
  tags: string[];
  text: string;
};

export type Corpus = {
  meta: {
    title: string;
    sanitized: boolean;
    githubAccount: string;
  };
  profile: {
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
  howIWork?: { headline: string; points: string[] };
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
  chunks: Chunk[];
};

export type ScoredChunk = {
  chunk: Chunk;
  score: number;
};
