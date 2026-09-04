# Milestone 2E progress

- Branch: `codex/milestone-2e-join-control-qualification`
- Completed transport base: `caea053ef133d33b44a45b7d9907519b5d1688a2`
- Approved design commit: `462cd7f`
- Durable migration handoff commit: `4c86a46`
- Reviewed implementation plan commit: `ca33872ae8aa2a812a26014f4829414fe2c1e706`
- Mutation owner: one serial implementer
- Reviewers: parallel read-only protocol/science and code/privacy lanes
- Qualification profile: `docx-zero-width-join-control-qualification-v1`
- Candidate/document profile: `join-control-binary-v1` / `docx-zero-width-join-control-v1`
- Canonical artifacts: not generated
- Editor workflows: not started
- NVDA workflows: not started
- Run record: absent
- Gate: pending; incomplete or unreliable evidence is operationally `BLOCKED`

## Workspace ruling

The user-designated repository and active branch are used in place. No linked
worktree is created because this checkout is the explicitly selected branch and
the user requested continuous execution without more approval prompts.

`.superpowers/sdd/` ignores new ledgers by default. This exact progress file is
intentionally force-added at the Task 1 checkpoint, matching the durable
tracked-ledger pattern used by the completed Milestone 2D work.

## Baseline state

- Task 1 starting HEAD: `ca33872ae8aa2a812a26014f4829414fe2c1e706`
- Upstream: none configured
- Node: `v26.3.0`
- pnpm: `11.19.0`
- macOS: `26.2` (`25C56`)
- uv: `0.12.9`
- pypdf: `6.10.0`
- pdftoppm: `26.05.0`
- `package.json` SHA-256: `2eb2065479bd5bc86943327e8ed1d5fe0bfa43ac32a46d9420be11c98133dd53`
- `pnpm-lock.yaml` SHA-256: `83f234738c6a6f31f7a5429eedd0a479b4d739d2222fb291e7e1fbf9213ab0e3`
- baseline install: `pnpm install --frozen-lockfile` passed
- baseline suite: 14 files, 260 tests passed

Completed experiment tree fingerprints use
`git ls-tree -r HEAD <path> | shasum -a 256`:

- `research/experiments/docx-hidden-run-v1`: `4e3ebe33c44955cb0bd7db6c50714cb4c73dbf71f53cc447cd76714ee58a432c`
- `research/experiments/docx-alternative-carrier-bakeoff-v1`: `070ea5c2a616ddf98377dc3a9e3a7302250f7b70ea4c6ff15c1b13ab9c40933d`
- `research/experiments/docx-semantic-white-carrier-qualification-v1`: `a05dc11f8b0503004d39ce28544ae608fa34ca213a0670a75b049c521753338d`
- `research/experiments/docx-zero-width-carrier-bakeoff-v1`: `7992fd9811119a73937b5ad524889f1096296e6688462cf4afb82a5381cc9826`

## Task ledger

- Implementation plan: complete and independently reviewed (`ca33872`).
- Task 1 documentation-only protocol freeze: complete.
- Task 1 science/protocol review: PASS.
- Task 1 implementation/schema review: PASS.
- Task 2 fixture/generator/DOCX/TXT inspectors and artifact I/O: complete.
- Task 2 independent code/privacy review: PASS (`ship`).
- Task 2 focused suite: 58 tests passed.
- 2026-09-04 primary-agent spec/plan self-review: `QUALIFIED_FOR_IMPLEMENTATION`.
  The verdict confirms that the approved design, frozen protocol, and reviewed
  implementation plan are complete enough to execute without changing the
  carrier or making an early scientific qualification claim.
- Task 3 privacy-safe PDF inspector and create-only renderer: complete.
- Task 3 primary-agent code/privacy self-review: PASS.
- Task 3 focused suite: 14 tests passed.
- Task 3 checkpoint verification: frozen-lockfile install, lint, typecheck,
  16-file/332-test full suite, and production build passed; completed
  experiment fingerprints remained unchanged; no M2E canonical artifact was
  generated.
- Task 4 safe generation, DOCX/TXT/PDF inspection, and PDF-render command
  surface: complete; 9 focused command-safety tests passed.
- Task 4 remains open only for the sixth `validate` package entrypoint, which
  lands with its real Task 5 validator rather than pointing at an absent or
  placeholder implementation.
- Task 4 checkpoint verification: frozen-lockfile install, lint, typecheck,
  17-file/341-test full suite, and production build passed.
- Tasks 5–11: not started.

## Frozen scientific state

- Milestone 2D selected Candidate A with `SELECT_A`.
- Candidate A canonical hash remains
  `adddd743b74f071241cdf76c2c24de291a67492c80d73d3a5f32e61a9837559b`.
- Milestone 2E does not alter Candidate A's bytes, mapping, marker count,
  anchor rule, run formatting, or document profile.
- Four paired-control cases cover Latin operations, Arabic/Persian joining,
  Devanagari/emoji graphemes, and mixed bidirectional text.
- Required primary editors are Google Docs in Chrome and Word for Mac.
- Required screen-reader evidence is NVDA 2026.2 on Windows 11 with Google Docs
  in Chrome and Word for Microsoft 365.
- VoiceOver is not assessed and cannot be inferred.
- Complete evidence yields only `QUALIFY_PROFILE` or `REJECT_PROFILE`.
- No `run-001.json` is created while evidence is incomplete or unreliable.

## Exact next action

Begin Task 5 with red-first recursively closed run-record and mechanical-gate
tests. Add the sixth `validate` package command with the real validator. Do not
create canonical artifacts.
