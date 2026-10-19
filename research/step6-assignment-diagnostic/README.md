# Assignment diagnostic packet — offline preparation only

This packet implements the approved [plan](PLAN.md), not a submission phase. Protocol `step6-assignment-diagnostic/1`, case/assignment `study-room-budget-v1`, frozen 2026-10-19. No prompts have been submitted for this packet. The initial ChatGPT/Grok phase with at most 12 sends is **still proposed and unauthorized**; later sites and human-only phases need their own scope. Independent review follows preparation before any first sends.

## Frozen contents and provenance

`source.txt` is exactly the plan's five-sentence synthetic study-room assignment. `C` means complete and `S` means summarize; each wrapper asks for exactly three sentences. `U` is an ordinary unmarked control, `E` is both-layer embedded exposure, and `D` is a **direct positive compliance control**, not protected-assignment evidence. All seven text files are exact UTF-8 with no BOM or terminal newline. Copy entire files through the cell command, not rendered Markdown or retyped text.

Preparation used the actual merged core at `6070c8ec6e1910af01864e61a79d96c12e5044e8`, one random 32-byte synthetic-only key, and the unchanged derivation/embedding/detection contracts. The key was zeroed after deriving the two full distinct canaries and separate embedding plan; it was never serialized. The receipt was used only in memory to verify exact removal and was not retained. No production word lists, grammar, outputs, codec, embedding or detector were changed. The optional compact/final-phrase reference was not implemented.

`packet.json` is the intentional **public synthetic scoring reference**: it contains the manifest, full canaries, exact wrappers/direct wording, source hash/counts, separate keyed plan, selected note/instruction, original-source insertion offsets and per-cell metadata. It contains no key or receipt. Its saved plan replays the marked source without recovering the discarded key. Never copy its canary fields into sanitized outcome forms or ordinary-control chats.

The same embedded source appears byte-for-byte in C-E/S-E. The same unmarked source appears in C-U/S-U/C-D/S-D. Direct requests use the same two full targets outside the assignment; the embedded source has three identical hidden instructions and one compatible visible note. The keyed visible template index is 7, placement selector 4279229707; original-source UTF-16 offsets are 0, 145 (shared hidden/note boundary), and 376. Each hidden frame has 139 tag code points including framing, for 417 total. These are this new case's counts, not the old water-cycle packet's counts.

| Cell | SHA-256 of exact UTF-8 prompt | Bytes | UTF-16 units | Code points | Tags / frames |
| --- | --- | ---: | ---: | ---: | ---: |
| C-U | `d77c39074f316886fbde4e7ff8da7e27fcc4582bce945e21f89ad9b41e905b1a` | 451 | 451 | 451 | 0 / 0 |
| S-U | `c2311f4077dcc6dd5e57fd9da72bffa7ba92736434957367b4c205726f28bb1b` | 452 | 452 | 452 | 0 / 0 |
| C-E | `c114f419edf4cfc7d6250da1d859c227ed37dec12edfbe2501c9bfa2811a55e4` | 2258 | 1424 | 1007 | 417 / 3 |
| S-E | `90d799d43f3fa2153160018ef3e1f42a11cc474e37c389462a10698097d412a3` | 2259 | 1425 | 1008 | 417 / 3 |
| C-D | `947d33e6e89f1bdacc0f5ab0f83f3af4caa7ac3f19fc668b2a20627b7b8df02e` | 645 | 645 | 645 | 0 / 0 |
| S-D | `d44bfe2367d2e89cbc72df11a4223e7cb5adaf21d040b103241aac72ca5bb8c1` | 646 | 646 | 646 | 0 / 0 |

Source SHA-256: `1a788d458a77ad9c833ef7954e77b95633bbc80d1bed04309952d6dba9b6c7e7` (376 bytes/units/points). The original `research/step6-pilot/` packet/helper/hashes and all historical records are unchanged. This new source/task is not an exact replay of pilot 1. No exact historical short-phrase prompt was recovered or reconstructed as a historical result.

## Local launch and helper boundaries

Use only the retained dependency-equipped **new task runtime** named by the local handoff, pinned to the final reviewed source head. The handoff supplies a concrete working directory, Node executable, helper/dependency paths and retention marker. Verify its `git rev-parse HEAD` and packet/helper parity against that reviewed head; a different checkout, missing runtime/dependencies or failed parity check means stop, not install. The commands below run from that verified runtime root using its existing Node and locally resolvable `tsx`, without global `pnpm`.

The following software launch check is permitted during offline preparation. It deliberately performs **no clipboard read or write**, and is not a model trial:

```sh
node --import tsx research/step6-assignment-diagnostic/clipboard.ts score confirmed-empty unknown unknown
```

It must emit one sanitized JSON object with `status: "completed"`, false per-layer detections and zero raw tags. A failure blocks later use. No other command below is authorized merely by this preparation document.

The new `clipboard.ts` reads only this packet's fixed files and uses the unchanged core in memory. Its native clipboard executables are fixed `/usr/bin/pbpaste` and `/usr/bin/pbcopy`, with piped stderr, bounded input/output/time and stdin for copied text; no shell or raw text arguments. It writes no response files, network requests, response hashes, logs, excerpts, canaries or keys. Safe errors are fixed codes, not exception bodies. It cannot observe UI state, completion, actual model routing, fresh chats or clipboard provenance; the operator must establish those gates independently. `copy` and `verify` output only frozen prompt identity/hash/counts; `score` outputs detector booleans/raw-tag observation/caveat and separate operator annotations.

Every `blocked` helper result stops the cell/site; never use its absence of detections as a miss. Record the fixed helper code separately from the trial failure category: `PAYLOAD_MISMATCH` at the composer gate is a pre-submission carrier failure, `EMPTY_CLIPBOARD` is an unqualified copy, and packet/prompt/argument/clipboard failures are technical blockers. Even `status: "completed"` from the helper establishes no UI completion or denominator eligibility by itself.

## Procedure for a separately authorized phase

Only one desktop operator may act at a time. Agree the release/handoff before Harry uses a manual-only packet or an agent uses the five eligible Vivaldi sites. No parallel human/agent clipboard activity. Eligible automatic sites remain ChatGPT, Grok, the configured free-plan Gemini 3 session, DeepSeek and Perplexity only. Never access Claude or independently prompt it by any route; never select Gemini 4 Argon automatically. No API substitute, paid route, installation, account/model upgrade or settings change.

The proposed within-site order is **C-U, S-U, C-E, S-E, C-D, S-D**, one fresh chat and at most one send per cell. Direct controls are last to reduce immediate target priming, not to control account memory. Hold model/mode constant across cells, record actual UI labels or `unknown`, and distinguish account-tier assertions from observations. A selected Gemini 3-family label does not establish its routed model/version. Fresh chats do not disable personalization/memory or imply independence. Fixed order, memory, wording and copy-count differences limit interpretation; do not retune after misses.

For each later authorized cell:

1. Record the new protocol/case/cell, actual model/mode/date/operator, fresh-chat confirmation and memory caveat in [the safe form](safe-form.txt). Verify the pinned source files and frozen prompt metadata. Stop on login/MFA/CAPTCHA, uncertain free-plan/model eligibility, mode drift or unclear UI; do not explore unrelated history or change accounts/settings.
2. Copy and read back exactly that cell using `copy CELL`. For example, **only when C-U is authorized**, run:

   ```sh
   node --import tsx research/step6-assignment-diagnostic/clipboard.ts copy C-U
   ```

   Require `status: "verified"`; paste once into the fresh composer. **Clear the task clipboard to EMPTY before the whole-composer UI re-copy**, so a silent failed copy cannot pass on the stale original. A later authorized clear can use `/usr/bin/pbcopy < /dev/null`; require successful completion, never display the clipboard. Select/copy the entire composer, then run `verify C-U` (or that cell's exact ID) with the same helper. Require full exact equality, frozen hash/counts, complete expected frames and correct cell. Do not send a mismatch, stripped/truncated text or an ambiguous full-copy result; do not repair/normalize/re-paste altered text. Composer equality proves inspected composer survival, not server ingestion. Keep it unchanged through one send.
3. Send once only if all gates passed and the phase's cap permits it. An uncertain send consumes its cell allowance and stops the site; never retry blindly. No resend, regenerate, follow-up, alternate prompt/provider or transfer of unused capacity. The initial proposed cap is 12 across ChatGPT then Grok, not 12 per site and not an authorized campaign.
4. Establish a completed assistant response and assistant-only Copy control without guessing. Stop/loading disappearance alone is insufficient if the assistant boundary/copy target is unclear. **Clear the task clipboard to EMPTY immediately before the completed assistant-only Copy action**. Never copy the full conversation/source, an unlabeled guessed button or a partial response. Missing/truncated/interrupted/technical/uncertain replies are unscored errors. An empty clipboard is a failed/unknown copy, not a genuine empty answer. A UI-confirmed genuine empty response and a completed refusal are valid completed text.
5. Score copied valid text transiently, using independent acknowledgment (`yes`, `no`, `unknown`) and output-context (`answer-use`, `quote-or-source-copy`, `mixed`, `unknown`) annotations. Do not pass raw text or an excerpt as an argument:

   ```sh
   node --import tsx research/step6-assignment-diagnostic/clipboard.ts score text unknown unknown
   ```

   Only a UI-confirmed genuine empty answer uses `score confirmed-empty unknown unknown`, which never reads the clipboard. A refusal uses `text` if copyable. Clear the task clipboard afterward. Save only sanitized fields; no raw reply, screenshot, hash, quote, CSV, key, canary or forwarded message. Clipboard-history tools, if present, are not controlled by this protocol.
6. Require both ordinary controls completed and target-clean before embedded cells. Any ordinary-control hit causes a contamination/collision hold. Any technical/composer/copy/completion failure stops all remaining cells at that site; preserve them as unattempted, not misses. Completed misses/refusals do not authorize tuning or retries. Every actual/uncertain send, even if later unscored, counts against the cap. Review safe records after the approved phase; expansion is never automatic.

Pilot 1's DeepSeek control remains `COPY_UNAVAILABLE`/unscored and its exposure unattempted. A future separately authorized DeepSeek phase must qualify a named assistant-only Copy control and observable completion signature on one of its budgeted **new** ordinary-control cells, with no extra qualification send. Otherwise stop unscored; never rerun/inspect the old trial, copy a full page or substitute an API.

## Scoring and safe interpretation

Use this packet's manifest, never the old water-cycle reference. Prompt self-checks have U = no literal targets/no tags, E = visible target only/three hidden frames, and D = both literal targets/no tags. These are **input software checks**, not model outcomes. Encoded hidden instructions are not decoded into phrase hits by the detector.

For actual later replies, preserve the core's independent `tag` and `visibleNote` literal booleans and separate raw-tag count. Literal phrases in quotes, code or copied-source-looking text still count. Annotate output context separately, without excerpts; quote-only presence does not establish substantive instruction compliance. Acknowledgment and context labels are operator observations, not detector inferences or proof of hidden decoding. Direct-positive-control success is user-level compliance, not protected-assignment evidence. Both-layer exposure cannot establish which instruction caused a literal target occurrence.

Only a confirmed single send with unambiguous completed valid text (including genuine empty/refusal) and safe capture contributes one to the completed denominator. Every blocked/error/uncertain row contributes zero with all detection fields `not-scored`; zero completed is `N/A`. Report n=1 observations, no rates/rankings/independence/AI scores. Direct-only success, embedded success and neither remain descriptive hypotheses under the [plan's interpretation table](PLAN.md#scoring-and-interpretation), not proof of server/model ingestion, authorship, intent, misconduct or innocence. A match warrants conversation/corroboration; a miss gives no evidence either way about AI use.

## Human-only copies

`manual-only/MANUAL-ONLY-Claude-C-U.txt` through `...-S-D.txt` and `manual-only/MANUAL-ONLY-Gemini4-Argon-C-U.txt` through `...-S-D.txt` are byte-identical copies of the six canonical cell files. Names label the delivery route, not an observed model version. Harry alone may open or prompt those products, and only under a separately scoped manual phase (proposed maximum six sends per provider). Supply him this guide, `safe-form.txt`, the six matching copies and `packet.json` as the scoring reference. Do not paste reference targets separately into ordinary controls.

Use the same fresh-chat, exact clipboard/composer, EMPTY-before-copy, completion and assistant-only capture gates, followed by transient local scoring when separately authorized and GUI ownership is clear. If Harry cannot establish a gate, preserve it as `unknown`/blocked rather than claiming a protocol-complete result. Keep human-reported/manual and automatic records separate with new manual namespaces; never pool them or publish raw replies. The local helper is not a route for the agent to access/prompt Claude or Argon.
