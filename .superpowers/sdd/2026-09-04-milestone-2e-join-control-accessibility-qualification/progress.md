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
- Canonical artifacts: four generated once; hashes frozen; source inspections passed; original and supplemental one-page previews preserved
- Editor workflows: Task 8 started; partial Word Latin observations; blocked on computer-control timeouts
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
- Task 4 sixth `validate` package entrypoint: complete with the real Task 5
  validator.
- Task 4 checkpoint verification: frozen-lockfile install, lint, typecheck,
  17-file/341-test full suite, and production build passed.
- Task 5 exact recursively closed record validator and binary gate: complete.
- Task 5 focused suite: 7 tests passed, covering the complete passing matrix,
  ordered binary gate, representative failure derivation across every evidence
  family, schema/profile/privacy/lineage rejection, artifact hash mismatch,
  and independent reinspection mismatch.
- Task 5 checkpoint verification: frozen-lockfile install, lint, typecheck,
  18-file/348-test full suite, and production build passed; completed
  experiment fingerprints remained unchanged and the M2E artifact directory
  remained absent.
- Task 6 pre-generation freeze review: complete.
- Task 6 implementation provenance commit:
  `d00a2d3526d15f94968ccdb15af10c612d9732ae`.
- Task 6 final protocol/science review: PASS (`ship`).
- Task 6 final code/security/privacy review: PASS (`ship`).
- Task 6 final verification: frozen-lockfile install, lint, typecheck,
  18-file/358-test full suite, and production build passed. Focused completed
  Milestone 2–2D regressions passed (13 files, 259 tests).
- Task 6 immutable-history audit: all four completed experiment tree
  fingerprints remain unchanged from the completed transport base; the M2E
  artifact root remains absent; no tracked DOCX/PDF/PNG files, lockfile drift,
  generated artifacts, secrets, or milestone leakage were found.
- Frozen implementation hashes at `d00a2d3526d15f94968ccdb15af10c612d9732ae`:
  protocol `7e18d881bfc222508104b801480fd4315bdf0e37ba101a67463084da6389b882`;
  fixture `6c34b6672d5ceccef6c719e83e653ce487e83a5b956fe0fa68515dd27e68d11d`;
  generator `73d34dd53d7807f0011e51b619a767c0d28368ffb6a3511c1666cdc3e96f4746`;
  validator `a83351e28d27afb26a3438ddad30ff720d9b626d7ea191152f176a3d6c60eaba`;
  package `a5b9bb22197a5a54abcbce70a577a6ece43988a5911f563f373298da0adc9027`;
  lockfile `83f234738c6a6f31f7a5429eedd0a479b4d739d2222fb291e7e1fbf9213ab0e3`.
- Task 7: complete. Canonical generation, replacement refusal checks, source
  inspections and one-page visual verification passed. The preview blocker
  recorded at `f2adddd` was resolved by explicit renderer font configuration;
  original evidence remains preserved alongside verified supplemental previews.
- Task 8: started after user-confirmed Desktop 4 placement. Word Latin
  visual/search observations collected; navigation/proofing incomplete.
  Operationally `BLOCKED` on persistent Word computer-control timeouts.
- Tasks 9–11: not started.

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

Restore reliable Word computer control on user-designated Desktop 4, inspect
and dismiss any remaining Language dialog without applying changes, and repeat
the Latin case primary workflow from a fresh open of its unchanged canonical.
Do not mark navigation or spelling as passing from the interrupted attempt.
Continue the existing Task 8 plan only when observations are reliable. No
canonical regeneration, frozen-code change or run record is authorized by this
operational recovery step. Tasks 8–11 and the Milestone 2E gate remain pending.

## Task 7 canonical evidence — 2026-09-05

Implementation provenance: `d00a2d3526d15f94968ccdb15af10c612d9732ae`.
Starting HEAD: `e706b3dc0c952c43eff8abbcc37fb7b1dcb4d71d`. Clean designated branch;
only the Task 6 ledger checkpoint differs from provenance. Frozen source,
protocol, fixture, package and lockfile hashes verified unchanged.
Document operation marker succeeded once for four DOCX outputs.
Generation uses the frozen Node 26.3.0 / pnpm 11.19.0 repository command.

### Frozen canonical SHA-256 values

- `latin-operations-v1`: `ead38b8f846102e593dece481a0f5a47e4368362fcc5b94446731fa3834863c5`
- `arabic-persian-joining-v1`: `f797b16180eed18eb78191973d02edbef8a48abe167b7626eefc6912957f68ac`
- `devanagari-emoji-graphemes-v1`: `4f8140a6ee2a4ac4b81af77a6d0faad2e01674a504f4daff4e21bb65887f2dc7`
- `mixed-bidi-v1`: `bb6309f9ef31fb6573386aa5bad922a9a3a7437ae3a5eda858741519042273a8`

### `arabic-persian-joining-v1` source inspection

Replacement attempt refused; SHA-256 unchanged. Source inspection:

```json
{
  "artifactPath": "research/artifacts/docx-join-control-accessibility-qualification-v1/arabic-persian-joining-v1.docx",
  "sha256": "f797b16180eed18eb78191973d02edbef8a48abe167b7626eefc6912957f68ac",
  "mode": "source",
  "caseId": "arabic-persian-joining-v1",
  "checkpointId": "canonical",
  "frameState": "exact",
  "occurrences": [
    {
      "markerId": "alpha",
      "checksumValid": true,
      "context": "ordinary-body",
      "part": "word/document.xml",
      "paragraphIndex": 1,
      "runIndices": [
        1
      ],
      "startCodePointIndex": 30,
      "codePointCount": 120,
      "anchor": "expected",
      "finding": "none"
    },
    {
      "markerId": "beta",
      "checksumValid": true,
      "context": "ordinary-body",
      "part": "word/document.xml",
      "paragraphIndex": 3,
      "runIndices": [
        1
      ],
      "startCodePointIndex": 36,
      "codePointCount": 120,
      "anchor": "expected",
      "finding": "none"
    }
  ],
  "visibleTextState": "exact",
  "hiddenPropertyState": "absent",
  "defaultIgnorableState": "allowlisted-only",
  "nfcState": "stable",
  "nfkcState": "stable",
  "segmentationState": "expected",
  "segmentation": [
    {
      "rowIndex": 0,
      "locale": "ar-SA",
      "graphemeCount": 50,
      "wordLikeCount": 9,
      "paragraphCount": 1
    },
    {
      "rowIndex": 1,
      "locale": "ar-SA",
      "graphemeCount": 50,
      "wordLikeCount": 9,
      "paragraphCount": 1
    },
    {
      "rowIndex": 2,
      "locale": "fa-IR",
      "graphemeCount": 56,
      "wordLikeCount": 10,
      "paragraphCount": 1
    },
    {
      "rowIndex": 3,
      "locale": "fa-IR",
      "graphemeCount": 56,
      "wordLikeCount": 10,
      "paragraphCount": 1
    }
  ],
  "nodeVersion": "26.3.0",
  "icuVersion": "78.3",
  "unicodeVersion": "17.0",
  "packageSafetyState": "safe",
  "relationshipSafetyState": "safe",
  "macroOrActiveContent": "absent",
  "coreMetadata": {
    "creator": "synthetic_expected",
    "lastModifiedBy": "synthetic_expected",
    "otherCore": "non_synthetic_redacted"
  },
  "findings": []
}
```

### `devanagari-emoji-graphemes-v1` source inspection

Replacement attempt refused; SHA-256 unchanged. Source inspection:

```json
{
  "artifactPath": "research/artifacts/docx-join-control-accessibility-qualification-v1/devanagari-emoji-graphemes-v1.docx",
  "sha256": "4f8140a6ee2a4ac4b81af77a6d0faad2e01674a504f4daff4e21bb65887f2dc7",
  "mode": "source",
  "caseId": "devanagari-emoji-graphemes-v1",
  "checkpointId": "canonical",
  "frameState": "exact",
  "occurrences": [
    {
      "markerId": "alpha",
      "checksumValid": true,
      "context": "ordinary-body",
      "part": "word/document.xml",
      "paragraphIndex": 1,
      "runIndices": [
        1
      ],
      "startCodePointIndex": 43,
      "codePointCount": 120,
      "anchor": "expected",
      "finding": "none"
    },
    {
      "markerId": "beta",
      "checksumValid": true,
      "context": "ordinary-body",
      "part": "word/document.xml",
      "paragraphIndex": 3,
      "runIndices": [
        1
      ],
      "startCodePointIndex": 52,
      "codePointCount": 120,
      "anchor": "expected",
      "finding": "none"
    }
  ],
  "visibleTextState": "exact",
  "hiddenPropertyState": "absent",
  "defaultIgnorableState": "allowlisted-only",
  "nfcState": "stable",
  "nfkcState": "stable",
  "segmentationState": "expected",
  "segmentation": [
    {
      "rowIndex": 0,
      "locale": "hi-IN",
      "graphemeCount": 48,
      "wordLikeCount": 13,
      "paragraphCount": 1
    },
    {
      "rowIndex": 1,
      "locale": "hi-IN",
      "graphemeCount": 48,
      "wordLikeCount": 13,
      "paragraphCount": 1
    },
    {
      "rowIndex": 2,
      "locale": "en-US",
      "graphemeCount": 71,
      "wordLikeCount": 11,
      "paragraphCount": 1
    },
    {
      "rowIndex": 3,
      "locale": "en-US",
      "graphemeCount": 71,
      "wordLikeCount": 11,
      "paragraphCount": 1
    }
  ],
  "nodeVersion": "26.3.0",
  "icuVersion": "78.3",
  "unicodeVersion": "17.0",
  "packageSafetyState": "safe",
  "relationshipSafetyState": "safe",
  "macroOrActiveContent": "absent",
  "coreMetadata": {
    "creator": "synthetic_expected",
    "lastModifiedBy": "synthetic_expected",
    "otherCore": "non_synthetic_redacted"
  },
  "findings": []
}
```

### `latin-operations-v1` source inspection

Replacement attempt refused; SHA-256 unchanged. Source inspection:

```json
{
  "artifactPath": "research/artifacts/docx-join-control-accessibility-qualification-v1/latin-operations-v1.docx",
  "sha256": "ead38b8f846102e593dece481a0f5a47e4368362fcc5b94446731fa3834863c5",
  "mode": "source",
  "caseId": "latin-operations-v1",
  "checkpointId": "canonical",
  "frameState": "exact",
  "occurrences": [
    {
      "markerId": "alpha",
      "checksumValid": true,
      "context": "ordinary-body",
      "part": "word/document.xml",
      "paragraphIndex": 1,
      "runIndices": [
        1
      ],
      "startCodePointIndex": 41,
      "codePointCount": 120,
      "anchor": "expected",
      "finding": "none"
    },
    {
      "markerId": "beta",
      "checksumValid": true,
      "context": "ordinary-body",
      "part": "word/document.xml",
      "paragraphIndex": 3,
      "runIndices": [
        1
      ],
      "startCodePointIndex": 46,
      "codePointCount": 120,
      "anchor": "expected",
      "finding": "none"
    }
  ],
  "visibleTextState": "exact",
  "hiddenPropertyState": "absent",
  "defaultIgnorableState": "allowlisted-only",
  "nfcState": "stable",
  "nfkcState": "stable",
  "segmentationState": "expected",
  "segmentation": [
    {
      "rowIndex": 0,
      "locale": "en-US",
      "graphemeCount": 69,
      "wordLikeCount": 12,
      "paragraphCount": 1
    },
    {
      "rowIndex": 1,
      "locale": "en-US",
      "graphemeCount": 69,
      "wordLikeCount": 12,
      "paragraphCount": 1
    },
    {
      "rowIndex": 2,
      "locale": "en-US",
      "graphemeCount": 77,
      "wordLikeCount": 13,
      "paragraphCount": 1
    },
    {
      "rowIndex": 3,
      "locale": "en-US",
      "graphemeCount": 77,
      "wordLikeCount": 13,
      "paragraphCount": 1
    }
  ],
  "nodeVersion": "26.3.0",
  "icuVersion": "78.3",
  "unicodeVersion": "17.0",
  "packageSafetyState": "safe",
  "relationshipSafetyState": "safe",
  "macroOrActiveContent": "absent",
  "coreMetadata": {
    "creator": "synthetic_expected",
    "lastModifiedBy": "synthetic_expected",
    "otherCore": "non_synthetic_redacted"
  },
  "findings": []
}
```

### `mixed-bidi-v1` source inspection

Replacement attempt refused; SHA-256 unchanged. Source inspection:

```json
{
  "artifactPath": "research/artifacts/docx-join-control-accessibility-qualification-v1/mixed-bidi-v1.docx",
  "sha256": "bb6309f9ef31fb6573386aa5bad922a9a3a7437ae3a5eda858741519042273a8",
  "mode": "source",
  "caseId": "mixed-bidi-v1",
  "checkpointId": "canonical",
  "frameState": "exact",
  "occurrences": [
    {
      "markerId": "alpha",
      "checksumValid": true,
      "context": "ordinary-body",
      "part": "word/document.xml",
      "paragraphIndex": 1,
      "runIndices": [
        1
      ],
      "startCodePointIndex": 54,
      "codePointCount": 120,
      "anchor": "expected",
      "finding": "none"
    },
    {
      "markerId": "beta",
      "checksumValid": true,
      "context": "ordinary-body",
      "part": "word/document.xml",
      "paragraphIndex": 3,
      "runIndices": [
        1
      ],
      "startCodePointIndex": 44,
      "codePointCount": 120,
      "anchor": "expected",
      "finding": "none"
    }
  ],
  "visibleTextState": "exact",
  "hiddenPropertyState": "absent",
  "defaultIgnorableState": "allowlisted-only",
  "nfcState": "stable",
  "nfkcState": "stable",
  "segmentationState": "expected",
  "segmentation": [
    {
      "rowIndex": 0,
      "locale": "en-US",
      "graphemeCount": 74,
      "wordLikeCount": 12,
      "paragraphCount": 1
    },
    {
      "rowIndex": 1,
      "locale": "en-US",
      "graphemeCount": 74,
      "wordLikeCount": 12,
      "paragraphCount": 1
    },
    {
      "rowIndex": 2,
      "locale": "ar-SA",
      "graphemeCount": 60,
      "wordLikeCount": 10,
      "paragraphCount": 1
    },
    {
      "rowIndex": 3,
      "locale": "ar-SA",
      "graphemeCount": 60,
      "wordLikeCount": 10,
      "paragraphCount": 1
    }
  ],
  "nodeVersion": "26.3.0",
  "icuVersion": "78.3",
  "unicodeVersion": "17.0",
  "packageSafetyState": "safe",
  "relationshipSafetyState": "safe",
  "macroOrActiveContent": "absent",
  "coreMetadata": {
    "creator": "synthetic_expected",
    "lastModifiedBy": "synthetic_expected",
    "otherCore": "non_synthetic_redacted"
  },
  "findings": []
}
```

All four source inspections report `otherCore: non_synthetic_redacted`.
Per the frozen metadata contract, carry deviation `docx-core-metadata-redacted`
and limitation `docx-core-metadata-requires-privacy-review` into any later
complete run record. No raw metadata was recorded or emitted.

### Canonical preview observations

Renderer: documents skill `render_docx.py` from bundle `26.903.11726`, bundled
Python, fixed 144 DPI, default bundled LibreOffice/Poppler resolution. Each
render used a fresh directory beneath the ignored artifact root; its sole
`page-1.png` was copied create-only to the frozen canonical-preview filename.
No intermediate PDF was retained. All four canonical hashes stayed unchanged.
Every full-page PNG was opened and visually inspected.

The following fixed codes describe paired-row appearance in the source preview
only; they are not primary-editor or NVDA evidence.

| Case | Pages | Paired visual parity | Paired layout parity | Evidence status |
| --- | --- | --- | --- | --- |
| `latin-operations-v1` | 1 | `parity` | `parity` | observed |
| `arabic-persian-joining-v1` | 1 | `parity` | `parity` | observed |
| `devanagari-emoji-graphemes-v1` | 1 | `parity` | `parity` | `BLOCKED` |
| `mixed-bidi-v1` | 1 | `parity` | `parity` | observed |

The family emoji is absent from both Beta rows of the Devanagari/emoji preview.
Paired visual parity alone cannot establish preservation of that grapheme.
This is a canonical-preview rendering/evidence limitation; its cause has not
been established and it is not a scientific rejection of the candidate.
Task 7 remains `BLOCKED` on reliable visual evidence. No source fix,
regeneration, preview replacement, editor workflow, NVDA workflow, or run
record was attempted after observing this blocker.

### Preserved preview SHA-256 values

- `arabic-persian-joining-v1-canonical-page-1.png`: `9a4f9241d14a3bd66c3355a494a1f4c476f441fb90abd0a6d830c524bcaad052`
- `devanagari-emoji-graphemes-v1-canonical-page-1.png`: `45f2eeaf3a4e1582c44850577f8ce4ef773c84a165aab2ac561536a214b95ba4`
- `latin-operations-v1-canonical-page-1.png`: `ee13bca71b6b6b404481f2027faccb5327f4f54d6fd9414b8efe813a1e949205`
- `mixed-bidi-v1-canonical-page-1.png`: `73c7fe8f3a381e7905226925e1bd1b44c830d1b8ad0c11bceb83b2513023cbb9`

### Task 7 checkpoint verification

- Post-render source reinspection exactly matches all four recorded inspection
  objects and hashes.
- All four completed experiment tree fingerprints match the baseline.
- Frozen implementation, protocol, package and lockfile remain unchanged.
- Artifact root contains exactly four ignored DOCX and four ignored PNG files;
  no symlinks, editor exports, or `run-001.json` exist in that root.
- Only this ledger is changed. No implementation tests were added or rerun for
  this evidence-only checkpoint; executed generation, refusal, source
  reinspection, rendering and artifact-scope checks are recorded above.

## Task 7 renderer blocker resolution — 2026-09-05

The user authorized proceeding with the renderer investigation after the
`f2adddd` checkpoint. Scope remained ignored diagnostic artifacts and this
ledger. Earlier blocker observations above describe that preserved checkpoint;
they are superseded for current Task 7 status by the verification below.

### Cause and controlled check

The same documents-skill renderer, same source DOCX and same 144 DPI setting
reproduced the original PNG byte-for-byte with default font configuration.
The resulting diagnostic PDF had zero complete family sequences, zero family
person code points, and no images. The loss therefore occurred before PNG
conversion. A default fontconfig probe returned no system-font matches, even
though the system emoji font exists.

The only renderer-input change was setting the process-local `FONTCONFIG_FILE`
to the bundled LibreOffice font configuration:

```text
/Users/harryjin/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/libreoffice-headless/libreoffice/LibreOfficeDev.app/Contents/Resources/fontconfig/fonts.conf
```

No installed runtime file, system preference, repository implementation or
canonical DOCX was edited. LibreOffice version was
`26.8.0.0.alpha0` (`2c87e51eeaa2b413ff4ae097b2705eea1995d8e5`).
The skill renderer remained bundle `26.903.11726`, with bundled Python and
144 DPI. The explicit configuration restored both complete family sequences
(eight family person code points total) in the one-page diagnostic PDF. Both
family glyphs were visible in its PNG. A second render with this configuration
produced a byte-identical emoji-case PNG.

This establishes a renderer font-discovery/configuration problem for the
observed omission. It does not establish editor accessibility or carrier
qualification. No scientific failure was repaired or waived.

### Supplemental source-preview verification

All four canonicals were rendered with the explicit configuration to fresh,
create-only directories under ignored
`task7-render-diagnostics/verified-fontconfig/<case>/page-1.png`.
All four full-page PNGs were visually inspected. The original fixed-name
previews and both diagnostic PDF/PNG pairs remain unchanged for audit. These
additional files are supplemental renderer evidence, outside the mandatory
editor artifact matrix; none will be represented as editor exports or new
canonical documents in a run record.

| Case | Pages | Paired visual parity | Paired layout parity | Carrier presented |
| --- | --- | --- | --- | --- |
| `latin-operations-v1` | 1 | `parity` | `parity` | `absent` |
| `arabic-persian-joining-v1` | 1 | `parity` | `parity` | `absent` |
| `devanagari-emoji-graphemes-v1` | 1 | `parity` | `parity` | `absent` |
| `mixed-bidi-v1` | 1 | `parity` | `parity` | `absent` |

### Supplemental preview SHA-256 values

- `arabic-persian-joining-v1`: `e8398ece0ca635561abc541b51dfc9024bc84d00a8b0500a31dc1b306c5f7cd8`
- `devanagari-emoji-graphemes-v1`: `3c16d7afa020fee9c636a8b1a5e706c68a53c8abe3558797526dc8f10296a4ff`
- `latin-operations-v1`: `5e4fe776cd6b61d0b5abeec43d8292f2c75451130326ebea4ac09c8caea3323c`
- `mixed-bidi-v1`: `eb6f6bd8083fdc904db9f429cdc27fcecddc1e3099c49f6eb67ca7adf2cf7bb0`

Renderer SHA-256: `4ef8a050a3abda560ff6bd7f3761aa63881593a358dcd1eebdaa55551efa9a89`.
Font configuration SHA-256: `2798bd808c36ebb391f3ddf7c80c6d9151d9a9380d58463675b5f7cd6ba357e3`.

### Resolution checkpoint verification

- Read-only PDF assertions confirmed baseline count 0 and configured count 2
  for the complete family sequence; repeated configured PNG bytes match.
- All four complete source-inspection objects and frozen canonical hashes
  still match the Task 7 generation checkpoint exactly.
- All four original preview hashes remain unchanged.
- Frozen implementation and completed experiment trees are unchanged from
  implementation provenance; only this ledger changes in Git.
- All diagnostic outputs remain ignored and no symlinks were introduced.
- Editor and NVDA workflows remain unstarted; run record absent, gate pending.
- No application code changed; focused renderer, visual, source-reinspection,
  hash and artifact-boundary checks were used for this checkpoint.

## Task 8 execution preflight — 2026-09-05

Starting commit: `132158b`; designated branch clean. The user authorized Task 8
execution and then requested that computer interaction stay on Desktop 4.
The existing reviewed Task 8 plan remains authoritative; no new implementation
or protocol changes are needed.

### Serial execution plan

1. Verify all four canonical hashes and complete source-inspection objects
   against Task 7, and verify editor versions and Desktop 4 placement.
2. For each case/editor, independently open/import the canonical. Verify Google
   Docs is native and unshared; verify Word Print Layout. At 100%, collect
   primary unselected visual evidence before any selection or special mode.
3. Collect paragraph/word/character navigation, exact cross-anchor searches,
   spellcheck, ordinary body selection/copy, and the unchanged roundtrip export.
   Hash and inspect DOCX/TXT outputs using the frozen commands.
4. Execute insert, backspace and forward-delete in frozen target order. Every
   target/operation uses a fresh canonical import/open. Save result and restored
   checkpoints under the exact protocol filenames; inspect every output.
5. Collect specialized display observations only after primary observations;
   run Word Accessibility Assistant last without applying suggestions.
6. Use separate fresh canonical opens for print preview and PDF export. Run
   frozen pure PDF inspection, create-only rendering and visual comparison.
7. Record fixed codes, hashes and privacy-safe inspection evidence in this
   ledger. Preserve incomplete evidence without creating a run record. Stop
   on unreliable required observations; do not repair or infer results.

### Verified preflight

- macOS: `26.2` (`25C56`).
- Word for Mac: `16.112.3`, bundle build `16.112.26083020`; native app opened.
- Chrome: `152.0.7977.77`.
- All four canonical hashes and complete source-inspection objects match Task 7.
- Google Docs access, native import and sharing state are not yet verified.
- No canonical was imported, edited or saved by an editor during preflight;
  no Task 8 evidence export or observation code was produced.

### Desktop placement blocker

macOS has four desktop spaces. Computer-control Mission Control access timed
out; direct Control-4 is disabled in the observed shortcut configuration, and
Control-Right attempts did not produce a verified move away from Desktop 1.
The tool does not accept the `fn` modifier. No shortcut preference was changed.
The Google Docs tab-creation attempt timed out and left a blank Chrome tab;
no document was imported through that attempt.

Before UI evidence collection, the Task 8 Chrome and Word windows need to be
placed on Desktop 4. The agent cannot currently verify or perform that move
with the available computer-control surface. This is an operational workspace
blocker, not a carrier finding. Editor and NVDA evidence remain absent and the
Milestone 2E gate remains pending.

## Task 8 interrupted Word Latin session — 2026-09-05

The user confirmed that the Task 8 windows had been placed on Desktop 4.
That resolves the user-placement prerequisite recorded at `7433d78`; it does
not establish that the computer-control tool can guarantee background desktop
isolation. Only Word was used in this session.

The existing Latin canonical was opened through Word's native Open dialog
using its exact local path. Before navigation/search/proofing, the native
window and screenshot showed Print Layout, 100% zoom, one page, formatting
marks off, four visible rows and no visible carrier glyph or placeholder.

### Verified partial observations

| Case/editor | Observation | Code |
| --- | --- | --- |
| `latin-operations-v1` / `microsoft-word` | Unselected visible paired rows | `parity` |
| `latin-operations-v1` / `microsoft-word` | Paired layout | `parity` |
| `latin-operations-v1` / `microsoft-word` | Ordinary carrier presentation | `absent` |
| `latin-operations-v1` / `microsoft-word` | Alpha frozen cross-anchor search | `both-rows-found` |
| `latin-operations-v1` / `microsoft-word` | Beta frozen cross-anchor search | `both-rows-found` |

The Find UI showed a total of two matches for each frozen search. No raw
carrier sequences, document metadata, account data or transcripts are retained
in this ledger. These partial codes are not a completed editor evidence row.

### Unverified observations and interruption

An initial document-body coordinate interaction failed with
`noWindowsAvailable`; reconnecting and accessibility-element focus recovered
control. Paragraph navigation keys were attempted, but the exposed state did
not establish caret movement reliably. No navigation pass was recorded.

Word's Editor panel subsequently showed zero spelling and grammar findings.
That observation alone does not prove functional paired spellchecking for the
intentional Latin Beta misspelling. A read-only Language-dialog inspection
showed spelling suppression unchecked and automatic language detection checked.
No language or proofing setting was intentionally changed and no correction
was accepted. The attempt to Cancel the dialog and clear the Find selection
timed out, so its completion and final caret/dialog state are unverified.

Repeated Word state reads and app reconnections returned
`Computer Use server error -10005: timeoutReached`, including after a complete
computer-control session reset. Word's process still exists; no claim is made
that the application itself crashed or that the protocol failed scientifically.

Task 8 is operationally `BLOCKED` on reliable computer interaction and required
navigation/proofing observation. The session stopped without mutations,
ordinary-body copy, roundtrip export, specialized-display workflow, print/PDF
export or Google Docs import. The automatic Accessibility status visible in
Word was not counted as an Accessibility Assistant assessment.

### Checkpoint preservation

All four canonical SHA-256 values were recomputed after the interruption and
match the frozen Task 7 values. No source or frozen protocol changed. No
Task 8 artifact export or `run-001.json` was created. Prior completed experiment
history and the pending Milestone 2E gate remain unchanged.
