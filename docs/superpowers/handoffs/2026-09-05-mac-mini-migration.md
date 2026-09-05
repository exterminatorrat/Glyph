# Glyph Mac Mini migration checkpoint

This checkpoint supersedes the execution snapshot and next-action prompt in
`2026-09-03-glyph-continuation.md`. Read this file, AGENTS.md, and the current
Milestone 2E progress ledger before executing anything. The older handoff
remains useful for product history, not current task status.

## Frozen state and ownership

- Branch: `codex/milestone-2e-join-control-qualification`.
- Implementation provenance: `d00a2d3526d15f94968ccdb15af10c612d9732ae`.
- Latest prior committed evidence: `9b43dc8`; the migration commit includes
  the subsequent desktop-isolation and clipboard recovery checkpoint.
- Tasks 1–7 complete. Task 8 incomplete, operationally `BLOCKED`.
- Tasks 9–11 remain outstanding; no complete run record or scientific gate.
- One serial mutator. MacBook native input is paused; do not operate its
  Desktops 1 or 2. Establish the Mini as the actual tool host before UI work.
- Use astra-efficient-coding as the principal implementation workflow,
  alongside applicable repository skills. No application-code change is
  needed for this migration or the current Task 8 evidence collection.

The tracked progress ledger is
`.superpowers/sdd/2026-09-04-milestone-2e-join-control-accessibility-qualification/progress.md`.
Its latest continuation supersedes earlier next actions. The approved plan is
`docs/superpowers/plans/2026-09-04-milestone-2e-join-control-accessibility-qualification.md`;
Task 8 and the frozen experiment protocol define all required observations.

## Preserved evidence

The transfer package includes ignored `research/artifacts` separately from Git.
Never regenerate canonicals, replace accepted outputs, or repair adverse
findings. Hashes of the four M2E canonicals:

| Case | SHA-256 |
| --- | --- |
| latin-operations-v1 | ead38b8f846102e593dece481a0f5a47e4368362fcc5b94446731fa3834863c5 |
| arabic-persian-joining-v1 | f797b16180eed18eb78191973d02edbef8a48abe167b7626eefc6912957f68ac |
| devanagari-emoji-graphemes-v1 | 4f8140a6ee2a4ac4b81af77a6d0faad2e01674a504f4daff4e21bb65887f2dc7 |
| mixed-bidi-v1 | bb6309f9ef31fb6573386aa5bad922a9a3a7437ae3a5eda858741519042273a8 |

Accepted Word Latin round-trip is 14075 bytes, SHA-256
`3b71ff311f1ce36d492e80d24a0c2fcb039480c361f529049ed4c64ca224c931`.
Its frozen structural inspection passed; exact safe output is in the ledger.
Word Latin character/word navigation mismatch is genuine measured evidence,
not a tooling error. Preserve it even if later observations differ.

The Latin clipboard TXT is zero bytes and is NOT evidence. Its first aborted
attempt is retained under `task8-save-diagnostics`. A fresh empty destination
was reserved, but the restart has not copied or pasted. No Google Docs import,
mutation checkpoint, specialized view, or Task 8 print workflow has begun.
Do not transfer native window state or assume a clipboard remains valid.
Task 7 supplemental font-config previews are retained as diagnostics, not
primary-editor evidence. Word lock files and Finder metadata are excluded.

## Destination preflight and resumption

1. Verify the package manifest and restore to a NEW checkout; never overlay
   an existing Mini checkout or its artifacts. Restore instructions are in
   the package README. Confirm branch and commit against SOURCE.json.
2. Verify all four canonical hashes and accepted round-trip before opening
   Word. Run source-mode structural inspection using the existing package
   command and frozen arguments documented in the plan. Do not run generation.
3. Confirm runtime versions: Node 26.3.0, pnpm 11.19.0, uv 0.12.9,
   Python 3.14.7 / Unicode 16.0.0, pypdf 6.10.0, pdftoppm 26.05.0.
   Use `pnpm install --frozen-lockfile`, then the repository's lint, typecheck,
   test, and build commands for host qualification. Do not alter the lockfile
   or relax version checks to accommodate the Mini.
4. Source editor observations used macOS 26.2 (25C56), Word 16.112.3
   (16.112.26083020), Chrome 152.0.7977.77. Inspect actual destination versions,
   fonts, rendering dependencies and computer-use availability. Reconcile
   environment provenance with the frozen schema before combining evidence;
   do not silently describe measurements from different hosts as one setup.
   Keep all MacBook evidence even if new host observations require a separate
   trial or protocol decision.
5. Reconnect/install the applicable Codex skills and computer-use integration
   on the Mini. The package contains the requested astra-efficient-coding
   SKILL.md as a reference; do not overwrite an existing installation blindly.
   Applications, credentials, browser profiles and permissions are not copied.
6. Establish reliable foreground Word/Chrome control on the Mini. Start from
   unchanged canonical bytes and follow Task 8 exactly. Resolve the aborted
   clipboard trial explicitly; do not reuse stale clipboard data or accept
   empty output. Confirm nonempty stable files plus structural inspections
   after exports; the MacBook once reported Saved before bytes reached disk.
7. Complete every case/editor observation and checkpoint, then Task 9 requires
   Windows 11 with NVDA 2026.2, Google Docs/Chrome and Word Microsoft 365.
   A Mac Mini by itself does not satisfy that Windows/NVDA requirement.
8. No run-001.json while evidence is incomplete or unreliable. Task 10 is the
   final mechanical gate; Task 11 final review/verification and synchronization.
   No Milestone 3 or product workflow without a positive completed M2E gate.

## Resume prompt for Codex on the Mini

Continue Glyph Milestone 2E from the restored migration package. First read
AGENTS.md, this handoff and the latest progress-ledger continuation. Verify
SOURCE.json, package checksums, branch, canonical hashes, actual host and
frozen tool versions before mutation or UI input. Use astra-efficient-coding
as the principal workflow. MacBook UI work is paused; act only on the Mini.
Resume Task 8 under the approved plan after host/provenance preflight. Preserve
all historical evidence, including navigation-mismatch and aborted clipboard
state; never regenerate canonical files or infer missing observations. Work
autonomously within the approved scope and record reliable checkpoints.
