/**
 * Pre-composed answers for the handful of questions a reviewer almost always asks first.
 *
 * Two reasons these exist rather than leaving everything to the model:
 *  - Speed. These return in single-digit milliseconds, so the first exchange never waits
 *    on model load or prefill.
 *  - Fidelity. The sensitive answers (Digital Twin Pro is personal, the Zenodo deposit is
 *    not refereed, no contact details, no executing instructions) are stated exactly the
 *    same way every time instead of being re-improvised per request.
 *
 * Wording is drawn from data/corpus.json. Plain ASCII punctuation only: this text also
 * travels through the PDF and terminal paths, which have already been bitten by smart dashes.
 */

export type QuickAnswer = {
  id: string;
  answer: string;
};

type Rule = {
  id: string;
  /** Checked in order, so put the narrower questions first. */
  test: RegExp;
  answer: string;
};

const RESUME_PDF = "/PeterLilley_Resume.pdf";

const RULES: Rule[] = [
  {
    // Must beat the general Digital Twin Pro rule below.
    id: "dtp-attribution",
    test: /digital\s*twin.*(at work|for work|at dma|through dma|your job|on the job|company (project|work)|work project)|(\bdid|\bwas)\s+(you|it).*(dma|at work).*digital\s*twin/i,
    answer:
      "No. Digital Twin Pro is Peter's own personal project, not DMA work. He designed it, paid for it, built it, and shipped it himself on his own time under Free Parameter LLC, his own entity. It is a Flutter 3D inventory application released to a Google Play beta, with a renderer he wrote by hand. His DMA work is separate: the language-to-geometry generation pipeline and the plan-parsing and automation tooling used inside that firm.",
  },
  {
    id: "digital-twin-pro",
    test: /digital\s*twin|\bdtp\b/i,
    answer:
      "Digital Twin Pro is Peter's personal product, built on his own time under Free Parameter LLC, not employer work. It is a Flutter 3D inventory application shipped to a Google Play beta, and he wrote the 3D renderer by hand rather than pulling in an engine. He designed, funded, built, and maintains the whole thing end to end, which means the data model, the rendering, the app, and the release process. Ask about the renderer or the data model if you want the specifics.",
  },
  {
    id: "language-to-geometry",
    test: /language.to.geometry|language to geometry|nl.?to.?cad|natural language.*(cad|geometry|3d|model)|(cad|geometry|3d model).*natural language/i,
    answer:
      "Language-to-geometry means you describe what you want in ordinary words and the system generates real 3D geometry from it. Peter built that as a natural-language interface that generates 3D models and sets up engineering deliverables: a locally hosted LLM interprets the intent, and deterministic code owns the actual construction and validation, so the geometry is checkable rather than whatever the model felt like emitting. That split matters. The model is used for understanding the request, never for silently deciding output that has to be correct. He introduced this capability at an established St. Louis engineering firm over roughly a two-year engagement, and it is distinct from parsing, which reads drawings that already exist.",
  },
  {
    id: "ml-experience",
    test: /\b(ml|machine.learning|\bai\b|llm|inference|model)\b.*(experience|background|work|do you|have you)|what.*(ml|machine.learning|ai).*(experience|background)|tell me about your (ml|ai|machine.learning)/i,
    answer:
      "His strongest machine-learning work is a language-to-geometry pipeline: a natural-language interface that generates 3D models and sets up engineering deliverables, with locally hosted LLM inference handling intent while deterministic code owns construction and validation. Around that he builds retrieval, OCR, and structured-data pipelines over messy real-world input. Everything runs on his own hardware rather than a rented API, including this site, which uses local Ollama inference for chat and whisper.cpp for speech. Since 2023 that has meant local LLMs and Tesseract on real engineering data, and the applied engineering is the point rather than research novelty.",
  },
  {
    id: "origin-story",
    test: /(got|get) (you|him) into (programming|coding|software)|how did (you|he) (start|get started|begin)|why (did you|do you) (start|program|code)|start(ed)? programming/i,
    answer:
      "Adventure games first, then the APIs underneath everything. Peter started as a kid writing scripts in Adventure Game Studio to build point-and-click adventure games. AGS has its own C-style scripting language, and making a world behave by typing at it is the part that stuck. Real C++ came next in Visual Studio: memory, pointers, polymorphism, OOP. That instinct moved into CAD APIs with C#, Python, and LISP, where he built bridges that generate models from natural-language input and tooling that parses existing plan sets to auto-check them, cutting repetitive drafting from 8-12 hours to about 30 seconds a cycle. Since 2023 it has meant local LLMs on his own hardware, and on his own time, Digital Twin Pro.",
  },
  {
    id: "teamwork",
    test: /\bteam\b|collaborat|work with (people|others)|coworker|colleague|manage (people|staff)|leadership/i,
    answer:
      "Yes, and there is evidence rather than an adjective. He ships tools colleagues actually adopt: the automation and generation tooling is used daily by other professionals, not parked in a personal folder. He works inside multi-disciplinary teams across civil, mechanical, plumbing, and architectural work on named capital projects, coordinating so one discipline's change does not break another's. He builds for review rather than around it; his quality pass cut drafting errors roughly 25% before licensed-engineer review, because the point was to make someone else's review faster. He has managed people as an Assistant Department Manager, supervising department staff and handling contractor-facing sales that meant turning vague requirements into exact deliverables on a deadline. He is also comfortable under formal process, having worked to ISO 9001 quality-system and production part approval requirements.",
  },
  {
    id: "resume",
    test: /resume|\bcv\b|download.*(pdf|resume)|(pdf|printable).*(resume|cv)/i,
    answer:
      `Yes. You can download it here: ${RESUME_PDF} (a plain-text version is at /PeterLilley_Resume.txt). It is a one-to-two page ATS-friendly PDF with real selectable text, not an image. There is also a "Download my resume (PDF)" link right below this chat box, and a print view at /resume.`,
  },
  {
    id: "paper",
    test: /zenodo|\bpaper\b|\bdoi\b|publication|\bpreprint\b|gravity/i,
    answer:
      "Peter deposited a speculative physics paper on Zenodo himself, authored under Free Parameter LLC. He wants it framed honestly: it is a self-deposited preprint, not refereed by anyone, it is speculative, it was written with LLM assistance, and it may well contain errors. He treats it as personal curiosity rather than a professional credential, so please do not read it as a research claim. The engineering work is what he would rather be judged on.",
  },
  {
    id: "identity",
    test: /who is peter|who are you|tell me about (yourself|peter|him)|introduce (yourself|peter)|what do you do/i,
    answer:
      "Peter Lilley is a software engineer in St. Louis who ships production systems other professionals depend on daily. His strongest work is language-to-geometry: he built a natural-language interface that generates 3D models and sets up engineering deliverables, with locally hosted LLM inference handling intent and deterministic code owning construction and validation. He introduced that capability at an established St. Louis engineering firm over roughly a two-year engagement. Around it he builds retrieval, OCR, and structured-data pipelines over messy real-world input, in C#, Python, C++17, TypeScript, and Dart. On his own time he designed, funded, built, and shipped Digital Twin Pro, a Flutter 3D inventory application with a hand-written renderer, released to a Google Play beta. The domain happens to be civil engineering and CAD; the engineering is the point.",
  },
];

/** Contact details are deliberately absent from the corpus; this keeps the refusal consistent. */
const CONTACT_RE =
  /phone|cell|mobile number|call (him|you)|street|home address|where does he live|where do you live|social security|\bssn\b|birthday|date of birth/i;

/** A visitor asking the assistant to act on the machine gets a plain no. */
const CAPABILITY_RE =
  /ignore (your|all|previous|prior) instructions|disregard (your|the) (instructions|rules)|list (the )?files|run (a )?(command|shell|powershell)|execute|read .*(file|directory|folder)|\bcat\b .*\/|show me your (system )?prompt|reveal your (prompt|instructions)|jailbreak|sudo|rm -rf/i;

export function quickAnswer(question: string): QuickAnswer | null {
  const q = question.trim();
  if (!q) return null;

  if (CAPABILITY_RE.test(q)) {
    return {
      id: "refuse-capability",
      answer:
        "I can't do that. This assistant only answers questions from a fixed set of notes about Peter's work: it has no file access, no shell, and no ability to run anything on this machine, so there is nothing to list or execute even if I wanted to. Happy to talk about his projects, his machine-learning work, or his resume instead.",
    };
  }

  if (CONTACT_RE.test(q)) {
    return {
      id: "refuse-contact",
      answer:
        "I don't share Peter's phone number, home address, or other personal contact details, and they aren't in the notes I work from. Reach him through the contact route on his resume or his GitHub profile at github.com/freeParameterized, and he'll follow up directly.",
    };
  }

  for (const rule of RULES) {
    if (rule.test.test(q)) return { id: rule.id, answer: rule.answer };
  }
  return null;
}
