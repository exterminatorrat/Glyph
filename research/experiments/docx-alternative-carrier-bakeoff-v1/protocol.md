# Experiment A successor: DOCX alternative-carrier bakeoff v1

Status: frozen before source generation or observation

This protocol defines a research-only comparison of three ordinary-text DOCX
carrier candidates after the recorded abandonment of `docx-hidden-run-v1`.
It asks whether fixed marker content survives the same Google Docs import/export
and plain-text-copy workflows while the visible synthetic fixture remains intact.
It does not test model compliance, prompt reuse, authorship, direct AI ingestion,
student intent, cheating, academic misconduct, or pilot readiness. A carrier
result is evidence about the named workflow only.

The candidate order, fixture, marker values, source artifact paths, observation
vocabulary, matrix, record schema, and gate are frozen in this document before
any source artifact is generated or any Google Docs document is opened. A
protocol deviation is recorded, not silently repaired after observing results.

The previous `docx-hidden-run-v1` experiment, its protocol, fixture,
generator, strict inspector, run record, and artifacts are immutable. This
successor specification does not rewrite the approved product, MVP,
architecture, security, testing, or experimental framework documents and does
not authorize Milestone 3, fingerprint generation, persistence, Protect,
Analyze, model testing, or deployment.

Use synthetic content only. Do not place actual student work, assignment
prompts, student identity, school records, credentials, account identifiers,
cloud document URLs, private browser state, model-account data, or raw
responses in source, tests, artifacts, logs, notes, or Git. Do not record a
Google account identity or document URL.

## Frozen identifiers and candidate order

| Field | Frozen value |
| --- | --- |
| Experiment ID | `glyph-exp-a-docx-alternative-carrier-bakeoff-v1-001` |
| Experiment schema version | `1` |
| Bakeoff profile | `docx-alternative-carrier-bakeoff-v1` |
| Visible fixture ID | `synthetic-library-hours-v1` |
| Fixed Alpha marker | `GLYPH TEST MARKER ALPHA` |
| Fixed Beta marker | `GLYPH TEST MARKER BETA` |
| Candidate order | `matching-color-body-v1`, then `sub-legible-body-1pt-v1`, then `docx-header-text-v1` |

The fixture module imports `FIXED_MARKER_ALPHA`,
`FIXED_MARKER_BETA`, and `VISIBLE_PARAGRAPHS` from
`research/experiments/docx-hidden-run-v1/fixture.ts`; it does not
duplicate those strings as a second source of truth.

## Candidate bakeoff contract

The candidate dispatch is a closed discriminated union with one branch per
candidate. There is no registry, runtime plugin mechanism, replacement
candidate, or extension point.

| Candidate ID | Document profile | One mechanism in the source DOCX | Exact source placement | Expected research risk to test |
| --- | --- | --- | --- | --- |
| `matching-color-body-v1` | `docx-matching-color-body-v1` | Ordinary body `w:r` marker runs with explicit `w:color w:val="FFFFFF"`; no `w:vanish`, `w:sz`, or `w:shd` | Alpha at body paragraph 0/run 1; Beta at body paragraph 2/run 1 | White-page assumptions, color normalization, selection/accessibility exposure, and loss of ordinary text styling |
| `sub-legible-body-1pt-v1` | `docx-sub-legible-body-1pt-v1` | Ordinary body `w:r` marker runs from `docx` numeric `size: 2`, yielding exactly `w:sz w:val="2"` and `w:szCs w:val="2"`; no `w:vanish` or other styling | Alpha at body paragraph 0/run 1; Beta at body paragraph 2/run 1 | Size clamping or stripping, zoom-dependent visibility, layout changes, and extraction/accessibility exposure |
| `docx-header-text-v1` | `docx-header-text-v1` | Ordinary default-style text runs in one default `word/header1.xml` part; no `w:vanish`, color, or size override | Header paragraph 0 contains Alpha; header paragraph 1 contains Beta; body has only the three visible fixture paragraphs | Header import/export retention, header visibility, header inclusion in ordinary copy, and part-location changes |

Candidate A is the smallest ordinary-body color transport test. Candidate B is
retained only as a fixed one-point diagnostic for a different direct-formatting
property; its visibility, accessibility, and layout weaknesses are measured,
not optimized away. Candidate C is a standards-supported regional transport
control and is never an eligible winner. It is a diagnostic even if both
markers survive in the header.

Candidate A's explicit white color is a research candidate only: it is not
secure, tamper-resistant, guaranteed invisible, or a production recommendation.
Candidate B's one-point text is ordinary text, not hidden text. Candidate C's
header text is ordinary text, not metadata or a directive channel. Do not add
white-on-white variants, other font sizes, footer variants, multiple headers,
mixed header/footer placement, hidden runs, zero-width characters, comments,
custom XML, metadata, off-page positioning, macros, scripts, active content,
embedded objects, remote resources, or external relationships.

## Fixed fixture and placement contract

The source of truth is the frozen
`research/experiments/docx-hidden-run-v1/fixture.ts`. The candidate
fixture contains exactly three body paragraphs. Paragraph and run indexes below
are zero-based.

| Body paragraph | Run 0 | Run 1 | Run 2 |
| --- | --- | --- | --- |
| 0 | Visible: `Read the passage below.` | Marker Alpha: `GLYPH TEST MARKER ALPHA` | Visible: ` Then summarize its main idea in two sentences.` |
| 1 | Visible: `A neighborhood library extended its weekend hours so more residents could use its study rooms and book collection.` | none | none |
| 2 | Visible: `Explain one possible benefit of the schedule change.` | Marker Beta: `GLYPH TEST MARKER BETA` | Visible: ` Then explain one possible drawback.` |

After marker-tagged runs are removed, the body paragraphs are exactly:

1. `Read the passage below. Then summarize its main idea in two sentences.`
2. `A neighborhood library extended its weekend hours so more residents could use its study rooms and book collection.`
3. `Explain one possible benefit of the schedule change. Then explain one possible drawback.`

For `matching-color-body-v1` and `sub-legible-body-1pt-v1`,
marker runs remain at body paragraph 0/run 1 and body paragraph 2/run 1. All
non-marker runs remain unchanged. Candidate A sets only direct
`FFFFFF` color. Candidate B sets only numeric `size: 2`,
which means one point because WordprocessingML sizes are half-points and must
produce both direct `w:sz w:val="2"` and `w:szCs w:val="2"`.

For `docx-header-text-v1`, the generator removes only the two
marker-tagged runs from the body, leaving the three body paragraphs unchanged.
It places Alpha in default header paragraph 0 and Beta in default header
paragraph 1, each as a separate plain, unstyled paragraph in one default
`word/header1.xml` part. It sets no `w:vanish`, color, or
size override.

Each candidate has these exact local output paths under the ignored directory
`research/artifacts/docx-alternative-carrier-bakeoff-v1/`:

| Representation | Candidate-specific path |
| --- | --- |
| Source artifact | `research/artifacts/docx-alternative-carrier-bakeoff-v1/<candidateId>.docx` |
| Google Docs DOCX export | `research/artifacts/docx-alternative-carrier-bakeoff-v1/<candidateId>-google-docs-roundtrip.docx` |
| Google Docs plain-text copy | `research/artifacts/docx-alternative-carrier-bakeoff-v1/<candidateId>-google-docs-copy-plain-text.txt` |

No source artifact is replaced by a transformed artifact, and no exported
artifact is used as a later candidate source.

## Shared Google Docs workflow

The only material editor workflow is Google Docs import, ordinary-view
assessment, Microsoft Word DOCX export, and plain-text copy. Microsoft Word is
not installed or added for this experiment, and no other converter is added.

| Workflow ID | Role | Representation |
| --- | --- | --- |
| `canonical-package` | Mandatory software prerequisite; insufficient by itself | Generated source DOCX/OOXML |
| `google-docs-roundtrip-docx` | Material editor round-trip | Exported DOCX/OOXML |
| `google-docs-copy-plain-text` | Secondary clipboard capability | Controlled plain text |

Each candidate gets one new, unshared Google Docs document. Record the exact
source hash, application and platform name/version when observable, ordinary
view before any exposure, export path/hash, transformed-inspector result,
copy/paste result and path/hash, factual deviations, and limitations. Do not
share documents, record account identity or URL, edit the fixture in Google
Docs, or use one candidate's transformed document as another candidate's source.

## Shared Google Docs steps

The following steps are exact and run in the frozen candidate order:

1. Generate and hash all three source artifacts before opening any document.
2. In the frozen candidate order, upload one source artifact to one new unshared Google Docs document; never use an exported artifact as a later source.
3. Keep Google Docs at its ordinary default view and 100% document zoom; do not select text, search for marker values, enable hidden-text display, or use an assistive tool before recording ordinary visibility and the three visible body paragraphs.
4. Download that document as Microsoft Word `.docx` to the candidate-specific ignored output path and record the download hash.
5. Run the new transformed inspector against the exported file. The old `docx-hidden-run-v1` inspector is not run against successor artifacts; its unchanged test suite and original canonical artifact are regression-checked separately.
6. From the same ordinary view, use `Select all`, copy, paste into a new plain-text destination, save the candidate-specific `.txt` file, hash it, and search independently for Alpha, Beta, and the three visible paragraphs.
7. Record ordinary exposure after the primary observation only when a named setting/tool is explicitly exercised; do not install software or change global accessibility configuration.

After the shared primary observation, perform these candidate-specific presentation
checks without editing document content:

- For `matching-color-body-v1`, select the two marker locations and record whether selection reveals the text; record whether the page remains white and whether a locally available dark-theme, dark-canvas, high-contrast, or background change reveals or recolors it. If no such view is already available, record `not_run`; do not alter global display settings.
- For `sub-legible-body-1pt-v1`, record marker readability at 100% before selection, then selection reveal, visible spacing, line-height, paragraph, and pagination disturbance. Zoom-dependent impressions may be noted only after the frozen 100% observation.
- For `docx-header-text-v1`, use paginated/pages mode at 100% and record the default header's ordinary visibility and layout effect. The body `Select all` copy is predeclared not to require header inclusion; absence of Alpha and Beta from that copy is a clipboard limitation, not a DOCX round-trip failure.

For each candidate, record assistive exposure only when an already-available
accessibility surface can be exercised reliably. Otherwise record
`not_run`/`not_assessable` and scope the limitation; never infer
accessibility behavior from XML, selection, or plain-text extraction.

## Observation vocabulary

| Field | Frozen values |
| --- | --- |
| Workflow status | `completed`, `failed`, `not_run` |
| Marker presence | `present`, `absent`, `not_assessable`, `not_applicable` |
| Visible body | `preserved`, `changed`, `lost`, `not_assessable`, `not_applicable` |
| Ordinary visibility | `not_visible`, `visible`, `not_assessable`, `not_applicable` |
| Conditional exposure | `hidden_text_setting`, `accessibility_tool`, `plain_text_extraction`, `other_recorded_tool` |
| Layout disturbance | `none_observed`, `minor`, `material`, `not_assessable` |
| Selection/background/formatting reveal | `revealed`, `not_revealed`, `not_run`, `not_assessable` |
| Assistive exposure | `exposed`, `not_exposed`, `not_run`, `not_assessable` |

Record `ordinaryVisibility` before selection, marker search, OOXML
inspection, or explicit exposure. `not_visible` means the marker is
not seen in the ordinary default view; it does not mean that the marker is
inaccessible to every tool. Record exposure separately after a named setting or
tool is explicitly exercised. Record an exact application/platform version when
observable and JSON `null` otherwise. Record `protocolDeviation`
as JSON `null` when all steps ran as written, otherwise as a concise
factual string. Do not infer why a marker is absent without corresponding evidence.

## Matrix columns

The record contains exactly three matrix rows in `CANDIDATE_ORDER`. Each
row has exactly the following nested sections. No composite numeric score is
derived or accepted.

| Section | Exact columns |
| --- | --- |
| Candidate | `candidateId` |
| `transport` | `canonicalValid`; `sourceMarkerPresence.alpha`; `sourceMarkerPresence.beta`; `sourceLocations`; `sourceFormats`; `roundtripMarkerPresence.alpha`; `roundtripMarkerPresence.beta`; `roundtripLocations`; `roundtripFormats`; `roundtripVisibleBody`; `copyMarkerPresence.alpha`; `copyMarkerPresence.beta`; `copyVisibleBody` |
| `presentation` | `ordinaryVisibility`; `layoutDisturbance`; `selectionReveal`; `backgroundOrThemeReveal`; `explicitFormattingReveal` |
| `accessibilityTrust` | `assistiveExposure`; `accidentalExposureNotes`; `limitations` |
| `engineering` | `structuralSimplicity`; `deterministicGeneration`; `deterministicInspection`; `testedEditorScope`; `sourceSafetyClean`; `roundtripSafetyClean` |

The transport section preserves marker presence, structural locations, formats,
visible-body observations, and copy observations separately. Presentation,
accessibility, and engineering evidence are not collapsed into transport
presence or a score.

## Structural inspection contract

The transformed inspector is read-only and package-tolerant. It requires a valid
ZIP/DOCX signature, `[Content_Types].xml`, `_rels/.rels`, and
`word/document.xml`; it rejects malformed XML and reports safety findings
rather than converting unsafe content to marker absence. It never executes
package content, falls back to the old strict inspector, or requires the old
canonical package allowlist.

It concatenates `w:t` descendants within each `w:r`, then each
direct body/header/footer/footnote/endnote/comments paragraph. It locates a marker
in concatenated paragraph text, including when split across adjacent runs, and
records its part, location, paragraph, run indexes, and run formats. `color`
is explicit `w:color/@w:val` or JSON `null`;
`sizeHalfPoints` is explicit numeric `w:sz/@w:val` or JSON
`null`; `sizeComplexScriptHalfPoints` is explicit numeric
`w:szCs/@w:val` or JSON `null`; `hidden` is true only
for an enabled `w:vanish`.

It scans every `.rels` part for external relationships and unresolved
relationship targets, and scans `[Content_Types].xml` for active
relationship types, active-content entries, and macro content types. Safety
findings are retained as findings; they are never rewritten as absent markers.
Every source inspection and every completed round-trip inspection must have all
five safety arrays empty before the row is safety-clean.

## Supporting schema types

~~~typescript
export type AlternativeCarrierCandidateId =
  | "matching-color-body-v1"
  | "sub-legible-body-1pt-v1"
  | "docx-header-text-v1";

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
~~~

## Machine-readable record schema

The following TypeScript definitions are the exact schema. The JSON record uses
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

The validator in the later observation task additionally requires every
`SHA256` value to match `/^[0-9a-f]{64}$/`, every workflow
`steps` array to be non-empty, every round-trip workflow to match its
completed-only schema, and every copy workflow `failureReason` to be
JSON `null` only for `completed` and non-empty for
`failed` or `not_run`. It requires exactly three candidate
objects and three matrix rows in `CANDIDATE_ORDER`, the exact
candidate-to-mechanism/profile mapping, artifact paths inside the ignored
bakeoff directory, and no account, URL, credential, prompt, or response fields.
It requires `selectedCandidateId` to be the sole body candidate
satisfying the seven selection conditions for `SELECT_CANDIDATE`, and
JSON `null` for the other two decisions. It requires the exact nested
matrix sections above and does not derive or accept a composite numeric score.

## Frozen operational blocked rule

An unexecuted candidate export or any attempted workflow without an inspectable
round-trip DOCX is operationally `BLOCKED`. A missing, malformed, or
uninspectable required round-trip is also `BLOCKED`. Retain factual
local notes, but create no run record and assign no scientific gate decision.
A clipboard failure may be recorded while retaining an otherwise inspectable
DOCX comparison; clipboard availability alone does not block the DOCX comparison.

An operational block is not marker absence and is not evidence for
`NO_VIABLE_DOCX_CARRIER`. Do not run the record validator or make a
result commit for a blocked run. Any partial local artifacts or notes remain
uncommitted and are reported.

## Pre-observation gate



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


## Freeze and stopping rule

Task 1 performs no observation, dependency installation, DOCX generation,
application-code change, or manual experiment. No source artifact, round-trip
artifact, clipboard file, or result record is created here. After the protocol
and fixture are committed, stop before opening Google Docs; later tasks may
execute this frozen protocol only with separate authorization.

The decision is never made from a download click, a no-match search, the old
strict inspector rejecting a transformed package, or a fixture-only test. Every
decision rationale names candidate IDs and workflow observations. The only
permitted top-level scientific values are `SELECT_CANDIDATE`,
`REVISE_CANDIDATE`, and `NO_VIABLE_DOCX_CARRIER`; an
operationally blocked run has no scientific gate decision.
