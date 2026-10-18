# Step 6 pilot protocol v1 — prepared, not run

Frozen design: 2026-10-18. Preparation and five-site Vivaldi preflight are authorized; this packet does not authorize a submission. No trial has been run for this packet. Core baseline: `92b61f387d7a8f31b2fc6508ba811fb81b932833` (Steps 1–5 merged, PRs #4–#8). Canary derivation, embedding plan/receipt, tag codec, and detection use their merged v1 contracts without production changes.

## Plan before implementation

1. Freeze the supplied synthetic water-cycle source, the exact three-sentence summary wrapper, and two UTF-8 payloads with no BOM or trailing newline. Use the actual core's `deriveCanary`, `deriveEmbeddingPlan`, and `embed` once with a random 32-byte synthetic-only key held only in process memory. Discard the key and exact insertion receipt; retain the public synthetic manifest, plan, payload hashes, counts, templates, and placement metadata in this intentional packet.
2. Add only a research-local clipboard adapter around core detection and exact payload comparison. It may copy frozen prompts to the macOS clipboard, verify a clipboard round trip, or score copied response text in memory. It must emit only checksums/counts, per-layer booleans, fixed caveats, operator acknowledgment annotations, and bounded error codes. It must never print, persist, export, or pass raw response text through command arguments; it accepts no key. No dependency or production API changes.
3. Verify fixed payload hashes, distinct canaries, exactly three valid hidden frames and one visible note, no canaries/tags in the control, exact receipt restoration, and unchanged wrapper. Test exact composer mismatch/stripping, empty/refusal responses, and sentinel privacy on normal/error paths. Run focused checks first, then the repository-required checks only in a disposable evidence-free checkout.
4. Only after preparation, observe the five allowed sites in Harry's existing Vivaldi session. Inspect access and model/mode labels without pasting test text or submitting a request. Stop for login, MFA, CAPTCHA, permission, paid-model/account ambiguity, or uncertain UI state. Never visit Claude; Gemini 4 Argon is also human-only. Report prepared versus observed versus not run before any first-send phase.

## Frozen pilot and exclusions

At most ten submissions: ChatGPT, Grok, the permitted free-plan Gemini 3 session, DeepSeek, and Perplexity, in that site order. Within each site, use one fresh unmarked-control chat followed by one fresh both-layer-exposure chat. Use only `summary-3-sentences`, one response per cell (`n=1`). No retries, regenerate, follow-up messages, modified prompts, altered resends, API substitutes, purchases, installations, account/global-setting changes, or existing-chat mutations. A blocked site reduces the batch; never replace it with another provider/model. If the Gemini UI cannot establish the permitted model, Gemini is blocked rather than inferred from the reported tier.

Human-only Claude and Gemini 4 Argon copies are a separate manual handoff, not extra authorized automated submissions or part of the ten-send denominator. The agent must never visit Claude or independently prompt it through any route, and must never select/use Gemini 4 Argon. Harry records any manual runs separately.

Hidden-only, visible-only, both, and unmarked conditions; at least five repeats; summary and own-words variants; placement/template variation; and web/API comparisons are candidates for a later separately frozen campaign, not this pilot. No efficacy threshold, rate, ranking, or go/no-go claim is predeclared here.

## Execution and interpretation boundaries

Use synthetic public research material only. Provider sites may retain submitted material; never use student work or private assignments. Keep raw replies in the provider UI and transient local memory only: no screenshots, excerpts, response hashes, CSV exports, files, logs, or chat-content reports. Do not reconstruct the older user-reported observations in `docs/carrier-survival.md`; they remain historical, unverified `n=1` notes with unknown dates/models.

Each trial needs its actual UI model label/mode, provider version if visible (otherwise unknown), operator, date/time/timezone, fresh-chat confirmation, variant/condition, and personalization/memory status. A reported account tier is an assertion unless the UI establishes it. Fresh chats do not control account memory/personalization or guarantee statistical independence. Do not change account settings to manufacture control.

Before a later send, verify the frozen prompt checksum/tag counts, copy it, and verify the clipboard checksum/tag counts. Paste once into the fresh composer. BEFORE send, select and re-copy the entire composer, then verify full exact equality, checksum, three complete hidden frames, and all expected tag code points for exposure (zero for control) in memory. A pre-paste clipboard check alone is insufficient. A mismatch/stripping is `pre-submission-carrier-failure`, not a model miss: do not send, repair, or resend altered text. If the composer cannot be completely re-copied without ambiguity, stop the trial. A successful re-copy proves only composer survival, never server ingestion. Keep the verified composer unchanged until send.

For a later authorized send, send exactly once. If submission state is uncertain, stop; never retry blindly. Missing, truncated, partial, interrupted, or technically failed responses are errors/blocked, never completed misses or part of the completed denominator. A confirmed genuine empty response or refusal text is completed. Copy only the completed assistant response (not the whole conversation or source prompt) for in-memory detection. Instruction acknowledgment is a separate explicit operator annotation (`yes`, `no`, or `unknown`), never inferred from detector hits. Do not save quotations supporting that annotation.

## Exact-copy packet and clipboard commands

`source.txt`, `unmarked.txt`, and `both.txt` are plain UTF-8 without BOM or terminal newline. Copy entire files, not rendered Markdown; do not retype, normalize whitespace, strip hidden characters, or append a newline. `packet.json` intentionally contains the public synthetic canaries and scoring reference, the serialized keyed plan (not the key), exact SHA-256 payload hashes, byte/code-unit/code-point counts, instruction/template, and original-source insertion offsets. The exact receipt was used transiently to check restoration and was not retained. Replaying `embed` from the frozen plan reproduces the packet, but the discarded key cannot be re-derived from it.

| Payload | SHA-256 (UTF-8) | Bytes | Valid hidden frames | Tag code points |
|---|---|---:|---:|---:|
| unmarked | `3be588b933cdb9732f860ddf29316c65f1987bf816a48cb621609095e92082bd` | 486 | 0 | 0 |
| both | `962dba9fede4e23afcd6ae0ec95f406506aecdb221c8e68373b9599f6751cf78` | 2336 | 3 | 429 |

There are 143 tag code points per hidden frame, including start/end. These are code-point counts, not UTF-16 lengths. See `packet.json` for the chosen zero-based visible template and placement selector; the source has four sentences and the selected interior boundary is fixed by the stored plan. No provider input or reply is needed to verify this packet.

Use the dependency-equipped checkout identified by the local manual handoff, which must name its exact working directory, helper path, and reviewed commit. Do not assume an arbitrary repository root is current or has dependencies: a fresh worktree may lack them, and an older evidence-bearing checkout must not be substituted. Before use, confirm `git rev-parse HEAD` matches the handoff's reviewed commit and that the helper and packet match that commit. The handoff owner must retain that checkout and its dependency paths through the pilot. The commands below use the existing Node.js runtime and locally resolvable `tsx`; they require neither a global `pnpm` nor an installation. If the named runtime/dependencies are unavailable, stop rather than installing tooling or guessing another checkout.

From that verified working directory, first run this no-clipboard launch check; it must return sanitized JSON with `status: "completed"` and zero detected layers/raw tags. This is software validation, not a trial:

```sh
node --import tsx research/step6-pilot/clipboard.ts score confirmed-empty unknown
```

Only when a trial's copy step is authorized, use its condition's command:

```sh
node --import tsx research/step6-pilot/clipboard.ts copy unmarked
node --import tsx research/step6-pilot/clipboard.ts verify unmarked
node --import tsx research/step6-pilot/clipboard.ts copy both
node --import tsx research/step6-pilot/clipboard.ts verify both
```

`copy` overwrites the local clipboard with the selected synthetic prompt and checks its readback. Use only the condition being attempted; these lines are alternatives, not a batch. After pasting, use the composer’s complete-select/copy operation without sending, then run `verify` for that condition. An operator must establish that the entire composer, not another field or old clipboard, was re-copied; the helper cannot prove the clipboard's provenance. If a complete composer copy cannot be established, mark blocked. Do not print the clipboard with `pbpaste`, read it through a tool, or paste a reply into Terminal/Capy.

After a complete response, copy only the assistant response in the UI, then run one of:

```sh
node --import tsx research/step6-pilot/clipboard.ts score text unknown
node --import tsx research/step6-pilot/clipboard.ts score confirmed-empty unknown
```

Replace the last token only with the operator's `yes`, `no`, or `unknown` acknowledgment annotation. `confirmed-empty` is only for a UI-confirmed real empty response; it deliberately does not read the clipboard. An empty clipboard with `text` is blocked to avoid counting a failed copy as an empty answer. A refusal is ordinary completed text. Never score a loading, partial, truncated, technical-error, or unsure-state reply. The helper reads `/usr/bin/pbpaste` only into memory, calls the merged detector, and emits no raw reply, response hash, canary, key, excerpt, or exception. It writes no files or CSV and makes no network requests. Its booleans are observations, not scientific conclusions. Clear the task clipboard after processing without pasting it elsewhere; clipboard-history tools, if present, are not controlled by this protocol.

This adapter intentionally does not use the lab's CSV-import path, because that path requires a raw-response file. Later sanitized records may use the same per-layer interpretation and denominator rules, without manufacturing raw CSV evidence or changing the lab.

## Safe per-trial reporting form

Fill only metadata and enumerated observations; no response quotations or free-form content copied from the chat. Store a sanitized form separately from this intentional canary packet. The five-site pilot reserves trial IDs `chatgpt-control`, `chatgpt-both`, `grok-control`, `grok-both`, `gemini-control`, `gemini-both`, `deepseek-control`, `deepseek-both`, `perplexity-control`, and `perplexity-both`. Manual-only rows use a separate `manual-claude-*` or `manual-gemini4-argon-*` namespace and are never pooled with this batch.

```text
protocol: step6-browser-pilot/1
trialId:
source: web-ui
inputClass: synthetic
provider:
actualUiModelLabel: unknown
actualUiModeLabel: unknown
providerVersion: unknown
tierAssertion: unknown
tierObserved: unknown
operator:
observedAt (ISO date/time with timezone):
freshChat: yes | no | unknown
personalizationMemory: not-controlled | observed-disabled | unknown
variant: summary-3-sentences
condition: unmarked | both
originalPayloadSha256: (from packet)
clipboardBeforePaste: verified | failed | not-attempted
composerReCopy: verified-exact | mismatch | unavailable | not-attempted
composerTagCodePoints: 0 | 429 | not-verified
composerValidHiddenFrames: 0 | 3 | not-verified
sendState: not-sent | sent-once-confirmed | uncertain
status: completed | error | blocked
failureCode: none | ACCESS_CHALLENGE | MODEL_AMBIGUOUS | PRE_SUBMISSION_CARRIER_FAILURE | COPY_UNAVAILABLE | SUBMISSION_UNCERTAIN | MISSING_RESPONSE | TRUNCATED_RESPONSE | TECHNICAL_FAILURE
tagPhrasePresent: yes | no | not-scored
visibleNotePhrasePresent: yes | no | not-scored
replyRawTagsPresent: yes | no | not-scored
replyRawTagCount: (detector integer or not-scored)
instructionAcknowledgment: yes | no | unknown
acknowledgmentSource: operator-annotation
completedDenominatorContribution: 0 | 1
```

Only `status=completed`, a confirmed single send, and complete valid text (including genuine empty/refusal) contribute one. All other rows contribute zero and have `not-scored` layer fields. If a control is blocked/error, do not proceed to its exposure; report the incomplete pair. A later decision may define a new protocol, never an in-place retry. Summary rows show per-layer counts out of completed responses; report this pilot as single observations, not comparisons of provider efficacy.

## Manual-only handoff

Harry alone may open or prompt Claude and Gemini 4 Argon. Provide him exact copies of both payloads named `MANUAL-ONLY-Claude-unmarked.txt`, `MANUAL-ONLY-Claude-both.txt`, `MANUAL-ONLY-Gemini4-Argon-unmarked.txt`, and `MANUAL-ONLY-Gemini4-Argon-both.txt`, plus `packet.json`, the scoring reference, and this guide. Those filenames do not assert an actual model label; Harry must record the label/date/operator from his UI and clarify any mismatch before a run.

For each separately authorized manual pair: fresh chat for the control, record model/mode/date/operator and memory caveat, exact clipboard and composer re-copy checks, one send only, sanitized scoring; then a second fresh chat for exposure with the identical wrapper and checks. Never paste scoring-reference phrases separately into a control. Never strip hidden tags to make an interface accept the prompt. Report a carrier mismatch as blocked before send, and submit only the safe reporting form to the Captain. No raw response, screenshots, CSV, key, canary text, or response hash belongs in that report.

Report separate tag and visible-note phrase presence, plus the independent raw-tag observation. A match warrants contextual conversation and corroboration and proves no AI use, direct ingestion, authorship, intent, or misconduct. A miss gives no evidence for or against AI use or innocence. Hidden instructions are inspectable; the layers are not presumed independent. `n=1` produces counts out of one only, not hit rates, causal reliability, AI scores, or calibrated evidence strength. Zero completed responses means `N/A`.
