# Peter A. Lilley

**Software Engineer - C#/.NET and C++17 Systems, Geometry and Automation Tooling**

Chesterfield / St. Louis, MO · pal@cadpal.net · Phone: Available on request · github.com/freeParameterized · Free Parameter LLC

## Summary

Software engineer with a background in CAD and engineering. Builds web and mobile applications with React, Flutter, Postgres, and Firebase. Automates traditional processes with C#, C++17, and Python to simplify Civil 3D, AutoCAD, and Revit workflows. Adopted LLMs (Claude, ChatGPT, Gemini), and also writes code from scratch.

## Skills

- **Languages:** C#, Python, C++, Dart, TypeScript, JavaScript, SQL, LISP, VBA
- **Databases and Data Systems:** SQLite, Firebase, Postgres, XData schemas, data modeling, JSON structuring, graph calculators, Tesseract OCR, Levenshtein matching
- **Engineering and math:** Matrix math, 3D graphics, Express, React, Git (GitFlow, trunk-based, PRs, CI/CD), CMake, Linux, macOS, Docker, Bash scripting for data pipelines
- **Domain systems, quality, and networking:** CAD plugins, Revit automation, 3D metadata, ARCore, part dimensioning, coordinate measuring machines, ISO 9001, TCP/IP, IPv4/IPv6 subnetting, Cisco routing and switching

## Experience

### Staff Technician (CAD automation / Civil 3D tools) — David Mason & Associates
*St. Louis, MO · Jul 2024 - Aug 2026*

- Built a generator for standard details and grading from existing company drawing data. Applied it to the existing utilities model for an airport project, covering hundreds of thousands of surveyed entities. Hand modeling that took days fell to minutes.
- Wrote Dynamo automation that reads Excel reports Civil 3D already generates and draws pipe flow levels and hydraulic grade lines. Other engineers verified the drop from about 8 hours of clicking to minutes.
- Built a Civil 3D GUI for less experienced CAD users: color-coded IntelliSense-style layer and entity search with autocomplete, dynamic entity pull, and a local phrase-to-command lookup. From one command it moves entities, runs basic draw commands, retargets objects onto other layers, and otherwise edits uniformly across every layout instead of clicking through them in sequence. Minutes of that work, often hundreds of clicks, became one command that finishes in about two seconds. Found repeating bottlenecks in the firm's CAD workflow and wrote programs to remove them.
- Built C# plugins against the Civil 3D .NET API to automate layout, audit drawings, and batch-rename title blocks. Attached typed metadata to Civil 3D objects so company standards sit on the entities.
- Built OCR ingestion software that parses existing PDF plan sets, checks values, and populates drawings.
- Built the firm's internal Civil 3D automation pipeline on the OpenAI API. It serves a user chat, scheduled batch jobs, and existing company drawing data as input for each request.
- Extended that pipeline to locate outdated sheet text and to compare design options. Authored and reviewed Git pull requests on the plugins and pipeline. Used GitFlow and trunk-based branching, resolved merge conflicts, and shipped through CI/CD.

### Quality Engineer - Manufacturing / Precision Machining — Component Bar Products
*O'Fallon, MO · Apr 2023 - Jun 2024*

- Programmed and operated coordinate measuring machines. Verified precision-machined parts against GD&T specifications.
- Validated dimensional tolerances against CAD models and prints to catch geometry mismatches.
- Enforced ISO 9001 across production lines. Managed calibration and traceability of metrology assets.

### Assistant Department Manager - Building Materials and Millwork — Menard, Inc.
*Manchester / Ballwin, MO · Jun 2020 - Mar 2023*

- Priced and estimated large commercial material orders. Supervised department staff.

### Revit/CAD Technician - Mechanical/Plumbing — Heideman & Associates, Inc.
*Fenton, MO · May 2018 - Apr 2019*

- Produced MEP construction documents. Built as-built models in Revit and AutoCAD.
- Built automated data libraries for building-system objects. Standardized outdated details.

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

### Calculus II (CLEP credit) — Saint Louis University (SLU)
*St. Louis, MO · 2018*

Accepted by Ranken Technical College for their calculus curriculum.

### Coursework toward Latin American Studies with Technical Applications — Missouri University of Science and Technology
*Rolla, MO · 2019 - 2020*

Technical fluency in Spanish.

### A.A.S., Building Systems Engineering Technology — Ranken Technical College
*Wentzville, MO · 2019*
