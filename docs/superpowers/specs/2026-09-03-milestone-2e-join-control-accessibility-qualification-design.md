# Milestone 2E Join-Control Accessibility and International-Text Qualification Design

Status: approved specification, 2026-09-03

## Decision

Milestone 2E will run one separately versioned qualification of the transport
winner selected by Milestone 2D:

- qualification profile: `docx-zero-width-join-control-qualification-v1`
- experiment ID: `glyph-exp-docx-zero-width-join-control-qualification-v1-001`
- experiment schema version: `1`
- candidate under test: `join-control-binary-v1`
- document profile under test: `docx-zero-width-join-control-v1`
- required primary editors: current desktop Google Docs in Chrome on macOS and
  current Microsoft Word for Mac
- required screen-reader configuration: NVDA `2026.2` on Windows 11, with
  Chrome for Google Docs and Microsoft Word for Microsoft 365

Candidate A is unchanged. This experiment does not alter its frame bytes,
ZWNJ/ZWJ bit mapping, marker count, logical anchor rule, run formatting, or
document profile. A change to any of those values requires a new carrier and a
new transport experiment rather than tuning this qualification in place.

The qualification may establish that the selected transport profile is safe
enough to advance within the explicitly tested editor, script, operation, and
screen-reader boundary. It does not establish universal accessibility,
production readiness, pilot readiness, AI ingestion, model compliance,
authorship, prompt reuse, intent, cheating, or misconduct.

Milestones 2, 2B, 2C, and 2D remain immutable historical experiments.

## Chosen approach

Three approaches were considered:

1. Treat Word Accessibility Assistant and programmatic accessibility trees as
   a complete accessibility test. This is rejected because neither reproduces
   actual speech, navigation, or editing behavior.
2. Require every platform and screen reader before collecting any evidence.
   This is scientifically strict but prevents useful editor, script, and
   operation evidence from being collected when one environment is absent.
3. Run a staged qualification with one strict final gate. This is selected.
   All available structural and editor evidence may be collected first, but a
   positive result remains impossible until the required NVDA workflows are
   complete and reliable.

VoiceOver is not part of this versioned experiment. Its omission is an explicit
tested-boundary limitation, not evidence about VoiceOver behavior. Word
Accessibility Assistant and accessibility-tree diagnostics may provide
secondary evidence but never substitute for NVDA.

## Question

For the exact `docx-zero-width-join-control-v1` profile, do the two framed
ZWNJ/ZWJ markers preserve visible text, shaping, bidirectional reading order,
ordinary editing behavior, and screen-reader behavior across the supported
Google Docs and Microsoft Word workflows closely enough to qualify the profile
inside the tested boundary?

## Frozen frame and placement

The experiment imports the exact frame codec and fixed synthetic Alpha/Beta
frames from Milestone 2D. Each case contains exactly one Alpha frame and one
Beta frame. Each frame remains a separate ordinary body run immediately after
punctuation and before an ordinary space.

The carrier run has no hidden-text property, font-size change, scaling,
spacing, color, shading, highlighting, positioning, field, text box, comment,
header, footer, footnote, endnote, or other hiding mechanism.

Every marked paragraph has an adjacent marker-free control paragraph. Removing
the exact framed carrier run from the marked paragraph must produce the control
paragraph byte-for-byte. Controls and marked paragraphs use the same style,
language metadata, direction, and layout.

## Frozen synthetic case matrix

The qualification uses four independent DOCX cases. Text is synthetic or a
short neutral language sample selected only to exercise Unicode behavior. It
contains no assignment, student work, personal data, directive, credential, or
real fingerprint value.

### Case 1: Latin operations

Exercises the production-like punctuation-and-space anchor in left-to-right
English text, including a fixed deliberate misspelling near but not inside an
anchor. This case measures ordinary display, search, spellcheck parity,
character and word navigation, selection, copy/paste, insert, undo, redo,
backspace, forward-delete, and frame survival.

### Case 2: Arabic and Persian joining

Uses paired Arabic and Persian paragraphs containing ordinary joining and a
legitimate Persian ZWNJ elsewhere in visible text. The framed carrier remains
only at the frozen punctuation-and-space anchor. This distinguishes legitimate
visible-text join-control behavior from the marker frame and measures whether
the frame changes shaping, segmentation, spelling behavior, caret movement, or
spoken output.

### Case 3: Devanagari and emoji graphemes

Uses paired Devanagari conjunct text and a standard emoji ZWJ sequence in
visible text. The carrier remains at the frozen anchor. This measures whether
the long alternating ZWNJ/ZWJ frame changes grapheme rendering, navigation,
selection, deletion, or speech outside its run.

### Case 4: mixed bidirectional text

Uses paired left-to-right and right-to-left text with neutral punctuation,
Latin digits, and one fixed neutral alphanumeric token that is not a URL or
link. This measures visual order, logical reading order, selection,
character/word navigation, search, copy/paste, and export without introducing
bidirectional control characters.

Exact strings, code points, paragraph order, language metadata, direction,
fonts, and anchors are frozen in the protocol before canonical generation.
They may not be changed after observing an editor.

## Canonical artifacts

Ignored canonical artifacts live under:

`research/artifacts/docx-join-control-accessibility-qualification-v1/`

The four canonical filenames are:

- `latin-operations-v1.docx`
- `arabic-persian-joining-v1.docx`
- `devanagari-emoji-graphemes-v1.docx`
- `mixed-bidi-v1.docx`

Each canonical file receives independent Google Docs and Word DOCX round trips,
UTF-8 plain-text clipboard outputs, print-preview observations, and PDF exports.
Each mutation is run on a fresh canonical import/open and receives its own DOCX
checkpoint for both editors and all four cases. PDF files are ignored research
evidence only; this experiment does not add PDF generation to Glyph's product.

Generators refuse to replace an existing regular file or symbolic link. After
first generation, canonical hashes are frozen. A mismatch stops the run.

## Structural and Unicode inspection

The inspector must prove, for every canonical and transformed DOCX:

- the expected package and relationship safety properties;
- exactly one checksum-valid Alpha frame and one checksum-valid Beta frame;
- exact ordinary-body part, paragraph, run, and code-point locations;
- no unexpected ZWNJ, ZWJ, bidirectional controls, or other default-ignorable
  characters outside allowlisted visible-language samples and exact frames;
- exact visible paragraphs after removing only validated frames;
- NFC and NFKC observations without mutation;
- grapheme, word, and line segmentation observations using the installed
  platform primitives;
- direct and inherited hidden-property state;
- safe redacted core-metadata classifications; and
- absence of macros, active content, unresolved relationships, and external
  relationship targets.

The inspector never repairs, guesses, normalizes, majority-votes, or partially
accepts a frame. Readable negative evidence remains recordable; malformed or
unsafe packages fail closed.

## Editor protocol

Every canonical artifact is independently imported into a new unshared Google
Docs document and independently opened in Word. An editor round trip is never
used as the other editor's source.

Before selection, search, editing, spellcheck, accessibility surfaces, or
special display modes, record at 100%:

- exact control/marked visible-text parity;
- shaping and grapheme parity;
- visible carrier or placeholder behavior;
- line wrapping and layout disturbance; and
- left-to-right and right-to-left visual order.

Then run the frozen operation sequence once per required case. Every mutating
operation starts from an independent fresh canonical import/open so no earlier
operation can affect later evidence. The identical visible operation is applied
at the corresponding logical position in the control and marked paragraphs.
The post-operation state is saved as its own DOCX checkpoint and structurally
inspected before that editor copy is discarded:

1. navigate by paragraph, word, and character across each anchor;
2. search for fixed visible substrings that cross each logical anchor;
3. compare the fixed spellcheck observation with the adjacent control;
4. select and copy the ordinary body once;
5. paste once as UTF-8 plain text;
6. on a fresh copy, insert one fixed visible character at each equivalent
   control/marked position, undo once, redo once, save the redone state, undo
   again, and save the restored state;
7. on a fresh copy, perform one fixed backspace at each equivalent position,
   save the result, undo once, and save the restored state;
8. on a fresh copy, perform one fixed forward-delete at each equivalent
   position, save the result, undo once, and save the restored state; and
9. on a fresh copy, open print preview and export one PDF.

The protocol records observable parity and exact structural consequences for
both the marked and control paragraphs. It does not assume that a frame
survives an operation merely because the visible text looks unchanged. PDF
inspection records rendered-page parity, page count, extracted text order,
unexpected control placeholders, and safety findings without treating PDF as a
supported Glyph output format.

PDF inspection is read-only and bounded. It requires a parseable, unencrypted
PDF; exact expected page count and ordered synthetic visible text; no extracted
join-control frame, replacement/control placeholder, embedded file, JavaScript,
launch action, external URI action, or unexpected annotation; and renderable
pages for paired visual comparison. It never executes an action or follows a
relationship. Raw extracted text and rendered pages remain ignored evidence and
never enter logs or the tracked run record.

PDF Info and XMP metadata are inspected without returning raw values. Author,
creator, producer, title, subject, keywords, creator-tool, and other
identity-bearing values use only `absent`, `empty`, `synthetic_expected`, or
`non_synthetic_redacted`. A non-synthetic classification requires the fixed
`pdf-metadata-redacted` protocol deviation and
`pdf-metadata-requires-privacy-review` distribution limitation. Raw metadata
never enters command output, errors, logs, tests, documentation, or the tracked
record.

After primary observations, enable Word Show/Hide and Google Docs' available
non-printing-character display. Record any glyph, placeholder, selection
artifact, navigation trap, or material layout change. A generic indicator that
appears only while an explicit non-printing-character mode is enabled is an
allowed, recorded inspectability limitation when it reveals no decoded payload,
causes no navigation trap, and disappears without residual layout change when
the mode is disabled. A specialized mode is never reclassified as an ordinary
view.

Word Accessibility Assistant runs only after primary observations. Its fixed
finding codes are recorded without applying suggested changes.

## Required NVDA protocol

The same unchanged canonical artifacts are tested on Windows 11 with NVDA
`2026.2` and one configuration frozen in the protocol before canonical
generation. The record captures safe exact versions/builds for Windows, NVDA,
its bundled eSpeak NG
synthesizer, Chrome, Google Docs when available, and Word. No NVDA add-ons are
enabled. The fixed settings are:

- bundled eSpeak NG synthesizer and the protocol-frozen voice;
- automatic language switching enabled and automatic dialect switching
  disabled;
- punctuation/symbol level `all`;
- speech mode `talk`;
- desktop keyboard layout;
- typed-character echo enabled and typed-word echo disabled;
- character descriptions disabled;
- reporting of language, spelling errors, and links enabled;
- reporting of font, style, and formatting changes disabled;
- braille disabled;
- Google Docs screen-reader support enabled, braille support disabled, and
  collaborator announcements disabled;
- Google Docs editing area in focus mode for all reading and editing commands;
  and
- Word in Print Layout with Track Changes, Show/Hide, and special formatting
  display disabled during the NVDA phase.

The protocol freezes the exact key sequences for paragraph, word, character,
selection, insert, undo/redo, backspace, and forward-delete navigation. A
settings or version mismatch is `BLOCKED`, not an alternate configuration.

The required application paths are:

- Google Docs in current Chrome with screen-reader support enabled; and
- current Microsoft Word for Microsoft 365 in Print Layout.

For each case, NVDA reads the control and marked paragraphs using paragraph,
word, and character navigation. The observer records fixed codes for:

- spoken-text parity;
- reading-order parity;
- extra pauses or announcements;
- announcements of joiners, non-joiners, controls, blanks, or unknown glyphs;
- extra navigation stops or trapped caret movement;
- selection and editing feedback; and
- exact Speech Viewer output parity between the marked paragraph and its
  control after removal of fixed row labels.

No subjective language-comprehension judgment is used. Multilingual speech
quality outside the marked-versus-control difference is outside this carrier
qualification.

Speech Viewer may be used for reliable observation, but the record contains
only fixed result codes. No account, document ID, URL, username, or raw
environment transcript is persisted.

If NVDA, the application, or Speech Viewer cannot provide reliable evidence,
the run is operationally `BLOCKED`. Word Accessibility Assistant or a platform
accessibility tree cannot fill the missing field.

## Security review

The qualification records that ZWNJ and ZWJ are default-ignorable join controls
with legitimate linguistic uses and security-sensitive misuse potential. The
review checks:

- exact frame and anchor allowlisting;
- rejection of raw or malformed join-control sequences;
- rejection of join controls in identifiers, links, filenames, metadata, or
  browser-facing contracts;
- absence of bidirectional control characters;
- bounded frame length and marker count;
- explicit inspectability/removability language; and
- downstream normalization and segmentation behavior.

This is a bounded document-profile review, not a claim that arbitrary invisible
Unicode encoding is safe.

## Mechanical gate

`BLOCKED` is an operational state outside the completed run record. Missing,
unreliable, mismatched, or uninspectable mandatory evidence produces `BLOCKED`
and no scientific decision.

A complete run ends in exactly one decision:

- `QUALIFY_PROFILE`: every mandatory structural, visual, shaping, bidi,
  operation, security, and NVDA criterion passes in both editors.
- `REJECT_PROFILE`: at least one mandatory structural, visual, shaping, bidi,
  operation, PDF/print, security, or NVDA criterion fails.

The validator derives the decision mechanically. `QUALIFY_PROFILE` requires:

- all canonical and round-trip hashes and source links match;
- both frames are exact, checksum-valid, and at the frozen anchors;
- visible text, shaping, graphemes, bidi order, and required layout match the
  marker-free controls;
- ordinary views contain no carrier presentation; specialized modes reveal no
  decoded payload and cause no navigation trap or persistent layout change;
- search, spellcheck, copy/paste, insert, undo/redo, backspace, and delete meet
  their exact parity rules;
- print preview and exported PDF retain control/marked rendering, layout,
  extracted-text order, and placeholder parity in both editors;
- no forbidden property, package-safety, normalization, segmentation, or
  security finding exists;
- NVDA spoken text, order, navigation, selection, and editing feedback match
  the controls in both applications; and
- every required limitation and metadata classification is present.

The validator uses an exhaustive ordered mapping: missing or unreliable
mandatory evidence is operationally `BLOCKED`; otherwise zero mandatory
failure codes yields `QUALIFY_PROFILE`, and one or more mandatory failure codes
yields `REJECT_PROFILE`. The record stores the sorted fixed failure codes and a
single matching rationale code. It contains no judgment about whether a future
carrier revision might succeed.

No criterion may be waived after observation. A carrier change requires a new
versioned transport candidate; a qualification-fixture or gate change requires
a new versioned qualification.

## Record and privacy boundary

The run record uses an exact recursively closed schema, fixed enums, lowercase
SHA-256 hashes, exact application/platform versions, and deterministic gate
codes. Free-form observations, screenshots, speech transcripts, document IDs,
URLs, account data, personal metadata, raw frame code points, and clipboard
content are prohibited from the tracked record.

Generated DOCX and TXT artifacts remain ignored. Transformed artifacts with
non-synthetic core metadata receive a redacted classification, protocol
deviation, and distribution limitation. They are not shared without privacy
review.

The record retains these limitations even after `QUALIFY_PROFILE`:

- tested configurations only;
- VoiceOver not assessed;
- other screen readers not assessed;
- no universal accessibility claim;
- no production- or pilot-readiness claim;
- no AI-ingestion or model-compliance claim;
- no authorship, prompt-reuse, intent, cheating, or misconduct claim.

## Implementation boundary

Milestone 2E may add only:

- this approved design and a frozen protocol;
- versioned synthetic fixtures;
- minimal reuse of the Milestone 2D frame codec and DOCX safety inspection;
- qualification-specific DOCX generation and inspection;
- minimal qualification-specific read-only PDF safety, extraction, and render
  inspection;
- privacy-safe commands and strict record validation;
- focused tests, documentation, and a durable progress/handoff ledger; and
- ignored experimental artifacts.

It does not begin Milestone 3, generated markers, FingerprintEngine,
ExactCanary, semantic canaries, model testing, Supabase, persistence, Protect,
Analyze, authentication, UI, deployment, or a real-student workflow.

## Verification and review

Before any canonical generation:

- freeze and review the protocol, strings, code points, anchors, operations,
  schema, gate, and artifact names;
- complete fixture, frame, generator, inspector, command-safety, validator, and
  adversarial tests;
- verify all completed experiment trees and old artifacts are immutable; and
- obtain independent protocol/science and code/privacy reviews.

After evidence collection:

- install with the frozen lockfile;
- run lint, typecheck, full tests, and production build;
- run old-carrier and M2D regressions;
- validate every artifact hash and source link;
- validate the completed record and mechanical gate;
- audit secrets, privacy, ignored artifacts, old experiments, milestone
  leakage, full diff, and Git status; and
- obtain fresh independent protocol/science, code/safety, and privacy/history
  reviews.

A verified branch may be pushed to the canonical repository. It is not merged
and no pull request is opened without explicit authorization.

## Durable migration handoff

The progress ledger must always state the active branch, base commit, latest
verified commit, immutable artifact hashes, completed observations, remaining
manual or external-environment work, verification results, review findings,
and exact next command. This allows the work to move to a future task or model
without reconstructing scientific state from chat history.

## Standards and platform references

- Unicode Technical Standard #39, joining controls and default-ignorable
  security considerations: <https://www.unicode.org/reports/tr39/>
- Google Docs screen-reader configuration and supported workflows:
  <https://support.google.com/docs/answer/6282736>
- Microsoft Word screen-reader support:
  <https://support.microsoft.com/en-US/accessibility/word/screen-reader-support-for-word>
- NVDA 2026.2 release and download hash:
  <https://www.nvaccess.org/post/nvda-2026-2/>
