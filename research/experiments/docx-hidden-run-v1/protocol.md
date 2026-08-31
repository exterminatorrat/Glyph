# Experiment A: DOCX hidden-run carrier survival protocol

Status: frozen before observation

This protocol defines Experiment A for the `docx-hidden-run-v1` carrier. It is
the pre-observation freeze for one synthetic fixture and the workflows that can
inspect its survival. It does not test model compliance, prompt reuse,
authorship, direct AI ingestion, student intent, cheating, or academic
misconduct.

## Scope and fixed identifiers

Experiment A asks whether fixed hidden marker content survives relevant document
workflows and reaches a representation where its presence can be inspected.
The carrier is WordprocessingML `w:vanish` on ordinary text runs. The marker
values are fixed research values, not generated markers, production
fingerprints, semantic markers, or evidence of model behavior.

| Field | Frozen value |
| --- | --- |
| Experiment ID | `glyph-exp-a-docx-hidden-run-v1-001` |
| Experiment schema version | `1` |
| Document profile | `docx-hidden-run-v1` |
| Visible fixture ID | `synthetic-library-hours-v1` |
| Fingerprint strategy | JSON `null` (not applicable) |
| Fingerprint strategy version | JSON `null` (not applicable) |
| Matching profile | JSON `null` (not applicable) |

Carrier versioning is independent from fingerprint schema, strategy, strategy
version, and matching profile. This experiment has no fingerprint strategy.

## Fixed synthetic fixture

The fixture contains exactly three visible paragraphs after hidden runs are
excluded:

1. `Read the passage below. Then summarize its main idea in two sentences.`
2. `A neighborhood library extended its weekend hours so more residents could use its study rooms and book collection.`
3. `Explain one possible benefit of the schedule change. Then explain one possible drawback.`

The run layout is frozen as follows:

| Paragraph | Run 1 | Run 2 | Run 3 |
| --- | --- | --- | --- |
| 1 | Visible: `Read the passage below.` | Hidden: `GLYPH TEST MARKER ALPHA` | Visible: ` Then summarize its main idea in two sentences.` |
| 2 | Visible: the complete library-hours sentence | none | none |
| 3 | Visible: `Explain one possible benefit of the schedule change.` | Hidden: `GLYPH TEST MARKER BETA` | Visible: ` Then explain one possible drawback.` |

Alpha and Beta are separate hidden runs in separate visible paragraphs. Their
positions diagnose location-sensitive loss; they do not provide statistically
independent evidence. Hidden text is not placed in its own paragraph, avoiding
a second paragraph-level carrier variable.

The fixture is synthetic and immutable after collection. A correction creates a
new fixture or experiment revision with recorded lineage. The fixture source
for the durable run record is frozen as
`research/experiments/docx-hidden-run-v1/fixture.ts`.

## Material workflows

The ordered workflow set for the run record is exactly the following five IDs:

| Workflow ID | Gate role | Representation |
| --- | --- | --- |
| `canonical-package` | mandatory software prerequisite; insufficient by itself | generated DOCX/OOXML |
| `word-roundtrip-docx` | material editor round-trip when Word is available | saved DOCX/OOXML |
| `google-docs-roundtrip-docx` | material editor round-trip | exported DOCX/OOXML |
| `word-copy-plain-text` | conditional capability; failure narrows scope | controlled plain text |
| `google-docs-copy-plain-text` | conditional capability; failure narrows scope | controlled plain text |

No separate conversion utility is material in this first run. Word save and
Google Docs import/export are the preselected document transformations; adding
another converter would introduce an unfrozen tool and another variable. A
later carrier protocol may add a named converter before its observations begin.

Ordinary visibility and conditional exposure are observation fields on each
applicable editor workflow, not separate workflows.

Microsoft Word was not found during planning. Google Docs is therefore the
minimum material editor workflow unless Word becomes independently available
before execution. This availability note does not create an observation or a
scientific decision.

## Observation vocabulary

Every applicable workflow records the following fields. A failed or unavailable
workflow is not evidence that a marker was absent.

### Workflow status

`status` is exactly one of:

- `completed`: the workflow yielded an inspectable representation.
- `failed`: the workflow was attempted but did not yield an inspectable representation; `failureReason` is required.
- `not_run`: the workflow was unavailable; `failureReason` is required.

### Marker presence

Record Alpha and Beta independently. Each value is exactly one of:

- `present`
- `absent`
- `not_assessable`
- `not_applicable`

### Visible content

Record exactly one value for the visible fixture:

- `preserved`
- `changed`
- `lost`
- `not_assessable`
- `not_applicable`

### Ordinary visibility

Record exactly one value for the marker text in the ordinary document view:

- `hidden`
- `visible`
- `not_assessable`
- `not_applicable`

Marker text visible in the normal editor view is an ordinary-visibility failure.

### Conditional exposure

Record zero or more values, and only these values:

- `hidden_text_setting`
- `accessibility_tool`
- `plain_text_extraction`
- `other_recorded_tool`

Exposure only after an explicit hidden-text setting or a named assistive tool is
a recorded limitation that narrows visibility claims. It is not by itself an
ordinary-visibility gate failure.

### Protocol deviation

`protocolDeviation` is JSON `null` when there is no deviation. Otherwise it is
a concise factual string. Do not infer why a marker is absent without additional
evidence.

## Artifact and data policy

Task 1 freezes this protocol only. It performs no observation, dependency
installation, DOCX generation, application code change, or manual experiment.
No result record is created until the authorized observation tasks are complete.

Generated DOCX and clipboard artifacts remain inert, local, and ignored. The
canonical artifact path for the later run record is exactly
`research/artifacts/docx-hidden-run-v1/glyph-docx-hidden-run-v1-spike.docx`.
Clipboard text artifacts, if produced by a later authorized workflow, remain
under the same ignored artifact directory. Source, this protocol, tests, and
the completed machine-readable run record are durable Git content.

Use synthetic content only. Never put actual student work, student identity,
class information, school records, credentials, account identifiers, cloud
document URLs, or private browser state in Git, fixtures, logs, artifacts,
records, or notes. Do not persist or log raw assignment prompts, student
responses, or uploaded response documents. Keep marker and fingerprint material
out of browser-facing contracts; the fixed marker values appear in the approved
research fixture and run-record contract only.

## Durable run-record contract

Task 4 must create
`research/experiments/docx-hidden-run-v1/run-001.json`. Its required top-level
fields are:

| Field | Contract |
| --- | --- |
| `experimentId` | exactly `glyph-exp-a-docx-hidden-run-v1-001` |
| `experimentSchemaVersion` | exactly `1` |
| `date` | collection date |
| `documentProfile` | exactly `docx-hidden-run-v1` |
| `fingerprintStrategy` | JSON `null` |
| `fingerprintStrategyVersion` | JSON `null` |
| `matchingProfile` | JSON `null` |
| `fixedMarkers` | object `{ alpha: "GLYPH TEST MARKER ALPHA", beta: "GLYPH TEST MARKER BETA" }` |
| `visibleFixture` | object `{ id, sourcePath }`, with ID `synthetic-library-hours-v1` and source path `research/experiments/docx-hidden-run-v1/fixture.ts` |
| `sourceGenerator` | object `{ path, gitCommit, nodeVersion, pnpmVersion, docxVersion }`, with path `src/documents/docx/docx-hidden-run-v1.ts` |
| `canonicalArtifact` | object `{ path, sha256 }`, with the exact canonical path above and a lowercase 64-character SHA-256 |
| `workflows` | ordered array containing exactly the five frozen workflow IDs |
| `gateDecision` | exactly `PROCEED`, `REVISE CARRIER`, or `ABANDON CURRENT CARRIER` after an assessable scientific gate; operationally blocked runs do not fabricate this field |
| `gateRationale` | non-empty array of factual strings tied to workflow IDs |
| `limitations` | non-empty array naming unavailable applications and unassessed exposure modes |

Each workflow object has exactly these fields:

| Field | Contract |
| --- | --- |
| `workflowId` | one frozen workflow ID |
| `status` | one frozen workflow status |
| `failureReason` | JSON `null` for `completed`; a non-empty factual string for `failed` or `not_run` |
| `application` | object `{ name: string; version: string \| null }` |
| `platform` | object `{ name: string; version: string \| null }` |
| `steps` | non-empty ordered string array |
| `sourceArtifactSha256` | lowercase 64-character SHA-256 |
| `resultArtifact` | JSON `null` when none; otherwise `{ path: string; sha256: string }` using a repository-relative ignored path and lowercase 64-character hash |
| `markerPresence` | object `{ alpha, beta }` using the frozen presence values |
| `visibleContent` | one frozen visible-content value |
| `ordinaryVisibility` | one frozen ordinary-visibility value |
| `conditionalExposure` | array containing only frozen exposure values |
| `protocolDeviation` | JSON `null` or a non-empty factual string |
| `notes` | factual string array |

Application and platform versions may be JSON `null` when they are not
observable. Exclude account identifiers, cloud document URLs, credentials,
student content, and private browser state from every record.

## Predeclared gate

The gate is frozen before any observation. Milestone 2 ends with one of the
three scientific decisions below, and even `PROCEED` does not authorize
Milestone 3.

### PROCEED

**PROCEED** requires all of the following:

1. The canonical structural suite passes, including inert-package and relationship checks.
2. At least one completed material editor round-trip—Word save-as-DOCX or Google Docs export-as-DOCX—preserves both markers structurally and preserves all three visible paragraphs.
3. Every editor workflow cited as supported keeps marker text hidden in its ordinary document view.
4. Every failed or unexecuted editor or clipboard class is named as unsupported or unverified, narrowing the continuation claim to passing classes.

Clipboard preservation is not required for `PROCEED`. A failed Word or Google
Docs class does not automatically block `PROCEED` when another material editor
round-trip satisfies the rule, but the failed class cannot be called supported.
Clipboard failure alone does not block `PROCEED` but narrows copy/paste claims.
With Word unavailable, Google Docs may independently support a narrowly scoped
`PROCEED`, limited to the workflows actually tested. `PROCEED` means sufficient
evidence to continue research only; it does not establish support beyond those
passing workflows.

### REVISE CARRIER

**REVISE CARRIER** applies when no material editor round-trip satisfies
`PROCEED`, but a completed material workflow shows a bounded placement- or
presentation-sensitive result worth a separately versioned retest:

- exactly one marker survives;
- both markers survive with visible-content damage; or
- marker text is ordinary-visible in only a subset of material editor workflows.

Revision neither changes this profile in place nor authorizes Milestone 3. Any
behavioral carrier change after observation requires a new document profile and
experiment identity. Preserve the exact fixed markers and keep carrier and
fingerprint versioning separate.

### ABANDON CURRENT CARRIER

**ABANDON CURRENT CARRIER** applies when every completed material editor
round-trip loses both markers; only the canonical package retains them; or
marker text is ordinary-visible across all otherwise-preserving material editor
workflows. Do not build product workflows around this profile after that
decision.

These rules exhaust completed, assessable editor outcomes: a full supported
result proceeds; a bounded partial or presentation-sensitive result revises;
and total carrier loss or universal ordinary exposure abandons. A failed,
unavailable, or not-assessable workflow does not count as a pass or absence.

If unresolved workflows leave no completed assessable editor result that
satisfies one of the three rules, stop as operationally `BLOCKED` and request
the missing environment. `BLOCKED` is an operational state, not a scientific
gate decision; do not fabricate `PROCEED`, `REVISE CARRIER`, or `ABANDON CURRENT
CARRIER` in that case. In particular, if no material editor workflow can be
completed, do not create one of the three scientific decisions.

After the carrier decision, stop this milestone. A decision does not establish
prompt reuse, AI authorship, direct AI ingestion, student intent, cheating, or
academic misconduct, and no product workflow follows from it automatically.
