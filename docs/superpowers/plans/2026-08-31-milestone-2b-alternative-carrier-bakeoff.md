# Glyph Milestone 2B Alternative Carrier Bake-Off Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run a bounded, predeclared comparison of three ordinary-text DOCX carrier candidates through the same Google Docs round-trip, then record one evidence-scoped `SELECT_CANDIDATE`, `REVISE_CANDIDATE`, or `NO_VIABLE_DOCX_CARRIER` decision without changing the abandoned `docx-hidden-run-v1` experiment.

**Architecture:** The bakeoff is a new research-only experiment with one source DOCX per candidate and one explicit generator switch over exactly three candidate IDs. The existing strict canonical inspector remains unchanged for the original `docx-hidden-run-v1` package; a separate read-only inspector accepts arbitrary valid OOXML package layouts without an exact package allowlist or fallback to the old inspector, and reports fixed-marker presence, WordprocessingML part location, run formatting, visible fixture text, and active-content or relationship safety. The Google Docs protocol, observations, and gate are shared across all candidates so the only intentional variable is the carrier mechanism.

**Tech Stack:** Existing Node.js 26, TypeScript, pnpm, Vitest, `docx@9.7.1`, `fflate`, and `@xmldom/xmldom`; Node built-in filesystem, path, crypto, and assertion APIs. No dependency, model API, persistence layer, browser UI, converter, or OOXML schema framework is added.

**Spec:** This plan implements the explicitly authorized follow-on research comparison after the Milestone 2 decision recorded in [`research/experiments/docx-hidden-run-v1/run-001.json`](../../../research/experiments/docx-hidden-run-v1/run-001.json), while preserving the boundaries in [`AGENTS.md`](../../../AGENTS.md), [`docs/PRODUCT.md`](../../PRODUCT.md), [`docs/MVP_SPEC.md`](../../MVP_SPEC.md), [`docs/ARCHITECTURE.md`](../../ARCHITECTURE.md), [`docs/SECURITY.md`](../../SECURITY.md), [`docs/TESTING.md`](../../TESTING.md), and [`docs/EXPERIMENTS.md`](../../EXPERIMENTS.md). The prior execution plan is [`docs/superpowers/plans/2026-08-31-milestone-2-docx-carrier-spike.md`](2026-08-31-milestone-2-docx-carrier-spike.md).

## Global Constraints

- Start from commit `b9677ca6a8f5ccd5b76e56afff9d6799c221e918` on a dedicated local branch; do not rewrite, amend, reset, merge, or alter that commit.
- Treat the prior `ABANDON CURRENT CARRIER` decision as immutable evidence; do not edit `research/experiments/docx-hidden-run-v1/run-001.json`, its protocol, its fixture, its generator, its strict inspector, or its existing artifacts.
- This is a new research-only experiment. It does not revive `docx-hidden-run-v1`, change `docs/MVP_SPEC.md` in place, authorize Milestone 3, or authorize fingerprint generation, persistence, Protect, Analyze, model testing, or deployment.
- The new `protocol.md` is the narrow explicit successor specification for this bakeoff; it does not rewrite or supersede the frozen Milestone 0 product, architecture, security, testing, or experiment documents.
- Test exactly three candidates, in this frozen order: `matching-color-body-v1`, `sub-legible-body-1pt-v1`, and `docx-header-text-v1`.
- Each candidate gets one carrier mechanism and one independent source DOCX. Do not combine mechanisms in one source artifact; round-trip DOCX and clipboard files are derivative observations, not additional candidates.
- Use exactly the existing fixed markers `GLYPH TEST MARKER ALPHA` and `GLYPH TEST MARKER BETA`, and exactly the existing visible fixture `synthetic-library-hours-v1`; never generate or tune markers in this experiment.
- Candidate A uses ordinary body runs with explicit `w:color w:val="FFFFFF"` and no `w:vanish`, `w:sz`, or `w:shd`; candidate B uses `docx` numeric `size: 2`, producing exactly `w:sz w:val="2"` and `w:szCs w:val="2"` (one point, because WordprocessingML sizes are half-points), with no `w:vanish` or other styling; candidate C uses ordinary default-style text in one default header part and no `w:vanish`, color, or size override.
- Candidate A's white color is an explicit research candidate only; it is not secure, tamper-resistant, guaranteed invisible, or a production recommendation. Candidate B's one-point text is ordinary text, not hidden text. Candidate C's header text is ordinary text, not metadata or a directive channel.
- Alpha and Beta retain the frozen body positions for candidates A and B: paragraph 0 run 1 after `Read the passage below.`, and paragraph 2 run 1 after `Explain one possible benefit of the schedule change.` Candidate C removes those marker runs from the body and places Alpha in default header paragraph 0 and Beta in default header paragraph 1; the three body paragraphs remain unchanged.
- Do not add white-on-white variants beyond candidate A, additional font sizes beyond candidate B's one point, footer variants, multiple headers, mixed header/footer placement, hidden runs, zero-width characters, comments, custom XML, metadata, off-page positioning, macros, scripts, active content, embedded objects, remote resources, or external relationships.
- Preserve `research/experiments/docx-hidden-run-v1/inspect-carrier-docx.ts` as the strict canonical inspector. It continues to enforce its exact package allowlist and expected inert comments plumbing; it is never widened to accept transformed Google Docs layouts.
- The transformed inspector is read-only and package-tolerant: it accepts arbitrary valid OOXML part layouts, but still requires a ZIP/DOCX signature, `[Content_Types].xml`, `_rels/.rels`, and `word/document.xml`, rejects malformed XML, and reports safety findings instead of treating them as missing markers.
- The only material editor workflow in this bakeoff is the shared Google Docs import, ordinary-view observation, DOCX export, and plain-text copy workflow. Do not install Microsoft Word or add another converter during this experiment.
- A marker absence is an observation only. Do not infer why a transformed editor dropped, moved, recolored, resized, or exposed a marker without the corresponding structural or ordinary-view evidence.
- Ordinary visibility is assessed before selecting text, opening a hidden-text or accessibility setting, or inspecting OOXML. Explicit exposure is recorded separately and never rewritten as ordinary invisibility.
- Use synthetic fixture content only. No actual student work, assignment prompt, student identity, school record, credential, account identifier, cloud URL, private browser state, model-account data, or raw response enters source, tests, artifacts, logs, notes, or Git.
- Keep generated DOCX and plain-text outputs under the exact ignored directory `research/artifacts/docx-alternative-carrier-bakeoff-v1/`; commit only source, tests, protocol, documentation, and the completed non-blocked run record.
- Use existing dependencies only. Package metadata and lockfile changes are forbidden; package scripts may be added without adding a package.
- The pre-observation protocol, candidate IDs, exact formatting, shared workflow, record schema, and gate rule are committed before any Google Docs observation. A protocol deviation is recorded, not silently repaired after observing results.
- No result may claim AI authorship, direct AI ingestion, prompt reuse, student intent, cheating, academic misconduct, broad DOCX compatibility, or pilot readiness. `SELECT_CANDIDATE` authorizes only a separately approved next research step.

---

## Candidate Bakeoff Contract

The implementation has no registry or runtime plugin mechanism. The candidate switch is a closed discriminated union with one branch per candidate and no extension point.

| Candidate ID | Document profile | One mechanism in the source DOCX | Exact source placement | Expected research risk to test |
| --- | --- | --- | --- | --- |
| `matching-color-body-v1` | `docx-matching-color-body-v1` | Ordinary body `w:r` marker runs with explicit `w:color="FFFFFF"`; no `w:vanish`, `w:sz`, or other concealment property | Alpha at body paragraph 0 run 1; Beta at body paragraph 2 run 1 | White-page assumptions, color normalization, selection/accessibility exposure, and loss of ordinary text styling |
| `sub-legible-body-1pt-v1` | `docx-sub-legible-body-1pt-v1` | Ordinary body `w:r` marker runs from `docx` numeric `size: 2`, yielding exactly `w:sz w:val="2"` and `w:szCs w:val="2"`; no `w:vanish` or other styling | Alpha at body paragraph 0 run 1; Beta at body paragraph 2 run 1 | Size clamping or stripping, zoom-dependent visibility, layout changes, and extraction/accessibility exposure |
| `docx-header-text-v1` | `docx-header-text-v1` | Ordinary default-style text runs in one default `word/header1.xml` part; no `w:vanish`, color, or size override | Header paragraph 0 contains Alpha; header paragraph 1 contains Beta; body has only the three visible fixture paragraphs | Header import/export retention, header visibility, header inclusion in ordinary copy, and part-location changes |

**Candidate decision:** retain all three proposed candidates and add no
replacement. Candidate A is the smallest ordinary-body color transport test.
Candidate B is retained only as a fixed one-point diagnostic because it tests a
different single direct-formatting property; its likely visibility,
accessibility, and layout weaknesses are measured and can disqualify it rather
than being optimized away. Candidate C is retained as a standards-supported
regional transport control, not as an eligible winner. None depends on an
active, executable, Word-only, or structurally unverifiable mechanism.

The candidate comparison is intentionally critical rather than a claim that any
ordinary-text trick is safe. Candidate A may preserve marker characters across
ordinary text conversion while losing the explicit white color or becoming
visible on a non-white page, in high-contrast rendering, on selection, or to an
accessibility tool. Candidate B may preserve characters more reliably than
formatting, but a one-point run can be clamped, removed, exposed by zoom or
selection, included in extraction, or alter line layout. Candidate C isolates a
regional transport path: a default header is easy to expose in the normal page
view and may be omitted from body selection or a conversion, but it does not
alter the body fixture. Header is chosen instead of footer because a single
default header gives one deterministic WordprocessingML part and one top-of-page
location without introducing a second region; no footer candidate is evaluated.
Candidate C is therefore a transport diagnostic only. Even if both markers
survive in the header, it can yield `REVISE_CANDIDATE` but can never yield
`SELECT_CANDIDATE`. The bakeoff records these risks as observations rather than
assuming a favorable result.

The fixture source remains `research/experiments/docx-hidden-run-v1/fixture.ts`. The new candidate fixture module imports its existing `FIXED_MARKER_ALPHA`, `FIXED_MARKER_BETA`, and `VISIBLE_PARAGRAPHS` values and asserts equality at test time; it does not duplicate or alter the frozen experiment. The source generator receives ordered fixture runs and applies only the selected candidate's branch.

The generator interface is:

```typescript
export type AlternativeCarrierCandidateId =
  | "matching-color-body-v1"
  | "sub-legible-body-1pt-v1"
  | "docx-header-text-v1";

export type AlternativeCarrierMarkerId = "alpha" | "beta";

export type AlternativeCarrierFixtureRun = Readonly<{
  text: string;
  marker?: AlternativeCarrierMarkerId;
}>;

export type AlternativeCarrierFixture = Readonly<{
  bodyParagraphs: readonly (readonly AlternativeCarrierFixtureRun[])[];
  markers: Readonly<{
    alpha: string;
    beta: string;
  }>;
}>;

export async function generateDocxAlternativeCarrier(
  candidate: AlternativeCarrierCandidateId,
  fixture: AlternativeCarrierFixture,
): Promise<Uint8Array>;
```

The transformed inspector interface is:

```typescript
export type OOXMLTextLocation =
  | "body"
  | "header"
  | "footer"
  | "footnote"
  | "endnote"
  | "comments"
  | "other";

export type MarkerPresence = "present" | "absent";

export type MarkerRunFormat = Readonly<{
  hidden: boolean;
  color: string | null;
  sizeHalfPoints: number | null;
  sizeComplexScriptHalfPoints: number | null;
}>;

export type TransformedMarkerOccurrence = Readonly<{
  markerId: AlternativeCarrierMarkerId;
  partName: string;
  location: OOXMLTextLocation;
  paragraphIndex: number;
  runIndices: readonly number[];
  runFormats: readonly MarkerRunFormat[];
}>;

export type TransformedParagraphInspection = Readonly<{
  partName: string;
  location: OOXMLTextLocation;
  paragraphIndex: number;
  text: string;
}>;

export type TransformedDocxInspection = Readonly<{
  entries: readonly string[];
  paragraphs: readonly TransformedParagraphInspection[];
  markerPresence: Readonly<{
    alpha: MarkerPresence;
    beta: MarkerPresence;
  }>;
  markerOccurrences: readonly TransformedMarkerOccurrence[];
  safety: Readonly<{
    externalRelationships: readonly string[];
    unresolvedRelationshipTargets: readonly string[];
    activeContentEntries: readonly string[];
    activeRelationshipTypes: readonly string[];
    macroContentTypes: readonly string[];
  }>;
}>;

export function inspectTransformedDocx(
  bytes: Uint8Array,
  markers: Readonly<{
    alpha: string;
    beta: string;
  }>,
): TransformedDocxInspection;
```

The inspector concatenates `w:t` descendants within each `w:r`, then each direct body/header/footer/footnote/endnote/comments paragraph. It locates marker strings in the concatenated paragraph text, including a marker split across adjacent runs, and maps every occurrence to its part, location, paragraph, run indices, and run formats. `color` is the explicit `w:color/@w:val` or `null`; `sizeHalfPoints` is the explicit numeric `w:sz/@w:val` or `null`; `sizeComplexScriptHalfPoints` is the explicit numeric `w:szCs/@w:val` or `null`; `hidden` is true only for an enabled `w:vanish`. It scans every `.rels` part for external relationships and targets that do not resolve to package entries, and scans `[Content_Types].xml` for active relationship types, active-content entries, and macro content types. It never executes package content, never falls back to the strict inspector, and never requires the old canonical allowlist.

The research record stores marker IDs and format/location summaries, not a browser-facing contract. It may contain the fixed synthetic fixture text because this is a local research artifact; it must not contain any user-submitted content.

## Pre-observation Gate

The gate is frozen before candidate generation or Google Docs observation. It
applies only after all three source artifacts have passed their candidate-specific
canonical structural tests and all three Google Docs round-trips have produced
valid, inspectable DOCX outputs. A `not_run` round-trip or an attempted workflow
with no inspectable DOCX is operationally `BLOCKED`: retain factual local notes,
but do not fabricate one of the three scientific decisions, create
`run-001.json`, or make the result commit. A completed export with unsafe
content makes that candidate ineligible and is retained as assessable negative
evidence; it produces the overall `NO_VIABLE_DOCX_CARRIER` decision only when no
other candidate satisfies selection or bounded revision criteria. An
unavailable clipboard copy does not block the DOCX comparison.

For every candidate, `sourceInspection.safety` and any completed round-trip `transformedInspection.safety` must have all five arrays empty to be safety-clean. A safety finding is never converted into marker absence.

`SELECT_CANDIDATE` requires exactly one candidate to satisfy every condition below:

1. Its source artifact passes the new candidate-specific canonical structural
   test contract and is safety-clean under the transformed inspector. The old
   `docx-hidden-run-v1` inspector is only an unchanged regression check for the
   old artifact and is never a validator for a new profile.
2. Its completed Google Docs DOCX export is structurally valid and safety-clean under the transformed inspector.
3. Both Alpha and Beta are `present` in the exported DOCX and retain the
   candidate's principal mechanism: candidate A occurrences remain in the body
   with direct `FFFFFF` color, while candidate B occurrences remain in the body
   with direct `w:sz=2` and `w:szCs=2`. Google Docs may split a marker across
   adjacent runs only when every overlapping marker run retains the required
   direct property. Moved or reformatted occurrences are still recorded but do
   not satisfy selection.
4. All three visible body paragraphs are `preserved` in the exported DOCX, in the frozen order and with no marker text counted as body-visible fixture content.
5. Neither marker is `visible` in the ordinary Google Docs view before selection or explicit exposure. A marker exposed only by a named tool or explicit setting is recorded as conditional exposure and narrows the claim.
6. The candidate is one of the two body candidates, `matching-color-body-v1` or `sub-legible-body-1pt-v1`; `docx-header-text-v1` is a regional transport diagnostic and is never eligible for selection.
7. Every other body candidate has a completed, inspectable result that fails at
   least one mandatory condition, making the selected body candidate clearly
   dominant under this protocol. If either result is uninspectable the bakeoff
   is `BLOCKED`; if both body candidates satisfy all mandatory conditions, the
   bakeoff has no unique winner and cannot select one.

The Google Docs plain-text copy is a secondary observation. It is recorded for every candidate, but its marker presence is not a mandatory `SELECT_CANDIDATE` condition; a selected candidate's claim is therefore limited to the tested DOCX export and the ordinary-view observation unless the copy also preserves the markers.

`REVISE_CANDIDATE` applies when all three round-trip DOCX outputs are completed
and inspectable, at least one result shows bounded evidence worth a separately
versioned retest, and no unique candidate satisfies `SELECT_CANDIDATE`: exactly
one marker survives; both markers survive with visible body damage; formatting
or location changes make ordinary exposure conditional; the header-only
candidate preserves a marker; or the two body candidates tie on all mandatory
conditions. Any revision receives a new candidate ID, document profile, and
experiment ID; no candidate is tuned in place.

`NO_VIABLE_DOCX_CARRIER` applies when all three round-trip DOCX outputs are
completed and inspectable, no candidate safely preserves both markers for a
body-eligible selection, and no bounded result supports a revision: every
candidate loses both markers, exposes marker text in ordinary view, damages the
visible fixture incompatibly, or produces unsafe package content/relationships.
An operational or uninspectable result cannot support this conclusion. The
decision stops this research line; it does not establish anything about AI
behavior.

The decision is not made from a download click, a no-match search, the old strict inspector rejecting a transformed package, or a fixture-only test. Every decision rationale names candidate IDs and workflow observations. The only permitted top-level scientific values are `SELECT_CANDIDATE`, `REVISE_CANDIDATE`, and `NO_VIABLE_DOCX_CARRIER`.

## Task 1: Freeze the alternative-carrier protocol, fixture, matrix, and gate

**Files:**

- Create: `research/experiments/docx-alternative-carrier-bakeoff-v1/protocol.md` — freeze identifiers, the three candidate mechanisms, the shared Google Docs protocol, observation vocabulary, matrix columns, record schema, and decision rule before any source artifact is generated.
- Create: `research/experiments/docx-alternative-carrier-bakeoff-v1/fixture.ts` — import the old fixed marker and visible fixture constants and expose the candidate order plus the ordered body/header placement contract.
- Include unchanged: `docs/superpowers/plans/2026-08-31-milestone-2b-alternative-carrier-bakeoff.md` — commit this approved execution plan with the pre-observation protocol so a clean checkout preserves the instructions that governed the run.
- Modify: `AGENTS.md` — after this plan is explicitly approved, replace exactly
  the two stale paragraphs under `## Milestones and gates` with the concise
  Milestone 2B paragraph below; preserve the heading and every other instruction.
- Do not modify: `research/experiments/docx-hidden-run-v1/run-001.json`, `research/experiments/docx-hidden-run-v1/protocol.md`, `research/experiments/docx-hidden-run-v1/fixture.ts`, or `research/experiments/docx-hidden-run-v1/inspect-carrier-docx.ts`; the starting commit itself remains immutable while the dedicated branch receives only the listed bakeoff changes.

**Frozen identifiers and candidate fixture exports:**

```typescript
export const EXPERIMENT_ID =
  "glyph-exp-a-docx-alternative-carrier-bakeoff-v1-001";
export const EXPERIMENT_SCHEMA_VERSION = 1;
export const BAKEOFF_PROFILE = "docx-alternative-carrier-bakeoff-v1";
export const VISIBLE_FIXTURE_ID = "synthetic-library-hours-v1";
export const CANDIDATE_ORDER = [
  "matching-color-body-v1",
  "sub-legible-body-1pt-v1",
  "docx-header-text-v1",
] as const;
```

The exact replacement paragraph for `AGENTS.md` is:

```text
Work only on the active approved milestone. Milestone 2 ended with the recorded abandonment of `docx-hidden-run-v1`; Milestone 2B, the alternative DOCX carrier bakeoff, is the current research milestone. Milestone 3 and product workflows remain later and require a separate positive carrier gate and approval; Milestone 7 remains the later baseline controlled-experiment go/no-go gate before Analyze.
```

The fixture exports `CANDIDATE_FIXTURE` with exactly three body paragraphs and the same run text as the frozen library-hours fixture. Alpha and Beta are marker-tagged runs at body paragraph 0/run 1 and body paragraph 2/run 1. The header candidate's generator consumes the same tagged fixture, removes only tagged runs from the body, and places Alpha in default header paragraph 0 and Beta in default header paragraph 1, each as a separate plain unstyled paragraph. Tests assert `CANDIDATE_FIXTURE.markers.alpha === FIXED_MARKER_ALPHA`, `CANDIDATE_FIXTURE.markers.beta === FIXED_MARKER_BETA`, and the non-marker body text equals `VISIBLE_PARAGRAPHS` exactly.

**Shared Google Docs workflow IDs and observation values:**

| Field | Frozen values |
| --- | --- |
| Workflow IDs | `canonical-package`, `google-docs-roundtrip-docx`, `google-docs-copy-plain-text` |
| Workflow status | `completed`, `failed`, `not_run` |
| Marker presence | `present`, `absent`, `not_assessable`, `not_applicable` |
| Visible body | `preserved`, `changed`, `lost`, `not_assessable`, `not_applicable` |
| Ordinary visibility | `not_visible`, `visible`, `not_assessable`, `not_applicable` |
| Conditional exposure | `hidden_text_setting`, `accessibility_tool`, `plain_text_extraction`, `other_recorded_tool` |

The protocol names one unshared Google Docs document per candidate, the exact source hash, application/platform version when observable, ordinary-view steps, export path/hash, transformed-inspector result, copy/paste result, deviations, and limitations. It prohibits using the same transformed document as the source for another candidate, editing the fixture in Google Docs, searching for the marker before ordinary-view assessment, sharing the document, or recording account identity or URL.

**Machine-readable record schema to freeze in `protocol.md`:**

Use these exact TypeScript types as the schema definition. The JSON record uses
the same property names and contains no additional properties.

```typescript
export type ISODate = `${number}-${number}-${number}`;
export type SHA256 = string;
export type WorkflowStatus = "completed" | "failed" | "not_run";
export type MarkerObservation =
  | "present"
  | "absent"
  | "not_assessable"
  | "not_applicable";
export type VisibleBodyObservation =
  | "preserved"
  | "changed"
  | "lost"
  | "not_assessable"
  | "not_applicable";
export type OrdinaryVisibilityObservation =
  | "not_visible"
  | "visible"
  | "not_assessable"
  | "not_applicable";
export type ConditionalExposure =
  | "hidden_text_setting"
  | "accessibility_tool"
  | "plain_text_extraction"
  | "other_recorded_tool";
export type GateDecision =
  | "SELECT_CANDIDATE"
  | "REVISE_CANDIDATE"
  | "NO_VIABLE_DOCX_CARRIER";

export type ArtifactRef = Readonly<{
  path: string;
  sha256: SHA256;
}>;

export type InspectorSafetySummary = Readonly<{
  externalRelationships: readonly string[];
  unresolvedRelationshipTargets: readonly string[];
  activeContentEntries: readonly string[];
  activeRelationshipTypes: readonly string[];
  macroContentTypes: readonly string[];
}>;

export type MarkerOccurrenceSummary = Readonly<{
  markerId: "alpha" | "beta";
  partName: string;
  location: OOXMLTextLocation;
  paragraphIndex: number;
  runIndices: readonly number[];
  runFormats: readonly MarkerRunFormat[];
}>;

export type TransformedDocxInspectionSummary = Readonly<{
  entries: readonly string[];
  visibleBodyParagraphs: readonly string[];
  markerPresence: Readonly<{
    alpha: MarkerPresence;
    beta: MarkerPresence;
  }>;
  markerOccurrences: readonly MarkerOccurrenceSummary[];
  safety: InspectorSafetySummary;
}>;

export type WorkflowApplication = Readonly<{
  name: string;
  version: string | null;
}>;

export type WorkflowPlatform = Readonly<{
  name: string;
  version: string | null;
}>;

export type RoundtripWorkflow = Readonly<{
  status: "completed";
  failureReason: null;
  application: WorkflowApplication;
  platform: WorkflowPlatform;
  steps: readonly string[];
  sourceArtifactSha256: SHA256;
  resultArtifact: ArtifactRef;
  markerPresence: Readonly<{
    alpha: MarkerObservation;
    beta: MarkerObservation;
  }>;
  visibleBody: VisibleBodyObservation;
  ordinaryVisibility: OrdinaryVisibilityObservation;
  conditionalExposure: readonly ConditionalExposure[];
  transformedInspection: TransformedDocxInspectionSummary;
  protocolDeviation: string | null;
  notes: readonly string[];
}>;

export type CopyWorkflow = Readonly<{
  status: WorkflowStatus;
  failureReason: string | null;
  application: WorkflowApplication;
  platform: WorkflowPlatform;
  steps: readonly string[];
  sourceArtifactSha256: SHA256;
  resultArtifact: ArtifactRef | null;
  markerPresence: Readonly<{
    alpha: MarkerObservation;
    beta: MarkerObservation;
  }>;
  visibleBody: VisibleBodyObservation;
  ordinaryVisibility: "not_applicable";
  conditionalExposure: readonly ConditionalExposure[];
  protocolDeviation: string | null;
  notes: readonly string[];
}>;

export type CandidateRecord = Readonly<{
  candidateId: AlternativeCarrierCandidateId;
  mechanism:
    | "ordinary-body-color-FFFFFF"
    | "ordinary-body-size-1pt"
    | "ordinary-header-text";
  documentProfile:
    | "docx-matching-color-body-v1"
    | "docx-sub-legible-body-1pt-v1"
    | "docx-header-text-v1";
  canonicalArtifact: ArtifactRef;
  canonicalProfileValidation: Readonly<{
    status: "passed";
    testCommand: "pnpm test tests/documents/docx-alternative-carrier-bakeoff.test.ts";
  }>;
  sourceInspection: TransformedDocxInspectionSummary;
  googleDocsRoundtrip: RoundtripWorkflow;
  googleDocsCopyPlainText: CopyWorkflow;
}>;

export type LayoutDisturbanceObservation =
  | "none_observed"
  | "minor"
  | "material"
  | "not_assessable";
export type RevealObservation =
  | "revealed"
  | "not_revealed"
  | "not_run"
  | "not_assessable";
export type AccessibilityExposureObservation =
  | "exposed"
  | "not_exposed"
  | "not_run"
  | "not_assessable";

export type MatrixRow = Readonly<{
  candidateId: AlternativeCarrierCandidateId;
  transport: Readonly<{
    canonicalValid: boolean;
    sourceMarkerPresence: Readonly<{
      alpha: MarkerPresence;
      beta: MarkerPresence;
    }>;
    sourceLocations: readonly MarkerOccurrenceSummary[];
    sourceFormats: readonly MarkerRunFormat[];
    roundtripMarkerPresence: Readonly<{
      alpha: MarkerObservation;
      beta: MarkerObservation;
    }>;
    roundtripLocations: readonly MarkerOccurrenceSummary[];
    roundtripFormats: readonly MarkerRunFormat[];
    roundtripVisibleBody: VisibleBodyObservation;
    copyMarkerPresence: Readonly<{
      alpha: MarkerObservation;
      beta: MarkerObservation;
    }>;
    copyVisibleBody: VisibleBodyObservation;
  }>;
  presentation: Readonly<{
    ordinaryVisibility: OrdinaryVisibilityObservation;
    layoutDisturbance: LayoutDisturbanceObservation;
    selectionReveal: RevealObservation;
    backgroundOrThemeReveal: RevealObservation;
    explicitFormattingReveal: RevealObservation;
  }>;
  accessibilityTrust: Readonly<{
    assistiveExposure: AccessibilityExposureObservation;
    accidentalExposureNotes: readonly string[];
    limitations: readonly string[];
  }>;
  engineering: Readonly<{
    structuralSimplicity:
      | "single-direct-color-property"
      | "single-direct-size-property"
      | "single-default-header-region";
    deterministicGeneration: boolean;
    deterministicInspection: boolean;
    testedEditorScope: "Google Docs import/export only";
    sourceSafetyClean: boolean;
    roundtripSafetyClean: boolean;
  }>;
}>;

export type BakeoffRunRecord = Readonly<{
  experimentId: "glyph-exp-a-docx-alternative-carrier-bakeoff-v1-001";
  experimentSchemaVersion: 1;
  date: ISODate;
  bakeoffProfile: "docx-alternative-carrier-bakeoff-v1";
  fingerprintStrategy: null;
  fingerprintStrategyVersion: null;
  matchingProfile: null;
  fixedMarkers: Readonly<{
    alpha: "GLYPH TEST MARKER ALPHA";
    beta: "GLYPH TEST MARKER BETA";
  }>;
  visibleFixture: Readonly<{
    id: "synthetic-library-hours-v1";
    sourcePath: "research/experiments/docx-hidden-run-v1/fixture.ts";
  }>;
  sourceGenerator: Readonly<{
    path: "src/documents/docx/docx-alternative-carrier-bakeoff-v1.ts";
    gitCommit: string;
    nodeVersion: string;
    pnpmVersion: string;
    docxVersion: string;
  }>;
  googleDocsProtocol: Readonly<{
    application: WorkflowApplication & { name: "Google Docs" };
    platform: WorkflowPlatform;
    candidateOrder: readonly [
      "matching-color-body-v1",
      "sub-legible-body-1pt-v1",
      "docx-header-text-v1",
    ];
    documentRule: "one new unshared document per candidate";
  }>;
  candidates: readonly [CandidateRecord, CandidateRecord, CandidateRecord];
  matrix: readonly [MatrixRow, MatrixRow, MatrixRow];
  gateDecision: GateDecision;
  selectedCandidateId: AlternativeCarrierCandidateId | null;
  gateRationale: readonly string[];
  limitations: readonly string[];
}>;
```

The validator in Task 5 additionally requires every `SHA256` value to match
`/^[0-9a-f]{64}$/`, every workflow `steps` array to be non-empty,
every round-trip workflow to match its completed-only schema, and every copy
workflow `failureReason` to be `null` only for `completed` and non-empty for
`failed` or `not_run`. It requires exactly three candidate objects and three
matrix rows in `CANDIDATE_ORDER`, the exact candidate-to-mechanism/profile
mapping, artifact paths inside the ignored bakeoff directory, and no account,
URL, credential, prompt, or response fields. The validator also checks that
`selectedCandidateId` is the sole body candidate satisfying the seven selection
conditions for `SELECT_CANDIDATE`, and is `null` for the other two decisions.
It requires each matrix row to contain the exact nested `transport`,
`presentation`, `accessibilityTrust`, and `engineering` sections above; it does
not derive or accept a composite numeric score.

- [ ] **Step 1: Verify the immutable starting point before protocol work**

  Run:

  ```bash
  pwd -P
  git status --short --branch
  git rev-parse HEAD
  git show --no-patch --format='%H %s' b9677ca
  git diff --quiet b9677ca -- research/experiments/docx-hidden-run-v1/run-001.json
  git diff --quiet b9677ca -- research/experiments/docx-hidden-run-v1/protocol.md research/experiments/docx-hidden-run-v1/fixture.ts research/experiments/docx-hidden-run-v1/inspect-carrier-docx.ts
  node --version
  pnpm --version
  git switch --create codex/milestone-2b-alternative-carrier-bakeoff b9677ca6a8f5ccd5b76e56afff9d6799c221e918
  ```

  Expected: the current commit resolves to `b9677ca6a8f5ccd5b76e56afff9d6799c221e918`, both old-experiment diff commands exit zero, Node and pnpm are available, no old experiment path is dirty, and the only permitted pre-existing uncommitted path is this approved plan file. The new branch is checked out from the immutable commit with that plan file preserved. If the starting commit, old-experiment diff, working-tree scope, or branch creation is different, stop before creating the protocol.

- [ ] **Step 2: Write the frozen protocol and candidate fixture**

  After explicit approval of this plan, replace exactly the two existing
  paragraphs under `AGENTS.md`'s `## Milestones and gates` heading with the
  exact paragraph above. Create `protocol.md` with the exact candidate table,
  fixed fixture/run table, Google Docs workflow steps, observation vocabulary,
  matrix columns, record schema, operational blocked rule, and gate rule from
  this plan. Create `fixture.ts` with the exact exports and assertions described
  above; import the old fixture constants rather than copying their string
  literals into a second source of truth.

  The shared Google Docs steps in the protocol must be exactly:

  1. Generate and hash all three source artifacts before opening any document.
  2. In the frozen candidate order, upload one source artifact to one new unshared Google Docs document; never use an exported artifact as a later source.
  3. Keep Google Docs at its ordinary default view and 100% document zoom; do not select text, search for marker values, enable hidden-text display, or use an assistive tool before recording ordinary visibility and the three visible body paragraphs.
  4. Download that document as Microsoft Word `.docx` to the candidate-specific ignored output path and record the download hash.
  5. Run the new transformed inspector against the exported file. The old
     `docx-hidden-run-v1` inspector is not run against successor artifacts; its
     unchanged test suite and original canonical artifact are regression-checked
     separately.
  6. From the same ordinary view, use `Select all`, copy, paste into a new plain-text destination, save the candidate-specific `.txt` file, hash it, and search independently for Alpha, Beta, and the three visible paragraphs.
  7. Record ordinary exposure after the primary observation only when a named setting/tool is explicitly exercised; do not install software or change global accessibility configuration.

  After the shared primary observation, perform these frozen candidate-specific
  presentation checks without editing document content:

  - For `matching-color-body-v1`, select the two marker locations and record
    whether selection reveals the text; record whether the page remains white
    and whether a locally available dark-theme, dark-canvas, high-contrast, or
    background change reveals or recolors it. If no such view is already
    available, record `not_run`; do not alter global display settings.
  - For `sub-legible-body-1pt-v1`, record marker readability at 100% before
    selection, then selection reveal, visible spacing, line-height, paragraph,
    and pagination disturbance. Zoom-dependent impressions may be noted only
    after the frozen 100% observation.
  - For `docx-header-text-v1`, use paginated/pages mode at 100% and record the
    default header's ordinary visibility and layout effect. The body `Select
    all` copy is predeclared not to require header inclusion; absence of Alpha
    and Beta from that copy is a clipboard limitation, not a DOCX round-trip
    failure.

  For each candidate, record assistive exposure only if an already-available
  accessibility surface can be exercised reliably. Otherwise record
  `not_run`/`not_assessable` and scope the limitation; never infer accessibility
  behavior from XML, selection, or plain-text extraction.

  Record the exact application/platform version when observable, `null`
  otherwise. Record `protocolDeviation` as JSON `null` when all steps ran as
  written; otherwise use a concise factual string. The protocol must state that
  the candidate order, fixture, marker values, source artifact paths, and gate
  are frozen before observations. It must also state that an unexecuted
  candidate export or any attempted workflow without an inspectable round-trip
  DOCX is operationally `BLOCKED` and creates no run record or scientific gate.

- [ ] **Step 3: Review and commit the pre-observation protocol**

  Run:

  ```bash
  rg -n 'matching-color-body-v1|sub-legible-body-1pt-v1|docx-header-text-v1|GLYPH TEST MARKER ALPHA|GLYPH TEST MARKER BETA|SELECT_CANDIDATE|REVISE_CANDIDATE|NO_VIABLE_DOCX_CARRIER' research/experiments/docx-alternative-carrier-bakeoff-v1/protocol.md research/experiments/docx-alternative-carrier-bakeoff-v1/fixture.ts
  git add -N AGENTS.md docs/superpowers/plans/2026-08-31-milestone-2b-alternative-carrier-bakeoff.md research/experiments/docx-alternative-carrier-bakeoff-v1/protocol.md research/experiments/docx-alternative-carrier-bakeoff-v1/fixture.ts
  git diff --check
  git diff -- research/experiments/docx-hidden-run-v1/run-001.json research/experiments/docx-hidden-run-v1/protocol.md research/experiments/docx-hidden-run-v1/fixture.ts research/experiments/docx-hidden-run-v1/inspect-carrier-docx.ts
  git add AGENTS.md docs/superpowers/plans/2026-08-31-milestone-2b-alternative-carrier-bakeoff.md research/experiments/docx-alternative-carrier-bakeoff-v1/protocol.md research/experiments/docx-alternative-carrier-bakeoff-v1/fixture.ts
  git commit -m 'docs: freeze alternative carrier bakeoff protocol'
  ```

  Expected: exact identifiers and the three candidates are present, `git diff --check` is clean, the immutable old experiment has no diff, and the commit contains only the approved plan, concise active-milestone line, new protocol, and fixture.

## Task 2: Introduce the transformed-inspection seam and three candidate generators red-first

**Files:**

- Create: `src/documents/docx/docx-alternative-carrier-bakeoff-v1.ts` — explicit three-branch generator with no marker constants, persistence, filesystem writes, or generic carrier registry.
- Create: `research/experiments/docx-alternative-carrier-bakeoff-v1/inspect-transformed-docx.ts` — minimum read-only inspector implementation required to observe generated candidate structure through the frozen interface.
- Create: `tests/documents/docx-alternative-carrier-bakeoff.test.ts` — red-first tests for candidate identity, placement, formatting, visible body equality, and one-artifact-per-candidate behavior.
- Do not modify: `src/documents/docx/docx-hidden-run-v1.ts` or its existing tests.

**Candidate generator behavior:**

```typescript
const ordinaryRunForCandidate = (
  candidate: AlternativeCarrierCandidateId,
  run: AlternativeCarrierFixtureRun,
): TextRun => {
  if (!run.marker) {
    return new TextRun({ text: run.text });
  }
  switch (candidate) {
    case "matching-color-body-v1":
      return new TextRun({ text: run.text, color: "FFFFFF" });
    case "sub-legible-body-1pt-v1":
      return new TextRun({ text: run.text, size: 2 });
    case "docx-header-text-v1":
      throw new Error("Header marker runs are built in the header branch.");
  }
};
```

Use `Document`, `Header`, `Packer`, `Paragraph`, and `TextRun` from the existing `docx` dependency. Candidates A and B map every non-marker fixture run unchanged and map marker-tagged runs to one ordinary `TextRun` with the exact single formatting property. Candidate C maps only non-marker body runs, creates one `Header` with Alpha in paragraph 0 and Beta in paragraph 1, and adds that header as `sections[0].headers.default`. Do not set `vanish`, add a second header/footer, add a color or size override to candidate C, or write bytes to disk.

- [ ] **Step 1: Write the failing generator tests**

  Add tests with these exact assertions:

  ```typescript
  test.each(CANDIDATE_ORDER)(
    "%s preserves the frozen visible body and fixed markers",
    async (candidate) => {
      const inspection = inspectTransformedDocx(
        await generateDocxAlternativeCarrier(candidate, CANDIDATE_FIXTURE),
        CANDIDATE_FIXTURE.markers,
      );
      expect(bodyParagraphs(inspection)).toEqual(VISIBLE_PARAGRAPHS);
      expect(inspection.markerPresence).toEqual({ alpha: "present", beta: "present" });
    },
  );

  test("matching-color-body-v1 uses only explicit white color in body marker runs", async () => {
    const inspection = inspectTransformedDocx(
      await generateDocxAlternativeCarrier(
        "matching-color-body-v1",
        CANDIDATE_FIXTURE,
      ),
      CANDIDATE_FIXTURE.markers,
    );
    expect(markerOccurrences(inspection, "alpha")).toMatchObject([
      { location: "body", partName: "word/document.xml", paragraphIndex: 0, runIndices: [1] },
    ]);
    expect(markerOccurrences(inspection, "alpha")[0]?.runFormats).toEqual([
      {
        hidden: false,
        color: "FFFFFF",
        sizeHalfPoints: null,
        sizeComplexScriptHalfPoints: null,
      },
    ]);
    expect(markerOccurrences(inspection, "beta")[0]?.runFormats).toEqual([
      {
        hidden: false,
        color: "FFFFFF",
        sizeHalfPoints: null,
        sizeComplexScriptHalfPoints: null,
      },
    ]);
  });

  test("sub-legible-body-1pt-v1 uses one half-point value of 2 and no color override", async () => {
    const inspection = inspectTransformedDocx(
      await generateDocxAlternativeCarrier(
        "sub-legible-body-1pt-v1",
        CANDIDATE_FIXTURE,
      ),
      CANDIDATE_FIXTURE.markers,
    );
    expect(markerOccurrences(inspection, "alpha")[0]?.runFormats).toEqual([
      {
        hidden: false,
        color: null,
        sizeHalfPoints: 2,
        sizeComplexScriptHalfPoints: 2,
      },
    ]);
    expect(markerOccurrences(inspection, "beta")[0]?.runFormats).toEqual([
      {
        hidden: false,
        color: null,
        sizeHalfPoints: 2,
        sizeComplexScriptHalfPoints: 2,
      },
    ]);
  });

  test("docx-header-text-v1 puts markers in separate ordinary header paragraphs", async () => {
    const inspection = inspectTransformedDocx(
      await generateDocxAlternativeCarrier(
        "docx-header-text-v1",
        CANDIDATE_FIXTURE,
      ),
      CANDIDATE_FIXTURE.markers,
    );
    expect(markerOccurrences(inspection, "alpha")[0]).toMatchObject({
      location: "header",
      partName: "word/header1.xml",
      paragraphIndex: 0,
    });
    expect(markerOccurrences(inspection, "beta")[0]).toMatchObject({
      location: "header",
      partName: "word/header1.xml",
      paragraphIndex: 1,
    });
    expect(markerOccurrences(inspection, "alpha")[0]?.runFormats).toEqual([
      {
        hidden: false,
        color: null,
        sizeHalfPoints: null,
        sizeComplexScriptHalfPoints: null,
      },
    ]);
  });
  ```

  In the same file, assert Alpha and Beta each occur exactly once; no marker
  occurs in comments, properties, relationships, or any unintended text part;
  `word/document.xml` contains no comment range/reference elements; any
  library-emitted `word/comments.xml` contains zero `w:comment` elements and
  its `.rels` contains zero relationships; no `commentsExtended.xml`,
  `commentsIds.xml`, `people.xml`, footer, macro, active-content, remote, or
  external part/relationship exists. Candidate C may add only the expected
  internal default-header part, content type, and relationship beyond the
  package shape shared by the body candidates.

  The test helper `bodyParagraphs` filters `inspection.paragraphs` to `location === "body"`, preserves paragraph order, removes exactly `CANDIDATE_FIXTURE.markers.alpha` and `CANDIDATE_FIXTURE.markers.beta` from each paragraph text, and compares the result with `VISIBLE_PARAGRAPHS`; this keeps ordinary marker runs from changing the visible-fixture assertion. The helper `markerOccurrences` filters the exact inspector output by marker ID. Import the not-yet-created generator and transformed inspector with their final paths, then run the focused file.

- [ ] **Step 2: Run the focused tests to verify the intended red**

  Run:

  ```bash
  pnpm test tests/documents/docx-alternative-carrier-bakeoff.test.ts
  ```

  Expected: Vitest discovers the file and exits non-zero because `@/documents/docx/docx-alternative-carrier-bakeoff-v1` and `../../research/experiments/docx-alternative-carrier-bakeoff-v1/inspect-transformed-docx` do not exist. Zero tests discovered or a failure in the existing `docx-hidden-run-v1` suite is not the intended red state.

- [ ] **Step 3: Implement the minimum explicit generator and inspection seam**

  Create the generator with the exact exported types and function signature from the Candidate Bakeoff Contract. Build body paragraphs from fixture runs. For candidates A and B, preserve marker runs in the body and set only the branch-specific property. For candidate C, omit marker-tagged body runs and create two default header paragraphs, Alpha in paragraph 0 and Beta in paragraph 1. Return `await Packer.toBuffer(document)`.

  Throw `new Error(\`Unsupported alternative carrier candidate: ${String(candidate)}\`)` for a runtime string outside the closed union. Do not validate or normalize marker text in this module; the frozen fixture and focused tests own that contract.

  Create the transformed inspector with the exact public types and function
  signature from the Candidate Bakeoff Contract. Implement only the behavior
  already exercised by the candidate tests: validate a ZIP package with the
  required core entries; parse `word/document.xml` and internally referenced
  default header parts; enumerate paragraph/run text; find both marker strings;
  report direct `w:vanish`, `w:color`, `w:sz`, and `w:szCs` properties; and
  return the five empty-or-populated safety arrays. Task 3 adds malformed,
  split-run, arbitrary-part, and adversarial-relationship cases red-first.

- [ ] **Step 4: Run focused tests and static checks to verify green**

  Run:

  ```bash
  pnpm test tests/documents/docx-alternative-carrier-bakeoff.test.ts
  pnpm lint
  pnpm typecheck
  git add -N src/documents/docx/docx-alternative-carrier-bakeoff-v1.ts research/experiments/docx-alternative-carrier-bakeoff-v1/inspect-transformed-docx.ts tests/documents/docx-alternative-carrier-bakeoff.test.ts
  git diff --check
  ```

  Expected: the focused suite passes with one source package per candidate, all three body paragraphs exactly preserved, Alpha and Beta present exactly once, candidate A reports `FFFFFF`, candidate B reports half-point size `2`, candidate C reports `word/header1.xml`, and lint/typecheck pass without changes to the old carrier module.

- [ ] **Step 5: Commit the generator checkpoint**

  Run:

  ```bash
  git add src/documents/docx/docx-alternative-carrier-bakeoff-v1.ts research/experiments/docx-alternative-carrier-bakeoff-v1/inspect-transformed-docx.ts tests/documents/docx-alternative-carrier-bakeoff.test.ts
  git commit -m 'feat: add alternative DOCX carrier candidates'
  ```

  Expected: the commit contains only the new candidate generator, the minimum
  transformed-inspection seam, and their focused tests.

## Task 3: Harden the transformed-DOCX read-only inspector red-first

**Files:**

- Modify: `research/experiments/docx-alternative-carrier-bakeoff-v1/inspect-transformed-docx.ts` — harden the minimum seam into the package-tolerant OOXML parser with location, marker, formatting, and safety reporting.
- Modify: `tests/documents/docx-alternative-carrier-bakeoff.test.ts` — retain the candidate tests and add transformed-package behavior tests.
- Create: `tests/research/transformed-docx-inspector.test.ts` — malformed-package, split-marker, extra-part, and safety tests.
- Do not modify: `research/experiments/docx-hidden-run-v1/inspect-carrier-docx.ts`.

- [ ] **Step 1: Write failing inspector tests for arbitrary valid OOXML**

  Add tests with these exact behaviors:

  1. Generate each candidate and assert `inspectTransformedDocx` returns both markers, the expected candidate location, the expected color/size format, and a safety object with all five arrays empty.
  2. Generate the header candidate and assert the transformed inspector reports
     `word/header1.xml`; separately run the existing
     `tests/documents/docx-hidden-run-v1.test.ts` unchanged so regression
     evidence, rather than applying the wrong profile validator to a successor
     artifact, proves the old strict inspector was not relaxed.
  3. Mutate a valid package so Alpha is split across two adjacent `w:r` elements in one paragraph; assert one Alpha occurrence with both run indices and both run formats.
  4. Add a harmless extra valid XML part and relationship to a generated package; assert the transformed inspector accepts the layout and still reports the fixed markers rather than treating the extra part as a canonical-layout error.
  5. Add `word/vbaProject.bin`, a macro-enabled content type, one external relationship, and one internal relationship whose target is absent; assert the corresponding active-content, macro, external-relationship, and unresolved-target arrays contain findings and marker presence remains independently reported.
  6. Pass bytes with a non-ZIP signature, missing `word/document.xml`, malformed XML, and malformed relationship XML; assert each call throws a stable error naming the invalid package or part.

  Use `fflate.unzipSync`, `zipSync`, `strFromU8`, and `strToU8` in the tests. The tests must not read an ignored Google Docs artifact, because a clean checkout must reproduce them from generated synthetic bytes.

- [ ] **Step 2: Run the inspector tests to verify the intended red**

  Run:

  ```bash
  pnpm test tests/research/transformed-docx-inspector.test.ts tests/documents/docx-alternative-carrier-bakeoff.test.ts tests/documents/docx-hidden-run-v1.test.ts
  ```

  Expected: Vitest discovers the tests and exits non-zero on the first
  not-yet-supported transformed-package behavior, such as a marker split across
  adjacent runs or an adversarial relationship. The candidate generator tests
  and existing strict carrier tests remain green; zero tests or a failure in an
  old carrier test is not the intended red state.

- [ ] **Step 3: Harden ZIP/XML parsing without the canonical allowlist**

  In the new inspector:

  1. Reject bytes shorter than two bytes or without `0x50, 0x4b`; call `unzipSync`; sort file entries while ignoring directory entries.
  2. Require `[Content_Types].xml`, `_rels/.rels`, and `word/document.xml`; parse every `.xml` and `.rels` entry with `DOMParser` and collect parser errors. Throw on missing required entries, parser errors, or a non-WordprocessingML `word/document.xml` root.
  3. Start with `word/document.xml`, then resolve internal relationships from `word/_rels/document.xml.rels` when present. Include every referenced WordprocessingML text part whose root is `w:hdr`, `w:ftr`, `w:footnotes`, `w:endnotes`, or `w:comments`, even when its package filename is nonstandard; also recognize the standard `word/header*.xml`, `word/footer*.xml`, `word/footnotes.xml`, `word/endnotes.xml`, and `word/comments.xml` names when present. Assign `body`, `header`, `footer`, `footnote`, `endnote`, or `comments` by the relationship/root, and use `other` only for an otherwise supported WordprocessingML text part with an unclassified name. This resolves the header candidate by its document relationship instead of depending on the old canonical filename allowlist.
  4. For every WordprocessingML paragraph, enumerate direct `w:r` children, concatenate descendant `w:t` text, and read direct `w:rPr` values for enabled `w:vanish`, `w:color/@w:val`, and numeric `w:sz/@w:val`. Preserve paragraph text and run order.
  5. Find Alpha and Beta occurrences in each paragraph's concatenated text, including overlaps across adjacent runs. For each occurrence, report marker ID, part, location, paragraph index, all overlapping run indices, and the corresponding `MarkerRunFormat` array. Report `present` when at least one occurrence exists and `absent` otherwise.
  6. Inspect all `.rels` entries for `TargetMode="External"`; report the exact relationship labels. Resolve internal relationship targets against the package entry names and report every unresolved target with its relationship label. Report relationship types ending in `/oleObject`, `/package`, `/control`, `/attachedTemplate`, or `/aFChunk`. Report entries matching `word/vbaProject.bin`, `word/vbaData.xml`, `activeX`, `embeddings`, `oleObject`, `webextensions`, `customUI`, or `customXml` case-insensitively. Report `[Content_Types].xml` values containing `macroEnabled`, `vbaProject`, `activeX`, or `oleObject`.
  7. Never reject an otherwise valid package for an unknown part, package order, missing `docProps/core.xml`, extra relationship, or header/footer part; report safety findings separately and leave interpretation to the gate.

  Use only the existing `fflate` and `@xmldom/xmldom` dependencies. Do not render documents, follow external targets, execute embedded content, write files, or mutate the input bytes.

- [ ] **Step 4: Run focused inspector tests and static checks to verify green**

  Run:

  ```bash
  pnpm test tests/research/transformed-docx-inspector.test.ts tests/documents/docx-alternative-carrier-bakeoff.test.ts tests/documents/docx-hidden-run-v1.test.ts
  pnpm lint
  pnpm typecheck
  git add -N research/experiments/docx-alternative-carrier-bakeoff-v1/inspect-transformed-docx.ts tests/research/transformed-docx-inspector.test.ts
  git diff --check
  ```

  Expected: the transformed inspector tests pass, the existing v1 strict
  inspector suite remains green without changes, split markers are located
  across runs, safety findings are independent of marker presence, and no old
  carrier file changes.

- [ ] **Step 5: Commit the inspector checkpoint**

  Run:

  ```bash
  git add research/experiments/docx-alternative-carrier-bakeoff-v1/inspect-transformed-docx.ts tests/research/transformed-docx-inspector.test.ts tests/documents/docx-alternative-carrier-bakeoff.test.ts
  git commit -m 'test: harden transformed DOCX inspection'
  ```

  Expected: the commit contains only the new inspector and its tests plus the intended additions to the new candidate test file.

## Task 4: Add reproducible candidate generation, inspection, safety tests, and command documentation

**Files:**

- Modify: `.gitignore` — add only the new bakeoff DOCX/TXT artifact patterns.
- Modify: `package.json` — add the generation and inspection bakeoff scripts without dependency changes; the validation script is added with its validator in Task 5.
- Create: `scripts/generate-docx-alternative-carrier.ts` — generate exactly one candidate source artifact and print its path/hash.
- Create: `scripts/inspect-docx-alternative-carrier.ts` — inspect one repository-relative DOCX with the transformed inspector and print JSON.
- Create: `tests/research/carrier-bakeoff-command-safety.test.ts` — cover candidate argument, path, symlink, and read-only command boundaries.
- Modify: `docs/TESTING.md` — document the bakeoff command contract and evidence boundary.
- Do not modify: `tsconfig.json`; its existing native TypeScript options already support explicit `.ts` script imports.

**Exact scripts and paths:**

```json
"research:carrier:bakeoff:generate": "node scripts/generate-docx-alternative-carrier.ts",
"research:carrier:bakeoff:inspect": "node scripts/inspect-docx-alternative-carrier.ts"
```

The generator writes exactly one of:

```text
research/artifacts/docx-alternative-carrier-bakeoff-v1/matching-color-body-v1.docx
research/artifacts/docx-alternative-carrier-bakeoff-v1/sub-legible-body-1pt-v1.docx
research/artifacts/docx-alternative-carrier-bakeoff-v1/docx-header-text-v1.docx
```

The inspector accepts exactly one repository-relative path after `--`, reads it without mutation, and prints `sha256`, `entries`, `paragraphs`, `markerPresence`, `markerOccurrences`, and `safety`. It exits non-zero for an invalid path, unreadable file, malformed package, or any non-empty safety array; it does not exit non-zero merely because the package is not accepted by the old strict allowlist.

- [ ] **Step 1: Write red command-boundary tests**

  Add tests that spawn the scripts with `process.execPath` and assert:

  - no candidate argument and an unknown candidate return non-zero with the exact generator usage string;
  - an absolute candidate output path cannot be selected through an argument or environment override;
  - an inspector path that escapes with `..`, an absolute path, a directory, and a symlink outside the repository each returns non-zero without writing outside the repository;
  - a generated candidate source can be inspected successfully and the output JSON contains both markers, the expected location/format, and empty safety arrays;
  - a package with an external relationship makes the inspector exit non-zero while still emitting a JSON safety finding;
  - the old `pnpm research:carrier:inspect -- research/artifacts/docx-hidden-run-v1/glyph-docx-hidden-run-v1-spike.docx` command remains the strict command for the old artifact.

- [ ] **Step 2: Run the command tests to verify the intended red**

  Run:

  ```bash
  pnpm test tests/research/carrier-bakeoff-command-safety.test.ts
  ```

  Expected: the file is discovered and fails because the new scripts do not exist. A passing no-match run is not evidence.

- [ ] **Step 3: Implement safe, single-candidate generation**

  `generate-docx-alternative-carrier.ts` must accept exactly one positional candidate argument after pnpm's `--` separator (Node sees only the candidate), accept only `matching-color-body-v1`, `sub-legible-body-1pt-v1`, or `docx-header-text-v1`, map only those three frozen IDs, generate bytes in memory from `CANDIDATE_FIXTURE`, create only the exact artifact directory, refuse to overwrite a symlink, write only the candidate's exact filename, compute SHA-256 with `node:crypto`, and print only `{ candidateId, artifactPath, sha256 }` as JSON. Reuse the existing repository-boundary helper only if the import is read-only and the old script remains byte-for-byte unchanged; otherwise use an identical local boundary check in the new script.

  `inspect-docx-alternative-carrier.ts` must reject absolute or escaping paths before reading, resolve symlinks before the repository-boundary check, require a regular file, call `inspectTransformedDocx` with the frozen marker pair, print the exact structural JSON fields, and set a non-zero exit status when any safety array is non-empty. Errors must contain no stack trace, credentials, account data, or user content.

- [ ] **Step 4: Add the narrow ignore rules and command documentation**

  Append exactly:

  ```gitignore
  research/artifacts/docx-alternative-carrier-bakeoff-v1/*.docx
  research/artifacts/docx-alternative-carrier-bakeoff-v1/*.txt
  ```

  Add the two generation/inspection scripts to `package.json` without changing dependency identities, versions, or the lockfile. Add `## Milestone 2B alternative carrier bakeoff commands` to `docs/TESTING.md` with this contract:

  | Command | What success proves |
  | --- | --- |
  | `pnpm research:carrier:bakeoff:generate -- matching-color-body-v1` (repeat with the other two frozen IDs) | One frozen candidate source DOCX was generated locally and its path/hash were reported. |
  | `pnpm research:carrier:bakeoff:inspect -- research/artifacts/docx-alternative-carrier-bakeoff-v1/matching-color-body-v1.docx` (repeat with the other two source paths and, after Task 5, each of the three Google Docs round-trip paths) | One valid DOCX was read-only inspected for marker presence, OOXML location/format, visible paragraphs, and active-content/relationship safety. |
  State immediately below the table that these two commands prove package structure only; the validator command is added with the Task 5 record validator and must not be invoked before the non-blocked record exists. None of these commands proves editor behavior beyond the separately recorded Google Docs observation, clipboard survival, accessibility behavior, model compliance, end-to-end survival, prompt reuse, AI authorship, direct ingestion, intent, cheating, or misconduct.

- [ ] **Step 5: Generate each source, inspect each source, and verify green**

  Run:

  ```bash
  pnpm research:carrier:bakeoff:generate -- matching-color-body-v1
  pnpm research:carrier:bakeoff:generate -- sub-legible-body-1pt-v1
  pnpm research:carrier:bakeoff:generate -- docx-header-text-v1
  pnpm research:carrier:bakeoff:inspect -- research/artifacts/docx-alternative-carrier-bakeoff-v1/matching-color-body-v1.docx
  pnpm research:carrier:bakeoff:inspect -- research/artifacts/docx-alternative-carrier-bakeoff-v1/sub-legible-body-1pt-v1.docx
  pnpm research:carrier:bakeoff:inspect -- research/artifacts/docx-alternative-carrier-bakeoff-v1/docx-header-text-v1.docx
  pnpm test tests/research/carrier-bakeoff-command-safety.test.ts
  pnpm lint
  pnpm typecheck
  git check-ignore -v research/artifacts/docx-alternative-carrier-bakeoff-v1/matching-color-body-v1.docx research/artifacts/docx-alternative-carrier-bakeoff-v1/sub-legible-body-1pt-v1.docx research/artifacts/docx-alternative-carrier-bakeoff-v1/docx-header-text-v1.docx
  git add -N scripts/generate-docx-alternative-carrier.ts scripts/inspect-docx-alternative-carrier.ts tests/research/carrier-bakeoff-command-safety.test.ts
  git diff --check
  ```

  Expected: each source inspector reports both markers and the candidate-specific location/format; all source safety arrays are empty; candidate C is accepted by the transformed inspector despite its header entries; all generated files are ignored; safety/path tests, lint, and typecheck pass.

- [ ] **Step 6: Commit the command checkpoint**

  Run:

  ```bash
  git add .gitignore package.json docs/TESTING.md scripts/generate-docx-alternative-carrier.ts scripts/inspect-docx-alternative-carrier.ts tests/research/carrier-bakeoff-command-safety.test.ts
  git commit -m 'chore: add alternative carrier bakeoff commands'
  ```

  Expected: the commit contains no generated DOCX/TXT file and no package or lockfile dependency addition.

## Task 5: Add the record validator, execute the shared Google Docs protocol, and record the matrix

**Files:**

- Create: `scripts/validate-docx-alternative-carrier-run.ts` — dependency-free exact-schema and hash validator for the non-blocked run record.
- Create: `research/experiments/docx-alternative-carrier-bakeoff-v1/run-001.json` — actual candidate observations, matrix, limitations, and exactly one gate decision; create only after every candidate has a completed, inspectable round-trip DOCX.
- Create: `tests/research/carrier-bakeoff-record.test.ts` — validate closed candidate order, enum values, schema shape, and gate preconditions without reading real user data.
- Modify: `package.json` — add the validator script only after the validator exists.
- Modify: `docs/TESTING.md` — add the validator row to the Task 4 bakeoff command table after the validator exists.
- Do not modify: `research/experiments/docx-alternative-carrier-bakeoff-v1/protocol.md` after Task 1's pre-observation commit.
- Local ignored outputs: the three source DOCX files, three Google Docs export DOCX files, and three Google Docs copy `.txt` files under `research/artifacts/docx-alternative-carrier-bakeoff-v1/`.

**Validator contract:**

`validate-docx-alternative-carrier-run.ts` reads only `research/experiments/docx-alternative-carrier-bakeoff-v1/run-001.json` and the referenced local artifact paths. It asserts exact top-level key order-independent equality, exact experiment/profile/marker/fixture constants, exactly three candidates and matrix rows in `CANDIDATE_ORDER`, `completed` status plus a non-null transformed inspection and artifact for every round-trip DOCX workflow, allowed clipboard statuses and observation enums, non-empty reasons for failed/not-run clipboard workflows, lowercase 64-character hashes, result-artifact paths inside the ignored bakeoff directory without `..`, source/round-trip safety arrays represented exactly, a valid `selectedCandidateId` only for `SELECT_CANDIDATE`, and that every recorded source/result artifact hash matches its file. It exits non-zero on every mismatch and never maps invalid JSON, a malformed package, or an uninspectable workflow to `absent`.

- [ ] **Step 1: Write failing record-shape tests and validator tests**

  Create tests using in-memory valid records and temporary synthetic artifacts. Assert:

  - a record with a fourth candidate, reordered candidates, a misspelled gate, a missing failure reason, an uppercase hash, an artifact path outside the bakeoff directory, or a selected ID under `NO_VIABLE_DOCX_CARRIER` fails;
  - a `SELECT_CANDIDATE` record with two candidates satisfying the mandatory conditions fails the gate precondition;
  - any observation set with a `not_run`, `failed`, missing-artifact, malformed,
    or otherwise uninspectable candidate round-trip is rejected for record
    creation as operationally blocked; no scientific decision can be validated
    without three completed, inspectable round-trip DOCX results;
  - a complete synthetic schema with one selected candidate and matching hashes passes.

- [ ] **Step 2: Run the focused record tests to verify the intended red**

  Run:

  ```bash
  pnpm test tests/research/carrier-bakeoff-record.test.ts
  ```

  Expected: the file is discovered and fails because the validator and run-record types/helpers do not yet exist. The test must not pass by discovering zero tests.

- [ ] **Step 3: Implement the dependency-free validator**

  Use only `node:crypto`, `node:fs/promises`, `node:path`, and ordinary assertions. Keep the validator independent of the browser and product code. For every candidate, validate the exact `mechanism` and `documentProfile` mapping:

  ```text
  matching-color-body-v1     -> ordinary-body-color-FFFFFF -> docx-matching-color-body-v1
  sub-legible-body-1pt-v1    -> ordinary-body-size-1pt    -> docx-sub-legible-body-1pt-v1
  docx-header-text-v1        -> ordinary-header-text      -> docx-header-text-v1
  ```

  Require `selectedCandidateId` to equal the sole body candidate satisfying all seven `SELECT_CANDIDATE` conditions, or `null` for the other two gate values. Require `gateRationale` and `limitations` to be non-empty factual string arrays. Reject account identifiers, cloud URLs, credential-shaped values, and raw response-like fields by key name before accepting the record.

  Add this package script only after the validator file exists:

  ```json
  "research:carrier:bakeoff:validate": "node scripts/validate-docx-alternative-carrier-run.ts"
  ```

  Add this row to the existing `## Milestone 2B alternative carrier bakeoff commands` table in `docs/TESTING.md`:

  | `pnpm research:carrier:bakeoff:validate` | The non-blocked machine-readable bakeoff record matches the frozen schema and artifact hashes. |

- [ ] **Step 4: Run validator tests and static checks to verify green**

  Run:

  ```bash
  pnpm test tests/research/carrier-bakeoff-record.test.ts
  pnpm lint
  pnpm typecheck
  git add -N scripts/validate-docx-alternative-carrier-run.ts tests/research/carrier-bakeoff-record.test.ts
  git diff --check
  ```

  Expected: schema and gate-precondition tests pass; no source file from the abandoned experiment changes.

- [ ] **Step 5: Commit the pre-observation validator infrastructure**

  Run:

  ```bash
  git add scripts/validate-docx-alternative-carrier-run.ts tests/research/carrier-bakeoff-record.test.ts package.json docs/TESTING.md
  git commit -m 'chore: add carrier bakeoff record validation'
  ```

  Expected: the durable tree is clean; the commit contains only the validator,
  its tests, its package command, and the matching `docs/TESTING.md` row. It
  contains no run record or generated artifact and precedes every manual
  observation.

- [ ] **Step 6: Capture pre-observation provenance and confirm all three source artifacts**

  Run and record:

  ```bash
  date +%F
  git rev-parse HEAD
  git status --short
  node --version
  pnpm --version
  pnpm list docx --depth 0
  sw_vers
  for bakeoff_candidate in matching-color-body-v1 sub-legible-body-1pt-v1 docx-header-text-v1; do
    pnpm research:carrier:bakeoff:generate -- "$bakeoff_candidate"
    pnpm research:carrier:bakeoff:inspect -- research/artifacts/docx-alternative-carrier-bakeoff-v1/${bakeoff_candidate}.docx
    shasum -a 256 research/artifacts/docx-alternative-carrier-bakeoff-v1/${bakeoff_candidate}.docx
  done
  ```

  Expected: the durable tree is clean at the committed pre-observation source
  and validator revision;
  all three canonical artifacts are freshly generated from that revision, and
  their source hashes and transformed-inspector summaries are captured before
  any editor opens a file. Source visible body is exact, source marker
  locations/formats match the candidate table, and all source safety arrays are
  empty. These exact bytes and hashes remain frozen once the first manual
  observation begins; any necessary regeneration becomes a new artifact/run.

- [ ] **Step 7: Execute the same Google Docs protocol for all three candidates**

  For each candidate in `CANDIDATE_ORDER`, upload only its source DOCX into a new unshared Google Docs document, follow the seven frozen protocol steps, and, when an export or copy completes, save it to the corresponding path:

  ```text
  research/artifacts/docx-alternative-carrier-bakeoff-v1/matching-color-body-v1-google-docs-roundtrip.docx
  research/artifacts/docx-alternative-carrier-bakeoff-v1/matching-color-body-v1-google-docs-copy-plain-text.txt
  research/artifacts/docx-alternative-carrier-bakeoff-v1/sub-legible-body-1pt-v1-google-docs-roundtrip.docx
  research/artifacts/docx-alternative-carrier-bakeoff-v1/sub-legible-body-1pt-v1-google-docs-copy-plain-text.txt
  research/artifacts/docx-alternative-carrier-bakeoff-v1/docx-header-text-v1-google-docs-roundtrip.docx
  research/artifacts/docx-alternative-carrier-bakeoff-v1/docx-header-text-v1-google-docs-copy-plain-text.txt
  ```

  For each export, run only the transformed inspector. The old strict inspector
  remains unchanged and is reserved for the old v1 canonical artifact:

  ```bash
  for bakeoff_candidate in matching-color-body-v1 sub-legible-body-1pt-v1 docx-header-text-v1; do
    bakeoff_roundtrip_path="research/artifacts/docx-alternative-carrier-bakeoff-v1/${bakeoff_candidate}-google-docs-roundtrip.docx"
    pnpm research:carrier:bakeoff:inspect -- "$bakeoff_roundtrip_path"
    shasum -a 256 "$bakeoff_roundtrip_path"
  done
  ```

  For each plain-text file, record its hash and search results without treating a no-match as a test pass:

  ```bash
  for bakeoff_candidate in matching-color-body-v1 sub-legible-body-1pt-v1 docx-header-text-v1; do
    bakeoff_copy_path="research/artifacts/docx-alternative-carrier-bakeoff-v1/${bakeoff_candidate}-google-docs-copy-plain-text.txt"
    shasum -a 256 "$bakeoff_copy_path"
    rg --fixed-strings 'GLYPH TEST MARKER ALPHA' "$bakeoff_copy_path"
    alpha_status=$?
    test "$alpha_status" -le 1
    rg --fixed-strings 'GLYPH TEST MARKER BETA' "$bakeoff_copy_path"
    beta_status=$?
    test "$beta_status" -le 1
    for bakeoff_visible_paragraph in \
      'Read the passage below. Then summarize its main idea in two sentences.' \
      'A neighborhood library extended its weekend hours so more residents could use its study rooms and book collection.' \
      'Explain one possible benefit of the schedule change. Then explain one possible drawback.'; do
      rg --fixed-strings "$bakeoff_visible_paragraph" "$bakeoff_copy_path"
      visible_status=$?
      test "$visible_status" -le 1
    done
  done
  ```

  Record the visible body paragraphs before and after export, ordinary
  visibility, marker presence independently for Alpha/Beta, marker locations
  and formats from the transformed inspector, safety findings, clipboard marker
  presence, deviations, and limitations. If Google Docs is unavailable, any
  candidate export is unexecuted, or any returned file cannot be structurally
  inspected, stop operationally as `BLOCKED` without creating the JSON record
  or making a gate commit. A clipboard failure may be recorded while retaining
  a completed DOCX comparison.

- [ ] **Step 8: Build the candidate matrix and apply the frozen gate mechanically**

  Create exactly three ordered `matrix` rows. Populate source and round-trip
  location/format arrays from the transformed inspector, not from visual
  assumptions. Use `not_assessable` plus a non-empty failure reason only for an
  unavailable clipboard observation. Apply the gate in this order:

  1. Confirm all three candidate round-trips have status `completed`, a
     non-null result artifact, and a non-null transformed inspection. If any
     candidate is `failed`, `not_run`, missing, malformed, or uninspectable,
     stop as operationally `BLOCKED` without creating the record.
  2. Count body candidates satisfying all seven mandatory `SELECT_CANDIDATE` conditions. If the count is exactly one, use `SELECT_CANDIDATE` and set `selectedCandidateId` to that ID.
  3. If the count is zero and any completed round-trip shows a bounded survival, presentation, location, formatting, or tie result covered by `REVISE_CANDIDATE`, use `REVISE_CANDIDATE` and set `selectedCandidateId` to `null`.
  4. If all three completed, inspectable round-trips have no bounded evidence
     for revision, use `NO_VIABLE_DOCX_CARRIER` and set
     `selectedCandidateId` to `null`.

  Keep the rationale carrier-only. State explicitly that candidate selection is limited to the tested Google Docs import/export and ordinary-view conditions and that clipboard results are secondary unless separately stated.

- [ ] **Step 9: Validate the record and commit the observation result**

  Run:

  ```bash
  pnpm research:carrier:bakeoff:validate
  pnpm test tests/research/carrier-bakeoff-record.test.ts
  ```

  Expected: the validator proves exact schema, candidate order, safety summaries, gate preconditions, and every retained artifact hash. If the run is operationally blocked, this command must not be run and no JSON record or result commit may be created.

  Commit only the durable observation record:

  ```bash
  git add research/experiments/docx-alternative-carrier-bakeoff-v1/run-001.json
  git commit -m 'research: record alternative carrier bakeoff run 001'
  ```

  Expected: no DOCX/TXT artifact is staged; the old `ABANDON CURRENT CARRIER` record remains byte-for-byte unchanged.

## Task 6: Run full verification, provenance/privacy audits, and stop at the bakeoff gate

**Files:**

- No new source files.
- No changes to the abandoned `docx-hidden-run-v1` experiment or its artifacts.

- [ ] **Step 1: Run the complete authoritative software checks**

  Run:

  ```bash
  pnpm install --frozen-lockfile
  pnpm lint
  pnpm typecheck
  pnpm test
  pnpm build
  ```

  Expected: the original foundation tests, original strict carrier tests, candidate generator tests, transformed-inspector tests, command-safety tests, and record tests all pass; the frozen lockfile installs without dependency changes; build succeeds.

- [ ] **Step 2: Re-inspect the old canonical artifact and all new source/round-trip artifacts**

  Run:

  ```bash
  pnpm research:carrier:inspect -- research/artifacts/docx-hidden-run-v1/glyph-docx-hidden-run-v1-spike.docx
  for bakeoff_candidate in matching-color-body-v1 sub-legible-body-1pt-v1 docx-header-text-v1; do
    bakeoff_source_path="research/artifacts/docx-alternative-carrier-bakeoff-v1/${bakeoff_candidate}.docx"
    bakeoff_roundtrip_path="research/artifacts/docx-alternative-carrier-bakeoff-v1/${bakeoff_candidate}-google-docs-roundtrip.docx"
    pnpm research:carrier:bakeoff:inspect -- "$bakeoff_source_path"
    if test -f "$bakeoff_roundtrip_path"; then
      pnpm research:carrier:bakeoff:inspect -- "$bakeoff_roundtrip_path"
    fi
  done
  pnpm research:carrier:bakeoff:validate
  ```

  Expected: the old strict command still reports its original canonical structure; the new inspector reports candidate-specific source and transformed locations/formats without changing the old allowlist; all retained round-trip packages have independent safety results; record hashes still match.

- [ ] **Step 3: Audit scope, artifacts, secrets, and immutable evidence**

  Run:

  ```bash
  git diff --check
  git status --short --ignored
  git ls-files | rg 'research/artifacts/(docx-hidden-run-v1|docx-alternative-carrier-bakeoff-v1)/.*\.(docx|txt)$'
  git diff b9677ca -- research/experiments/docx-hidden-run-v1/run-001.json research/experiments/docx-hidden-run-v1/protocol.md research/experiments/docx-hidden-run-v1/fixture.ts research/experiments/docx-hidden-run-v1/inspect-carrier-docx.ts src/documents/docx/docx-hidden-run-v1.ts tests/documents/docx-hidden-run-v1.test.ts
  rg -n --hidden '(BEGIN [A-Z ]*PRIVATE KEY|DATABASE_URL=|SUPABASE_[A-Z_]+=|API_KEY=|SECRET_KEY=|cloud.google.com|docs.google.com/document)' package.json src tests scripts research/experiments docs/TESTING.md .gitignore tsconfig.json
  rg -n -i 'OpenAI|Anthropic|Gemini|ChatGPT|FingerprintEngine|ExactCanary|Supabase|Protect Assignment|Analyze Submission' src tests scripts research/experiments/docx-alternative-carrier-bakeoff-v1
  ```

  Expected: no DOCX/TXT path is tracked, the old experiment diff is empty, no secret/account/URL-shaped content is present, and no model, persistence, fingerprint, or product workflow code was added. Documentation prohibitions are reviewed as prose, not executed behavior.

- [ ] **Step 4: Review the full diff and stop at the one recorded gate**

  Run:

  ```bash
  git diff --stat b9677ca..HEAD
  git diff --name-only b9677ca..HEAD
  git status --short
  ```

  Expected: every durable changed path belongs to this bakeoff plan's task list; the final durable evidence is the protocol, fixture, generator, transformed inspector, tests, commands, documentation, validator, and non-blocked `run-001.json`. Stop after `SELECT_CANDIDATE`, `REVISE_CANDIDATE`, or `NO_VIABLE_DOCX_CARRIER`. Do not implement a fingerprint engine, change `docx-hidden-run-v1`, begin Experiment B/C, or open/push/merge a pull request without separate authorization.

## Plan Self-Review

Before execution approval, check the following against the authoritative documents and this plan:

1. The existing `b9677ca` run and `ABANDON CURRENT CARRIER` decision remain immutable.
2. Exactly three candidates exist, in one fixed order, with one mechanism and one source artifact each.
3. Matching-color body text, one fixed one-point body size, and one ordinary default header are specified with exact OOXML formatting and placement.
4. All candidates use the exact two fixed markers and the exact three-paragraph visible fixture.
5. The old strict canonical inspector is preserved and tested unchanged; transformed packages use a separate read-only inspector.
6. The transformed inspector reports arbitrary valid package entries, marker part/location, run formatting, visible paragraph text, and safety findings without executing package content.
7. Google Docs is the same material workflow for every candidate, with one new unshared document per candidate and no added converter.
8. Source structure, ordinary view, exported DOCX, and plain-text copy are separate observations; a no-match is not a pass.
9. The matrix has exact candidate rows and machine-readable marker/location/format/safety fields.
10. The pre-observation rule yields only `SELECT_CANDIDATE`, `REVISE_CANDIDATE`, or `NO_VIABLE_DOCX_CARRIER` for non-blocked runs, while a missing material editor result remains operationally blocked.
11. Marker values, visible fixture, carrier/document profiles, fingerprint fields, and experiment schema remain distinct version axes.
12. No dependencies, model APIs, persistence, application routes, uploads, fingerprint strategy, or product claims are introduced.
13. Ignored artifacts are limited to the exact new directory, and no generated artifact is committed.
14. Every task has a red-first test or pre-observation documentation gate, exact paths/interfaces/commands, expected failure and pass states, and a local commit boundary.
15. The final result is an evidence-bounded research decision, never a claim of authorship, ingestion, prompt reuse, cheating, misconduct, compatibility, or pilot safety.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-31-milestone-2b-alternative-carrier-bakeoff.md`. Execute it only after explicit approval of the pre-observation protocol. Use `superpowers:subagent-driven-development` for one fresh worker per task with review between tasks, or `superpowers:executing-plans` for inline execution with the same commit checkpoints. Keep all work local; no push, merge, publication, or pull request is included in this plan.
