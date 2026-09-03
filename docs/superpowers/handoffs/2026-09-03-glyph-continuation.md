# Glyph Continuation and Milestone 2E Handoff

Last updated: 2026-09-03

This is the durable starting point for a fresh Codex task or model. Do not
rebrand Glyph, restructure the repository, redesign completed experiments, or
re-plan settled work. Read the linked authoritative files, verify the recorded
Git state, and continue from the exact next action.

## What Glyph is

Glyph is an experimental academic-integrity research product for teachers. It
places assignment-specific markers into a generated DOCX and later measures
whether those markers are present in a submitted response. The research asks
whether marker presence becomes more common after a protected assignment is
provided to a generative AI system than in controls.

Glyph is not an AI-writing detector. A marker does not prove AI ingestion,
authorship, prompt reuse, intent, cheating, or misconduct. Markers may move
through indirect sharing, contamination, deliberate insertion, or other paths.
Raw measurement, technical interpretation, research interpretation, and any
future product claim must remain separate.

The internal prototype is local-only, unauthenticated, not publicly deployed,
and unsuitable for real student work. It must not persist or log assignment
prompts, student responses, or uploaded documents.

## Settled product shape

The eventual internal prototype has two small teacher workflows:

1. Protect Assignment: accept a plain-text assignment, create an immutable
   assignment identity and versioned fingerprint, generate a protected DOCX,
   persist only approved metadata/fingerprint material, and return the DOCX.
2. Analyze Submission: accept a selected assignment and pasted response,
   analyze the response transiently for exact marker presence, report only
   conceptual signal IDs and `NO_SIGNAL`, `WEAK_SIGNAL`, or `STRONG_SIGNAL`,
   and discard the response without persistence.

Document profile, marker/matching profile, fingerprint strategy/version, and
fingerprint schema are independent version axes. Only one exact-canary strategy
is planned initially; use explicit dispatch, not a plugin framework.

Do not add student accounts, organizations, billing, analytics dashboards,
gradebooks, plagiarism detection, LMS integration, external model APIs,
automatic discipline, surveillance, browser extensions, native apps, PDF
generation, batch processing, public deployment, or marketing.

## Authoritative reading order

Read in full before making changes:

- `AGENTS.md`
- `docs/PRODUCT.md`
- `docs/MVP_SPEC.md`
- `docs/ARCHITECTURE.md`
- `docs/SECURITY.md`
- `docs/TESTING.md`
- `docs/EXPERIMENTS.md`
- `docs/superpowers/specs/2026-09-03-milestone-2e-join-control-accessibility-qualification-design.md`
- the Milestone 2E implementation plan and frozen protocol once committed
- the Milestone 2E progress ledger once created
- `research/experiments/docx-zero-width-carrier-bakeoff-v1/protocol.md`
- `research/experiments/docx-zero-width-carrier-bakeoff-v1/run-001.json`

## Completed carrier history

- Milestone 2 abandoned `docx-hidden-run-v1`.
- Milestone 2B recorded `REVISE_CANDIDATE` after the alternative carrier
  bake-off.
- Milestone 2C recorded `REVISE_CARRIER` for semantic white.
- Milestone 2D selected Candidate A for transport:
  `join-control-binary-v1` / `docx-zero-width-join-control-v1`.

Milestone 2D proved that its two checksum-valid framed markers and exact visible
body survived independent Google Docs and Microsoft Word DOCX round trips and
ordinary clipboard paths. Candidate A remained absent in required ordinary,
Word dark-page, and selection observations without layout disturbance.
Candidates B and C visibly failed in Word. Candidate C was permanently
non-selectable.

Milestone 2D did not prove accessibility, international-text safety,
production readiness, AI behavior, or any misconduct-related claim.

The immutable Milestone 2D result is:

- branch: `codex/milestone-2d-zero-width-carrier-bakeoff`
- final commit: `caea053ef133d33b44a45b7d9907519b5d1688a2`
- gate: `SELECT_A`
- selected document profile: `docx-zero-width-join-control-v1`
- canonical Candidate A SHA-256:
  `adddd743b74f071241cdf76c2c24de291a67492c80d73d3a5f32e61a9837559b`
- authoritative evidence:
  `research/experiments/docx-zero-width-carrier-bakeoff-v1/run-001.json`

All fifteen Milestone 2D artifacts are ignored local evidence. Their hashes and
editor observations are frozen in the record. Do not regenerate, sanitize,
rename, or reinterpret them.

## Active work: Milestone 2E

The active branch is:

`codex/milestone-2e-join-control-qualification`

Its base is the completed Milestone 2D commit:

`caea053ef133d33b44a45b7d9907519b5d1688a2`

Milestone 2E is a separately versioned accessibility and international-text
qualification of the unchanged selected profile. The approved design is:

`docs/superpowers/specs/2026-09-03-milestone-2e-join-control-accessibility-qualification-design.md`

It freezes these decisions:

- four independent paired synthetic cases: Latin operations, Arabic/Persian
  joining, Devanagari/emoji graphemes, and mixed bidirectional text;
- current Google Docs in Chrome on macOS and Microsoft Word for Mac for primary
  editor evidence;
- NVDA 2026.2 on Windows 11 with Chrome/Google Docs and Word for
  Microsoft 365 as the required screen-reader configuration;
- no VoiceOver in this versioned experiment;
- strict parity for visible text, shaping, bidi order, navigation, selection,
  search, spellcheck, copy/paste, insert, undo/redo, backspace, and deletion;
- specialized non-printing modes are assessed explicitly;
- structural, normalization, segmentation, package-safety, privacy, and
  invisible-text security checks;
- print-preview and PDF-export evidence in both editors, retained only as
  ignored research evidence without adding product PDF generation; and
- `BLOCKED` rather than a guessed result whenever mandatory NVDA or editor
  evidence is unavailable or unreliable.

A complete run ends in `QUALIFY_PROFILE` or `REJECT_PROFILE`. Missing or
unreliable mandatory evidence is operationally `BLOCKED`. Only
`QUALIFY_PROFILE` advances the tested document profile.
Even that result is limited to the tested configurations and is not general
production or pilot readiness.

## Live Git and verification snapshot

Snapshot time: 2026-09-03 after the approved-design commit and before the
migration-prompt checkpoint.

- working directory: `/Users/harryjin/Glyph`
- branch: `codex/milestone-2e-join-control-qualification`
- base: `caea053ef133d33b44a45b7d9907519b5d1688a2`
- latest committed HEAD before this handoff update:
  `462cd7f` (`docs: design join-control accessibility qualification`)
- upstream: not configured yet
- divergence: not applicable until the branch is pushed
- pending tracked state at this snapshot: only this handoff prompt update
- canonical Milestone 2E artifacts: none generated
- Milestone 2E implementation plan and executable verification: not started
- documentation checks: placeholder scan and `git diff --check` pass
- independent design review: initial science and scope reviews found mechanical
  gate, per-operation evidence, NVDA reproducibility, print/PDF, PDF privacy,
  and handoff-snapshot gaps; each finding was corrected, and final science and
  scope re-reviews report `SHIP` and `PASS`
- completed Milestone 2D branch remains synchronized and unchanged

Refresh this section immediately before any task/model migration. A later
checkpoint supersedes this dated snapshot rather than rewriting Git history.

## User decisions and execution preferences

- Use the strongest reliable recommended design unless a new material product
  choice is genuinely required.
- Google Docs and Microsoft Word are required editors.
- Apply a strict accessibility-safe standard inside the declared tested
  boundary.
- Do not use VoiceOver in this qualification. NVDA on Windows is the required
  real screen reader.
- Continue without repeated manual approval prompts for settled steps.
- Use one serial mutating implementer for overlapping files and parallel
  read-only reviewers where useful.
- Preserve old experiments, canonical artifacts, unrelated work, and Git
  history.
- Use red-first tests and minimum surgical implementations.
- Commit verified durable checkpoints and push the approved branch to origin.
- Do not merge or open a pull request without explicit authorization.
- Do not begin Milestone 3 or any product workflow until Milestone 2E has a
  positive completed gate.

## Planned future milestones

If and only if Milestone 2E records `QUALIFY_PROFILE`, continue in the frozen
MVP order:

1. Milestone 3: exact-canary `FingerprintEngine` and generated-marker/matching
   profile freeze.
2. Milestone 4: minimal immutable assignment persistence.
3. Milestone 5: Protect Assignment vertical slice.
4. Milestone 6: evaluation harness importing the production analyzer.
5. Milestone 7: controlled baseline experiment and explicit go/no-go decision.
6. Milestone 8: Analyze Submission vertical slice, only after a positive
   baseline decision.

Later adversarial evaluation, conditional DOCX response upload,
authentication/teacher ownership, deployment hardening, pilot usability, and a
controlled teacher pilot remain separately authorized future work. Pilot
readiness additionally requires tested authorization and row-level security,
abuse controls, privacy/retention/deletion review, accessibility review,
incident procedures, and legal/school privacy review.

Do not skip gates or start future work merely because its architecture is
already documented.

## Migration procedure

When the user explicitly asks to move this work to a new task/model:

1. Update this handoff and the Milestone 2E progress ledger with current branch,
   HEAD/upstream, status, artifact hashes, verification, reviews, remaining
   work, blockers, and exact next command.
2. Commit and push the durable checkpoint when it is coherent and verified.
3. Create the new task only after confirming the requested model is available.
4. Put this file's full reading order and the exact next action in the new task
   prompt; do not rely on chat memory.
5. Wait for the new task to confirm repository state before it mutates files.
6. Keep the old task available until the new task confirms a safe takeover.

## Copy-paste migration prompt

```text
Resume the Glyph project from its durable Milestone 2E checkpoint.

Repository: /Users/harryjin/Glyph
Expected branch: codex/milestone-2e-join-control-qualification

First read AGENTS.md and this complete handoff file:
docs/superpowers/handoffs/2026-09-03-glyph-continuation.md

Then read every file listed in the handoff's "Authoritative reading order,"
including the approved Milestone 2E design, every Milestone 2E plan/protocol/
progress file that exists, and the immutable Milestone 2D run record. Treat the
latest committed handoff/progress snapshot as authoritative if a value below
has advanced.

Glyph is a local research prototype that embeds assignment-specific markers in
a teacher's generated DOCX and later measures exact marker presence in a
response. It is not an AI-writing detector and does not prove AI ingestion,
authorship, prompt reuse, intent, cheating, or misconduct. Do not rebrand or
restructure it.

Completed carrier research selected Candidate A, join-control-binary-v1, with
document profile docx-zero-width-join-control-v1 for transport through Google
Docs and Microsoft Word. That is transport evidence only. The active work is
Milestone 2E: strict accessibility and international-text qualification of the
unchanged selected profile across the four frozen synthetic cases, Google Docs,
Word, print/PDF evidence, and NVDA 2026.2 on Windows. Missing reliable required
evidence is BLOCKED; a completed run mechanically yields QUALIFY_PROFILE or
REJECT_PROFILE.

Continue from the handoff's exact next action without re-planning settled work.
Use one serial mutating implementer, red-first tests, minimal surgical changes,
and parallel read-only reviews at the planned gates. Preserve all old
experiments and ignored canonical artifacts. Stop on any frozen hash mismatch.
Do not begin Milestone 3, model testing, FingerprintEngine, ExactCanary,
Supabase, Protect, Analyze, authentication, UI, or deployment unless Milestone
2E first completes with QUALIFY_PROFILE and the user separately authorizes the
next milestone.

Before editing, verify cwd, branch, HEAD/upstream/divergence, status, recent
history, tool versions, artifact inventory, and every recorded hash. Report any
discrepancy instead of guessing. Continue committing and pushing coherent
verified checkpoints, but do not merge or open a pull request without explicit
authorization.
```

## Exact next action at this checkpoint

Use the Superpowers `writing-plans` workflow to create the Milestone 2E
implementation plan from the approved design. The design and handoff reviews
already pass; do not redesign or repeat brainstorming. After plan self-review,
execute it with one serial mutation owner and parallel read-only review gates.
Do not generate a canonical Milestone 2E artifact until the protocol, fixture,
schema, gate, tooling, tests, and pre-generation reviews are frozen and green.
