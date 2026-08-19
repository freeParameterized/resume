# Peter A. Lilley

**Software Engineer - Local LLM Inference, Language-to-Geometry Systems, Production Tooling**

Chesterfield / St. Louis, MO · pal@cadpal.net · Phone: Available on request · github.com/freeParameterized · freeparameter.com · Free Parameter LLC

## Summary

I am a software engineer. I build production systems that other professionals use daily. I built a language-to-geometry pipeline. It uses a plain-language interface to generate 3D models and set up engineering deliverables. I use locally hosted LLM inference to handle intent. I use deterministic C# and .NET code to construct and validate geometry. I also build OCR ingestion and automation tools. These tools cut repetitive drafting from 8 to 12 hours to about 30 seconds per cycle. I work in C#, Python, C++17, TypeScript, and Dart.

## Skills

- **Languages:** C#, Python, C++, Dart, TypeScript, JavaScript, SQL, LISP, VBA
- **AI and local models:** Ollama, LM Studio, Open WebUI, Google APIs, OCR, speech-to-text, prompt engineering, text matching
- **Databases and Data Systems:** SQLite, Firebase, Postgres, XData schemas, data modeling, JSON structuring, graph calculators
- **Engineering and math:** Matrix math, 3D graphics, Express, React, Git, CMake
- **Domain systems and quality:** CAD plugins, Revit automation, 3D metadata, ARCore, part dimensioning, coordinate measuring machines, ISO 9001

## Experience

### Staff Technician (CAD automation / Civil 3D tools) — David Mason & Associates
*St. Louis, MO · Jul 2024 - Present*

- I build CAD generation tools. These turn natural-language input into 3D models and drawing setups using local LLM inference and deterministic C#/.NET. I introduced this capability at the firm.
- I built OCR ingestion software. It parses existing PDF plan sets to auto-check and auto-populate them. This replaced a manual mark-up loop.
- I automate repetitive drafting with Python and Dynamo. This cuts cycles from 8 to 12 hours to about 30 seconds. It reduces errors before licensed-engineer review by about 25%.
- I design typed metadata schemas. These attach to model entities. I coordinate standards automation across civil, mechanical, plumbing, and architectural disciplines.
- I built C# custom commands for Civil 3D to automate layout, rename title blocks, audit drawings, and fix broken data. They execute in under 1.7 seconds, eliminating manual loading delays.
- I used C# to parse messy survey data into Civil 3D XData, building graph lookup tables to map 3D structures to exact flow lines.

### Quality Engineer - Manufacturing / Precision Machining — Component Bar Products
*O'Fallon, MO · Apr 2023 - Jun 2024*

- I programmed and operated coordinate measuring machines. I verified precision-machined parts to +/-0.001 inch or tighter against GD&T specifications.
- I validated dimensional tolerances against CAD models and customer prints. Machining problems showed as geometry mismatches, not downstream scrap.
- I enforced ISO 9001 across production lines. I integrated Production Part Approval Process documentation. I managed calibration and traceability of metrology assets.

### Revit/CAD Technician - Mechanical/Plumbing — Heideman & Associates, Inc.
*Fenton, MO · May 2018 - Apr 2019*

- I produced mechanical and plumbing construction documents. I built as-built models in Revit and AutoCAD.
- I audited standards for cross-discipline consistency.
- I built automated data libraries for building-system objects. I standardized hundreds of outdated details.

## Projects

### Digital Twin Pro
*Personal product, Free Parameter LLC | Flutter/Dart 3, SQLite, Firebase, Google Gemini API, ARCore | github.com/freeParameterized/digital-twin-pro*

- I designed, funded, and shipped a cross-platform 3D inventory application. I released it to a Google Play beta and built a Windows desktop version.
- I wrote the 3D renderer by hand instead of using a game engine. I used a painter's-algorithm scene rendering with a Z-sorted draw queue and custom projection.
- I added photo-based item detection and voice entry via a paid Gemini API.
- I built the database with SQLite to store inventory data locally. I included a move audit log. I added QR booklets and CSV/JSON export.

### CAD integration bridge
*C++17, Dear ImGui, Windows COM | local repository*

- I built a C++17 Dear ImGui host. It COM-bridges BricsCAD, AutoCAD, and Civil 3D.
- It discovers installed SDKs at runtime. It hot-loads LISP, C#, and BRX plugins. It has about 14,000 lines of code.

### Interactive Portfolio (this site)
*React, TypeScript, Three.js, Express, Ollama*

- I built a React Three Fiber portfolio over an Express API.
- It retrieves data from a curated corpus. It answers questions through a local model.
- It uses on-device speech. It degrades to extractive answers when no model runs.

## Education

### Calculus II (CLEP Credit) — Saint Louis University (SLU)
*St. Louis, MO · 2018*

### Calculus II (CLEP Credit) — Saint Louis University (SLU)
*St. Louis, MO · 2018*

Accepted by Ranken Technical College for their calculus curriculum.

### Coursework toward Latin American Studies with Technical Applications — Missouri University of Science and Technology
*Rolla, MO · 2019 - 2020*

Coursework including rigorous, no-calculator College Algebra (determinants, Cramer's rule, introductory linear algebra concepts) and general education. Technical fluency in Spanish.

### A.A.S., Building Systems Engineering Technology — Ranken Technical College
*Wentzville, MO · 2019*
