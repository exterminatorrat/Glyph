# Glyph experimental framework

Status: approved Milestone 0 research design, 2026-08-30

## Research objective

Glyph first measures assignment-specific marker presence. Research then tests whether marker presence occurs materially more often when a protected assignment is provided to a generative AI system than in properly designed controls.

The framework separates three questions:

- Experiment A: does the document carrier survive?
- Experiment B: does a model reproduce a marker when the directive actually reaches it?
- Experiment C: does the full practical pipeline preserve the marker?

These questions must not be collapsed into one detection rate.

## Interpretation ladder

Research reports use the following levels:

1. Observation: “Signal A was detected.”
2. Technical interpretation: “An assignment-specific marker associated with this protected assignment is present.”
3. Research interpretation: “The sample contains marker-exposure evidence.”
4. Potential product interpretation: “Prompt-reuse signal detected,” only after experiments justify that language.

No result establishes AI authorship, direct AI ingestion, student intent, cheating, or academic misconduct.

## Experiment A — carrier survival

### Question

Does hidden marker content survive relevant document workflows and reach a resulting representation where its presence can be inspected?

This experiment tests `docx-hidden-run-v1`, not model compliance and not production marker generation.

### Inputs

Milestone 2 creates controlled DOCX artifacts containing fixed research-only markers in standards-based `w:vanish` runs:

- `GLYPH TEST MARKER ALPHA`
- `GLYPH TEST MARKER BETA`

The artifacts contain ordinary visible control text so preservation of visible content can be checked alongside the hidden runs.

The fixed markers must not be used in the exact-canary baseline and must not be described as production markers.

### Workflow classes

The carrier protocol covers the relevant subset of:

- DOCX package inspection
- DOCX opened and saved in Microsoft Word
- DOCX opened or imported and exported through Google Docs
- Word copy/paste into a controlled plain-text destination
- Google Docs copy/paste into a controlled plain-text destination
- an explicitly selected document conversion where its output can be inspected
- accessibility or hidden-text display behavior needed to assess ordinary invisibility claims

Each workflow record identifies application, platform, observable version where available, steps, source artifact checksum, result artifact or captured representation, marker presence, visible-content integrity, and deviations.

### Measurement

For each representation, report separately:

- Signal Alpha present or absent.
- Signal Beta present or absent.
- Visible control content preserved, changed, or lost.
- Hidden content ordinarily visible, hidden, exposed by a setting/tool, or not assessable.

Do not infer why a marker is absent without additional evidence.

### Gate

Before execution, the carrier protocol names the workflows considered material and the qualitative or quantitative continuation rule. The rule is chosen before results are observed; this specification does not invent a universal performance threshold.

Milestone 2 ends with one decision:

- `PROCEED`: carrier behavior justifies defining the exact-canary strategy.
- `REVISE CARRIER`: the profile requires a specification revision and a new carrier version before retesting.
- `ABANDON CURRENT CARRIER`: current carrier research stops and product workflows are not built around it.

A failed carrier result cannot be rationalized by application investment because persistence and product workflows do not exist yet.

### Versioned carrier successors

Milestone 2C recorded `REVISE_CARRIER` for its semantic-white qualification.
Milestone 2D is the current, separately versioned zero-width carrier
bake-off, frozen in the [Milestone 2D protocol](../research/experiments/docx-zero-width-carrier-bakeoff-v1/protocol.md).
It asks whether fixed checksum-protected zero-width frames survive independent
Google Docs and Microsoft Word DOCX round trips and ordinary plain-text copy
while remaining absent from required ordinary views. The result is transport
evidence only: a selected profile advances to separate accessibility and
international-text qualification and does not change the interpretation ladder
or authorize Milestone 3/product claims.

## Experiment B — model compliance

### Question

When the exact canary directive actually reaches a generative model, how often does the model reproduce each requested marker?

This isolates model instruction-following behavior from DOCX carrier behavior.

### Prerequisites

- Experiment A has produced `PROCEED` or an approved successor carrier has passed its own gate.
- Milestone 3 has frozen the generated-marker and matching profiles.
- The directive wording and placement within the controlled model input are frozen for the protocol.
- Samples are collected manually through named consumer AI products; no external model API is used.

### Controlled exposure

The experiment supplies a plain-text representation that makes it independently verifiable that the directive reached the model input. It does not depend on DOCX ingestion.

Conditions include:

- model receives the visible assignment plus the complete directive and markers
- model receives the same visible assignment without the directive
- model receives unrelated assignment content
- human controls receive the visible assignment under the approved consent policy

Model source, visible product version where available, collection date, session/repetition identity, and exact workflow are recorded.

### Measurement

Use the production exact-canary analyzer. Report per marker and at both operating thresholds:

- any signal detected
- all required signals detected

The experiment measures compliance under its protocol. It does not establish that a hidden DOCX directive reaches the model in practical use.

## Experiment C — end-to-end survival

### Question

Across realistic consumer workflows, how often does the full pipeline preserve an assignment-specific signal?

```text
protected assignment
  -> consumer document workflow
  -> generative AI
  -> generated response
  -> Glyph analyzer
```

### Conditions

Positive-condition samples provide the protected assignment through a recorded workflow to a generative AI system. Controls include:

- the same visible assignment without protected marker content supplied to AI
- unrelated AI outputs
- human responses to visible assignment content
- consented human controls receiving the protected artifact
- responses carrying a different assignment's markers

Workflow labels remain data, not application logic. Examples include direct document upload, Word copy/paste, Google Docs copy/paste, PDF transformation where later authorized, screenshot, and manual retyping.

### Failure attribution

An absent end-to-end marker is not one generic detector failure. Investigation classifies the strongest supported explanation as:

- carrier failure: marker or directive did not reach the inspected representation
- model-compliance failure: directive reached the model but the requested marker was not reproduced
- marker-generation or matching-profile failure: marker construction or normalization was unsuitable
- analysis failure: a present marker was not detected by the production analyzer
- unresolved: available evidence cannot distinguish the stage

Attribution must be evidence-backed. Do not infer internal model behavior solely from an absent output.

## Baseline gate

The baseline controlled experiment is Milestone 7 and a second explicit gate. Before collection, its protocol freezes:

- assignments and conditions
- generated-marker and matching profiles
- document profile
- directive wording
- source and workflow labels
- repetitions and sampling method
- any-signal and all-signals decision rules
- continuation criteria

The milestone records `GO`, `REVISE`, or `NO-GO` with reasons. The Analyze vertical slice begins only after `GO`. A revision that changes carrier, marker, matching, or directive behavior receives a new version and a new experiment identity.

## Fixture model

Research fixtures are immutable after collection. Corrections create a new fixture or experiment revision with recorded lineage.

An experiment manifest records:

- experiment schema version and experiment ID
- research question and protocol
- assignment identity or research fixture reference
- fingerprint schema, strategy, and strategy version
- generated-marker and matching profiles
- document profile
- directive profile
- source artifact checksums
- collection period
- predeclared operating thresholds and gate rule
- known limitations and protocol deviations

Each sample records:

- sample ID
- condition label
- source/model label
- visible model version where available
- collection timestamp
- workflow and transformation labels
- repetition/session identity
- response reference
- expected exposure status
- analyzer result
- provenance and approved notes

Labels are extensible strings in research data. They are not encoded as product branches.

## Research-data policy

Permitted fixture content:

- synthetic responses
- generated AI responses collected specifically for the experiment
- explicitly consented and de-identified human controls

Prohibited content:

- actual student submissions
- student identity or class information
- copied school records
- unconsented human writing
- credentials or private model-account information

Actual student work must not appear in Git, automated-test fixtures, research fixtures, logs, documentation examples, or the internal prototype. A separately reviewed pilot protocol is required before that boundary can change.

## Outcome definitions

For a chosen detection threshold:

- true positive: protected marker-bearing input was supplied to the generative system under the positive protocol and the threshold was met
- false negative: protected marker-bearing input was supplied and the threshold was not met
- false positive: a control sample met the threshold
- true negative: a control sample did not meet the threshold

Calculate separately for any-signal and all-signals thresholds:

- detection rate or recall: `TP / (TP + FN)`
- false-positive rate: `FP / (FP + TN)`
- precision: `TP / (TP + FP)`

If a denominator is zero, the metric is unavailable rather than zero. Reports include raw counts and uncertainty intervals. Precision is interpreted only in the context of the experiment's constructed prevalence; it is not a real-world probability that a student used AI.

Results are grouped by source/model, workflow, transformation, assignment, carrier profile, and fingerprint strategy where denominators permit. Small groups retain raw counts without confident generalization.

## Reproducibility and anti-bias rules

- Use the same analyzer as the product.
- Freeze the protocol before observing scored results.
- Record failures and deviations.
- Preserve negative results.
- Keep marker values out of control authors' view where the protocol requires blinding.
- Avoid reusing marker phrases across unrelated experiments.
- Do not tune a running baseline in place.
- Record consumer-product dates because model behavior changes.
- Treat repeated samples from one model/session as potentially correlated.
- Separate software verification from scientific claims.

## Experimental limitations

- Consumer products and ingestion pipelines can change without notice.
- Manual collection can introduce execution and labeling errors.
- Model outputs are stochastic.
- Assignment selection may not represent real curricula.
- Hidden content may interact differently with accessibility tools.
- Natural marker collision and causal contamination are different risks.
- Marker exposure does not identify who caused it or why.
- A successful laboratory protocol may not represent common teacher workflows.
- No experiment described here can establish academic misconduct.

## Abandonment criteria

The fingerprint approach should be abandoned or materially reframed if predeclared experiments repeatedly show that relevant carriers do not survive, controlled model compliance is too unstable, realistic end-to-end workflows rarely preserve signals, controls produce unacceptable contamination, ordinary accessibility behavior exposes or acts on directives incompatibly, or teachers cannot interpret results without overclaiming.

The purpose of the framework is to discover those outcomes early, not to optimize for favorable results.
