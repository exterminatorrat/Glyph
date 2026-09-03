# Milestone 2D Zero-Width Carrier Bake-Off Design

Status: approved design for specification, 2026-09-03

## Decision

Milestone 2D will run one separately versioned DOCX transport bake-off for the
strongest zero-width carrier variants justified by the completed Milestone 2C
evidence.

The experiment identifiers are:

- bake-off profile: `docx-zero-width-carrier-bakeoff-v1`
- experiment ID: `glyph-exp-docx-zero-width-carrier-bakeoff-v1-001`
- experiment schema version: `1`
- Candidate A: `join-control-binary-v1`
- Candidate A document profile: `docx-zero-width-join-control-v1`
- Candidate B: `invisible-operator-binary-v1`
- Candidate B document profile: `docx-zero-width-invisible-operator-v1`
- Candidate C: `variation-selector-byte-v1`
- Candidate C document profile: `docx-zero-width-variation-selector-v1`

Candidates A and B are selectable transport candidates. Candidate C is a
non-selectable transport diagnostic because arbitrary variation-selector data
encoding is not a sanctioned general-purpose Unicode mechanism.

The bake-off qualifies document transport and ordinary presentation only. A
selection result advances one document profile to a separate accessibility and
international-text qualification. It does not establish accessibility safety,
pilot readiness, production readiness, AI ingestion, model compliance,
authorship, prompt reuse, intent, cheating, or misconduct.

Milestone 2, Milestone 2B, and Milestone 2C remain immutable historical
experiments. This experiment does not modify their protocols, fixtures,
generators, inspectors, records, or artifacts.

## Why another versioned experiment is required

Milestone 2C established bounded transport for `matching-color-body-v2`:

- the canonical source and both independent DOCX round trips preserved Alpha
  and Beta in ordinary body content;
- both ordinary clipboard copies preserved both markers and the visible body;
- Google Docs and Microsoft Word kept the marker strings invisible in required
  ordinary views;
- Google Docs selection revealed the marker strings;
- Microsoft Word Accessibility Assistant reported two hard-to-read contrast
  findings; and
- full-length invisible text occupied enough width to create conspicuous gaps
  and wrapping changes in Google Docs and in Word light and dark page views.

The frozen Milestone 2C gate therefore returned `REVISE_CARRIER`. The carrier
cannot be shortened, compressed, repositioned, or otherwise tuned in place.

Milestone 2D changes the payload representation rather than weakening the
presentation gate. It keeps the same visible fixture and logical insertion
points while replacing full-width marker strings with independently decodable
zero-width code-point frames.

## Goals

Milestone 2D must determine whether either selectable carrier can:

1. preserve two independently identifiable fixed research markers through
   Google Docs and Microsoft Word DOCX round trips;
2. preserve both markers through ordinary body selection and plain-text copy;
3. remain absent from ordinary visual presentation without replacement glyphs
   or control placeholders;
4. produce no observable spacing, wrapping, shaping, pagination, or visible
   body disturbance;
5. retain an exact, checksum-valid frame rather than relying on fuzzy recovery;
6. preserve the frozen three-paragraph visible fixture exactly after carrier
   removal; and
7. keep package-safety findings clean.

## Non-goals

Milestone 2D does not:

- generate assignment-specific or secret markers;
- implement a fingerprint strategy, matching profile, or plugin framework;
- test model ingestion, model responses, model compliance, or prompt reuse;
- determine authorship, intent, cheating, or misconduct;
- run VoiceOver or another screen reader;
- establish international-script safety;
- implement Protect, Analyze, authentication, persistence, Supabase, UI, or
  deployment work;
- sanitize, rewrite, or distribute transformed editor artifacts; or
- revise a candidate after its canonical artifact is frozen.

## Frozen visible fixture and placement

The experiment imports rather than duplicates these values from the completed
synthetic fixture:

- visible fixture ID: `synthetic-library-hours-v1`
- the same three visible body paragraphs used by Milestones 2, 2B, and 2C

The logical marker positions remain:

- Alpha: immediately after the first sentence-ending full stop in body
  paragraph 0 and before the existing ordinary space;
- Beta: immediately after the first sentence-ending full stop in body
  paragraph 2 and before the existing ordinary space.

Each candidate places its encoded frame in one separate ordinary body run at
those locations. The carrier run has no `w:vanish`, explicit font size,
character scaling, character spacing, shading, highlighting, theme color,
positioning, text box, field, comment, header, footer, footnote, endnote, or
other hiding mechanism.

Removing the two carrier runs must yield the three frozen visible paragraphs
exactly and in order.

## Shared logical frame

All three candidates encode the same bytes so the experiment compares carrier
mechanisms rather than payload content.

Each marker frame contains, in this order:

1. two magic bytes: `0x47 0x5A` (`GZ`);
2. one frame-version byte: `0x01`;
3. one marker-ID byte: `0xA1` for Alpha or `0xB2` for Beta;
4. one payload-length byte: `0x08`;
5. one fixed eight-byte synthetic payload:
   - Alpha: `47 4C 59 50 48 41 30 31` (`GLYPHA01`);
   - Beta: `47 4C 59 50 48 42 30 31` (`GLYPHB01`);
6. a two-byte CRC-16/CCITT-FALSE checksum over the preceding thirteen bytes,
   serialized most-significant byte first.

Each complete logical frame is fifteen bytes. The frame contains fixed
research values only. It is not a secret, credential, fingerprint, or real
assignment marker.

The two complete frame byte sequences are frozen as:

- Alpha: `47 5A 01 A1 08 47 4C 59 50 48 41 30 31 7D 62`;
- Beta: `47 5A 01 B2 08 47 4C 59 50 48 42 30 31 01 6B`.

The checksum parameters are frozen:

- width: `16`
- polynomial: `0x1021`
- initial value: `0xFFFF`
- reflect input: `false`
- reflect output: `false`
- final XOR: `0x0000`

Decoding succeeds only when the exact carrier alphabet, frame length, magic,
version, marker ID, payload length, payload, and checksum are valid.

The inspector never repairs, normalizes, guesses, majority-votes, or partially
accepts a damaged frame. Duplicate, truncated, reordered, mixed-alphabet,
checksum-invalid, or unexpected extra frames fail that candidate observation.

## Candidate A: framed join-control binary

Candidate A encodes each frame bit from most-significant to least-significant:

- bit `0`: `U+200C ZERO WIDTH NON-JOINER`
- bit `1`: `U+200D ZERO WIDTH JOINER`

A fifteen-byte frame therefore produces exactly 120 carrier code points.

This is the first-priority selectable candidate because the two BMP join
controls have legitimate use in writing systems and therefore exercise a
widely implemented text-preservation path. The frame remains positioned after
punctuation and before an ordinary space so neither control is adjacent to a
visible letter in the frozen English fixture.

This placement reduces but does not eliminate the mechanism's later
international-text and accessibility risk. Join controls can affect shaping in
legitimate linguistic contexts and default-ignorable characters carry known
security concerns. A transport selection cannot waive the later qualification.

## Candidate B: framed invisible-operator binary

Candidate B encodes each frame bit from most-significant to least-significant:

- bit `0`: `U+2062 INVISIBLE TIMES`
- bit `1`: `U+2063 INVISIBLE SEPARATOR`

A fifteen-byte frame therefore produces exactly 120 carrier code points.

This is the second-priority selectable candidate. Both code points are BMP
format controls with no intended visible glyph. Unlike Candidate A, they do not
control cursive joining. Unlike zero-width space, they do not intentionally
introduce line-break opportunities.

Their Unicode semantics describe mathematical contiguity. Arbitrary marker
encoding is outside that intended semantic use and may be exposed by assistive
technology or filtered by editors. Those risks are recorded and remain subject
to the later accessibility and international-text gate.

## Candidate C: compact variation-selector bytes

Candidate C maps each complete byte to one variation selector:

- byte values `0x00` through `0x0F`: `U+FE00` through `U+FE0F`;
- byte values `0x10` through `0xFF`: `U+E0100` through `U+E01EF`, with
  `codePoint = 0xE0100 + (byte - 0x10)`.

A fifteen-byte frame therefore produces exactly fifteen carrier code points.
The sequence follows the same preceding full stop used as the logical carrier
anchor.

Candidate C is compact and exercises a supplementary-plane preservation path,
but it is permanently non-selectable. Unicode variation selectors are intended
to select standardized or registered glyph variants, not to serve as a general
data-extension mechanism. Repeated arbitrary selectors may be ignored,
filtered, or exposed by special display modes. Candidate C can explain editor
transport behavior but cannot produce the bake-off winner.

## Rejected carrier variants

The experiment excludes:

- `U+200B ZERO WIDTH SPACE`, because it intentionally creates line-break
  opportunities and can affect justification;
- `U+2060 WORD JOINER`, because it intentionally suppresses line breaks;
- soft hyphen, because it can become visibly rendered at a line break;
- bidirectional controls or isolates, because they can alter reading order;
- tag characters, because their conformant modern use is tied to defined tag
  protocols rather than arbitrary hidden data;
- private-use characters, because missing-font rendering can expose visible
  replacement glyphs;
- combining marks, because they can alter grapheme formation or visible glyphs;
- full-width text with negative spacing or character scaling, because that
  retains the Milestone 2C width mechanism and adds fragile formatting;
- hidden text, headers, comments, custom XML, document properties, and related
  non-body carriers already outside the ordinary clipboard requirement; and
- a composite or redundant multi-mechanism candidate, because it would prevent
  attribution of survival or failure to one frozen carrier mechanism.

## Canonical artifacts and immutability

The ignored artifact directory is:

`research/artifacts/docx-zero-width-carrier-bakeoff-v1/`

Canonical source filenames are:

- `join-control-binary-v1.docx`
- `invisible-operator-binary-v1.docx`
- `variation-selector-byte-v1.docx`

Each candidate uses exactly these transformed filename suffixes, appended to
the candidate ID:

- `-google-docs-roundtrip.docx`
- `-google-docs-copy-plain-text.txt`
- `-microsoft-word-roundtrip.docx`
- `-microsoft-word-copy-plain-text.txt`

For example, Candidate A's Google Docs DOCX output is
`join-control-binary-v1-google-docs-roundtrip.docx`. These rules freeze all
twelve transformed artifact filenames without allowing aliases.

Every generator must refuse to replace an existing file or symbolic link.
Automated tests generate only in memory or in disposable temporary
directories. They never invoke the real canonical artifact paths.

Before either editor opens, all three canonical artifacts are generated once,
hashed with SHA-256, structurally inspected, and frozen. A second invocation
must refuse replacement and leave every hash unchanged.

No canonical or transformed artifact is committed. If an expected artifact
hash changes at any point, execution stops and reports the discrepancy.

## Structural inspection contract

The candidate-aware inspector records for each source or transformed DOCX:

- package entries;
- every occurrence of any candidate-alphabet code point;
- OOXML part, body/non-body location, paragraph index, run index, and code-point
  indexes;
- exact encoded code-point sequence and count;
- decoded frame fields and checksum status;
- Alpha/Beta exact presence;
- unexpected, duplicate, damaged, or mixed-alphabet carrier sequences;
- the visible paragraphs after exact candidate-carrier removal;
- NFC and NFKC stability as `unchanged` or `changed`, computed read-only;
- forbidden run properties;
- external relationships and unresolved relationship targets;
- active content entries and relationship types; and
- macro content types.

Normalization is observational evidence only. The inspector always validates
the original bytes and code points. A frame that becomes recoverable only after
normalization fails.

Source inspection additionally requires exactly one Alpha and one Beta frame
in the frozen body positions and no candidate-alphabet code points elsewhere.

Transformed inspection tolerates benign package and run changes only when the
exact frame, body placement, visible fixture, and safety requirements remain
true.

## Privacy-preserving DOCX metadata audit

The inspector separately examines `docProps/core.xml` without returning or
logging personal values. It records only these classifications for
`dc:creator` and `cp:lastModifiedBy`:

- `absent`
- `empty`
- `synthetic_expected`
- `non_synthetic_redacted`

The canonical generators use one fixed synthetic value if the DOCX library
requires those properties. Any different non-empty transformed value is
classified as `non_synthetic_redacted`; its original text never enters the run
record, test output, logs, documentation, or Git.

Non-synthetic editor metadata does not alter the carrier transport gate because
it is editor behavior rather than marker survival. It creates a mandatory
protocol deviation and distribution limitation. Any affected ignored artifact
must not be distributed without a separate privacy review.

## Independent editor workflows

The same three frozen canonical sources are tested independently in:

1. Google Docs in current desktop Chrome on macOS;
2. Microsoft Word for Mac.

The order is fixed: Candidate A, Candidate B, then Candidate C. Every candidate
uses a new unshared Google Docs document and a fresh independent Word opening.
No transformed artifact becomes another editor's input.

If automation cannot reliably make a required upload, visual, export,
clipboard, or save observation, execution stops as operationally `BLOCKED`.
No filename or assumed application behavior substitutes for evidence.

### Google Docs workflow per candidate

1. Create a new unshared Google Docs document.
2. Import the candidate's unchanged canonical DOCX.
3. At 100% document zoom in default paginated white-page view, observe the
   frozen body, marker or placeholder visibility, and layout before selecting,
   searching, copying, or inspecting accessibility surfaces.
4. Export Microsoft Word DOCX to the frozen candidate-specific transformed
   filename.
5. Click once in the ordinary body, select the body exactly once, and record
   whether any marker, placeholder, or selection artifact becomes visible.
6. Copy exactly once, paste as UTF-8 plain text, and save the candidate-specific
   clipboard artifact.

Google Docs dark-page and screen-reader behavior remain `not_assessable` and
are not emulated with extensions, custom styles, or operating-system changes.

### Microsoft Word workflow per candidate

1. Open the unchanged canonical source directly.
2. At 100% in ordinary light-page Print Layout, observe the frozen body,
   carrier or placeholder visibility, and layout before selection.
3. At 100% in Word's built-in dark page/canvas mode, repeat the observation.
4. Save a DOCX copy to the frozen candidate-specific transformed filename.
5. Return to ordinary body content, click once, select the body exactly once,
   and record whether any carrier, placeholder, or selection artifact becomes
   visible.
6. Copy exactly once, paste as UTF-8 plain text, and save the candidate-specific
   clipboard artifact.
7. After all primary transport and presentation observations, run Word
   Accessibility Assistant and record its factual findings without applying a
   suggested fix.

Word screen-reader behavior remains `not_assessable` in this transport-only
bake-off.

## Presentation observations

Every required ordinary view records:

- zoom percentage;
- visible body integrity;
- carrier presentation:
  - `not_visible`
  - `visible_marker_or_codepoint`
  - `replacement_or_control_placeholder`
- layout disturbance:
  - `none_observed`
  - `minor`
  - `material`
- concise factual notes.

Any `minor` or `material` layout disturbance fails the selectable transport
gate. The experiment does not reinterpret a small disturbance as acceptable.

Selection records one of:

- `nothing_observed`
- `carrier_or_placeholder_revealed`
- `not_assessable`

Selection behavior is retained evidence but is not independently
disqualifying. Ordinary-view visibility and layout remain gate inputs.

## Clipboard inspection

Each saved clipboard artifact is inspected independently as Unicode plain text.
The inspection records:

- exact byte length and SHA-256;
- valid UTF-8 status;
- exact candidate-code-point sequence;
- decoded Alpha/Beta frames and checksum status;
- unexpected, duplicate, damaged, or mixed-alphabet sequences;
- NFC and NFKC stability; and
- the exact three visible paragraphs after candidate-carrier removal.

Clipboard survival passes only when both exact frames decode and the visible
body matches. A successful copy action, non-empty clipboard, or partially
recoverable frame does not pass.

## Candidate transport pass

A selectable candidate passes only when all of these conditions are true:

1. its canonical source satisfies the exact carrier, placement, body, checksum,
   and package-safety contract;
2. its Google Docs DOCX round trip preserves exact Alpha and Beta frames and the
   frozen visible body with clean safety findings;
3. its Word DOCX round trip preserves exact Alpha and Beta frames and the frozen
   visible body with clean safety findings;
4. its Google Docs clipboard artifact preserves exact Alpha and Beta frames and
   the frozen visible body;
5. its Word clipboard artifact preserves exact Alpha and Beta frames and the
   frozen visible body;
6. Google Docs ordinary view reports `not_visible` and `none_observed` layout
   disturbance;
7. Word light view reports `not_visible` and `none_observed` layout
   disturbance; and
8. Word dark view reports `not_visible` and `none_observed` layout disturbance.

Candidate C is evaluated against the same evidence for diagnostic comparison,
but it never satisfies `selectableCandidatePasses`.

## Mechanical bake-off gate

With complete, reliable evidence, apply this fixed order:

1. `SELECT_A` when Candidate A passes.
2. Otherwise `SELECT_B` when Candidate B passes.
3. Otherwise `REVISE_ZERO_WIDTH_CARRIER` when at least one candidate preserves
   both markers and the visible body in at least one editor DOCX round trip or
   clipboard artifact.
4. Otherwise `ABANDON_ZERO_WIDTH_CARRIER`.

Candidate C can contribute bounded evidence for `REVISE_ZERO_WIDTH_CARRIER`
but can never produce `SELECT_C`.

Missing, uninspectable, or unreliable mandatory evidence is operationally
`BLOCKED`. `BLOCKED` is not written as a scientific gate decision.

The gate is implemented once before real editor execution and tested against
fixed records for all outcomes. A record declaring a decision different from
the mechanically derived result is rejected.

## Run record

A non-blocked run creates:

`research/experiments/docx-zero-width-carrier-bakeoff-v1/run-001.json`

The exact-shape record includes:

- experiment, schema, candidate, and document-profile identifiers;
- fixed logical marker-frame definitions;
- source generator Git commit and dependency/environment versions;
- hashes and structural inspection for all three canonical DOCX files;
- Google Docs and Microsoft Word application/platform versions;
- six independent transformed DOCX artifacts and inspections;
- six independent clipboard artifacts and inspections;
- ordinary-view and selection observations;
- Word Accessibility Assistant findings;
- screen-reader and Google dark-view limitations;
- redacted core-metadata classifications;
- protocol deviations and distribution limitations;
- the mechanical gate result and rationale; and
- explicit scientific and product-claim limitations.

The record schema rejects missing and extra fields recursively. It contains no
personal metadata value, document URL, credential, raw assignment prompt,
student work, model response, or browser-private state.

## Implementation boundaries

Implementation adds only:

- a versioned experiment directory, protocol, fixture adapter, and run record;
- small shared frame encode/decode and CRC utilities;
- three explicit candidate definitions without a plugin architecture;
- candidate-aware DOCX generation and inspection;
- privacy-preserving core-metadata classification;
- repository-bounded generation, inspection, and validation commands;
- adversarial structural, normalization, command-safety, record-schema, and
  gate tests;
- directory-specific ignored artifact handling; and
- testing and progress documentation.

Candidate dispatch remains an explicit switch over three frozen IDs. No generic
carrier registry, extension API, strategy framework, production matcher, or
browser-facing data contract is introduced.

## Testing strategy

Implementation follows red-green-refactor task boundaries.

### Frame tests

- exact Alpha/Beta frame bytes;
- exact CRC vectors and byte order;
- exact A/B/C code-point mappings;
- Unicode code-point iteration rather than UTF-16 code-unit indexing;
- round-trip encode/decode;
- wrong magic, version, marker ID, length, payload, and checksum rejection;
- truncation, insertion, deletion, reorder, duplicate, mixed-alphabet, and
  unexpected-frame rejection;
- NFC and NFKC observations without normalization-assisted acceptance.

### Generator and structural tests

- exact body placement and run order;
- exact visible body after carrier removal;
- no forbidden run property or additional hiding mechanism;
- no candidate alphabet elsewhere in the package;
- clean package-safety evidence;
- deterministic generation in memory;
- exclusive file creation and refusal to replace files or symlinks; and
- no test write to a real artifact path.

### Inspector adversaries

- split and merged carrier runs;
- carrier moved to another body paragraph or non-body part;
- damaged surrogate pairs;
- editor-added benign run properties;
- replacement or visible characters mixed into a carrier;
- external relationships, unresolved targets, macros, and active content;
- absent, empty, expected synthetic, and redacted non-synthetic core metadata;
- malformed XML and ZIP packages; and
- source versus transformed inspection errors.

### Command-safety tests

- repository containment;
- no traversal, absolute escape, symlink escape, directory, device, or
  non-regular-file target;
- no overwrite, unlink, or mutation by inspection;
- safe JSON stdout and nonzero unsafe/usage exits;
- no personal metadata values in output; and
- disposable copied-repository fixtures.

### Record and gate tests

- exact recursive shape and enum boundaries;
- artifact containment, regular-file checks, hashes, and source linkage;
- inspector-derived evidence equality;
- privacy classification and redaction;
- every fixed gate outcome and every wrong declared outcome;
- Candidate C non-selectability;
- selection and Accessibility Assistant non-gating behavior;
- mandatory `not_assessable` limitations; and
- operational missing evidence rejected rather than converted into a
  scientific result.

### Regression tests

- unchanged Milestone 2 strict canonical inspector;
- unchanged Milestone 2B bake-off;
- unchanged Milestone 2C semantic-white qualification;
- transformed-DOCX inspector behavior;
- lockfile immutability; and
- old experiment tree immutability.

## Verification and audit

Before completion, run:

- frozen dependency installation;
- lint;
- typecheck;
- full tests;
- production build;
- candidate structural tests;
- frame and normalization tests;
- transformed-inspector tests;
- command-safety tests;
- run-record validation;
- artifact/hash validation;
- privacy and secret audit;
- generated-artifact audit;
- immutable-old-experiment audit;
- milestone-leakage audit;
- complete Git diff and status review; and
- independent protocol/science, code/safety, and privacy/history reviews.

Generated artifacts remain ignored and untracked. A verified branch may be
pushed to the canonical repository, but it is not merged and no pull request is
opened without explicit authorization.

## Accessibility and production boundary

No Milestone 2D result is production readiness.

Before any selected carrier can support Protect, pilot use, or a
production-ready claim, a separately approved qualification must cover:

- supported screen-reader exposure and navigation;
- Word and Google Docs accessibility behavior;
- international scripts in which join controls have legitimate shaping
  effects;
- bidirectional text and reading order;
- search, spellcheck, editing, paste, undo, and deletion behavior;
- printing and PDF conversion if those are supported product workflows;
- specialized modes that expose default-ignorable characters; and
- security review of invisible-text abuse and downstream normalization.

Word Accessibility Assistant observations in this bake-off are evidence only.
They neither prove accessibility safety nor override the transport gate.

## Standards references

- Unicode Standard, Chapter 23, variation selectors and layout controls:
  <https://www.unicode.org/versions/Unicode16.0.0/core-spec/chapter-23/>
- Unicode Standard Annex #14, line-breaking behavior:
  <https://www.unicode.org/reports/tr14/>
- Unicode Technical Standard #39, join controls and default-ignorable security
  considerations: <https://www.unicode.org/reports/tr39/>
- Unicode General Punctuation names list, word joiner and invisible operators:
  <https://www.unicode.org/charts/nameslist/n_2000.html>

## Approved execution handoff

After this written specification is reviewed, create a detailed implementation
plan before writing code. The plan must preserve serial ownership for
overlapping implementation files and may use parallel read-only reviewers.

Do not begin editor workflows until protocol, generators, inspectors, commands,
tests, and strict record validation are complete and verified. Do not tune a
candidate after canonical generation. Stop on a hash discrepancy or unreliable
required observation.
