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
 *
 * VOICE: these have to sound like the model that answers everything else, or the first
 * follow-up question makes the opener look scripted. That means the same guide speaking
 * about Peter in the third person, three to five plain sentences, no epigrams and no
 * marketing cadence. The model's register is set in ollama.ts SYSTEM_RULES; if that
 * changes, these change with it.
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
      "No, that one is his own. Digital Twin Pro is a personal project he built on his own time under Free Parameter LLC, not DMA work: he designed it, funded it, wrote it, and shipped it to a Google Play beta himself, including the Flutter 3D renderer. His DMA work is separate, and that is where the language-to-geometry pipeline and the plan-parsing automation live.",
  },
  {
    id: "digital-twin-pro",
    test: /digital\s*twin|\bdtp\b/i,
    answer:
      "Digital Twin Pro is Peter's personal product, built on his own time under Free Parameter LLC rather than at an employer. It is a Flutter 3D inventory application that reached a Google Play beta, and he wrote the 3D renderer by hand instead of pulling in a game engine: SceneRenderer and Projection3D with a Z-sorted painter's-algorithm draw queue. He owns the whole thing end to end, from the SQLite inventory model to the release process. Ask about the renderer or the data model if you want the specifics.",
  },
  {
    id: "language-to-geometry",
    test: /language.to.geometry|language to geometry|nl.?to.?cad|natural language.*(cad|geometry|3d|model)|(cad|geometry|3d model).*natural language/i,
    answer:
      "Language-to-geometry means you describe what you want in ordinary words and the system produces real 3D geometry from it. Peter built it as a natural-language interface that generates 3D models and sets up engineering deliverables: a locally hosted LLM interprets the request, and deterministic code owns the actual construction and validation, so the output can be checked instead of trusted. The model is only used for understanding intent, never for silently deciding something that has to be correct. He introduced that capability at an established St. Louis engineering firm over roughly a two-year engagement. It is separate from the parsing work, which reads drawings that already exist.",
  },
  {
    // Routed to the model this took ~3.1s and drifted into first person; the facts are fixed,
    // so it is scripted like the other high-traffic technical follow-ups.
    id: "geometry-validation",
    test: /validat|verif|correct(ness)?|how do you know.*(right|correct)|check.*(geometry|output|model)|(geometry|output).*check/i,
    answer:
      "He keeps the model out of the part that has to be correct. The LLM interprets the request, and deterministic C#/.NET code against the CAD API owns geometry construction, parameter defaulting, and validation, so the output is checked by code rather than trusted because a model produced it. Validation runs before anything is committed to the drawing. On the stormwater runoff calculator he went further and added consistency assertions that fail loudly on transcription errors instead of quietly producing a plausible number. The same instinct shows up in his quality-engineering background: validating dimensional tolerances against CAD models so problems surface as geometry mismatches rather than downstream scrap.",
  },
  {
    id: "ml-experience",
    test: /\b(ml|machine.learning|\bai\b|llm|inference|model)\b.*(experience|background|work|do you|have you)|what.*(ml|machine.learning|ai).*(experience|background)|tell me about your (ml|ai|machine.learning)/i,
    answer:
      "His strongest machine-learning work is the language-to-geometry pipeline: a natural-language interface that generates 3D models and sets up engineering deliverables, with locally hosted LLM inference handling intent while deterministic code owns construction and validation. Around that he builds retrieval, OCR, and structured-data pipelines over messy real-world input. Since 2023 that has meant local LLMs and Tesseract on real engineering data, all on hardware he owns rather than a rented API, this site included: chat runs on local Ollama and speech on whisper.cpp. It is applied work rather than research.",
  },
  {
    id: "origin-story",
    test: /(got|get) (you|him) into (programming|coding|software)|how did (you|he) (start|get started|begin)|why (did you|do you) (start|program|code)|start(ed)? programming/i,
    answer:
      "Adventure games first, then the APIs underneath them. Peter started as a kid writing scripts in Adventure Game Studio to build point-and-click adventure games, using AGS's own C-style scripting language, and making a world behave by typing at it is the part that stuck. Real C++ came next in Visual Studio, then CAD APIs in C#, Python, and LISP, where he built tools that generate models from natural-language input and parse existing plan sets to auto-check them, cutting a repetitive drafting cycle from 8-12 hours to about 30 seconds. Since 2023 it has been local LLMs on his own hardware, plus Digital Twin Pro on his own time.",
  },
  {
    id: "teamwork",
    test: /\bteam\b|collaborat|work with (people|others)|coworker|colleague|manage (people|staff)|leadership/i,
    answer:
      "Yes. The automation and generation tooling he writes is used daily by other professionals rather than parked in a personal folder, which is the test he cares about. He works inside multi-disciplinary teams across civil, mechanical, plumbing, and architectural scopes on named capital projects, coordinating so one discipline's change does not quietly break another's. He also builds for review rather than around it: his quality pass cut drafting errors roughly 25% before licensed-engineer review. He has managed people as an Assistant Department Manager, supervising department staff and handling contractor-facing sales, and he has worked under ISO 9001 quality-system and production part approval requirements.",
  },
  {
    id: "resume",
    test: /resume|\bcv\b|download.*(pdf|resume)|(pdf|printable).*(resume|cv)/i,
    answer:
      `Yes, here it is: ${RESUME_PDF}. It is a one-to-two page PDF with real selectable text rather than an image, so applicant tracking systems can read it, and there is a plain-text version at /PeterLilley_Resume.txt if a job portal wants something pasteable. You will also find a "Download my resume (PDF)" link just below this chat box, and a print view at /resume.`,
  },
  {
    id: "paper",
    test: /zenodo|\bpaper\b|\bdoi\b|publication|\bpreprint\b|gravity/i,
    answer:
      "Peter deposited a speculative physics paper on Zenodo himself, under Free Parameter LLC. He asks that it be framed honestly: it is a self-deposited preprint, not refereed by anyone, it is speculative, and it was written with LLM assistance, so it may well contain errors. He treats it as personal curiosity rather than a professional credential, and he would rather be judged on the engineering work.",
  },
  {
    id: "identity",
    test: /who is peter|who are you|tell me about (yourself|peter|him)|introduce (yourself|peter)|what do you do/i,
    answer:
      "Peter Lilley is a software engineer in St. Louis who ships production systems other professionals depend on daily. His strongest work is language-to-geometry: a natural-language interface he built that generates 3D models and sets up engineering deliverables, with locally hosted LLM inference handling intent and deterministic code owning construction and validation. He introduced that capability at an established St. Louis engineering firm over roughly a two-year engagement, and around it he builds retrieval, OCR, and structured-data pipelines over messy real-world input in C#, Python, C++17, TypeScript, and Dart. On his own time he designed, funded, built, and shipped Digital Twin Pro, a Flutter 3D inventory application with a hand-written renderer, to a Google Play beta. The domain happens to be civil engineering and CAD, but the engineering is what transfers.",
  },
];

/**
 * Questions the notes genuinely cannot answer: interview anecdotes, career aspirations,
 * favourites, a years-of-experience number. An 8B model asked these will happily invent a
 * war story: it produced a detailed, entirely fictional account of a CMM accuracy problem at
 * Component Bar Products. A fabricated anecdote is exactly what would embarrass him if a
 * reviewer repeated it back to him, so these deflect honestly and point at real work instead.
 *
 * Checked after the content rules above, so a real question about a project still wins.
 */
const DEFLECTIONS: Rule[] = [
  {
    id: "no-anecdotes",
    test: /tell me about a time|describe a (time|situation|project that)|give me an example of a time|biggest (failure|mistake|regret|weakness)|what.*(your|his) (weakness|biggest failure)|went (badly|wrong)|conflict with a (coworker|colleague|manager|boss)|how do (you|they) handle (pressure|conflict|criticism|stress)/i,
    answer:
      "His interview stories are not in the notes I work from, and I would rather not invent one. What is documented is the work itself: the language-to-geometry pipeline at DMA, the plan-parsing tooling that cut a drafting cycle from 8-12 hours to about 30 seconds, the quality pass that cut drafting errors roughly 25% before licensed-engineer review, and Digital Twin Pro on his own time. Ask him that question directly and you will get a better answer than I can give.",
  },
  {
    id: "no-aspirations",
    test: /want to work on next|where do you see (yourself|himself)|career (goal|goals|plan|plans|path)|what are you looking for|next role|dream job|five years|long.term goals?/i,
    answer:
      "What he is aiming at next is his to say, not mine - these notes cover what he has built rather than where he wants to go. What they show is the shape of the work he keeps choosing: locally hosted inference on hardware he owns, natural language in and validated 3D geometry out, and tools other professionals use daily. He is the right person to ask about the rest.",
  },
  {
    id: "no-favorites",
    test: /favorite|favourite|prefer (python|c#|c\+\+|typescript|rust|java)|which language do you (like|prefer)|best (language|framework|editor|ide)/i,
    answer:
      "The notes do not record his favorites, so I will not make one up. What they do record is what he actually ships in: C#, Python, C++17, TypeScript, and Dart, plus LISP where CAD APIs require it. Dart and Flutter for Digital Twin Pro, C#/.NET and C++ for the CAD automation and the language-to-geometry work.",
  },
  {
    id: "no-timeline",
    test: /how many years|years of (experience|coding|programming)|how long have (you|he) been|how old|what year did (you|he)|when did you start (programming|coding)/i,
    answer:
      "He does not publish an age or a years-of-experience number, and I do not have one to give. He started programming as a kid in Adventure Game Studio, moved to C++ in Visual Studio, then into CAD APIs, and since 2023 into local LLM work. The record of what he has actually shipped is a better measure than a count of years.",
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
        "I can't do that. This assistant only answers questions about Peter's work from a fixed set of notes: no file access, no shell, and no way to run anything on this machine, so there is nothing to list or execute in the first place. Happy to talk about his projects, his machine-learning work, or his resume instead.",
    };
  }

  if (CONTACT_RE.test(q)) {
    return {
      id: "refuse-contact",
      answer:
        "I don't share Peter's phone number, home address, or other personal contact details, and they aren't in the notes I work from. Reach him through the contact route on his resume, or through his GitHub profile at github.com/freeParameterized, and he'll follow up directly.",
    };
  }

  for (const rule of [...RULES, ...DEFLECTIONS]) {
    if (rule.test.test(q)) return { id: rule.id, answer: rule.answer };
  }
  return null;
}
