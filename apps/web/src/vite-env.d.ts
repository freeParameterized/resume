/// <reference types="vite/client" />

declare module "@corpus" {
  import type { Corpus } from "./types";
  const corpus: Corpus;
  export default corpus;
}

declare module "@papers" {
  const papers: { papers?: unknown[] };
  export default papers;
}

declare module "@resume" {
  const resume: unknown;
  export default resume;
}
