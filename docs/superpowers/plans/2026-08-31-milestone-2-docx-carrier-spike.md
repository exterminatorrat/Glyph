# Glyph Milestone 2 DOCX Carrier Spike Implementation Plan

> **For agentic workers:** Execute this plan task-by-task with `superpowers:subagent-driven-development` or `superpowers:executing-plans`. Use `superpowers:test-driven-development` for the carrier module and `superpowers:verification-before-completion` before reporting the research decision.

**Goal:** Generate and structurally verify one inert `docx-hidden-run-v1` research artifact, execute the predeclared Experiment A workflows, and record one evidence-bounded carrier decision without beginning fingerprint or product work.

**Architecture:** The document carrier remains independent from fingerprint strategy. A small module accepts ordered visible and hidden text runs without knowing marker syntax; a research fixture supplies the two fixed spike markers; research-only inspection code verifies OOXML structure and transformed artifacts. Generated binaries remain local and ignored, while the frozen protocol and completed machine-readable run record are committed.

**Tech Stack:** The existing Node.js, TypeScript, pnpm, and Vitest foundation; the current stable `docx` package selected during execution for generation; `fflate` for ZIP inspection; `@xmldom/xmldom` for namespace-aware OOXML traversal; Node's built-in filesystem, path, and SHA-256 APIs. No browser UI, database, model API, or deployment tooling is added.

**Spec:** This plan implements Milestone 2 as defined by [`AGENTS.md`](../../../AGENTS.md), [`docs/PRODUCT.md`](../../PRODUCT.md), [`docs/MVP_SPEC.md`](../../MVP_SPEC.md), [`docs/ARCHITECTURE.md`](../../ARCHITECTURE.md), [`docs/SECURITY.md`](../../SECURITY.md), [`docs/TESTING.md`](../../TESTING.md), and [`docs/EXPERIMENTS.md`](../../EXPERIMENTS.md). The completed foundation is recorded in [`docs/superpowers/plans/2026-08-30-milestone-1-foundation.md`](2026-08-30-milestone-1-foundation.md).

## Global Constraints

- This milestone implements and runs Experiment A only: `protected DOCX -> document workflow -> inspected representation`.
- The document profile is exactly `docx-hidden-run-v1`, and the sole carrier mechanism is WordprocessingML `w:vanish` on ordinary text runs.
- The fixed research markers are exactly `GLYPH TEST MARKER ALPHA` and `GLYPH TEST MARKER BETA`. They are not generated markers, production fingerprints, semantic markers, or evidence of model behavior.
- Carrier versioning remains independent from fingerprint schema, strategy, strategy version, and matching profile. Those fingerprint fields are not applicable in this experiment.
- Do not add white-on-white text, zero-width Unicode, off-page positioning, tiny-font tricks, comments as a carrier, custom XML, metadata carriers, macros, scripts, active content, embedded executables, or remote resources. The exact empty comments package plumbing emitted by `docx@9.7.1` is allowed only as recorded in Task 2 and must not carry marker text or any other content.
- Treat the carrier as inspectable, removable, non-cryptographic, experimental, potentially exposed by accessibility or hidden-text settings, and potentially lost during editing or conversion.
- Use synthetic content only. No student work, real assignment, student name, school record, credential, or private account detail may enter code, tests, artifacts, records, logs, or Git.
- Do not add Supabase, Postgres, authentication, RLS, routes, Protect, Analyze, uploads, model testing, AI APIs, fingerprint generation, ExactCanary, context analysis, semantic matching, or speculative strategy classes.
- Generated DOCX and clipboard artifacts remain inert, local, and ignored. Source, protocol, tests, and the completed experiment record are durable Git content.
- Automated checks prove only that the generator emitted the intended inert OOXML. Word, Google Docs, clipboard, hidden-text, and accessibility observations come only from the frozen manual protocol.
- A carrier observation does not establish prompt reuse, AI authorship, direct AI ingestion, student intent, cheating, or academic misconduct.
- Select and record dependency versions only during authorized execution after checking current official metadata. Do not change Git identity or global machine configuration.
- Stop after the carrier decision. Even `PROCEED` does not authorize Milestone 3.

---

## Task 1: Freeze the Experiment A fixture, protocol, record contract, and gate

**Files:**

- Modify: `AGENTS.md` — carry forward only the authorized repository-state sentence already corrected during planning.
- Commit: `docs/superpowers/plans/2026-08-31-milestone-2-docx-carrier-spike.md` — preserve this approved plan.
- Create: `research/experiments/docx-hidden-run-v1/protocol.md` — freeze the fixture, workflows, observation vocabulary, artifact policy, record contract, and decision rule before any observation.

**Fixed protocol identifiers:**

- Experiment ID: `glyph-exp-a-docx-hidden-run-v1-001`
- Experiment schema version: `1`
- Document profile: `docx-hidden-run-v1`
- Visible fixture ID: `synthetic-library-hours-v1`
- Fingerprint strategy, fingerprint strategy version, and matching profile: not applicable

- [ ] **Step 1: Verify the approved execution baseline**

  Run:

  ```bash
  pwd -P
  git status --short --branch
  git log -2 --oneline --decorate
  git diff -- AGENTS.md docs/superpowers/plans/2026-08-31-milestone-2-docx-carrier-spike.md
  node --version
  pnpm --version
  ```

  Expected outcome: the physical directory is `/Users/harryjin/Glyph`; `0a799387329024bdfe55da82b35e4cc669fdab5b` is the recorded Milestone 1 baseline used to start Task 1, and the approved Task 1 outcome for Task 2 is `5abab8cbb1bd081e8f55a5d6eea99b6211d6a925`; only `AGENTS.md` and this approved plan are uncommitted at the historical Task 1 checkpoint; Node and pnpm are available. Any other change stops execution before dependency or protocol work.

- [ ] **Step 2: Freeze the exact synthetic fixture and placement**

  Define exactly three visible paragraphs after hidden runs are excluded:

  1. `Read the passage below. Then summarize its main idea in two sentences.`
  2. `A neighborhood library extended its weekend hours so more residents could use its study rooms and book collection.`
  3. `Explain one possible benefit of the schedule change. Then explain one possible drawback.`

  Freeze the run layout:

  | Paragraph | Run 1 | Run 2 | Run 3 |
  | --- | --- | --- | --- |
  | 1 | Visible: `Read the passage below.` | Hidden: `GLYPH TEST MARKER ALPHA` | Visible: ` Then summarize its main idea in two sentences.` |
  | 2 | Visible: the complete library-hours sentence | none | none |
  | 3 | Visible: `Explain one possible benefit of the schedule change.` | Hidden: `GLYPH TEST MARKER BETA` | Visible: ` Then explain one possible drawback.` |

  Alpha and Beta are separate hidden runs in separate visible paragraphs. The positions diagnose location-sensitive loss; they do not provide statistically independent evidence. Hidden text is not placed in its own paragraph, avoiding a second paragraph-level carrier variable.

- [ ] **Step 3: Freeze the material workflows and observation vocabulary**

  Record these workflow IDs in `protocol.md`:

  | Workflow ID | Gate role | Representation |
  | --- | --- | --- |
  | `canonical-package` | mandatory software prerequisite; insufficient by itself | generated DOCX/OOXML |
  | `word-roundtrip-docx` | material editor round-trip when Word is available | saved DOCX/OOXML |
  | `google-docs-roundtrip-docx` | material editor round-trip | exported DOCX/OOXML |
  | `word-copy-plain-text` | conditional capability; failure narrows scope | controlled plain text |
  | `google-docs-copy-plain-text` | conditional capability; failure narrows scope | controlled plain text |

  No separate conversion utility is material in this first run. Word save and Google Docs import/export are the preselected document transformations; adding another converter would introduce an unfrozen tool and another variable. A later carrier protocol may add a named converter before its observations begin.

  Ordinary visibility and conditional exposure are observation fields on each applicable editor workflow, not separate workflows.

  Use these exact observation values:

  - Workflow status: `completed`, `failed`, or `not_run`. `failed` means the workflow was attempted but did not yield an inspectable representation; `not_run` means it was unavailable. Both require `failureReason`.
  - Marker presence: `present`, `absent`, `not_assessable`, or `not_applicable`, independently for Alpha and Beta.
  - Visible content: `preserved`, `changed`, `lost`, `not_assessable`, or `not_applicable`.
  - Ordinary visibility: `hidden`, `visible`, `not_assessable`, or `not_applicable`.
  - Conditional exposure: zero or more of `hidden_text_setting`, `accessibility_tool`, `plain_text_extraction`, or `other_recorded_tool`.
  - Protocol deviation: JSON `null` when none; otherwise a concise factual string.

- [ ] **Step 4: Freeze the durable run-record contract**

  Require Task 4 to create `research/experiments/docx-hidden-run-v1/run-001.json` with these top-level fields:

  - `experimentId`, `experimentSchemaVersion`, `date`, and `documentProfile`
  - `fingerprintStrategy`, `fingerprintStrategyVersion`, and `matchingProfile`, all JSON `null`
  - `fixedMarkers`: `{ alpha, beta }` with the exact strings
  - `visibleFixture`: `{ id, sourcePath }`, using the fixed fixture ID and `research/experiments/docx-hidden-run-v1/fixture.ts`
  - `sourceGenerator`: `{ path, gitCommit, nodeVersion, pnpmVersion, docxVersion }`, with path `src/documents/docx/docx-hidden-run-v1.ts`
  - `canonicalArtifact`: `{ path, sha256 }`, using the exact canonical repository-relative path and a lowercase 64-character SHA-256
  - `workflows`, an ordered array using the frozen IDs and observation values
  - `gateDecision`, exactly `PROCEED`, `REVISE CARRIER`, or `ABANDON CURRENT CARRIER`
  - `gateRationale`, a non-empty array of factual strings tied to workflow IDs
  - `limitations`, a non-empty array naming unavailable applications and unassessed exposure modes

  The ordered array contains exactly the five workflow IDs in Step 3. Each workflow object has exactly these fields:

  | Field | Contract |
  | --- | --- |
  | `workflowId` | one frozen workflow ID |
  | `status` | one frozen workflow status |
  | `failureReason` | JSON `null` for `completed`; non-empty factual string for `failed` or `not_run` |
  | `application` | object `{ name: string; version: string | null }` |
  | `platform` | object `{ name: string; version: string | null }` |
  | `steps` | non-empty ordered string array |
  | `sourceArtifactSha256` | lowercase 64-character SHA-256 |
  | `resultArtifact` | JSON `null` when none; otherwise `{ path: string; sha256: string }` using a repository-relative ignored path and lowercase 64-character hash |
  | `markerPresence` | object `{ alpha, beta }` using the frozen presence values |
  | `visibleContent` | one frozen visible-content value |
  | `ordinaryVisibility` | one frozen ordinary-visibility value |
  | `conditionalExposure` | array containing only frozen exposure values |
  | `protocolDeviation` | JSON `null` or a non-empty factual string |
  | `notes` | factual string array |

  Application/platform versions may be JSON `null` when not observable. Exclude account identifiers, cloud document URLs, credentials, student content, and private browser state.

- [ ] **Step 5: Freeze the gate before any observation**

  Put this decision rule in `protocol.md`:

  **PROCEED** requires all of the following:

  1. The canonical structural suite passes, including inert-package and relationship checks.
  2. At least one completed material editor round-trip—Word save-as-DOCX or Google Docs export-as-DOCX—preserves both markers structurally and preserves all three visible paragraphs.
  3. Every editor workflow cited as supported keeps marker text hidden in its ordinary document view.
  4. Every failed or unexecuted editor or clipboard class is named as unsupported or unverified, narrowing the continuation claim to passing classes.

  Clipboard preservation is not required for `PROCEED`. A failed Word or Google Docs class does not automatically block `PROCEED` when another material editor round-trip satisfies the rule, but the failed class cannot be called supported.

  Exposure only after an explicit hidden-text setting or a named assistive tool is a recorded limitation that narrows visibility claims; it is not by itself an ordinary-visibility gate failure. Marker text visible in the normal editor view is an ordinary-visibility failure.

  **REVISE CARRIER** applies when no material editor round-trip satisfies `PROCEED`, but a completed material workflow shows a bounded placement- or presentation-sensitive result worth a separately versioned retest: exactly one marker survives; both survive with visible-content damage; or marker text is ordinary-visible in only a subset of material editor workflows. Revision neither changes this profile in place nor authorizes Milestone 3.

  **ABANDON CURRENT CARRIER** applies when every completed material editor round-trip loses both markers; only the canonical package retains them; or marker text is ordinary-visible across all otherwise-preserving material editor workflows. Do not build product workflows around this profile after that decision.

  These rules exhaust completed, assessable editor outcomes: a full supported result proceeds; a bounded partial or presentation-sensitive result revises; and total carrier loss or universal ordinary exposure abandons. A failed, unavailable, or not-assessable workflow does not count as a pass or absence. If unresolved workflows leave no completed assessable editor result that satisfies one of the three rules, stop as operationally blocked and request the missing environment; do not fabricate a scientific decision. Planning inspection found no Microsoft Word installation, so Google Docs round-trip is the minimum material editor workflow unless Word becomes independently available before execution.

- [ ] **Step 6: Review and commit the pre-observation protocol**

  Run:

  ```bash
  git add -N docs/superpowers/plans/2026-08-31-milestone-2-docx-carrier-spike.md research/experiments/docx-hidden-run-v1/protocol.md
  rg -n 'GLYPH TEST MARKER ALPHA|GLYPH TEST MARKER BETA|docx-hidden-run-v1|PROCEED|REVISE CARRIER|ABANDON CURRENT CARRIER' research/experiments/docx-hidden-run-v1/protocol.md
  git diff --check
  git diff -- AGENTS.md docs/superpowers/plans/2026-08-31-milestone-2-docx-carrier-spike.md research/experiments/docx-hidden-run-v1/protocol.md
  ```

  Expected outcome: the exact markers, separate version axes, material workflows, record fields, and gate are explicit; no result exists because no observation occurred.

  Commit:

  ```bash
  git add AGENTS.md docs/superpowers/plans/2026-08-31-milestone-2-docx-carrier-spike.md research/experiments/docx-hidden-run-v1/protocol.md
  git commit -m "docs: freeze DOCX carrier survival protocol"
  ```

---

## Task 2: Add minimal DOCX tooling and implement the carrier red-first

> **Approved execution amendment (2026-08-31):** `docx@9.7.1` emits inert
> comments package plumbing. Treat only `word/comments.xml`,
> `word/_rels/comments.xml.rels`, the exact `/word/comments.xml`
> WordprocessingML comments content-type override, and the exact internal
> `comments -> comments.xml` document relationship as expected. This is
> generator plumbing, not a carrier mechanism, and does not change
> `docx-hidden-run-v1`, the fixture, markers, placement, protocol, or
> scientific gate.

> The structural contract must explicitly prove: zero `w:comment` elements;
> no fixed marker or other content in `word/comments.xml`; zero relationships
> in `word/_rels/comments.xml.rels`; zero `w:commentRangeStart`,
> `w:commentRangeEnd`, or `w:commentReference` elements in
> `word/document.xml`; the single exact internal comments relationship with
> no external target mode; and the single exact comments content-type
> declaration. Continue to reject `commentsExtended.xml`, `commentsIds.xml`,
> `people.xml`, their relationships, every other unexpected part, actual
> comments, macros, VBA, scripts, active content, external/remote
> relationships, and marker text in comments-related parts. If `docx@9.7.1`
> emits any additional comments part, stop instead of widening the allowlist.

**Files:**

- Modify: `package.json` and `pnpm-lock.yaml` — add and lock only the generator and structural inspection packages.
- Create: `src/documents/docx/docx-hidden-run-v1.ts` — generate DOCX bytes from ordered visible/hidden runs using `w:vanish` only.
- Create: `research/experiments/docx-hidden-run-v1/fixture.ts` — own the fixed synthetic fixture and markers.
- Create: `research/experiments/docx-hidden-run-v1/inspect-carrier-docx.ts` — research-only ZIP/XML inspection shared by tests and the inspection command.
- Create: `tests/documents/docx-hidden-run-v1.test.ts` — define and verify the canonical OOXML contract.

**Generator interface:**

```typescript
export type DocxCarrierRun = Readonly<{ text: string; hidden: boolean }>;
export type DocxCarrierParagraph = Readonly<{
  runs: readonly DocxCarrierRun[];
}>;
export type DocxHiddenRunV1Input = Readonly<{
  paragraphs: readonly DocxCarrierParagraph[];
}>;

export async function generateDocxHiddenRunV1(
  input: DocxHiddenRunV1Input,
): Promise<Uint8Array>;
```

The function has no marker constants, directive wording, fingerprint types, strategy dispatch, persistence, filesystem writes, or product behavior. The one input shape lets the carrier transport approved hidden text without becoming a registry or plugin system.

**Inspector interface:**

```typescript
export type CarrierRunInspection = Readonly<{
  paragraphIndex: number;
  runIndex: number;
  text: string;
  hidden: boolean;
}>;

export type CarrierDocxInspection = Readonly<{
  entries: readonly string[];
  runs: readonly CarrierRunInspection[];
  visibleParagraphs: readonly string[];
  externalRelationships: readonly string[];
  activeContentEntries: readonly string[];
  activeRelationshipTypes: readonly string[];
  macroContentTypes: readonly string[];
  unexpectedEntries: readonly string[];
  unexpectedRelationships: readonly string[];
}>;

export function inspectCarrierDocx(
  bytes: Uint8Array,
): CarrierDocxInspection;
```

- [ ] **Step 1: Re-check current package compatibility, API, provenance, and licenses**

  Read current official package metadata/source for [`docx`](https://docx.js.org/api/modules.html) (`IRunStylePropertiesOptions.vanish`, `TextRun`, `Document`, and `Packer.toBuffer`), [`fflate.unzipSync`](https://github.com/101arrowz/fflate/blob/master/docs/functions/unzipSync.md), and [`@xmldom/xmldom.DOMParser`](https://github.com/xmldom/xmldom).

  Run:

  ```bash
  pnpm view docx@latest version engines license repository dependencies --json
  pnpm view fflate@latest version engines license repository dependencies --json
  pnpm view @xmldom/xmldom@latest version engines license repository dependencies --json
  ```

  Expected outcome: the selected current stable releases support the installed Node line, have acceptable licenses/provenance, and retain the required APIs. Confirm ordinary `Document` plus `Packer.toBuffer` creates macro-free OOXML `.docx`, not a macro-enabled format. If registry metadata stalls, query the corresponding official `registry.npmjs.org/<package>/latest` endpoint without changing global pnpm configuration. Stop if any API, license, engine, package identity, or provenance requirement cannot be verified.

- [ ] **Step 2: Install only the earned dependencies**

  Run:

  ```bash
  pnpm add docx@latest
  pnpm add --save-dev fflate@latest @xmldom/xmldom@latest
  pnpm list --depth 0
  ```

  Roles:

  - `docx`: runtime dependency for standards-compliant DOCX generation.
  - `fflate`: development dependency for ZIP entry inspection without undeclared transitive imports.
  - `@xmldom/xmldom`: development dependency for namespace-aware OOXML traversal instead of regular-expression assertions.

  Do not add `tsx`: the installed Node 26 runtime can execute constrained erasable TypeScript, configured in Task 3. Do not add Mammoth, JSZip, an OOXML framework, schema validator, or conversion package.

- [ ] **Step 3: Create the fixture and structural inspector**

  In `fixture.ts`, export the fixed IDs, exact marker constants, exact visible paragraph array, and `CARRIER_SPIKE_INPUT` matching Task 1's run table and satisfying `DocxHiddenRunV1Input`.

  In `inspect-carrier-docx.ts`:

  1. Unzip with `fflate.unzipSync`; reject non-packages and missing required entries.
  2. Decode XML with `fflate.strFromU8`; parse with `DOMParser` and reject parser errors.
  3. Traverse `word/document.xml` using the WordprocessingML namespace `http://schemas.openxmlformats.org/wordprocessingml/2006/main`.
  4. Enumerate direct `w:r` children of each `w:p`; concatenate descendant `w:t` text; classify a run hidden only when direct `w:rPr` contains enabled `w:vanish` (`w:val` absent, `1`, `true`, or `on`).
  5. Build each visible paragraph solely from non-hidden run text.
  6. Parse every `.rels` entry and report each relationship with `TargetMode="External"`.
  7. Report entries matching `word/vbaProject.bin`, `word/vbaData.xml`, `word/activeX/`, `word/embeddings/`, `word/oleObject/`, `word/webextensions/`, `customUI/`, or `customXml/` case-insensitively.
  8. Report relationship types ending in `/oleObject`, `/package`, `/control`, `/attachedTemplate`, or `/aFChunk`.
  9. Parse `[Content_Types].xml` and report types containing `macroEnabled`, `vbaProject`, `activeX`, or `oleObject`, case-insensitively.
  10. Ignore ZIP directory entries ending in `/`, then compare file entries against this exact canonical allowlist for the text-only fixture: `[Content_Types].xml`, `_rels/.rels`, `docProps/app.xml`, `docProps/core.xml`, `docProps/custom.xml`, `word/document.xml`, `word/styles.xml`, `word/numbering.xml`, `word/settings.xml`, `word/fontTable.xml`, `word/footnotes.xml`, `word/endnotes.xml`, `word/comments.xml`, `word/_rels/document.xml.rels`, `word/_rels/comments.xml.rels`, `word/_rels/fontTable.xml.rels`, `word/_rels/footnotes.xml.rels`, and `word/_rels/endnotes.xml.rels`. Report every other file as unexpected. If the selected verified package version cannot produce this allowlisted shape for the frozen fixture, stop for plan review instead of silently expanding the package surface.
  11. Compare relationships against these exact type/target pairs. In `_rels/.rels`: `http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument` -> `word/document.xml`; `http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties` -> `docProps/core.xml`; `http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties` -> `docProps/app.xml`; and `http://schemas.openxmlformats.org/officeDocument/2006/relationships/custom-properties` -> `docProps/custom.xml`. In `word/_rels/document.xml.rels`, the same Office Document relationship namespace with suffixes `styles`, `numbering`, `settings`, `fontTable`, `footnotes`, `endnotes`, and `comments` targets the same-named `.xml` file. Other `.rels` files must contain no relationships for this fixture. Report all other relationships as unexpected. Require every target to resolve to an allowlisted entry and every relationship to omit `TargetMode="External"`.
  12. Return the exact inspector shape above. Do not render documents or infer application behavior.

- [ ] **Step 4: Write and observe the failing structural tests before the generator exists**

  Create `tests/documents/docx-hidden-run-v1.test.ts` with four tests:

  1. `creates a parseable DOCX package with required core entries` checks the `PK` signature and requires `[Content_Types].xml`, `_rels/.rels`, `docProps/core.xml`, `docProps/app.xml`, `word/document.xml`, and `word/_rels/document.xml.rels`.
  2. `places exactly two fixed markers in the intended vanished runs` checks all three visible paragraphs exactly, exactly two hidden runs, Alpha at paragraph `0` run `1`, Beta at paragraph `2` run `1`, and no marker in a visible run. It also decodes every XML/text package entry and proves each fixed marker occurs exactly once in the entire package and only in `word/document.xml`.
  3. `contains only the expected inert package structure` requires the macro, active-content, external-relationship, unexpected-entry, and unexpected-relationship arrays to be empty, and proves the exact inert comments package plumbing: zero `w:comment` elements; no fixed marker or other content in `word/comments.xml`; zero relationships in `word/_rels/comments.xml.rels`; zero comment range/reference elements in `word/document.xml`; one internal `comments -> comments.xml` relationship without `TargetMode="External"`; and one exact `/word/comments.xml` comments content-type override.
  4. `is structurally stable across two generated packages` compares inspection fields from two generations without comparing binary bytes or checksums.

  Import the not-yet-created generator and run:

  ```bash
  pnpm test tests/documents/docx-hidden-run-v1.test.ts
  ```

  Expected red: Vitest discovers the file and exits non-zero because `@/documents/docx/docx-hidden-run-v1` does not exist. Zero discovered tests or a ZIP/XML harness failure is not the intended red state and must be corrected first.

- [ ] **Step 5: Implement the minimum generator and reach green**

  Create `src/documents/docx/docx-hidden-run-v1.ts`. Map input paragraphs to `docx.Paragraph` instances and runs to `docx.TextRun` instances; pass `{ text: run.text, vanish: true }` only for hidden runs and `{ text: run.text }` otherwise; wrap them in one `Document` section; return `Packer.toBuffer(document)`. Add no validation, registry, alternate formatting, metadata, or filesystem behavior.

  Run:

  ```bash
  pnpm test tests/documents/docx-hidden-run-v1.test.ts
  pnpm lint
  pnpm typecheck
  git add -N src/documents/docx/docx-hidden-run-v1.ts research/experiments/docx-hidden-run-v1/fixture.ts research/experiments/docx-hidden-run-v1/inspect-carrier-docx.ts tests/documents/docx-hidden-run-v1.test.ts
  git diff --check
  git diff -- package.json pnpm-lock.yaml src/documents/docx research/experiments/docx-hidden-run-v1/fixture.ts research/experiments/docx-hidden-run-v1/inspect-carrier-docx.ts tests/documents/docx-hidden-run-v1.test.ts
  ```

  Expected green: exactly four carrier tests pass; the fixture positions and safety assertions are proven; lint/typecheck pass; no application, fingerprint, persistence, or model code appears.

  Commit:

  ```bash
  git add package.json pnpm-lock.yaml src/documents/docx/docx-hidden-run-v1.ts research/experiments/docx-hidden-run-v1/fixture.ts research/experiments/docx-hidden-run-v1/inspect-carrier-docx.ts tests/documents/docx-hidden-run-v1.test.ts
  git commit -m "feat: add DOCX hidden-run carrier spike"
  ```

---

## Task 3: Add reproducible generation and inspection commands

**Files:**

- Modify: `.gitignore` — ignore only local Milestone 2 `.docx` and clipboard `.txt` artifacts under the exact artifact directory.
- Modify: `package.json` — add the generation and inspection scripts.
- Modify: `tsconfig.json` — constrain native TypeScript execution.
- Modify: `docs/TESTING.md` — explain the new command contract and evidence boundary.
- Create: `scripts/generate-docx-carrier-spike.ts` — generate the canonical artifact and print its relative path and SHA-256.
- Create: `scripts/inspect-docx-carrier-spike.ts` — inspect one local DOCX and print a machine-readable structural summary.

**Commands:**

- `pnpm research:carrier:generate` writes exactly `research/artifacts/docx-hidden-run-v1/glyph-docx-hidden-run-v1-spike.docx` and prints `{ artifactPath, sha256 }` as JSON.
- `pnpm research:carrier:inspect -- <repository-relative-docx-path>` reads one path, does not mutate it, and prints its hash, entries, visible paragraphs, Alpha/Beta presence, hidden-run count, and every macro, active-content, external-relationship, unexpected-entry, and unexpected-relationship array as JSON.

- [ ] **Step 1: Constrain native TypeScript execution**

  Re-read the current official [Node TypeScript documentation](https://nodejs.org/api/typescript.html). Confirm the installed Node line executes erasable `.ts` files without a loader and ignores `tsconfig.json` at runtime. Add these compiler options without changing existing Next.js settings:

  ```json
  "allowImportingTsExtensions": true,
  "erasableSyntaxOnly": true,
  "verbatimModuleSyntax": true
  ```

  Expected outcome: `tsc --noEmit` accepts explicit `.ts` imports and rejects non-erasable constructs. Scripts use explicit relative `.ts` imports, not path aliases, enums, runtime namespaces, parameter properties, decorators, or other transformed syntax.

- [ ] **Step 2: Add the narrow ignore rules and package scripts**

  Append exactly:

  ```gitignore
  research/artifacts/docx-hidden-run-v1/*.docx
  research/artifacts/docx-hidden-run-v1/*.txt
  ```

  Add exactly:

  ```json
  "research:carrier:generate": "node scripts/generate-docx-carrier-spike.ts",
  "research:carrier:inspect": "node scripts/inspect-docx-carrier-spike.ts"
  ```

  The rules do not hide protocols, fixtures, JSON records, other research paths, or arbitrary document files.

- [ ] **Step 3: Implement both scripts**

  `generate-docx-carrier-spike.ts` must:

  1. import the fixed fixture and generator by explicit relative `.ts` path;
  2. generate bytes in memory;
  3. create only the exact artifact directory;
  4. write only the canonical filename;
  5. compute SHA-256 with `node:crypto`; and
  6. print only the relative path and hash, never raw bytes or document content.

  `inspect-docx-carrier-spike.ts` must:

  1. accept exactly one path argument or exit non-zero with the exact usage string `Usage: pnpm research:carrier:inspect -- <repository-relative-docx-path>`;
  2. reject an absolute path or a normalized path outside the repository, then read the in-repository file without mutation;
  3. call `inspectCarrierDocx`;
  4. report the exact structural fields listed above; and
  5. exit non-zero for unreadable, malformed, or structurally invalid input rather than mapping failure to absent markers.

- [ ] **Step 4: Update the executable-command documentation**

  Add `## Milestone 2 carrier commands` to `docs/TESTING.md`:

  | Command | What success proves |
  | --- | --- |
  | `pnpm research:carrier:generate` | The canonical synthetic DOCX can be regenerated locally and its path and SHA-256 are reported. |
  | `pnpm research:carrier:inspect -- <path>` | One local DOCX can be opened as OOXML and summarized for fixed-marker, visible-content, active-content, macro, and external-relationship structure. |

  Immediately state that these commands and tests prove package structure only, not editor behavior, clipboard survival, accessibility behavior, model compliance, end-to-end survival, prompt reuse, AI authorship, direct ingestion, intent, cheating, or misconduct.

- [ ] **Step 5: Generate, inspect, verify, and commit the command workflow**

  Run:

  ```bash
  git add -N scripts/generate-docx-carrier-spike.ts scripts/inspect-docx-carrier-spike.ts
  pnpm research:carrier:generate
  pnpm research:carrier:inspect -- research/artifacts/docx-hidden-run-v1/glyph-docx-hidden-run-v1-spike.docx
  shasum -a 256 research/artifacts/docx-hidden-run-v1/glyph-docx-hidden-run-v1-spike.docx
  git check-ignore -v research/artifacts/docx-hidden-run-v1/glyph-docx-hidden-run-v1-spike.docx
  pnpm lint
  pnpm typecheck
  pnpm test
  pnpm build
  git diff --check
  git status --short --ignored
  ```

  Expected outcome: generation and `shasum` report the same lowercase SHA-256; inspection finds both signals, exactly two hidden runs, exact visible paragraphs, and empty safety arrays; the DOCX is ignored; all authoritative commands pass. Repeat generation may change binary metadata/checksum, but the structural summary must remain identical.

  Commit:

  ```bash
  git add .gitignore package.json tsconfig.json docs/TESTING.md scripts/generate-docx-carrier-spike.ts scripts/inspect-docx-carrier-spike.ts
  git commit -m "chore: add DOCX carrier research commands"
  ```

---

## Task 4: Execute the frozen manual protocol and record the decision

**Files:**

- Create: `research/experiments/docx-hidden-run-v1/run-001.json` — machine-readable observations, limitations, and one gate decision.
- Do not modify: `research/experiments/docx-hidden-run-v1/protocol.md` — observations cannot rewrite the predeclared protocol.
- Local ignored outputs: canonical, Word/Google round-trip DOCX files, and clipboard `.txt` files under `research/artifacts/docx-hidden-run-v1/`.

- [ ] **Step 1: Capture provenance and canonical-package evidence**

  Run and record the relevant outputs:

  ```bash
  date +%F
  git rev-parse HEAD
  node --version
  pnpm --version
  pnpm list docx --depth 0
  sw_vers
  pnpm research:carrier:generate
  pnpm research:carrier:inspect -- research/artifacts/docx-hidden-run-v1/glyph-docx-hidden-run-v1-spike.docx
  ```

  Expected outcome: canonical package inspection is completed; its checksum, generator provenance, and environment are recorded before editor handling.

- [ ] **Step 2: Run Word workflows only if Word is independently available**

  Check without installing or updating Word:

  ```bash
  test -d "/Applications/Microsoft Word.app"
  ```

  If present, record observable Word/macOS versions; open the canonical file with hidden-text display disabled; compare the three visible paragraphs; save as `word-roundtrip.docx`; structurally inspect and hash it. Starting again from the canonical file, copy the complete ordinary-view body to a new TextEdit document set to plain text, save `word-copy-plain-text.txt`, compute its SHA-256, and run the fixed-marker/plain-text checks defined in Step 4. Finally enable Word's explicit hidden-text display, record exposure, and restore the setting.

  If absent, record both Word workflows as `not_run` with reason `Microsoft Word was not installed in the local test environment`. Planning inspection found Word absent; do not install it for the experiment.

- [ ] **Step 3: Run the Google Docs round-trip from the canonical artifact**

  Record browser and observable platform/product versions without account identity or document URL. Upload the canonical DOCX to a new unshared Google Docs document; compare ordinary rendering against the exact visible fixture and record marker visibility; download as `google-docs-roundtrip.docx`; run the structural inspection command and `shasum -a 256`; record both marker results, visible integrity, hidden-run count, relationship/content safety arrays, checksum, and deviations. Use only the synthetic artifact; do not use a school account or publish/share the document.

- [ ] **Step 4: Run Google Docs copy/paste independently**

  Re-open or re-import the canonical artifact, not the exported file. Copy its complete body from ordinary view into a new TextEdit plain-text document named `google-docs-copy-plain-text.txt`. For each Word or Google clipboard artifact that exists, run:

  ```bash
  for carrier_clipboard_path in \
    research/artifacts/docx-hidden-run-v1/word-copy-plain-text.txt \
    research/artifacts/docx-hidden-run-v1/google-docs-copy-plain-text.txt
  do
    test -f "$carrier_clipboard_path" || continue
    shasum -a 256 "$carrier_clipboard_path"
    rg --fixed-strings 'GLYPH TEST MARKER ALPHA' "$carrier_clipboard_path"
    carrier_alpha_status=$?
    test "$carrier_alpha_status" -le 1 || exit "$carrier_alpha_status"
    rg --fixed-strings 'GLYPH TEST MARKER BETA' "$carrier_clipboard_path"
    carrier_beta_status=$?
    test "$carrier_beta_status" -le 1 || exit "$carrier_beta_status"
  node --input-type=module -e '
  import { readFile } from "node:fs/promises";
  const [path] = process.argv.slice(1);
  const alpha = "GLYPH TEST MARKER ALPHA";
  const beta = "GLYPH TEST MARKER BETA";
  const expected = [
    "Read the passage below. Then summarize its main idea in two sentences.",
    "A neighborhood library extended its weekend hours so more residents could use its study rooms and book collection.",
    "Explain one possible benefit of the schedule change. Then explain one possible drawback.",
  ];
  const raw = await readFile(path, "utf8");
  const visible = raw.replaceAll(alpha, "").replaceAll(beta, "").replaceAll("\r\n", "\n");
  process.stdout.write(`${JSON.stringify({
    alpha: raw.includes(alpha) ? "present" : "absent",
    beta: raw.includes(beta) ? "present" : "absent",
    visibleParagraphsInOrder: expected.every((paragraph, index) => {
      const offset = expected.slice(0, index).reduce((position, prior) => visible.indexOf(prior, position) + prior.length, 0);
      return visible.indexOf(paragraph, Math.max(0, offset)) >= 0;
    }),
  }, null, 2)}\n`);
  ' "$carrier_clipboard_path"
  done
  ```

  Each `rg` exit status is an observation: zero means present and one means absent; any status above one is a command failure. Record the filename/hash and structural summary. Marker removal is used only for the visible-content comparison so marker presence cannot break the visible sentence itself. Ordinary hidden formatting is `not_applicable` for plain text, while exposure is `plain_text_extraction` when marker text is present.

  Clipboard absence is a carrier observation, not evidence about model input.

- [ ] **Step 5: Assess hidden-text and accessibility exposure narrowly**

  For each completed rich-document workflow, record ordinary visibility before any reveal setting and explicit reveal behavior where available. If an already-available assistive workflow such as VoiceOver can be exercised reliably, traverse the body once and record whether Alpha or Beta is announced. Do not install accessibility software or change global accessibility configuration. Use `not_assessable` with the precise limitation when an exposure mode cannot be evaluated; never generalize from one environment.

- [ ] **Step 6: Create the run record and apply the frozen gate mechanically**

  First determine whether at least one material editor round-trip completed and yielded an assessable result. If no material editor round-trip completed, or unresolved outcomes leave no completed assessable material editor result, stop as operationally `BLOCKED`: do not create `research/experiments/docx-hidden-run-v1/run-001.json`, do not run the record validator below, and do not make a final experiment-result commit. Leave any partial local artifacts or notes uncommitted and report them to the user while requesting the missing environment. Do not fabricate a scientific decision.

  Only when the run is not operationally blocked, create `run-001.json` using actual dates, versions, hashes, steps, observations, deviations, and limitations. Include Word records even when `not_run`. Apply the frozen gate in this deterministic order: (1) apply `PROCEED` first when all of its allowed conditions are satisfied; (2) if `PROCEED` is not satisfied, apply `ABANDON CURRENT CARRIER` when every completed material editor loses both markers, only the canonical package retains them, or every otherwise-preserving material editor exposes marker text ordinarily; (3) otherwise apply `REVISE CARRIER` for a bounded partial, placement-sensitive, or presentation-sensitive result plausibly worth a separately versioned retest. Marker exposure in a strict subset of otherwise-preserving material editor workflows is `REVISE CARRIER` only after `PROCEED` and `ABANDON CURRENT CARRIER` do not apply. Record exactly one allowed decision. The rationale must remain carrier-only and must not report model, authorship, ingestion, intent, cheating, misconduct, or prompt-reuse findings.

  For a non-blocked run, parse the JSON with Node before review. Validate all required top-level fields, the exact experiment/profile/schema/marker/fixture constants, the five workflow IDs in order, allowed status and observation values, required reasons for `failed`/`not_run`, 64-character lowercase hashes for every retained artifact, a non-empty rationale and limitations array, and one allowed decision. Fail non-zero on any mismatch. Use only `node:fs/promises` and ordinary assertions; do not add a validation dependency or evaluation framework. Do not run this validator for an operationally `BLOCKED` run.

  For a non-blocked run, run this dependency-free validation command:

  ```bash
  node --input-type=module -e '
  import { createHash } from "node:crypto";
  import { readFile } from "node:fs/promises";
  const recordPath = "research/experiments/docx-hidden-run-v1/run-001.json";
  const record = JSON.parse(await readFile(recordPath, "utf8"));
  const fail = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const topFields = [
    "experimentId", "experimentSchemaVersion", "date", "documentProfile",
    "fingerprintStrategy", "fingerprintStrategyVersion", "matchingProfile",
    "fixedMarkers", "visibleFixture", "sourceGenerator", "canonicalArtifact",
    "workflows", "gateDecision", "gateRationale", "limitations",
  ].sort();
  fail(JSON.stringify(Object.keys(record).sort()) === JSON.stringify(topFields), "top-level fields");
  fail(record.experimentId === "glyph-exp-a-docx-hidden-run-v1-001", "experiment ID");
  fail(record.experimentSchemaVersion === 1, "schema version");
  fail(/^\d{4}-\d{2}-\d{2}$/.test(record.date), "date");
  fail(record.documentProfile === "docx-hidden-run-v1", "document profile");
  fail(record.fingerprintStrategy === null && record.fingerprintStrategyVersion === null && record.matchingProfile === null, "fingerprint fields");
  fail(record.fixedMarkers.alpha === "GLYPH TEST MARKER ALPHA" && record.fixedMarkers.beta === "GLYPH TEST MARKER BETA", "markers");
  fail(record.visibleFixture.id === "synthetic-library-hours-v1" && record.visibleFixture.sourcePath === "research/experiments/docx-hidden-run-v1/fixture.ts", "fixture");
  fail(record.sourceGenerator.path === "src/documents/docx/docx-hidden-run-v1.ts", "generator path");
  for (const key of ["gitCommit", "nodeVersion", "pnpmVersion", "docxVersion"]) fail(typeof record.sourceGenerator[key] === "string" && record.sourceGenerator[key].length > 0, `generator ${key}`);
  const hashPattern = /^[0-9a-f]{64}$/;
  const canonicalPath = "research/artifacts/docx-hidden-run-v1/glyph-docx-hidden-run-v1-spike.docx";
  fail(record.canonicalArtifact.path === canonicalPath && hashPattern.test(record.canonicalArtifact.sha256), "canonical artifact");
  const expectedIds = ["canonical-package", "word-roundtrip-docx", "google-docs-roundtrip-docx", "word-copy-plain-text", "google-docs-copy-plain-text"];
  fail(JSON.stringify(record.workflows.map((item) => item.workflowId)) === JSON.stringify(expectedIds), "workflow order");
  const workflowFields = ["workflowId", "status", "failureReason", "application", "platform", "steps", "sourceArtifactSha256", "resultArtifact", "markerPresence", "visibleContent", "ordinaryVisibility", "conditionalExposure", "protocolDeviation", "notes"].sort();
  const statuses = new Set(["completed", "failed", "not_run"]);
  const presences = new Set(["present", "absent", "not_assessable", "not_applicable"]);
  const visibleValues = new Set(["preserved", "changed", "lost", "not_assessable", "not_applicable"]);
  const visibilityValues = new Set(["hidden", "visible", "not_assessable", "not_applicable"]);
  const exposureValues = new Set(["hidden_text_setting", "accessibility_tool", "plain_text_extraction", "other_recorded_tool"]);
  for (const item of record.workflows) {
    fail(JSON.stringify(Object.keys(item).sort()) === JSON.stringify(workflowFields), `${item.workflowId} fields`);
    fail(statuses.has(item.status), `${item.workflowId} status`);
    fail(item.status === "completed" ? item.failureReason === null : typeof item.failureReason === "string" && item.failureReason.length > 0, `${item.workflowId} failure reason`);
    fail(typeof item.application?.name === "string" && (typeof item.application.version === "string" || item.application.version === null), `${item.workflowId} application`);
    fail(typeof item.platform?.name === "string" && (typeof item.platform.version === "string" || item.platform.version === null), `${item.workflowId} platform`);
    fail(Array.isArray(item.steps) && item.steps.length > 0 && item.steps.every((step) => typeof step === "string" && step.length > 0), `${item.workflowId} steps`);
    fail(hashPattern.test(item.sourceArtifactSha256), `${item.workflowId} source hash`);
    fail(item.resultArtifact === null || (item.resultArtifact.path.startsWith("research/artifacts/docx-hidden-run-v1/") && !item.resultArtifact.path.includes("..") && hashPattern.test(item.resultArtifact.sha256)), `${item.workflowId} result artifact`);
    fail(presences.has(item.markerPresence.alpha) && presences.has(item.markerPresence.beta), `${item.workflowId} marker presence`);
    fail(visibleValues.has(item.visibleContent) && visibilityValues.has(item.ordinaryVisibility), `${item.workflowId} content observation`);
    fail(Array.isArray(item.conditionalExposure) && item.conditionalExposure.every((value) => exposureValues.has(value)), `${item.workflowId} exposure`);
    fail(item.protocolDeviation === null || (typeof item.protocolDeviation === "string" && item.protocolDeviation.length > 0), `${item.workflowId} deviation`);
    fail(Array.isArray(item.notes) && item.notes.every((note) => typeof note === "string" && note.length > 0), `${item.workflowId} notes`);
  }
  fail(new Set(["PROCEED", "REVISE CARRIER", "ABANDON CURRENT CARRIER"]).has(record.gateDecision), "gate decision");
  fail(Array.isArray(record.gateRationale) && record.gateRationale.length > 0 && record.gateRationale.every((value) => typeof value === "string" && value.length > 0), "gate rationale");
  fail(Array.isArray(record.limitations) && record.limitations.length > 0 && record.limitations.every((value) => typeof value === "string" && value.length > 0), "limitations");
  const actualHash = createHash("sha256").update(await readFile(canonicalPath)).digest("hex");
  fail(actualHash === record.canonicalArtifact.sha256, "canonical artifact provenance");
  '
  ```

- [ ] **Step 7: Run final verification and audits**

  Run:

  ```bash
  pnpm install --frozen-lockfile
  pnpm lint
  pnpm typecheck
  pnpm test
  pnpm build
  pnpm research:carrier:inspect -- research/artifacts/docx-hidden-run-v1/glyph-docx-hidden-run-v1-spike.docx
  shasum -a 256 research/artifacts/docx-hidden-run-v1/glyph-docx-hidden-run-v1-spike.docx
  pnpm list --depth 0
  git diff --check
  git status --short --ignored
  git ls-files | rg 'research/artifacts/docx-hidden-run-v1/.*\.(docx|txt)$'
  rg -n --hidden '(BEGIN [A-Z ]*PRIVATE KEY|DATABASE_URL=|SUPABASE_[A-Z_]+=|API_KEY=|SECRET_KEY=)' package.json src tests scripts research/experiments .gitignore tsconfig.json
  rg -n -i 'OpenAI|Anthropic|Gemini|ChatGPT|FingerprintEngine|ExactCanary|Supabase|Protect Assignment|Analyze Submission' src tests scripts research/experiments/docx-hidden-run-v1
  ```

  Compare the final `shasum` value to `canonicalArtifact.sha256` in `run-001.json` and fail the review if they differ. Do not regenerate or overwrite the manually tested canonical artifact after observations begin.

  Expected outcome: frozen installation, all four non-server authoritative software checks, existing-artifact inspection, JSON validation, and hash comparison succeed; the finite test suite includes the original foundation test and four carrier tests; direct dependencies are the Milestone 1 set plus only `docx`, `fflate`, and `@xmldom/xmldom`; no DOCX/clipboard artifact is tracked; no credential-shaped content is found; no executable Milestone 3+ behavior exists. Documentation lines that explicitly prohibit later concepts are reviewed as prohibitions, not executable leakage.

- [ ] **Step 8: Review and commit the experiment record**

  Run:

  ```bash
  git add -N research/experiments/docx-hidden-run-v1/run-001.json
  git diff -- research/experiments/docx-hidden-run-v1/run-001.json
  git diff --stat
  git diff --check
  git status --short
  ```

  Expected outcome: `protocol.md` is unchanged from its pre-observation commit; the only new durable result is `run-001.json`; ignored local artifacts remain untracked; the decision is justified only by recorded workflow observations.

  If Task 4 is operationally `BLOCKED`, do not create or commit `run-001.json`, do not run its validator, and do not make this final experiment-result commit. Any partial local artifacts or notes remain uncommitted and are reported to the user.

  Commit:

  ```bash
  git add research/experiments/docx-hidden-run-v1/run-001.json
  git commit -m "research: record DOCX carrier survival run 001"
  ```

  Verify a clean tree and stop. Do not begin Milestone 3 regardless of the decision.

---

## Plan Self-Review

Before execution approval, verify all of the following against this plan and the authoritative specification:

1. Only Experiment A is implemented and executed.
2. Both fixed marker strings are exact and occupy two intended hidden runs.
3. `w:vanish` is the sole carrier mechanism.
4. Visible and hidden content have separate structural assertions.
5. Automated package checks are separate from manual workflow observations.
6. Workflows and the decision rule are committed before observations.
7. No model product, model API, model-compliance test, Supabase, database, authentication, RLS, Protect, Analyze, upload, or product UI is added.
8. No fingerprint generation, ExactCanary, context analysis, semantic marker selection, or semantic matching is added.
9. `docx`, `fflate`, and `@xmldom/xmldom` are the only proposed direct packages and each has one required role; no TypeScript runner is added.
10. Generated `.docx` and clipboard `.txt` files are ignored only in the exact artifact directory; protocol and JSON records remain visible to Git.
11. Macro, active-content, executable-relationship, content-type, and external-relationship checks are explicit.
12. All fixture content is synthetic and contains no school or student data.
13. Carrier profile and fingerprint fields remain separate; fingerprint fields are explicitly not applicable.
14. Future semantic/multi-signal work is accommodated only by the carrier's text-run input, with no future strategy code.
15. Every path, command, interface, test count, artifact name, experiment ID, fixture ID, and record field is internally consistent.
16. Each task leaves a coherent, reviewable state with one meaningful commit boundary.
17. The final outcome is a carrier decision with a narrowed supported-workflow statement, never a product-success or authorship claim.

## Milestone 2 Stop Boundary

Milestone 2 is complete only after the protocol is frozen, structural software verification passes, at least one material editor round-trip is observed, every completed workflow and limitation is recorded, and the frozen rule yields `PROCEED`, `REVISE CARRIER`, or `ABANDON CURRENT CARRIER`. Stop at that decision. A positive result authorizes only a request for Milestone 3 approval; it does not authorize fingerprint implementation, persistence, product workflows, model testing, or deployment.
