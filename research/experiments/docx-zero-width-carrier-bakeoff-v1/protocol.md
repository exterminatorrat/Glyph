# Milestone 2D Zero-Width Carrier Bake-Off Protocol

Status: frozen before source generation or observation, 2026-09-03

## Decision and scope

Milestone 2D is one separately versioned DOCX transport bake-off for the
strongest zero-width carrier variants justified by the completed Milestone 2C
evidence.

- bake-off profile: `docx-zero-width-carrier-bakeoff-v1`
- experiment ID: `glyph-exp-docx-zero-width-carrier-bakeoff-v1-001`
- experiment schema version: `1`
- Candidate A: `join-control-binary-v1`
- Candidate A document profile: `docx-zero-width-join-control-v1`
- Candidate B: `invisible-operator-binary-v1`
- Candidate B document profile: `docx-zero-width-invisible-operator-v1`
- Candidate C: `variation-selector-byte-v1`
- Candidate C document profile: `docx-zero-width-variation-selector-v1`

Candidates A and B are selectable transport candidates in that order. Candidate
C is a non-selectable transport diagnostic and can never produce `SELECT_C`.
The bake-off qualifies document transport and ordinary presentation only. A
selection advances one document profile to a separately approved accessibility
and international-text qualification. It does not establish accessibility
safety, pilot readiness, production readiness, AI ingestion, model compliance,
authorship, prompt reuse, intent, cheating, or misconduct.

Milestones 2, 2B, and 2C are immutable historical experiments. This protocol
does not modify their protocols, fixtures, generators, inspectors, records, or
artifacts.

## Frozen fixture and placement

The fixture imports these values from
`research/experiments/docx-hidden-run-v1/fixture.ts` rather than duplicating or
editing them:

- visible fixture ID: `synthetic-library-hours-v1`
- the same three visible body paragraphs;
- the same logical marker anchors.

The visible paragraphs are, in order:

1. `Read the passage below. Then summarize its main idea in two sentences.`
2. `A neighborhood library extended its weekend hours so more residents could use its study rooms and book collection.`
3. `Explain one possible benefit of the schedule change. Then explain one possible drawback.`

Alpha is inserted immediately after the first sentence-ending full stop in body
paragraph 0 and before the existing ordinary space. Beta is inserted
immediately after the first sentence-ending full stop in body paragraph 2 and
before the existing ordinary space. Each candidate frame is one separate
ordinary body run at its anchor. Removing the two carrier runs yields the
three imported visible paragraphs exactly and in order.

Carrier runs have no `w:vanish`, explicit font size, character scaling,
character spacing, shading, highlighting, theme color, positioning, text box,
field, comment, header, footer, footnote, endnote, or other hiding mechanism.

## Shared logical frame

Every marker uses one fixed fifteen-byte frame. The frame contains no secret,
credential, fingerprint, real assignment marker, student work, or generated
assignment value.

| field | bytes |
| --- | --- |
| magic | `0x47 0x5A` (`GZ`) |
| frame version | `0x01` |
| marker ID Alpha/Beta | `0xA1` / `0xB2` |
| payload length | `0x08` |
| Alpha payload | `47 4C 59 50 48 41 30 31` (`GLYPHA01`) |
| Beta payload | `47 4C 59 50 48 42 30 31` (`GLYPHB01`) |
| checksum | CRC-16/CCITT-FALSE over the preceding thirteen bytes, big-endian |

The frozen complete frames are:

- Alpha: `47 5A 01 A1 08 47 4C 59 50 48 41 30 31 7D 62`
- Beta: `47 5A 01 B2 08 47 4C 59 50 48 42 30 31 01 6B`

The checksum profile is width `16`, polynomial `0x1021`, initial value
`0xFFFF`, input reflection `false`, output reflection `false`, and final XOR
`0x0000`.

Decoding succeeds only for the exact carrier alphabet, exact frame length,
magic, version, marker ID, payload length, payload, and checksum. The decoder
does not repair, normalize, guess, majority-vote, fuzzy-match, or partially
accept a frame. Duplicate, truncated, reordered, mixed-alphabet,
checksum-invalid, or unexpected extra frames fail the candidate observation.

## Candidate mechanisms

### Candidate A: framed join-control binary

Bits are emitted most-significant first. Bit `0` is `U+200C ZERO WIDTH
NON-JOINER`; bit `1` is `U+200D ZERO WIDTH JOINER`. Each fifteen-byte frame is
exactly 120 carrier code points. The placement is after punctuation and before
an ordinary space, so neither control is adjacent to a visible letter in the
frozen English fixture. Join controls can affect shaping in legitimate
international writing systems and are default-ignorable characters; those
risks require later qualification.

### Candidate B: framed invisible-operator binary

Bits are emitted most-significant first. Bit `0` is `U+2062 INVISIBLE TIMES`;
bit `1` is `U+2063 INVISIBLE SEPARATOR`. Each frame is exactly 120 BMP format
control code points. These controls do not intentionally add or suppress line
break opportunities, but arbitrary marker encoding is outside their intended
mathematical semantics and may be exposed or filtered by editors.

### Candidate C: compact variation-selector bytes

Each complete frame byte is emitted as one selector. Bytes `0x00` through
`0x0F` map to `U+FE00` through `U+FE0F`; bytes `0x10` through `0xFF` map to
`U+E0100` through `U+E01EF` with `codePoint = 0xE0100 + (byte - 0x10)`.
Each frame is exactly fifteen code points and follows the same preceding
full-stop anchor. Variation selectors are intended for standardized or
registered glyph variants, not arbitrary data extension, so Candidate C is
permanently diagnostic and non-selectable.

## Rejected variants

The bake-off excludes zero-width space because it creates line-break
opportunities; word joiner because it suppresses line breaks; soft hyphen
because it can render at a line break; bidirectional controls or isolates
because they can alter reading order; tag characters because their conformant
use is tied to defined tag protocols; private-use characters because missing
fonts can expose replacement glyphs; combining marks because they can alter
graphemes or visible glyphs; full-width text with negative spacing or character
scaling because it retains the Milestone 2C width mechanism; hidden text,
headers, comments, custom XML, document properties, and other non-body
carriers because they fail the ordinary clipboard requirement; and composite
or redundant mechanisms because they prevent attribution to one carrier.

## Canonical and transformed artifacts

All artifacts are ignored under:

`research/artifacts/docx-zero-width-carrier-bakeoff-v1/`

Canonical source names are exactly:

- `join-control-binary-v1.docx`
- `invisible-operator-binary-v1.docx`
- `variation-selector-byte-v1.docx`

For every candidate, transformed names are exactly the candidate ID followed
by one of:

- `-google-docs-roundtrip.docx`
- `-google-docs-copy-plain-text.txt`
- `-microsoft-word-roundtrip.docx`
- `-microsoft-word-copy-plain-text.txt`

No aliases are permitted. A generator refuses to replace an existing regular
file or symbolic link and never unlinks or regenerates it. Canonical sources
are generated once, hashed before either editor opens, structurally inspected,
and then frozen. A hash discrepancy stops execution.

Automated tests generate only in memory or disposable temporary repositories;
they never write a real canonical path. No DOCX or TXT artifact is committed.

## Independent editor workflows

The unchanged canonical source is imported independently in current desktop
Chrome Google Docs and opened independently in Microsoft Word for Mac, in this
order: Candidate A, Candidate B, Candidate C. A transformed output is never
used as another editor's input.

If any upload, export, save, clipboard, visual, or other required observation
is unreliable, the run is operationally `BLOCKED`; no filename or assumed
application behavior substitutes for evidence, and no `run-001.json` is made.

### Google Docs

1. Create one new unshared document and import only the matching canonical DOCX.
2. At 100% in default paginated white-page view, before searching, selecting,
   copying, or using an accessibility surface, record visible-body integrity,
   carrier presentation, and layout disturbance.
3. Export a DOCX to the exact Google Docs round-trip filename.
4. Click ordinary body content, select the body exactly once, and record the
   selection observation.
5. Copy exactly once, paste as UTF-8 plain text, and save the exact clipboard
   filename.

Google Docs dark view and screen-reader behavior are exactly
`not_assessable`; they are not emulated with extensions, custom styles, or
operating-system changes.

### Microsoft Word

1. Open the unchanged canonical source directly.
2. At 100% in ordinary light Print Layout, before selection, record visible
   body, carrier presentation, and layout disturbance.
3. At 100% in Word's built-in dark page/canvas mode, record the same fields.
4. Save a DOCX copy to the exact Microsoft Word round-trip filename.
5. Return to ordinary body content, select once, record selection behavior,
   copy once as UTF-8 plain text, and save the exact clipboard filename.
6. Only after primary transport observations, run Word Accessibility Assistant
   and record factual findings without applying a suggested fix.

Word screen-reader behavior is exactly `not_assessable`.

## Inspection contract

DOCX inspection records package entries; every code point from every candidate
alphabet; OOXML part, body/non-body location, paragraph, run, and code-point
indexes; exact code-point sequence and count; decoded frame fields and checksum
status; Alpha/Beta presence; damaged, duplicate, mixed, unexpected, or
non-body carrier sequences; visible body after exact carrier removal; NFC/NFKC
stability as observations; forbidden run properties; relationship and active
content safety findings; macro content types; and redacted core metadata
classifications.

Source mode requires exactly Alpha in body paragraph 0 run 1 and Beta in body
paragraph 2 run 1, no candidate-alphabet code points elsewhere, one frame per
marker, no carrier run properties, and clean package safety. Each occurrence
also records a privacy-safe `U+...` code-point sequence, count, location, run
indexes, `context`, frozen-prefix/frame/suffix `anchor`, and nullable decoded
frame plus `decodeError`; damaged and undecodable expected-alphabet sequences
remain in the inspection rather than disappearing. Source carrier runs must
contain only their exact frame. Transformed mode allows benign split or merged
runs only when exact frames, body positions, visible body, and safety remain
valid. A transformed carrier must not move, duplicate, mix alphabets, gain
enabled hidden text, or become damaged.

The plain-text inspector validates UTF-8, records exact code-point labels and
indexes, decodes only contiguous exact expected-alphabet runs, retains every
truncated or undecodable run with its safe sequence, count, indexes, nullable
decoded frame, and decode error, reports normalization observations without
applying normalization, and removes only successfully identified carrier runs
when computing visible paragraphs.

The only forbidden carrier properties are enabled `w:vanish`, `w:webHidden`,
and `w:specVanish`. Explicitly disabled hidden properties are evidence but are
not forbidden. Other editor-added direct properties are recorded with
privacy-safe classifications; arbitrary literal values are redacted.

Effective hidden state resolves direct run properties, `docDefaults`, the
paragraph style, character styles, and every `w:basedOn` ancestor. Style
definitions retain their `w:type` and `w:default` state; when an explicit
paragraph or character style is absent, the one unambiguous matching default
style is applied with the frozen precedence `docDefaults`, paragraph style,
character style, then direct run properties. Ambiguous duplicate defaults,
missing referenced styles, based-on cycles, linked styles, incompatible style types, and
other unhandled inheritance are unresolved findings and fail
source/transformed conformance even when the direct carrier run has no
`w:rPr`. Package entry names and relationship findings use only allowlisted
standard labels, fixed classifications, or stable redacted IDs; relationship
targets, types, URLs, and personal text are never returned. Unknown OOXML run
property labels are replaced by stable generic redacted IDs.

Core `dc:creator` and `cp:lastModifiedBy` values are classified only as
`absent`, `empty`, `synthetic_expected`, or `non_synthetic_redacted`. No raw
personal value enters an error, log, output, fixture, record, or documentation.
If transformed metadata is `non_synthetic_redacted`, the record requires a
protocol deviation and distribution limitation, but this does not itself alter
transport status.

## Record vocabulary and exact shape

`BLOCKED` is an operational state outside `run-001.json`. A non-blocked run
contains exactly the following recursive shape; no extra properties are
allowed.

```typescript
type SHA256 = string;
type MarkerPresence = "present" | "absent";
type VisibleBody = "preserved" | "changed" | "lost" | "not_assessable";
type CarrierPresentation =
  | "not_visible"
  | "visible_marker_or_codepoint"
  | "replacement_or_control_placeholder";
type LayoutDisturbance = "none_observed" | "minor" | "material";
type SelectionObservation =
  | "nothing_observed"
  | "carrier_or_placeholder_revealed"
  | "not_assessable";
type ViewObservationCode =
  | "body-preserved"
  | "carrier-not-visible"
  | "layout-none-observed"
  | "layout-minor"
  | "layout-material";
type AccessibilityFindingCode =
  | "accessibility-assistant-contrast-finding"
  | "accessibility-assistant-no-finding";
type TransportLimitation =
  | "transport-only"
  | "no-ai-ingestion-claim"
  | "no-model-compliance-claim"
  | "no-authorship-claim"
  | "no-prompt-reuse-claim"
  | "no-intent-claim"
  | "no-cheating-claim"
  | "no-misconduct-claim";
type ProtocolDeviationCode = "core-metadata-redacted";
type DistributionLimitationCode = "core-metadata-requires-privacy-review";
type EditorLimitationCode =
  | "google-dark-view-not-assessable"
  | "google-screen-reader-not-assessable"
  | "word-screen-reader-not-assessable"
  | "word-accessibility-assistant-not-assessable";
type ZeroWidthMarkerId = "alpha" | "beta";
type PackageCodePointOccurrence = Readonly<{
  codePoint: string;
  partName: string;
  location: OOXMLTextLocation;
  paragraphIndex: number;
  runIndex: number;
  codePointIndex: number;
}>;
type CarrierRunProperty = Readonly<{
  partName: string;
  paragraphIndex: number;
  runIndex: number;
  property: string;
  valueClassification: "absent_value" | "safe_literal" | "redacted_literal";
  safeValue: string | null;
}>;
type ForbiddenRunProperty = Readonly<{
  partName: string;
  paragraphIndex: number;
  runIndex: number;
  property: string;
}>;
type SafetyInspection = Readonly<{
  externalRelationships: readonly string[];
  unresolvedRelationshipTargets: readonly string[];
  activeContentEntries: readonly string[];
  activeRelationshipTypes: readonly string[];
  macroContentTypes: readonly string[];
}>;
type GateDecision =
  | "SELECT_A"
  | "SELECT_B"
  | "REVISE_ZERO_WIDTH_CARRIER"
  | "ABANDON_ZERO_WIDTH_CARRIER";
type GateRationaleCode =
  | "candidate-a-transport-pass"
  | "candidate-b-transport-pass"
  | "bounded-transport-evidence-without-selectable-pass"
  | "no-bounded-transport-evidence";

type ArtifactEvidence = Readonly<{ path: string; sha256: SHA256 }>;
type ApplicationEvidence = Readonly<{ name: string; version: string | null }>;
type PlatformEvidence = Readonly<{
  name: string;
  version: string | null;
  build: string | null;
}>;
type ViewEvidence = Readonly<{
  zoomPercent: 100;
  visibleBody: VisibleBody;
  carrierPresentation: CarrierPresentation;
  layoutDisturbance: LayoutDisturbance;
  notes: readonly ViewObservationCode[];
}>;
type OOXMLTextLocation =
  | "body"
  | "header"
  | "footer"
  | "footnote"
  | "endnote"
  | "comments"
  | "other";
type DecodedFrame = Readonly<{
  markerId: "alpha" | "beta";
  bytes: readonly number[];
  magic: readonly [0x47, 0x5a];
  version: 1;
  payloadLength: 8;
  payloadHex: string;
  checksum: number;
  checksumValid: true;
}>;
type CarrierContext = "ordinary_body" | "non_ordinary";
type CarrierAnchor = "alpha_frozen" | "beta_frozen" | "not_frozen";
type DocxCarrierOccurrence = Readonly<{
  markerId: ZeroWidthMarkerId | null;
  partName: string;
  location: OOXMLTextLocation;
  paragraphIndex: number;
  runIndices: readonly number[];
  codePointIndexes: readonly number[];
  codePointCount: number;
  codePoints: readonly string[];
  decodedFrame: DecodedFrame | null;
  context: CarrierContext;
  anchor: CarrierAnchor;
  decodeError: string | null;
}>;
type CarrierRunInspection = Readonly<{
  startCodePointIndex: number;
  endCodePointIndexExclusive: number;
  codePointCount: number;
  codePoints: readonly string[];
  decodedFrame: DecodedFrame | null;
  error: string | null;
}>;
type CodePointOccurrence = Readonly<{
  codePoint: string;
  codePointIndex: number;
}>;
type ZeroWidthTextInspection = Readonly<{
  candidateId: CandidateId;
  validUtf8: true;
  byteLength: number;
  codePointLength: number;
  normalization: Readonly<{
    nfc: "unchanged" | "changed";
    nfkc: "unchanged" | "changed";
  }>;
  candidateCodePoints: readonly CodePointOccurrence[];
  unexpectedCandidateCodePoints: readonly CodePointOccurrence[];
  carrierRuns: readonly CarrierRunInspection[];
  markerPresence: Readonly<{ alpha: MarkerPresence; beta: MarkerPresence }>;
  frameErrors: readonly string[];
  visibleBodyParagraphs: readonly string[];
}>;
type InspectionEvidence = Readonly<{
  candidateId: CandidateId;
  mode: "source" | "transformed";
  entries: readonly string[];
  markerPresence: Readonly<{ alpha: MarkerPresence; beta: MarkerPresence }>;
  visibleBodyParagraphs: readonly string[];
  frameErrors: readonly string[];
  unexpectedCandidateCodePoints: readonly PackageCodePointOccurrence[];
  carrierOccurrences: readonly DocxCarrierOccurrence[];
  normalization: Readonly<{
    nfc: "unchanged" | "changed";
    nfkc: "unchanged" | "changed";
  }>;
  carrierRunProperties: readonly CarrierRunProperty[];
  forbiddenRunProperties: readonly ForbiddenRunProperty[];
  coreMetadata: Readonly<{
    creator: CoreMetadataClassification;
    lastModifiedBy: CoreMetadataClassification;
  }>;
  safety: SafetyInspection;
}>;
type PlainTextEvidence = Readonly<{
  status: "completed";
  sourceArtifactSha256: SHA256;
  resultArtifact: ArtifactEvidence;
  inspection: ZeroWidthTextInspection;
  protocolDeviation: ProtocolDeviationCode | null;
  notes: readonly never[];
}>;
type DocxRoundtripEvidence = Readonly<{
  status: "completed";
  sourceArtifactSha256: SHA256;
  resultArtifact: ArtifactEvidence;
  inspection: InspectionEvidence;
  protocolDeviation: ProtocolDeviationCode | null;
  distributionLimitations: readonly DistributionLimitationCode[];
  notes: readonly never[];
}>;
type GoogleDocsCandidateEvidence = Readonly<{
  application: ApplicationEvidence & { name: "Google Docs" };
  browser: ApplicationEvidence & { name: "Google Chrome" };
  platform: PlatformEvidence;
  documentRule: "one new unshared document";
  sourceArtifactSha256: SHA256;
  paginatedWhiteView: ViewEvidence;
  darkView: "not_assessable";
  docxRoundtrip: DocxRoundtripEvidence;
  plainTextCopy: PlainTextEvidence;
  selectionObservation: SelectionObservation;
  screenReader: "not_assessable";
  limitations: readonly EditorLimitationCode[];
}>;
type MicrosoftWordCandidateEvidence = Readonly<{
  application: ApplicationEvidence & { name: "Microsoft Word" };
  platform: PlatformEvidence;
  documentRule: "open canonical source independently";
  sourceArtifactSha256: SHA256;
  lightPrintLayout: ViewEvidence;
  darkPageCanvas: ViewEvidence;
  docxRoundtrip: DocxRoundtripEvidence;
  plainTextCopy: PlainTextEvidence;
  selectionObservation: SelectionObservation;
  accessibilityAssistant: Readonly<{
    status: "completed" | "not_assessable";
    findings: readonly AccessibilityFindingCode[];
    limitations: readonly EditorLimitationCode[];
  }>;
  screenReader: "not_assessable";
  limitations: readonly EditorLimitationCode[];
}>;
type CandidateRunEvidence = Readonly<{
  candidateId: CandidateId;
  documentProfile: DocumentProfile;
  selectable: boolean;
  priority: 1 | 2 | 3;
  canonicalArtifact: ArtifactEvidence & {
    inspection: InspectionEvidence;
  };
  googleDocs: GoogleDocsCandidateEvidence;
  microsoftWord: MicrosoftWordCandidateEvidence;
  transportCriteriaSatisfied: boolean;
  selectableCandidatePasses: boolean;
  limitations: readonly TransportLimitation[];
}>;
type ZeroWidthBakeOffRunRecord = Readonly<{
  experimentId: "glyph-exp-docx-zero-width-carrier-bakeoff-v1-001";
  experimentSchemaVersion: 1;
  date: `${number}-${number}-${number}`;
  bakeOffProfile: "docx-zero-width-carrier-bakeoff-v1";
  fingerprintStrategy: null;
  fingerprintStrategyVersion: null;
  matchingProfile: null;
  fixedFrames: Readonly<{
    alphaHex: "475a01a108474c5950484130317d62";
    betaHex: "475a01b208474c595048423031016b";
    crcProfile: "CRC-16/CCITT-FALSE";
  }>;
  visibleFixture: Readonly<{
    id: "synthetic-library-hours-v1";
    sourcePath: "research/experiments/docx-hidden-run-v1/fixture.ts";
  }>;
  sourceGenerator: Readonly<{
    path: "src/documents/docx/docx-zero-width-carrier-bakeoff-v1.ts";
    gitCommit: "3ffffdf5deb38cbd51a600b9e3a2c19c16040718";
    nodeVersion: string;
    pnpmVersion: string;
    docxVersion: "9.7.1";
  }>;
  candidates: readonly [
    CandidateRunEvidence,
    CandidateRunEvidence,
    CandidateRunEvidence,
  ];
  gateDecision: GateDecision;
  gateRationale: readonly [GateRationaleCode];
  limitations: readonly TransportLimitation[];
}>;
```

## Candidate pass and gate

A selectable candidate passes only when its canonical source is exact,
body-positioned, safe, and frame-valid; both independent DOCX round trips
preserve exact Alpha and Beta, visible body, body placement, and clean safety;
both independent plain-text copies preserve exact Alpha and Beta and visible
body; Google Docs white-page view, Word light Print Layout, and Word dark
page/canvas view each report `visibleBody: preserved`,
`carrierPresentation: not_visible`, and `layoutDisturbance: none_observed`.

Selection observations and Word Accessibility Assistant findings are retained
evidence but are not independent transport disqualifiers. Candidate C is
evaluated against the same criteria for diagnostics but can never pass the
selectable branch.

With complete reliable evidence, apply this fixed order:

1. `SELECT_A` if Candidate A passes.
2. Otherwise `SELECT_B` if Candidate B passes.
3. Otherwise `REVISE_ZERO_WIDTH_CARRIER` if any candidate preserves both exact
   frames and the visible body in at least one editor DOCX round trip or
   clipboard artifact.
4. Otherwise `ABANDON_ZERO_WIDTH_CARRIER`.

Missing, unreadable, or unreliable mandatory evidence is operationally
`BLOCKED`, not a scientific gate decision. A declared gate decision different
from the mechanically derived result is rejected. A selection is a transport
selection only and advances the named document profile to separate
accessibility and international-text qualification.

All persisted narrative-like leaves use fixed codes rather than free-form
text. Every candidate and the top-level record must use exactly these transport
limitations, in this order: `transport-only`, `no-ai-ingestion-claim`,
`no-model-compliance-claim`, `no-authorship-claim`, `no-prompt-reuse-claim`,
`no-intent-claim`, `no-cheating-claim`, and `no-misconduct-claim`. Gate
rationales are one fixed code matching the derived decision. Visual notes and
Accessibility Assistant findings use separate context-specific code sets;
artifact notes are exactly empty because their inspections carry the evidence;
protocol deviations and distribution limitations use fixed metadata-review
codes only. Google Docs must retain exactly
`google-dark-view-not-assessable` and `google-screen-reader-not-assessable`
limitations, and its `darkView` and `screenReader` fields are exactly
`not_assessable`. Word must retain exactly
`word-screen-reader-not-assessable`, its `screenReader` is exactly
`not_assessable`, and an unassessable Accessibility Assistant must use exactly
`word-accessibility-assistant-not-assessable`.

The source-generator `gitCommit` is the lowercase forty-character SHA
`3ffffdf5deb38cbd51a600b9e3a2c19c16040718`, the reviewed implementation
checkpoint immediately before canonical generation. The validator requires
that exact SHA and verifies that it resolves to a local commit object before
reading evidence. A malformed, missing, nonexistent, or different commit is
invalid provenance.

## Accessibility, privacy, and implementation boundary

Milestone 2D does not run VoiceOver or another screen reader and does not
establish international-script safety. Before Protect, pilot use, or any
production claim, a separate qualification must cover screen-reader exposure,
Word and Google Docs accessibility behavior, legitimate join-control shaping,
bidirectional text, search/edit/paste/undo/deletion, printing/PDF conversion,
special modes exposing default-ignorable characters, and downstream
normalization/security risks.

The implementation is limited to this versioned protocol and fixture, exact
frame utilities, candidate-aware DOCX generation and inspection, privacy-safe
commands and validation, tests, documentation, and the progress ledger. It
does not begin marker generation, FingerprintEngine, ExactCanary, semantic
canaries, model testing, Supabase, persistence, Protect, Analyze,
authentication, UI, deployment, or any product workflow.

Protocol, candidate, or schema changes after canonical generation require a new
versioned experiment. Generated artifacts remain ignored and untracked.
