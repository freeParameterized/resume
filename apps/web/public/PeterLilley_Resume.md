# Peter A. Lilley

**Software Engineer - C#/.NET and C++17 Systems, Geometry and Automation Tooling**

Chesterfield / St. Louis, MO · pal@cadpal.net · Phone: Available on request · github.com/freeParameterized · freeparameter.com · Free Parameter LLC

## Summary

Software engineer. Builds production tooling that engineering teams use daily. Writes C#, C++17, and Python against the Civil 3D, AutoCAD, and Revit APIs. Applies matrix math, coordinate transforms, and graph structures to spatial data. Wrote C++ desktop applications and engine scripting before LLM tools existed. Constrains model output to a typed command schema. Deterministic .NET code then constructs the geometry and validates it before commit. Runs inference in-house, so no client drawing data leaves the office. Automation work cut a repetitive drafting cycle from 8 to 12 hours to about 30 seconds.

## Skills

- **Languages:** C#, Python, C++, Dart, TypeScript, JavaScript, SQL, LISP, VBA
- **AI and local models:** Ollama, LM Studio, Open WebUI, Google APIs, OCR, prompt engineering, text matching, containerizing inference models, cross-platform edge deployments
- **Databases and Data Systems:** SQLite, Firebase, Postgres, XData schemas, data modeling, JSON structuring, graph calculators
- **Engineering and math:** Matrix math, 3D graphics, Express, React, Git, CMake, Linux, macOS, Docker, Bash scripting for data pipelines
- **Domain systems and quality:** CAD plugins, Revit automation, 3D metadata, ARCore, part dimensioning, coordinate measuring machines, ISO 9001
- **Networking:** TCP/IP fundamentals, IPv4/IPv6, subnetting, Cisco routing and switching

## Experience

### Staff Technician (CAD automation / Civil 3D tools) — David Mason & Associates
*St. Louis, MO · Jul 2024 - Present*

- Write C# plugins against the Civil 3D .NET API. The plugins automate layout, audit drawings, and batch-rename title blocks.
- Design typed metadata schemas that attach to model entities. The schemas carry company standards across disciplines.
- Built OCR ingestion software that parses existing PDF plan sets, checks values, and populates drawings.
- Automate repetitive drafting with Python and Dynamo. Cycles dropped from 8 hours to about 30 seconds. Errors before review dropped about 25%.
- Constrain model output to a typed command schema. Deterministic C# code then constructs and validates all geometry, so a bad request fails validation instead of shipping a plausible wrong number.

### Quality Engineer - Manufacturing / Precision Machining — Component Bar Products
*O'Fallon, MO · Apr 2023 - Jun 2024*

- Programmed and operated coordinate measuring machines. Verified precision-machined parts against GD&T specifications.
- Validated dimensional tolerances against CAD models and prints to catch geometry mismatches.
- Enforced ISO 9001 across production lines. Managed calibration and traceability of metrology assets.

### Revit/CAD Technician - Mechanical/Plumbing — Heideman & Associates, Inc.
*Fenton, MO · May 2018 - Apr 2019*

- Produced MEP construction documents. Built as-built models in Revit and AutoCAD.
- Built automated data libraries for building-system objects. Standardized outdated details.

## Projects

### Digital Twin Pro
*Personal product, Free Parameter LLC | Flutter/Dart 3, SQLite, Firebase, Google Gemini API, ARCore | github.com/freeParameterized/digital-twin-pro*

- Designed and shipped a cross-platform 3D inventory application to a Google Play beta.
- Architected a custom 3D renderer with a Z-sorted draw queue and a custom projection instead of a game engine. Used LLM assistance to write most of the code.
- Added photo-based item detection through a paid Gemini API.
- Stored inventory in SQLite with a move audit log, QR booklets, and CSV/JSON export.

### CAD integration bridge
*C++17, Dear ImGui, Windows COM | local repository*

- Built a C++17 Dear ImGui host. It bridges BricsCAD, AutoCAD, and Civil 3D through Windows COM.
- It discovers installed SDKs at runtime and hot-loads LISP, C#, and BRX plugins.
- This personal project proved the architecture before a similar commercial deployment.

### Interactive Portfolio (this site)
*React, TypeScript, Three.js, Express, Ollama, Docker*

- Built a React and TypeScript front end over an Express API.
- A local model answers questions from structured resume data. The site works statically when the model server is offline.
- Containerized the inference stack with Docker for Linux, macOS, and Windows hosts.

## Education

### Calculus II (CLEP Credit) — Saint Louis University (SLU)
*St. Louis, MO · 2018*

Accepted by Ranken Technical College for their calculus curriculum.

### Coursework toward Latin American Studies with Technical Applications — Missouri University of Science and Technology
*Rolla, MO · 2019 - 2020*

Coursework included no-calculator College Algebra. It covered determinants, Cramer's rule, and introductory linear algebra concepts. Technical fluency in Spanish.

### A.A.S., Building Systems Engineering Technology — Ranken Technical College
*Wentzville, MO · 2019*
