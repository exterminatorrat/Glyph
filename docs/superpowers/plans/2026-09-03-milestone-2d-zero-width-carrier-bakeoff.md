# Glyph Milestone 2D Zero-Width Carrier Bake-Off Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and execute one versioned, transport-only DOCX bake-off that compares two selectable zero-width marker carriers and one permanently non-selectable diagnostic through independent Google Docs and Microsoft Word workflows.

**Architecture:** A frozen experiment fixture replaces readable marker text with exact checksum-protected byte frames and maps those bytes through three explicit Unicode carrier definitions. A dedicated generator, DOCX inspector, plain-text inspector, safe command surface, and exact-shape run validator remain isolated from the immutable Milestone 2, 2B, and 2C implementations; the validator derives the gate mechanically from locally re-inspected artifacts and recorded presentation evidence.

**Tech Stack:** Existing Node.js 26, TypeScript, pnpm 11.19.0, Vitest, `docx@9.7.1`, `fflate@0.8.3`, and `@xmldom/xmldom@0.9.12`; Google Docs in current desktop Chrome on macOS and Microsoft Word for Mac for the six independent editor workflows. No dependency, UI, model API, persistence system, converter, browser extension, or accessibility emulator is added.

**Spec:** [`docs/superpowers/specs/2026-09-03-milestone-2d-zero-width-carrier-bakeoff-design.md`](../specs/2026-09-03-milestone-2d-zero-width-carrier-bakeoff-design.md)

## Global Constraints

- Work only on `codex/milestone-2d-zero-width-carrier-bakeoff`, beginning from design commit `f04486e`.
- Preserve every path under `research/experiments/docx-hidden-run-v1/`, `research/experiments/docx-alternative-carrier-bakeoff-v1/`, and `research/experiments/docx-semantic-white-carrier-qualification-v1/` byte-for-byte.
- Bake-off profile is exactly `docx-zero-width-carrier-bakeoff-v1`; experiment ID is exactly `glyph-exp-docx-zero-width-carrier-bakeoff-v1-001`; schema version is exactly `1`.
- Candidate A is `join-control-binary-v1` with document profile `docx-zero-width-join-control-v1`; Candidate B is `invisible-operator-binary-v1` with document profile `docx-zero-width-invisible-operator-v1`; Candidate C is `variation-selector-byte-v1` with document profile `docx-zero-width-variation-selector-v1`.
- Candidates A and B are selectable in that order. Candidate C is a permanently non-selectable transport diagnostic and can never yield `SELECT_C`.
- Reuse the three visible paragraphs and logical marker positions from `synthetic-library-hours-v1` by import. Do not copy or edit the old fixture values.
- Alpha and Beta use the exact fifteen-byte frames `47 5A 01 A1 08 47 4C 59 50 48 41 30 31 7D 62` and `47 5A 01 B2 08 47 4C 59 50 48 42 30 31 01 6B`.
- CRC is CRC-16/CCITT-FALSE with polynomial `0x1021`, initial value `0xFFFF`, no reflection, final XOR `0x0000`, and big-endian serialization.
- Candidate A maps bit `0` to `U+200C` and bit `1` to `U+200D`; Candidate B maps bit `0` to `U+2062` and bit `1` to `U+2063`; both emit 120 code points per frame, most-significant bit first.
- Candidate C maps bytes `0x00..0x0F` to `U+FE00..U+FE0F` and bytes `0x10..0xFF` to `U+E0100..U+E01EF`; it emits fifteen code points per frame.
- Every source carrier is one separate ordinary body run after the first sentence-ending full stop in paragraph 0 or 2 and before the existing space. Source carrier runs have no run properties or secondary hiding mechanism.
- Decode only exact original code points. Never repair, normalize, guess, majority-vote, fuzzy-match, or partially accept a frame. NFC/NFKC results are observations only.
- Generate each canonical artifact exactly once. A generator must reject existing files and symlinks and must never replace, unlink, or regenerate them.
- Import each unchanged canonical source independently into a new unshared Google Docs document and open it independently in Word. Never chain an editor output into another workflow.
- Required presentation observations occur at 100% before searching, selecting, copying, or inspecting special surfaces: Google Docs paginated white-page view, Word light Print Layout, and Word built-in dark page/canvas.
- Ordinary-view carrier presentation must be `not_visible` and layout disturbance must be `none_observed` for a selectable transport pass. Selection evidence is recorded but does not gate independently.
- Google Docs dark view and all screen-reader behavior are exactly `not_assessable`. Run Word Accessibility Assistant only after the primary Word transport observations; its findings do not change the transport gate.
- Missing or unreliable mandatory evidence is operationally `BLOCKED` outside the scientific record. Do not create `run-001.json` for a blocked run.
- Generated DOCX and TXT files live only under ignored `research/artifacts/docx-zero-width-carrier-bakeoff-v1/` and are never committed.
- Core metadata values are never logged or recorded. Record only `absent`, `empty`, `synthetic_expected`, or `non_synthetic_redacted`; the last classification requires a deviation and distribution limitation but is non-gating.
- A selection establishes transport only. Never claim accessibility safety, pilot readiness, production readiness, AI ingestion, model compliance, authorship, prompt reuse, intent, cheating, or misconduct.
- Do not begin Milestone 3, ExactCanary, FingerprintEngine, semantic canaries, Supabase, Protect, Analyze, authentication, UI, or deployment.
- Use existing dependencies only. `pnpm-lock.yaml` must not change.
- One mutating implementer owns all overlapping files serially. Read-only reviewers may run in parallel only at the checkpoints named below and never edit the worktree.

## Controller rulings added before implementation

The following review rulings are binding refinements of the approved design and
apply to Tasks 1–5:

- Effective hidden state must resolve direct `w:vanish`, character and
  paragraph style inheritance including `basedOn` chains, and `docDefaults`.
  Cycles, missing referenced styles, or unhandled inheritance are unresolved
  findings and fail source/transformed conformance.
- The validator rejects the entire record unless all three canonical source
  inspections pass the exact source contract. Invalid canonical evidence is
  not a revision or abandonment outcome.
- A non-blocked record requires assessable visible-body, presentation, and
  layout evidence for Google paginated white, Word light, and Word dark views,
  and assessable selection observations in both editors. `not_assessable` is
  retained only for Google dark/screen-reader and appropriately unavailable
  Accessibility Assistant evidence with limitations.
- Readable negative DOCX/TXT evidence (missing, damaged, duplicate, or unsafe
  frames/packages) is emitted as complete safe JSON with exit status zero.
  Usage, path/read, malformed package/XML, and invalid UTF-8 errors remain
  nonzero; negative outputs are recordable evidence.
- Relationship and package-entry findings use only privacy-safe fixed
  classifications/counts or stable redacted finding IDs. Raw relationship
  targets, type strings, URLs, paths, and personal text never enter inspection
  objects, command output, errors, or records.

## Pre-generation hardening rulings

The following review findings were resolved before any canonical artifact was
generated. Where an earlier illustrative type or predicate in this plan is less
strict, the frozen protocol and implemented validator govern:

- Every candidate-alphabet sequence is retained as safe `U+...` evidence even
  when it is damaged or undecodable. DOCX occurrences include nullable decoded
  frames, a decode error, ordinary/non-ordinary context, and an exact frozen
  anchor classification.
- Fields, revisions, deleted or instruction text, text boxes, and other
  non-ordinary OOXML constructs cannot satisfy body transport. Canonical source
  carrier runs contain only the carrier frame, and source/transformed evidence
  must preserve the exact paragraph prefix/frame/suffix anchor.
- Effective hidden state includes unambiguous implicit default paragraph and
  character styles. Duplicate defaults, incompatible style inheritance,
  cycles, missing references, and linked styles are unresolved failures.
- All repeated core-metadata values are considered; duplicates or any
  unexpected value are conservatively `non_synthetic_redacted`. Unknown OOXML
  property names are represented only by stable redacted IDs.

## File Map

| File | Responsibility |
| --- | --- |
| `research/experiments/docx-zero-width-carrier-bakeoff-v1/protocol.md` | Frozen identifiers, frame mappings, workflows, record vocabulary, and mechanical gate. |
| `research/experiments/docx-zero-width-carrier-bakeoff-v1/fixture.ts` | Imports the old visible fixture and exposes the three explicit candidate definitions and marker slots. |
| `research/experiments/docx-zero-width-carrier-bakeoff-v1/frame.ts` | CRC, exact frame construction, candidate encoding/decoding, and strict carrier-run parsing. |
| `research/experiments/docx-zero-width-carrier-bakeoff-v1/inspect-zero-width-text.ts` | Shared code-point occurrence, frame, normalization, and visible-body inspection for Unicode text. |
| `src/documents/docx/docx-zero-width-carrier-bakeoff-v1.ts` | Generates one selected candidate DOCX in memory with no carrier run properties. |
| `research/experiments/docx-zero-width-carrier-bakeoff-v1/inspect-zero-width-docx.ts` | Candidate-aware OOXML position/property, package-safety, and redacted core-metadata inspection. |
| `scripts/generate-docx-zero-width-carrier.ts` | Safely creates one named canonical candidate once and prints its hash. |
| `scripts/inspect-docx-zero-width-carrier.ts` | Read-only repository-bounded source/transformed DOCX inspection. |
| `scripts/inspect-zero-width-plain-text.ts` | Read-only repository-bounded UTF-8 clipboard inspection. |
| `scripts/validate-docx-zero-width-carrier-run.ts` | Strict record, artifact, inspection-equality, privacy, and mechanical-gate validation. |
| `tests/research/zero-width-frame.test.ts` | Exact CRC, mapping, corruption, mixed-alphabet, and normalization tests. |
| `tests/documents/docx-zero-width-carrier-bakeoff.test.ts` | Generator, source/transformed structure, run-property, OOXML, metadata, and package-safety tests. |
| `tests/research/zero-width-carrier-command-safety.test.ts` | CLI argument, containment, symlink, overwrite, privacy, and non-mutation tests. |
| `tests/research/zero-width-carrier-record.test.ts` | Exact recursive record shape, artifact/hash linkage, inspection equality, and all gate outcomes. |
| `research/experiments/docx-zero-width-carrier-bakeoff-v1/run-001.json` | Completed non-blocked evidence record only. |
| `.superpowers/sdd/2026-09-03-milestone-2d-zero-width-carrier-bakeoff/progress.md` | Durable branch state, hashes, observations, rulings, reviews, and verification evidence. |
| `.gitignore` | Ignores only the new versioned artifact directory. |
| `package.json` | Four versioned Milestone 2D commands. |
| `docs/TESTING.md` | Exact command contract and proof limitations. |
| `docs/MVP_SPEC.md` | Adds the approved successor-experiment boundary without rewriting the original Milestone 2 history. |
| `docs/EXPERIMENTS.md` | Names Milestone 2D as the current transport successor and links its frozen protocol. |
| `AGENTS.md` | Records M2C `REVISE_CARRIER` and M2D as the active research milestone. |

---

### Task 1: Freeze the protocol, fixture, progress ledger, and active milestone boundary

**Files:**

- Create: `research/experiments/docx-zero-width-carrier-bakeoff-v1/protocol.md`
- Create: `research/experiments/docx-zero-width-carrier-bakeoff-v1/fixture.ts`
- Create: `.superpowers/sdd/2026-09-03-milestone-2d-zero-width-carrier-bakeoff/progress.md`
- Modify: `AGENTS.md`
- Modify: `docs/MVP_SPEC.md`
- Modify: `docs/EXPERIMENTS.md`
- Do not modify: any completed experiment directory

**Interfaces:**

- Produces `BAKE_OFF_PROFILE`, `EXPERIMENT_ID`, `EXPERIMENT_SCHEMA_VERSION`, `SYNTHETIC_CORE_AUTHOR`, `ZERO_WIDTH_FIXTURE`, `CANDIDATE_A`, `CANDIDATE_B`, `CANDIDATE_C`, `ZERO_WIDTH_CANDIDATES`, `candidateDefinition`, `CandidateId`, `DocumentProfile`, `ZeroWidthMarkerId`, and `ZeroWidthFixture`.
- Freezes the record vocabulary and workflow consumed by Tasks 4–6.

- [ ] **Step 1: Create the fixture module with explicit definitions**

```typescript
import {
  CARRIER_SPIKE_INPUT,
  FIXED_MARKER_ALPHA,
  FIXED_MARKER_BETA,
  VISIBLE_PARAGRAPHS,
  VISIBLE_FIXTURE_ID,
} from "../docx-hidden-run-v1/fixture.ts";

export const BAKE_OFF_PROFILE = "docx-zero-width-carrier-bakeoff-v1";
export const EXPERIMENT_ID =
  "glyph-exp-docx-zero-width-carrier-bakeoff-v1-001";
export const EXPERIMENT_SCHEMA_VERSION = 1;
export const SYNTHETIC_CORE_AUTHOR = "Glyph synthetic research fixture";

export const CANDIDATE_A = {
  id: "join-control-binary-v1",
  documentProfile: "docx-zero-width-join-control-v1",
  selectable: true,
  priority: 1,
  codePointsPerFrame: 120,
} as const;
export const CANDIDATE_B = {
  id: "invisible-operator-binary-v1",
  documentProfile: "docx-zero-width-invisible-operator-v1",
  selectable: true,
  priority: 2,
  codePointsPerFrame: 120,
} as const;
export const CANDIDATE_C = {
  id: "variation-selector-byte-v1",
  documentProfile: "docx-zero-width-variation-selector-v1",
  selectable: false,
  priority: 3,
  codePointsPerFrame: 15,
} as const;

export const ZERO_WIDTH_CANDIDATES = [
  CANDIDATE_A,
  CANDIDATE_B,
  CANDIDATE_C,
] as const;
export type CandidateDefinition = (typeof ZERO_WIDTH_CANDIDATES)[number];
export type CandidateId = CandidateDefinition["id"];
export type DocumentProfile = CandidateDefinition["documentProfile"];
export type ZeroWidthMarkerId = "alpha" | "beta";

export function candidateDefinition(id: CandidateId): CandidateDefinition {
  switch (id) {
    case "join-control-binary-v1":
      return CANDIDATE_A;
    case "invisible-operator-binary-v1":
      return CANDIDATE_B;
    case "variation-selector-byte-v1":
      return CANDIDATE_C;
  }
}

export type ZeroWidthFixtureRun = Readonly<{
  text: string;
  marker?: ZeroWidthMarkerId;
}>;
export type ZeroWidthFixture = Readonly<{
  bodyParagraphs: readonly (readonly ZeroWidthFixtureRun[])[];
}>;

const markerIdForOldText = (text: string): ZeroWidthMarkerId | undefined =>
  text === FIXED_MARKER_ALPHA
    ? "alpha"
    : text === FIXED_MARKER_BETA
      ? "beta"
      : undefined;

export const ZERO_WIDTH_FIXTURE = {
  bodyParagraphs: CARRIER_SPIKE_INPUT.paragraphs.map(({ runs }) =>
    runs.map(({ text }) => {
      const marker = markerIdForOldText(text);
      return marker === undefined ? { text } : { text: "", marker };
    }),
  ),
} as const satisfies ZeroWidthFixture;

export { VISIBLE_PARAGRAPHS, VISIBLE_FIXTURE_ID };
```

The empty marker-slot text is intentional: generators insert only the encoded
frame and never carry the old readable marker strings into Milestone 2D.

- [ ] **Step 2: Write and freeze `protocol.md`**

Copy every identifier, byte frame, mapping, exclusion, view condition,
filename rule, inspection field, metadata classification, workflow step,
candidate-pass condition, and gate rule from the approved design. Include the
exact record field names and types frozen in Task 5. State that `BLOCKED` is an operational state
outside `run-001.json` and that protocol or candidate edits after canonical
generation require a new versioned experiment.

- [ ] **Step 3: Update authoritative milestone documentation surgically**

In `AGENTS.md`, replace only the active-milestone paragraph with:

```markdown
Milestone 2 ended with the recorded abandonment of `docx-hidden-run-v1`;
Milestone 2B recorded `REVISE_CANDIDATE`; Milestone 2C recorded
`REVISE_CARRIER`; Milestone 2D, the separately versioned zero-width carrier
bake-off, is the current research milestone. Milestone 3 and product workflows
remain later and require a positive Milestone 2D transport selection plus the
separate accessibility and international-text qualification required by that
experiment.
```

Append a short “Approved carrier successors” subsection to the end of
`docs/MVP_SPEC.md` Section 4. Preserve the original Milestone 2 wording and
state that the approved M2D design is the current specification revision, that
M2C ended `REVISE_CARRIER`, and that M3 remains unauthorized.

Append a short “Versioned carrier successors” subsection under Experiment A
in `docs/EXPERIMENTS.md`. Link the M2D protocol, state its transport-only
question, and preserve the interpretation ladder and old records.

- [ ] **Step 4: Initialize the durable progress ledger**

Record:

```markdown
# Milestone 2D progress

- Branch: `codex/milestone-2d-zero-width-carrier-bakeoff`
- Design commit: `f04486e`
- Mutation owner: one serial implementer
- Reviewers: read-only protocol/science, code/safety, and privacy/history lanes
- Canonical artifacts: not generated
- Editor workflows: not started
- Gate: pending; missing evidence is operationally `BLOCKED`
```

Add exact current HEAD, upstream state, `node --version`, `pnpm --version`,
macOS version, `package.json`/`pnpm-lock.yaml` hashes, and tree hashes for all
three immutable experiment directories. Do not place personal system values,
document URLs, or clipboard content in the ledger.

- [ ] **Step 5: Verify and commit Task 1**

Run:

```bash
pnpm test
pnpm lint
pnpm typecheck
git diff --check
git diff --exit-code b7381ab -- \
  research/experiments/docx-hidden-run-v1 \
  research/experiments/docx-alternative-carrier-bakeoff-v1 \
  research/experiments/docx-semantic-white-carrier-qualification-v1
git diff --exit-code b7381ab -- pnpm-lock.yaml
```

Expected: all existing checks pass; immutable experiment and lockfile diffs are
empty.

```bash
git add AGENTS.md docs/MVP_SPEC.md docs/EXPERIMENTS.md \
  research/experiments/docx-zero-width-carrier-bakeoff-v1/protocol.md \
  research/experiments/docx-zero-width-carrier-bakeoff-v1/fixture.ts \
  .superpowers/sdd/2026-09-03-milestone-2d-zero-width-carrier-bakeoff/progress.md
git commit -m "docs: freeze zero-width carrier bake-off"
```

---

### Task 2: Implement exact frame codecs and Unicode text inspection red-first

**Files:**

- Create: `research/experiments/docx-zero-width-carrier-bakeoff-v1/frame.ts`
- Create: `research/experiments/docx-zero-width-carrier-bakeoff-v1/inspect-zero-width-text.ts`
- Create: `tests/research/zero-width-frame.test.ts`
- Modify: `.superpowers/sdd/2026-09-03-milestone-2d-zero-width-carrier-bakeoff/progress.md`

**Interfaces:**

```typescript
export const FRAME_BYTE_LENGTH: 15;
export function crc16CcittFalse(bytes: Uint8Array): number;
export function markerFrame(markerId: ZeroWidthMarkerId): Uint8Array;
export function encodeCarrier(
  candidateId: CandidateId,
  markerId: ZeroWidthMarkerId,
): string;
export function decodeCarrier(
  candidateId: CandidateId,
  carrier: string,
): DecodedFrame;
export function isAnyCandidateCodePoint(codePoint: number): boolean;
export function isCandidateCodePoint(
  candidateId: CandidateId,
  codePoint: number,
): boolean;

export type DecodedFrame = Readonly<{
  markerId: ZeroWidthMarkerId;
  bytes: readonly number[];
  magic: readonly [0x47, 0x5a];
  version: 1;
  payloadLength: 8;
  payloadHex: string;
  checksum: number;
  checksumValid: true;
}>;

export type CodePointOccurrence = Readonly<{
  codePoint: string;
  codePointIndex: number;
}>;
export type CarrierRunInspection = Readonly<{
  startCodePointIndex: number;
  endCodePointIndexExclusive: number;
  codePointCount: number;
  codePoints: readonly string[];
  decodedFrame: DecodedFrame | null;
  error: string | null;
}>;

export type ZeroWidthTextInspection = Readonly<{
  candidateId: CandidateId;
  validUtf8: true;
  byteLength: number;
  codePointLength: number;
  normalization: Readonly<{ nfc: "unchanged" | "changed"; nfkc: "unchanged" | "changed" }>;
  candidateCodePoints: readonly CodePointOccurrence[];
  unexpectedCandidateCodePoints: readonly CodePointOccurrence[];
  carrierRuns: readonly CarrierRunInspection[];
  markerPresence: Readonly<{ alpha: "present" | "absent"; beta: "present" | "absent" }>;
  frameErrors: readonly string[];
  visibleBodyParagraphs: readonly string[];
}>;

export function inspectZeroWidthText(
  bytes: Uint8Array,
  candidateId: CandidateId,
): ZeroWidthTextInspection;
```

- [ ] **Step 1: Write failing exact-vector and mapping tests**

```typescript
test("freezes both checksum-protected frames", () => {
  expect([...markerFrame("alpha")]).toEqual([
    0x47, 0x5a, 0x01, 0xa1, 0x08, 0x47, 0x4c, 0x59,
    0x50, 0x48, 0x41, 0x30, 0x31, 0x7d, 0x62,
  ]);
  expect([...markerFrame("beta")]).toEqual([
    0x47, 0x5a, 0x01, 0xb2, 0x08, 0x47, 0x4c, 0x59,
    0x50, 0x48, 0x42, 0x30, 0x31, 0x01, 0x6b,
  ]);
});

test.each([
  ["join-control-binary-v1", 120],
  ["invisible-operator-binary-v1", 120],
  ["variation-selector-byte-v1", 15],
] as const)("round trips %s", (candidateId, count) => {
  for (const markerId of ["alpha", "beta"] as const) {
    const carrier = encodeCarrier(candidateId, markerId);
    expect([...carrier]).toHaveLength(count);
    expect(decodeCarrier(candidateId, carrier).markerId).toBe(markerId);
  }
});
```

Also assert exact first/last mapping values, MSB-first order for A/B,
supplementary code-point iteration for C, and `crc16CcittFalse` against the
standard ASCII `123456789` vector `0x29B1`.

- [ ] **Step 2: Run the focused test and observe red**

```bash
pnpm test tests/research/zero-width-frame.test.ts
```

Expected: FAIL because `frame.ts` and `inspect-zero-width-text.ts` do not exist.

- [ ] **Step 3: Implement CRC and fixed frame construction**

```typescript
export function crc16CcittFalse(bytes: Uint8Array): number {
  let crc = 0xffff;
  for (const byte of bytes) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc =
        (crc & 0x8000) === 0
          ? (crc << 1) & 0xffff
          : ((crc << 1) ^ 0x1021) & 0xffff;
    }
  }
  return crc;
}

const PAYLOADS = {
  alpha: Uint8Array.from([0x47, 0x4c, 0x59, 0x50, 0x48, 0x41, 0x30, 0x31]),
  beta: Uint8Array.from([0x47, 0x4c, 0x59, 0x50, 0x48, 0x42, 0x30, 0x31]),
} as const;
const MARKER_BYTES = { alpha: 0xa1, beta: 0xb2 } as const;

export function markerFrame(markerId: ZeroWidthMarkerId): Uint8Array {
  const prefix = Uint8Array.from([
    0x47,
    0x5a,
    0x01,
    MARKER_BYTES[markerId],
    0x08,
    ...PAYLOADS[markerId],
  ]);
  const checksum = crc16CcittFalse(prefix);
  return Uint8Array.from([...prefix, checksum >>> 8, checksum & 0xff]);
}
```

- [ ] **Step 4: Implement explicit candidate mapping and strict decoding**

Use one `switch (candidateId)` in encoding and one in decoding. Iterate strings
with `[...value]` and `codePointAt(0)`, never indexes over UTF-16 code units.
For A/B, require exactly 120 in-alphabet code points and rebuild fifteen bytes
eight bits at a time. For C, require exactly fifteen selectors and invert the
two frozen ranges. Pass reconstructed bytes to one exact frame parser that
validates length, magic, version, marker ID, payload length, payload, checksum,
and absence of trailing bytes.

```typescript
const bitAlphabet = (candidateId: CandidateId): readonly [number, number] => {
  switch (candidateId) {
    case "join-control-binary-v1":
      return [0x200c, 0x200d];
    case "invisible-operator-binary-v1":
      return [0x2062, 0x2063];
    case "variation-selector-byte-v1":
      throw new Error("Variation-selector candidate is byte encoded");
  }
};

const variationSelectorForByte = (byte: number): number =>
  byte <= 0x0f ? 0xfe00 + byte : 0xe0100 + (byte - 0x10);
```

Every malformed condition must throw a stable error containing the candidate
ID and failure class; it must not return a partial frame.

- [ ] **Step 5: Implement plain-text inspection and adversarial tests**

Decode bytes with `new TextDecoder("utf-8", { fatal: true })`. Walk Unicode code
points once, recording `U+XXXX` labels and indexes rather than embedding raw
invisible values in logs. Partition contiguous expected-alphabet sequences,
record all code points belonging to another candidate alphabet, decode only
exact runs, and remove only successfully identified expected-alphabet runs when
computing visible paragraphs.

Add independent tests for wrong magic/version/ID/length/payload/checksum;
truncation, insertion, deletion, reorder, duplicate, mixed alphabet, extra
frame, invalid UTF-8, CRLF/LF behavior, and changed visible text. Assert that
NFC/NFKC are recorded but never used to make a damaged frame pass.

```typescript
test("normalization is observational and never repairs acceptance", () => {
  const codePoints = [
    ...encodeCarrier("join-control-binary-v1", "alpha"),
  ];
  codePoints[17] = "\u200b";
  const damaged = codePoints.join("");
  const inspection = inspectZeroWidthText(
    new TextEncoder().encode(damaged),
    "join-control-binary-v1",
  );
  expect(inspection.markerPresence.alpha).toBe("absent");
  expect(inspection.frameErrors.length).toBeGreaterThan(0);
});
```

- [ ] **Step 6: Verify and commit Task 2**

```bash
pnpm test tests/research/zero-width-frame.test.ts
pnpm lint
pnpm typecheck
git diff --check
git diff --exit-code b7381ab -- pnpm-lock.yaml
git add \
  research/experiments/docx-zero-width-carrier-bakeoff-v1/frame.ts \
  research/experiments/docx-zero-width-carrier-bakeoff-v1/inspect-zero-width-text.ts \
  tests/research/zero-width-frame.test.ts \
  .superpowers/sdd/2026-09-03-milestone-2d-zero-width-carrier-bakeoff/progress.md
git commit -m "feat: add zero-width carrier frames"
```

Expected: focused tests, lint, and typecheck pass; lockfile remains unchanged.

---

### Task 3: Build the DOCX generator and candidate-aware inspector red-first

**Files:**

- Create: `src/documents/docx/docx-zero-width-carrier-bakeoff-v1.ts`
- Create: `research/experiments/docx-zero-width-carrier-bakeoff-v1/inspect-zero-width-docx.ts`
- Create: `tests/documents/docx-zero-width-carrier-bakeoff.test.ts`
- Modify: `.superpowers/sdd/2026-09-03-milestone-2d-zero-width-carrier-bakeoff/progress.md`

**Interfaces:**

```typescript
export async function generateZeroWidthCarrierDocx(
  fixture: ZeroWidthFixture,
  candidateId: CandidateId,
): Promise<Uint8Array>;

export type InspectionMode = "source" | "transformed";
export type CoreMetadataClassification =
  | "absent"
  | "empty"
  | "synthetic_expected"
  | "non_synthetic_redacted";
export type OOXMLTextLocation =
  | "body"
  | "header"
  | "footer"
  | "footnote"
  | "endnote"
  | "comments"
  | "other";
export type PackageCodePointOccurrence = Readonly<{
  codePoint: string;
  partName: string;
  location: OOXMLTextLocation;
  paragraphIndex: number;
  runIndex: number;
  codePointIndex: number;
}>;
export type DocxCarrierOccurrence = Readonly<{
  markerId: ZeroWidthMarkerId;
  partName: string;
  location: OOXMLTextLocation;
  paragraphIndex: number;
  runIndices: readonly number[];
  codePointIndexes: readonly number[];
  codePointCount: number;
  codePoints: readonly string[];
  decodedFrame: DecodedFrame;
}>;
export type ForbiddenRunProperty = Readonly<{
  partName: string;
  paragraphIndex: number;
  runIndex: number;
  property: string;
}>;
export type CarrierRunProperty = Readonly<{
  partName: string;
  paragraphIndex: number;
  runIndex: number;
  property: string;
  valueClassification: "absent_value" | "safe_literal" | "redacted_literal";
  safeValue: string | null;
}>;
export type SafetyInspection = Readonly<{
  externalRelationships: readonly string[];
  unresolvedRelationshipTargets: readonly string[];
  activeContentEntries: readonly string[];
  activeRelationshipTypes: readonly string[];
  macroContentTypes: readonly string[];
}>;
export type ZeroWidthDocxInspection = Readonly<{
  candidateId: CandidateId;
  mode: InspectionMode;
  entries: readonly string[];
  carrierOccurrences: readonly DocxCarrierOccurrence[];
  markerPresence: Readonly<{ alpha: "present" | "absent"; beta: "present" | "absent" }>;
  frameErrors: readonly string[];
  unexpectedCandidateCodePoints: readonly PackageCodePointOccurrence[];
  visibleBodyParagraphs: readonly string[];
  normalization: Readonly<{ nfc: "unchanged" | "changed"; nfkc: "unchanged" | "changed" }>;
  carrierRunProperties: readonly CarrierRunProperty[];
  forbiddenRunProperties: readonly ForbiddenRunProperty[];
  coreMetadata: Readonly<{
    creator: CoreMetadataClassification;
    lastModifiedBy: CoreMetadataClassification;
  }>;
  safety: SafetyInspection;
}>;

export function inspectZeroWidthDocx(
  bytes: Uint8Array,
  candidateId: CandidateId,
  mode: InspectionMode,
): ZeroWidthDocxInspection;
```

- [ ] **Step 1: Write failing canonical structure tests**

For each candidate, generate in memory and assert:

```typescript
test.each(ZERO_WIDTH_CANDIDATES)(
  "generates the exact $id source contract",
  async (candidate) => {
    const bytes = await generateZeroWidthCarrierDocx(
      ZERO_WIDTH_FIXTURE,
      candidate.id,
    );
    const inspection = inspectZeroWidthDocx(bytes, candidate.id, "source");

    expect(inspection.markerPresence).toEqual({
      alpha: "present",
      beta: "present",
    });
    expect(inspection.visibleBodyParagraphs).toEqual(VISIBLE_PARAGRAPHS);
    expect(inspection.carrierOccurrences).toEqual([
      expect.objectContaining({
        markerId: "alpha",
        partName: "word/document.xml",
        location: "body",
        paragraphIndex: 0,
        runIndices: [1],
        codePointCount: candidate.codePointsPerFrame,
      }),
      expect.objectContaining({
        markerId: "beta",
        partName: "word/document.xml",
        location: "body",
        paragraphIndex: 2,
        runIndices: [1],
        codePointCount: candidate.codePointsPerFrame,
      }),
    ]);
    expect(inspection.frameErrors).toEqual([]);
    expect(inspection.unexpectedCandidateCodePoints).toEqual([]);
    expect(inspection.carrierRunProperties).toEqual([]);
    expect(inspection.forbiddenRunProperties).toEqual([]);
    expect(inspection.safety).toEqual(SAFETY_CLEAN);
  },
);
```

Unzip each source and assert that the carrier runs contain no `w:rPr`, the old
readable marker strings are absent from every package entry, and removing the
two exact carrier runs yields the imported fixture. Generate the same candidate
twice in memory and assert byte-for-byte equality.

- [ ] **Step 2: Run the focused test and observe red**

```bash
pnpm test tests/documents/docx-zero-width-carrier-bakeoff.test.ts
```

Expected: FAIL because the generator and inspector modules do not exist.

- [ ] **Step 3: Implement the minimal in-memory generator**

```typescript
import { Document, Packer, Paragraph, TextRun } from "docx";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { encodeCarrier } from
  "../../../research/experiments/docx-zero-width-carrier-bakeoff-v1/frame.ts";
import {
  SYNTHETIC_CORE_AUTHOR,
  type CandidateId,
  type ZeroWidthFixture,
} from "../../../research/experiments/docx-zero-width-carrier-bakeoff-v1/fixture.ts";

export async function generateZeroWidthCarrierDocx(
  fixture: ZeroWidthFixture,
  candidateId: CandidateId,
): Promise<Uint8Array> {
  const children = fixture.bodyParagraphs.map(
    (runs) =>
      new Paragraph({
        children: runs.map(
          (run) =>
            new TextRun(
              run.marker
                ? encodeCarrier(candidateId, run.marker)
                : run.text,
            ),
        ),
      }),
  );
  const packed = await Packer.toBuffer(
    new Document({
      creator: SYNTHETIC_CORE_AUTHOR,
      lastModifiedBy: SYNTHETIC_CORE_AUTHOR,
      sections: [{ children }],
    }),
  );
  const entries = unzipSync(packed);
  const core = entries["docProps/core.xml"];
  if (!core) throw new Error("Missing generated core properties");
  const fixedCore = strFromU8(core)
    .replace(
      /<dcterms:created[^>]*>[^<]*<\/dcterms:created>/,
      '<dcterms:created xsi:type="dcterms:W3CDTF">2026-09-03T00:00:00Z</dcterms:created>',
    )
    .replace(
      /<dcterms:modified[^>]*>[^<]*<\/dcterms:modified>/,
      '<dcterms:modified xsi:type="dcterms:W3CDTF">2026-09-03T00:00:00Z</dcterms:modified>',
    );
  entries["docProps/core.xml"] = strToU8(fixedCore);
  const sortedEntries = Object.fromEntries(
    Object.entries(entries).sort(([left], [right]) => left.localeCompare(right)),
  );
  return zipSync(sortedEntries, {
    level: 6,
    mtime: new Date("1980-01-01T00:00:00Z"),
  });
}
```

Do not pass formatting options for carrier or visible runs. The fixed core
timestamps and ZIP modification time are synthetic reproducibility controls,
not observations of experiment execution time.

- [ ] **Step 4: Implement the standalone zero-width DOCX inspector**

Read the ZIP and XML in memory. Do not modify the immutable transformed
inspector to share code. Reproduce only its proven package-entry,
relationship-target, active-content, macro, paragraph, run, and OOXML-location
logic inside the new versioned inspector.

Walk all textual OOXML parts and all text nodes by Unicode code point. Group
expected-alphabet code points across adjacent or editor-split runs only when
they remain contiguous in paragraph text; retain all contributing run indexes.
Record raw sequences as `U+XXXX` labels. Source mode requires exactly one frame
in paragraph 0/run 1 and one in paragraph 2/run 1, with no alphabet occurrence
elsewhere. Transformed mode may accept benign split/merged runs but not moved,
duplicated, damaged, mixed-alphabet, non-body, or unexpected frames.

Source carrier runs must have no `w:rPr`. For transformed carrier runs record
every direct property by qualified name and a privacy-safe value classification.
Only enabled hidden-text properties are forbidden because they would change the
carrier mechanism into a previously rejected hidden-run mechanism:

```typescript
const FORBIDDEN_CARRIER_PROPERTIES = [
  "vanish",
  "webHidden",
  "specVanish",
] as const;
```

An explicitly disabled hidden property is recorded but not forbidden. Preserve
editor-added color, size, language, style, spacing, highlighting, and other run
properties as inspectable evidence without treating them as source conformance
or automatic transformed failure. Their observable effect is governed by the
frozen visibility and layout observations. Populate `safeValue` only for
validated booleans, numeric values, six-digit colors, and fixed OOXML enum
tokens; otherwise use `redacted_literal` with `safeValue: null`.

- [ ] **Step 5: Implement privacy-preserving core metadata classification**

Parse `docProps/core.xml` when present, but return only the enum. Compare values
in memory to one fixed synthetic generator value such as `Glyph synthetic
research fixture`; never include any other value in a thrown error, stdout,
snapshot, or returned object.

```typescript
const classifyCoreValue = (
  value: string | null,
): CoreMetadataClassification => {
  if (value === null) return "absent";
  if (value.trim() === "") return "empty";
  if (value === SYNTHETIC_CORE_AUTHOR) return "synthetic_expected";
  return "non_synthetic_redacted";
};
```

- [ ] **Step 6: Add source/transformed adversarial tests**

Mutate only in-memory ZIP entries. Cover split and merged carrier runs, a moved
frame, non-body frames, duplicate frames, mixed alphabets, one deleted or
replaced code point, a supplementary selector split error, unexpected visible
characters within a carrier, enabled and explicitly disabled hidden
properties, benign transformed color/size/language/highlight properties,
malformed XML/ZIP, external relationships, unresolved targets,
active content, macro content types, and all four metadata classifications.

Assert that a sentinel personal metadata string never appears in
`JSON.stringify(inspection)` or any error message.

- [ ] **Step 7: Verify and commit Task 3**

```bash
pnpm test \
  tests/documents/docx-zero-width-carrier-bakeoff.test.ts \
  tests/research/zero-width-frame.test.ts \
  tests/research/transformed-docx-inspector.test.ts \
  tests/documents/docx-alternative-carrier-bakeoff.test.ts \
  tests/documents/docx-semantic-white-carrier-qualification.test.ts \
  tests/documents/docx-hidden-run-v1.test.ts
pnpm lint
pnpm typecheck
git diff --check
git diff --exit-code b7381ab -- pnpm-lock.yaml
git add \
  src/documents/docx/docx-zero-width-carrier-bakeoff-v1.ts \
  research/experiments/docx-zero-width-carrier-bakeoff-v1/inspect-zero-width-docx.ts \
  tests/documents/docx-zero-width-carrier-bakeoff.test.ts \
  .superpowers/sdd/2026-09-03-milestone-2d-zero-width-carrier-bakeoff/progress.md
git commit -m "feat: add zero-width DOCX carriers"
```

Expected: all focused and old-carrier regression tests pass; old experiment
files and lockfile remain unchanged.

---

### Task 4: Add repository-bounded generation and inspection commands red-first

**Files:**

- Create: `scripts/generate-docx-zero-width-carrier.ts`
- Create: `scripts/inspect-docx-zero-width-carrier.ts`
- Create: `scripts/inspect-zero-width-plain-text.ts`
- Create: `tests/research/zero-width-carrier-command-safety.test.ts`
- Modify: `package.json`
- Modify: `.gitignore`
- Modify: `docs/TESTING.md`
- Modify: `.superpowers/sdd/2026-09-03-milestone-2d-zero-width-carrier-bakeoff/progress.md`

**Interfaces:**

- `pnpm research:carrier:zero-width:generate -- <candidate-id>`
- `pnpm research:carrier:zero-width:inspect-docx -- <candidate-id> <source|transformed> <repository-relative-docx-path>`
- `pnpm research:carrier:zero-width:inspect-text -- <candidate-id> <repository-relative-text-path>`
- The generator accepts exactly one frozen ID and derives its one canonical path; no output path is accepted.

- [ ] **Step 1: Write failing command-safety tests**

Use disposable copied repositories linked to the existing `node_modules`.
Test exact usage errors, unknown candidate IDs, unknown inspection modes,
absolute paths, traversal, escaping symlinks, directories, devices/non-regular
files, malformed DOCX and UTF-8, unsafe packages, exact safe JSON stdout, and
nonzero exits.

For each candidate, assert first generation succeeds, prints only
`candidateId`, `documentProfile`, `artifactPath`, and lowercase `sha256`, and a
second invocation refuses replacement without changing bytes. Separately test
an existing file, an existing symlink, and an artifact-directory symlink.

```typescript
test.each(ZERO_WIDTH_CANDIDATES)(
  "generates $id once without accepting an output path",
  async ({ id, documentProfile }) => {
    const repository = await makeDisposableRepository();
    try {
      const first = runGenerator(repository, [id]);
      expect(first.status).toBe(0);
      expect(parseJsonObject(first.stdout)).toMatchObject({
        candidateId: id,
        documentProfile,
      });
      const second = runGenerator(repository, [id]);
      expect(second.status).not.toBe(0);
      expect(second.stderr).toContain("Refusing to replace existing artifact");
    } finally {
      await rm(repository, { recursive: true, force: true });
    }
  },
);
```

- [ ] **Step 2: Run the command test and observe red**

```bash
pnpm test tests/research/zero-width-carrier-command-safety.test.ts
```

Expected: FAIL because all three scripts and package commands are absent.

- [ ] **Step 3: Implement the one-candidate generator command**

Validate the exact ID before dynamically importing generator code. Derive:

```typescript
const artifactPath =
  `research/artifacts/docx-zero-width-carrier-bakeoff-v1/${candidateId}.docx`;
```

Use the existing nearest-existing-ancestor containment pattern. After safe
directory creation, reject any successful `lstat` of the target and write with
`{ flag: "wx" }`. Never unlink on error. Hash the bytes written in memory and
print one JSON line containing only the four contract fields.

- [ ] **Step 4: Implement both read-only inspection commands**

Both commands must require repository-relative paths, resolve the repository
and target canonically, reject escapes and non-regular files, read only once,
and print only JSON-safe code-point labels and metadata classifications.

The DOCX command calls `inspectZeroWidthDocx(bytes, candidateId, mode)` and
adds lowercase SHA-256. It exits nonzero for safety findings or any source/
transformed structural failure.

The text command calls `inspectZeroWidthText(bytes, candidateId)` and adds
lowercase SHA-256. It exits nonzero for invalid UTF-8, frame errors,
unexpected-candidate code points, missing/duplicate frames, or visible-body
mismatch.

- [ ] **Step 5: Add scripts, ignore rule, and command documentation**

Add exactly:

```json
"research:carrier:zero-width:generate": "node scripts/generate-docx-zero-width-carrier.ts",
"research:carrier:zero-width:inspect-docx": "node scripts/inspect-docx-zero-width-carrier.ts",
"research:carrier:zero-width:inspect-text": "node scripts/inspect-zero-width-plain-text.ts"
```

Append only this directory-specific ignore rule:

```gitignore
research/artifacts/docx-zero-width-carrier-bakeoff-v1/*
```

Document exact examples for all three candidate IDs and both inspection modes.
State that command success proves local structural evidence only, not editor
behavior, accessibility, production readiness, or AI behavior.

- [ ] **Step 6: Verify and commit Task 4**

```bash
pnpm test \
  tests/research/zero-width-carrier-command-safety.test.ts \
  tests/documents/docx-zero-width-carrier-bakeoff.test.ts \
  tests/research/zero-width-frame.test.ts
pnpm lint
pnpm typecheck
pnpm build
git diff --check
git diff --exit-code b7381ab -- pnpm-lock.yaml
git add package.json .gitignore docs/TESTING.md \
  scripts/generate-docx-zero-width-carrier.ts \
  scripts/inspect-docx-zero-width-carrier.ts \
  scripts/inspect-zero-width-plain-text.ts \
  tests/research/zero-width-carrier-command-safety.test.ts \
  .superpowers/sdd/2026-09-03-milestone-2d-zero-width-carrier-bakeoff/progress.md
git commit -m "chore: add zero-width carrier commands"
```

---

### Task 5: Add the exact run record and mechanical gate validator red-first

**Files:**

- Create: `scripts/validate-docx-zero-width-carrier-run.ts`
- Create: `tests/research/zero-width-carrier-record.test.ts`
- Modify: `package.json`
- Modify: `docs/TESTING.md`
- Modify: `.superpowers/sdd/2026-09-03-milestone-2d-zero-width-carrier-bakeoff/progress.md`

**Interfaces:**

- `validateZeroWidthCarrierRun(value: unknown, root?: string): Promise<ZeroWidthBakeOffRunRecord>`
- `deriveZeroWidthGate(candidates: readonly CandidateRunEvidence[]): GateDecision`
- `pnpm research:carrier:zero-width:validate`

The exact-shape record is:

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
type GateDecision =
  | "SELECT_A"
  | "SELECT_B"
  | "REVISE_ZERO_WIDTH_CARRIER"
  | "ABANDON_ZERO_WIDTH_CARRIER";

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
  notes: readonly string[];
}>;
type InspectionEvidence = Readonly<{
  candidateId: CandidateId;
  mode: InspectionMode;
  entries: readonly string[];
  markerPresence: Readonly<{ alpha: MarkerPresence; beta: MarkerPresence }>;
  visibleBodyParagraphs: readonly string[];
  frameErrors: readonly string[];
  unexpectedCandidateCodePoints: readonly PackageCodePointOccurrence[];
  carrierOccurrences: readonly DocxCarrierOccurrence[];
  normalization: Readonly<{ nfc: "unchanged" | "changed"; nfkc: "unchanged" | "changed" }>;
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
  protocolDeviation: string | null;
  notes: readonly string[];
}>;
type DocxRoundtripEvidence = Readonly<{
  status: "completed";
  sourceArtifactSha256: SHA256;
  resultArtifact: ArtifactEvidence;
  inspection: InspectionEvidence;
  protocolDeviation: string | null;
  distributionLimitations: readonly string[];
  notes: readonly string[];
}>;
type GoogleDocsCandidateEvidence = Readonly<{
  application: ApplicationEvidence & Readonly<{ name: "Google Docs" }>;
  browser: ApplicationEvidence & Readonly<{ name: "Google Chrome" }>;
  platform: PlatformEvidence;
  documentRule: "one new unshared document";
  sourceArtifactSha256: SHA256;
  paginatedWhiteView: ViewEvidence;
  darkView: "not_assessable";
  docxRoundtrip: DocxRoundtripEvidence;
  plainTextCopy: PlainTextEvidence;
  selectionObservation: SelectionObservation;
  screenReader: "not_assessable";
  limitations: readonly string[];
}>;
type MicrosoftWordCandidateEvidence = Readonly<{
  application: ApplicationEvidence & Readonly<{ name: "Microsoft Word" }>;
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
    findings: readonly string[];
    limitations: readonly string[];
  }>;
  screenReader: "not_assessable";
  limitations: readonly string[];
}>;
type CandidateRunEvidence = Readonly<{
  candidateId: CandidateId;
  documentProfile: DocumentProfile;
  selectable: boolean;
  priority: 1 | 2 | 3;
  canonicalArtifact: ArtifactEvidence & Readonly<{ inspection: InspectionEvidence }>;
  googleDocs: GoogleDocsCandidateEvidence;
  microsoftWord: MicrosoftWordCandidateEvidence;
  transportCriteriaSatisfied: boolean;
  selectableCandidatePasses: boolean;
  limitations: readonly string[];
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
    gitCommit: string;
    nodeVersion: string;
    pnpmVersion: string;
    docxVersion: "9.7.1";
  }>;
  candidates: readonly [CandidateRunEvidence, CandidateRunEvidence, CandidateRunEvidence];
  gateDecision: GateDecision;
  gateRationale: readonly string[];
  limitations: readonly string[];
}>;
```

- [ ] **Step 1: Write failing exact-shape and linkage tests**

Build three generated canonical DOCX files, six transformed DOCX copies, and
six UTF-8 clipboard files under a temporary repository. Construct one valid
record from actual inspector results. Recursively delete, add, or change every
field group to assert missing/extra keys, wrong enum, wrong candidate order,
wrong profile pairing, malformed hashes, byte/hash mismatch, path escape,
symlink, non-regular artifact, source-hash mismatch, inspector-evidence
mismatch, visible-body mismatch, unsafe package, and leaked metadata rejection.

Require exact artifact suffixes derived from each candidate ID and reject
aliases. Require Candidate C `selectable: false`, `priority: 3`, and
`selectableCandidatePasses: false` even if all transport criteria are true.

- [ ] **Step 2: Write failing mechanical gate tests**

```typescript
test.each([
  ["SELECT_A", recordWithPassingAAndB()],
  ["SELECT_B", recordWithFailingAAndPassingB()],
  ["REVISE_ZERO_WIDTH_CARRIER", recordWithOnlyPassingDiagnosticC()],
  ["REVISE_ZERO_WIDTH_CARRIER", recordWithPartialBoundedSurvival()],
  ["ABANDON_ZERO_WIDTH_CARRIER", recordWithNoBoundedSurvival()],
] as const)("derives %s", async (expected, record) => {
  const declared = { ...record, gateDecision: expected };
  await expect(validateZeroWidthCarrierRun(declared, root)).resolves.toMatchObject({
    gateDecision: expected,
  });
});
```

For each case, set every wrong declared decision and assert rejection. Assert
selection observation and Accessibility Assistant findings are non-gating.
Assert visibility or any `minor`/`material` disturbance fails a candidate.
Assert missing Word dark-view evidence, a missing clipboard, or an unreadable
artifact rejects validation rather than producing `ABANDON_ZERO_WIDTH_CARRIER`.

- [ ] **Step 3: Run the validator test and observe red**

```bash
pnpm test tests/research/zero-width-carrier-record.test.ts
```

Expected: FAIL because the validator module does not exist.

- [ ] **Step 4: Implement strict parsing and artifact equality**

Follow the established M2C validator patterns for `exactObject`, safe strings,
enums, arrays, repository containment, canonical real paths, regular files,
SHA-256, and stable safe errors. Do not import from or alter an old validator.

Re-read every DOCX and TXT artifact locally, recompute its hash, run the new
candidate-aware inspector, and require deep equality with the record after
parsing. Validate each editor source hash against that candidate's canonical
hash. Reject raw invisible carrier sequences, raw core metadata, document URLs,
credentials, assignment prompts, student work, or model output in free-text
fields.

If either transformed core field is `non_synthetic_redacted`, require a
non-null protocol deviation and at least one distribution limitation. Do not
allow the redacted classification to change transport pass status.

- [ ] **Step 5: Implement candidate pass and gate derivation exactly**

```typescript
type FrameAndBodyEvidence = Readonly<{
  markerPresence: Readonly<{ alpha: MarkerPresence; beta: MarkerPresence }>;
  frameErrors: readonly string[];
  unexpectedCandidateCodePoints: readonly unknown[];
  visibleBodyParagraphs: readonly string[];
}>;

const arraysEqual = (
  left: readonly string[],
  right: readonly string[],
): boolean =>
  left.length === right.length &&
  left.every((value, index) => value === right[index]);

const exactFramesAndBody = (value: FrameAndBodyEvidence): boolean =>
  value.markerPresence.alpha === "present" &&
  value.markerPresence.beta === "present" &&
  value.frameErrors.length === 0 &&
  value.unexpectedCandidateCodePoints.length === 0 &&
  arraysEqual(value.visibleBodyParagraphs, VISIBLE_PARAGRAPHS);

const safetyPasses = (value: SafetyInspection): boolean =>
  Object.values(value).every((findings) => findings.length === 0);

const expectedBodyPositionsPass = (
  occurrences: readonly DocxCarrierOccurrence[],
): boolean =>
  occurrences.length === 2 &&
  occurrences[0].markerId === "alpha" &&
  occurrences[0].partName === "word/document.xml" &&
  occurrences[0].location === "body" &&
  occurrences[0].paragraphIndex === 0 &&
  occurrences[1].markerId === "beta" &&
  occurrences[1].partName === "word/document.xml" &&
  occurrences[1].location === "body" &&
  occurrences[1].paragraphIndex === 2;

const sourcePasses = (
  artifact: CandidateRunEvidence["canonicalArtifact"],
): boolean =>
  artifact.inspection.mode === "source" &&
  exactFramesAndBody(artifact.inspection) &&
  expectedBodyPositionsPass(artifact.inspection.carrierOccurrences) &&
  artifact.inspection.carrierOccurrences.every(
    (occurrence) =>
      occurrence.runIndices.length === 1 && occurrence.runIndices[0] === 1,
  ) &&
  artifact.inspection.carrierRunProperties.length === 0 &&
  artifact.inspection.forbiddenRunProperties.length === 0 &&
  safetyPasses(artifact.inspection.safety);

const docxPasses = (value: DocxRoundtripEvidence): boolean =>
  value.status === "completed" &&
  value.inspection.mode === "transformed" &&
  exactFramesAndBody(value.inspection) &&
  expectedBodyPositionsPass(value.inspection.carrierOccurrences) &&
  value.inspection.forbiddenRunProperties.length === 0 &&
  safetyPasses(value.inspection.safety);

const copyPasses = (value: PlainTextEvidence): boolean =>
  value.status === "completed" &&
  value.inspection.validUtf8 &&
  exactFramesAndBody(value.inspection);

const hasBoundedTransportEvidence = (
  candidate: CandidateRunEvidence,
): boolean =>
  exactFramesAndBody(candidate.googleDocs.docxRoundtrip.inspection) ||
  exactFramesAndBody(candidate.microsoftWord.docxRoundtrip.inspection) ||
  exactFramesAndBody(candidate.googleDocs.plainTextCopy.inspection) ||
  exactFramesAndBody(candidate.microsoftWord.plainTextCopy.inspection);

const criteriaSatisfied = (candidate: CandidateRunEvidence): boolean =>
  sourcePasses(candidate.canonicalArtifact) &&
  docxPasses(candidate.googleDocs.docxRoundtrip) &&
  docxPasses(candidate.microsoftWord.docxRoundtrip) &&
  copyPasses(candidate.googleDocs.plainTextCopy) &&
  copyPasses(candidate.microsoftWord.plainTextCopy) &&
  candidate.googleDocs.paginatedWhiteView.visibleBody === "preserved" &&
  candidate.googleDocs.paginatedWhiteView.carrierPresentation === "not_visible" &&
  candidate.googleDocs.paginatedWhiteView.layoutDisturbance === "none_observed" &&
  candidate.microsoftWord.lightPrintLayout.visibleBody === "preserved" &&
  candidate.microsoftWord.lightPrintLayout.carrierPresentation === "not_visible" &&
  candidate.microsoftWord.lightPrintLayout.layoutDisturbance === "none_observed" &&
  candidate.microsoftWord.darkPageCanvas.visibleBody === "preserved" &&
  candidate.microsoftWord.darkPageCanvas.carrierPresentation === "not_visible" &&
  candidate.microsoftWord.darkPageCanvas.layoutDisturbance === "none_observed";

export function deriveZeroWidthGate(
  candidates: readonly CandidateRunEvidence[],
): GateDecision {
  const [candidateA, candidateB] = candidates;
  if (candidateA.candidateId !== "join-control-binary-v1" ||
      candidateB.candidateId !== "invisible-operator-binary-v1") {
    throw new Error("Candidates are not in frozen order");
  }
  if (criteriaSatisfied(candidateA)) return "SELECT_A";
  if (criteriaSatisfied(candidateB)) return "SELECT_B";
  return candidates.some(hasBoundedTransportEvidence)
    ? "REVISE_ZERO_WIDTH_CARRIER"
    : "ABANDON_ZERO_WIDTH_CARRIER";
}
```

`hasBoundedTransportEvidence` is true only when an exact Alpha and Beta pair
plus the frozen visible body survives in at least one Google Docs or Word DOCX
round trip or clipboard artifact. Candidate C may make this true but is never
examined by either selection branch.

For every candidate, require the recorded `transportCriteriaSatisfied` to
equal `criteriaSatisfied(candidate)` and require
`selectableCandidatePasses` to equal
`candidate.selectable && candidate.transportCriteriaSatisfied`. Reject any
record that declares Candidate C selectable or passing the selectable gate.

- [ ] **Step 6: Add the fixed validation command and docs**

Add:

```json
"research:carrier:zero-width:validate": "node scripts/validate-docx-zero-width-carrier-run.ts"
```

The command accepts no arguments, reads only
`research/experiments/docx-zero-width-carrier-bakeoff-v1/run-001.json`, and
prints one safe JSON object containing only `status`, `gateDecision`, and
`selectedDocumentProfile` (`null` for revision/abandonment). It exits nonzero
for missing or invalid records.

- [ ] **Step 7: Verify and commit Task 5**

```bash
pnpm test \
  tests/research/zero-width-carrier-record.test.ts \
  tests/research/zero-width-carrier-command-safety.test.ts \
  tests/documents/docx-zero-width-carrier-bakeoff.test.ts \
  tests/research/zero-width-frame.test.ts
pnpm lint
pnpm typecheck
pnpm build
git diff --check
git diff --exit-code b7381ab -- pnpm-lock.yaml
git add package.json docs/TESTING.md \
  scripts/validate-docx-zero-width-carrier-run.ts \
  tests/research/zero-width-carrier-record.test.ts \
  .superpowers/sdd/2026-09-03-milestone-2d-zero-width-carrier-bakeoff/progress.md
git commit -m "chore: validate zero-width carrier records"
```

Do not generate a canonical artifact before this commit and its tests pass.

---

### Task 6: Freeze all canonical sources and execute six independent editor workflows

**Files:**

- Generate ignored: `research/artifacts/docx-zero-width-carrier-bakeoff-v1/join-control-binary-v1.docx`
- Generate ignored: `research/artifacts/docx-zero-width-carrier-bakeoff-v1/invisible-operator-binary-v1.docx`
- Generate ignored: `research/artifacts/docx-zero-width-carrier-bakeoff-v1/variation-selector-byte-v1.docx`
- Produce ignored for each candidate: `<candidate>-google-docs-roundtrip.docx`
- Produce ignored for each candidate: `<candidate>-google-docs-copy-plain-text.txt`
- Produce ignored for each candidate: `<candidate>-microsoft-word-roundtrip.docx`
- Produce ignored for each candidate: `<candidate>-microsoft-word-copy-plain-text.txt`
- Create only after a non-blocked run: `research/experiments/docx-zero-width-carrier-bakeoff-v1/run-001.json`
- Modify: `.superpowers/sdd/2026-09-03-milestone-2d-zero-width-carrier-bakeoff/progress.md`
- Do not modify: protocol, fixture, codecs, generator, inspectors, validator, candidate definitions, or completed experiments after generation starts

**Interfaces:**

- Consumes the four verified commands and frozen artifact names.
- Produces fifteen ignored artifacts, one committed non-blocked record, and a durable observation ledger.

- [ ] **Step 1: Run the pre-generation freeze checks**

```bash
pwd
git branch --show-current
git status --short --branch
git log -5 --oneline --decorate
git remote -v
git branch -vv
node --version
pnpm --version
shasum -a 256 package.json pnpm-lock.yaml
find research/artifacts/docx-zero-width-carrier-bakeoff-v1 -maxdepth 1 -type f -print 2>/dev/null
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Expected: tracked tree is clean, all checks pass, lockfile is unchanged, and no
canonical path exists. If any canonical path exists unexpectedly, stop and
inspect it; never replace it.

- [ ] **Step 2: Generate, hash, inspect, and freeze Candidate A**

```bash
pnpm research:carrier:zero-width:generate -- join-control-binary-v1
shasum -a 256 research/artifacts/docx-zero-width-carrier-bakeoff-v1/join-control-binary-v1.docx
pnpm research:carrier:zero-width:inspect-docx -- \
  join-control-binary-v1 source \
  research/artifacts/docx-zero-width-carrier-bakeoff-v1/join-control-binary-v1.docx
pnpm research:carrier:zero-width:generate -- join-control-binary-v1
```

Expected: generation and inspection succeed, the second generation refuses to
replace the artifact, and a repeated hash is identical. Record the exact hash
and inspection in the ledger before continuing.

- [ ] **Step 3: Generate, hash, inspect, and freeze Candidates B and C**

Repeat Step 2 exactly for `invisible-operator-binary-v1` and
`variation-selector-byte-v1`. Stop on any structural failure or hash change.
After all three are frozen, record one SHA-256 inventory of the artifact
directory and never regenerate any source.

- [ ] **Step 4: Execute Google Docs for Candidate A, then B, then C**

For each candidate, create a new unshared document and import only that
candidate's canonical source. At 100% paginated white-page view, before
selection, record visible-body integrity, carrier presentation, layout
disturbance, and concise factual notes. Export the exact Google Docs DOCX path.
Then click ordinary body content, select the body exactly once, record the
selection observation, copy exactly once, paste as UTF-8 plain text, and save
the exact TXT path.

Use reliable browser/computer control only. If any visual, upload, export,
clipboard, or save observation is unreliable, record operational `BLOCKED` and
stop without creating `run-001.json`. Do not infer evidence from filenames.

- [ ] **Step 5: Execute Microsoft Word independently for Candidate A, then B, then C**

For each candidate, open the unchanged canonical source directly. At 100%
Print Layout, record light-page evidence before selection, switch to Word's
built-in dark page/canvas and record the same fields, then save the exact Word
round-trip path. Return to ordinary body content, select the body once, record
the observation, copy once to UTF-8 plain text, and save the exact TXT path.
Run Accessibility Assistant only after all primary observations for that
candidate and record factual findings without applying fixes.

Never use a Google Docs export as Word input. Stop as `BLOCKED` if any required
observation or operation is unreliable.

- [ ] **Step 6: Hash and inspect all fifteen artifacts**

```bash
shasum -a 256 research/artifacts/docx-zero-width-carrier-bakeoff-v1/*
```

Run `research:carrier:zero-width:inspect-docx` in `source` mode for the three
canonical files and `transformed` mode for all six editor DOCX files. Run
`research:carrier:zero-width:inspect-text` for all six clipboard TXT files,
always passing the matching frozen candidate ID. Record exact safe JSON and
hashes in the ledger. Stop on any canonical hash difference.

- [ ] **Step 7: Create and mechanically validate the record**

Populate `run-001.json` only from durable recorded observations and inspector
output. Include all three candidates in A/B/C order. Compute
`transportCriteriaSatisfied`, `selectableCandidatePasses`, and the gate with
the validator; never choose the desired result manually.

```bash
pnpm research:carrier:zero-width:validate
pnpm test tests/research/zero-width-carrier-record.test.ts
```

Expected: validator output matches the mechanically derived decision. Never
edit an artifact, candidate, protocol, observation, gate, or validator to
obtain a preferred result.

- [ ] **Step 8: Commit the non-blocked record**

```bash
git add \
  research/experiments/docx-zero-width-carrier-bakeoff-v1/run-001.json \
  .superpowers/sdd/2026-09-03-milestone-2d-zero-width-carrier-bakeoff/progress.md
git diff --cached --check
git diff --cached --name-status
git commit -m "research: record zero-width carrier bake-off run 001"
```

Expected: no file under `research/artifacts/` is staged or committed.

---

### Task 7: Complete independent review, full verification, and branch synchronization

**Files:**

- Modify only if evidence or review requires an in-scope correction: files introduced or explicitly modified by Tasks 1–6
- Do not modify: canonical/transformed artifacts, completed experiment trees, or `pnpm-lock.yaml`
- Do not create a pull request or merge

**Interfaces:**

- Consumes one non-blocked, validated run and all committed implementation.
- Produces a verified branch synchronized to the canonical origin and a complete Milestone 2D report.

- [ ] **Step 1: Run the complete verification suite**

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm research:carrier:zero-width:validate
```

Expected: every command exits zero with the completed record present.

- [ ] **Step 2: Run focused new and old-carrier suites**

```bash
pnpm test tests/research/zero-width-frame.test.ts
pnpm test tests/documents/docx-zero-width-carrier-bakeoff.test.ts
pnpm test tests/research/zero-width-carrier-command-safety.test.ts
pnpm test tests/research/zero-width-carrier-record.test.ts
pnpm test tests/documents/docx-hidden-run-v1.test.ts
pnpm test tests/documents/docx-alternative-carrier-bakeoff.test.ts
pnpm test tests/research/transformed-docx-inspector.test.ts
pnpm test tests/research/carrier-command-safety.test.ts
pnpm test tests/research/carrier-bakeoff-command-safety.test.ts
pnpm test tests/research/carrier-bakeoff-record.test.ts
pnpm test tests/documents/docx-semantic-white-carrier-qualification.test.ts
pnpm test tests/research/semantic-white-carrier-command-safety.test.ts
pnpm test tests/research/semantic-white-carrier-record.test.ts
```

Expected: every named file runs at least one test and passes; no no-match filter
is counted as evidence.

- [ ] **Step 3: Run artifact, privacy, immutability, and leakage audits**

```bash
git diff --exit-code b7381ab -- \
  research/experiments/docx-hidden-run-v1 \
  research/experiments/docx-alternative-carrier-bakeoff-v1 \
  research/experiments/docx-semantic-white-carrier-qualification-v1
git diff --exit-code b7381ab -- pnpm-lock.yaml
git check-ignore -v research/artifacts/docx-zero-width-carrier-bakeoff-v1/*
git ls-files research/artifacts
git diff --check b7381ab..HEAD
git diff --name-status b7381ab..HEAD
git status --short --branch
```

Run scoped searches for credentials, personal metadata values, student work,
raw assignment prompts/responses, document URLs, and milestone leakage across
the new experiment, scripts, tests, and modified docs. Review every match in
context; generic words in claim-limitations are not findings. Confirm no
`FingerprintEngine`, ExactCanary, semantic-canary, Supabase, Protect, Analyze,
authentication, UI, or deployment implementation was introduced.

- [ ] **Step 4: Obtain parallel independent read-only reviews**

Dispatch three reviewers against the same stable commit:

1. protocol/spec/gate compliance, Unicode assumptions, and scientific claim boundaries;
2. frame/DOCX code, adversarial tests, command safety, and validator correctness;
3. full diff, privacy redaction, generated-artifact handling, dependency/history immutability, and milestone leakage.

Reviewers may inspect and run commands but must not edit. The one serial
mutating implementer resolves all critical and important findings, runs the
affected focused tests plus full verification, commits coherent fixes, and
requests read-only rereview of those fixes.

- [ ] **Step 5: Make the final verification checkpoint if needed**

```bash
git add .superpowers/sdd/2026-09-03-milestone-2d-zero-width-carrier-bakeoff/progress.md
git diff --cached --check
git commit -m "chore: complete zero-width bake-off verification"
```

Skip this commit if verification and review produce no tracked progress-ledger
change.

- [ ] **Step 6: Push without merging or opening a pull request**

```bash
git push -u origin codex/milestone-2d-zero-width-carrier-bakeoff
git rev-list --left-right --count \
  origin/codex/milestone-2d-zero-width-carrier-bakeoff...HEAD
git status --short --branch
```

Expected: push succeeds, divergence is `0 0`, and tracked status is clean.

- [ ] **Step 7: Return the complete Milestone 2D report**

Report branch and commits; all fifteen artifact hashes; environment and editor
versions; per-candidate canonical, Google Docs DOCX, Google clipboard, Word
DOCX, and Word clipboard frame/visible-body results; OOXML locations and
carrier-property state; light/dark/selection presentation; Accessibility
Assistant findings; redacted metadata classifications; safety results;
deviations and distribution limitations; unassessed accessibility items;
mechanical gate and rationale; every verification/audit outcome; origin
tracking state; and exact claim limitations.

If the decision is `SELECT_A` or `SELECT_B`, describe it only as a transport
selection that advances the named document profile to a separate accessibility
and international-text qualification. It is not the first production-ready
hiding method.

## Execution Handoff

The user has already selected continuous execution, the strongest recommended
variants, one serial mutating implementer, and parallel read-only reviewers.
Use `superpowers:executing-plans` with that single mutation owner; do not ask
which execution mode to use again. Continue task-by-task without manual approval
prompts. Stop only for a canonical artifact hash discrepancy, unreliable
required editor evidence, an unresolvable operational block, or a new scope
decision not settled by the approved design and this plan.
