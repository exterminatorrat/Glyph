import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import {
  lstat,
  readFile,
  realpath,
} from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import {
  BAKE_OFF_PROFILE,
  EXPERIMENT_ID,
  EXPERIMENT_SCHEMA_VERSION,
  ZERO_WIDTH_GENERATION_CHECKPOINT,
  VISIBLE_FIXTURE_ID,
  VISIBLE_PARAGRAPHS,
  ZERO_WIDTH_CANDIDATES,
  type CandidateId,
  type DocumentProfile,
} from "../research/experiments/docx-zero-width-carrier-bakeoff-v1/fixture.ts";
import {
  inspectZeroWidthDocx,
  type CarrierRunProperty,
  type CoreMetadataClassification,
  type DocxCarrierOccurrence,
  type ForbiddenRunProperty,
  type InspectionMode,
  type PackageCodePointOccurrence,
  type SafetyInspection,
  type ZeroWidthDocxInspection,
} from "../research/experiments/docx-zero-width-carrier-bakeoff-v1/inspect-zero-width-docx.ts";
import {
  inspectZeroWidthText,
  type CarrierRunInspection,
  type CodePointOccurrence,
  type ZeroWidthTextInspection,
} from "../research/experiments/docx-zero-width-carrier-bakeoff-v1/inspect-zero-width-text.ts";

const execFileAsync = promisify(execFile);

export type SHA256 = string;
export type ISODate = `${number}-${number}-${number}`;
export type MarkerPresence = "present" | "absent";
export type VisibleBody =
  | "preserved"
  | "changed"
  | "lost"
  | "not_assessable";
export type CarrierPresentation =
  | "not_visible"
  | "visible_marker_or_codepoint"
  | "replacement_or_control_placeholder";
export type LayoutDisturbance = "none_observed" | "minor" | "material";
export type SelectionObservation =
  | "nothing_observed"
  | "carrier_or_placeholder_revealed"
  | "not_assessable";
export type GateDecision =
  | "SELECT_A"
  | "SELECT_B"
  | "REVISE_ZERO_WIDTH_CARRIER"
  | "ABANDON_ZERO_WIDTH_CARRIER";
export type GateRationaleCode =
  | "candidate-a-transport-pass"
  | "candidate-b-transport-pass"
  | "bounded-transport-evidence-without-selectable-pass"
  | "no-bounded-transport-evidence";
export type ViewObservationCode =
  | "body-preserved"
  | "carrier-not-visible"
  | "layout-none-observed"
  | "layout-minor"
  | "layout-material";
export type AccessibilityFindingCode =
  | "accessibility-assistant-contrast-finding"
  | "accessibility-assistant-no-finding";
export type TransportLimitation =
  | "transport-only"
  | "no-ai-ingestion-claim"
  | "no-model-compliance-claim"
  | "no-authorship-claim"
  | "no-prompt-reuse-claim"
  | "no-intent-claim"
  | "no-cheating-claim"
  | "no-misconduct-claim";
export type ProtocolDeviationCode = "core-metadata-redacted";
export type DistributionLimitationCode = "core-metadata-requires-privacy-review";
export type EditorLimitationCode =
  | "google-dark-view-not-assessable"
  | "google-screen-reader-not-assessable"
  | "word-screen-reader-not-assessable"
  | "word-accessibility-assistant-not-assessable";

export type ArtifactEvidence = Readonly<{
  path: string;
  sha256: SHA256;
}>;
export type ApplicationEvidence = Readonly<{
  name: string;
  version: string | null;
}>;
export type PlatformEvidence = Readonly<{
  name: string;
  version: string | null;
  build: string | null;
}>;
export type ViewEvidence = Readonly<{
  zoomPercent: 100;
  visibleBody: VisibleBody;
  carrierPresentation: CarrierPresentation;
  layoutDisturbance: LayoutDisturbance;
  notes: readonly ViewObservationCode[];
}>;
export type InspectionEvidence = ZeroWidthDocxInspection;
export type PlainTextEvidence = Readonly<{
  status: "completed";
  sourceArtifactSha256: SHA256;
  resultArtifact: ArtifactEvidence;
  inspection: ZeroWidthTextInspection;
  protocolDeviation: ProtocolDeviationCode | null;
  notes: readonly never[];
}>;
export type DocxRoundtripEvidence = Readonly<{
  status: "completed";
  sourceArtifactSha256: SHA256;
  resultArtifact: ArtifactEvidence;
  inspection: InspectionEvidence;
  protocolDeviation: ProtocolDeviationCode | null;
  distributionLimitations: readonly DistributionLimitationCode[];
  notes: readonly never[];
}>;
export type GoogleDocsCandidateEvidence = Readonly<{
  application: ApplicationEvidence & Readonly<{ name: "Google Docs" }>;
  browser: ApplicationEvidence & Readonly<{ name: "Google Chrome" }>;
  platform: PlatformEvidence;
  documentRule: "one new unshared document";
  sourceArtifactSha256: SHA256;
  paginatedWhiteView: ViewEvidence;
  darkView: "not_assessable";
  docxRoundtrip: DocxRoundtripEvidence;
  plainTextCopy: PlainTextEvidence;
  selectionObservation: SelectionObservation;
  screenReader: "not_assessable";
  limitations: readonly EditorLimitationCode[];
}>;
export type MicrosoftWordCandidateEvidence = Readonly<{
  application: ApplicationEvidence & Readonly<{ name: "Microsoft Word" }>;
  platform: PlatformEvidence;
  documentRule: "open canonical source independently";
  sourceArtifactSha256: SHA256;
  lightPrintLayout: ViewEvidence;
  darkPageCanvas: ViewEvidence;
  docxRoundtrip: DocxRoundtripEvidence;
  plainTextCopy: PlainTextEvidence;
  selectionObservation: SelectionObservation;
  accessibilityAssistant: Readonly<{
    status: "completed" | "not_assessable";
    findings: readonly AccessibilityFindingCode[];
    limitations: readonly EditorLimitationCode[];
  }>;
  screenReader: "not_assessable";
  limitations: readonly EditorLimitationCode[];
}>;
export type CandidateRunEvidence = Readonly<{
  candidateId: CandidateId;
  documentProfile: DocumentProfile;
  selectable: boolean;
  priority: 1 | 2 | 3;
  canonicalArtifact: ArtifactEvidence & Readonly<{
    inspection: InspectionEvidence;
  }>;
  googleDocs: GoogleDocsCandidateEvidence;
  microsoftWord: MicrosoftWordCandidateEvidence;
  transportCriteriaSatisfied: boolean;
  selectableCandidatePasses: boolean;
  limitations: readonly TransportLimitation[];
}>;
export type ZeroWidthBakeOffRunRecord = Readonly<{
  experimentId: "glyph-exp-docx-zero-width-carrier-bakeoff-v1-001";
  experimentSchemaVersion: 1;
  date: ISODate;
  bakeOffProfile: "docx-zero-width-carrier-bakeoff-v1";
  fingerprintStrategy: null;
  fingerprintStrategyVersion: null;
  matchingProfile: null;
  fixedFrames: Readonly<{
    alphaHex: "475a01a108474c5950484130317d62";
    betaHex: "475a01b208474c595048423031016b";
    crcProfile: "CRC-16/CCITT-FALSE";
  }>;
  visibleFixture: Readonly<{
    id: "synthetic-library-hours-v1";
    sourcePath: "research/experiments/docx-hidden-run-v1/fixture.ts";
  }>;
  sourceGenerator: Readonly<{
    path: "src/documents/docx/docx-zero-width-carrier-bakeoff-v1.ts";
    gitCommit: typeof ZERO_WIDTH_GENERATION_CHECKPOINT;
    nodeVersion: string;
    pnpmVersion: string;
    docxVersion: "9.7.1";
  }>;
  candidates: readonly [
    CandidateRunEvidence,
    CandidateRunEvidence,
    CandidateRunEvidence,
  ];
  gateDecision: GateDecision;
  gateRationale: readonly [GateRationaleCode];
  limitations: readonly TransportLimitation[];
}>;

type UnknownRecord = Record<string, unknown>;
type ArtifactKind =
  | "canonical"
  | "googleRoundtrip"
  | "googleCopy"
  | "wordRoundtrip"
  | "wordCopy";

const ARTIFACT_DIRECTORY =
  "research/artifacts/docx-zero-width-carrier-bakeoff-v1";
const ARTIFACT_PATHS: Readonly<Record<ArtifactKind, string>> = {
  canonical: `${ARTIFACT_DIRECTORY}/CANDIDATE.docx`,
  googleRoundtrip: `${ARTIFACT_DIRECTORY}/CANDIDATE-google-docs-roundtrip.docx`,
  googleCopy: `${ARTIFACT_DIRECTORY}/CANDIDATE-google-docs-copy-plain-text.txt`,
  wordRoundtrip: `${ARTIFACT_DIRECTORY}/CANDIDATE-microsoft-word-roundtrip.docx`,
  wordCopy: `${ARTIFACT_DIRECTORY}/CANDIDATE-microsoft-word-copy-plain-text.txt`,
};
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const GIT_COMMIT_PATTERN = /^[a-f0-9]{40}$/;
const SAFE_VERSION_PATTERN = /^v?\d+(?:\.\d+){0,3}$/;
const SAFE_BUILD_PATTERN = /^\d{2,3}[A-Z]\d+[a-z]?$/;
const ENTRY_PATTERN = /^(?:\[Content_Types\]\.xml|_rels\/\.rels|word\/(?:document\.xml|styles\.xml|settings\.xml|numbering\.xml|fontTable\.xml|theme\/theme1\.xml|_rels\/document\.xml\.rels|(?:header|footer)\d+\.xml|_rels\/(?:header|footer)\d+\.xml\.rels|(?:footnotes|endnotes|comments)\.xml|_rels\/(?:footnotes|endnotes|comments)\.xml\.rels)|docProps\/(?:core|app|custom)\.xml|entry-redacted-[a-f0-9]{16})$/;
const SAFE_PROPERTY_PATTERN = /^(?:bdr|bidi|caps|color|cs|eastAsianLayout|effect|emboss|fitText|highlight|i|iCs|imprint|kern|lang|noProof|outline|position|rFonts|rStyle|rtl|shadow|shd|smallCaps|snapToGrid|spacing|specVanish|sz|szCs|u|vanish|vertAlign|webHidden|property-redacted-[a-f0-9]{16})$/;
const SAFE_CODE_POINT_PATTERN = /^U\+[0-9A-F]{4,5}$/;
const SAFE_DIAGNOSTIC_REASONS = new Set([
  "invalid frame length",
  "invalid magic",
  "invalid frame version",
  "invalid marker ID",
  "invalid payload length",
  "invalid payload",
  "invalid checksum",
  "unexpected code point",
  "frame decode failed",
  "duplicate alpha frame",
  "duplicate beta frame",
  "non-ordinary carrier context",
  "mixed carrier run",
  "carrier anchor is not frozen",
]);
const SAFE_VIEW_OBSERVATION_CODES = new Set<ViewObservationCode>([
  "body-preserved",
  "carrier-not-visible",
  "layout-none-observed",
  "layout-minor",
  "layout-material",
]);
const SAFE_ACCESSIBILITY_FINDING_CODES = new Set<AccessibilityFindingCode>([
  "accessibility-assistant-contrast-finding",
  "accessibility-assistant-no-finding",
]);
const NO_NOTE_CODES = new Set<never>();
const SAFE_EDITOR_LIMITATION_CODES = new Set<EditorLimitationCode>([
  "google-dark-view-not-assessable",
  "google-screen-reader-not-assessable",
  "word-screen-reader-not-assessable",
  "word-accessibility-assistant-not-assessable",
]);
const SAFE_DISTRIBUTION_LIMITATION_CODES = new Set<DistributionLimitationCode>([
  "core-metadata-requires-privacy-review",
]);
const SAFE_PROTOCOL_DEVIATION_CODES = new Set<ProtocolDeviationCode>([
  "core-metadata-redacted",
]);
export const TRANSPORT_LIMITATIONS = [
  "transport-only",
  "no-ai-ingestion-claim",
  "no-model-compliance-claim",
  "no-authorship-claim",
  "no-prompt-reuse-claim",
  "no-intent-claim",
  "no-cheating-claim",
  "no-misconduct-claim",
] as const satisfies readonly TransportLimitation[];
export const GOOGLE_LIMITATIONS = [
  "google-dark-view-not-assessable",
  "google-screen-reader-not-assessable",
] as const satisfies readonly EditorLimitationCode[];
export const WORD_LIMITATIONS = [
  "word-screen-reader-not-assessable",
] as const satisfies readonly EditorLimitationCode[];
export const ACCESSIBILITY_NOT_ASSESSABLE_LIMITATIONS = [
  "word-accessibility-assistant-not-assessable",
] as const satisfies readonly EditorLimitationCode[];
const GATE_RATIONALES: Readonly<Record<GateDecision, GateRationaleCode>> = {
  SELECT_A: "candidate-a-transport-pass",
  SELECT_B: "candidate-b-transport-pass",
  REVISE_ZERO_WIDTH_CARRIER: "bounded-transport-evidence-without-selectable-pass",
  ABANDON_ZERO_WIDTH_CARRIER: "no-bounded-transport-evidence",
};
const SAFE_FINDING_CODES = new Set([
  "external-relationship",
  "unresolved-relationship",
  "active-content-entry",
  "active-relationship-type",
  "macro-content-type",
]);
const FORBIDDEN_PROPERTY_NAMES = new Set([
  "vanish",
  "webHidden",
  "specVanish",
  "unresolved-style-inheritance",
]);
const SOURCE_FIXTURE_PATH =
  "research/experiments/docx-hidden-run-v1/fixture.ts";
const SOURCE_GENERATOR_PATH =
  "src/documents/docx/docx-zero-width-carrier-bakeoff-v1.ts";
const DOCX_VERSION = "9.7.1";
const FIXED_FRAME_ALPHA_HEX = "475a01a108474c5950484130317d62" as const;
const FIXED_FRAME_BETA_HEX = "475a01b208474c595048423031016b" as const;
const RUN_RECORD_PATH =
  "research/experiments/docx-zero-width-carrier-bakeoff-v1/run-001.json";
const FAILURE_USAGE =
  "Usage: pnpm research:carrier:zero-width:validate (reads run-001.json)";
const FORBIDDEN_KEY_PATTERN =
  /(?:account|credential|password|secret|token|api[_-]?key|access[_-]?key|refresh[_-]?token|authorization|bearer|email|username|user[_-]?id|student|teacher|school|class|identity|session|cookie|prompt|response|submission|assignment|answer|raw|payload(?:$|[_-])|document[_-]?(?:id|url|uri)|cloud|url|uri|href)/i;
const FORBIDDEN_VALUE_PATTERN =
  /(?:-----BEGIN [^-]+ PRIVATE KEY-----|\bBearer\s+\S+|\b(?:sk|rk|pk|ghp|github_pat|xox[abprs])[-_][A-Za-z0-9_-]+)/i;
const URL_PATTERN = /(?:https?|ftp|gs|s3):\/\//i;
const EMAIL_PATTERN =
  /\b[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+\b/i;
const INVISIBLE_CARRIER_PATTERN = /[\u200c\u200d\u2062\u2063\uFE00-\uFE0F\u{E0100}-\u{E01EF}]/u;

function ensure(
  condition: unknown,
  path: string,
  message: string,
): asserts condition {
  assert.ok(condition, `${path}: ${message}`);
}

const isRecord = (value: unknown): value is UnknownRecord =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const recordAt = (value: unknown, path: string): UnknownRecord => {
  ensure(isRecord(value), path, "expected an object");
  return value;
};

const arrayAt = (value: unknown, path: string): unknown[] => {
  ensure(Array.isArray(value), path, "expected an array");
  return value;
};

const exactObject = (
  value: unknown,
  keys: readonly string[],
  path: string,
): UnknownRecord => {
  const object = recordAt(value, path);
  const actual = Object.keys(object).sort();
  const expected = [...keys].sort();
  ensure(
    actual.length === expected.length &&
      actual.every((key, index) => key === expected[index]),
    path,
    "unexpected or missing fields",
  );
  return object;
};

const stringAt = (value: unknown, path: string): string => {
  ensure(
    typeof value === "string" && value.trim().length > 0,
    path,
    "expected a non-empty string",
  );
  return value;
};

const versionAt = (value: unknown, path: string): string => {
  const version = stringAt(value, path);
  ensure(SAFE_VERSION_PATTERN.test(version), path, "must use a safe version");
  return version;
};

const buildAt = (value: unknown, path: string): string => {
  const build = stringAt(value, path);
  ensure(SAFE_BUILD_PATTERN.test(build), path, "must use a safe build label");
  return build;
};

const booleanAt = (value: unknown, path: string): boolean => {
  ensure(typeof value === "boolean", path, "expected a boolean");
  return value;
};

const nonNegativeIntegerAt = (value: unknown, path: string): number => {
  ensure(
    typeof value === "number" && Number.isInteger(value) && value >= 0,
    path,
    "expected a non-negative integer",
  );
  return value;
};

const runIndexAt = (value: unknown, path: string): number => {
  ensure(
    typeof value === "number" && Number.isInteger(value) && value >= -1,
    path,
    "expected an integer run index",
  );
  return value;
};

const stringArrayAt = (
  value: unknown,
  path: string,
  requireNonEmpty = false,
): string[] => {
  const array = arrayAt(value, path);
  ensure(!requireNonEmpty || array.length > 0, path, "expected a non-empty array");
  return array.map((entry, index) => stringAt(entry, `${path}[${index}]`));
};

const codeArrayAt = <T extends string>(
  value: unknown,
  path: string,
  allowed: ReadonlySet<T>,
): T[] =>
  arrayAt(value, path).map((entry, index) => {
    const code = stringAt(entry, `${path}[${index}]`);
    ensure(allowed.has(code as T), `${path}[${index}]`, "unexpected code");
    return code as T;
  });

const codeAt = <T extends string>(
  value: unknown,
  path: string,
  allowed: ReadonlySet<T>,
): T => {
  const code = stringAt(value, path);
  ensure(allowed.has(code as T), path, "unexpected code");
  return code as T;
};

const exactCodeArrayAt = <T extends string>(
  value: unknown,
  path: string,
  expected: readonly T[],
  allowed: ReadonlySet<T>,
): T[] => {
  const actual = codeArrayAt(value, path, allowed);
  ensure(sameValue(actual, expected), path, "does not match the frozen codes");
  return actual;
};

const diagnosticAt = (
  value: unknown,
  path: string,
  candidateId: CandidateId,
): string => {
  const diagnostic = stringAt(value, path);
  const prefix = `Candidate ${candidateId}: `;
  ensure(
    diagnostic.startsWith(prefix) &&
      SAFE_DIAGNOSTIC_REASONS.has(diagnostic.slice(prefix.length)),
    path,
    "must use a fixed diagnostic",
  );
  return diagnostic;
};

const diagnosticArrayAt = (
  value: unknown,
  path: string,
  candidateId: CandidateId,
): string[] =>
  arrayAt(value, path).map((entry, index) =>
    diagnosticAt(entry, `${path}[${index}]`, candidateId),
  );

const enumAt = <T extends string>(
  value: unknown,
  values: readonly T[],
  path: string,
): T => {
  ensure(
    typeof value === "string" && values.includes(value as T),
    path,
    "unexpected enum value",
  );
  return value as T;
};

const sameValue = (left: unknown, right: unknown): boolean => {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((entry, index) => sameValue(entry, right[index]))
    );
  }
  if (isRecord(left) || isRecord(right)) {
    if (!isRecord(left) || !isRecord(right)) return false;
    const leftKeys = Object.keys(left).sort();
    const rightKeys = Object.keys(right).sort();
    return (
      sameValue(leftKeys, rightKeys) &&
      leftKeys.every((key) => sameValue(left[key], right[key]))
    );
  }
  return false;
};

const equalAt = (left: unknown, right: unknown, path: string): void => {
  ensure(sameValue(left, right), path, "does not match observed artifact");
};

const assertSafeRecordContent = (value: unknown, path = "$"): void => {
  if (typeof value === "string") {
    ensure(!URL_PATTERN.test(value), path, "URL-shaped values are not allowed");
    ensure(!EMAIL_PATTERN.test(value), path, "email-shaped values are not allowed");
    ensure(!FORBIDDEN_VALUE_PATTERN.test(value), path, "credential-shaped values are not allowed");
    ensure(!INVISIBLE_CARRIER_PATTERN.test(value), path, "raw invisible carrier values are not allowed");
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      assertSafeRecordContent(entry, `${path}[${index}]`),
    );
    return;
  }
  if (!isRecord(value)) return;
  for (const [key, entry] of Object.entries(value)) {
    ensure(!FORBIDDEN_KEY_PATTERN.test(key), path, "prohibited field name");
    assertSafeRecordContent(entry, `${path}.${key}`);
  }
};

const assertHash = (value: unknown, path: string): SHA256 => {
  const hash = stringAt(value, path);
  ensure(SHA256_PATTERN.test(hash), path, "expected a lowercase SHA-256 hash");
  return hash;
};

const isInside = (root: string, candidate: string): boolean => {
  const child = relative(root, candidate);
  return (
    child !== "" &&
    child !== ".." &&
    !child.startsWith(`..${sep}`) &&
    !isAbsolute(child)
  );
};

const artifactPathFor = (candidateId: CandidateId, kind: ArtifactKind): string =>
  ARTIFACT_PATHS[kind].replace("CANDIDATE", candidateId);

const assertArtifactRef = (
  value: unknown,
  path: string,
  candidateId: CandidateId,
  kind: ArtifactKind,
): ArtifactEvidence => {
  const object = exactObject(value, ["path", "sha256"], path);
  const artifactPath = stringAt(object.path, `${path}.path`);
  ensure(
    artifactPath === artifactPathFor(candidateId, kind),
    `${path}.path`,
    "must use the frozen candidate artifact path",
  );
  ensure(
    !isAbsolute(artifactPath) &&
      artifactPath.startsWith(`${ARTIFACT_DIRECTORY}/`) &&
      !artifactPath.split(/[\\/]+/).includes("..") &&
      !artifactPath.includes("\0"),
    `${path}.path`,
    "must remain inside the ignored artifact directory",
  );
  return {
    path: artifactPath,
    sha256: assertHash(object.sha256, `${path}.sha256`),
  };
};

const assertEntryLabel = (value: unknown, path: string): string => {
  const entry = stringAt(value, path);
  ensure(ENTRY_PATTERN.test(entry), path, "must use a safe package-entry label");
  return entry;
};

const assertPartLabel = (value: unknown, path: string): string => {
  const part = stringAt(value, path);
  ensure(ENTRY_PATTERN.test(part), path, "must use a safe package-part label");
  return part;
};

const assertCodePointLabel = (value: unknown, path: string): string => {
  const codePoint = stringAt(value, path);
  ensure(SAFE_CODE_POINT_PATTERN.test(codePoint), path, "must use a safe code-point label");
  return codePoint;
};

const assertMarkerPresence = (
  value: unknown,
  path: string,
): Readonly<{ alpha: MarkerPresence; beta: MarkerPresence }> => {
  const object = exactObject(value, ["alpha", "beta"], path);
  return {
    alpha: enumAt(object.alpha, ["present", "absent"] as const, `${path}.alpha`),
    beta: enumAt(object.beta, ["present", "absent"] as const, `${path}.beta`),
  };
};

const assertSafety = (value: unknown, path: string): SafetyInspection => {
  const object = exactObject(
    value,
    [
      "externalRelationships",
      "unresolvedRelationshipTargets",
      "activeContentEntries",
      "activeRelationshipTypes",
      "macroContentTypes",
    ],
    path,
  );
  const safeCodes = (entry: unknown, childPath: string): string[] =>
    stringArrayAt(entry, childPath).map((code, index) => {
      ensure(SAFE_FINDING_CODES.has(code), `${childPath}[${index}]`, "must use a fixed safety classification");
      return code;
    });
  return {
    externalRelationships: safeCodes(object.externalRelationships, `${path}.externalRelationships`),
    unresolvedRelationshipTargets: safeCodes(object.unresolvedRelationshipTargets, `${path}.unresolvedRelationshipTargets`),
    activeContentEntries: safeCodes(object.activeContentEntries, `${path}.activeContentEntries`),
    activeRelationshipTypes: safeCodes(object.activeRelationshipTypes, `${path}.activeRelationshipTypes`),
    macroContentTypes: safeCodes(object.macroContentTypes, `${path}.macroContentTypes`),
  };
};

const assertPackageOccurrence = (
  value: unknown,
  path: string,
): PackageCodePointOccurrence => {
  const object = exactObject(
    value,
    ["codePoint", "partName", "location", "paragraphIndex", "runIndex", "codePointIndex"],
    path,
  );
  return {
    codePoint: assertCodePointLabel(object.codePoint, `${path}.codePoint`),
    partName: assertPartLabel(object.partName, `${path}.partName`),
    location: enumAt(
      object.location,
      ["body", "header", "footer", "footnote", "endnote", "comments", "other"] as const,
      `${path}.location`,
    ),
    paragraphIndex: nonNegativeIntegerAt(object.paragraphIndex, `${path}.paragraphIndex`),
    runIndex: runIndexAt(object.runIndex, `${path}.runIndex`),
    codePointIndex: nonNegativeIntegerAt(object.codePointIndex, `${path}.codePointIndex`),
  };
};

const assertDecodedFrame = (value: unknown, path: string): DocxCarrierOccurrence["decodedFrame"] => {
  const object = exactObject(
    value,
    ["markerId", "bytes", "magic", "version", "payloadLength", "payloadHex", "checksum", "checksumValid"],
    path,
  );
  const bytes = arrayAt(object.bytes, `${path}.bytes`).map((entry, index) => {
    const byte = nonNegativeIntegerAt(entry, `${path}.bytes[${index}]`);
    ensure(byte <= 255, `${path}.bytes[${index}]`, "must be a byte");
    return byte;
  });
  ensure(bytes.length === 15, `${path}.bytes`, "must contain one complete frame");
  const magic = arrayAt(object.magic, `${path}.magic`).map((entry, index) => {
    const byte = nonNegativeIntegerAt(entry, `${path}.magic[${index}]`);
    ensure(byte <= 255, `${path}.magic[${index}]`, "must be a byte");
    return byte;
  });
  ensure(magic.length === 2 && magic[0] === 0x47 && magic[1] === 0x5a, `${path}.magic`, "must use the frozen frame magic");
  const markerId = enumAt(object.markerId, ["alpha", "beta"] as const, `${path}.markerId`);
  ensure(object.version === 1, `${path}.version`, "must be version 1");
  ensure(object.payloadLength === 8, `${path}.payloadLength`, "must be 8");
  const payloadHex = stringAt(object.payloadHex, `${path}.payloadHex`);
  ensure(/^[a-f0-9]{16}$/.test(payloadHex), `${path}.payloadHex`, "must be a lowercase payload hex string");
  const checksum = nonNegativeIntegerAt(object.checksum, `${path}.checksum`);
  ensure(checksum <= 0xffff, `${path}.checksum`, "must be a CRC-16 value");
  ensure(object.checksumValid === true, `${path}.checksumValid`, "must be true");
  return {
    markerId,
    bytes,
    magic: [0x47, 0x5a],
    version: 1,
    payloadLength: 8,
    payloadHex,
    checksum,
    checksumValid: true,
  };
};

const assertCarrierOccurrence = (
  value: unknown,
  path: string,
  candidateId: CandidateId,
): DocxCarrierOccurrence => {
  const object = exactObject(
    value,
    [
      "markerId",
      "partName",
      "location",
      "paragraphIndex",
      "runIndices",
      "codePointIndexes",
      "codePointCount",
      "codePoints",
      "decodedFrame",
      "context",
      "anchor",
      "decodeError",
    ],
    path,
  );
  const runIndices = arrayAt(object.runIndices, `${path}.runIndices`).map((entry, index) =>
    nonNegativeIntegerAt(entry, `${path}.runIndices[${index}]`),
  );
  const codePointIndexes = arrayAt(object.codePointIndexes, `${path}.codePointIndexes`).map((entry, index) =>
    nonNegativeIntegerAt(entry, `${path}.codePointIndexes[${index}]`),
  );
  const codePoints = arrayAt(object.codePoints, `${path}.codePoints`).map((entry, index) =>
    assertCodePointLabel(entry, `${path}.codePoints[${index}]`),
  );
  const codePointCount = nonNegativeIntegerAt(object.codePointCount, `${path}.codePointCount`);
  ensure(codePointCount === codePoints.length && codePointCount === codePointIndexes.length, `${path}.codePointCount`, "must match the observed code points");
  ensure(
    codePointIndexes.every(
      (index, position) => position === 0 || index === codePointIndexes[position - 1]! + 1,
    ),
    `${path}.codePointIndexes`,
    "must be contiguous",
  );
  const markerId = object.markerId === null
    ? null
    : enumAt(object.markerId, ["alpha", "beta"] as const, `${path}.markerId`);
  const decodedFrame = object.decodedFrame === null
    ? null
    : assertDecodedFrame(object.decodedFrame, `${path}.decodedFrame`);
  ensure(
    (markerId === null && decodedFrame === null) ||
      (markerId !== null && decodedFrame !== null && decodedFrame.markerId === markerId),
    `${path}.decodedFrame`,
    "must match markerId",
  );
  const context = enumAt(
    object.context,
    ["ordinary_body", "non_ordinary"] as const,
    `${path}.context`,
  );
  const anchor = enumAt(
    object.anchor,
    ["alpha_frozen", "beta_frozen", "not_frozen"] as const,
    `${path}.anchor`,
  );
  const decodeError = object.decodeError === null
    ? null
    : diagnosticAt(object.decodeError, `${path}.decodeError`, candidateId);
  ensure(
    decodedFrame === null ? decodeError !== null : decodeError === null,
    `${path}.decodeError`,
    "must match decodedFrame",
  );
  ensure(
    anchor === "not_frozen" || markerId === anchor.slice(0, -7),
    `${path}.anchor`,
    "must match markerId",
  );
  ensure(
    context === "ordinary_body" ||
      (decodedFrame === null && anchor === "not_frozen"),
    `${path}.context`,
    "must match decodedFrame and anchor",
  );
  return {
    markerId,
    partName: assertPartLabel(object.partName, `${path}.partName`),
    location: enumAt(
      object.location,
      ["body", "header", "footer", "footnote", "endnote", "comments", "other"] as const,
      `${path}.location`,
    ),
    paragraphIndex: nonNegativeIntegerAt(object.paragraphIndex, `${path}.paragraphIndex`),
    runIndices,
    codePointIndexes,
    codePointCount,
    codePoints,
    decodedFrame,
    context,
    anchor,
    decodeError,
  };
};

const assertCarrierRunProperty = (
  value: unknown,
  path: string,
): CarrierRunProperty => {
  const object = exactObject(
    value,
    ["partName", "paragraphIndex", "runIndex", "property", "valueClassification", "safeValue"],
    path,
  );
  const property = stringAt(object.property, `${path}.property`);
  ensure(SAFE_PROPERTY_PATTERN.test(property), `${path}.property`, "must use a safe property label");
  const valueClassification = enumAt(
    object.valueClassification,
    ["absent_value", "safe_literal", "redacted_literal"] as const,
    `${path}.valueClassification`,
  );
  const safeValue = object.safeValue === null
    ? null
    : stringAt(object.safeValue, `${path}.safeValue`);
  if (safeValue !== null) {
    ensure(
      /^(?:[0-9]+(?:\.[0-9]+)?|[0-9A-F]{6}|[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*|auto|clear|continuous|default|double|dotted|dashed|left|right|center|both|none|single|solid|yellow|0|1|true|false|on|off)$/i.test(safeValue),
      `${path}.safeValue`,
      "must use a fixed safe literal",
    );
  }
  ensure(
    valueClassification === "safe_literal" ? safeValue !== null : safeValue === null,
    `${path}.safeValue`,
    "does not match valueClassification",
  );
  return {
    partName: assertPartLabel(object.partName, `${path}.partName`),
    paragraphIndex: nonNegativeIntegerAt(object.paragraphIndex, `${path}.paragraphIndex`),
    runIndex: nonNegativeIntegerAt(object.runIndex, `${path}.runIndex`),
    property,
    valueClassification,
    safeValue,
  };
};

const assertForbiddenRunProperty = (
  value: unknown,
  path: string,
): ForbiddenRunProperty => {
  const object = exactObject(value, ["partName", "paragraphIndex", "runIndex", "property"], path);
  const property = stringAt(object.property, `${path}.property`);
  ensure(FORBIDDEN_PROPERTY_NAMES.has(property), `${path}.property`, "must use a fixed forbidden-property label");
  return {
    partName: assertPartLabel(object.partName, `${path}.partName`),
    paragraphIndex: nonNegativeIntegerAt(object.paragraphIndex, `${path}.paragraphIndex`),
    runIndex: nonNegativeIntegerAt(object.runIndex, `${path}.runIndex`),
    property,
  };
};

const assertCoreClassification = (
  value: unknown,
  path: string,
): CoreMetadataClassification =>
  enumAt(
    value,
    ["absent", "empty", "synthetic_expected", "non_synthetic_redacted"] as const,
    path,
  );

const safeBodyValue = (value: string, index: number, path: string): string => {
  ensure(
    value === "redacted-visible-body" || value === VISIBLE_PARAGRAPHS[index],
    path,
    "must be a frozen synthetic paragraph or a redacted body label",
  );
  return value;
};

const assertVisibleBodyParagraphs = (
  value: unknown,
  path: string,
): string[] =>
  stringArrayAt(value, path).map((paragraph, index) =>
    safeBodyValue(paragraph, index, `${path}[${index}]`),
  );

const assertInspection = (
  value: unknown,
  path: string,
  candidateId: CandidateId,
  mode: InspectionMode,
): InspectionEvidence => {
  const object = exactObject(
    value,
    ["candidateId", "mode", "entries", "carrierOccurrences", "markerPresence", "frameErrors", "unexpectedCandidateCodePoints", "visibleBodyParagraphs", "normalization", "carrierRunProperties", "forbiddenRunProperties", "coreMetadata", "safety"],
    path,
  );
  ensure(object.candidateId === candidateId, `${path}.candidateId`, "does not match candidate");
  ensure(object.mode === mode, `${path}.mode`, "does not match inspection mode");
  const entries = stringArrayAt(object.entries, `${path}.entries`).map((entry, index) =>
    assertEntryLabel(entry, `${path}.entries[${index}]`),
  );
  const carrierOccurrences = arrayAt(object.carrierOccurrences, `${path}.carrierOccurrences`).map((entry, index) =>
    assertCarrierOccurrence(entry, `${path}.carrierOccurrences[${index}]`, candidateId),
  );
  const frameErrors = diagnosticArrayAt(object.frameErrors, `${path}.frameErrors`, candidateId);
  const unexpectedCandidateCodePoints = arrayAt(object.unexpectedCandidateCodePoints, `${path}.unexpectedCandidateCodePoints`).map((entry, index) =>
    assertPackageOccurrence(entry, `${path}.unexpectedCandidateCodePoints[${index}]`),
  );
  const normalizationObject = exactObject(object.normalization, ["nfc", "nfkc"], `${path}.normalization`);
  const coreObject = exactObject(object.coreMetadata, ["creator", "lastModifiedBy"], `${path}.coreMetadata`);
  return {
    candidateId,
    mode,
    entries,
    carrierOccurrences,
    markerPresence: assertMarkerPresence(object.markerPresence, `${path}.markerPresence`),
    frameErrors,
    unexpectedCandidateCodePoints,
    visibleBodyParagraphs: assertVisibleBodyParagraphs(object.visibleBodyParagraphs, `${path}.visibleBodyParagraphs`),
    normalization: {
      nfc: enumAt(normalizationObject.nfc, ["unchanged", "changed"] as const, `${path}.normalization.nfc`),
      nfkc: enumAt(normalizationObject.nfkc, ["unchanged", "changed"] as const, `${path}.normalization.nfkc`),
    },
    carrierRunProperties: arrayAt(object.carrierRunProperties, `${path}.carrierRunProperties`).map((entry, index) =>
      assertCarrierRunProperty(entry, `${path}.carrierRunProperties[${index}]`),
    ),
    forbiddenRunProperties: arrayAt(object.forbiddenRunProperties, `${path}.forbiddenRunProperties`).map((entry, index) =>
      assertForbiddenRunProperty(entry, `${path}.forbiddenRunProperties[${index}]`),
    ),
    coreMetadata: {
      creator: assertCoreClassification(coreObject.creator, `${path}.coreMetadata.creator`),
      lastModifiedBy: assertCoreClassification(coreObject.lastModifiedBy, `${path}.coreMetadata.lastModifiedBy`),
    },
    safety: assertSafety(object.safety, `${path}.safety`),
  };
};

const assertCodePointOccurrence = (
  value: unknown,
  path: string,
): CodePointOccurrence => {
  const object = exactObject(value, ["codePoint", "codePointIndex"], path);
  return {
    codePoint: assertCodePointLabel(object.codePoint, `${path}.codePoint`),
    codePointIndex: nonNegativeIntegerAt(object.codePointIndex, `${path}.codePointIndex`),
  };
};

const assertTextCarrierRun = (
  value: unknown,
  path: string,
  candidateId: CandidateId,
): CarrierRunInspection => {
  const object = exactObject(
    value,
    ["startCodePointIndex", "endCodePointIndexExclusive", "codePointCount", "codePoints", "decodedFrame", "error"],
    path,
  );
  const startCodePointIndex = nonNegativeIntegerAt(object.startCodePointIndex, `${path}.startCodePointIndex`);
  const endCodePointIndexExclusive = nonNegativeIntegerAt(object.endCodePointIndexExclusive, `${path}.endCodePointIndexExclusive`);
  ensure(endCodePointIndexExclusive >= startCodePointIndex, `${path}.endCodePointIndexExclusive`, "must be after the start index");
  const codePoints = arrayAt(object.codePoints, `${path}.codePoints`).map((entry, index) =>
    assertCodePointLabel(entry, `${path}.codePoints[${index}]`),
  );
  const codePointCount = nonNegativeIntegerAt(object.codePointCount, `${path}.codePointCount`);
  ensure(codePointCount === codePoints.length, `${path}.codePointCount`, "must match codePoints");
  ensure(
    endCodePointIndexExclusive === startCodePointIndex + codePointCount,
    `${path}.endCodePointIndexExclusive`,
    "must match the observed code-point count",
  );
  const decodedFrame = object.decodedFrame === null
    ? null
    : assertDecodedFrame(object.decodedFrame, `${path}.decodedFrame`);
  const error = object.error === null
    ? null
    : diagnosticAt(object.error, `${path}.error`, candidateId);
  ensure(
    decodedFrame === null ? error !== null : true,
    `${path}.error`,
    "must explain an undecodable frame",
  );
  return {
    startCodePointIndex,
    endCodePointIndexExclusive,
    codePointCount,
    codePoints,
    decodedFrame,
    error,
  };
};

const assertTextInspection = (
  value: unknown,
  path: string,
  candidateId: CandidateId,
): ZeroWidthTextInspection => {
  const object = exactObject(
    value,
    ["candidateId", "validUtf8", "byteLength", "codePointLength", "normalization", "candidateCodePoints", "unexpectedCandidateCodePoints", "carrierRuns", "markerPresence", "frameErrors", "visibleBodyParagraphs"],
    path,
  );
  ensure(object.candidateId === candidateId, `${path}.candidateId`, "does not match candidate");
  ensure(object.validUtf8 === true, `${path}.validUtf8`, "must be true");
  const normalizationObject = exactObject(object.normalization, ["nfc", "nfkc"], `${path}.normalization`);
  const candidateCodePoints = arrayAt(object.candidateCodePoints, `${path}.candidateCodePoints`).map((entry, index) =>
    assertCodePointOccurrence(entry, `${path}.candidateCodePoints[${index}]`),
  );
  const unexpectedCandidateCodePoints = arrayAt(object.unexpectedCandidateCodePoints, `${path}.unexpectedCandidateCodePoints`).map((entry, index) =>
    assertCodePointOccurrence(entry, `${path}.unexpectedCandidateCodePoints[${index}]`),
  );
  const carrierRuns = arrayAt(object.carrierRuns, `${path}.carrierRuns`).map((entry, index) =>
    assertTextCarrierRun(entry, `${path}.carrierRuns[${index}]`, candidateId),
  );
  return {
    candidateId,
    validUtf8: true,
    byteLength: nonNegativeIntegerAt(object.byteLength, `${path}.byteLength`),
    codePointLength: nonNegativeIntegerAt(object.codePointLength, `${path}.codePointLength`),
    normalization: {
      nfc: enumAt(normalizationObject.nfc, ["unchanged", "changed"] as const, `${path}.normalization.nfc`),
      nfkc: enumAt(normalizationObject.nfkc, ["unchanged", "changed"] as const, `${path}.normalization.nfkc`),
    },
    candidateCodePoints,
    unexpectedCandidateCodePoints,
    carrierRuns,
    markerPresence: assertMarkerPresence(object.markerPresence, `${path}.markerPresence`),
    frameErrors: diagnosticArrayAt(object.frameErrors, `${path}.frameErrors`, candidateId),
    visibleBodyParagraphs: assertVisibleBodyParagraphs(object.visibleBodyParagraphs, `${path}.visibleBodyParagraphs`),
  };
};

const assertView = (value: unknown, path: string): ViewEvidence => {
  const object = exactObject(
    value,
    ["zoomPercent", "visibleBody", "carrierPresentation", "layoutDisturbance", "notes"],
    path,
  );
  ensure(object.zoomPercent === 100, `${path}.zoomPercent`, "must be 100");
  const visibleBody = enumAt(object.visibleBody, ["preserved", "changed", "lost", "not_assessable"] as const, `${path}.visibleBody`);
  ensure(visibleBody !== "not_assessable", `${path}.visibleBody`, "required visible-body evidence is not assessable");
  const carrierPresentation = enumAt(object.carrierPresentation, ["not_visible", "visible_marker_or_codepoint", "replacement_or_control_placeholder"] as const, `${path}.carrierPresentation`);
  const layoutDisturbance = enumAt(object.layoutDisturbance, ["none_observed", "minor", "material"] as const, `${path}.layoutDisturbance`);
  return {
    zoomPercent: 100,
    visibleBody,
    carrierPresentation,
    layoutDisturbance,
    notes: codeArrayAt(object.notes, `${path}.notes`, SAFE_VIEW_OBSERVATION_CODES),
  };
};

const assertApplication = (
  value: unknown,
  path: string,
): ApplicationEvidence => {
  const object = exactObject(value, ["name", "version"], path);
  return {
    name: stringAt(object.name, `${path}.name`),
    version: object.version === null
      ? null
      : versionAt(object.version, `${path}.version`),
  };
};

const assertPlatform = (
  value: unknown,
  path: string,
): PlatformEvidence => {
  const object = exactObject(value, ["name", "version", "build"], path);
  const name = stringAt(object.name, `${path}.name`);
  ensure(name === "macOS", `${path}.name`, "must use the frozen platform");
  return {
    name,
    version: object.version === null
      ? null
      : versionAt(object.version, `${path}.version`),
    build: object.build === null
      ? null
      : buildAt(object.build, `${path}.build`),
  };
};

const assertDocxRoundtrip = (
  value: unknown,
  path: string,
  candidateId: CandidateId,
  kind: "googleRoundtrip" | "wordRoundtrip",
): DocxRoundtripEvidence => {
  const object = exactObject(
    value,
    ["status", "sourceArtifactSha256", "resultArtifact", "inspection", "protocolDeviation", "distributionLimitations", "notes"],
    path,
  );
  ensure(object.status === "completed", `${path}.status`, "must be completed");
  return {
    status: "completed",
    sourceArtifactSha256: assertHash(object.sourceArtifactSha256, `${path}.sourceArtifactSha256`),
    resultArtifact: assertArtifactRef(object.resultArtifact, `${path}.resultArtifact`, candidateId, kind),
    inspection: assertInspection(object.inspection, `${path}.inspection`, candidateId, "transformed"),
    protocolDeviation: object.protocolDeviation === null
      ? null
      : codeAt(object.protocolDeviation, `${path}.protocolDeviation`, SAFE_PROTOCOL_DEVIATION_CODES),
    distributionLimitations: codeArrayAt(
      object.distributionLimitations,
      `${path}.distributionLimitations`,
      SAFE_DISTRIBUTION_LIMITATION_CODES,
    ),
    notes: exactCodeArrayAt(object.notes, `${path}.notes`, [], NO_NOTE_CODES),
  };
};

const assertPlainTextEvidence = (
  value: unknown,
  path: string,
  candidateId: CandidateId,
  kind: "googleCopy" | "wordCopy",
): PlainTextEvidence => {
  const object = exactObject(
    value,
    ["status", "sourceArtifactSha256", "resultArtifact", "inspection", "protocolDeviation", "notes"],
    path,
  );
  ensure(object.status === "completed", `${path}.status`, "must be completed");
  return {
    status: "completed",
    sourceArtifactSha256: assertHash(object.sourceArtifactSha256, `${path}.sourceArtifactSha256`),
    resultArtifact: assertArtifactRef(object.resultArtifact, `${path}.resultArtifact`, candidateId, kind),
    inspection: assertTextInspection(object.inspection, `${path}.inspection`, candidateId),
    protocolDeviation: object.protocolDeviation === null
      ? null
      : codeAt(object.protocolDeviation, `${path}.protocolDeviation`, SAFE_PROTOCOL_DEVIATION_CODES),
    notes: exactCodeArrayAt(object.notes, `${path}.notes`, [], NO_NOTE_CODES),
  };
};

const assertSelectionObservation = (
  value: unknown,
  path: string,
): SelectionObservation => {
  const selection = enumAt(value, ["nothing_observed", "carrier_or_placeholder_revealed", "not_assessable"] as const, path);
  ensure(selection !== "not_assessable", path, "required selection observation is not assessable");
  return selection;
};

const assertGoogleDocs = (
  value: unknown,
  path: string,
  candidateId: CandidateId,
): GoogleDocsCandidateEvidence => {
  const object = exactObject(
    value,
    ["application", "browser", "platform", "documentRule", "sourceArtifactSha256", "paginatedWhiteView", "darkView", "docxRoundtrip", "plainTextCopy", "selectionObservation", "screenReader", "limitations"],
    path,
  );
  const application = assertApplication(object.application, `${path}.application`);
  ensure(application.name === "Google Docs", `${path}.application.name`, "must be Google Docs");
  const browser = assertApplication(object.browser, `${path}.browser`);
  ensure(browser.name === "Google Chrome", `${path}.browser.name`, "must be Google Chrome");
  ensure(object.documentRule === "one new unshared document", `${path}.documentRule`, "does not match the frozen protocol");
  ensure(object.darkView === "not_assessable", `${path}.darkView`, "must be exactly not_assessable");
  ensure(object.screenReader === "not_assessable", `${path}.screenReader`, "must be exactly not_assessable");
  return {
    application: { name: "Google Docs", version: application.version },
    browser: { name: "Google Chrome", version: browser.version },
    platform: assertPlatform(object.platform, `${path}.platform`),
    documentRule: "one new unshared document",
    sourceArtifactSha256: assertHash(object.sourceArtifactSha256, `${path}.sourceArtifactSha256`),
    paginatedWhiteView: assertView(object.paginatedWhiteView, `${path}.paginatedWhiteView`),
    darkView: "not_assessable",
    docxRoundtrip: assertDocxRoundtrip(object.docxRoundtrip, `${path}.docxRoundtrip`, candidateId, "googleRoundtrip"),
    plainTextCopy: assertPlainTextEvidence(object.plainTextCopy, `${path}.plainTextCopy`, candidateId, "googleCopy"),
    selectionObservation: assertSelectionObservation(object.selectionObservation, `${path}.selectionObservation`),
    screenReader: "not_assessable",
    limitations: exactCodeArrayAt(
      object.limitations,
      `${path}.limitations`,
      GOOGLE_LIMITATIONS,
      SAFE_EDITOR_LIMITATION_CODES,
    ),
  };
};

const assertMicrosoftWord = (
  value: unknown,
  path: string,
  candidateId: CandidateId,
): MicrosoftWordCandidateEvidence => {
  const object = exactObject(
    value,
    ["application", "platform", "documentRule", "sourceArtifactSha256", "lightPrintLayout", "darkPageCanvas", "docxRoundtrip", "plainTextCopy", "selectionObservation", "accessibilityAssistant", "screenReader", "limitations"],
    path,
  );
  const application = assertApplication(object.application, `${path}.application`);
  ensure(application.name === "Microsoft Word", `${path}.application.name`, "must be Microsoft Word");
  ensure(object.documentRule === "open canonical source independently", `${path}.documentRule`, "does not match the frozen protocol");
  ensure(object.screenReader === "not_assessable", `${path}.screenReader`, "must be exactly not_assessable");
  const accessibility = exactObject(object.accessibilityAssistant, ["status", "findings", "limitations"], `${path}.accessibilityAssistant`);
  const accessibilityStatus = enumAt(accessibility.status, ["completed", "not_assessable"] as const, `${path}.accessibilityAssistant.status`);
  const accessibilityFindings = codeArrayAt(
    accessibility.findings,
    `${path}.accessibilityAssistant.findings`,
    SAFE_ACCESSIBILITY_FINDING_CODES,
  );
  const accessibilityLimitations = codeArrayAt(
    accessibility.limitations,
    `${path}.accessibilityAssistant.limitations`,
    SAFE_EDITOR_LIMITATION_CODES,
  );
  if (accessibilityStatus === "not_assessable") {
    ensure(
      sameValue(accessibilityLimitations, ACCESSIBILITY_NOT_ASSESSABLE_LIMITATIONS),
      `${path}.accessibilityAssistant.limitations`,
      "must use the fixed not_assessable limitation",
    );
  } else {
    ensure(
      accessibilityLimitations.length === 0,
      `${path}.accessibilityAssistant.limitations`,
      "completed evidence must not claim an unavailable limitation",
    );
  }
  return {
    application: { name: "Microsoft Word", version: application.version },
    platform: assertPlatform(object.platform, `${path}.platform`),
    documentRule: "open canonical source independently",
    sourceArtifactSha256: assertHash(object.sourceArtifactSha256, `${path}.sourceArtifactSha256`),
    lightPrintLayout: assertView(object.lightPrintLayout, `${path}.lightPrintLayout`),
    darkPageCanvas: assertView(object.darkPageCanvas, `${path}.darkPageCanvas`),
    docxRoundtrip: assertDocxRoundtrip(object.docxRoundtrip, `${path}.docxRoundtrip`, candidateId, "wordRoundtrip"),
    plainTextCopy: assertPlainTextEvidence(object.plainTextCopy, `${path}.plainTextCopy`, candidateId, "wordCopy"),
    selectionObservation: assertSelectionObservation(object.selectionObservation, `${path}.selectionObservation`),
    accessibilityAssistant: {
      status: accessibilityStatus,
      findings: accessibilityFindings,
      limitations: accessibilityLimitations,
    },
    screenReader: "not_assessable",
    limitations: exactCodeArrayAt(
      object.limitations,
      `${path}.limitations`,
      WORD_LIMITATIONS,
      SAFE_EDITOR_LIMITATION_CODES,
    ),
  };
};

const assertIsoDate = (value: unknown, path: string): ISODate => {
  const date = stringAt(value, path);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  ensure(match !== null, path, "must use YYYY-MM-DD");
  const parsed = new Date(`${date}T00:00:00Z`);
  ensure(
    parsed.getUTCFullYear() === Number(match[1]) &&
      parsed.getUTCMonth() + 1 === Number(match[2]) &&
      parsed.getUTCDate() === Number(match[3]),
    path,
    "must be a real calendar date",
  );
  return date as ISODate;
};

const assertCandidateRun = (
  value: unknown,
  path: string,
  index: number,
): CandidateRunEvidence => {
  const object = exactObject(
    value,
    ["candidateId", "documentProfile", "selectable", "priority", "canonicalArtifact", "googleDocs", "microsoftWord", "transportCriteriaSatisfied", "selectableCandidatePasses", "limitations"],
    path,
  );
  const expected = ZERO_WIDTH_CANDIDATES[index];
  ensure(expected !== undefined, path, "unexpected candidate index");
  ensure(object.candidateId === expected.id, `${path}.candidateId`, "does not match frozen candidate order");
  ensure(object.documentProfile === expected.documentProfile, `${path}.documentProfile`, "does not match candidate");
  ensure(object.selectable === expected.selectable, `${path}.selectable`, "does not match candidate");
  ensure(object.priority === expected.priority, `${path}.priority`, "does not match candidate");
  const candidateId = expected.id as CandidateId;
  const canonicalObject = exactObject(object.canonicalArtifact, ["path", "sha256", "inspection"], `${path}.canonicalArtifact`);
  const canonicalArtifact = {
    ...assertArtifactRef(
      { path: canonicalObject.path, sha256: canonicalObject.sha256 },
      `${path}.canonicalArtifact`,
      candidateId,
      "canonical",
    ),
    inspection: assertInspection(canonicalObject.inspection, `${path}.canonicalArtifact.inspection`, candidateId, "source"),
  };
  return {
    candidateId,
    documentProfile: expected.documentProfile,
    selectable: expected.selectable,
    priority: expected.priority,
    canonicalArtifact,
    googleDocs: assertGoogleDocs(object.googleDocs, `${path}.googleDocs`, candidateId),
    microsoftWord: assertMicrosoftWord(object.microsoftWord, `${path}.microsoftWord`, candidateId),
    transportCriteriaSatisfied: booleanAt(object.transportCriteriaSatisfied, `${path}.transportCriteriaSatisfied`),
    selectableCandidatePasses: booleanAt(object.selectableCandidatePasses, `${path}.selectableCandidatePasses`),
    limitations: exactCodeArrayAt(
      object.limitations,
      `${path}.limitations`,
      TRANSPORT_LIMITATIONS,
      new Set(TRANSPORT_LIMITATIONS),
    ),
  };
};

const assertRecordShape = (value: unknown): ZeroWidthBakeOffRunRecord => {
  const object = exactObject(
    value,
    ["experimentId", "experimentSchemaVersion", "date", "bakeOffProfile", "fingerprintStrategy", "fingerprintStrategyVersion", "matchingProfile", "fixedFrames", "visibleFixture", "sourceGenerator", "candidates", "gateDecision", "gateRationale", "limitations"],
    "$",
  );
  ensure(object.experimentId === EXPERIMENT_ID, "$.experimentId", "does not match the frozen experiment ID");
  ensure(object.experimentSchemaVersion === EXPERIMENT_SCHEMA_VERSION, "$.experimentSchemaVersion", "does not match the frozen schema version");
  const date = assertIsoDate(object.date, "$.date");
  ensure(object.bakeOffProfile === BAKE_OFF_PROFILE, "$.bakeOffProfile", "does not match the frozen bake-off profile");
  ensure(object.fingerprintStrategy === null, "$.fingerprintStrategy", "must remain null");
  ensure(object.fingerprintStrategyVersion === null, "$.fingerprintStrategyVersion", "must remain null");
  ensure(object.matchingProfile === null, "$.matchingProfile", "must remain null");
  const fixedFrames = exactObject(object.fixedFrames, ["alphaHex", "betaHex", "crcProfile"], "$.fixedFrames");
  ensure(fixedFrames.alphaHex === FIXED_FRAME_ALPHA_HEX, "$.fixedFrames.alphaHex", "does not match the frozen Alpha frame");
  ensure(fixedFrames.betaHex === FIXED_FRAME_BETA_HEX, "$.fixedFrames.betaHex", "does not match the frozen Beta frame");
  ensure(fixedFrames.crcProfile === "CRC-16/CCITT-FALSE", "$.fixedFrames.crcProfile", "does not match the frozen CRC profile");
  const visibleFixture = exactObject(object.visibleFixture, ["id", "sourcePath"], "$.visibleFixture");
  ensure(visibleFixture.id === VISIBLE_FIXTURE_ID, "$.visibleFixture.id", "does not match the frozen visible fixture");
  ensure(visibleFixture.sourcePath === SOURCE_FIXTURE_PATH, "$.visibleFixture.sourcePath", "does not match the frozen fixture path");
  const sourceGenerator = exactObject(object.sourceGenerator, ["path", "gitCommit", "nodeVersion", "pnpmVersion", "docxVersion"], "$.sourceGenerator");
  ensure(sourceGenerator.path === SOURCE_GENERATOR_PATH, "$.sourceGenerator.path", "does not match the frozen generator path");
  ensure(sourceGenerator.docxVersion === DOCX_VERSION, "$.sourceGenerator.docxVersion", "does not match the frozen docx dependency");
  const gitCommit = stringAt(sourceGenerator.gitCommit, "$.sourceGenerator.gitCommit");
  ensure(GIT_COMMIT_PATTERN.test(gitCommit), "$.sourceGenerator.gitCommit", "must be a lowercase 40-character commit SHA");
  ensure(gitCommit === ZERO_WIDTH_GENERATION_CHECKPOINT, "$.sourceGenerator.gitCommit", "must equal the frozen generation checkpoint");
  const candidatesValue = arrayAt(object.candidates, "$.candidates");
  ensure(candidatesValue.length === 3, "$.candidates", "must contain exactly three candidates");
  const candidates = candidatesValue.map((entry, index) => assertCandidateRun(entry, `$.candidates[${index}]`, index)) as [CandidateRunEvidence, CandidateRunEvidence, CandidateRunEvidence];
  const gateDecision = enumAt(object.gateDecision, ["SELECT_A", "SELECT_B", "REVISE_ZERO_WIDTH_CARRIER", "ABANDON_ZERO_WIDTH_CARRIER"] as const, "$.gateDecision");
  const gateRationale = exactCodeArrayAt(
    object.gateRationale,
    "$.gateRationale",
    [GATE_RATIONALES[gateDecision]],
    new Set(Object.values(GATE_RATIONALES)),
  );
  assertSafeRecordContent(value);
  return {
    experimentId: EXPERIMENT_ID,
    experimentSchemaVersion: 1,
    date,
    bakeOffProfile: BAKE_OFF_PROFILE,
    fingerprintStrategy: null,
    fingerprintStrategyVersion: null,
    matchingProfile: null,
    fixedFrames: {
      alphaHex: FIXED_FRAME_ALPHA_HEX,
      betaHex: FIXED_FRAME_BETA_HEX,
      crcProfile: "CRC-16/CCITT-FALSE",
    },
    visibleFixture: {
      id: VISIBLE_FIXTURE_ID,
      sourcePath: SOURCE_FIXTURE_PATH,
    },
    sourceGenerator: {
      path: SOURCE_GENERATOR_PATH,
      gitCommit: gitCommit as typeof ZERO_WIDTH_GENERATION_CHECKPOINT,
      nodeVersion: versionAt(sourceGenerator.nodeVersion, "$.sourceGenerator.nodeVersion"),
      pnpmVersion: versionAt(sourceGenerator.pnpmVersion, "$.sourceGenerator.pnpmVersion"),
      docxVersion: DOCX_VERSION,
    },
    candidates,
    gateDecision,
    gateRationale: [gateRationale[0]!],
    limitations: exactCodeArrayAt(
      object.limitations,
      "$.limitations",
      TRANSPORT_LIMITATIONS,
      new Set(TRANSPORT_LIMITATIONS),
    ),
  };
};

export const assertValidZeroWidthCarrierRun = (
  value: unknown,
): ZeroWidthBakeOffRunRecord => assertRecordShape(value);

const artifactAbsolutePath = async (
  repositoryRoot: string,
  artifact: ArtifactEvidence,
  path: string,
): Promise<string> => {
  const canonicalRepositoryRoot = await realpath(repositoryRoot).catch(() => null);
  ensure(canonicalRepositoryRoot !== null, path, "repository root could not be resolved");
  const artifactDirectory = resolve(canonicalRepositoryRoot, ARTIFACT_DIRECTORY);
  const artifactDirectoryInfo = await lstat(artifactDirectory).catch(() => null);
  ensure(
    artifactDirectoryInfo?.isDirectory() === true && !artifactDirectoryInfo.isSymbolicLink(),
    path,
    "artifact directory must be a real directory",
  );
  const absolutePath = resolve(canonicalRepositoryRoot, artifact.path);
  ensure(isInside(canonicalRepositoryRoot, absolutePath), path, "artifact path escaped repository root");
  ensure(isInside(artifactDirectory, absolutePath), path, "artifact path escaped artifact directory");
  const fileInfo = await lstat(absolutePath).catch(() => null);
  ensure(fileInfo?.isFile() === true && !fileInfo.isSymbolicLink(), path, "artifact must be a regular non-symlink file");
  const canonicalDirectory = await realpath(artifactDirectory).catch(() => null);
  const canonicalFile = await realpath(absolutePath).catch(() => null);
  ensure(canonicalDirectory !== null && canonicalFile !== null, path, "artifact path could not be resolved");
  ensure(isInside(canonicalRepositoryRoot, canonicalDirectory), path, "artifact directory escaped repository root");
  ensure(isInside(canonicalRepositoryRoot, canonicalFile), path, "artifact path escaped repository root");
  ensure(isInside(canonicalDirectory, canonicalFile), path, "artifact path escaped artifact directory");
  return canonicalFile;
};

const assertGenerationCheckpointResolves = async (
  repositoryRoot: string,
  commit: string,
): Promise<void> => {
  const sourceRepositoryRoot = fileURLToPath(new URL("..", import.meta.url));
  const roots = [...new Set([repositoryRoot, process.cwd(), sourceRepositoryRoot])];
  for (const root of roots) {
    try {
      await execFileAsync(
        "git",
        ["-C", root, "cat-file", "-e", `${commit}^{commit}`],
        { encoding: "utf8" },
      );
      return;
    } catch {
      // Synthetic validation roots may not contain a Git checkout; the
      // source checkout still must resolve the frozen object locally.
    }
  }
  throw new Error("$.sourceGenerator.gitCommit: checkpoint does not resolve locally");
};

const readArtifact = async (
  repositoryRoot: string,
  artifact: ArtifactEvidence,
  path: string,
): Promise<{ bytes: Uint8Array; sha256: SHA256 }> => {
  const absolutePath = await artifactAbsolutePath(repositoryRoot, artifact, path);
  const bytes = await readFile(absolutePath).catch(() => null);
  ensure(bytes !== null, path, "artifact could not be read");
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  ensure(sha256 === artifact.sha256, `${path}.sha256`, "does not match artifact bytes");
  return { bytes, sha256 };
};

const arraysEqual = <T>(left: readonly T[], right: readonly T[]): boolean =>
  left.length === right.length && left.every((value, index) => value === right[index]);

type FrameAndBodyEvidence = Readonly<{
  markerPresence: Readonly<{ alpha: MarkerPresence; beta: MarkerPresence }>;
  frameErrors: readonly string[];
  unexpectedCandidateCodePoints: readonly unknown[];
  visibleBodyParagraphs: readonly string[];
  carrierOccurrences?: readonly DocxCarrierOccurrence[];
}>;

const expectedCodePointStart = (markerId: "alpha" | "beta"): number => {
  const paragraph = VISIBLE_PARAGRAPHS[markerId === "alpha" ? 0 : 2];
  return [...paragraph.slice(0, paragraph.indexOf(".") + 1)].length;
};

const expectedOccurrence = (
  occurrence: DocxCarrierOccurrence,
  candidateId: CandidateId,
): boolean => {
  if (
    occurrence.markerId === null ||
    occurrence.decodedFrame === null ||
    occurrence.context !== "ordinary_body" ||
    occurrence.anchor !== `${occurrence.markerId}_frozen` ||
    occurrence.partName !== "word/document.xml" ||
    occurrence.location !== "body" ||
    occurrence.paragraphIndex !== (occurrence.markerId === "alpha" ? 0 : 2) ||
    occurrence.codePointCount !== ZERO_WIDTH_CANDIDATES.find(({ id }) => id === candidateId)?.codePointsPerFrame ||
    occurrence.codePointIndexes[0] !== expectedCodePointStart(occurrence.markerId)
  ) {
    return false;
  }
  return occurrence.runIndices.length > 0;
};

const exactFramesAndBody = (
  value: FrameAndBodyEvidence,
  candidateId?: CandidateId,
): boolean =>
  value.markerPresence.alpha === "present" &&
  value.markerPresence.beta === "present" &&
  value.frameErrors.length === 0 &&
  value.unexpectedCandidateCodePoints.length === 0 &&
  arraysEqual(value.visibleBodyParagraphs, VISIBLE_PARAGRAPHS) &&
  (value.carrierOccurrences === undefined ||
    (candidateId !== undefined &&
      value.carrierOccurrences.length === 2 &&
      value.carrierOccurrences.every((occurrence) =>
        expectedOccurrence(occurrence, candidateId),
      )));

const safetyPasses = (value: SafetyInspection): boolean =>
  Object.values(value).every((findings) => findings.length === 0);

const expectedBodyPositionsPass = (
  occurrences: readonly DocxCarrierOccurrence[],
  candidateId: CandidateId,
  source = false,
): boolean =>
  occurrences.length === 2 &&
  occurrences[0]?.markerId === "alpha" &&
  occurrences[1]?.markerId === "beta" &&
  expectedOccurrence(occurrences[0]!, candidateId) &&
  expectedOccurrence(occurrences[1]!, candidateId) &&
  (source
    ? occurrences[0]!.runIndices.length === 1 &&
      occurrences[0]!.runIndices[0] === 1 &&
      occurrences[1]!.runIndices.length === 1 &&
      occurrences[1]!.runIndices[0] === 1
    : true);

const expectedSourceCore = (
  value: InspectionEvidence,
): boolean =>
  value.coreMetadata.creator === "synthetic_expected" &&
  value.coreMetadata.lastModifiedBy === "synthetic_expected" &&
  value.normalization.nfc === "unchanged" &&
  value.normalization.nfkc === "unchanged";

const sourcePasses = (
  artifact: CandidateRunEvidence["canonicalArtifact"],
): boolean => {
  const candidate = ZERO_WIDTH_CANDIDATES.find(({ id }) => id === artifact.inspection.candidateId);
  return (
    candidate !== undefined &&
    artifact.inspection.mode === "source" &&
    exactFramesAndBody(artifact.inspection, candidate.id) &&
    expectedSourceCore(artifact.inspection) &&
    expectedBodyPositionsPass(artifact.inspection.carrierOccurrences, candidate.id, true) &&
    artifact.inspection.carrierOccurrences.every(
      (occurrence) =>
        occurrence.runIndices.length === 1 &&
        occurrence.runIndices[0] === 1 &&
        occurrence.codePointCount === candidate.codePointsPerFrame,
    ) &&
    artifact.inspection.carrierRunProperties.length === 0 &&
    artifact.inspection.forbiddenRunProperties.length === 0 &&
    safetyPasses(artifact.inspection.safety)
  );
};

const docxPasses = (
  value: DocxRoundtripEvidence,
  candidateId: CandidateId,
): boolean =>
  value.status === "completed" &&
  value.inspection.candidateId === candidateId &&
  value.inspection.mode === "transformed" &&
  exactFramesAndBody(value.inspection, candidateId) &&
  expectedBodyPositionsPass(value.inspection.carrierOccurrences, candidateId) &&
  value.inspection.forbiddenRunProperties.length === 0 &&
  safetyPasses(value.inspection.safety);

const copyPasses = (
  value: PlainTextEvidence,
  candidateId: CandidateId,
): boolean =>
  value.status === "completed" &&
  value.inspection.candidateId === candidateId &&
  value.inspection.validUtf8 &&
  exactFramesAndBody(value.inspection, candidateId);

export const hasBoundedTransportEvidence = (
  candidate: CandidateRunEvidence,
): boolean =>
  exactFramesAndBody(candidate.googleDocs.docxRoundtrip.inspection, candidate.candidateId) ||
  exactFramesAndBody(candidate.microsoftWord.docxRoundtrip.inspection, candidate.candidateId) ||
  exactFramesAndBody(candidate.googleDocs.plainTextCopy.inspection, candidate.candidateId) ||
  exactFramesAndBody(candidate.microsoftWord.plainTextCopy.inspection, candidate.candidateId);

export const criteriaSatisfied = (
  candidate: CandidateRunEvidence,
): boolean =>
  candidate.canonicalArtifact.inspection.candidateId === candidate.candidateId &&
  sourcePasses(candidate.canonicalArtifact) &&
  docxPasses(candidate.googleDocs.docxRoundtrip, candidate.candidateId) &&
  docxPasses(candidate.microsoftWord.docxRoundtrip, candidate.candidateId) &&
  copyPasses(candidate.googleDocs.plainTextCopy, candidate.candidateId) &&
  copyPasses(candidate.microsoftWord.plainTextCopy, candidate.candidateId) &&
  candidate.googleDocs.paginatedWhiteView.visibleBody === "preserved" &&
  candidate.googleDocs.paginatedWhiteView.carrierPresentation === "not_visible" &&
  candidate.googleDocs.paginatedWhiteView.layoutDisturbance === "none_observed" &&
  candidate.microsoftWord.lightPrintLayout.visibleBody === "preserved" &&
  candidate.microsoftWord.lightPrintLayout.carrierPresentation === "not_visible" &&
  candidate.microsoftWord.lightPrintLayout.layoutDisturbance === "none_observed" &&
  candidate.microsoftWord.darkPageCanvas.visibleBody === "preserved" &&
  candidate.microsoftWord.darkPageCanvas.carrierPresentation === "not_visible" &&
  candidate.microsoftWord.darkPageCanvas.layoutDisturbance === "none_observed";

export function deriveZeroWidthGate(
  candidates: readonly CandidateRunEvidence[],
): GateDecision {
  ensure(candidates.length === 3, "$.candidates", "must contain exactly three candidates");
  ensure(
    candidates[0]?.candidateId === "join-control-binary-v1" &&
      candidates[1]?.candidateId === "invisible-operator-binary-v1" &&
      candidates[2]?.candidateId === "variation-selector-byte-v1",
    "$.candidates",
    "candidates are not in frozen order",
  );
  if (candidates[0] && criteriaSatisfied(candidates[0])) return "SELECT_A";
  if (candidates[1] && criteriaSatisfied(candidates[1])) return "SELECT_B";
  return candidates.some(hasBoundedTransportEvidence)
    ? "REVISE_ZERO_WIDTH_CARRIER"
    : "ABANDON_ZERO_WIDTH_CARRIER";
};

const assertMetadataLimitations = (
  evidence: DocxRoundtripEvidence,
  path: string,
): void => {
  const { coreMetadata } = evidence.inspection;
  if (
    coreMetadata.creator === "non_synthetic_redacted" ||
    coreMetadata.lastModifiedBy === "non_synthetic_redacted"
  ) {
    ensure(
      evidence.protocolDeviation === "core-metadata-redacted",
      `${path}.protocolDeviation`,
      "required for redacted core metadata",
    );
    ensure(
      sameValue(evidence.distributionLimitations, ["core-metadata-requires-privacy-review"]),
      `${path}.distributionLimitations`,
      "required for redacted core metadata",
    );
  }
};

const assertSelectionAndViews = (candidate: CandidateRunEvidence, path: string): void => {
  ensure(candidate.googleDocs.selectionObservation !== "not_assessable", `${path}.googleDocs.selectionObservation`, "required selection observation is not assessable");
  ensure(candidate.microsoftWord.selectionObservation !== "not_assessable", `${path}.microsoftWord.selectionObservation`, "required selection observation is not assessable");
  for (const [viewPath, view] of [
    [`${path}.googleDocs.paginatedWhiteView`, candidate.googleDocs.paginatedWhiteView],
    [`${path}.microsoftWord.lightPrintLayout`, candidate.microsoftWord.lightPrintLayout],
    [`${path}.microsoftWord.darkPageCanvas`, candidate.microsoftWord.darkPageCanvas],
  ] as const) {
    ensure(view.visibleBody !== "not_assessable", viewPath, "required visible-body evidence is not assessable");
    ensure(view.zoomPercent === 100, `${viewPath}.zoomPercent`, "must be 100");
  }
};

const validateDocxObservation = async (
  repositoryRoot: string,
  artifact: ArtifactEvidence,
  inspection: InspectionEvidence,
  candidateId: CandidateId,
  mode: InspectionMode,
  path: string,
): Promise<void> => {
  const observed = await readArtifact(repositoryRoot, artifact, path);
  let actual: InspectionEvidence;
  try {
    actual = inspectZeroWidthDocx(observed.bytes, candidateId, mode);
  } catch {
    throw new Error(`${path}: DOCX inspection failed`);
  }
  equalAt(inspection, actual, `${path}.inspection`);
};

const validateTextObservation = async (
  repositoryRoot: string,
  artifact: ArtifactEvidence,
  inspection: ZeroWidthTextInspection,
  candidateId: CandidateId,
  path: string,
): Promise<void> => {
  const observed = await readArtifact(repositoryRoot, artifact, path);
  let actual: ZeroWidthTextInspection;
  try {
    actual = inspectZeroWidthText(observed.bytes, candidateId);
  } catch {
    throw new Error(`${path}: UTF-8 text inspection failed`);
  }
  equalAt(inspection, actual, `${path}.inspection`);
};

const validateCandidateArtifacts = async (
  repositoryRoot: string,
  candidate: CandidateRunEvidence,
  index: number,
): Promise<void> => {
  const path = `$.candidates[${index}]`;
  const sourceHash = candidate.canonicalArtifact.sha256;
  ensure(candidate.googleDocs.sourceArtifactSha256 === sourceHash, `${path}.googleDocs.sourceArtifactSha256`, "must match canonical source hash");
  ensure(candidate.microsoftWord.sourceArtifactSha256 === sourceHash, `${path}.microsoftWord.sourceArtifactSha256`, "must match canonical source hash");

  const googleRoundtrip = candidate.googleDocs.docxRoundtrip;
  const wordRoundtrip = candidate.microsoftWord.docxRoundtrip;
  const googleCopy = candidate.googleDocs.plainTextCopy;
  const wordCopy = candidate.microsoftWord.plainTextCopy;
  for (const [evidence, evidencePath] of [
    [googleRoundtrip, `${path}.googleDocs.docxRoundtrip`],
    [wordRoundtrip, `${path}.microsoftWord.docxRoundtrip`],
  ] as const) {
    ensure(evidence.sourceArtifactSha256 === sourceHash, `${evidencePath}.sourceArtifactSha256`, "must match canonical source hash");
    await validateDocxObservation(repositoryRoot, evidence.resultArtifact, evidence.inspection, candidate.candidateId, "transformed", evidencePath);
    assertMetadataLimitations(evidence, evidencePath);
  }
  for (const [evidence, evidencePath] of [
    [googleCopy, `${path}.googleDocs.plainTextCopy`],
    [wordCopy, `${path}.microsoftWord.plainTextCopy`],
  ] as const) {
    ensure(evidence.sourceArtifactSha256 === sourceHash, `${evidencePath}.sourceArtifactSha256`, "must match canonical source hash");
    await validateTextObservation(repositoryRoot, evidence.resultArtifact, evidence.inspection, candidate.candidateId, evidencePath);
  }
  assertSelectionAndViews(candidate, path);
  const expectedTransport = criteriaSatisfied(candidate);
  ensure(candidate.transportCriteriaSatisfied === expectedTransport, `${path}.transportCriteriaSatisfied`, "does not match the mechanical transport criteria");
  ensure(candidate.selectableCandidatePasses === (candidate.selectable && expectedTransport), `${path}.selectableCandidatePasses`, "does not match selectable candidate criteria");
};

export async function validateZeroWidthCarrierRun(
  value: unknown,
  root?: string,
): Promise<ZeroWidthBakeOffRunRecord> {
  const record = assertRecordShape(value);
  const repositoryRoot = resolve(root ?? process.cwd());
  await assertGenerationCheckpointResolves(
    repositoryRoot,
    record.sourceGenerator.gitCommit,
  );
  // Validate all three canonical sources first. An invalid canonical source is
  // invalid evidence and must never be downgraded to a transport revision.
  for (const [index, candidate] of record.candidates.entries()) {
    const path = `$.candidates[${index}]`;
    const canonical = await readArtifact(repositoryRoot, candidate.canonicalArtifact, `${path}.canonicalArtifact`);
    let observed: InspectionEvidence;
    try {
      observed = inspectZeroWidthDocx(canonical.bytes, candidate.candidateId, "source");
    } catch {
      throw new Error(`${path}.canonicalArtifact: DOCX source inspection failed`);
    }
    equalAt(candidate.canonicalArtifact.inspection, observed, `${path}.canonicalArtifact.inspection`);
    ensure(sourcePasses(candidate.canonicalArtifact), `${path}.canonicalArtifact.inspection`, "does not satisfy the exact canonical source contract");
  }
  for (const [index, candidate] of record.candidates.entries()) {
    await validateCandidateArtifacts(repositoryRoot, candidate, index);
  }
  const derivedGate = deriveZeroWidthGate(record.candidates);
  ensure(record.gateDecision === derivedGate, "$.gateDecision", "does not match the mechanical gate");
  return record;
}

const selectedDocumentProfile = (
  record: ZeroWidthBakeOffRunRecord,
): DocumentProfile | null => {
  if (record.gateDecision === "SELECT_A") return record.candidates[0].documentProfile;
  if (record.gateDecision === "SELECT_B") return record.candidates[1].documentProfile;
  return null;
};

const runAsCli = process.argv[1]?.endsWith(
  "/scripts/validate-docx-zero-width-carrier-run.ts",
);

const main = async (): Promise<void> => {
  ensure(process.argv.length === 2, "$", FAILURE_USAGE);
  const repositoryRoot = process.env.GLYPH_REPOSITORY_ROOT ?? fileURLToPath(new URL("..", import.meta.url));
  const runPath = resolve(repositoryRoot, RUN_RECORD_PATH);
  let recordText: string;
  try {
    recordText = await readFile(runPath, "utf8");
  } catch {
    throw new Error("Unable to read the zero-width run record.");
  }
  let value: unknown;
  try {
    value = JSON.parse(recordText) as unknown;
  } catch {
    throw new Error("The zero-width run record is not valid JSON.");
  }
  const record = await validateZeroWidthCarrierRun(value, repositoryRoot);
  process.stdout.write(`${JSON.stringify({
    status: "valid",
    gateDecision: record.gateDecision,
    selectedDocumentProfile: selectedDocumentProfile(record),
  })}\n`);
};

if (runAsCli) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Unable to validate the zero-width run record.");
    process.exitCode = 1;
  });
}
