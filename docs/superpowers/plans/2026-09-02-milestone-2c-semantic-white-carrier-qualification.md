# Glyph Milestone 2C Semantic-White Carrier Qualification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Qualify one separately versioned semantic-white DOCX carrier through independent Google Docs and Microsoft Word workflows and record one mechanically validated transport-only decision.

**Architecture:** A new research experiment reuses the frozen synthetic fixture and the existing package-tolerant transformed-DOCX inspector. One small generator creates `matching-color-body-v2`; a qualification inspector layers exact semantic direct-white checks over the existing structural and safety inspection; safe commands and a strict record validator make the ignored artifacts and committed result reproducible without changing either completed experiment.

**Tech Stack:** Existing Node.js 26, TypeScript, pnpm 11.19.0, Vitest, `docx@9.7.1`, `fflate`, and `@xmldom/xmldom`; Microsoft Word for Mac and Google Docs in desktop Chrome for the two material workflows. No dependency, UI, model API, persistence system, converter, or browser extension is added.

**Spec:** [`docs/superpowers/specs/2026-09-02-milestone-2c-semantic-white-carrier-qualification-design.md`](../specs/2026-09-02-milestone-2c-semantic-white-carrier-qualification-design.md)

## Global Constraints

- Work only on `codex/milestone-2c-semantic-white-carrier-qualification`, beginning from design commit `d7c42ee`.
- Preserve Milestone 2 and Milestone 2B protocols, fixtures, generators, inspectors, records, and artifacts exactly. Do not amend or rewrite their published commits.
- Candidate ID is exactly `matching-color-body-v2`; document profile is exactly `docx-matching-color-body-v2`; qualification profile is exactly `docx-semantic-white-carrier-qualification-v1`.
- Reuse the fixed Alpha/Beta markers and three-paragraph `synthetic-library-hours-v1` fixture by import from `research/experiments/docx-hidden-run-v1/fixture.ts`.
- Marker placement remains body paragraph 0/run 1 for Alpha and body paragraph 2/run 1 for Beta.
- The source mechanism is one direct `w:color w:val="FFFFFF"` property on each marker run. Do not add hidden text, font sizing, shading, highlighting, theme color, styles, zero-width characters, metadata, comments, custom XML, off-page text, headers, footers, macros, active content, embedded objects, remote resources, or external relationships.
- Semantic white accepts only a direct six-hex-digit color equal to `FFFFFF` case-insensitively. Reject missing color, `auto`, `#FFFFFF`, abbreviated white, non-white, theme color/tint/shade, enabled `w:vanish`, direct `w:sz`/`w:szCs`, `w:shd`, and `w:highlight` on every run overlapping a marker.
- Import the same canonical source independently into Google Docs and Microsoft Word. Never chain transformed artifacts.
- Google Docs default white-page view, Word light-page view, and Word built-in dark-page view are mandatory at 100% before selection or explicit exposure.
- Clipboard copies from both editors are mandatory and must preserve Alpha, Beta, and the frozen visible body after marker removal.
- Selection reveal is recorded but does not fail the transport gate.
- Google Docs desktop dark mode and screen-reader behavior are `not_assessable`; do not emulate them. Run Word Accessibility Assistant only after primary observations; its findings are recorded but do not determine the transport gate.
- A successful result authorizes Milestone 3 research only. Never call this profile accessibility-safe, pilot-ready, production-ready, tamper-resistant, guaranteed invisible, or evidence of AI behavior.
- Generated DOCX and TXT files live only under ignored `research/artifacts/docx-semantic-white-carrier-qualification-v1/` and are never committed.
- The canonical generator refuses to replace any existing path, including a regular file or symlink. Tests use temporary directories and never touch the canonical artifact.
- Use existing dependencies only. `pnpm-lock.yaml` must not change.
- If a required visual, import, export, save, or clipboard observation is unreliable, stop the run as operationally `BLOCKED`; do not create a scientific result record.

## File Map

| File | Responsibility |
| --- | --- |
| `research/experiments/docx-semantic-white-carrier-qualification-v1/protocol.md` | Frozen experiment identifiers, workflows, record schema, and mechanical gate. |
| `research/experiments/docx-semantic-white-carrier-qualification-v1/fixture.ts` | Imports the frozen markers/body and exposes the single v2 candidate contract. |
| `src/documents/docx/docx-matching-color-body-v2.ts` | Generates the one source DOCX package in memory. |
| `research/experiments/docx-semantic-white-carrier-qualification-v1/inspect-semantic-white-docx.ts` | Reuses transformed inspection and evaluates direct-white plus forbidden run properties. |
| `scripts/generate-docx-semantic-white-carrier.ts` | Safely creates the canonical source once and prints its hash. |
| `scripts/inspect-docx-semantic-white-carrier.ts` | Read-only repository-bounded inspection command. |
| `scripts/validate-docx-semantic-white-carrier-run.ts` | Strictly validates artifacts, observations, schema, and gate. |
| `tests/documents/docx-semantic-white-carrier-qualification.test.ts` | Generator and semantic-white structural contract tests. |
| `tests/research/semantic-white-carrier-command-safety.test.ts` | CLI path, symlink, overwrite, and temp-output safety tests. |
| `tests/research/semantic-white-carrier-record.test.ts` | Exact record shape, artifact/hash, and mechanical gate tests. |
| `research/experiments/docx-semantic-white-carrier-qualification-v1/run-001.json` | Completed non-blocked evidence record only. |
| `.superpowers/sdd/2026-09-02-milestone-2c-semantic-white-carrier-qualification/progress.md` | Durable execution rulings, hashes, observations, reviews, and verification evidence. |
| `package.json` | Three versioned research commands only. |
| `docs/TESTING.md` | Exact local commands and evidence boundaries. |
| `AGENTS.md` | Names Milestone 2C as the active research milestone without rewriting old results. |

---

### Task 1: Freeze the protocol, fixture, and active milestone boundary

**Files:**

- Create: `research/experiments/docx-semantic-white-carrier-qualification-v1/protocol.md`
- Create: `research/experiments/docx-semantic-white-carrier-qualification-v1/fixture.ts`
- Create: `.superpowers/sdd/2026-09-02-milestone-2c-semantic-white-carrier-qualification/progress.md`
- Modify: `AGENTS.md`
- Do not modify: any path under `research/experiments/docx-hidden-run-v1/` or `research/experiments/docx-alternative-carrier-bakeoff-v1/`

**Interfaces:**

- Produces `QUALIFICATION_FIXTURE`, `CANDIDATE_ID`, `DOCUMENT_PROFILE`, `QUALIFICATION_PROFILE`, `EXPERIMENT_ID`, and `EXPERIMENT_SCHEMA_VERSION` for every later task.
- Produces the frozen record vocabulary and gate consumed by Task 4.

- [ ] **Step 1: Write the fixture module**

```typescript
import {
  CARRIER_SPIKE_INPUT,
  FIXED_MARKER_ALPHA,
  FIXED_MARKER_BETA,
  VISIBLE_PARAGRAPHS,
  VISIBLE_FIXTURE_ID,
} from "../docx-hidden-run-v1/fixture.ts";

export const EXPERIMENT_ID =
  "glyph-exp-a-docx-semantic-white-carrier-qualification-v1-001";
export const EXPERIMENT_SCHEMA_VERSION = 1;
export const QUALIFICATION_PROFILE =
  "docx-semantic-white-carrier-qualification-v1";
export const CANDIDATE_ID = "matching-color-body-v2";
export const DOCUMENT_PROFILE = "docx-matching-color-body-v2";

export type SemanticWhiteMarkerId = "alpha" | "beta";
export type SemanticWhiteFixtureRun = Readonly<{
  text: string;
  marker?: SemanticWhiteMarkerId;
}>;
export type SemanticWhiteFixture = Readonly<{
  bodyParagraphs: readonly (readonly SemanticWhiteFixtureRun[])[];
  markers: Readonly<{ alpha: string; beta: string }>;
}>;

const markerIdForText = (text: string): SemanticWhiteMarkerId | undefined =>
  text === FIXED_MARKER_ALPHA
    ? "alpha"
    : text === FIXED_MARKER_BETA
      ? "beta"
      : undefined;

export const QUALIFICATION_FIXTURE = {
  bodyParagraphs: CARRIER_SPIKE_INPUT.paragraphs.map(({ runs }) =>
    runs.map(({ text }) => {
      const marker = markerIdForText(text);
      return marker === undefined ? { text } : { text, marker };
    }),
  ),
  markers: { alpha: FIXED_MARKER_ALPHA, beta: FIXED_MARKER_BETA },
} as const satisfies SemanticWhiteFixture;

export {
  FIXED_MARKER_ALPHA,
  FIXED_MARKER_BETA,
  VISIBLE_PARAGRAPHS,
  VISIBLE_FIXTURE_ID,
};
```

- [ ] **Step 2: Write and freeze `protocol.md`**

Copy the identifiers and contracts from the approved design verbatim. Add this
exact JSON schema with no additional properties:

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

Define `BLOCKED` as operational state outside this JSON schema.

- [ ] **Step 3: Update the repository milestone instruction surgically**

Replace only the sentence naming Milestone 2B as current with:

```markdown
Milestone 2 ended with the recorded abandonment of `docx-hidden-run-v1`;
Milestone 2B recorded `REVISE_CANDIDATE`; Milestone 2C, the separately
versioned semantic-white carrier qualification, is the current research
milestone. Milestone 3 and product workflows remain later and require a
positive Milestone 2C transport gate plus the accessibility boundary recorded
by that experiment.
```

- [ ] **Step 4: Initialize the durable progress ledger**

Record branch, base commit, Node/pnpm/macOS versions, package and lockfile hashes,
clean-status evidence, immutable old-experiment tree hashes, and a ruling that
the user's no-approval instruction authorizes continuous execution but does not
permit fabricated editor observations.

- [ ] **Step 5: Verify Task 1**

Run:

```bash
pnpm test
pnpm lint
pnpm typecheck
git diff --check
git diff --exit-code d7c42ee -- research/experiments/docx-hidden-run-v1 research/experiments/docx-alternative-carrier-bakeoff-v1
```

Expected: all existing checks pass; both immutable experiment diffs are empty.

- [ ] **Step 6: Commit Task 1**

```bash
git add AGENTS.md \
  research/experiments/docx-semantic-white-carrier-qualification-v1/protocol.md \
  research/experiments/docx-semantic-white-carrier-qualification-v1/fixture.ts \
  .superpowers/sdd/2026-09-02-milestone-2c-semantic-white-carrier-qualification/progress.md
git commit -m "docs: freeze semantic-white carrier qualification"
```

---

### Task 2: Build the generator and semantic-white inspector red-first

**Files:**

- Create: `src/documents/docx/docx-matching-color-body-v2.ts`
- Create: `research/experiments/docx-semantic-white-carrier-qualification-v1/inspect-semantic-white-docx.ts`
- Create: `tests/documents/docx-semantic-white-carrier-qualification.test.ts`

**Interfaces:**

```typescript
export async function generateMatchingColorBodyV2(
  fixture: SemanticWhiteFixture,
): Promise<Uint8Array>;

export type MarkerMechanismInspection = Readonly<{
  markerId: "alpha" | "beta";
  partName: string;
  location: OOXMLTextLocation;
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

export type SemanticWhiteCarrierInspection = Readonly<{
  transformed: TransformedDocxInspection;
  markerMechanisms: readonly MarkerMechanismInspection[];
}>;

export function inspectSemanticWhiteCarrier(
  bytes: Uint8Array,
  markers: Readonly<{ alpha: string; beta: string }>,
): SemanticWhiteCarrierInspection;
```

- [ ] **Step 1: Write failing generator contract tests**

Cover exact body paragraph/run placement, exact visible body after marker
removal, one marker occurrence per ID, direct `FFFFFF`, absence of every
forbidden property, and empty existing safety arrays.

```typescript
test("generates only direct semantic-white body marker runs", async () => {
  const inspection = inspectSemanticWhiteCarrier(
    await generateMatchingColorBodyV2(QUALIFICATION_FIXTURE),
    QUALIFICATION_FIXTURE.markers,
  );

  expect(inspection.transformed.markerPresence).toEqual({
    alpha: "present",
    beta: "present",
  });
  expect(inspection.markerMechanisms).toHaveLength(2);
  expect(inspection.markerMechanisms).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        markerId: "alpha",
        partName: "word/document.xml",
        location: "body",
        paragraphIndex: 0,
        directColorValue: "FFFFFF",
        semanticDirectWhite: true,
        forbiddenProperties: [],
      }),
      expect.objectContaining({
        markerId: "beta",
        partName: "word/document.xml",
        location: "body",
        paragraphIndex: 2,
        directColorValue: "FFFFFF",
        semanticDirectWhite: true,
        forbiddenProperties: [],
      }),
    ]),
  );
});
```

- [ ] **Step 2: Run the focused test and observe red**

```bash
pnpm test tests/documents/docx-semantic-white-carrier-qualification.test.ts
```

Expected: FAIL because the new generator/inspector modules do not exist.

- [ ] **Step 3: Implement the minimum generator**

```typescript
import { Document, Packer, Paragraph, TextRun } from "docx";
import type { SemanticWhiteFixture } from
  "../../../research/experiments/docx-semantic-white-carrier-qualification-v1/fixture";

export async function generateMatchingColorBodyV2(
  fixture: SemanticWhiteFixture,
): Promise<Uint8Array> {
  const children = fixture.bodyParagraphs.map(
    (runs) =>
      new Paragraph({
        children: runs.map(
          (run) =>
            new TextRun(
              run.marker
                ? { text: run.text, color: "FFFFFF" }
                : { text: run.text },
            ),
        ),
      }),
  );
  return await Packer.toBuffer(new Document({ sections: [{ children }] }));
}
```

- [ ] **Step 4: Implement the inspector as a narrow layer**

Call `inspectTransformedDocx(bytes, markers)` first. Parse only
`word/document.xml` to map its direct `w:p`/`w:r` elements to the existing
occurrence paragraph/run indexes. For each overlapping run, read direct `w:rPr`
children and compute:

```typescript
const semanticDirectWhite =
  directColorValue !== null &&
  /^[0-9a-f]{6}$/i.test(directColorValue) &&
  directColorValue.toUpperCase() === "FFFFFF" &&
  themeColor === null &&
  themeTint === null &&
  themeShade === null &&
  !hidden &&
  sizeHalfPoints === null &&
  sizeComplexScriptHalfPoints === null &&
  shadingFill === null &&
  highlight === null;
```

Do not copy the transformed inspector's package-safety logic. Propagate its
errors and return it as `transformed`.

- [ ] **Step 5: Add adversarial inspector tests and observe red/green**

Mutate temporary in-memory packages to cover:

```typescript
test.each([
  ["ffffff", true],
  ["FFFFFF", true],
  ["auto", false],
  ["FFF", false],
  ["#FFFFFF", false],
  ["FFFFFE", false],
])("classifies direct color %s", async (value, expected) => {
  const bytes = await sourceWithMarkerColor(value);
  expect(
    inspectSemanticWhiteCarrier(bytes, QUALIFICATION_FIXTURE.markers)
      .markerMechanisms.every((entry) => entry.semanticDirectWhite),
  ).toBe(expected);
});
```

Add one test per `themeColor`, `themeTint`, `themeShade`, enabled `vanish`,
`sz`, `szCs`, `shd`, and `highlight`; each must return
`semanticDirectWhite: false` and name the exact offending property. Add a split
marker across two adjacent runs: both white passes; either non-white fails.

- [ ] **Step 6: Verify Task 2**

```bash
pnpm test tests/documents/docx-semantic-white-carrier-qualification.test.ts tests/research/transformed-docx-inspector.test.ts tests/documents/docx-alternative-carrier-bakeoff.test.ts tests/documents/docx-hidden-run-v1.test.ts
pnpm lint
pnpm typecheck
git diff --check
```

Expected: all focused and regression tests pass with no old-experiment edits.

- [ ] **Step 7: Commit Task 2**

```bash
git add src/documents/docx/docx-matching-color-body-v2.ts \
  research/experiments/docx-semantic-white-carrier-qualification-v1/inspect-semantic-white-docx.ts \
  tests/documents/docx-semantic-white-carrier-qualification.test.ts \
  .superpowers/sdd/2026-09-02-milestone-2c-semantic-white-carrier-qualification/progress.md
git commit -m "feat: add semantic-white DOCX carrier"
```

---

### Task 3: Add safe generation and inspection commands red-first

**Files:**

- Create: `scripts/generate-docx-semantic-white-carrier.ts`
- Create: `scripts/inspect-docx-semantic-white-carrier.ts`
- Create: `tests/research/semantic-white-carrier-command-safety.test.ts`
- Modify: `package.json`
- Modify: `docs/TESTING.md`

**Interfaces:**

- `pnpm research:carrier:semantic-white:generate`
- `pnpm research:carrier:semantic-white:inspect -- <repository-relative-docx-path>`
- The generator accepts no output-path argument and writes only the frozen
  canonical path once.

- [ ] **Step 1: Write failing command tests**

Test missing/extra arguments, repository-relative inspection, traversal,
absolute paths, escaping symlinks, directory input, malformed packages, unsafe
packages, exact JSON output, and generation refusal for both existing files and
symlinks. Invoke the generator only from a copied temporary repository fixture
whose canonical output path is disposable.

```typescript
test("refuses to overwrite the canonical artifact", async () => {
  const repository = await makeDisposableRepository();
  await runGenerator(repository);
  const second = await runGenerator(repository);
  expect(second.status).not.toBe(0);
  expect(second.stderr).toContain("Refusing to replace existing artifact");
});
```

- [ ] **Step 2: Run command tests and observe red**

```bash
pnpm test tests/research/semantic-white-carrier-command-safety.test.ts
```

Expected: FAIL because scripts and package commands do not exist.

- [ ] **Step 3: Implement the generator command**

Use the existing bakeoff generator's repository-containment and nearest-existing
ancestor checks. Change overwrite behavior to fail on any successful `lstat`,
not only symlinks:

```typescript
try {
  await lstat(artifactAbsolutePath);
  throw new Error(`Refusing to replace existing artifact: ${artifactPath}`);
} catch (error: unknown) {
  if (!isNotFound(error)) throw error;
}

await writeFile(artifactAbsolutePath, bytes, { flag: "wx" });
```

Print one JSON line containing `candidateId`, `documentProfile`, `artifactPath`,
and lowercase SHA-256.

- [ ] **Step 4: Implement the inspection command**

Reuse the old command's repository-relative, canonical-path, regular-file, and
safe-error pattern. Output SHA-256 plus the complete
`SemanticWhiteCarrierInspection`. Exit nonzero for package-safety findings;
semantic-white false remains inspectable evidence and is not converted into a
command error.

- [ ] **Step 5: Add package scripts and testing documentation**

```json
"research:carrier:semantic-white:generate": "node scripts/generate-docx-semantic-white-carrier.ts",
"research:carrier:semantic-white:inspect": "node scripts/inspect-docx-semantic-white-carrier.ts"
```

Document exact canonical and transformed inspection examples. State that these
commands prove package structure only and do not prove editor behavior,
accessibility, production readiness, or AI behavior.

- [ ] **Step 6: Verify and commit Task 3**

```bash
pnpm test tests/research/semantic-white-carrier-command-safety.test.ts tests/documents/docx-semantic-white-carrier-qualification.test.ts
pnpm lint
pnpm typecheck
pnpm build
git diff --check
git diff --exit-code -- pnpm-lock.yaml
git add package.json docs/TESTING.md \
  scripts/generate-docx-semantic-white-carrier.ts \
  scripts/inspect-docx-semantic-white-carrier.ts \
  tests/research/semantic-white-carrier-command-safety.test.ts \
  .superpowers/sdd/2026-09-02-milestone-2c-semantic-white-carrier-qualification/progress.md
git commit -m "chore: add semantic-white carrier commands"
```

---

### Task 4: Add the strict run-record validator red-first

**Files:**

- Create: `scripts/validate-docx-semantic-white-carrier-run.ts`
- Create: `tests/research/semantic-white-carrier-record.test.ts`
- Modify: `package.json`
- Modify: `docs/TESTING.md`

**Interfaces:**

- `validateSemanticWhiteCarrierRun(value: unknown, root?: string): Promise<QualificationRunRecord>`
- `pnpm research:carrier:semantic-white:validate`

- [ ] **Step 1: Write failing schema, artifact, and gate tests**

Create valid temporary source, Google Docs round-trip, Word round-trip, and two
plain-text artifacts. Build a valid record in memory, then independently mutate
every top-level and nested field to test exact-key rejection, enum boundaries,
hash format and byte equality, repository containment, source-hash linkage,
fixture identity, application identity, independent-source evidence, semantic
white evidence, visible body, presentation, clipboard, safety, and gate logic.

Gate test cases must include:

```typescript
test.each([
  [validProceedRecord(), "PROCEED", true],
  [recordWithLowercaseWhite(), "PROCEED", true],
  [recordWithVisibleWordDarkMarker(), "REVISE_CARRIER", true],
  [recordWithGoogleClipboardLoss(), "REVISE_CARRIER", true],
  [recordWithNoBoundedSurvival(), "ABANDON_CARRIER", true],
  [recordMissingWordRoundtrip(), null, false],
  [recordMissingClipboardArtifact(), null, false],
])("validates the frozen gate", async (record, decision, accepted) => {
  if (accepted) {
    await expect(validateSemanticWhiteCarrierRun(record, root)).resolves.toMatchObject({
      gateDecision: decision,
    });
  } else {
    await expect(validateSemanticWhiteCarrierRun(record, root)).rejects.toThrow();
  }
});
```

Assert that selection reveal does not change a valid `PROCEED`. Assert that Word
Accessibility Assistant findings do not change it. Assert that Google dark and
screen-reader fields must be exactly `not_assessable` with limitations.

- [ ] **Step 2: Run validator tests and observe red**

```bash
pnpm test tests/research/semantic-white-carrier-record.test.ts
```

Expected: FAIL because the validator module does not exist.

- [ ] **Step 3: Implement exact parsing and artifact validation**

Follow the existing Milestone 2B validator's `exactObject`, enum, safe-content,
artifact containment, realpath, regular-file, SHA-256, and inspector comparison
patterns. Use the new fixture/constants and `inspectSemanticWhiteCarrier`.

The gate implementation is exactly:

```typescript
const canProceed =
  sourcePasses &&
  googleDocs.docxPasses &&
  microsoftWord.docxPasses &&
  googleDocs.primaryView.ordinaryVisibility === "not_visible" &&
  microsoftWord.lightView.ordinaryVisibility === "not_visible" &&
  microsoftWord.darkView.ordinaryVisibility === "not_visible" &&
  googleDocs.primaryView.layoutDisturbance === "none_observed" &&
  microsoftWord.lightView.layoutDisturbance === "none_observed" &&
  microsoftWord.darkView.layoutDisturbance === "none_observed" &&
  googleDocs.copyPasses &&
  microsoftWord.copyPasses;

const hasBoundedEvidence =
  editorPreservesDocxAndBody(googleDocs) ||
  editorPreservesDocxAndBody(microsoftWord) ||
  editorPreservesCopyAndBody(googleDocs) ||
  editorPreservesCopyAndBody(microsoftWord);

const expectedDecision = canProceed
  ? "PROCEED"
  : hasBoundedEvidence
    ? "REVISE_CARRIER"
    : "ABANDON_CARRIER";
```

Reject a record whose declared decision differs. Missing or uninspectable
mandatory evidence is a validation error representing operational `BLOCKED`,
not an `ABANDON_CARRIER` record.

- [ ] **Step 4: Add the validation command and docs**

```json
"research:carrier:semantic-white:validate": "node scripts/validate-docx-semantic-white-carrier-run.ts"
```

The command reads only
`research/experiments/docx-semantic-white-carrier-qualification-v1/run-001.json`
and prints one safe JSON summary with `status`, `gateDecision`, and
`documentProfile`.

- [ ] **Step 5: Verify and commit Task 4**

```bash
pnpm test tests/research/semantic-white-carrier-record.test.ts tests/research/semantic-white-carrier-command-safety.test.ts
pnpm lint
pnpm typecheck
pnpm build
git diff --check
git diff --exit-code -- pnpm-lock.yaml
git add package.json docs/TESTING.md \
  scripts/validate-docx-semantic-white-carrier-run.ts \
  tests/research/semantic-white-carrier-record.test.ts \
  .superpowers/sdd/2026-09-02-milestone-2c-semantic-white-carrier-qualification/progress.md
git commit -m "chore: validate semantic-white carrier records"
```

---

### Task 5: Freeze the canonical source and execute both editor workflows

**Files:**

- Generate ignored: `research/artifacts/docx-semantic-white-carrier-qualification-v1/matching-color-body-v2.docx`
- Produce ignored: `research/artifacts/docx-semantic-white-carrier-qualification-v1/matching-color-body-v2-google-docs-roundtrip.docx`
- Produce ignored: `research/artifacts/docx-semantic-white-carrier-qualification-v1/matching-color-body-v2-google-docs-copy-plain-text.txt`
- Produce ignored: `research/artifacts/docx-semantic-white-carrier-qualification-v1/matching-color-body-v2-microsoft-word-roundtrip.docx`
- Produce ignored: `research/artifacts/docx-semantic-white-carrier-qualification-v1/matching-color-body-v2-microsoft-word-copy-plain-text.txt`
- Create only after a non-blocked run: `research/experiments/docx-semantic-white-carrier-qualification-v1/run-001.json`
- Modify: `.superpowers/sdd/2026-09-02-milestone-2c-semantic-white-carrier-qualification/progress.md`
- Do not modify: `protocol.md` or any completed experiment.

- [ ] **Step 1: Run the pre-generation freeze checks**

```bash
git status --short
node --version
pnpm --version
shasum -a 256 package.json pnpm-lock.yaml
test ! -e research/artifacts/docx-semantic-white-carrier-qualification-v1/matching-color-body-v2.docx
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

Expected: tracked tree clean, full checks pass, and the canonical path does not
exist. If it exists, inspect and report it; never replace it.

- [ ] **Step 2: Generate once, hash, inspect, and freeze**

```bash
pnpm research:carrier:semantic-white:generate
shasum -a 256 research/artifacts/docx-semantic-white-carrier-qualification-v1/matching-color-body-v2.docx
pnpm research:carrier:semantic-white:inspect -- research/artifacts/docx-semantic-white-carrier-qualification-v1/matching-color-body-v2.docx
```

Record exact output, dependency/environment versions, and the canonical SHA-256
in the progress ledger. Re-run the generator and verify that it refuses to
replace the file without changing its hash.

- [ ] **Step 3: Execute Google Docs exactly once**

Use reliable browser/computer automation against a new unshared document. Make
the pre-selection 100% default-view observation, export the DOCX, copy the body
once to UTF-8 plain text, then record selection reveal. If any required action
or observation is unreliable, record `BLOCKED` in the ledger and stop before a
run record.

- [ ] **Step 4: Execute Microsoft Word independently**

Open the unchanged canonical source directly. Make light and built-in dark page
observations at 100%, save a DOCX copy, copy the body once to UTF-8 plain text,
record selection reveal, then run Accessibility Assistant. Do not use the Google
Docs export as input. If any required action or observation is unreliable,
record `BLOCKED` and stop before a run record.

- [ ] **Step 5: Hash and inspect all five artifacts**

```bash
shasum -a 256 research/artifacts/docx-semantic-white-carrier-qualification-v1/*
pnpm research:carrier:semantic-white:inspect -- research/artifacts/docx-semantic-white-carrier-qualification-v1/matching-color-body-v2.docx
pnpm research:carrier:semantic-white:inspect -- research/artifacts/docx-semantic-white-carrier-qualification-v1/matching-color-body-v2-google-docs-roundtrip.docx
pnpm research:carrier:semantic-white:inspect -- research/artifacts/docx-semantic-white-carrier-qualification-v1/matching-color-body-v2-microsoft-word-roundtrip.docx
```

Inspect each TXT independently for Alpha, Beta, byte encoding, final newline,
and the three visible paragraphs after marker removal.

- [ ] **Step 6: Create and mechanically validate the record**

Populate `run-001.json` only from recorded evidence. Apply the validator:

```bash
pnpm research:carrier:semantic-white:validate
pnpm test tests/research/semantic-white-carrier-record.test.ts
```

Expected: the validator reports the mechanically derived gate. Never edit the
protocol, candidate, artifact, observation, or validator to obtain a preferred
decision.

- [ ] **Step 7: Commit the non-blocked result**

```bash
git add research/experiments/docx-semantic-white-carrier-qualification-v1/run-001.json \
  .superpowers/sdd/2026-09-02-milestone-2c-semantic-white-carrier-qualification/progress.md
git commit -m "research: record semantic-white qualification run 001"
```

No generated artifact may be staged.

---

### Task 6: Complete independent review, full verification, and branch synchronization

**Files:**

- Modify only if evidence requires factual corrections:
  `.superpowers/sdd/2026-09-02-milestone-2c-semantic-white-carrier-qualification/progress.md`
- Do not create a PR or merge.

- [ ] **Step 1: Run the complete verification suite**

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm research:carrier:semantic-white:validate
```

Expected: every command exits zero with the completed record present.

- [ ] **Step 2: Run focused regression and safety suites**

```bash
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

- [ ] **Step 3: Run immutability, artifact, privacy, and leakage audits**

```bash
git diff --exit-code 41f5bf14ad64103f186dcf4e385693d51dba370f -- research/experiments/docx-hidden-run-v1 research/experiments/docx-alternative-carrier-bakeoff-v1
git diff --exit-code d7c42ee -- pnpm-lock.yaml
git check-ignore -v research/artifacts/docx-semantic-white-carrier-qualification-v1/*
git ls-files research/artifacts
git diff --check 41f5bf14ad64103f186dcf4e385693d51dba370f..HEAD
git diff --name-status 41f5bf14ad64103f186dcf4e385693d51dba370f..HEAD
rg -n -i "password|secret|token|api[_-]?key|authorization|cookie|student|prompt|response|documentUrl|account" research/experiments/docx-semantic-white-carrier-qualification-v1 scripts tests src docs/TESTING.md AGENTS.md
rg -n "FingerprintEngine|ExactCanary|semantic canary|Supabase|Protect|Analyze|authentication|deployment" src scripts tests research/experiments/docx-semantic-white-carrier-qualification-v1
git status --short --branch
```

Review every match contextually. Expected: no committed generated artifacts,
secret material, student work, application milestones, unexpected dependency
change, or old-experiment mutation.

- [ ] **Step 4: Obtain independent read-only reviews**

Dispatch separate reviewers for:

1. protocol/spec/gate compliance and scientific claim boundaries;
2. code, tests, command safety, and validator adversarial coverage;
3. full diff, privacy, generated-artifact, and immutable-history audit.

Fix all critical and important findings with the single mutating implementer,
then rerun affected tests and request rereview.

- [ ] **Step 5: Make the final coherent checkpoint commit if needed**

```bash
git add .superpowers/sdd/2026-09-02-milestone-2c-semantic-white-carrier-qualification/progress.md
git commit -m "chore: complete semantic-white qualification verification"
```

Skip this commit if verification produces no tracked change.

- [ ] **Step 6: Push the verified branch without merging or opening a PR**

```bash
git push -u origin codex/milestone-2c-semantic-white-carrier-qualification
git rev-list --left-right --count origin/codex/milestone-2c-semantic-white-carrier-qualification...HEAD
```

Expected: push succeeds and divergence is `0 0`.

- [ ] **Step 7: Report the result**

Return identifiers and commit hashes, all five artifact hashes, editor versions,
structural/clipboard/presentation/accessibility observations, safety results,
gate decision and rationale, deviations, unassessed items, verification commands,
audit outcomes, Git status/tracking state, and exact claim limitations. Do not
describe `PROCEED` as production readiness.

## Execution Handoff

The user has already selected continuous execution with no additional manual
approval prompts. Use one mutating implementer for overlapping source/test/docs
files and parallel read-only reviewers where useful. Continue through all tasks
without asking whether to proceed. Stop only for an unresolvable operational
block, unreliable required editor evidence, an artifact hash discrepancy, or a
scope decision that cannot be derived from this plan and its approved design.
