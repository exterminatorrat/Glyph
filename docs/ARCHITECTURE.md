# Glyph architecture

Status: approved Milestone 0 architecture, 2026-08-30

## Architectural outcome

Glyph is designed as a responsive Next.js modular monolith running on a Node.js server runtime. The browser, server routes, research-facing domain modules, document code, and eventual Supabase/Postgres adapter live in one repository and one deployable application.

Implementation is research-first rather than UI-first. The DOCX carrier is tested before the fingerprint engine, persistence, or product workflows are built.

No application source exists in Milestone 0. This document defines intended seams without authorizing implementation.

## System shape

The eventual product request flow is:

```text
Teacher browser
  -> Next.js server entry point
  -> assignment use-case module
  -> fingerprint engine and document module
  -> server-only assignment store
  -> Supabase/Postgres
```

The eventual research flow is:

```text
Versioned experiment fixture
  -> evaluation command
  -> the same fingerprint engine used by the product
  -> per-sample result and aggregate report
```

The evaluation system must not contain a second detector.

## Design principles

- Prefer deep modules with small interfaces.
- Keep routes and UI thin; domain behavior belongs behind module interfaces.
- Introduce a seam only when behavior actually varies or a production and test adapter both earn it.
- Keep one implementation while one strategy exists.
- Keep browser contracts smaller than server-side records.
- Treat persisted JSON as untrusted input and parse it strictly.
- Keep document-carrier behavior independent from marker generation and matching.
- Preserve locality: fingerprint changes stay in the fingerprint module, document changes stay in the document module, and database changes stay in the assignment-store adapter.

## Fingerprint engine

The external interface is conceptually limited to:

- `generate(...)`
- `analyze(...)`

`generate` accepts assignment context and returns a protection bundle containing versioned fingerprint data plus the embedding material needed by the document module. `analyze` accepts a parsed fingerprint and transient response text and returns a structured marker-detection result.

The engine hides:

- marker generation
- normalization
- exact matching
- classification
- fingerprint serialization validation
- strategy/version dispatch

Only `exact-canary` exists initially. Internal dispatch should be an explicit check or switch over supported strategy/version combinations. A general plugin system, runtime registration, dependency-injection container, or hierarchy of unused strategy classes would be a shallow abstraction and is prohibited by the MVP specification.

When a second implemented strategy creates real variation, the interface and dispatch design must be reviewed before richer infrastructure is introduced.

## Independent version axes

The following identifiers describe different facts and must never be collapsed into one version:

| Axis | Example | Meaning |
|---|---|---|
| Fingerprint schema | `schemaVersion: 1` | Shape and parser for serialized fingerprint data |
| Fingerprint strategy | `exact-canary` | Detection behavior |
| Fingerprint strategy version | `0.1.x` | A defined revision of exact-canary generation and analysis behavior |
| Matching or marker profile | Named during Milestone 3 | Exact marker syntax and normalization contract |
| Document profile | `docx-hidden-run-v1` | How marker content is placed in a document |
| Experiment schema | Versioned in research fixtures | Shape and interpretation of research metadata |

A carrier can change without changing matching behavior. A matching strategy can change without changing the carrier. Every research fixture records both axes.

## Document module

The document module eventually exposes one primary operation: generate a protected DOCX from visible assignment content, a fingerprint embedding plan, and a document profile.

It owns:

- plain-text-to-DOCX rendering
- hidden-run placement
- WordprocessingML packaging
- macro-free and relationship-safe output
- document-profile version behavior
- structural document errors

It does not own marker generation, matching, assignment persistence, research classification, or UI presentation.

`docx-hidden-run-v1` uses `w:vanish`. The profile is inspectable, removable, non-cryptographic, and experimental. The carrier spike uses fixed research markers and does not require the fingerprint engine.

Future DOCX response extraction, if authorized, is a separate operation added only in its milestone. It accepts bounded in-memory bytes, validates the OOXML package, extracts text without executing embedded behavior, and discards bytes and text after analysis.

## Assignment use cases

Use-case modules coordinate domain work without duplicating it.

### Protect assignment

1. Validate the optional title and visible prompt.
2. Allocate an assignment UUID.
3. Ask the fingerprint engine for a protection bundle.
4. Ask the document module for DOCX bytes.
5. Structurally validate generation success.
6. Persist the immutable assignment record.
7. Return safe metadata and document bytes.

Document generation precedes persistence so a generation failure does not create an assignment that never had a valid document. Persistence precedes returning bytes so a downloaded document is analyzable later. The local prototype accepts that a network interruption after persistence can leave an assignment whose download was not received; it does not store prompts or documents merely to solve that retry case.

### Analyze submission

1. Validate assignment ID and response.
2. Retrieve the server-only assignment record.
3. Strictly parse and cross-check fingerprint metadata.
4. Call the fingerprint engine with transient response text.
5. Map the domain result to a safe public contract.
6. Return the result with no-store caching behavior.
7. Discard response text.

The Analyze use case does not write persistence.

## Browser, server, and data responsibilities

### Browser

- Render the two workflows and careful evidence language.
- Provide convenience validation without treating it as authoritative.
- Submit text and assignment selections.
- Receive protected DOCX bytes and safe public data.
- Display conceptual signal IDs, never raw marker values.

Browser code must not import the fingerprint engine, document implementation, assignment-store adapter, environment credentials, or server-only fingerprint types.

The downloaded DOCX necessarily contains inspectable marker material. Avoiding a separate JSON/UI exposure is still required, but the artifact itself is not a cryptographic secret.

### Server

- Perform authoritative validation and bounded-input enforcement.
- Generate assignment IDs and fingerprints.
- Generate DOCX bytes.
- Access persistence.
- Analyze transient responses.
- Sanitize public data and errors.
- Emit content-free operational logs.

### Database

- Persist minimal immutable assignment metadata.
- Enforce basic types and constraints.
- Deny unauthorized access.
- Enforce teacher ownership before a pilot.

The database does not generate markers, classify evidence, manipulate documents, or store submitted responses.

## Assignment store

Persistence begins only in Milestone 4. The store interface is limited to operations required by workflows:

- create an immutable assignment
- retrieve one assignment by ID
- list safe assignment summaries

A production Supabase/Postgres adapter and an in-memory test adapter create a real seam. No generic repository framework is needed.

The conceptual record contains:

| Field | Reason |
|---|---|
| UUID ID | Stable assignment identity allocated before document generation |
| Optional title | Enables selection without retaining the prompt |
| Fingerprint schema version | Selects the strict parser |
| Fingerprint strategy and strategy version | Preserves analyzer compatibility and research provenance |
| Server-only fingerprint payload | Stores exact strategy data without browser exposure |
| Document profile | Records the carrier independently |
| Creation timestamp | Supports ordering and provenance |

No original prompt, prompt hash, DOCX bytes, response, filename, student identity, or analysis history belongs in the MVP record.

## Supabase access model

Supabase must not be configured during the carrier spike.

For the local prototype, server-only privileged access is acceptable. Implementation must use the currently recommended Supabase server-side secret mechanism at that time rather than freezing legacy key terminology here. The invariant is that privileged database credentials never enter browser code.

Before a teacher pilot:

- assignments have non-null teacher ownership
- ordinary operations run with authenticated user context
- row-level security enforces ownership
- allow and deny behavior is tested for each operation
- unrestricted privileged access is reserved for narrowly justified administrative operations

Official Supabase documentation must be re-checked in the persistence and pilot milestones because key and client recommendations evolve.

## Public contracts

Public assignment summaries contain only assignment ID, optional display title, creation timestamp, and safe version labels required by the UI.

Public analysis results contain assignment ID, fingerprint version labels, total signal count, detected and missing conceptual signal IDs, deterministic classification, and a safe explanation. They never contain fingerprint payloads, marker strings, directives, response echoes, or student identity.

Expected errors use stable codes and safe messages. Unexpected exceptions are caught at the server entry point and mapped to a generic internal error with a request ID.

## Intended repository shape

Directories and files are created only when their milestone implements them. The intended shape is:

```text
AGENTS.md
docs/
src/
  app/
  core/
    fingerprints/
    assignments/
  documents/
    docx/
  server/
    assignments/
    database/
    logging/
  contracts/
tests/
  unit/
  integration/
  documents/
  privacy/
  fixtures/
research/
  experiments/
scripts/
supabase/
  migrations/
  tests/
```

This is an ownership map, not authorization to create empty folders or stub modules.

## Deployment shape

The INTERNAL RESEARCH PROTOTYPE runs locally and is unauthenticated. It must not be exposed through Vercel, a tunnel, a shared host, or another public endpoint.

The PILOT-READY PRODUCT may use Vercel and managed Supabase only after the gates in `SECURITY.md` pass. There is no separate API server, worker, queue, object store, or external AI service in the MVP architecture.
