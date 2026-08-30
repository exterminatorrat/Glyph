# Glyph MVP specification

Status: approved and frozen for Milestone 0, 2026-08-30

This document defines the research MVP. A later change to these requirements requires an explicit specification revision. Deliberately staged decisions, such as the generated-marker profile and experiment-specific go/no-go thresholds, are frozen at their named milestones before affected experiments begin.

## 1. Claim and terminology requirements

Glyph's lowest-level output is assignment-specific marker detection.

The approved interpretation ladder is:

1. Observation: a named signal was detected or was not detected.
2. Technical interpretation: an assignment-specific marker associated with the protected assignment is present.
3. Research interpretation: the sample contains marker-exposure evidence.
4. Potential product interpretation: a prompt-reuse signal was detected, but only after experiments support that language.

No interface, log, test description, research result, or document may claim that marker detection proves AI authorship, direct AI ingestion, student intent, cheating, or academic misconduct.

## 2. Environments

### Internal research prototype

The first working environment is local-only, unauthenticated, and not publicly deployed. It may use server-only privileged persistence after the carrier and fingerprint milestones justify it. It must not contain actual student work.

### Pilot-ready product

Pilot readiness requires authenticated teacher ownership, tested authorization and row-level security, abuse controls, privacy and retention review, deletion behavior, accessibility review, operational security, and an independently reviewed protocol for any real student work.

The internal prototype must never be described as pilot-safe.

## 3. Carrier profile

The first carrier profile is `docx-hidden-run-v1`.

It uses standards-based WordprocessingML hidden runs expressed with `w:vanish`. It is inspectable, removable, non-cryptographic, and experimental. It must not be described as secure, tamper-resistant, or guaranteed invisible.

No alternative carrier is part of the MVP carrier spike. White-on-white text, zero-width Unicode, custom XML, off-page positioning, document comments, and metadata carriers are excluded.

Carrier versioning is independent of fingerprint strategy and fingerprint serialization versioning.

## 4. Milestone 2 carrier spike

The carrier spike uses fixed research-only markers that are easy to inspect manually:

- `GLYPH TEST MARKER ALPHA`
- `GLYPH TEST MARKER BETA`

These values must never be used as generated assignment markers or baseline experimental markers.

The spike generates experimental DOCX artifacts containing the fixed markers in `w:vanish` runs and measures carrier survival through relevant document workflows. It does not implement Supabase, assignment persistence, fingerprint generation, Protect, Analyze, or model compliance testing.

The milestone ends in exactly one recorded decision:

- `PROCEED`
- `REVISE CARRIER`
- `ABANDON CURRENT CARRIER`

Only `PROCEED` authorizes Milestone 3 under this specification. A revision requires an approved specification change before further implementation.

## 5. Fingerprint requirements

If the carrier gate passes, Milestone 3 introduces the conceptual `FingerprintEngine` interface:

- `generate(...)` creates versioned fingerprint data and the embedding instructions required by the document module.
- `analyze(...)` deterministically checks a response and returns a structured result.

Persisted fingerprint data includes:

- `schemaVersion`
- `strategy`
- `strategyVersion`
- assignment identity
- matching profile
- ordered signal definitions

Only `exact-canary` exists in the MVP. Dispatch among known strategy/version combinations must remain small and explicit. A generic registry, runtime plugin mechanism, or speculative strategy hierarchy is prohibited while only one real strategy exists.

### Generated-marker profile

Milestone 3 must compare and select a human-readable, extremely improbable generated-marker format. The selected syntax, entropy rationale, normalization behavior, and collision safeguards become a named, versioned profile before the baseline experiment begins.

The carrier-spike markers are not candidates for that profile. Once a baseline experiment begins, changing the marker format requires a new strategy or matching-profile version and a separately identified experiment; it may not be tuned in place in response to results.

### Exact matching

The exact-canary analyzer must define deterministic normalization for Unicode, case, whitespace, and surrounding punctuation. It must not use fuzzy matching, embeddings, semantic similarity, or AI services.

The initial fingerprint contains exactly two distinct required markers. Both markers must be assignment-specific, unique within the fingerprint, absent from the visible prompt, and generated using an appropriate secure random source.

## 6. Protect Assignment requirements

After the preceding gates and persistence milestone pass, the teacher can:

1. Enter an optional assignment title.
2. Paste a non-empty, bounded plain-text assignment prompt.
3. Request protection.
4. Download a generated DOCX.

The system must:

1. Validate input on the server.
2. Allocate a unique assignment ID.
3. Generate versioned fingerprint data.
4. Generate the protected DOCX with `docx-hidden-run-v1`.
5. Persist only the approved assignment metadata after successful document generation.
6. Return the DOCX without persisting the prompt or document bytes.

The system does not distribute, email, publish, or synchronize the assignment.

## 7. Analyze Submission requirements

The Analyze vertical slice begins only after the baseline controlled experiment records a positive continuation decision.

The teacher can:

1. Select a previously protected assignment.
2. Paste a non-empty, bounded response.
3. Request analysis.
4. View detected and missing conceptual signal IDs, classification, explanation, and disclaimer.

The system must:

1. Validate the assignment ID and response on the server.
2. Retrieve and strictly parse the fingerprint.
3. Analyze the response transiently with the same engine used by research evaluation.
4. Return no raw marker values or directives.
5. Discard the response after producing the result.
6. Prevent response content from entering persistence, logs, caches, traces, or error reports.

DOCX response upload, analysis history, and batch processing are excluded from this vertical slice.

## 8. Analysis result

The domain result includes:

- assignment ID
- fingerprint strategy and version
- total signal count
- detected conceptual signal IDs
- missing conceptual signal IDs
- deterministic classification
- structured explanation code and counts

The first classification rule is:

- zero required signals: `NO_SIGNAL`
- some but not all required signals: `WEAK_SIGNAL`
- all required signals: `STRONG_SIGNAL`

These names describe marker presence only. The teacher-facing mapper must follow the terminology ladder and always include a limitation statement.

## 9. Persistence requirements

Persistence begins in Milestone 4 and must not block the carrier spike or fingerprint-engine work.

The minimal assignment record contains:

- UUID assignment ID
- optional title
- fingerprint schema version
- fingerprint strategy
- fingerprint strategy version
- server-only fingerprint payload
- document profile
- creation timestamp

Assignments are immutable in the MVP. Protecting again creates a new assignment and fingerprint.

The system must not persist the original prompt, prompt hash, generated document, analyzed response, uploaded response document, filename, student identity, or analysis history.

## 10. Privacy and research-data requirements

Initial fixtures may contain only synthetic responses, generated AI responses collected specifically for the experiment, and explicitly consented and de-identified human controls.

Actual student submissions are prohibited from Git, automated-test fixtures, research fixtures, logs, documentation examples, and the internal research prototype.

Research artifacts must record both the carrier profile and fingerprint strategy/version. Product data and research fixture data remain separate categories with separate handling rules.

## 11. Error requirements

Expected failures use stable safe codes for invalid input, oversized input, invalid assignment ID, missing assignment, malformed fingerprint, persistence failure, document-generation failure, and later unsupported or malformed uploads.

Malformed persisted fingerprint data is an integrity error, never `NO_SIGNAL`. Browser-facing errors must not include stack traces, database details, credentials, marker values, directives, prompts, or responses.

## 12. Milestone order and gates

1. Milestone 0: approved specification and repository documentation.
2. Milestone 1: minimum project and research foundation.
3. Milestone 2: DOCX carrier spike and hard carrier decision.
4. Milestone 3: exact-canary fingerprint engine and generated-marker profile freeze.
5. Milestone 4: minimal assignment persistence.
6. Milestone 5: Protect vertical slice.
7. Milestone 6: evaluation harness.
8. Milestone 7: baseline controlled experiment and explicit go/no-go decision.
9. Milestone 8: Analyze vertical slice, only after a positive baseline decision.

Later milestones—adversarial evaluation, conditional DOCX response input, authentication and ownership, deployment hardening, pilot usability, and a controlled teacher pilot—are provisional and require separate authorization.

Batch processing remains excluded until pilot demand demonstrates a need.

## 13. Internal prototype acceptance

The internal prototype is complete only when:

- Both hard gates record their decisions and permit continuation.
- Teachers can locally protect a plain-text assignment and download a valid protected DOCX.
- Each assignment has an immutable, versioned fingerprint and independently versioned document profile.
- The analyzer deterministically reports absent, partial, and complete marker presence.
- Marker material is absent from browser-facing data other than the inspectable downloaded document artifact itself.
- Prompts, documents, and responses are not persisted or logged.
- The evaluation harness imports the production analyzer and reports reproducible machine-readable results.
- Deterministic, document, integration, privacy, and research-metric verification passes.
- Product language remains within the level justified by experiment results.

This acceptance does not authorize public deployment or real student data.

## 14. Pilot readiness

Pilot readiness additionally requires authenticated teacher context, assignment ownership, tested row-level security, least-privilege ordinary data access, abuse controls, deletion and retention behavior, secure deployment, accessibility review, incident procedures, legal and school privacy review, and experiment-supported teacher-facing terminology.

Normal teacher requests must not depend on unrestricted privileged database access. The current Supabase server-secret terminology and recommended access pattern must be re-checked against official documentation when persistence and pilot milestones begin.

No dependency version is frozen by this specification. Versions are selected and recorded only when the relevant dependency is installed in an authorized milestone.
