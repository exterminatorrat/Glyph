# Glyph repository guide

Glyph is an experimental academic-integrity research product. It measures whether assignment-specific markers are present in a response and tests whether marker presence is more common after a protected assignment is provided to a generative AI system than in controls.

Glyph is not an AI-writing detector and does not determine authorship, direct AI ingestion, student intent, cheating, or academic misconduct.

## Authoritative documentation

- Product purpose and language: `docs/PRODUCT.md`
- Frozen MVP requirements and milestones: `docs/MVP_SPEC.md`
- Modules, interfaces, data flow, and persistence: `docs/ARCHITECTURE.md`
- Privacy, security, and pilot gates: `docs/SECURITY.md`
- Verification policy: `docs/TESTING.md`
- Research protocols and metrics: `docs/EXPERIMENTS.md`

## Non-negotiable constraints

- Keep raw measurement, technical interpretation, research interpretation, and any later product claim distinct.
- Never persist or log raw assignment prompts, student responses, or uploaded response documents. Persist marker values only inside the approved server-only fingerprint payload; never log them or expose them through browser-facing data contracts.
- Never place actual student work in Git, fixtures, logs, or documentation examples.
- Keep privileged database credentials and fingerprint material out of browser code and browser-facing data contracts.
- Keep `documentProfile` versioning separate from fingerprint strategy and schema versioning.
- Use minimal explicit dispatch while only one fingerprint strategy exists; do not build a plugin framework.

## Milestones and gates

Work only on the active approved milestone. Milestone 2, the `docx-hidden-run-v1` carrier spike, is a hard research gate and precedes Supabase and product workflows. Milestone 7, the baseline controlled experiment, is a second go/no-go gate before the Analyze vertical slice.

The Milestone 1 project and research foundation is complete. Milestone 2, the `docx-hidden-run-v1` carrier spike, is next and must not begin until its plan is explicitly approved; Supabase and product workflows remain later milestones.

## Verification commands

When executable tooling exists, authoritative commands belong in `package.json` scripts and are explained in `docs/TESTING.md`. Do not invent or document commands before the relevant tooling is installed.

## Repository synchronization

- `https://github.com/exterminatorrat/Glyph` is Glyph's canonical GitHub repository.
- After a verified large implementation chunk, milestone, or other approved durable deliverable, commit the in-scope changes and synchronize them to the canonical repository. Preserve coherent commit boundaries and any branch or review requirements active for that task.
- Never force-push, rewrite published history, or commit secrets, student data, generated research binaries, or unrelated working-tree changes.
