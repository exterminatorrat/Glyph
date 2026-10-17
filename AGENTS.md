# Glyph repository guide

Glyph is an experimental research project for assignment-specific canary prompt injection: teachers place two distinct canaries in an assignment and test whether a chatbot includes them in its response. Glyph is not a general AI-writing detector and cannot establish authorship, direct ingestion, intent, cheating, or misconduct.

## Authoritative documentation

- Product purpose and evidence language: `docs/PRODUCT.md`
- Adopted requirements and ordered roadmap: `docs/MVP_SPEC.md`
- Planned architecture and current repository state: `docs/ARCHITECTURE.md`
- Privacy and research-data boundaries: `docs/SECURITY.md`
- Verification policy: `docs/TESTING.md`
- Research plan and historical provenance: `docs/EXPERIMENTS.md`
- User-reported carrier-survival observations: `docs/carrier-survival.md`

## Non-negotiable constraints

- Keep observed canary matches, technical interpretation, research interpretation, and any later product claim distinct. A match warrants contextual conversation and corroboration; it is not proof. A miss is evidence neither for nor against AI use. Never produce an AI score or probability.
- The proposed ordering (hidden-only strongest, visible-only moderate, both strongest) is an unvalidated hypothesis, not a finding. Do not assume hidden instructions remain secret or that the layers are independent.
- Assignment prompts and student responses must stay in the browser and must never be uploaded, logged, or persisted. Do not put real student work in Git, fixtures, logs, or documentation. Research model APIs may be used only by the local lab on synthetic or explicitly consented research inputs, with credentials supplied through environment variables; this is not a teacher-submission backend.
- Never commit keys, secrets, raw assignments, or raw responses. Canary values are inspectable test material, not cryptographic proof or tamper-resistant watermarks.
- Keep carriers behind a small swappable interface; do not build a plugin framework. Do not invent unresolved HMAC, reversible-string, template-metadata, malformed-tag, or normalization contracts ahead of their roadmap steps.
- Keep prior research records and outcomes unchanged. Prior DOCX-carrier evidence does not qualify the new tag or visible-note carriers.

## Milestones and gates

The two-layer canary briefing was adopted as a documentation-only direction on 2026-10-17. Roadmap Step 1 has not started, and no implementation is authorized by this adoption. Wait for separate authorization before beginning it.

Milestones 0–2E remain historical evidence only for their named DOCX profiles. The M2E design, protocol, ledger, fixtures, and results are preserved on [draft PR #1](https://github.com/exterminatorrat/Glyph/pull/1), which is not merged to `main` as of 2026-10-17. Do not relabel or generalize those outcomes or use them to qualify the new carriers. The recorded M2E accessibility status remains unchanged; that former gate is no longer active.

## Verification commands

`package.json` is authoritative for executable commands. The current root `pnpm test` and `pnpm typecheck` scripts cover the existing application, not the planned workspace. The full test suite can overwrite ignored canonical DOCX evidence; run it only in a disposable isolated checkout after verifying every output path is isolated. See `docs/TESTING.md`.

## Repository synchronization

- `https://github.com/exterminatorrat/Glyph` is Glyph's canonical GitHub repository.
- After a verified large implementation chunk, milestone, or other approved durable deliverable, commit the in-scope changes and synchronize them to the canonical repository. Preserve coherent commit boundaries and any branch or review requirements active for that task.
- Never force-push, rewrite published history, or commit secrets, student data, generated research binaries, or unrelated working-tree changes.
