# DOCX Join-Control Accessibility Qualification v1

Status: frozen before implementation and canonical generation, 2026-09-04

## Purpose and decision boundary

This protocol qualifies or rejects the unchanged transport winner selected by
Milestone 2D inside one explicit editor, language, operation, PDF, and screen-
reader boundary.

- qualification profile: `docx-zero-width-join-control-qualification-v1`
- experiment ID: `glyph-exp-docx-zero-width-join-control-qualification-v1-001`
- schema version: `1`
- candidate: `join-control-binary-v1`
- document profile: `docx-zero-width-join-control-v1`
- scientific decisions: `QUALIFY_PROFILE` or `REJECT_PROFILE`
- operational incomplete state: `BLOCKED`, outside the completed record

The question is whether the two framed ZWNJ/ZWJ markers preserve visible text,
shaping, bidirectional order, ordinary editing, print/PDF behavior, and NVDA
behavior relative to marker-free controls in the frozen configurations below.

A positive result is bounded qualification evidence. It does not establish
universal accessibility, production readiness, pilot readiness, AI ingestion,
model compliance, authorship, prompt reuse, intent, cheating, or misconduct.
VoiceOver and every screen reader other than the frozen NVDA configuration are
not assessed.

Milestones 2, 2B, 2C, and 2D are immutable. No file in their experiment trees
or artifact sets may be edited or regenerated.

## Unchanged carrier dependency

The experiment imports the Milestone 2D `CANDIDATE_A`, `encodeCarrier`,
`decodeCarrier`, and fixed Alpha/Beta frames without modification.

- Alpha frame bytes: `47 5A 01 A1 08 47 4C 59 50 48 41 30 31 7D 62`
- Beta frame bytes: `47 5A 01 B2 08 47 4C 59 50 48 42 30 31 01 6B`
- CRC: CRC-16/CCITT-FALSE, polynomial `0x1021`, initial `0xFFFF`, no
  reflection, final XOR `0x0000`, big-endian serialization
- bit `0`: ZWNJ `U+200C`
- bit `1`: ZWJ `U+200D`
- order: most-significant bit first
- exact length: 120 code points per frame

Every source marker is a separate ordinary `word/document.xml` body run after
the first ASCII full stop and before the following ordinary space. The run has
no run properties and no hidden text, size, scaling, spacing, color, shading,
highlight, positioning, field, text box, comment, header, footer, note, or
secondary hiding mechanism.

No frame byte, mapping, marker count, anchor rule, run formatting, or profile
may be tuned here. Such a change requires a new transport carrier experiment.

## Frozen document format

Every case is a one-page DOCX with:

- US Letter page size and one-inch margins;
- 11-point Arial body text;
- four ordinary body paragraphs and no header/footer;
- order: control Alpha, marked Alpha, control Beta, marked Beta;
- identical `Alpha sample — ` prefix on both Alpha rows;
- identical `Beta sample — ` prefix on both Beta rows; and
- identical style, language, direction, and layout inside each pair.

Removing only the one checksum-valid frame from a marked paragraph must yield
its adjacent control paragraph byte-for-byte. Pair order identifies control and
marked rows; different visible control/marked labels are prohibited.

### Case matrix

| Case ID | Row | Language | Direction | Frozen content after the identical pair prefix |
| --- | --- | --- | --- | --- |
| `latin-operations-v1` | Alpha pair | `en-US` | LTR | `The archive opens at nine. Staff review the daily log.` |
| `latin-operations-v1` | Beta pair | `en-US` | LTR | `The receeve desk closes at five. Visitors sign the blue ledger.` |
| `arabic-persian-joining-v1` | Alpha pair | `ar-SA` | RTL | `هذه جملة عربية. ثم تأتي جملة قصيرة.` |
| `arabic-persian-joining-v1` | Beta pair | `fa-IR` | RTL | `کتاب‌ها روی میز هستند. سپس جمله ادامه دارد.` |
| `devanagari-emoji-graphemes-v1` | Alpha pair | `hi-IN` | LTR | `यह क्षेत्र का सरल प्रश्न है. फिर अगला वाक्य आता है.` |
| `devanagari-emoji-graphemes-v1` | Beta pair | `en-US` | LTR | `The family emoji 👨‍👩‍👧‍👦 stays intact. Then the line continues.` |
| `mixed-bidi-v1` | Alpha pair | `en-US` | LTR | `The token GLYPH42 precedes العربية 123. Then the line ends.` |
| `mixed-bidi-v1` | Beta pair | `ar-SA` | RTL | `يتضمن النص GLYPH42 والرقم 123. ثم يستمر السطر.` |

The fixed deliberate misspelling is `receeve`. The only visible join controls
outside a frame are the one Persian ZWNJ in `کتاب‌ها` and the three emoji ZWJs
inside `👨‍👩‍👧‍👦`. Their exact row and code-point locations are allowlisted.
No bidi control character or other default-ignorable character is allowed.

The fixed cross-anchor search strings are:

| Case ID | Alpha | Beta |
| --- | --- | --- |
| `latin-operations-v1` | `nine. Staff` | `five. Visitors` |
| `arabic-persian-joining-v1` | `عربية. ثم` | `هستند. سپس` |
| `devanagari-emoji-graphemes-v1` | `है. फिर` | `intact. Then` |
| `mixed-bidi-v1` | `123. Then` | `123. ثم` |

## Segmentation and normalization

Inspection records NFC and NFKC equality on the raw carrier-bearing text without
mutating or first removing frames. Grapheme and word segmentation likewise uses
the raw control and marked rows with `Intl.Segmenter`, each row's frozen locale,
and granularity `grapheme` or `word`. Exact counts are compared with the frozen
expected raw rows for that checkpoint; visible-text comparison separately
removes only checksum-valid frames. Line evidence means exact paragraph/newline
boundaries only; this experiment makes no Unicode line-breaking-conformance
claim.

The record freezes exact `process.versions.node`, `process.versions.icu`, and
`process.versions.unicode` values plus every locale and granularity. A version
or provenance mismatch is `BLOCKED`; evidence is not silently recomputed under
different Unicode data.

## Artifact matrix

All generated evidence is ignored under:

`research/artifacts/docx-join-control-accessibility-qualification-v1/`

For each of the four cases:

- shared canonical: `<case>.docx`
- canonical preview: `<case>-canonical-page-1.png`

For each editor ID, `google-docs` and `microsoft-word`:

- base export: `<case>-<editor>-roundtrip.docx`
- copied body: `<case>-<editor>-copy-plain-text.txt`
- print export: `<case>-<editor>-print.pdf`
- PDF render: `<case>-<editor>-print-page-1.png`
- mutation: `<case>-<editor>-<target>-<operation>-<state>.docx`

Targets are `control-alpha`, `marked-alpha`, `control-beta`, and
`marked-beta`. Operation/state pairs are `insert-redone`, `insert-restored`,
`backspace-result`, `backspace-restored`, `forward-delete-result`, and
`forward-delete-restored`.

Each editor/case therefore has one round trip and 24 mutation DOCX files. The
complete matrix is 204 DOCX files, 8 TXT files, 8 PDFs, and 12 PNGs. Every PDF
must have exactly one page. One-page DOCX presentation is an editor observation
within the frozen layout-parity workflow; the structural DOCX inspector does not
claim to calculate pagination.

Generators and renderers use create-only writes and refuse an existing path,
symlink, non-regular file, absolute path, directory escape, or symlinked
artifact root. Canonical hashes are frozen after first generation. A canonical
hash discrepancy stops the experiment; no artifact is regenerated.

PNG content and raw extracted PDF text are ignored local evidence and never
enter the tracked record. The validator requires the fixed visual result codes
but does not read PNG pixels.

## Primary editor environments

The required macOS workflows are:

- current desktop Google Docs in current Chrome on the observed macOS build;
  each import starts in a new unshared document; and
- current Microsoft Word for Mac in Print Layout on the same observed macOS
  build; each file opens independently from the canonical.

An editor output is never used as the other editor's source. Exact safe version
labels are recorded. Google Docs is recorded as `not-exposed` when no product
build is exposed; the Chrome version remains mandatory.

Before selection, search, editing, spellcheck, special display, accessibility
surfaces, or print preview, observe at 100%:

- exact control/marked visible-text parity;
- shaping and grapheme parity;
- no carrier glyph or placeholder in ordinary unselected view;
- line wrapping and layout parity; and
- correct LTR/RTL visual order.

Then run paragraph, word, and character navigation across each anchor. Each
cross-anchor search must find both pair occurrences. Open spellcheck without
accepting a suggestion and compare underlines, finding count, and suggestion-
presence classification between each pair. The Latin Beta misspelling receives
its own `same`/`different` result. Unavailable or unreliable spellcheck evidence
is `BLOCKED` and has no unavailable record value.

## Copy protocol

Focus the editing area, select the complete four-paragraph body once with the
application's Select All command, and before copying record whether selection
reveals a carrier glyph, placeholder, or material layout artifact. Then copy
once and paste once into a new UTF-8 plain-text file. The selection must contain
only the ordinary body. Any carrier/placeholder revealed by ordinary selection
maps to `carrier-presented`.

LF and CRLF are recorded and accepted. Splitting either form must yield the
exact four paragraphs in order. The text must contain exactly one valid Alpha
frame and one valid Beta frame at their original logical boundaries. Missing,
damaged, duplicate, moved, or mixed frames are inspectable
`clipboard-mismatch` evidence and produce `REJECT_PROFILE`. Invalid UTF-8 is
uninspectable and produces operational `BLOCKED`. No normalization or repair is
applied.

## Mutation protocol

Every mutation starts from a separate fresh canonical import/open and targets
one row only. Find selects the first occurrence for a control target and the
second occurrence for its marked target.

Direction-aware selection collapse is mandatory in both editors:

| Action | LTR paragraph | RTL paragraph |
| --- | --- | --- |
| Collapse Find selection to logical end | Right Arrow | Left Arrow |
| Collapse Find selection to logical start | Left Arrow | Right Arrow |
| Move one logical character backward | Left Arrow | Right Arrow |

Mixed-bidi Alpha uses LTR and mixed-bidi Beta uses RTL. The observer confirms
the caret is adjacent to the ASCII full-stop/space anchor before mutation. An
ambiguous location is `BLOCKED`; mouse placement is not substituted.

### Insert

1. Find the exact first sentence including its full stop.
2. Dismiss Find and collapse at logical end.
3. Type uppercase `X`.
4. Undo once, redo once, and save `insert-redone`.
5. Undo once and save `insert-restored`.

Passing `insert-redone` has visible `X` immediately after the full stop and
before the ordinary space. A marked target has one exact contiguous frame,
allowing editor run splitting only, immediately after the original full stop
and before `X`. The changed control row equals the changed marked row after
removing only that frame.

### Backspace

1. Find the exact second sentence without its leading space.
2. Dismiss Find and collapse at logical start.
3. Move one logical character backward across the ordinary space.
4. Press Backspace once and save `backspace-result`.
5. Undo once and save `backspace-restored`.

Passing `backspace-result` removes the first sentence's full stop while leaving
the ordinary space. A marked target retains one exact frame, with no code point
added or removed, at the resulting first-sentence/space boundary. Paired
changed rows match after validated frame removal.

### Forward delete

1. Find the exact first sentence including its full stop.
2. Dismiss Find and collapse at logical end.
3. Press Forward Delete once and save `forward-delete-result`.
4. Undo once and save `forward-delete-restored`.

Passing `forward-delete-result` removes the ordinary anchor space so the
second sentence begins immediately after the first full stop. A marked target
retains one exact frame after that full stop and before the second sentence.
Paired changed rows match after validated frame removal.

Every restored checkpoint must semantically equal the fresh unedited editor
round trip: exact rows, frames, locations, properties, allowlists,
normalization, segmentation, and safety findings. ZIP bytes and editor metadata
need not be identical. Every non-target row remains at the round-trip state.

The exact mutation record order is insert, backspace, forward-delete; within
each operation: control Alpha, marked Alpha, control Beta, marked Beta.

## Print and PDF protocol

For each editor/case, start a dedicated fresh canonical import/open used only
for print preview and PDF export. Do not reuse a copy that received navigation,
selection, search, spellcheck, special-surface, accessibility, or mutation
operations. Record control/marked text, layout, order, page count, and
placeholder parity, then export one PDF.

Pure PDF inspection uses Python `3.14.7`, Unicode data `16.0.0`, and
`pypdf==6.10.0` under `uv run --no-project --script`; the PEP 723 header pins
the exact Python interpreter and dependency. Rendering is a separate create-only action
using Poppler `pdftoppm` at 144 DPI with an argument array, no shell,
`LC_ALL=C`, and suppressed raw stderr. Frozen pre-implementation tool versions
are Python `3.14.7`, Unicode data `16.0.0`, uv `0.12.9`, pypdf `6.10.0`, and
pdftoppm `26.05.0`. A missing or different tool version is `BLOCKED`.

The pure inspector:

- refuses a password and records encryption as inspectable rejection evidence;
- requires exactly one page;
- requires the four exact synthetic visible paragraphs once and in order;
- requires no extracted frame, join-control placeholder, `U+FFFD`, object-
  replacement character, unexpected control, or default ignorable;
- performs a visited-object, depth, and object-count bounded traversal;
- rejects embedded files, file specifications/attachments, associated files,
  JavaScript, launch actions, URI actions, unsafe open/additional actions, and
  every annotation; and
- returns metadata classifications without returning raw metadata.

Rendering requires exactly one non-empty PNG. Automated rendering proves only
renderability. The observer separately records paired visual page, layout,
text-order, and placeholder parity.

## Specialized editor surfaces

Only after primary evidence:

1. Enable Word Show/Hide or Google Docs' non-printing-character display.
2. Record `none`, `generic-indicator-only`, or `decoded-payload` presentation;
   `parity` or `trap` navigation; and `none` or `present` residual layout.
3. Disable the mode and confirm no residual layout change.
4. In Word only, run Accessibility Assistant and record
   `no-carrier-finding`, `carrier-related-finding`, or `unavailable` without
   applying a suggestion. Google Docs records `not-applicable`.

A generic indicator only in the explicit special mode is allowed when it
reveals no decoded payload, creates no navigation trap, and leaves no residual
layout change. A decoded payload, trap, or residual change rejects the profile.
An unavailable required special display is `BLOCKED`. Accessibility Assistant
is secondary; its unavailability is a fixed deviation, not a substitute for
NVDA and not independently gating.

## NVDA hard gate

Required configuration:

- Windows 11 with exact observed version/build;
- NVDA `2026.2`, no add-ons;
- bundled eSpeak NG with exact observed version, voice `English (America)`
  (`en-US`), variant `none`, rate `50`, pitch `50`, inflection `50`, volume
  `100`, and rate boost off;
- automatic language switching on and dialect switching off;
- punctuation/symbol level `all`, speech mode `talk`;
- desktop keyboard layout, US English Windows keyboard;
- typed-character echo on and typed-word echo off;
- character descriptions off;
- Unicode normalization on, report-normalized off, trust-voice-language on,
  and Unicode Consortium character/emoji data on;
- language, spelling-error, and link reporting on;
- font/style/formatting-change reporting off;
- braille off;
- Google Docs screen-reader support on, braille support off, collaborator
  announcements off, editing area in NVDA focus mode; and
- Word for Microsoft 365 in Print Layout with Track Changes, Show/Hide, and
  special formatting display off.

Exact safe Windows, NVDA, eSpeak NG, Chrome, Google Docs exposure, and Word
versions are recorded. Any mismatch or unreliable setting is `BLOCKED`.

For each application/case, open Speech Viewer, clear it between paired rows,
start at `Ctrl+Home`, and use:

- paragraph: `Ctrl+Down` / `Ctrl+Up`;
- word: `Ctrl+Right` / `Ctrl+Left`;
- character: Right / Left Arrow;
- selection: the same commands with Shift;
- position/edit: `Ctrl+F`, `Esc`, the direction-aware arrows above, uppercase
  `X`, `Ctrl+Z`, `Ctrl+Y`, Backspace, and Delete.

Google Docs uses `Ctrl+Alt+Z` to verify screen-reader support and `NVDA+Space`
to enter focus mode. A shortcut collision or browse-mode substitution is
`BLOCKED`.

Record only fixed codes for spoken-text parity, reading-order parity, extra
announcements, explicit joiner/non-joiner/control/blank/unknown-glyph speech,
navigation parity/traps, selection feedback, editing feedback, and Speech
Viewer parity after removing the identical pair prefix. Raw speech transcripts,
account data, document IDs, URLs, and usernames are prohibited.

Word Accessibility Assistant, an accessibility tree, or a non-NVDA screen
reader cannot fill missing NVDA evidence.

## Structural inspection contract

For each source and transformed DOCX, inspection returns fixed safe evidence
for:

- exact package and relationship safety;
- all candidate-alphabet occurrences, including damaged negative evidence;
- exactly one checksum-valid Alpha and Beta frame for a pass;
- exact part, paragraph, run indexes, code-point start, and logical anchor;
- ordinary versus non-ordinary context;
- exact visible rows after removing only validated frames;
- allowlisted legitimate Persian and emoji join controls;
- raw carrier-bearing NFC/NFKC and frozen segmentation evidence, kept separate
  from visible rows produced by removing only validated frames;
- direct and inherited hidden state through `docDefaults`, paragraph styles,
  character styles, and `basedOn` chains;
- redacted core metadata classifications; and
- macros, active content, package entries, relationships, and external targets.

The M2E inspector may call immutable M2D `inspectZeroWidthDocx` in transformed
mode and consume only its `safety`, `coreMetadata`, and effective property
findings attached to checksum-valid Alpha/Beta frames. It must independently
parse M2E body locations, rows, anchors, and legitimate join controls. Every
old M2D anchor/body/frame conclusion is ignored and cannot enter M2E evidence.

The inspector never repairs, normalizes, guesses, majority-votes, or partially
accepts a frame. Parseable unfavorable evidence returns fixed findings with a
successful inspection command. Missing/unreadable paths, malformed ZIP/XML, or
otherwise unparseable documents are operationally `BLOCKED`.

## Privacy-safe metadata and command output

DOCX core properties and PDF Info/XMP identity-bearing fields use only:

- `absent`
- `empty`
- `synthetic_expected`
- `non_synthetic_redacted`

DOCX classifications are `creator`, `lastModifiedBy`, and `otherCore`. The exact
value `Glyph synthetic research fixture` is `synthetic_expected` in either
`dc:creator` or `cp:lastModifiedBy`; it is not allowlisted in `otherCore`. Every
other non-empty DOCX value is `non_synthetic_redacted`. PDF classifications are
author, creator, producer, title, subject, keywords, creator tool, other Info,
and other XMP. No non-empty PDF metadata value is synthetically allowlisted in
v1; every non-empty PDF value is `non_synthetic_redacted`. Raw names and values
never enter objects, stdout, stderr, errors, fixtures, docs, logs, or records.

Any non-synthetic DOCX core classification requires deviation
`docx-core-metadata-redacted` and limitation
`docx-core-metadata-requires-privacy-review`. Any non-synthetic PDF
classification requires deviation `pdf-metadata-redacted` and limitation
`pdf-metadata-requires-privacy-review`. Missing either required code maps to
`metadata-privacy-unresolved`. Unknown fields aggregate under `otherCore`,
`otherInfo`, or `otherXmp`.

Commands emit only fixed identifiers, repository-relative artifact paths,
lowercase SHA-256 values, safe counts/locations, booleans, classifications, and
fixed codes. They never emit raw extracted text, clipboard text, frame code
points, URLs, relationship targets, metadata, or speech.

## Evidence vocabulary

### Primary and secondary observations

- parity: `parity` or `mismatch`
- presence: `absent` or `present`
- search: `both-rows-found` or `mismatch`
- body selection: `body-only` or `mismatch`
- special presentation: `none`, `generic-indicator-only`, or `decoded-payload`
- special navigation: `parity` or `trap`
- residual layout: `none` or `present`
- spellcheck comparison: `same` or `different`
- Latin Beta misspelling: `same`, `different`, or `not-applicable`
- Accessibility Assistant: `no-carrier-finding`, `carrier-related-finding`,
  `unavailable`, or `not-applicable`

`unavailable` is not a general evidence value. Required evidence that cannot be
observed reliably is `BLOCKED` outside the record.

### Ordered scientific failure codes

1. `canonical-structure-failed`
2. `source-frame-failed`
3. `source-anchor-failed`
4. `transformed-frame-failed`
5. `transformed-anchor-failed`
6. `visible-text-mismatch`
7. `carrier-presented`
8. `shaping-mismatch`
9. `grapheme-mismatch`
10. `bidi-order-mismatch`
11. `layout-mismatch`
12. `navigation-mismatch`
13. `search-mismatch`
14. `spellcheck-mismatch`
15. `clipboard-mismatch`
16. `insert-visible-mismatch`
17. `insert-frame-mismatch`
18. `undo-redo-mismatch`
19. `backspace-visible-mismatch`
20. `backspace-frame-mismatch`
21. `forward-delete-visible-mismatch`
22. `forward-delete-frame-mismatch`
23. `print-preview-mismatch`
24. `pdf-encrypted`
25. `pdf-page-count-mismatch`
26. `pdf-text-order-mismatch`
27. `pdf-placeholder-present`
28. `pdf-render-failed`
29. `pdf-render-mismatch`
30. `pdf-unsafe-content`
31. `specialized-view-decoded-payload`
32. `specialized-view-navigation-trap`
33. `specialized-view-residual-layout`
34. `hidden-property-present`
35. `unexpected-default-ignorable`
36. `normalization-mismatch`
37. `segmentation-mismatch`
38. `package-unsafe`
39. `relationship-unsafe`
40. `macro-or-active-content`
41. `metadata-privacy-unresolved`
42. `nvda-spoken-text-mismatch`
43. `nvda-reading-order-mismatch`
44. `nvda-extra-announcement`
45. `nvda-join-control-announcement`
46. `nvda-navigation-mismatch`
47. `nvda-navigation-trap`
48. `nvda-selection-feedback-mismatch`
49. `nvda-editing-feedback-mismatch`
50. `nvda-speech-viewer-mismatch`

Failure codes are unique and sorted in this order. Zero codes derives
`QUALIFY_PROFILE` with rationale `all-mandatory-criteria-passed`. One or more
derives `REJECT_PROFILE` with rationale `mandatory-criteria-failed`.

### Exhaustive derivation

Frame aggregate precedence is `mixed`, `duplicate`, `damaged`, `moved`,
`missing`, then `exact`. `mixed` means another carrier alphabet is present;
`duplicate` means an extra checksum-valid Alpha or Beta frame; `damaged` means
candidate-alphabet content cannot decode as one exact checksum-valid frame;
`moved` means exact frames exist only in a wrong part/context/row;
`missing` means a required frame has no occurrence; and `exact` means precisely
one valid Alpha and Beta occurrence. A missing frame has no invented occurrence
or location: `occurrences` is empty for that marker.

The validator derives codes from fields, recomputes each inspector's `findings`,
and requires exact equality. The mapping is exhaustive:

| Evidence predicate | Derived code |
| --- | --- |
| Any canonical inspection field violates its complete source expectation | `canonical-structure-failed` |
| Canonical/source `frameState != exact`, or a required occurrence is invalid/non-ordinary | `source-frame-failed` |
| Canonical/source occurrence anchor is not `expected` | `source-anchor-failed` |
| Any roundtrip/mutation `frameState != exact`, or a required occurrence is invalid/non-ordinary | `transformed-frame-failed` |
| Roundtrip occurrence is not `expected`, or mutation occurrence is not its exact `operation-expected` location | `transformed-anchor-failed` |
| Canonical/roundtrip `visibleTextState != exact`, or `primary.visibleText != parity` | `visible-text-mismatch` |
| Ordinary unselected carrier presentation is present, or `selectionPresentation == present` | `carrier-presented` |
| `primary.shaping != parity` | `shaping-mismatch` |
| `primary.graphemes != parity` | `grapheme-mismatch` |
| `primary.bidiOrder != parity` | `bidi-order-mismatch` |
| `primary.layout != parity` | `layout-mismatch` |
| `primary.navigation != parity` | `navigation-mismatch` |
| `primary.search != both-rows-found` | `search-mismatch` |
| Any spellcheck comparison is `different` | `spellcheck-mismatch` |
| TXT frame/visible state is not exact, row order differs, or selection scope is not `body-only` | `clipboard-mismatch` |
| Insert result visible consequence is not `expected` | `insert-visible-mismatch` |
| Insert result frame consequence/location is not exact | `insert-frame-mismatch` |
| Any restored checkpoint differs semantically from the fresh roundtrip, or an undo/redo action is unreliable after evidence exists | `undo-redo-mismatch` |
| Backspace result visible consequence is not `expected` | `backspace-visible-mismatch` |
| Backspace result frame consequence/location is not exact | `backspace-frame-mismatch` |
| Forward-delete result visible consequence is not `expected` | `forward-delete-visible-mismatch` |
| Forward-delete result frame consequence/location is not exact | `forward-delete-frame-mismatch` |
| `printPreview != parity` | `print-preview-mismatch` |
| `PdfInspection.encrypted == true` | `pdf-encrypted` |
| Unencrypted PDF page count is not exactly one | `pdf-page-count-mismatch` |
| Unencrypted PDF visible text is not exact and ordered | `pdf-text-order-mismatch` |
| Unencrypted PDF extracted carrier/placeholder state is present, or a successfully rendered PDF has `visualPlaceholder == present` | `pdf-placeholder-present` |
| Frozen renderer returns `failed` | `pdf-render-failed` |
| Any PDF visual page/layout/text-order value is `mismatch` | `pdf-render-mismatch` |
| Unencrypted PDF safety is unsafe, or any attachment/annotation/action/JavaScript count/state is nonzero/present | `pdf-unsafe-content` |
| Specialized presentation is `decoded-payload` | `specialized-view-decoded-payload` |
| Specialized navigation is `trap` | `specialized-view-navigation-trap` |
| Specialized residual layout is `present` | `specialized-view-residual-layout` |
| DOCX hidden property is `present` or `unresolved` | `hidden-property-present` |
| DOCX/TXT default-ignorable state is unexpected | `unexpected-default-ignorable` |
| NFC or NFKC state is `mismatch` | `normalization-mismatch` |
| Segmentation state is `mismatch` under matching frozen provenance | `segmentation-mismatch` |
| DOCX package safety is unsafe | `package-unsafe` |
| DOCX relationship safety is unsafe | `relationship-unsafe` |
| DOCX macro/active-content state is present | `macro-or-active-content` |
| A non-synthetic DOCX/PDF metadata classification lacks its required deviation or limitation | `metadata-privacy-unresolved` |
| NVDA spoken text is not parity | `nvda-spoken-text-mismatch` |
| NVDA reading order is not parity | `nvda-reading-order-mismatch` |
| NVDA extra announcements are present | `nvda-extra-announcement` |
| NVDA join-control announcement is present | `nvda-join-control-announcement` |
| NVDA navigation is not parity | `nvda-navigation-mismatch` |
| NVDA navigation trap is present | `nvda-navigation-trap` |
| NVDA selection feedback is not parity | `nvda-selection-feedback-mismatch` |
| NVDA editing feedback is not parity | `nvda-editing-feedback-mismatch` |
| NVDA Speech Viewer output is not parity after prefix removal | `nvda-speech-viewer-mismatch` |

An inspector's `findings` may contain only the codes derivable from its own
fields: DOCX uses structural, frame/anchor/visible, mutation, property,
Unicode, package, relationship, active-content, and metadata codes; TXT uses
clipboard and Unicode codes; PDF uses PDF and metadata codes. Primary,
specialized, print, and NVDA observation codes are derived only by the record
validator. Accessibility Assistant findings are secondary and never derive a
gate code.

## Scientific failure versus operational BLOCKED

Parseable candidate behavior is scientific evidence. Missing, damaged,
duplicate, moved, or mixed frames; visible differences; carrier presentation;
unsafe but parseable packages/PDFs; edit failures; PDF encryption; render
failure under the frozen renderer; or editor/NVDA parity failures derive fixed
failure codes and `REJECT_PROFILE`.

Only an absent or unreadable artifact, invalid path, schema violation,
record-to-file/hash/inspection mismatch, malformed or unparseable DOCX/PDF,
invalid UTF-8, missing/mismatched tool or segmentation provenance, incomplete
mandatory evidence, or explicitly unreliable observer/application state is
operationally `BLOCKED`. No `run-001.json` exists for `BLOCKED`.

## Recursively closed record schema

Every object rejects unknown or missing keys. Every array has the exact order
and cardinality below. Hashes are lowercase 64-character hexadecimal strings
and Git revisions are lowercase 40-character hexadecimal strings. Artifact-
evidence paths are repository-relative and confined to the M2E artifact root.
The four implementation-provenance paths must exact-match their schema literals
under `research/experiments`, `src`, and `scripts` and are never treated as
artifact paths.

```typescript
type MetadataClassification =
  | "absent"
  | "empty"
  | "synthetic_expected"
  | "non_synthetic_redacted";

type DocxCoreMetadataClassifications = Readonly<{
  creator: MetadataClassification;
  lastModifiedBy: MetadataClassification;
  otherCore: MetadataClassification;
}>;

type PdfMetadataClassifications = Readonly<{
  author: MetadataClassification;
  creator: MetadataClassification;
  producer: MetadataClassification;
  title: MetadataClassification;
  subject: MetadataClassification;
  keywords: MetadataClassification;
  creatorTool: MetadataClassification;
  otherInfo: MetadataClassification;
  otherXmp: MetadataClassification;
}>;

type FrameOccurrence = Readonly<{
  markerId: "alpha" | "beta" | null;
  checksumValid: boolean;
  context: "ordinary-body" | "non-ordinary";
  part: "word/document.xml" | "other-redacted";
  paragraphIndex: number;
  runIndices: readonly number[];
  startCodePointIndex: number;
  codePointCount: number;
  anchor: "expected" | "operation-expected" | "unexpected";
  finding: "none" | "damaged" | "duplicate" | "moved" | "mixed";
}>;

type SegmentationRow = Readonly<{
  rowIndex: 0 | 1 | 2 | 3;
  locale: "en-US" | "ar-SA" | "fa-IR" | "hi-IN";
  graphemeCount: number;
  wordLikeCount: number;
  paragraphCount: 1;
}>;

type DocxInspection = Readonly<{
  mode: "source" | "transformed";
  caseId: QualificationCaseId;
  checkpointId: QualificationCheckpointId;
  frameState: "exact" | "missing" | "damaged" | "duplicate" | "moved" | "mixed";
  occurrences: readonly FrameOccurrence[];
  visibleTextState: "exact" | "mismatch";
  hiddenPropertyState: "absent" | "present" | "unresolved";
  defaultIgnorableState: "allowlisted-only" | "unexpected";
  nfcState: "stable" | "mismatch";
  nfkcState: "stable" | "mismatch";
  segmentationState: "expected" | "mismatch";
  segmentation: readonly [SegmentationRow, SegmentationRow, SegmentationRow, SegmentationRow];
  nodeVersion: string;
  icuVersion: string;
  unicodeVersion: string;
  packageSafetyState: "safe" | "unsafe";
  relationshipSafetyState: "safe" | "unsafe";
  macroOrActiveContent: "absent" | "present";
  coreMetadata: DocxCoreMetadataClassifications;
  findings: readonly QualificationFailureCode[];
}>;

type TextInspection = Readonly<{
  caseId: QualificationCaseId;
  checkpointId: "roundtrip";
  lineEndings: "lf" | "crlf";
  frameState: "exact" | "missing" | "damaged" | "duplicate" | "moved" | "mixed";
  visibleTextState: "exact" | "mismatch";
  defaultIgnorableState: "allowlisted-only" | "unexpected";
  nfcState: "stable" | "mismatch";
  nfkcState: "stable" | "mismatch";
  segmentationState: "expected" | "mismatch";
  segmentation: readonly [SegmentationRow, SegmentationRow, SegmentationRow, SegmentationRow];
  nodeVersion: string;
  icuVersion: string;
  unicodeVersion: string;
  findings: readonly QualificationFailureCode[];
}>;

type PdfInspection = Readonly<{
  caseId: QualificationCaseId;
  encrypted: boolean;
  pageCount: number | null;
  visibleTextState: "exact-order" | "mismatch" | "not-inspectable-encrypted";
  carrierOrPlaceholderState: "absent" | "present" | "not-inspectable-encrypted";
  attachmentCount: number | null;
  annotationCount: number | null;
  javascriptState: "absent" | "present" | "not-inspectable-encrypted";
  launchActionState: "absent" | "present" | "not-inspectable-encrypted";
  uriActionState: "absent" | "present" | "not-inspectable-encrypted";
  unsafeActionState: "absent" | "present" | "not-inspectable-encrypted";
  metadata: PdfMetadataClassifications | "not-inspectable-encrypted";
  safetyState: "safe" | "unsafe" | "not-inspectable-encrypted";
  findings: readonly QualificationFailureCode[];
}>;

type DocxArtifactEvidence = Readonly<{
  path: string;
  sha256: string;
  sourceCanonicalSha256: string;
  inspection: DocxInspection;
}>;

type TextArtifactEvidence = Readonly<{
  path: string;
  sha256: string;
  sourceCanonicalSha256: string;
  inspection: TextInspection;
}>;

type PdfArtifactEvidence = Readonly<{
  path: string;
  sha256: string;
  sourceCanonicalSha256: string;
  inspection: PdfInspection;
  rendererVersion: "26.05.0";
  render: "rendered-one-page" | "failed" | "not-run-encrypted";
  visualPage: "parity" | "mismatch" | "not-observed-render-failed" | "not-observed-encrypted";
  visualLayout: "parity" | "mismatch" | "not-observed-render-failed" | "not-observed-encrypted";
  visualTextOrder: "parity" | "mismatch" | "not-observed-render-failed" | "not-observed-encrypted";
  visualPlaceholder: "absent" | "present" | "not-observed-render-failed" | "not-observed-encrypted";
}>;

type PrimaryObservationCodes = Readonly<{
  visibleText: "parity" | "mismatch";
  shaping: "parity" | "mismatch";
  graphemes: "parity" | "mismatch";
  carrierPresentation: "absent" | "present";
  layout: "parity" | "mismatch";
  bidiOrder: "parity" | "mismatch";
  navigation: "parity" | "mismatch";
  search: "both-rows-found" | "mismatch";
  clipboardSelection: "body-only" | "mismatch";
  selectionPresentation: "absent" | "present";
}>;

type SpellcheckObservationCodes = Readonly<{
  pairFindings: "same" | "different";
  pairSuggestionPresence: "same" | "different";
  latinBetaMisspelling: "same" | "different" | "not-applicable";
}>;

type SpecializedViewObservationCodes = Readonly<{
  presentation: "none" | "generic-indicator-only" | "decoded-payload";
  navigation: "parity" | "trap";
  residualLayout: "none" | "present";
}>;

type NvdaObservationCodes = Readonly<{
  spokenText: "parity" | "mismatch";
  readingOrder: "parity" | "mismatch";
  extraAnnouncements: "none" | "present";
  joinControlAnnouncement: "absent" | "present";
  navigation: "parity" | "mismatch";
  navigationTrap: "absent" | "present";
  selectionFeedback: "parity" | "mismatch";
  editingFeedback: "parity" | "mismatch";
  speechViewer: "parity" | "mismatch";
}>;

type MutationEvidence = Readonly<{
  target: QualificationMutationTarget;
  operation: "insert" | "backspace" | "forward-delete";
  result: DocxArtifactEvidence;
  restored: DocxArtifactEvidence;
  visibleConsequence: "expected" | "mismatch";
  frameConsequence: "exact" | "mismatch";
}>;

type EditorEvidence = Readonly<{
  editorId: "google-docs" | "microsoft-word";
  sourceCanonicalSha256: string;
  roundtrip: DocxArtifactEvidence;
  mutations: readonly [
    MutationEvidence, MutationEvidence, MutationEvidence, MutationEvidence,
    MutationEvidence, MutationEvidence, MutationEvidence, MutationEvidence,
    MutationEvidence, MutationEvidence, MutationEvidence, MutationEvidence,
  ];
  clipboard: TextArtifactEvidence;
  pdf: PdfArtifactEvidence;
  primary: PrimaryObservationCodes;
  spellcheck: SpellcheckObservationCodes;
  specializedView: SpecializedViewObservationCodes;
  printPreview: "parity" | "mismatch";
  accessibilityAssistant:
    | "no-carrier-finding"
    | "carrier-related-finding"
    | "unavailable"
    | "not-applicable";
  nvda: NvdaObservationCodes;
}>;

type CaseEvidence = Readonly<{
  caseId: QualificationCaseId;
  canonical: DocxArtifactEvidence;
  editors: readonly [EditorEvidence, EditorEvidence];
}>;

type ImplementationProvenance = Readonly<{
  gitRevision: string;
  protocolPath: "research/experiments/docx-join-control-accessibility-qualification-v1/protocol.md";
  protocolSha256: string;
  fixturePath: "research/experiments/docx-join-control-accessibility-qualification-v1/fixture.ts";
  fixtureSha256: string;
  generatorPath: "src/documents/docx/docx-join-control-accessibility-qualification-v1.ts";
  generatorSha256: string;
  validatorPath: "scripts/validate-docx-join-control-qualification-run.ts";
  validatorSha256: string;
  nodeVersion: string;
  icuVersion: string;
  unicodeVersion: string;
  uvVersion: "0.12.9";
  pythonVersion: "3.14.7";
  pythonUnicodeVersion: "16.0.0";
  pypdfVersion: "6.10.0";
  pdftoppmVersion: "26.05.0";
}>;

type MacEnvironment = Readonly<{
  macosVersion: string;
  chromeVersion: string;
  googleDocsVersion: "not-exposed";
  wordForMacVersion: string;
}>;

type WindowsNvdaEnvironment = Readonly<{
  windows11Version: string;
  nvdaVersion: "2026.2";
  espeakNgVersion: string;
  chromeVersion: string;
  googleDocsVersion: "not-exposed";
  wordMicrosoft365Version: string;
  keyboardLayout: "us-english-desktop";
  settingsProfile: "nvda-join-control-qualification-v1";
  synthesizer: "eSpeak NG";
  voice: "English (America)";
  voiceLanguage: "en-US";
  variant: "none";
  rate: 50;
  pitch: 50;
  inflection: 50;
  volume: 100;
  rateBoost: false;
  automaticLanguageSwitching: true;
  automaticDialectSwitching: false;
  punctuationLevel: "all";
  speechMode: "talk";
  typedCharacterEcho: true;
  typedWordEcho: false;
  characterDescriptions: false;
  unicodeNormalization: true;
  reportNormalized: false;
  trustVoiceLanguage: true;
  unicodeConsortiumData: true;
  reportLanguage: true;
  reportSpellingErrors: true;
  reportLinks: true;
  reportFontStyleFormattingChanges: false;
  braille: false;
  enabledAddOnCount: 0;
  googleDocsScreenReaderSupport: true;
  googleDocsBrailleSupport: false;
  googleDocsCollaboratorAnnouncements: false;
  googleDocsMode: "focus";
  wordView: "print-layout";
  wordTrackChanges: false;
  wordShowHide: false;
  wordSpecialFormattingDisplay: false;
}>;

type QualificationRunRecord = Readonly<{
  schemaVersion: 1;
  experimentId: "glyph-exp-docx-zero-width-join-control-qualification-v1-001";
  qualificationProfile: "docx-zero-width-join-control-qualification-v1";
  candidateId: "join-control-binary-v1";
  documentProfile: "docx-zero-width-join-control-v1";
  implementation: ImplementationProvenance;
  environments: Readonly<{
    macos: MacEnvironment;
    windowsNvda: WindowsNvdaEnvironment;
  }>;
  cases: readonly [CaseEvidence, CaseEvidence, CaseEvidence, CaseEvidence];
  deviations: readonly ProtocolDeviationCode[];
  limitations: readonly LimitationCode[];
  gate: Readonly<{
    failureCodes: readonly QualificationFailureCode[];
    decision: "QUALIFY_PROFILE" | "REJECT_PROFILE";
    rationale:
      | "all-mandatory-criteria-passed"
      | "mandatory-criteria-failed";
  }>;
}>;
```

Closed scalar unions omitted from the type block only for readability are
exactly:

- `QualificationCaseId`: `latin-operations-v1`,
  `arabic-persian-joining-v1`, `devanagari-emoji-graphemes-v1`, `mixed-bidi-v1`
- `QualificationMutationTarget`: `control-alpha`, `marked-alpha`,
  `control-beta`, `marked-beta`
- `QualificationCheckpointId`: `canonical`, `roundtrip`, and every target
  combined with the six operation/state suffixes frozen in Artifact matrix
- `ProtocolDeviationCode`: `docx-core-metadata-redacted`,
  `pdf-metadata-redacted`, `accessibility-assistant-unavailable`
- `QualificationFailureCode`: the 50 ordered codes above
- required `LimitationCode`, in this exact order:
  `tested-configurations-only`, `voiceover-not-assessed`,
  `other-screen-readers-not-assessed`, `no-universal-accessibility-claim`,
  `no-production-readiness-claim`, `no-pilot-readiness-claim`,
  `no-ai-ingestion-claim`, `no-model-compliance-claim`,
  `no-authorship-claim`, `no-prompt-reuse-claim`, `no-intent-claim`,
  `no-cheating-claim`, `no-misconduct-claim`
- conditional final `LimitationCode`, in this order:
  `docx-core-metadata-requires-privacy-review`,
  `pdf-metadata-requires-privacy-review`

Case order is the fixture-table order. Editor order is Google Docs then Word.
Deviations and conditional limitations are unique and protocol-ordered.
Canonical `sourceCanonicalSha256` equals its own hash. Every transformed source
hash equals its case canonical hash.

PDF states are discriminated exactly. When `encrypted` is true, `pageCount`,
attachment count, and annotation count are `null`; all inspection fields use
`not-inspectable-encrypted`; metadata uses the matching string sentinel;
render is `not-run-encrypted`; every visual field is
`not-observed-encrypted`; and `pdf-encrypted` is derived without fabricating
other evidence. When `encrypted` is false, no encrypted sentinel is allowed.
If its render is `failed`, all visual fields are
`not-observed-render-failed` and only the render failure is derived from those
fields. If it is `rendered-one-page`, no not-observed sentinel is allowed and
the four visual fields independently derive their fixed codes.

Metadata linkage is biconditional: each DOCX/PDF non-synthetic classification
requires its matching redaction deviation and privacy-review limitation, and
those codes are forbidden when no matching classification exists. Google Docs
Accessibility Assistant is always `not-applicable`. Word may use the other
three values; `unavailable` requires deviation
`accessibility-assistant-unavailable`, and that deviation is forbidden when no
Word case is unavailable.

## Mechanical validation and gate

Validation recomputes every artifact hash, re-runs the pure DOCX/TXT/PDF
inspectors, requires exact inspection equality, verifies source lineage,
recursively rejects unknown/missing fields, and rejects unsafe strings or raw
text/metadata/transcript content. It never invokes the create-only PDF renderer.

All four cases, both editors, 12 ordered mutation records per editor, both
clipboard and PDF outputs per case, primary/special/print evidence, and both
NVDA application paths are mandatory. A readable negative result remains in a
complete record and derives rejection. Missing or unreliable evidence blocks
record creation.

The decision is derived only from the sorted fixed failure codes:

- zero: `QUALIFY_PROFILE` / `all-mandatory-criteria-passed`
- one or more: `REJECT_PROFILE` / `mandatory-criteria-failed`

No criterion can be waived after observation. Candidate C is not part of this
qualification. No third decision exists.

## Pre-generation barrier and stop conditions

Before canonical generation:

1. independently review this protocol for science/accessibility and
   privacy/scope;
2. implement fixtures, generator, inspectors, commands, and validator
   test-first;
3. run full verification and immutable-old-experiment audits;
4. obtain independent protocol/science and code/privacy clearance; and
5. commit the stable implementation provenance.

Stop immediately if a canonical hash changes, an old experiment changes, a
command exposes prohibited data, an artifact path escapes its root, required
evidence is unreliable, or the frozen protocol would need revision. Never
regenerate, repair, tune, waive, infer, or fabricate a result.
