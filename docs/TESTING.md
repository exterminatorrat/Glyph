# Glyph testing and verification strategy

Status: current verification policy adopted 2026-10-17; Roadmap Step 1 core codec is implemented in this change.

## Current commands and isolation

`package.json` is authoritative. `pnpm test` runs `vitest run` across the existing application and `packages/core`. `pnpm typecheck` runs Next.js type generation, checks the root TypeScript project, then checks core with its separate strict TypeScript configuration and no DOM library. `pnpm lint` runs `eslint .`.

The full existing suite has previously overwritten ignored canonical DOCX research artifacts. Do not run it in an evidence-bearing checkout. Run `pnpm test` and `pnpm typecheck` only in a disposable isolated checkout/environment after inspecting the test output paths and confirming that no fixed, absolute, symlinked, or shared output can reach retained evidence. Keep generated files and dependencies out of the working repository. Do not modify package scripts or dependencies as part of documentation adoption.

The documentation-only adoption was checked for rendered Markdown structure, local links, required wording and its final carrier-observation line. For Step 1, run the focused core tests first, then `pnpm test` and `pnpm typecheck` in an isolated checkout after confirming test outputs cannot reach retained evidence. Always run `git diff --check`.

## Step 1 core verification

Every exported function in `packages/core` has Vitest coverage and shared JSON vectors. Step 1 tests verify the exact printable-ASCII mapping, empty frames, rejection of non-ASCII/control/DEL input, ordered and adjacent frame decoding, malformed-frame preservation and resynchronization, black-flag subdivision emoji preservation, and exact removal while retaining surrounding Unicode and line endings. Fixtures are synthetic and escape invisible tag characters so the vectors can be inspected. These checks do not prove provider survival or accessibility.

`pnpm test` and `pnpm typecheck` cover the existing root application and core package. A passing software suite proves implementation behavior only; it does not prove carrier survival, model compliance, prompt reuse, authorship, or misconduct. Manual and research evidence must be reported separately.

The earlier Milestone 0 verification text below is retained as a historical record. The M2E DOCX command, test, and research records are preserved on [draft PR #1](https://github.com/exterminatorrat/Glyph/pull/1), not merged to `main` as of 2026-10-17. Their scope does not apply to or qualify the new carriers.

<details>
<summary>Archived Milestone 0 testing strategy (superseded)</summary>

Status: approved Milestone 0 strategy, 2026-08-30

## Purpose

Testing is a core product capability because Glyph's value depends on deterministic software behavior, privacy guarantees, and experiments that can reveal failure.

Automated tests verify software behavior. Research experiments evaluate carrier survival and model behavior. A green software suite is not evidence that the fingerprint hypothesis works.

## Verification authority

When executable tooling exists:

- authoritative commands live in `package.json` scripts
- this document explains what each command proves
- `AGENTS.md` points future contributors here
- CI invokes the same scripts rather than maintaining a second command set

Milestone 0 contains no executable project tooling, so no package commands are specified or implied. Dependency versions and commands are recorded only in the milestone that installs them.

## Milestone 1 command contract

`package.json` is the authoritative executable source for these commands.

| Command | What success proves |
| --- | --- |
| `pnpm dev` | The application starts on `127.0.0.1` for local development. A manual root-page response confirms only a local smoke check. |
| `pnpm lint` | ESLint accepts the current project files under the Next.js core-web-vitals and TypeScript rules. |
| `pnpm typecheck` | Next.js route types generate and strict TypeScript checking completes with no type errors or emitted JavaScript. |
| `pnpm test` | The finite Vitest suite passes in its configured Node environment. |
| `pnpm build` | Next.js can produce an optimized application build from the current source and configuration. |

These commands verify software behavior and integration. They do not validate carrier survival, model compliance, end-to-end survival, or any research or teacher-facing interpretation.

## Milestone 2 carrier commands

| Command | What success proves |
| --- | --- |
| `pnpm research:carrier:generate` | The canonical synthetic DOCX can be regenerated locally and its path and SHA-256 are reported. |
| `pnpm research:carrier:inspect -- <path>` | One local DOCX can be opened as OOXML and summarized for fixed-marker, visible-content, active-content, macro, and external-relationship structure. |

These commands and tests prove package structure only. They do not prove editor behavior, clipboard survival, accessibility behavior, model compliance, end-to-end survival, prompt reuse, AI authorship, direct ingestion, intent, cheating, or misconduct.

## Development discipline

Behavioral implementation begins with a failing test that demonstrates the requirement, followed by the minimum implementation that passes it. Tests should exercise module interfaces and observable outcomes rather than internal arrangement.

Focused verification is required during development. Before a milestone is declared complete, run the entire verification set that the milestone defines and review the full diff for unrelated files, secrets, generated artifacts, and scope expansion.

No-match test filters are not passing evidence; the expected tests must be shown to have run.

## Milestone 0 documentation checks

The documentation set must be reviewed for:

- unresolved stub or incomplete language
- internal contradictions
- accidental implementation authorization
- missing privacy boundaries
- collapsed carrier and fingerprint versions
- claims of AI authorship, direct AI ingestion, intent, cheating, or misconduct
- actual student content in examples
- speculative abstractions or dependency versions

The initial specification commit contains documentation only.

## Carrier-spike verification

Milestone 2 verifies `docx-hidden-run-v1` independently of the fingerprint engine and model compliance.

Automated document checks must establish:

- the artifact is a valid DOCX/OOXML package
- the visible research content is preserved
- both fixed research markers appear in the intended WordprocessingML runs
- those runs carry `w:vanish`
- the fixed markers do not appear in ordinary visible runs
- the document contains no macros, executable content, or unexpected external relationships
- the package can be opened and parsed by the selected verification tools

Manual checks follow the Experiment A protocol in `EXPERIMENTS.md`. Automated XML assertions do not prove behavior in Word, Google Docs, conversion tools, clipboard flows, accessibility tools, or model ingestion.

The fixed markers are:

- `GLYPH TEST MARKER ALPHA`
- `GLYPH TEST MARKER BETA`

Tests must make clear that these are research-only spike fixtures, not generated assignment markers.

## Fingerprint-engine unit tests

After the carrier gate passes, test through the `FingerprintEngine` interface.

Generation coverage includes:

- different assignment generations produce different fingerprints
- required signal count is present
- markers are distinct and follow the frozen generated-marker profile
- markers do not already occur in the visible prompt
- schema, strategy, strategy version, and matching profile are present
- carrier profile is not conflated with fingerprint versions
- serialization and deserialization preserve semantic identity
- malformed, mismatched, and unsupported versions are rejected

Analysis coverage includes:

- no marker
- first marker only
- second marker only
- all markers
- surrounding punctuation
- approved case and Unicode normalization behavior
- whitespace variations allowed by the matching profile
- unrelated normal response
- cross-assignment marker
- empty and whitespace-only input
- input at the documented supported bound
- input above the documented bound
- malformed fingerprint data

Classification coverage includes zero, partial, complete, and malformed-input behavior. Malformed fingerprint data must produce an integrity error, never `NO_SIGNAL`.

## Assignment and persistence tests

Once persistence exists, verify:

- assignment creation with and without a title
- immutable retrieval
- safe summary listing
- invalid and missing assignment IDs
- database failure mapping
- JSON fingerprint round trip
- document and fingerprint version fields remain separate
- prompt, prompt hash, DOCX bytes, response, filename, and student identity are absent from the schema and write calls
- anonymous browser roles cannot read or write assignments in the local prototype

Before a pilot, database tests must prove ownership allow and deny behavior for each supported operation using at least two teacher identities.

## Protect integration tests

Verify the observable Protect workflow:

- invalid prompts are rejected before domain work
- document generation failure creates no persisted assignment
- persistence failure returns no protected document
- successful protection creates one immutable assignment
- returned bytes form a valid protected DOCX
- no raw marker is returned in JSON, headers, logs, or error details
- the prompt and generated document are not persisted

Tests should assert document structure, not byte-for-byte snapshots that can fail on harmless package metadata.

## Analyze integration tests

Verify:

- invalid assignment IDs are rejected safely
- missing assignments return a safe not-found error
- empty and oversized responses are rejected
- the production fingerprint engine is called
- no, weak, and strong signal results use conceptual signal IDs
- marker values and directives are absent from public results
- response text is not written to persistence
- response text is not included in logs, traces, caches, or errors
- successful and failed responses use no-store caching behavior

## Privacy tests

Privacy tests are explicit, not inferred from code review.

- Inject a recording assignment-store adapter and assert that prompts and responses never reach it.
- Inject a recording logger and assert that content and marker values never reach it.
- Serialize every public contract and scan for fingerprint payload fields and marker strings.
- Enforce that server-only modules cannot be imported from browser modules.
- Inspect error responses for content echoes, stack traces, database details, and secrets.
- Confirm fixtures and examples contain no actual student work.

If later framework or hosting telemetry cannot be injected, verify its configuration and document the evidence separately.

## Research metric tests

The evaluation harness must be tested with small fixtures whose confusion matrices are calculated by hand.

Verify:

- any-signal and all-signals thresholds are calculated separately
- true positive, false positive, true negative, and false negative counts are correct
- recall, false-positive rate, and precision use the correct denominators
- a zero denominator produces an unavailable metric, not zero
- groups by source and workflow preserve raw counts
- per-sample output uses the production analyzer result
- machine-readable output is deterministic for an immutable fixture set
- carrier, fingerprint, matching, and experiment versions appear in results

Metrics validate arithmetic, not the scientific adequacy of the sample set.

## Manual verification boundaries

Manual evidence must name exactly what was observed. Examples:

- “The DOCX opened in this Word version with hidden-text display disabled.”
- “This clipboard representation contained both fixed markers.”
- “This model response contained Signal A under this recorded protocol.”

Do not generalize a single observation into cross-platform compatibility, model reliability, prompt-reuse evidence, AI authorship, or pilot readiness.

## Completion evidence

Each milestone report records:

- exact commands and tests run
- expected test counts or named suites
- manual protocol and environment where applicable
- pass, fail, and skipped outcomes
- known limitations
- the gate decision when the milestone contains a gate

A carrier decision and baseline decision must be explicit even when all software tests pass.

</details>
