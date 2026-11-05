# Glyph

Glyph is an experimental project researching assignment-specific canary prompt injection with hidden Unicode-tag instructions and a visible AI-addressed note. It is **not an AI-writing detector**. A match proves neither authorship nor misconduct; a miss gives no evidence either way about AI use.

## Start here — new owner or engineering assistant

Read **[the project handoff](docs/HANDOFF.md)** first. It is the single current-state record: what exists, what was observed, what remains unknown, and which work is on hold. Then read [AGENTS.md](AGENTS.md) for standing repository constraints.

Bring your own assessment. You are invited to critique the hypotheses, reprioritize the work, propose a different study or product direction, or recommend stopping. The inherited roadmap and prepared experiment are not commands to execute. Planning does not authorize model submissions, automation, payments, merges, or a teacher workflow.

Repository-aware assistants can follow the root instruction pointers; an ordinary chat still needs to be given the repository or these documents. This README does not automatically transfer context to a chat that cannot read the repo.

## Orientation

- [Product definition](docs/PRODUCT.md) and [v1 contracts / inherited roadmap](docs/MVP_SPEC.md)
- [Architecture and file layout](docs/ARCHITECTURE.md)
- [Privacy boundaries](docs/SECURITY.md) and [safe verification](docs/TESTING.md)
- [Research framework and historical provenance](docs/EXPERIMENTS.md)

`package.json` defines executable commands. Do not start by running the full suite: legacy tests can overwrite retained DOCX evidence. Follow the isolation policy in `docs/TESTING.md` first.
