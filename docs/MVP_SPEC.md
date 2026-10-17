# Glyph MVP specification

Status: adopted research direction, 2026-10-17; documentation only. No roadmap implementation is authorized by this change.

## Current authority

Glyph tests assignment-specific canary prompt injection, not whether text was written by AI. Every assignment has two layers with distinct exact canaries: a hidden Unicode tag instruction and a visible, camouflaged note addressed to an AI. Report each layer separately. A match may prompt a conversation and corroboration from drafts, version history, or oral explanation; it cannot prove direct ingestion, authorship, intent, or misconduct. A miss is evidence neither for nor against AI use. Never produce an AI score or probability.

The proposed ranking is hidden-only strongest as a single signal, visible-only moderate, and both together strongest. It is an unvalidated hypothesis pending controls and repeated measurements. Hidden instructions can be inspected and shared; layer results are not presumed independent.

### Manifest and canaries

The planned manifest is `{assignmentId, layers: Layer[]}`. Each layer is `{id, carrier: "tag" | "visibleNote", canary}`. Canaries are distinct across the two layers and matched exactly after the specified normalization; fuzzy, semantic, lemma, and embedding matching are deferred.

Derive canaries statelessly with `HMAC-SHA256(teacherKey, assignmentId + layerId)` to index curated word lists. No accounts or database are part of the MVP. The exact input encoding/domain separation and key lifecycle remain Step 2 decisions; do not fill them in by assumption.

### Carrier requirements

For the hidden layer, encode each ASCII instruction character `c` as `0xE0000 + code(c)`, bracket the sequence with U+E0001 and U+E007F, and reject non-ASCII input. Insert redundant copies at start, middle, and end sentence boundaries, never midword, and skip code blocks and URLs. Decode must ignore legitimate U+1F3F4 black-flag sequences containing tag characters and ending in U+E007F. Step 1 must settle malformed input and the ASCII control-character/delimiter ambiguity before implementation.

For the visible layer, define at least eight AI-addressed sentence templates containing `{canary}`. Insert the note at a sentence boundary in the middle of the assignment, with template and placement reproducibly derived from the key and assignment ID and rotated per assignment. Stripping the injected tags and removing the injected note must restore the original text exactly, including existing Unicode, line endings, and emoji. The exact JavaScript-string/reversibility and template-choice metadata contracts remain open for Step 3; do not invent an incompatible API now.

Detection normalizes case, whitespace, and punctuation, then exact-matches each canary and flags remaining raw tag characters. Tests must define legitimate flag-emoji handling and precise token and normalization boundaries. Do not use fuzzy scoring.

### Privacy and scope

Embedding and checking are client-first; assignment prompts and student submissions never leave the browser and are not uploaded, logged, or persisted. Do not put real student data in Git, fixtures, documentation, or logs, and do not commit keys or secrets. A local research CLI may call model APIs only on synthetic or explicitly consented research inputs, using credentials from environment variables; it is not a teacher-submission backend. Do not use white-text tricks. Any later teacher-facing use requires disclosure in the teacher AI policy and fresh accessibility and international-text testing for these carriers.

## Ordered roadmap (not implementation authorization)

1. **Core types and tag codec:** implement manifest/layer types, tag encode/decode/strip, and flag-emoji tests; resolve the malformed/control-character policy first.
2. **Canary derivation:** implement deterministic HMAC-SHA256 derivation from curated word lists after defining unambiguous, domain-separated input and the `teacherKey` lifecycle.
3. **Visible carrier and reversible embedding:** add at least eight templates, `embed(text, manifest)`, and exact restoration/removal, with the pending string and template-metadata contract resolved first.
4. **Detection:** exact per-layer reports, tag-character detection, and the explicit interpretation caveat; no fuzzy scoring.
5. **Research lab:** JSON model-API matrix and mock dry-run; manual web-UI CSV import is first-class; JSONL output and per-model/per-layer hit-rate tables.
6. **Repeated campaign:** 5–10 samples per cell, including “summarize in 3 sentences” and “rewrite in my own words” variants; measure instruction acknowledgement and noticeability, vary visible placements/templates, and compare ChatGPT and Claude web UI with API behavior.
7. **Minimal teacher web flow and red team:** local embed/verify/copy check, then test cleaners, OCR, retyping, LLM discovery of hidden instructions, and canary-group sharing before a consenting teacher pilot. Consider Docs/LTI integrations only for measured carrier-surviving platforms and account for LMS sanitization.

These steps are proposed in order. This documentation-only adoption stops before Step 1. The earlier Milestone 0 requirements below are retained for provenance only; M0–M2E research records and outcomes are unchanged and do not qualify the new carriers.

<details>
<summary>Archived Milestone 0 specification (superseded)</summary>

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

### Approved carrier successors

Milestone 2C ended with `REVISE_CARRIER` after its separately versioned
semantic-white qualification. Milestone 2D then selected
`join-control-binary-v1` / `docx-zero-width-join-control-v1` with `SELECT_A`.
That decision establishes transport and ordinary-presentation evidence only.

The approved Milestone 2E design,
`docs/superpowers/specs/2026-09-03-milestone-2e-join-control-accessibility-qualification-design.md`,
and frozen protocol,
`research/experiments/docx-join-control-accessibility-qualification-v1/protocol.md`,
qualify the unchanged selected profile across the declared accessibility,
international-text, editing, and print/PDF boundary. Milestone 3 and all
product workflows remain unauthorized until Milestone 2E records
`QUALIFY_PROFILE` and a separate later authorization begins Milestone 3.

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

</details>
