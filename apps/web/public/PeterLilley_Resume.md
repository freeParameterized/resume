# Peter A. Lilley

**Automation Tooling Engineer (Staff Technician) — C#/.NET, C++17, CAD / Geometry**

Chesterfield / St. Louis, MO · pal@cadpal.net · Phone: Available on request · github.com/freeParameterized · Free Parameter LLC

## Summary

Software engineer with a background in CAD and engineering. Builds web and mobile applications with React, Flutter, Postgres, and Firebase. Automates traditional processes with C#, C++17, and Python to simplify Civil 3D, AutoCAD, and Revit workflows. Adopted LLMs (Claude, ChatGPT, Gemini), and also writes code from scratch.

## Skills

- **Languages:** C#, C#/.NET, Python, C++17, Dart, TypeScript, JavaScript, SQL, LISP, VBA
- **Software engineering:** Object-Oriented Design (OOD), REST APIs, multi-threading, CI/CD pipelines, Git (GitFlow, trunk-based, pull requests), CMake, Linux, macOS, Docker, Bash
- **Databases and Data Systems:** SQLite, Firebase, Postgres, XData schemas, data modeling, JSON structuring, graph calculators, Tesseract OCR, Levenshtein matching
- **CAD, geometry, and domain:** AutoCAD, Civil 3D, Revit, Navisworks, Dynamo, matrix math, 3D graphics, CAD plugins, typed metadata, GD&T, CMM, ISO 9001, TCP/IP, Cisco routing

## Experience

### Automation Tooling Engineer (Staff Technician) — David Mason & Associates
*St. Louis, MO · Jul 2024 - Aug 2026*

- Quality pass cut an estimated 25% of drafting errors before licensed-engineer review.
- Built a generator for standard details and grading from existing company drawing data. Applied it to the existing utilities model for an airport project, covering hundreds of thousands of surveyed entities. Hand modeling that took days fell to minutes.
- Wrote Dynamo automation that reads Excel reports Civil 3D already generates and draws pipe flow levels and hydraulic grade lines. Other engineers verified the drop from about 8 hours of clicking to minutes.
- Built a Civil 3D GUI for less experienced CAD users: color-coded IntelliSense-style layer and entity search with autocomplete, dynamic entity pull, and a local phrase-to-command lookup. From one command it moves entities, runs basic draw commands, retargets objects onto other layers, and otherwise edits uniformly across every layout instead of clicking through them in sequence. Minutes of that work, often hundreds of clicks, became one command that finishes in about two seconds. Found repeating bottlenecks in the firm's CAD workflow and wrote programs to remove them.
- Built C# plugins against the Civil 3D .NET API to automate layout, audit drawings, and batch-rename title blocks. Attached typed metadata to Civil 3D objects so company standards sit on the entities.
- Built OCR ingestion software that parses existing PDF plan sets, checks values, and populates drawings.
- Built the firm's internal Civil 3D automation pipeline on the OpenAI API. It serves a user chat, scheduled batch jobs, and existing company drawing data as input for each request.
- Extended that pipeline to locate outdated sheet text and to compare design options. Authored and reviewed Git pull requests on the plugins and pipeline. Used GitFlow and trunk-based branching, resolved merge conflicts, and shipped through CI/CD.
- Colleagues use the automation and generation tooling daily. Coordinates across civil, mechanical, plumbing, and architectural disciplines on named capital projects so one discipline's change does not break another's.

### Quality Engineer - Manufacturing / Precision Machining — Component Bar Products
*O'Fallon, MO · Apr 2023 - Jun 2024*

- Programmed and operated coordinate measuring machines. Verified precision-machined parts against GD&T specifications.
- Validated dimensional tolerances against CAD models and prints to catch geometry mismatches.
- Worked to ISO 9001 quality-system and Production Part Approval Process requirements. Enforced ISO 9001 across production lines. Managed calibration and traceability of metrology assets.

### Assistant Department Manager - Building Materials and Millwork — Menard, Inc.
*Manchester / Ballwin, MO · Jun 2020 - Mar 2023*

- Priced and estimated large commercial material orders.
- Supervised and coordinated department staff as an Assistant Department Manager. Handled contractor-facing sales. Turned contractor requests into material lists on a deadline.

### Revit/CAD Technician - Mechanical/Plumbing — Heideman & Associates, Inc.
*Fenton, MO · May 2018 - Apr 2019*

- Drafted mechanical and plumbing construction documents in Revit and AutoCAD. Projects included St. Luke's Hospital, Mercy, AT&T, Saint Louis University, and American Water.
- Produced as-built drawings from field photos and blueprints. Built automated data libraries. Standardized hundreds of outdated AutoCAD details.
- Coordinated with structural and architectural disciplines. Clash detection. Kept multi-discipline file structure and Revit templates consistent.

### CAD Drafter — Jeff Day & Associates, LLC
*Manchester, MO · 2020*

- Drafted architectural construction documents in AutoCAD for residential and commercial work.
- Kept layers managed in the office template. Modified and organized the detail library. Audited drawings against office CAD standards before issue.

## Projects

### Digital Twin Pro
*Personal product, Free Parameter LLC | Flutter/Dart 3, SQLite, Firebase, Google Gemini API, ARCore | github.com/freeParameterized/digital-twin-pro*

- Concept to Google Play beta in five weekends: a 3D inventory app with a custom renderer (Z-sorted draw queue, own projection) instead of a game engine.
- Tote contents update by voice, photo, or typing from several screens. Gemini parses speech into items; the camera runs photo recognition. All of it lands on one typed item-to-quantity map shared with SQLite and exports.
- AI Organizer recommends moves that group like with like, previews them on the rack, then commits. A move log records each tote's from, to, and action.
- Export one tote's QR with toggleable payload fields, or the whole set as PNG, JPEG, or a multi-page PDF book for labels on the physical bins.
- Save a warehouse as a project, export it, and import it again (config, SQLite, photos stored locally, CSV/JSON). Drag-and-drop on the rack, including swap onto an occupied slot.
- Per-tote colors or one uniform style. Independent front and isometric frames. Three rack styles, seven UI themes, grid customization, and slot labels that relabel every location.

### CAD integration bridge
*C++17, Dear ImGui, Windows COM | private repository, walkthrough on request*

- Built a C++17 Dear ImGui host. It bridges BricsCAD, AutoCAD, and Civil 3D through Windows COM. It discovers installed SDKs at runtime and hot-loads LISP, C#, and BRX plugins.
- Personal prototype of the architecture later used on a commercial deployment.

### Interactive Portfolio (this site)
*React, TypeScript, Express*

- Built a React and TypeScript front end over an Express API. The site builds to static files and needs no server to read.
- Generates the printable resume and PDF from the same JSON data.

## Education

### A.A.S. in Building Systems Engineering Technology — Ranken Technical College
*Wentzville, MO · 2019*

Additional coursework and credits: Calculus II (SLU / CLEP), Technical Spanish and Applications (Missouri S&T).
