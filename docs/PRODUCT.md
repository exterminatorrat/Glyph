# Glyph product definition

Status: current direction adopted 2026-10-17; documentation only, not implemented.

Glyph researches assignment-specific canary prompt injection. A teacher adds two distinct canary layers to assignment text: hidden Unicode tag instructions and a visible, camouflaged note addressed to an AI system. The research question is whether a model follows either instruction and includes its exact canary in generated text.

This is not general AI-writing detection, statistical watermarking, or a claim that a marker survives paraphrase. A canary match is only an observation that may warrant a conversation with the student and corroboration from drafts, version history, or an oral explanation. It does not prove direct assignment ingestion, authorship, intent, or misconduct. A miss provides no evidence either way and must never be described as innocence. Do not report an AI score or probability.

The hypothesized ordering is hidden-only as the strongest single signal, visible-only as moderate, and both together as strongest. This ranking is unvalidated and must be tested against controls and repeated measurements; hidden instructions can be inspected or shared, and the two layers are not presumed independent.

The planned teacher workflow is local and browser-first: prepare assignment text with both layers and a manifest, then check a response locally and see separate results for each layer. No product workflow is implemented by this document. Assignment prompts and student responses must not leave the browser or be uploaded, logged, or persisted. The MVP has no accounts or database. The local research lab is a separate tool and may call model APIs only with synthetic or explicitly consented research inputs.

For current requirements, gates, and staged scope, see [`MVP_SPEC.md`](MVP_SPEC.md). The archived Milestone 0 baseline below and the earlier M0–M2E research records are historical, not current product authority; their DOCX-specific decisions do not qualify the new carriers.

<details>
<summary>Archived Milestone 0 product definition (superseded)</summary>

Status: approved Milestone 0 specification, 2026-08-30

## Purpose

Glyph is a web-based academic-integrity research product for teachers and schools. It protects an assignment with assignment-specific marker content, then checks a later response for those markers.

The first objective is not to launch a detection product. It is to test a narrower, falsifiable hypothesis:

> Assignment-specific markers appear in responses materially more often when a protected assignment is provided to a generative AI system than in properly designed controls.

## What Glyph measures

The raw measurement is assignment-specific marker detection.

The measurement can support increasingly interpretive language only at the level justified by evidence:

| Level | Allowed meaning | Approved example |
|---|---|---|
| 1. Observation | Reports analyzer output | “Signal A was detected.” |
| 2. Technical interpretation | Connects the signal to the protected assignment | “An assignment-specific marker associated with this protected assignment is present.” |
| 3. Research interpretation | Describes evidence under the research protocol | “The sample contains marker-exposure evidence.” |
| 4. Potential product interpretation | Teacher-facing language permitted only if experiments justify it | “Prompt-reuse signal detected.” |

The product must never skip from marker detection to a claim that a student used AI.

## What Glyph does not detect

Glyph does not establish:

- AI authorship or the proportion of a response written by AI.
- Direct ingestion of an assignment by a particular model.
- The identity or intent of the person who caused a marker to appear.
- Academic misconduct or a disciplinary conclusion.
- Plagiarism, writing quality, or student writing process.

A marker can reach a response through indirect sharing, contamination, deliberate insertion, or another path. Even a low probability of natural collision does not resolve that causal ambiguity.

## MVP users and workflows

The MVP has one user: a teacher working in a local research environment.

### Protect Assignment

The teacher optionally enters a title, pastes a plain-text assignment prompt, and requests protection. After the carrier and fingerprint gates pass, Glyph creates an immutable assignment identity, a versioned fingerprint, and a protected DOCX for download.

Glyph does not distribute the assignment.

### Analyze Submission

The teacher selects a protected assignment and pastes a response. Glyph analyzes the response transiently, reports conceptual signal IDs as detected or missing, applies a deterministic classification, and shows a careful explanation and disclaimer.

DOCX response upload is a later, conditional milestone. Analysis history is not part of the MVP.

## Evidence classifications

The first exact-canary strategy uses exactly two configured signals:

- `NO_SIGNAL`: none of the required signals is present.
- `WEAK_SIGNAL`: some but not all required signals are present.
- `STRONG_SIGNAL`: all required signals are present.

These are deterministic marker classifications, not probabilities of AI authorship. Two signals transported through the same document mechanism are distinct observations, not statistically independent evidence.

## Product principles

- Reliability validation is more important than visual polish.
- Failed experiments are valid outcomes and must remain visible.
- Evidence language must remain epistemically careful.
- The teacher remains responsible for contextual review.
- Research response data is minimized and transient; actual student work is prohibited from the internal prototype.
- Experimental carrier and strategy versions remain inspectable and replaceable.
- Scope grows only in response to validated research or pilot demand.

## Explicit non-goals

The MVP excludes conventional AI detection, AI probability scores, student accounts, administrative roles, organizations, billing, analytics dashboards, gradebooks, plagiarism detection, LMS integrations, external model APIs, automatic disciplinary actions, surveillance, browser extensions, native applications, PDF generation, batch processing, and public marketing or deployment.

## Internal research prototype

The INTERNAL RESEARCH PROTOTYPE is local-only, unauthenticated, not publicly deployed, and not suitable for real student work. It exists to validate the carrier, fingerprint strategy, analyzer, controlled experiments, and two minimal teacher workflows.

## Pilot-ready product

A PILOT-READY PRODUCT is a separate state. It requires authenticated teacher ownership, tested authorization and row-level security, abuse controls, reviewed logging and retention, deletion behavior, accessibility review, incident procedures, legal and school privacy review, and experiment-supported product language.

Reaching the internal prototype finish line does not imply pilot readiness.

## Product continuation rule

The `docx-hidden-run-v1` carrier spike is a hard gate. If relevant document workflows do not preserve the hidden marker content well enough to justify further research, development stops before product workflows are built around it.

The baseline controlled experiment is a second gate. The Analyze vertical slice begins only if that experiment gives a documented reason to continue.

</details>
