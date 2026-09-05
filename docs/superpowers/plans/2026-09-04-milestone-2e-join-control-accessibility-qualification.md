# Glyph Milestone 2E Join-Control Accessibility Qualification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. One mutating implementer owns overlapping files; read-only reviewers run only at the named checkpoints.

**Goal:** Qualify or reject the unchanged Milestone 2D transport winner, `join-control-binary-v1` / `docx-zero-width-join-control-v1`, against a frozen accessibility, international-text, editing, print/PDF, and NVDA evidence matrix.

**Architecture:** Four versioned synthetic paired-control DOCX fixtures reuse the immutable Milestone 2D frame codec but receive qualification-specific generation and inspection. Repository-bounded commands produce privacy-safe fixed-code evidence. A recursively closed validator re-inspects every artifact and derives the binary scientific gate; missing or unreliable mandatory evidence remains operationally `BLOCKED` outside `run-001.json`.

**Tech stack:** Node.js 26, TypeScript, pnpm 11.19.0, Vitest, `docx@9.7.1`, `fflate@0.8.3`, `@xmldom/xmldom@0.9.12`, platform `Intl.Segmenter`, `pypdf==6.10.0` through a PEP 723 research-only script, and Poppler `pdftoppm` for ignored rendered evidence. Google Docs in Chrome and Word on macOS provide primary editor evidence; Windows 11, NVDA 2026.2, Chrome/Google Docs, and Word for Microsoft 365 provide the hard accessibility evidence.

**Spec:** [`docs/superpowers/specs/2026-09-03-milestone-2e-join-control-accessibility-qualification-design.md`](../specs/2026-09-03-milestone-2e-join-control-accessibility-qualification-design.md)

## Global constraints

- Work only on `codex/milestone-2e-join-control-qualification`, based on completed Milestone 2D commit `caea053ef133d33b44a45b7d9907519b5d1688a2` and approved design commit `462cd7f`.
- Treat Milestones 2, 2B, 2C, and 2D as immutable. Do not edit any completed experiment path or regenerate any old artifact.
- Candidate A is unchanged: reuse `join-control-binary-v1`, `docx-zero-width-join-control-v1`, its fifteen-byte Alpha/Beta frames, CRC, ZWNJ/ZWJ mapping, 120-code-point frame length, run formatting, and logical punctuation-space anchor.
- Qualification profile is exactly `docx-zero-width-join-control-qualification-v1`; experiment ID is exactly `glyph-exp-docx-zero-width-join-control-qualification-v1-001`; schema version is exactly `1`.
- Each case contains one Alpha frame and one Beta frame, each in a marked row paired with an otherwise identical marker-free control row.
- No carrier or fixture value may be tuned after observing an editor. Any carrier change requires a new transport experiment; any qualification fixture or gate change requires a new qualification version.
- Canonical and transformed files live only under ignored `research/artifacts/docx-join-control-accessibility-qualification-v1/`. Generators and renderers refuse existing files, symlinks, and directory escapes.
- Raw document text, extracted PDF text, Speech Viewer transcripts, clipboard content, URLs, document IDs, account data, metadata values, and frame code points never enter tracked records or command errors.
- Complete reliable evidence yields only `QUALIFY_PROFILE` or `REJECT_PROFILE`. Missing or unreliable evidence, or a record/hash/schema/provenance mismatch, yields operational `BLOCKED` and no `run-001.json`; an inspectable candidate-behavior mismatch yields `REJECT_PROFILE`.
- A positive result is bounded qualification evidence only. It does not prove universal accessibility, production or pilot readiness, AI ingestion, model compliance, authorship, prompt reuse, intent, cheating, or misconduct.
- Do not begin Milestone 3, ExactCanary, FingerprintEngine, semantic canaries, model testing, Supabase, persistence, Protect, Analyze, authentication, UI, deployment, or real-student workflows.

## Frozen fixture decisions

All case documents use 11-point Arial, 1-inch margins, 100% scale observations, and four body rows in this order: control Alpha, marked Alpha, control Beta, marked Beta. The two rows in each pair use the same visible prefix, so removing only the validated frame from the marked paragraph reproduces its control paragraph byte-for-byte. Pair order—not different visible labels—identifies control and marked rows.

| Case | Language/direction | Alpha content | Beta content |
| --- | --- | --- | --- |
| `latin-operations-v1` | `en-US`, LTR | `The archive opens at nine. Staff review the daily log.` | `The receeve desk closes at five. Visitors sign the blue ledger.` |
| `arabic-persian-joining-v1` | Alpha `ar-SA` RTL; Beta `fa-IR` RTL | `هذه جملة عربية. ثم تأتي جملة قصيرة.` | `کتاب‌ها روی میز هستند. سپس جمله ادامه دارد.` |
| `devanagari-emoji-graphemes-v1` | Alpha `hi-IN` LTR; Beta `en-US` LTR | `यह क्षेत्र का सरल प्रश्न है. फिर अगला वाक्य आता है.` | `The family emoji 👨‍👩‍👧‍👦 stays intact. Then the line continues.` |
| `mixed-bidi-v1` | Alpha `en-US` LTR; Beta `ar-SA` RTL | `The token GLYPH42 precedes العربية 123. Then the line ends.` | `يتضمن النص GLYPH42 والرقم 123. ثم يستمر السطر.` |

The only allowlisted visible join controls outside frames are the Persian ZWNJ in `کتاب‌ها` and the emoji ZWJs inside `👨‍👩‍👧‍👦`. No bidi control character is allowed. “Line segmentation” means deterministic paragraph/newline boundaries plus the platform’s grapheme and word boundaries; the experiment does not claim Unicode line-breaking conformance. Normalization and segmentation are measured on raw carrier-bearing control and marked rows, against the frozen expected raw rows for each checkpoint, before validated frames are removed for the separate visible-text comparison. Segmentation evidence freezes and records exact `process.versions.node`, `process.versions.icu`, `process.versions.unicode`, locale, and `Intl.Segmenter` granularity (`grapheme` or `word`); a provenance mismatch is operationally `BLOCKED` rather than silently recomputed.

The fixed pair prefixes are `Alpha sample — ` for both Alpha rows and `Beta sample — ` for both Beta rows. In each marked row, the frame is its own ordinary run immediately after the first ASCII full stop and before the following ordinary space. Removing only the validated frame must make each marked paragraph byte-for-byte equal to its control.

Every mutation runs on a separate fresh canonical import/open for exactly one target row. The closed targets are `control-alpha`, `marked-alpha`, `control-beta`, and `marked-beta`. Insert checkpoints are `<target>-insert-redone` and `<target>-insert-restored`; deletion checkpoints are `<target>-backspace-result`, `<target>-backspace-restored`, `<target>-forward-delete-result`, and `<target>-forward-delete-restored`. This makes one undo/redo sequence unambiguous and prevents one row’s edit history from contaminating another row’s evidence.

## Frozen operation rules

The fixed cross-anchor searches are:

| Case | Alpha | Beta |
| --- | --- | --- |
| Latin | `nine. Staff` | `five. Visitors` |
| Arabic/Persian | `عربية. ثم` | `هستند. سپس` |
| Devanagari/emoji | `है. फिर` | `intact. Then` |
| Mixed bidi | `123. Then` | `123. ثم` |

Each search must return both paired rows. Spellcheck is opened without accepting a suggestion; each marked row must have the same underlines, finding count, and suggestion-presence classification as its control. The Latin Beta `receeve` observation is recorded separately as `same` or `different`; exact suggestion text is prohibited. If spellcheck evidence is unavailable or cannot be compared reliably, the run is operationally `BLOCKED` and no unavailable value enters the record.

For copy evidence, focus the editing area, select the complete four-paragraph body once with the application’s Select All command, copy once, and paste once into a new UTF-8 plain-text file. LF and CRLF are recorded and accepted as transport encodings; after splitting either form, the exact four paragraphs and their order must match. Each copied-text artifact must also contain exactly one checksum-valid Alpha frame and one checksum-valid Beta frame at their original logical boundaries. Missing, damaged, duplicate, moved, or mixed frames are parseable `clipboard-mismatch` evidence and derive `REJECT_PROFILE`. No textual normalization is applied.

For every target-specific mutation, use the row’s unique first- or second-sentence text in Find to position the caret without traversing the carrier:

- insert: find the exact first sentence including its full stop, dismiss Find, collapse at its logical end with the direction-aware command below, type uppercase `X`, undo once, redo once, save `insert-redone`, undo once, and save `insert-restored`;
- backspace: find the exact second sentence without its leading space, dismiss Find, collapse at its logical start with the direction-aware command below, move one logical character backward across the ordinary space, press Backspace once, save `backspace-result`, undo once, and save `backspace-restored`;
- forward-delete: find the exact first sentence including its full stop, dismiss Find, collapse at its logical end with the direction-aware command below, press Forward Delete once, save `forward-delete-result`, undo once, and save `forward-delete-restored`.

For both Google Docs and Word on macOS, collapsing a Find selection to logical end is Right Arrow in an LTR paragraph and Left Arrow in an RTL paragraph; collapsing to logical start is Left Arrow in LTR and Right Arrow in RTL. Moving one logical character backward is Left Arrow in LTR and Right Arrow in RTL. The same direction-aware Arrow mapping is used in Windows Google Docs and Word after `Esc`. Mixed-bidi Alpha uses its LTR paragraph direction and mixed-bidi Beta uses its RTL paragraph direction. The observer must confirm the caret is adjacent to the frozen ASCII full stop/space boundary before mutating; an ambiguous visual or spoken caret location is `BLOCKED`.

The identical visible sequence is used for a control or marked target. A platform/application that cannot position the caret reliably by this sequence is `BLOCKED`; mouse placement is not substituted.

Find uses the first matching occurrence for a control target and the second matching occurrence for its marked target. The exact passing consequences are:

| Operation checkpoint | Target row visible text | Marked-target frame state | Paired comparison |
| --- | --- | --- | --- |
| `insert-redone` | uppercase `X` immediately after the first full stop and before the ordinary space | one exact frame, contiguous across adjacent ordinary runs, immediately after the original full stop and before `X` | changed control row equals changed marked row after removing only the validated frame |
| `insert-restored` | original frozen row | exact original frame and punctuation-space anchor | full semantic inspection equals the fresh unedited editor roundtrip |
| `backspace-result` | the first sentence’s full stop removed; the ordinary space remains | one exact frame at the resulting first-sentence/space boundary, with no code point removed or added | changed control row equals changed marked row after removing only the validated frame |
| `backspace-restored` | original frozen row | exact original frame and punctuation-space anchor | full semantic inspection equals the fresh unedited editor roundtrip |
| `forward-delete-result` | the ordinary anchor space removed; second sentence begins immediately after the first full stop | one exact frame immediately after the full stop and before the second sentence, with no code point removed or added | changed control row equals changed marked row after removing only the validated frame |
| `forward-delete-restored` | original frozen row | exact original frame and punctuation-space anchor | full semantic inspection equals the fresh unedited editor roundtrip |

For a control-target artifact, every marked row and non-target control row remains at the unedited roundtrip state. For a marked-target artifact, every control row and non-target marked row remains at the unedited roundtrip state. Result comparison pairs the same operation and Alpha/Beta role across the separate control-target and marked-target artifacts. “Semantic inspection equals” means exact visible rows, frames, locations, properties, default-ignorable allowlists, normalization/segmentation facts, and package-safety findings; editor metadata and ZIP bytes are not required to be identical.

On Windows with NVDA, use the US English desktop keyboard layout. Enter Google Docs focus mode with `NVDA+Space`; verify screen-reader support with `Ctrl+Alt+Z`. Begin each read at `Ctrl+Home`; use `Ctrl+Down`/`Ctrl+Up` by paragraph, `Ctrl+Right`/`Ctrl+Left` by word, Right/Left Arrow by character, and the corresponding Shift-modified commands for selection. Use `Ctrl+F`, `Esc`, arrow keys, `X`, `Ctrl+Z`, `Ctrl+Y`, Backspace, and Delete for the same frozen search/position/edit sequences above. Word uses the same Windows navigation/edit keys in Print Layout. Speech Viewer is opened before the sequence and cleared between paired rows. Any shortcut collision, browse-mode substitution, or unreliable caret state is `BLOCKED`.

## Frozen artifact matrix

Each case has one shared canonical `<case>.docx` and one ignored `<case>-canonical-page-1.png` preview. For each editor (`google-docs`, `microsoft-word`) it has:

- one `<case>-<editor>-roundtrip.docx`;
- twenty-four target-specific mutation DOCX files: four targets times six result/restored checkpoints;
- one `<case>-<editor>-copy-plain-text.txt`;
- one `<case>-<editor>-print.pdf`; and
- one `<case>-<editor>-print-page-1.png`.

The frozen expected page count is one. Across four cases the complete artifact set is 204 DOCX files (4 canonical plus 200 editor outputs), 8 TXT files, 8 PDFs, and 12 PNGs. The pure PDF inspector enforces its one-page result. DOCX one-page presentation is an editor observation within layout parity, not a structural-pagination claim by the DOCX inspector. The validator never requires or reads PNG content; it requires the fixed-code visual observation made from each successfully rendered PNG.

## Failure and BLOCKED boundary

Parseable negative candidate behavior is scientific evidence and returns safe fixed findings with a successful inspector invocation. Missing, damaged, duplicated, moved, or mixed frames; visible-text differences; carrier presentation; unsafe but parseable OOXML/PDF content; bad edit consequences; PDF encryption; or NVDA/editor parity failures map to `REJECT_PROFILE` failure codes.

Only absent/unreadable artifacts, path or schema violations, record-to-file/hash/inspection mismatches, malformed or unparseable DOCX/PDF, invalid UTF-8, missing tool/version/provenance, incomplete mandatory evidence, or an observer/application state explicitly marked unreliable are operationally `BLOCKED`. They throw or stop validation and no `run-001.json` is created. A readable result may never be converted to `BLOCKED` merely because it is unfavorable.

The exact ordered failure vocabulary is:

`canonical-structure-failed`, `source-frame-failed`, `source-anchor-failed`, `transformed-frame-failed`, `transformed-anchor-failed`, `visible-text-mismatch`, `carrier-presented`, `shaping-mismatch`, `grapheme-mismatch`, `bidi-order-mismatch`, `layout-mismatch`, `navigation-mismatch`, `search-mismatch`, `spellcheck-mismatch`, `clipboard-mismatch`, `insert-visible-mismatch`, `insert-frame-mismatch`, `undo-redo-mismatch`, `backspace-visible-mismatch`, `backspace-frame-mismatch`, `forward-delete-visible-mismatch`, `forward-delete-frame-mismatch`, `print-preview-mismatch`, `pdf-encrypted`, `pdf-page-count-mismatch`, `pdf-text-order-mismatch`, `pdf-placeholder-present`, `pdf-render-failed`, `pdf-render-mismatch`, `pdf-unsafe-content`, `specialized-view-decoded-payload`, `specialized-view-navigation-trap`, `specialized-view-residual-layout`, `hidden-property-present`, `unexpected-default-ignorable`, `normalization-mismatch`, `segmentation-mismatch`, `package-unsafe`, `relationship-unsafe`, `macro-or-active-content`, `metadata-privacy-unresolved`, `nvda-spoken-text-mismatch`, `nvda-reading-order-mismatch`, `nvda-extra-announcement`, `nvda-join-control-announcement`, `nvda-navigation-mismatch`, `nvda-navigation-trap`, `nvda-selection-feedback-mismatch`, `nvda-editing-feedback-mismatch`, and `nvda-speech-viewer-mismatch`.

Zero codes derives `QUALIFY_PROFILE` / `all-mandatory-criteria-passed`; one or more derives `REJECT_PROFILE` / `mandatory-criteria-failed`.

## Withdrawn illustrative record sketch (non-normative)

The sole normative record schema is the exact, recursively closed schema in
`research/experiments/docx-join-control-accessibility-qualification-v1/protocol.md`
under **Recursively closed record schema**. That protocol schema controls every
field name, nesting level, enum, tuple cardinality, conditional invariant, and
derivation rule. The older TypeScript sketch retained below is withdrawn and
must not be used for implementation; where it differs from the protocol, the
protocol is authoritative. No implementation-time schema choices are permitted.

The withdrawn sketch is retained only as historical planning context:

```typescript
type QualificationRunRecord = Readonly<{
  schemaVersion: 1;
  experimentId: "glyph-exp-docx-zero-width-join-control-qualification-v1-001";
  qualificationProfile: "docx-zero-width-join-control-qualification-v1";
  candidateId: "join-control-binary-v1";
  documentProfile: "docx-zero-width-join-control-v1";
  implementation: ImplementationProvenance;
  environments: { macos: MacEnvironment; windowsNvda: WindowsNvdaEnvironment };
  cases: readonly [CaseEvidence, CaseEvidence, CaseEvidence, CaseEvidence];
  deviations: readonly ProtocolDeviationCode[];
  limitations: readonly RequiredLimitationCode[];
  gate: {
    failureCodes: readonly QualificationFailureCode[];
    decision: "QUALIFY_PROFILE" | "REJECT_PROFILE";
    rationale: "all-mandatory-criteria-passed" | "mandatory-criteria-failed";
  };
}>;

type CaseEvidence = Readonly<{
  caseId: QualificationCaseId;
  canonical: DocxArtifactEvidence;
  editors: readonly [EditorEvidence, EditorEvidence];
}>;

type EditorEvidence = Readonly<{
  editorId: "google-docs" | "microsoft-word";
  sourceCanonicalSha256: string;
  roundtrip: DocxArtifactEvidence;
  mutations: readonly [
    MutationEvidence, MutationEvidence, MutationEvidence, MutationEvidence,
    MutationEvidence, MutationEvidence, MutationEvidence, MutationEvidence,
    MutationEvidence, MutationEvidence, MutationEvidence, MutationEvidence,
  ];
  clipboard: TextArtifactEvidence;
  pdf: PdfArtifactEvidence;
  primary: PrimaryObservationCodes;
  specializedView: SpecializedViewObservationCodes;
  spellcheck: SpellcheckObservationCodes;
  printPreview: "parity" | "mismatch";
  accessibilityAssistant: "no-carrier-finding" | "carrier-related-finding" | "unavailable" | "not-applicable";
  nvda: NvdaObservationCodes;
}>;

type ImplementationProvenance = Readonly<{
  gitRevision: string;
  protocolPath: "research/experiments/docx-join-control-accessibility-qualification-v1/protocol.md";
  protocolSha256: string;
  fixturePath: "research/experiments/docx-join-control-accessibility-qualification-v1/fixture.ts";
  fixtureSha256: string;
  generatorPath: "src/documents/docx/docx-join-control-accessibility-qualification-v1.ts";
  generatorSha256: string;
  validatorPath: "scripts/validate-docx-join-control-qualification-run.ts";
  validatorSha256: string;
  nodeVersion: string;
  icuVersion: string;
  unicodeVersion: string;
  uvVersion: "0.12.9";
  pythonVersion: "3.14.7";
  pythonUnicodeVersion: "16.0.0";
  pypdfVersion: "6.10.0";
  pdftoppmVersion: "26.05.0";
}>;

type MacEnvironment = Readonly<{
  macosVersion: string;
  chromeVersion: string;
  googleDocsVersion: "not-exposed";
  wordForMacVersion: string;
}>;

type WindowsNvdaEnvironment = Readonly<{
  windows11Version: string;
  nvdaVersion: "2026.2";
  espeakNgVersion: string;
  chromeVersion: string;
  googleDocsVersion: "not-exposed";
  wordMicrosoft365Version: string;
  keyboardLayout: "us-english-desktop";
  settingsProfile: "nvda-join-control-qualification-v1";
}>;

type DocxArtifactEvidence = Readonly<{
  path: string; sha256: string; sourceCanonicalSha256: string;
  inspection: Readonly<{
    frameState: "exact" | "missing" | "damaged" | "duplicate" | "moved" | "mixed";
    anchorState: "expected" | "unexpected";
    visibleTextState: "exact" | "mismatch";
    hiddenPropertyState: "absent" | "present" | "unresolved";
    defaultIgnorableState: "allowlisted-only" | "unexpected";
    normalizationState: "stable" | "mismatch";
    segmentationState: "expected" | "mismatch";
    packageSafetyState: "safe" | "unsafe";
    coreMetadata: DocxCoreMetadataClassifications;
    findings: readonly QualificationFailureCode[];
  }>;
}>;

type TextArtifactEvidence = Readonly<{
  path: string; sha256: string; sourceCanonicalSha256: string;
  lineEndings: "lf" | "crlf";
  frameState: "exact" | "missing" | "damaged" | "duplicate" | "mixed";
  visibleTextState: "exact" | "mismatch";
  defaultIgnorableState: "allowlisted-only" | "unexpected";
  normalizationState: "stable" | "mismatch";
  segmentationState: "expected" | "mismatch";
  findings: readonly QualificationFailureCode[];
}>;

type PdfArtifactEvidence = Readonly<{
  path: string; sha256: string; sourceCanonicalSha256: string;
  encrypted: boolean; pageCount: number | null;
  visibleTextState: "exact-order" | "mismatch" | "not-inspectable-encrypted";
  placeholderState: "absent" | "present" | "not-inspectable-encrypted";
  safetyState: "safe" | "unsafe" | "not-inspectable-encrypted";
  metadata: PdfMetadataClassifications | "not-inspectable-encrypted";
  render: "rendered-one-page" | "failed" | "not-run-encrypted";
  visualParity: "parity" | "mismatch" | "not-observed-render-failed" | "not-observed-encrypted";
  findings: readonly QualificationFailureCode[];
}>;

type MetadataClassification = "absent" | "empty" | "synthetic_expected" | "non_synthetic_redacted";
type DocxCoreMetadataClassifications = Readonly<{
  creator: MetadataClassification; lastModifiedBy: MetadataClassification;
  otherCore: MetadataClassification;
}>;
type PdfMetadataClassifications = Readonly<{
  author: MetadataClassification; creator: MetadataClassification;
  producer: MetadataClassification; title: MetadataClassification;
  subject: MetadataClassification; keywords: MetadataClassification;
  creatorTool: MetadataClassification; otherInfo: MetadataClassification;
  otherXmp: MetadataClassification;
}>;

type MutationEvidence = Readonly<{
  target: "control-alpha" | "marked-alpha" | "control-beta" | "marked-beta";
  operation: "insert" | "backspace" | "forward-delete";
  result: DocxArtifactEvidence; restored: DocxArtifactEvidence;
  visibleConsequence: "expected" | "mismatch";
  frameConsequence: "exact" | "mismatch";
}>;

type PrimaryObservationCodes = Readonly<{
  visibleText: "parity" | "mismatch"; shaping: "parity" | "mismatch";
  graphemes: "parity" | "mismatch"; carrierPresentation: "absent" | "present";
  layout: "parity" | "mismatch"; bidiOrder: "parity" | "mismatch";
  navigation: "parity" | "mismatch"; search: "both-rows-found" | "mismatch";
  clipboardSelection: "body-only" | "mismatch";
  selectionPresentation: "absent" | "present";
}>;

type SpecializedViewObservationCodes = Readonly<{
  presentation: "none" | "generic-indicator-only" | "decoded-payload";
  navigation: "parity" | "trap"; residualLayout: "none" | "present";
}>;

type SpellcheckObservationCodes = Readonly<{
  pairFindings: "same" | "different";
  pairSuggestionPresence: "same" | "different";
  latinBetaMisspelling: "same" | "different" | "not-applicable";
}>;

type NvdaObservationCodes = Readonly<{
  spokenText: "parity" | "mismatch"; readingOrder: "parity" | "mismatch";
  extraAnnouncements: "none" | "present"; joinControlAnnouncement: "absent" | "present";
  navigation: "parity" | "mismatch"; navigationTrap: "absent" | "present";
  selectionFeedback: "parity" | "mismatch"; editingFeedback: "parity" | "mismatch";
  speechViewer: "parity" | "mismatch";
}>;
```

Every artifact `path` is repository-relative, confined to the M2E artifact root, and every hash/revision is lowercase hexadecimal with an exact validated length; the four provenance paths exact-match their non-artifact literals. The twelve mutations are ordered insert, backspace, forward-delete, each in `control-alpha`, `marked-alpha`, `control-beta`, `marked-beta` order. `ProtocolDeviationCode` is exactly `docx-core-metadata-redacted`, `pdf-metadata-redacted`, or `accessibility-assistant-unavailable`. Required limitations are exactly `tested-configurations-only`, `voiceover-not-assessed`, `other-screen-readers-not-assessed`, `no-universal-accessibility-claim`, `no-production-readiness-claim`, `no-pilot-readiness-claim`, `no-ai-ingestion-claim`, `no-model-compliance-claim`, `no-authorship-claim`, `no-prompt-reuse-claim`, `no-intent-claim`, `no-cheating-claim`, and `no-misconduct-claim`; non-synthetic DOCX/PDF metadata additionally requires its matching `docx-core-metadata-requires-privacy-review` or `pdf-metadata-requires-privacy-review` limitation.

Task 1 is a documentation-only specification subphase. Execution must stop after Task 1 until two independent read-only reviews confirm that `protocol.md` contains the sole exact recursively closed schema and makes no new scientific choice. This review is the approval barrier for Tasks 2–11 and does not require another manual user prompt unless it discovers a material scope conflict.

## File map

| File | Responsibility |
| --- | --- |
| `research/experiments/docx-join-control-accessibility-qualification-v1/protocol.md` | Frozen cases, operations, NVDA settings, evidence schema, failure vocabulary, and gate. |
| `research/experiments/docx-join-control-accessibility-qualification-v1/fixture.ts` | Implements the protocol-frozen case strings, rows, directions, languages, anchors, allowlists, artifact names, and checkpoint expectations. |
| `src/documents/docx/docx-join-control-accessibility-qualification-v1.ts` | In-memory canonical generator using the unchanged M2D codec. |
| `research/experiments/docx-join-control-accessibility-qualification-v1/inspect-qualification-docx.ts` | Qualification-aware frame, anchor, text, property, OOXML safety, normalization, and segmentation inspection. |
| `research/experiments/docx-join-control-accessibility-qualification-v1/inspect-qualification-text.ts` | Strict UTF-8 clipboard inspection with fixed safe outputs. |
| `research/experiments/docx-join-control-accessibility-qualification-v1/inspect-qualification-pdf.py` | Bounded PDF parse, extraction comparison, action/attachment checks, and redacted metadata classification. |
| `scripts/lib/research-artifact-io.ts` | Shared repository-bounded create-only/read-only file operations for M2E commands. |
| `scripts/generate-docx-join-control-qualification.ts` | Safe one-case canonical generation and SHA-256 output. |
| `scripts/inspect-docx-join-control-qualification.ts` | Safe source/transformed/checkpoint DOCX inspection. |
| `scripts/inspect-text-join-control-qualification.ts` | Safe clipboard TXT inspection. |
| `scripts/inspect-pdf-join-control-qualification.ts` | Pure read-only wrapper for the frozen Python PDF inspector. |
| `scripts/render-pdf-join-control-qualification.ts` | Separate create-only Poppler rendering command for ignored PNG evidence. |
| `scripts/validate-docx-join-control-qualification-run.ts` | Exact-shape record validation, local reinspection, hash linkage, failure-code derivation, and gate. |
| `tests/documents/docx-join-control-accessibility-qualification.test.ts` | Fixture, generator, DOCX inspection, Unicode, hidden-property, and package-safety tests. |
| `tests/research/join-control-qualification-command-safety.test.ts` | Argument, path, overwrite, symlink, privacy, and non-mutation tests. |
| `tests/research/join-control-qualification-pdf.test.ts` | PDF parser/renderer safety and privacy tests. |
| `tests/research/join-control-qualification-record.test.ts` | Recursive schema, artifact linkage, evidence completeness, failure mapping, and gate tests. |
| `research/experiments/docx-join-control-accessibility-qualification-v1/run-001.json` | Completed non-blocked record only. |
| `.superpowers/sdd/2026-09-04-milestone-2e-join-control-accessibility-qualification/progress.md` | Durable state, hashes, observations, reviews, blockers, and exact next command. |

---

### Task 1: Freeze the protocol, ledger, and milestone boundary before coding

**Files:** Create `protocol.md` and the progress ledger; modify `.gitignore`, `AGENTS.md`, `docs/MVP_SPEC.md`, and `docs/EXPERIMENTS.md`. Do not create `fixture.ts` or document uninstalled commands in `docs/TESTING.md` yet.

- [ ] Write the protocol with every fixture, operation, artifact, schema, evidence enum, failure code, gate, and stop rule fixed in the tables above. No scientific choice remains delegated to implementation.
- [ ] Freeze checkpoint IDs as `canonical`, `roundtrip`, plus the exact target-qualified insert/backspace/forward-delete result and restored forms defined above. Freeze the closed `QualificationMutationTarget` union and finite checkpoint list in the protocol.
- [ ] Freeze the shared canonical and per-editor artifact matrix exactly as specified above; canonicals are never editor-qualified.
- [ ] Define fixed ordered failure codes for canonical structure, transformed structure, text parity, visual/shaping/grapheme/bidi/layout, navigation/search/spellcheck/copy, insert/undo/redo/delete, print/PDF, specialized views, package/security, metadata/privacy, and NVDA speech/order/navigation/selection/editing.
- [ ] Update milestone docs narrowly: M2D selected Candidate A; M2E is the current qualification; M3 remains blocked.
- [ ] Add only `research/artifacts/docx-join-control-accessibility-qualification-v1/*` to `.gitignore`.
- [ ] Verify `pnpm lint` and `git diff --check`.
- [ ] Obtain independent protocol/science and privacy/scope reviews of the documentation-only freeze. Resolve every finding, commit the reviewed protocol checkpoint, and only then begin TypeScript fixture work.

### Task 2: Implement the generator and qualification DOCX/TXT inspectors test-first

**Files:** Create the generator, DOCX/text inspectors, their document tests, and shared artifact I/O.

- [ ] Write failing fixture tests for exact case order, strings, code points, languages, direction, row order, one Alpha/Beta marker, exact anchors, visible ZWNJ/ZWJ allowlists, and absence of bidi controls/default ignorables elsewhere.
- [ ] Implement `fixture.ts` only after the tests fail. Export closed case/checkpoint/target types, `JOIN_CONTROL_QUALIFICATION_CASES`, `qualificationCase(id)`, and `expectedCaseState(caseId, checkpointId)` directly from the frozen protocol values.
- [ ] Write failing generator tests requiring ordinary body-only carrier runs, no run properties, exact 120-code-point frames, row/control equivalence after validated removal, explicit language/direction, and stable package safety.
- [ ] Implement `generateJoinControlQualificationDocx(fixture): Promise<Uint8Array>` with `docx`, importing `encodeCarrier` and `CANDIDATE_A` from immutable M2D modules.
- [ ] Write failing inspector tests for canonical and transformed editor splitting/merging of carrier runs; exact part/paragraph/run/code-point positions; legitimate Persian/emoji controls; malformed, mixed, duplicate, moved, and non-body frames; hidden properties through style/default inheritance; macros, active content, external/unresolved relationships; and redacted metadata.
- [ ] Implement `inspectJoinControlQualificationDocx(bytes, caseId, checkpointId, mode)`. Call immutable `inspectZeroWidthDocx(bytes, CANDIDATE_A.id, "transformed")` and consume only its `safety`, `coreMetadata`, and effective property findings linked to checksum-valid Alpha/Beta frames. Independently parse the new body locations, anchors, visible text, and legitimate Persian/emoji controls. Tests must prove every old M2D anchor/body/frame error is ignored and cannot enter M2E evidence.
- [ ] Write failing text tests for strict UTF-8, exact visible row order, allowed legitimate controls, exact/missing/damaged frames, NFC/NFKC observation, grapheme/word/paragraph segmentation, and exact Node/ICU/Unicode/locale/granularity provenance.
- [ ] Implement `inspectJoinControlQualificationText(bytes, caseId, checkpointId)` without normalization or repair.
- [ ] Implement repository-bounded `readRepositoryRegularFile` and `writeNewRepositoryArtifact` using realpath containment, non-symlink regular-file checks, and create-only writes.
- [ ] Verify focused tests: `pnpm test -- tests/documents/docx-join-control-accessibility-qualification.test.ts`.

### Task 3: Implement privacy-safe PDF inspection and rendering test-first

**Files:** Create the Python inspector, pure TypeScript inspection wrapper, separate renderer, and PDF tests. Modify `package.json` and `docs/TESTING.md` only for the command contract.

- [ ] Add a PEP 723 header pinning Python `3.14.7` and only `pypdf==6.10.0`; execute it with `uv run --no-project --script`. Freeze exact version capture for Python, its Unicode data, uv, pypdf, and pdftoppm. A missing or mismatched tool is operationally `BLOCKED`. Do not add a Python project or product dependency.
- [ ] Write adversarial tests that generate disposable synthetic PDFs for parse failure, encryption, page-count mismatch, text-order mismatch, extracted ZWNJ/ZWJ frames, replacement/control placeholders, attachments, JavaScript, launch/URI/open actions, annotations, malformed object graphs, metadata redaction, and bounded traversal.
- [ ] Implement in-process text comparison that returns only booleans/counts/fixed codes. Raw extracted text and metadata values must not appear in stdout, stderr, exceptions, snapshots, or records.
- [ ] Traverse objects with fixed visited-object, depth, and object-count limits. Reject `/EmbeddedFiles`, `/Filespec`, `/FileAttachment`, `/AF`, `/JavaScript`, `/JS`, `/Launch`, `/URI`, unsafe `/OpenAction` or `/AA`, and every annotation.
- [ ] Classify Info/XMP identity-bearing and unknown fields only as `absent`, `empty`, `synthetic_expected`, or `non_synthetic_redacted`. A non-synthetic classification requires `pdf-metadata-redacted` and `pdf-metadata-requires-privacy-review` in the record.
- [ ] Keep `inspect-pdf` pure and read-only so the validator can repeat it. Implement `render-pdf` separately using `pdftoppm` with an argument array, no shell, `LC_ALL=C`, fixed 144 DPI, suppressed raw stderr, create-only outputs, and exact page count.
- [ ] Keep PNGs and optional raw extraction outputs ignored and outside the tracked record. Automated rendering proves renderability only; paired visual parity remains separately observed evidence.
- [ ] Verify: `pnpm test -- tests/research/join-control-qualification-pdf.test.ts`.

### Task 4: Implement the safe command surface test-first

**Files:** Create generation/inspection scripts and command-safety tests; add six exact `package.json` scripts.

- [ ] Add commands `research:carrier:join-control-qualification:generate`, `inspect-docx`, `inspect-text`, `inspect-pdf`, `render-pdf`, and `validate`.
- [ ] Require exact argument counts and closed case/checkpoint/mode enums. All paths are repository-relative and restricted to the M2E artifact root.
- [ ] Generation accepts one case ID and writes only its canonical filename. Inspection is read-only. Rendering refuses any pre-existing target or symlink.
- [ ] Emit only stable JSON containing IDs, relative paths, lowercase SHA-256, safe counts, locations, classifications, booleans, and fixed finding codes.
- [ ] Write tests for missing/extra/invalid arguments, absolute and traversal paths, symlinked roots/files, non-regular files, overwrite attempts, command injection strings, malformed inputs, privacy redaction, and zero source-tree mutation.
- [ ] Verify: `pnpm test -- tests/research/join-control-qualification-command-safety.test.ts`.

### Task 5: Implement the exact record validator and binary gate test-first

**Files:** Create `validate-docx-join-control-qualification-run.ts` and its tests; freeze the exact schema in `protocol.md`.

- [ ] Define a recursively closed record containing only frozen identifiers, implementation provenance, safe versions, artifact paths/hashes, inspector evidence, fixed observation codes, deviations, limitations, sorted failure codes, one rationale code, and the derived decision.
- [ ] Require four cases, two editors, all canonical/round-trip/checkpoint DOCX artifacts, both clipboard TXT artifacts, both PDFs, primary visual/special-mode/print observations, and both NVDA application paths.
- [ ] Recompute every SHA-256, re-run each pure DOCX/TXT/PDF inspector, compare exact evidence, validate source lineage, and reject duplicates, missing evidence, unknown keys, unsafe strings, raw metadata/text/transcripts, non-local paths, and schema drift. Never invoke the create-only renderer from validation.
- [ ] Implement an exhaustive ordered failure-code derivation. Missing/unreliable fields throw operational `BLOCKED`; otherwise zero failures returns `QUALIFY_PROFILE` and one or more failures returns `REJECT_PROFILE`.
- [ ] Test one minimal fully passing record, every mandatory failure family, combinations and deterministic sorting, Candidate A/profile mismatch, canonical hash mismatch, transformed source mismatch, privacy leakage, unknown keys, and the impossibility of a third decision.
- [ ] Verify: `pnpm test -- tests/research/join-control-qualification-record.test.ts`.

### Task 6: Run the pre-generation freeze review

**Files:** All Task 1–5 changes; do not generate canonical artifacts yet.

- [ ] Run `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.
- [ ] Run focused old-carrier/M2D regressions and compare completed experiment-tree hashes against `caea053ef133d33b44a45b7d9907519b5d1688a2`.
- [ ] Audit command output and failure paths for secrets, raw text, metadata, URLs, identifiers, and frame leakage.
- [ ] Audit `.gitignore`, tracked binaries, lockfile, generated artifacts, milestone leakage, complete diff, and Git status.
- [ ] Obtain independent read-only protocol/science and code/privacy reviews. Resolve every finding and rerun affected checks.
- [ ] Freeze implementation provenance and the exact generator/fixture/protocol hashes in the progress ledger.
- [ ] Commit the coherent pre-generation implementation checkpoint. Do not generate canonicals before this commit.

### Task 7: Generate, hash, render, and structurally inspect the four canonicals

**Files:** Ignored artifact root and progress ledger only. Do not edit frozen implementation after generation.

- [ ] Before creating DOCX artifacts, run the document-artifact operation marker required by the `documents` skill.
- [ ] Generate each case exactly once with the versioned command. Record its lowercase SHA-256 in the progress ledger and never regenerate it.
- [ ] Re-run the generator for each case and prove it refuses replacement without changing the hash.
- [ ] Inspect every canonical in `source` mode and require exact frames, anchors, control equivalence, allowlisted controls, segmentation observations, property state, metadata classification, and package safety.
- [ ] Render every canonical page using the document skill’s renderer, inspect every PNG visually, and record only fixed parity/layout codes in the ledger.
- [ ] If any canonical hash or structural contract differs, stop. A fix requires a new qualification version, not an in-place artifact replacement.
- [ ] Commit only the updated progress ledger; generated files remain ignored.

### Task 8: Collect Google Docs and Word for Mac evidence

**Files:** Ignored artifacts and progress ledger. The frozen protocol and implementation remain unchanged.

- [ ] For each case, independently import the canonical into a new unshared Google Docs document and independently open the canonical in Word for Mac. Never chain editor outputs.
- [ ] Before selection/search/editing/special modes, record fixed codes for visible control/marked parity, shaping, grapheme integrity, carrier/placeholder visibility, wrapping/layout, and LTR/RTL order at 100%.
- [ ] Run paragraph/word/character navigation, fixed cross-anchor searches, paired spellcheck observation, one ordinary-body copy, and UTF-8 plain-text paste.
- [ ] On a separate fresh canonical import/open for each of the four target rows, run insert/undo/redo/restored, backspace/result/restored, and forward-delete/result/restored operations. Export every target-qualified DOCX checkpoint.
- [ ] Run Word Show/Hide and Google Docs non-printing-character display only after primary observations. Run Word Accessibility Assistant last. Record fixed codes only.
- [ ] From a dedicated fresh canonical import/open for each editor/case, open print preview and export one PDF. Inspect and render with the frozen PDF commands, then visually compare paired rows and record fixed codes.
- [ ] Compute hashes and structurally inspect all DOCX, TXT, and PDF outputs. Record deviations and privacy-safe metadata classifications.
- [ ] If automation cannot make any observation reliable, use `BLOCKED`; do not fabricate or silently substitute evidence.

### Task 9: Collect the Windows 11 / NVDA 2026.2 hard-gate evidence

**Files:** Ignored artifacts and progress ledger only until evidence is complete.

- [ ] Verify exact Windows, NVDA, eSpeak NG, Chrome, Google Docs, and Word versions/settings before opening a case. A mismatch is `BLOCKED`.
- [ ] With no add-ons, braille disabled, the frozen voice/settings, Google Docs focus mode, and Word Print Layout, read every control/marked row by paragraph, word, and character in both applications.
- [ ] Run the frozen selection and editing key sequences. Record only fixed codes for spoken parity, reading order, pauses/announcements, joiner/control/blank/unknown-glyph speech, extra stops/traps, selection/editing feedback, and Speech Viewer parity after removing fixed row labels.
- [ ] Never persist raw Speech Viewer output, account data, document IDs, URLs, or usernames.
- [ ] If NVDA, either application, or Speech Viewer is unavailable or unreliable, update the ledger with the exact operational blocker and next step; do not create `run-001.json`.

### Task 10: Create the completed record and apply the gate mechanically

**Files:** Create `run-001.json` only when all mandatory evidence is reliable; update the ledger and handoff.

- [ ] Assemble the exact record exclusively from local inspected evidence and fixed observation codes.
- [ ] Run `pnpm research:carrier:join-control-qualification:validate` and require exact local artifact/hashes/inspection equality.
- [ ] Confirm sorted derived failure codes and matching rationale. Accept only `QUALIFY_PROFILE` for zero failures or `REJECT_PROFILE` for one or more failures.
- [ ] Preserve all required tested-boundary, VoiceOver, other-screen-reader, production, pilot, AI-ingestion, model-compliance, authorship, prompt-reuse, intent, cheating, and misconduct limitations.
- [ ] If incomplete, leave `run-001.json` absent and report `BLOCKED`; filenames or partial observations never imply a decision.

### Task 11: Complete final verification, reviews, commit, and branch synchronization

**Files:** Entire in-scope diff; no PR or merge.

- [ ] Run `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` from a clean dependency state.
- [ ] Run old-carrier regression, M2D regression, fixture/generator, DOCX/TXT/PDF inspector, command-safety, record/gate, and artifact/hash validations.
- [ ] Audit secrets/privacy, ignored/generated artifacts, immutable completed experiments, milestone leakage, tracked binaries, lockfile, full diff, and Git status.
- [ ] Obtain fresh independent read-only protocol/science and code/safety/privacy/history reviews; resolve findings and rerun affected verification.
- [ ] Update the durable handoff with branch, base, latest verified commit, immutable hashes, evidence, gate or blocker, remaining work, and exact next command.
- [ ] Commit the final coherent Milestone 2E result or blocked external-environment checkpoint and push the verified branch to `origin` without force.
- [ ] Do not merge and do not open a pull request without explicit user authorization.

## Stop conditions

Stop immediately and preserve evidence if a frozen canonical hash changes, an old experiment changes, a command exposes prohibited raw data, an artifact path escapes its root, required editor/NVDA evidence is unreliable, or the frozen protocol would need revision. Report the exact discrepancy or blocker; never regenerate, repair, tune, waive, infer, or fabricate a scientific result.
