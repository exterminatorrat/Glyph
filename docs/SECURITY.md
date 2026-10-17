# Glyph security and privacy model

Status: current privacy direction adopted 2026-10-17; implementation and pilot use are not authorized.

## Current boundaries

Assignment prompts and student responses remain in the browser: do not upload, log, or persist either. No real student work may appear in Git, test fixtures, research fixtures, logs, or documentation. The MVP has no accounts or database, and its embedding/checking path has no teacher-submission backend. Do not commit key material or secrets.

The local research lab is a separate tool. It may call model APIs only for synthetic or explicitly consented research inputs and must obtain credentials through environment variables. It is not a route for teacher or student submissions.

Canaries are inspectable, removable prompt-injection markers, not cryptographic secrets, statistical watermarks, or tamper-resistant carriers. The `teacherKey` is used for the planned stateless HMAC-SHA256 derivation, but its creation and lifecycle and the exact domain-separated input contract are deliberately unresolved until Step 2. This document does not define storage or key-management behavior.

A match warrants contextual conversation and corroboration; it does not establish direct ingestion, authorship, intent, or misconduct. A miss provides no evidence either way. Do not show a score or probability. Hidden instructions may be inspected or shared, and the hidden-only/visible-only/both ordering remains an unvalidated hypothesis.

Avoid white-text tricks. Disclose the use of canaries in the teacher AI policy. Before any pilot, run fresh accessibility and international-text testing for the new tag and visible-note carriers; prior DOCX accessibility results are not a proxy. Integrations such as Docs or LTI require measured carrier survival on each platform and explicit consideration of LMS sanitization.

The Milestone 0 policy below is archived and superseded where it conflicts with these boundaries. Historical security and research records remain intact and do not establish safety for the new design.

<details>
<summary>Archived Milestone 0 security policy (superseded)</summary>

Status: approved Milestone 0 policy, 2026-08-30

## Security posture

Glyph begins as an INTERNAL RESEARCH PROTOTYPE. It is local-only, unauthenticated, not publicly deployed, and prohibited from handling actual student work.

A PILOT-READY PRODUCT is a later security state with authenticated ownership, tested authorization, privacy controls, operational safeguards, and an independently reviewed protocol for real student data.

Local functionality is not evidence of pilot safety or school compliance.

## Protected assets

- Privileged database credentials.
- Fingerprint payloads and raw marker values.
- Assignment titles and ownership metadata.
- Transient assignment prompts.
- Transient responses and future uploaded response documents.
- Research fixtures and generated outputs.
- Experiment provenance and results.

Marker values are confidential operational material, not cryptographic secrets. Anyone with the protected DOCX may inspect or remove `w:vanish` content. Security controls prevent accidental application exposure; they do not make the document carrier tamper-resistant.

## Trust zones

### Browser zone

Treat all browser input as untrusted and all browser code as public. Browser-facing contracts must not contain privileged credentials, fingerprint payloads, raw marker values, directives, response echoes, stack traces, or database details.

The downloaded DOCX is intentionally delivered to the browser and therefore leaves the server trust zone. Its embedded content is inspectable by design.

### Server zone

The server performs authoritative validation, fingerprint generation, document generation, persistence access, transient analysis, safe error mapping, and content-free logging. Environment credentials and server-only modules remain confined here.

### Database zone

The database stores minimal immutable assignment metadata and fingerprint payloads. It never stores raw assignment prompts, generated documents, analyzed responses, uploaded response documents, filenames, student identities, or analysis history in the MVP.

### Research-artifact zone

Research fixtures are separate from product persistence. They may contain synthetic responses, generated model outputs collected for the experiment, and explicitly consented and de-identified human controls. Actual student submissions are prohibited.

## Data classification and lifecycle

| Data | Handling |
|---|---|
| Assignment title | Persisted; never logged |
| Assignment prompt | Transient during protection; neither persisted nor logged |
| Fingerprint versions and payload | Persisted server-side; payload excluded from browser contracts and logs |
| Generated DOCX | Held in memory and returned; not persisted by Glyph |
| Pasted response | Transient during analysis; neither persisted, logged, cached, nor traced |
| Uploaded response DOCX, if later authorized | Bounded in-memory processing; bytes and extracted text discarded |
| Filename | Not retained or logged |
| Student identity | Never collected by the MVP |
| Research sample | Stored only under the approved research-data policy with provenance |

## Logging policy

Allowed operational fields are request ID, operation name, safe assignment ID where necessary, input length, duration, result status, and stable error code.

Logs must not include:

- assignment titles or prompts
- responses or extracted document text
- raw request bodies
- DOCX bytes or filenames
- marker strings or embedded directives
- fingerprint payloads
- credentials, connection strings, or authorization tokens
- student or class identifiers

Error monitoring, tracing, framework debug output, request middleware, and hosting-platform access logs must be reviewed against this policy before public deployment.

## Credential policy

Privileged database credentials never enter browser code, public environment variables, browser-facing responses, source control, fixtures, logs, or documentation examples.

Supabase is not configured during the carrier spike. When persistence begins, implementation must check current official Supabase terminology and prefer the then-recommended server-side secret mechanism rather than designing around a legacy key name.

Server-only privileged access is acceptable for the local unauthenticated prototype. Before a teacher pilot, ordinary teacher operations must use authenticated user context and tested ownership policies rather than unrestricted privileged access.

Configuration examples are introduced only with the relevant milestone. Real credential values are never committed.

## Internal prototype controls

The prototype must:

- bind and operate locally without public exposure
- validate all external input on the server
- enforce documented input bounds
- use safe, stable error codes
- keep response caching disabled
- use secure randomness for generated markers after the carrier spike
- strictly parse persisted fingerprint versions and payloads
- prevent server-only modules from entering browser bundles
- deny direct browser access to assignment persistence
- generate macro-free DOCX files without executable content
- avoid filesystem persistence for prompts, responses, and documents
- verify through automated privacy tests that content does not reach stores or loggers

The prototype must not be exposed using a public deployment, development tunnel, shared unauthenticated host, or school network service.

## Pilot security gates

Before a teacher pilot:

- Supabase Auth or an approved equivalent authenticates teachers.
- Every assignment has non-null teacher ownership.
- Row-level security and grants enforce least privilege.
- Select, insert, update, and delete behavior has explicit allow and deny tests where those operations exist.
- Every server entry point re-authorizes the current teacher.
- Rate limits and request-body limits are enforced.
- Origin, CSRF, cookie, TLS, and security-header behavior is reviewed.
- Secrets can be rotated and are separated by environment.
- Dependency and secret scanning is active.
- Assignment deletion and retention behavior is implemented and documented.
- Backup, restore, incident response, and support ownership are defined.
- Platform logs and telemetry have an approved data policy.
- Accessibility behavior of protected documents and evidence reports is reviewed.
- Legal, FERPA, school privacy, processor, and regional-storage requirements receive qualified review.
- A protocol governing any real student work is independently reviewed before collection.

Authentication alone does not satisfy these gates.

## Document security

`docx-hidden-run-v1` uses a standard formatting property and contains no code. It remains susceptible to inspection, removal, conversion loss, accessibility exposure, and document sanitization.

Generated documents must contain no macros, scripts, active content, unexpected external relationships, or remote resources.

If response uploads are later authorized, the parser must:

- enforce compressed and decompressed size limits
- verify an OOXML Word package rather than trusting extension or MIME type
- reject unsupported macro-enabled or malformed files
- avoid executing macros, relationships, embedded objects, or links
- process bounded bytes in memory
- discard bytes and extracted text after analysis
- return safe errors without parser internals

## Primary threats and required responses

| Threat | Required response |
|---|---|
| Browser imports privileged modules | Server-only import enforcement and build verification |
| Database credential disclosure | Environment isolation, no public variables, no content logging, rotation procedure before pilot |
| Cross-teacher access | Authenticated ownership, least-privilege grants, RLS, and two-account tests before pilot |
| Response retention through logs or traces | Safe logger interface, privacy tests, and platform telemetry review |
| Malformed fingerprint interpreted as no signal | Strict tagged parsing and integrity error |
| Marker leakage through public data | Safe DTOs containing conceptual signal IDs only |
| Student removes hidden content | Treat carrier as removable and measure this failure; never claim tamper resistance |
| Cross-assignment contamination | Assignment-specific markers, assignment-ID checks, and research controls |
| DOCX parser abuse | Defer uploads, then enforce package and resource limits |
| Overstated evidence | Terminology ladder, reviewed copy, and teacher-facing limitation statement |
| Unauthenticated public use | Prohibit deployment until pilot gates pass |

## Privacy failure response

If prompts, responses, student information, marker values, or credentials appear in persistence, logs, browser contracts, fixtures, or documentation contrary to this policy, work stops. The exposure is removed through an approved recoverable process, affected secrets are rotated where applicable, the cause is tested, and the relevant gate is re-reviewed before continuation.

## Claims boundary

Security and privacy controls do not improve the epistemic meaning of a detected marker. A secure result still reports marker presence, not AI authorship, direct AI ingestion, intent, cheating, or misconduct.

</details>
