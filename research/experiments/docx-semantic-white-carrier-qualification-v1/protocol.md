# Milestone 2C Semantic-White Carrier Qualification Protocol

Status: frozen before source generation or observation, 2026-09-02

## Decision

Milestone 2C will run one separately versioned qualification experiment for a
Candidate-A-derived DOCX carrier:

- candidate ID: `matching-color-body-v2`
- document profile: `docx-matching-color-body-v2`
- qualification profile: `docx-semantic-white-carrier-qualification-v1`
- experiment ID: `glyph-exp-a-docx-semantic-white-carrier-qualification-v1-001`
- experiment schema version: `1`

The experiment qualifies document transport and ordinary presentation only. A
positive result permits Milestone 3 research to begin with this document
profile. It does not establish accessibility safety, pilot readiness,
production readiness, AI ingestion, model compliance, authorship, prompt reuse,
intent, cheating, or misconduct.

Milestone 2 and Milestone 2B remain immutable historical experiments. This
experiment does not modify their protocols, fixtures, generators, inspectors,
records, or artifacts.

## Why this approach

Milestone 2B found bounded evidence for Candidate A: both markers survived the
Google Docs DOCX round trip and plain-text copy, the ordinary body appeared
normal, and selection revealed the markers. The recorded gate was
`REVISE_CANDIDATE` because Google Docs normalized direct color from uppercase
`FFFFFF` to lowercase `ffffff` while the frozen gate required byte-case equality.

Milestone 2C tests the smallest justified revision. It preserves the direct
white body-run mechanism and changes only the acceptance rule from lexical case
equality to semantic direct-white equivalence. It adds Microsoft Word as an
independent required editor workflow. It does not introduce a style-based
carrier, theme color, adaptive background color, hidden text, another candidate,
or a general carrier framework.

Rejected alternatives are:

1. A named white character style. This adds style-table resolution and more
   transformation paths without evidence that a style is needed.
2. Theme-derived or background-aware color. This can change with themes and
   conflicts with deterministic structural inspection.
3. Reusing `matching-color-body-v1` and changing its gate in place. This would
   rewrite a completed experiment instead of preserving scientific provenance.

## Frozen fixture and marker placement

The new fixture imports, rather than duplicates, these frozen values from
`research/experiments/docx-hidden-run-v1/fixture.ts`:

- visible fixture ID: `synthetic-library-hours-v1`
- Alpha: `GLYPH TEST MARKER ALPHA`
- Beta: `GLYPH TEST MARKER BETA`
- the same three visible body paragraphs

The source DOCX contains the same run order used by Candidate A:

- Alpha is body paragraph 0, run 1.
- Beta is body paragraph 2, run 1.
- Removing marker runs yields the three frozen visible paragraphs exactly and
  in order.

Each marker is ordinary body text with one direct color property:
`w:color w:val="FFFFFF"`. The generator adds no other hiding-related mechanism.

## Semantic direct-white contract

A source or transformed marker occurrence satisfies the v2 carrier mechanism
only when every overlapping marker run meets all of these conditions:

1. It is in `word/document.xml` body content at the frozen paragraph.
2. It has a direct `w:color` element.
3. `w:color/@w:val` is exactly six hexadecimal digits and equals `FFFFFF`
   case-insensitively. Therefore `FFFFFF` and `ffffff` are equivalent.
4. The color is not `auto`, missing, abbreviated, prefixed with `#`, non-white,
   or derived from `w:themeColor`, `w:themeTint`, or `w:themeShade`.
5. It has no enabled `w:vanish`, direct `w:sz`, direct `w:szCs`, `w:shd`, or
   `w:highlight` hiding-related property.

Benign editor-added package content and run properties are tolerated when the
existing transformed-DOCX safety checks remain clean and the rules above still
hold. This prevents a transformed package from failing merely because an editor
normalizes XML case or adds unrelated ordinary metadata.

The existing Milestone 2 strict canonical inspector is not changed or weakened.
The Milestone 2B transformed inspector remains the shared read-only source for
marker locations, visible paragraphs, and package-safety findings. A new v2
qualification inspector adds only the semantic direct-white decision needed by
this experiment.

## Canonical artifact and immutability

The ignored artifact directory is:

`research/artifacts/docx-semantic-white-carrier-qualification-v1/`

The canonical source path is:

`research/artifacts/docx-semantic-white-carrier-qualification-v1/matching-color-body-v2.docx`

The canonical generator must refuse to replace any existing file, including a
regular file or symbolic link. Automated generator tests use temporary
directories and never write the canonical path. After the canonical artifact is
generated once, its SHA-256 is recorded before either editor is opened. Any
hash discrepancy stops the run; the artifact is never regenerated in place.

## Independent editor workflows

The same frozen canonical source is imported independently into:

1. Google Docs in current desktop Chrome on macOS.
2. Microsoft Word for Mac.

The Word output is never imported into Google Docs, and the Google Docs output
is never imported into Word. Each workflow uses a new unshared document and
records observable application, browser, operating-system, and build versions.
No account identity, document URL, or private browser state is recorded.

### Google Docs workflow

1. Create a new unshared Google Docs document and import the canonical source.
2. At 100% document zoom in the default paginated white-page view, record the
   three visible paragraphs, marker ordinary visibility, and layout disturbance
   before selecting, searching, inspecting, or using an accessibility surface.
3. Export Microsoft Word DOCX to
   `matching-color-body-v2-google-docs-roundtrip.docx`.
4. Click in the ordinary body, select the body once, copy once, paste as UTF-8
   plain text, and save
   `matching-color-body-v2-google-docs-copy-plain-text.txt`.
5. Record whether selection reveals either marker.

Desktop Google Docs has no native dark-page mode in the defined environment and
no built-in accessibility checker comparable to Word's. Those items are
recorded as `not_assessable`, not inferred and not emulated with an extension,
browser flag, global display change, or custom stylesheet.

### Microsoft Word workflow

1. Open the canonical source as a new local document without using either
   transformed artifact.
2. At 100% zoom in ordinary light-page view, record the three visible
   paragraphs, marker ordinary visibility, and layout disturbance before
   selecting, searching, inspecting, or running Accessibility Assistant.
3. Use Word's built-in dark page/canvas mode and record marker visibility and
   layout disturbance at 100%.
4. Save a DOCX copy to
   `matching-color-body-v2-microsoft-word-roundtrip.docx`.
5. Return to ordinary body content, select the body once, copy once, paste as
   UTF-8 plain text, and save
   `matching-color-body-v2-microsoft-word-copy-plain-text.txt`.
6. Record whether selection reveals either marker.
7. After all primary transport and presentation observations, run Word's
   built-in Accessibility Assistant and record its relevant factual findings.

Accessibility Assistant findings do not determine the transport gate. They are
retained as evidence for the later accessibility qualification and may prevent
the profile from being described as production-ready.

## Required evidence and artifact inspection

After each editor workflow, record SHA-256 for its DOCX and plain-text output.
The v2 inspector examines the source and both DOCX round trips and records:

- marker presence;
- OOXML part, location, paragraph, and overlapping run indexes;
- direct color value and semantic-white result;
- forbidden hiding-related properties;
- the three visible body paragraphs after marker removal;
- external relationships, unresolved targets, active content, active
  relationship types, and macro content types.

Each copied-text artifact is inspected independently for Alpha, Beta, and the
three visible paragraphs after marker removal. A filename, successful download,
or visual impression is never substituted for structural inspection.

Required human observations are:

- Google Docs default-view marker visibility and layout at 100%;
- Word light-page marker visibility and layout at 100%;
- Word built-in dark-page marker visibility and layout at 100%;
- selection reveal in both editors;
- whether each body copy visibly selected or included the intended body;
- Word Accessibility Assistant findings, or a factual `not_assessable` reason.

If reliable automation cannot make a required visual, upload, export, save, or
clipboard observation, the run is `BLOCKED`. No observation is fabricated and
no scientific gate value is assigned.

## Run record

The versioned JSON record contains exactly one candidate and separates:

- provenance and frozen identifiers;
- canonical source artifact and inspection;
- Google Docs round-trip and clipboard evidence;
- Microsoft Word round-trip and clipboard evidence;
- light/dark/selection presentation observations;
- deferred and observed accessibility information;
- safety results;
- deviations and limitations;
- the mechanically validated gate result.

The record permits only the declared fields and enumerated observation values.
It stores no account identifier, document URL, credential, prompt, student
work, or response. Fixed research marker values appear only where the frozen
research schema requires them and are never logged by application code.

## Mechanical gate

An incomplete or unreliable required editor workflow is operationally
`BLOCKED`. `BLOCKED` is not written as a scientific gate decision.

With complete, inspectable evidence, the only gate decisions are:

- `PROCEED`
- `REVISE_CARRIER`
- `ABANDON_CARRIER`

`PROCEED` requires every condition below:

1. The canonical source passes its strict v2 structural contract and is
   safety-clean.
2. Both independent DOCX round trips are valid and safety-clean.
3. Both Alpha and Beta remain in the body at their frozen paragraphs in both
   round trips.
4. Every overlapping marker run in both round trips satisfies semantic
   direct-white and contains no forbidden hiding-related property.
5. Both round trips preserve all three visible body paragraphs exactly after
   marker removal.
6. Neither marker is visible in Google Docs default white-page view, Word light
   view, or Word built-in dark-page view before selection or explicit exposure.
7. No material layout disturbance is observed in those required views.
8. Both clipboard artifacts contain Alpha and Beta and preserve all three
   visible paragraphs exactly after marker removal.

Selection reveal is recorded but is not disqualifying. Google Docs desktop dark
mode and screen-reader behavior are outside this gate.

`REVISE_CARRIER` applies when the evidence is complete, `PROCEED` fails, and at
least one independent editor's DOCX round trip or clipboard result preserves
both markers together with the visible body. This includes case-independent
white transport with a bounded presentation, formatting, clipboard, or
cross-editor failure worth a separately versioned revision.

`ABANDON_CARRIER` applies when the evidence is complete, `PROCEED` fails, and
neither editor provides bounded evidence that preserves both markers together
with the visible body in a DOCX round trip or clipboard result.

Any further tuning requires a new candidate ID, document profile, qualification
profile or experiment ID as applicable. No result changes this v2 definition in
place.

## Accessibility and production boundary

Milestone 2C deliberately does not claim strict accessibility safety. It records
Word Accessibility Assistant output, but it does not run VoiceOver or another
screen reader and cannot establish whether markers are announced, affect
navigation, or create confusing reading order.

Before Protect, pilot use, or any production-ready claim, a separate approved
accessibility qualification must cover screen-reader exposure in the supported
editor/platform matrix and resolve any contrast or unexpected-content findings.
The transport gate cannot waive that later requirement.

## Implementation boundaries

Implementation adds only the versioned fixture, generator, qualification
inspector, safe local commands, run-record validator, tests, protocol, testing
documentation, and progress ledger needed for this experiment. It reuses the
existing transformed inspector and installed dependencies.

It does not begin FingerprintEngine, marker generation, ExactCanary, semantic
canaries, model testing, Supabase, persistence, Protect, Analyze,
authentication, deployment, or UI work.

## Verification

Verification includes:

- red-green tests for the v2 canonical generator and semantic-white inspector;
- uppercase and lowercase direct-white acceptance;
- rejection of missing, `auto`, theme-derived, abbreviated, prefixed,
  non-white, hidden, size-based, shaded, and highlighted marker runs;
- split-run marker handling;
- command path, symlink, overwrite, and canonical-artifact safety;
- exact run-record shape and mechanical gate tests;
- source and transformed artifact/hash validation;
- old-carrier and Milestone 2B regression and immutability checks;
- lint, typecheck, full tests, and build;
- secret/privacy, generated-artifact, full-diff, status, and milestone-leakage
  audits.

Generated DOCX and copied-text artifacts remain ignored and are never committed.
The protocol and validator are committed before canonical generation and before
either editor workflow begins.

## Machine-readable run-record schema

The JSON run record contains exactly the fields declared below and no additional
properties. `BLOCKED` is an operational state outside this schema.

```typescript
type SHA256 = string;
type ArtifactEvidence = Readonly<{ path: string; sha256: SHA256 }>;
type ApplicationEvidence = Readonly<{ name: string; version: string | null }>;
type PlatformEvidence = Readonly<{
  name: string;
  version: string | null;
  build: string | null;
}>;
type MarkerPresence = "present" | "absent";
type VisibleBody = "preserved" | "changed" | "lost" | "not_assessable";
type OrdinaryVisibility = "not_visible" | "visible" | "not_assessable";
type LayoutDisturbance =
  | "none_observed"
  | "minor"
  | "material"
  | "not_assessable";
type RevealObservation =
  | "revealed"
  | "not_revealed"
  | "not_assessable";

type SafetyEvidence = Readonly<{
  externalRelationships: readonly string[];
  unresolvedRelationshipTargets: readonly string[];
  activeContentEntries: readonly string[];
  activeRelationshipTypes: readonly string[];
  macroContentTypes: readonly string[];
}>;

type MechanismEvidence = Readonly<{
  markerId: "alpha" | "beta";
  partName: string;
  location: "body" | "header" | "footer" | "footnote" | "endnote" | "comments" | "other";
  paragraphIndex: number;
  runIndex: number;
  directColorValue: string | null;
  themeColor: string | null;
  themeTint: string | null;
  themeShade: string | null;
  hidden: boolean;
  sizeHalfPoints: number | null;
  sizeComplexScriptHalfPoints: number | null;
  shadingFill: string | null;
  highlight: string | null;
  semanticDirectWhite: boolean;
  forbiddenProperties: readonly string[];
}>;

type DocxEvidence = Readonly<{
  status: "completed";
  sourceArtifactSha256: SHA256;
  resultArtifact: ArtifactEvidence;
  markerPresence: Readonly<{ alpha: MarkerPresence; beta: MarkerPresence }>;
  visibleBody: VisibleBody;
  visibleBodyParagraphs: readonly string[];
  markerMechanisms: readonly MechanismEvidence[];
  safety: SafetyEvidence;
  protocolDeviation: string | null;
  notes: readonly string[];
}>;

type CopyEvidence = Readonly<{
  status: "completed";
  sourceArtifactSha256: SHA256;
  resultArtifact: ArtifactEvidence;
  markerPresence: Readonly<{ alpha: MarkerPresence; beta: MarkerPresence }>;
  visibleBody: VisibleBody;
  visibleBodyParagraphs: readonly string[];
  protocolDeviation: string | null;
  notes: readonly string[];
}>;

type ViewEvidence = Readonly<{
  zoomPercent: 100;
  ordinaryVisibility: OrdinaryVisibility;
  layoutDisturbance: LayoutDisturbance;
  visibleBody: VisibleBody;
  notes: readonly string[];
}>;

type SourceGeneratorRecord = Readonly<{
  path: "src/documents/docx/docx-matching-color-body-v2.ts";
  gitCommit: string;
  nodeVersion: string;
  pnpmVersion: string;
  docxVersion: "9.7.1";
}>;

type CanonicalEvidence = ArtifactEvidence & Readonly<{
  markerPresence: Readonly<{ alpha: MarkerPresence; beta: MarkerPresence }>;
  visibleBodyParagraphs: readonly string[];
  markerMechanisms: readonly MechanismEvidence[];
  safety: SafetyEvidence;
}>;

type GoogleDocsEvidence = Readonly<{
  application: ApplicationEvidence & Readonly<{ name: "Google Docs" }>;
  browser: ApplicationEvidence & Readonly<{ name: "Google Chrome" }>;
  platform: PlatformEvidence;
  documentRule: "one new unshared document";
  sourceArtifactSha256: SHA256;
  defaultView: ViewEvidence;
  darkView: "not_assessable";
  docxRoundtrip: DocxEvidence;
  plainTextCopy: CopyEvidence;
  selectionReveal: RevealObservation;
  screenReader: "not_assessable";
  limitations: readonly string[];
}>;

type MicrosoftWordEvidence = Readonly<{
  application: ApplicationEvidence & Readonly<{ name: "Microsoft Word" }>;
  platform: PlatformEvidence;
  documentRule: "open canonical source independently";
  sourceArtifactSha256: SHA256;
  lightView: ViewEvidence;
  darkView: ViewEvidence;
  docxRoundtrip: DocxEvidence;
  plainTextCopy: CopyEvidence;
  selectionReveal: RevealObservation;
  accessibilityAssistant: Readonly<{
    status: "completed" | "not_assessable";
    findings: readonly string[];
    limitations: readonly string[];
  }>;
  screenReader: "not_assessable";
  limitations: readonly string[];
}>;

type QualificationRunRecord = Readonly<{
  experimentId: typeof EXPERIMENT_ID;
  experimentSchemaVersion: 1;
  date: `${number}-${number}-${number}`;
  qualificationProfile: typeof QUALIFICATION_PROFILE;
  candidateId: typeof CANDIDATE_ID;
  documentProfile: typeof DOCUMENT_PROFILE;
  fingerprintStrategy: null;
  fingerprintStrategyVersion: null;
  matchingProfile: null;
  fixedMarkers: Readonly<{ alpha: string; beta: string }>;
  visibleFixture: Readonly<{ id: string; sourcePath: string }>;
  sourceGenerator: SourceGeneratorRecord;
  canonicalArtifact: CanonicalEvidence;
  googleDocs: GoogleDocsEvidence;
  microsoftWord: MicrosoftWordEvidence;
  gateDecision: "PROCEED" | "REVISE_CARRIER" | "ABANDON_CARRIER";
  gateRationale: readonly string[];
  limitations: readonly string[];
}>;
```
