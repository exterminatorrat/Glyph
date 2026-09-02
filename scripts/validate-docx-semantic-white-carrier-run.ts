import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  lstat,
  readFile,
  realpath,
} from "node:fs/promises";
import {
  isAbsolute,
  relative,
  resolve,
} from "node:path";
import {
  CANDIDATE_ID,
  DOCUMENT_PROFILE,
  EXPERIMENT_ID,
  EXPERIMENT_SCHEMA_VERSION,
  FIXED_MARKER_ALPHA,
  FIXED_MARKER_BETA,
  QUALIFICATION_FIXTURE,
  QUALIFICATION_PROFILE,
  VISIBLE_FIXTURE_ID,
  VISIBLE_PARAGRAPHS,
} from "../research/experiments/docx-semantic-white-carrier-qualification-v1/fixture.ts";
import {
  inspectSemanticWhiteCarrier,
} from "../research/experiments/docx-semantic-white-carrier-qualification-v1/inspect-semantic-white-docx.ts";

export type ISODate = `${number}-${number}-${number}`;
export type SHA256 = string;
export type MarkerPresence = "present" | "absent";
export type VisibleBody =
  | "preserved"
  | "changed"
  | "lost"
  | "not_assessable";
export type OrdinaryVisibility =
  | "not_visible"
  | "visible"
  | "not_assessable";
export type LayoutDisturbance =
  | "none_observed"
  | "minor"
  | "material"
  | "not_assessable";
export type RevealObservation =
  | "revealed"
  | "not_revealed"
  | "not_assessable";
export type SafetyEvidence = Readonly<{
  externalRelationships: readonly string[];
  unresolvedRelationshipTargets: readonly string[];
  activeContentEntries: readonly string[];
  activeRelationshipTypes: readonly string[];
  macroContentTypes: readonly string[];
}>;
export type MechanismEvidence = Readonly<{
  markerId: "alpha" | "beta";
  partName: string;
  location:
    | "body"
    | "header"
    | "footer"
    | "footnote"
    | "endnote"
    | "comments"
    | "other";
  paragraphIndex: number;
  runIndex: number;
  directColorValue: string | null;
  themeColor: string | null;
  themeTint: string | null;
  themeShade: string | null;
  hidden: boolean;
  sizeHalfPoints: number | null;
  sizeComplexScriptHalfPoints: number | null;
  shadingFill: string | null;
  highlight: string | null;
  semanticDirectWhite: boolean;
  forbiddenProperties: readonly string[];
}>;
export type ArtifactEvidence = Readonly<{
  path: string;
  sha256: SHA256;
}>;
export type DocxEvidence = Readonly<{
  status: "completed";
  sourceArtifactSha256: SHA256;
  resultArtifact: ArtifactEvidence;
  markerPresence: Readonly<{ alpha: MarkerPresence; beta: MarkerPresence }>;
  visibleBody: VisibleBody;
  visibleBodyParagraphs: readonly string[];
  markerMechanisms: readonly MechanismEvidence[];
  safety: SafetyEvidence;
  protocolDeviation: string | null;
  notes: readonly string[];
}>;
export type CopyEvidence = Readonly<{
  status: "completed";
  sourceArtifactSha256: SHA256;
  resultArtifact: ArtifactEvidence;
  markerPresence: Readonly<{ alpha: MarkerPresence; beta: MarkerPresence }>;
  visibleBody: VisibleBody;
  visibleBodyParagraphs: readonly string[];
  protocolDeviation: string | null;
  notes: readonly string[];
}>;
export type ViewEvidence = Readonly<{
  zoomPercent: 100;
  ordinaryVisibility: OrdinaryVisibility;
  layoutDisturbance: LayoutDisturbance;
  visibleBody: VisibleBody;
  notes: readonly string[];
}>;
export type SourceGeneratorRecord = Readonly<{
  path: "src/documents/docx/docx-matching-color-body-v2.ts";
  gitCommit: string;
  nodeVersion: string;
  pnpmVersion: string;
  docxVersion: "9.7.1";
}>;
export type CanonicalEvidence = ArtifactEvidence &
  Readonly<{
    markerPresence: Readonly<{
      alpha: MarkerPresence;
      beta: MarkerPresence;
    }>;
    visibleBodyParagraphs: readonly string[];
    markerMechanisms: readonly MechanismEvidence[];
    safety: SafetyEvidence;
  }>;
export type GoogleDocsEvidence = Readonly<{
  application: Readonly<{ name: "Google Docs"; version: string | null }>;
  browser: Readonly<{ name: "Google Chrome"; version: string | null }>;
  platform: Readonly<{
    name: string;
    version: string | null;
    build: string | null;
  }>;
  documentRule: "one new unshared document";
  sourceArtifactSha256: SHA256;
  defaultView: ViewEvidence;
  darkView: "not_assessable";
  docxRoundtrip: DocxEvidence;
  plainTextCopy: CopyEvidence;
  selectionReveal: RevealObservation;
  screenReader: "not_assessable";
  limitations: readonly string[];
}>;
export type MicrosoftWordEvidence = Readonly<{
  application: Readonly<{ name: "Microsoft Word"; version: string | null }>;
  platform: Readonly<{
    name: string;
    version: string | null;
    build: string | null;
  }>;
  documentRule: "open canonical source independently";
  sourceArtifactSha256: SHA256;
  lightView: ViewEvidence;
  darkView: ViewEvidence;
  docxRoundtrip: DocxEvidence;
  plainTextCopy: CopyEvidence;
  selectionReveal: RevealObservation;
  accessibilityAssistant: Readonly<{
    status: "completed" | "not_assessable";
    findings: readonly string[];
    limitations: readonly string[];
  }>;
  screenReader: "not_assessable";
  limitations: readonly string[];
}>;
export type QualificationRunRecord = Readonly<{
  experimentId: typeof EXPERIMENT_ID;
  experimentSchemaVersion: 1;
  date: ISODate;
  qualificationProfile: typeof QUALIFICATION_PROFILE;
  candidateId: typeof CANDIDATE_ID;
  documentProfile: typeof DOCUMENT_PROFILE;
  fingerprintStrategy: null;
  fingerprintStrategyVersion: null;
  matchingProfile: null;
  fixedMarkers: Readonly<{ alpha: string; beta: string }>;
  visibleFixture: Readonly<{ id: string; sourcePath: string }>;
  sourceGenerator: SourceGeneratorRecord;
  canonicalArtifact: CanonicalEvidence;
  googleDocs: GoogleDocsEvidence;
  microsoftWord: MicrosoftWordEvidence;
  gateDecision: "PROCEED" | "REVISE_CARRIER" | "ABANDON_CARRIER";
  gateRationale: readonly string[];
  limitations: readonly string[];
}>;

type UnknownRecord = Record<string, unknown>;

const ARTIFACT_DIRECTORY =
  "research/artifacts/docx-semantic-white-carrier-qualification-v1";
const ARTIFACT_PATHS = {
  canonical: `${ARTIFACT_DIRECTORY}/matching-color-body-v2.docx`,
  googleRoundtrip: `${ARTIFACT_DIRECTORY}/matching-color-body-v2-google-docs-roundtrip.docx`,
  googleCopy: `${ARTIFACT_DIRECTORY}/matching-color-body-v2-google-docs-copy-plain-text.txt`,
  wordRoundtrip: `${ARTIFACT_DIRECTORY}/matching-color-body-v2-microsoft-word-roundtrip.docx`,
  wordCopy: `${ARTIFACT_DIRECTORY}/matching-color-body-v2-microsoft-word-copy-plain-text.txt`,
} as const;
const REQUIRED_SAFETY_KEYS = [
  "externalRelationships",
  "unresolvedRelationshipTargets",
  "activeContentEntries",
  "activeRelationshipTypes",
  "macroContentTypes",
] as const;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const SOURCE_GENERATOR_PATH =
  "src/documents/docx/docx-matching-color-body-v2.ts";
const SOURCE_FIXTURE_PATH =
  "research/experiments/docx-hidden-run-v1/fixture.ts";
const DOCX_VERSION = "9.7.1";
const FAILURE_USAGE =
  "Usage: pnpm research:carrier:semantic-white:validate (reads run-001.json)";
const FORBIDDEN_KEY_PATTERN =
  /(?:account|credential|password|secret|token|api[_-]?key|access[_-]?key|refresh[_-]?token|authorization|bearer|email|username|user[_-]?id|student|teacher|school|class|identity|session|cookie|prompt|response|submission|assignment|answer|raw|payload|document[_-]?(?:id|url|uri)|cloud|url|uri|href)/i;
const FORBIDDEN_VALUE_PATTERN =
  /(?:-----BEGIN [^-]+ PRIVATE KEY-----|\bBearer\s+\S+|\b(?:sk|rk|pk|ghp|github_pat|xox[abprs])[-_][A-Za-z0-9_-]+)/i;
const URL_PATTERN = /(?:https?|ftp|gs|s3):\/\//i;
const EMAIL_PATTERN =
  /\b[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+\b/i;
const ACCOUNT_TOKEN_PATTERN =
  /\b(?:acct|account|user|profile|customer|tenant|workspace|organization|org)_[A-Z0-9][A-Z0-9_-]{2,}\b/i;
const ACCOUNT_LABEL_PATTERN =
  /\b(?:account|user|profile|customer|tenant|workspace|organization|org)\s*(?:id|identifier|number)?\s*[:=#]\s*[A-Z0-9][A-Z0-9._-]{2,}\b/i;
const SAFETY_FINDING_PATH_PATTERN =
  /\.safety\.(?:externalRelationships|unresolvedRelationshipTargets|activeContentEntries|activeRelationshipTypes|macroContentTypes)\[\d+\]$/;

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

const nullableStringAt = (value: unknown, path: string): string | null => {
  ensure(
    value === null ||
      (typeof value === "string" && value.trim().length > 0),
    path,
    "expected null or a non-empty string",
  );
  return value;
};

const booleanAt = (value: unknown, path: string): boolean => {
  ensure(typeof value === "boolean", path, "expected a boolean");
  return value;
};

const integerAt = (value: unknown, path: string): number => {
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

const nullableNumberAt = (value: unknown, path: string): number | null => {
  ensure(
    value === null ||
      (typeof value === "number" &&
        Number.isInteger(value) &&
        value >= 0),
    path,
    "expected null or a non-negative integer",
  );
  return value;
};

const stringArrayAt = (
  value: unknown,
  path: string,
  requireNonEmpty: boolean,
): string[] => {
  const array = arrayAt(value, path);
  if (requireNonEmpty) {
    ensure(array.length > 0, path, "expected a non-empty array");
  }
  return array.map((entry, index) =>
    stringAt(entry, `${path}[${index}]`),
  );
};

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
  if (Object.is(left, right)) {
    return true;
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((entry, index) => sameValue(entry, right[index]))
    );
  }
  if (isRecord(left) || isRecord(right)) {
    if (!isRecord(left) || !isRecord(right)) {
      return false;
    }
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
  ensure(sameValue(left, right), path, "does not match the observed artifact");
};

const assertSafeRecordContent = (value: unknown, path = "$"): void => {
  const normalizedPath = path;
  if (typeof value === "string") {
    const safetyPath = SAFETY_FINDING_PATH_PATTERN.test(normalizedPath);
    if (!safetyPath) {
      ensure(
        !URL_PATTERN.test(value),
        normalizedPath,
        "URL-shaped values are not allowed",
      );
      ensure(
        !EMAIL_PATTERN.test(value),
        normalizedPath,
        "email-shaped values are not allowed",
      );
      ensure(
        !ACCOUNT_TOKEN_PATTERN.test(value) &&
          !ACCOUNT_LABEL_PATTERN.test(value),
        normalizedPath,
        "account-shaped values are not allowed",
      );
    }
    ensure(
      !FORBIDDEN_VALUE_PATTERN.test(value),
      normalizedPath,
      "credential-shaped values are not allowed",
    );
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      assertSafeRecordContent(entry, `${normalizedPath}[${index}]`),
    );
    return;
  }
  if (!isRecord(value)) {
    return;
  }
  for (const [key, entry] of Object.entries(value)) {
    ensure(
      !FORBIDDEN_KEY_PATTERN.test(key),
      normalizedPath,
      "prohibited field name",
    );
    assertSafeRecordContent(entry, `${normalizedPath}.${key}`);
  }
};

const assertHash = (value: unknown, path: string): string => {
  const hash = stringAt(value, path);
  ensure(SHA256_PATTERN.test(hash), path, "expected a lowercase SHA-256 hash");
  return hash;
};

const isInside = (root: string, candidate: string): boolean => {
  const child = relative(root, candidate);
  return (
    child !== "" &&
    child !== ".." &&
    !child.startsWith("../") &&
    !isAbsolute(child)
  );
};

const expectedArtifactPath = (
  kind: keyof typeof ARTIFACT_PATHS,
): string => ARTIFACT_PATHS[kind];

const assertArtifactRef = (
  value: unknown,
  path: string,
  kind: keyof typeof ARTIFACT_PATHS,
): ArtifactEvidence => {
  const object = exactObject(value, ["path", "sha256"], path);
  const artifactPath = stringAt(object.path, `${path}.path`);
  ensure(
    artifactPath === expectedArtifactPath(kind),
    `${path}.path`,
    "must use the frozen semantic-white artifact path",
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

const assertSafety = (value: unknown, path: string): SafetyEvidence => {
  const object = exactObject(value, REQUIRED_SAFETY_KEYS, path);
  return {
    externalRelationships: stringArrayAt(
      object.externalRelationships,
      `${path}.externalRelationships`,
      false,
    ),
    unresolvedRelationshipTargets: stringArrayAt(
      object.unresolvedRelationshipTargets,
      `${path}.unresolvedRelationshipTargets`,
      false,
    ),
    activeContentEntries: stringArrayAt(
      object.activeContentEntries,
      `${path}.activeContentEntries`,
      false,
    ),
    activeRelationshipTypes: stringArrayAt(
      object.activeRelationshipTypes,
      `${path}.activeRelationshipTypes`,
      false,
    ),
    macroContentTypes: stringArrayAt(
      object.macroContentTypes,
      `${path}.macroContentTypes`,
      false,
    ),
  };
};

const assertMarkerPresence = (
  value: unknown,
  path: string,
): Readonly<{ alpha: MarkerPresence; beta: MarkerPresence }> => {
  const object = exactObject(value, ["alpha", "beta"], path);
  return {
    alpha: enumAt(
      object.alpha,
      ["present", "absent"] as const,
      `${path}.alpha`,
    ),
    beta: enumAt(
      object.beta,
      ["present", "absent"] as const,
      `${path}.beta`,
    ),
  };
};

const assertMechanism = (
  value: unknown,
  path: string,
): MechanismEvidence => {
  const object = exactObject(
    value,
    [
      "markerId",
      "partName",
      "location",
      "paragraphIndex",
      "runIndex",
      "directColorValue",
      "themeColor",
      "themeTint",
      "themeShade",
      "hidden",
      "sizeHalfPoints",
      "sizeComplexScriptHalfPoints",
      "shadingFill",
      "highlight",
      "semanticDirectWhite",
      "forbiddenProperties",
    ],
    path,
  );
  const markerId = enumAt(
    object.markerId,
    ["alpha", "beta"] as const,
    `${path}.markerId`,
  );
  const location = enumAt(
    object.location,
    ["body", "header", "footer", "footnote", "endnote", "comments", "other"] as const,
    `${path}.location`,
  );
  return {
    markerId,
    partName: stringAt(object.partName, `${path}.partName`),
    location,
    paragraphIndex: integerAt(object.paragraphIndex, `${path}.paragraphIndex`),
    runIndex: runIndexAt(object.runIndex, `${path}.runIndex`),
    directColorValue: nullableStringAt(
      object.directColorValue,
      `${path}.directColorValue`,
    ),
    themeColor: nullableStringAt(object.themeColor, `${path}.themeColor`),
    themeTint: nullableStringAt(object.themeTint, `${path}.themeTint`),
    themeShade: nullableStringAt(object.themeShade, `${path}.themeShade`),
    hidden: booleanAt(object.hidden, `${path}.hidden`),
    sizeHalfPoints: nullableNumberAt(
      object.sizeHalfPoints,
      `${path}.sizeHalfPoints`,
    ),
    sizeComplexScriptHalfPoints: nullableNumberAt(
      object.sizeComplexScriptHalfPoints,
      `${path}.sizeComplexScriptHalfPoints`,
    ),
    shadingFill: nullableStringAt(object.shadingFill, `${path}.shadingFill`),
    highlight: nullableStringAt(object.highlight, `${path}.highlight`),
    semanticDirectWhite: booleanAt(
      object.semanticDirectWhite,
      `${path}.semanticDirectWhite`,
    ),
    forbiddenProperties: stringArrayAt(
      object.forbiddenProperties,
      `${path}.forbiddenProperties`,
      false,
    ),
  };
};

const assertMechanisms = (
  value: unknown,
  path: string,
): MechanismEvidence[] =>
  arrayAt(value, path).map((entry, index) =>
    assertMechanism(entry, `${path}[${index}]`),
  );

const assertVisibleBody = (value: unknown, path: string): VisibleBody =>
  enumAt(
    value,
    ["preserved", "changed", "lost", "not_assessable"] as const,
    path,
  );

const assertOrdinaryVisibility = (
  value: unknown,
  path: string,
): OrdinaryVisibility =>
  enumAt(value, ["not_visible", "visible", "not_assessable"] as const, path);

const assertLayoutDisturbance = (
  value: unknown,
  path: string,
): LayoutDisturbance =>
  enumAt(
    value,
    ["none_observed", "minor", "material", "not_assessable"] as const,
    path,
  );

const assertReveal = (value: unknown, path: string): RevealObservation =>
  enumAt(value, ["revealed", "not_revealed", "not_assessable"] as const, path);

const assertView = (value: unknown, path: string): ViewEvidence => {
  const object = exactObject(
    value,
    ["zoomPercent", "ordinaryVisibility", "layoutDisturbance", "visibleBody", "notes"],
    path,
  );
  ensure(object.zoomPercent === 100, `${path}.zoomPercent`, "must be 100");
  const ordinaryVisibility = assertOrdinaryVisibility(
    object.ordinaryVisibility,
    `${path}.ordinaryVisibility`,
  );
  ensure(
    ordinaryVisibility !== "not_assessable",
    `${path}.ordinaryVisibility`,
    "required view observation is not assessable",
  );
  const layoutDisturbance = assertLayoutDisturbance(
    object.layoutDisturbance,
    `${path}.layoutDisturbance`,
  );
  ensure(
    layoutDisturbance !== "not_assessable",
    `${path}.layoutDisturbance`,
    "required view observation is not assessable",
  );
  const visibleBody = assertVisibleBody(object.visibleBody, `${path}.visibleBody`);
  ensure(
    visibleBody !== "not_assessable",
    `${path}.visibleBody`,
    "required view observation is not assessable",
  );
  return {
    zoomPercent: 100,
    ordinaryVisibility,
    layoutDisturbance,
    visibleBody,
    notes: stringArrayAt(object.notes, `${path}.notes`, false),
  };
};

const assertApplication = (
  value: unknown,
  path: string,
): { name: string; version: string | null } => {
  const object = exactObject(value, ["name", "version"], path);
  return {
    name: stringAt(object.name, `${path}.name`),
    version: nullableStringAt(object.version, `${path}.version`),
  };
};

const assertPlatform = (
  value: unknown,
  path: string,
): { name: string; version: string | null; build: string | null } => {
  const object = exactObject(value, ["name", "version", "build"], path);
  return {
    name: stringAt(object.name, `${path}.name`),
    version: nullableStringAt(object.version, `${path}.version`),
    build: nullableStringAt(object.build, `${path}.build`),
  };
};

const assertDocxEvidence = (
  value: unknown,
  path: string,
  kind: "googleRoundtrip" | "wordRoundtrip",
): DocxEvidence => {
  const object = exactObject(
    value,
    [
      "status",
      "sourceArtifactSha256",
      "resultArtifact",
      "markerPresence",
      "visibleBody",
      "visibleBodyParagraphs",
      "markerMechanisms",
      "safety",
      "protocolDeviation",
      "notes",
    ],
    path,
  );
  ensure(object.status === "completed", `${path}.status`, "must be completed");
  const sourceArtifactSha256 = assertHash(
    object.sourceArtifactSha256,
    `${path}.sourceArtifactSha256`,
  );
  const resultArtifact = assertArtifactRef(
    object.resultArtifact,
    `${path}.resultArtifact`,
    kind,
  );
  const markerPresence = assertMarkerPresence(
    object.markerPresence,
    `${path}.markerPresence`,
  );
  const visibleBody = assertVisibleBody(object.visibleBody, `${path}.visibleBody`);
  ensure(
    visibleBody !== "not_assessable",
    `${path}.visibleBody`,
    "completed DOCX evidence is not assessable",
  );
  return {
    status: "completed",
    sourceArtifactSha256,
    resultArtifact,
    markerPresence,
    visibleBody,
    visibleBodyParagraphs: stringArrayAt(
      object.visibleBodyParagraphs,
      `${path}.visibleBodyParagraphs`,
      false,
    ),
    markerMechanisms: assertMechanisms(
      object.markerMechanisms,
      `${path}.markerMechanisms`,
    ),
    safety: assertSafety(object.safety, `${path}.safety`),
    protocolDeviation: nullableStringAt(
      object.protocolDeviation,
      `${path}.protocolDeviation`,
    ),
    notes: stringArrayAt(object.notes, `${path}.notes`, false),
  };
};

const assertCopyEvidence = (
  value: unknown,
  path: string,
  kind: "googleCopy" | "wordCopy",
): CopyEvidence => {
  const object = exactObject(
    value,
    [
      "status",
      "sourceArtifactSha256",
      "resultArtifact",
      "markerPresence",
      "visibleBody",
      "visibleBodyParagraphs",
      "protocolDeviation",
      "notes",
    ],
    path,
  );
  ensure(object.status === "completed", `${path}.status`, "must be completed");
  const visibleBody = assertVisibleBody(object.visibleBody, `${path}.visibleBody`);
  ensure(
    visibleBody !== "not_assessable",
    `${path}.visibleBody`,
    "completed copy evidence is not assessable",
  );
  return {
    status: "completed",
    sourceArtifactSha256: assertHash(
      object.sourceArtifactSha256,
      `${path}.sourceArtifactSha256`,
    ),
    resultArtifact: assertArtifactRef(
      object.resultArtifact,
      `${path}.resultArtifact`,
      kind,
    ),
    markerPresence: assertMarkerPresence(
      object.markerPresence,
      `${path}.markerPresence`,
    ),
    visibleBody,
    visibleBodyParagraphs: stringArrayAt(
      object.visibleBodyParagraphs,
      `${path}.visibleBodyParagraphs`,
      false,
    ),
    protocolDeviation: nullableStringAt(
      object.protocolDeviation,
      `${path}.protocolDeviation`,
    ),
    notes: stringArrayAt(object.notes, `${path}.notes`, false),
  };
};

const assertCanonicalEvidence = (value: unknown): CanonicalEvidence => {
  const object = exactObject(
    value,
    [
      "path",
      "sha256",
      "markerPresence",
      "visibleBodyParagraphs",
      "markerMechanisms",
      "safety",
    ],
    "$.canonicalArtifact",
  );
  const artifact = assertArtifactRef(
    { path: object.path, sha256: object.sha256 },
    "$.canonicalArtifact",
    "canonical",
  );
  return {
    ...artifact,
    markerPresence: assertMarkerPresence(
      object.markerPresence,
      "$.canonicalArtifact.markerPresence",
    ),
    visibleBodyParagraphs: stringArrayAt(
      object.visibleBodyParagraphs,
      "$.canonicalArtifact.visibleBodyParagraphs",
      false,
    ),
    markerMechanisms: assertMechanisms(
      object.markerMechanisms,
      "$.canonicalArtifact.markerMechanisms",
    ),
    safety: assertSafety(object.safety, "$.canonicalArtifact.safety"),
  };
};

const assertGoogleDocs = (value: unknown): GoogleDocsEvidence => {
  const object = exactObject(
    value,
    [
      "application",
      "browser",
      "platform",
      "documentRule",
      "sourceArtifactSha256",
      "defaultView",
      "darkView",
      "docxRoundtrip",
      "plainTextCopy",
      "selectionReveal",
      "screenReader",
      "limitations",
    ],
    "$.googleDocs",
  );
  const application = assertApplication(object.application, "$.googleDocs.application");
  ensure(
    application.name === "Google Docs",
    "$.googleDocs.application.name",
    "must be Google Docs",
  );
  const browser = assertApplication(object.browser, "$.googleDocs.browser");
  ensure(
    browser.name === "Google Chrome",
    "$.googleDocs.browser.name",
    "must be Google Chrome",
  );
  const platform = assertPlatform(object.platform, "$.googleDocs.platform");
  ensure(
    object.documentRule === "one new unshared document",
    "$.googleDocs.documentRule",
    "does not match the frozen protocol",
  );
  ensure(
    object.darkView === "not_assessable",
    "$.googleDocs.darkView",
    "must be exactly not_assessable",
  );
  ensure(
    object.screenReader === "not_assessable",
    "$.googleDocs.screenReader",
    "must be exactly not_assessable",
  );
  const limitations = stringArrayAt(
    object.limitations,
    "$.googleDocs.limitations",
    true,
  );
  return {
    application: { name: "Google Docs", version: application.version },
    browser: { name: "Google Chrome", version: browser.version },
    platform,
    documentRule: "one new unshared document",
    sourceArtifactSha256: assertHash(
      object.sourceArtifactSha256,
      "$.googleDocs.sourceArtifactSha256",
    ),
    defaultView: assertView(object.defaultView, "$.googleDocs.defaultView"),
    darkView: "not_assessable",
    docxRoundtrip: assertDocxEvidence(
      object.docxRoundtrip,
      "$.googleDocs.docxRoundtrip",
      "googleRoundtrip",
    ),
    plainTextCopy: assertCopyEvidence(
      object.plainTextCopy,
      "$.googleDocs.plainTextCopy",
      "googleCopy",
    ),
    selectionReveal: assertReveal(
      object.selectionReveal,
      "$.googleDocs.selectionReveal",
    ),
    screenReader: "not_assessable",
    limitations,
  };
};

const assertMicrosoftWord = (value: unknown): MicrosoftWordEvidence => {
  const object = exactObject(
    value,
    [
      "application",
      "platform",
      "documentRule",
      "sourceArtifactSha256",
      "lightView",
      "darkView",
      "docxRoundtrip",
      "plainTextCopy",
      "selectionReveal",
      "accessibilityAssistant",
      "screenReader",
      "limitations",
    ],
    "$.microsoftWord",
  );
  const application = assertApplication(
    object.application,
    "$.microsoftWord.application",
  );
  ensure(
    application.name === "Microsoft Word",
    "$.microsoftWord.application.name",
    "must be Microsoft Word",
  );
  const platform = assertPlatform(object.platform, "$.microsoftWord.platform");
  ensure(
    object.documentRule === "open canonical source independently",
    "$.microsoftWord.documentRule",
    "does not match the frozen protocol",
  );
  ensure(
    object.screenReader === "not_assessable",
    "$.microsoftWord.screenReader",
    "must be exactly not_assessable",
  );
  const accessibilityObject = exactObject(
    object.accessibilityAssistant,
    ["status", "findings", "limitations"],
    "$.microsoftWord.accessibilityAssistant",
  );
  const accessibilityStatus = enumAt(
    accessibilityObject.status,
    ["completed", "not_assessable"] as const,
    "$.microsoftWord.accessibilityAssistant.status",
  );
  const accessibilityLimitations = stringArrayAt(
    accessibilityObject.limitations,
    "$.microsoftWord.accessibilityAssistant.limitations",
    false,
  );
  if (accessibilityStatus === "not_assessable") {
    ensure(
      accessibilityLimitations.length > 0,
      "$.microsoftWord.accessibilityAssistant.limitations",
      "not_assessable requires a limitation",
    );
  }
  return {
    application: { name: "Microsoft Word", version: application.version },
    platform,
    documentRule: "open canonical source independently",
    sourceArtifactSha256: assertHash(
      object.sourceArtifactSha256,
      "$.microsoftWord.sourceArtifactSha256",
    ),
    lightView: assertView(object.lightView, "$.microsoftWord.lightView"),
    darkView: assertView(object.darkView, "$.microsoftWord.darkView"),
    docxRoundtrip: assertDocxEvidence(
      object.docxRoundtrip,
      "$.microsoftWord.docxRoundtrip",
      "wordRoundtrip",
    ),
    plainTextCopy: assertCopyEvidence(
      object.plainTextCopy,
      "$.microsoftWord.plainTextCopy",
      "wordCopy",
    ),
    selectionReveal: assertReveal(
      object.selectionReveal,
      "$.microsoftWord.selectionReveal",
    ),
    accessibilityAssistant: {
      status: accessibilityStatus,
      findings: stringArrayAt(
        accessibilityObject.findings,
        "$.microsoftWord.accessibilityAssistant.findings",
        false,
      ),
      limitations: accessibilityLimitations,
    },
    screenReader: "not_assessable",
    limitations: stringArrayAt(
      object.limitations,
      "$.microsoftWord.limitations",
      true,
    ),
  };
};

const assertRecordShape = (value: unknown): QualificationRunRecord => {
  assertSafeRecordContent(value);
  const object = exactObject(
    value,
    [
      "experimentId",
      "experimentSchemaVersion",
      "date",
      "qualificationProfile",
      "candidateId",
      "documentProfile",
      "fingerprintStrategy",
      "fingerprintStrategyVersion",
      "matchingProfile",
      "fixedMarkers",
      "visibleFixture",
      "sourceGenerator",
      "canonicalArtifact",
      "googleDocs",
      "microsoftWord",
      "gateDecision",
      "gateRationale",
      "limitations",
    ],
    "$",
  );
  ensure(
    object.experimentId === EXPERIMENT_ID,
    "$.experimentId",
    "does not match the frozen experiment ID",
  );
  ensure(
    object.experimentSchemaVersion === EXPERIMENT_SCHEMA_VERSION,
    "$.experimentSchemaVersion",
    "does not match the frozen schema version",
  );
  const date = stringAt(object.date, "$.date");
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  ensure(dateMatch !== null, "$.date", "must use YYYY-MM-DD");
  const parsedDate = new Date(`${date}T00:00:00Z`);
  ensure(
    parsedDate.getUTCFullYear() === Number(dateMatch[1]) &&
      parsedDate.getUTCMonth() + 1 === Number(dateMatch[2]) &&
      parsedDate.getUTCDate() === Number(dateMatch[3]),
    "$.date",
    "must be a real calendar date",
  );
  ensure(
    object.qualificationProfile === QUALIFICATION_PROFILE,
    "$.qualificationProfile",
    "does not match the frozen qualification profile",
  );
  ensure(
    object.candidateId === CANDIDATE_ID,
    "$.candidateId",
    "does not match the frozen candidate ID",
  );
  ensure(
    object.documentProfile === DOCUMENT_PROFILE,
    "$.documentProfile",
    "does not match the frozen document profile",
  );
  ensure(
    object.fingerprintStrategy === null,
    "$.fingerprintStrategy",
    "must remain null for this carrier qualification",
  );
  ensure(
    object.fingerprintStrategyVersion === null,
    "$.fingerprintStrategyVersion",
    "must remain null for this carrier qualification",
  );
  ensure(
    object.matchingProfile === null,
    "$.matchingProfile",
    "must remain null for this carrier qualification",
  );
  const fixedMarkers = exactObject(
    object.fixedMarkers,
    ["alpha", "beta"],
    "$.fixedMarkers",
  );
  ensure(
    fixedMarkers.alpha === FIXED_MARKER_ALPHA,
    "$.fixedMarkers.alpha",
    "does not match the frozen Alpha marker",
  );
  ensure(
    fixedMarkers.beta === FIXED_MARKER_BETA,
    "$.fixedMarkers.beta",
    "does not match the frozen Beta marker",
  );
  const visibleFixture = exactObject(
    object.visibleFixture,
    ["id", "sourcePath"],
    "$.visibleFixture",
  );
  ensure(
    visibleFixture.id === VISIBLE_FIXTURE_ID,
    "$.visibleFixture.id",
    "does not match the frozen visible fixture",
  );
  ensure(
    visibleFixture.sourcePath === SOURCE_FIXTURE_PATH,
    "$.visibleFixture.sourcePath",
    "must use the frozen fixture source path",
  );
  const sourceGenerator = exactObject(
    object.sourceGenerator,
    ["path", "gitCommit", "nodeVersion", "pnpmVersion", "docxVersion"],
    "$.sourceGenerator",
  );
  ensure(
    sourceGenerator.path === SOURCE_GENERATOR_PATH,
    "$.sourceGenerator.path",
    "must use the frozen generator path",
  );
  stringAt(sourceGenerator.gitCommit, "$.sourceGenerator.gitCommit");
  stringAt(sourceGenerator.nodeVersion, "$.sourceGenerator.nodeVersion");
  stringAt(sourceGenerator.pnpmVersion, "$.sourceGenerator.pnpmVersion");
  ensure(
    sourceGenerator.docxVersion === DOCX_VERSION,
    "$.sourceGenerator.docxVersion",
    "must match the frozen docx dependency",
  );
  assertCanonicalEvidence(object.canonicalArtifact);
  assertGoogleDocs(object.googleDocs);
  assertMicrosoftWord(object.microsoftWord);
  enumAt(
    object.gateDecision,
    ["PROCEED", "REVISE_CARRIER", "ABANDON_CARRIER"] as const,
    "$.gateDecision",
  );
  stringArrayAt(object.gateRationale, "$.gateRationale", true);
  stringArrayAt(object.limitations, "$.limitations", true);
  return value as QualificationRunRecord;
};

const artifactAbsolutePath = async (
  repositoryRoot: string,
  artifact: ArtifactEvidence,
  path: string,
): Promise<string> => {
  const canonicalRepositoryRoot = await realpath(repositoryRoot).catch(
    () => null,
  );
  ensure(
    canonicalRepositoryRoot !== null,
    path,
    "repository root could not be resolved",
  );
  const artifactDirectory = resolve(repositoryRoot, ARTIFACT_DIRECTORY);
  const artifactDirectoryInfo = await lstat(artifactDirectory).catch(
    () => null,
  );
  ensure(
    artifactDirectoryInfo?.isDirectory() === true &&
      !artifactDirectoryInfo.isSymbolicLink(),
    path,
    "artifact directory must be a real directory",
  );
  const absolutePath = resolve(repositoryRoot, artifact.path);
  ensure(
    isInside(artifactDirectory, absolutePath),
    path,
    "artifact path escaped the semantic-white directory",
  );
  const fileInfo = await lstat(absolutePath).catch(() => null);
  ensure(
    fileInfo?.isFile() === true && !fileInfo.isSymbolicLink(),
    path,
    "artifact must be a regular non-symlink file",
  );
  const canonicalDirectory = await realpath(artifactDirectory).catch(
    () => null,
  );
  const canonicalFile = await realpath(absolutePath).catch(() => null);
  ensure(
    canonicalDirectory !== null && canonicalFile !== null,
    path,
    "artifact path could not be resolved",
  );
  ensure(
    isInside(canonicalRepositoryRoot, canonicalDirectory),
    path,
    "artifact directory escaped the repository root",
  );
  ensure(
    isInside(canonicalRepositoryRoot, canonicalFile),
    path,
    "artifact path escaped the repository root",
  );
  ensure(
    isInside(canonicalDirectory, canonicalFile),
    path,
    "artifact path escaped the semantic-white directory",
  );
  return canonicalFile;
};

const validateArtifactHash = async (
  repositoryRoot: string,
  artifact: ArtifactEvidence,
  path: string,
): Promise<Uint8Array> => {
  const absolutePath = await artifactAbsolutePath(repositoryRoot, artifact, path);
  const bytes = await readFile(absolutePath).catch(() => null);
  ensure(bytes !== null, path, "artifact could not be read");
  const actualHash = createHash("sha256").update(bytes).digest("hex");
  ensure(
    actualHash === artifact.sha256,
    `${path}.sha256`,
    "does not match the referenced artifact",
  );
  return bytes;
};

const visibleBodyFromInspection = (
  inspection: ReturnType<typeof inspectSemanticWhiteCarrier>,
): string[] =>
  inspection.transformed.paragraphs
    .filter((paragraph) => paragraph.location === "body")
    .map((paragraph) =>
      paragraph.text
        .replaceAll(FIXED_MARKER_ALPHA, "")
        .replaceAll(FIXED_MARKER_BETA, ""),
    );

const safetyIsClean = (safety: SafetyEvidence): boolean =>
  Object.values(safety).every((findings) => findings.length === 0);

const markerMechanismPasses = (
  mechanisms: readonly MechanismEvidence[],
  requireSourceRun: boolean,
): boolean => {
  const expectedParagraphs = { alpha: 0, beta: 2 } as const;
  return (["alpha", "beta"] as const).every((markerId) => {
    const markerMechanisms = mechanisms.filter(
      (mechanism) => mechanism.markerId === markerId,
    );
    return (
      markerMechanisms.length > 0 &&
      markerMechanisms.every(
        (mechanism) =>
          mechanism.partName === "word/document.xml" &&
          mechanism.location === "body" &&
          mechanism.paragraphIndex === expectedParagraphs[markerId] &&
          mechanism.semanticDirectWhite &&
          mechanism.forbiddenProperties.length === 0 &&
          (!requireSourceRun || mechanism.runIndex === 1),
      )
    );
  });
};

const matchesFrozenVisibleBody = (paragraphs: readonly string[]): boolean =>
  sameValue(paragraphs, VISIBLE_PARAGRAPHS);

const inspectCanonicalEvidence = (
  bytes: Uint8Array,
  evidence: CanonicalEvidence,
): ReturnType<typeof inspectSemanticWhiteCarrier> => {
  const inspection = inspectSemanticWhiteCarrier(
    bytes,
    QUALIFICATION_FIXTURE.markers,
  );
  equalAt(
    evidence.markerPresence,
    inspection.transformed.markerPresence,
    "$.canonicalArtifact.markerPresence",
  );
  equalAt(
    evidence.visibleBodyParagraphs,
    visibleBodyFromInspection(inspection),
    "$.canonicalArtifact.visibleBodyParagraphs",
  );
  equalAt(
    evidence.markerMechanisms,
    inspection.markerMechanisms,
    "$.canonicalArtifact.markerMechanisms",
  );
  equalAt(evidence.safety, inspection.transformed.safety, "$.canonicalArtifact.safety");
  ensure(
    inspection.transformed.markerPresence.alpha === "present" &&
      inspection.transformed.markerPresence.beta === "present",
    "$.canonicalArtifact.markerPresence",
    "canonical source must contain both fixed markers",
  );
  ensure(
    matchesFrozenVisibleBody(visibleBodyFromInspection(inspection)),
    "$.canonicalArtifact.visibleBodyParagraphs",
    "canonical source must preserve the frozen visible body",
  );
  ensure(
    safetyIsClean(inspection.transformed.safety),
    "$.canonicalArtifact.safety",
    "canonical source safety findings must be empty",
  );
  ensure(
    markerMechanismPasses(inspection.markerMechanisms, true),
    "$.canonicalArtifact.markerMechanisms",
    "canonical source must satisfy semantic direct-white placement",
  );
  return inspection;
};

const inspectDocxEvidence = (
  bytes: Uint8Array,
  evidence: DocxEvidence,
  path: string,
): ReturnType<typeof inspectSemanticWhiteCarrier> => {
  const inspection = inspectSemanticWhiteCarrier(
    bytes,
    QUALIFICATION_FIXTURE.markers,
  );
  equalAt(
    evidence.markerPresence,
    inspection.transformed.markerPresence,
    `${path}.markerPresence`,
  );
  equalAt(
    evidence.visibleBodyParagraphs,
    visibleBodyFromInspection(inspection),
    `${path}.visibleBodyParagraphs`,
  );
  equalAt(
    evidence.markerMechanisms,
    inspection.markerMechanisms,
    `${path}.markerMechanisms`,
  );
  equalAt(evidence.safety, inspection.transformed.safety, `${path}.safety`);
  if (evidence.visibleBody === "preserved") {
    ensure(
      matchesFrozenVisibleBody(visibleBodyFromInspection(inspection)),
      `${path}.visibleBodyParagraphs`,
      "preserved DOCX evidence must retain the frozen visible body",
    );
  }
  return inspection;
};

const inspectCopyEvidence = (
  bytes: Uint8Array,
  evidence: CopyEvidence,
  path: string,
): void => {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`${path}: copy artifact is not valid UTF-8`);
  }
  ensure(!text.includes("\0"), path, "copy artifact contains a NUL character");
  ensure(text.endsWith("\n"), path, "copy artifact must end with a newline");
  const paragraphs = text.replace(/\r\n?/g, "\n").split("\n");
  if (paragraphs.at(-1) === "") {
    paragraphs.pop();
  }
  const markerPresence = {
    alpha: text.includes(FIXED_MARKER_ALPHA) ? "present" : "absent",
    beta: text.includes(FIXED_MARKER_BETA) ? "present" : "absent",
  } as const;
  const visibleBodyParagraphs = paragraphs.map((paragraph) =>
    paragraph
      .replaceAll(FIXED_MARKER_ALPHA, "")
      .replaceAll(FIXED_MARKER_BETA, ""),
  );
  equalAt(markerPresence, evidence.markerPresence, `${path}.markerPresence`);
  equalAt(
    visibleBodyParagraphs,
    evidence.visibleBodyParagraphs,
    `${path}.visibleBodyParagraphs`,
  );
  if (evidence.visibleBody === "preserved") {
    ensure(
      matchesFrozenVisibleBody(visibleBodyParagraphs),
      `${path}.visibleBodyParagraphs`,
      "preserved copy evidence must retain the frozen visible body",
    );
  }
};

const sourcePasses = (
  inspection: ReturnType<typeof inspectSemanticWhiteCarrier>,
): boolean =>
  inspection.transformed.markerPresence.alpha === "present" &&
  inspection.transformed.markerPresence.beta === "present" &&
  matchesFrozenVisibleBody(visibleBodyFromInspection(inspection)) &&
  safetyIsClean(inspection.transformed.safety) &&
  markerMechanismPasses(inspection.markerMechanisms, true);

const docxPasses = (
  evidence: DocxEvidence,
  inspection: ReturnType<typeof inspectSemanticWhiteCarrier>,
): boolean =>
  evidence.status === "completed" &&
  evidence.markerPresence.alpha === "present" &&
  evidence.markerPresence.beta === "present" &&
  evidence.visibleBody === "preserved" &&
  matchesFrozenVisibleBody(evidence.visibleBodyParagraphs) &&
  safetyIsClean(inspection.transformed.safety) &&
  markerMechanismPasses(inspection.markerMechanisms, false);

const copyPasses = (evidence: CopyEvidence): boolean =>
  evidence.status === "completed" &&
  evidence.markerPresence.alpha === "present" &&
  evidence.markerPresence.beta === "present" &&
  evidence.visibleBody === "preserved" &&
  matchesFrozenVisibleBody(evidence.visibleBodyParagraphs);

const editorPreservesDocxAndBody = (evidence: DocxEvidence): boolean =>
  evidence.markerPresence.alpha === "present" &&
  evidence.markerPresence.beta === "present" &&
  evidence.visibleBody === "preserved" &&
  matchesFrozenVisibleBody(evidence.visibleBodyParagraphs);

const editorPreservesCopyAndBody = (evidence: CopyEvidence): boolean =>
  evidence.markerPresence.alpha === "present" &&
  evidence.markerPresence.beta === "present" &&
  evidence.visibleBody === "preserved" &&
  matchesFrozenVisibleBody(evidence.visibleBodyParagraphs);

const validateGate = (
  record: QualificationRunRecord,
  sourceInspection: ReturnType<typeof inspectSemanticWhiteCarrier>,
  googleInspection: ReturnType<typeof inspectSemanticWhiteCarrier>,
  wordInspection: ReturnType<typeof inspectSemanticWhiteCarrier>,
): void => {
  const sourcePassesValue = sourcePasses(sourceInspection);
  const googleDocsPasses = docxPasses(
    record.googleDocs.docxRoundtrip,
    googleInspection,
  );
  const microsoftWordPasses = docxPasses(
    record.microsoftWord.docxRoundtrip,
    wordInspection,
  );
  const canProceed =
    sourcePassesValue &&
    googleDocsPasses &&
    microsoftWordPasses &&
    record.googleDocs.defaultView.ordinaryVisibility === "not_visible" &&
    record.microsoftWord.lightView.ordinaryVisibility === "not_visible" &&
    record.microsoftWord.darkView.ordinaryVisibility === "not_visible" &&
    record.googleDocs.defaultView.layoutDisturbance === "none_observed" &&
    record.microsoftWord.lightView.layoutDisturbance === "none_observed" &&
    record.microsoftWord.darkView.layoutDisturbance === "none_observed" &&
    copyPasses(record.googleDocs.plainTextCopy) &&
    copyPasses(record.microsoftWord.plainTextCopy);
  const hasBoundedEvidence =
    editorPreservesDocxAndBody(record.googleDocs.docxRoundtrip) ||
    editorPreservesDocxAndBody(record.microsoftWord.docxRoundtrip) ||
    editorPreservesCopyAndBody(record.googleDocs.plainTextCopy) ||
    editorPreservesCopyAndBody(record.microsoftWord.plainTextCopy);
  const expectedDecision = canProceed
    ? "PROCEED"
    : hasBoundedEvidence
      ? "REVISE_CARRIER"
      : "ABANDON_CARRIER";
  ensure(
    record.gateDecision === expectedDecision,
    "$.gateDecision",
    `does not match the mechanically derived ${expectedDecision} result`,
  );
};

export function assertValidSemanticWhiteCarrierRun(
  value: unknown,
): asserts value is QualificationRunRecord {
  assertRecordShape(value);
}

export async function validateSemanticWhiteCarrierRun(
  value: unknown,
  root?: string,
): Promise<QualificationRunRecord> {
  const record = assertRecordShape(value);
  const repositoryRoot = resolve(root ?? process.cwd());
  const sourceBytes = await validateArtifactHash(
    repositoryRoot,
    record.canonicalArtifact,
    "$.canonicalArtifact",
  );
  const sourceInspection = inspectCanonicalEvidence(
    sourceBytes,
    record.canonicalArtifact,
  );
  ensure(
    record.googleDocs.sourceArtifactSha256 === record.canonicalArtifact.sha256,
    "$.googleDocs.sourceArtifactSha256",
    "must match canonical source hash",
  );
  ensure(
    record.microsoftWord.sourceArtifactSha256 === record.canonicalArtifact.sha256,
    "$.microsoftWord.sourceArtifactSha256",
    "must match canonical source hash",
  );
  ensure(
    record.googleDocs.docxRoundtrip.sourceArtifactSha256 ===
      record.canonicalArtifact.sha256,
    "$.googleDocs.docxRoundtrip.sourceArtifactSha256",
    "must match canonical source hash",
  );
  ensure(
    record.googleDocs.plainTextCopy.sourceArtifactSha256 ===
      record.canonicalArtifact.sha256,
    "$.googleDocs.plainTextCopy.sourceArtifactSha256",
    "must match canonical source hash",
  );
  ensure(
    record.microsoftWord.docxRoundtrip.sourceArtifactSha256 ===
      record.canonicalArtifact.sha256,
    "$.microsoftWord.docxRoundtrip.sourceArtifactSha256",
    "must match canonical source hash",
  );
  ensure(
    record.microsoftWord.plainTextCopy.sourceArtifactSha256 ===
      record.canonicalArtifact.sha256,
    "$.microsoftWord.plainTextCopy.sourceArtifactSha256",
    "must match canonical source hash",
  );
  const googleBytes = await validateArtifactHash(
    repositoryRoot,
    record.googleDocs.docxRoundtrip.resultArtifact,
    "$.googleDocs.docxRoundtrip.resultArtifact",
  );
  const googleInspection = inspectDocxEvidence(
    googleBytes,
    record.googleDocs.docxRoundtrip,
    "$.googleDocs.docxRoundtrip",
  );
  const googleCopyBytes = await validateArtifactHash(
    repositoryRoot,
    record.googleDocs.plainTextCopy.resultArtifact,
    "$.googleDocs.plainTextCopy.resultArtifact",
  );
  inspectCopyEvidence(
    googleCopyBytes,
    record.googleDocs.plainTextCopy,
    "$.googleDocs.plainTextCopy",
  );
  const wordBytes = await validateArtifactHash(
    repositoryRoot,
    record.microsoftWord.docxRoundtrip.resultArtifact,
    "$.microsoftWord.docxRoundtrip.resultArtifact",
  );
  const wordInspection = inspectDocxEvidence(
    wordBytes,
    record.microsoftWord.docxRoundtrip,
    "$.microsoftWord.docxRoundtrip",
  );
  const wordCopyBytes = await validateArtifactHash(
    repositoryRoot,
    record.microsoftWord.plainTextCopy.resultArtifact,
    "$.microsoftWord.plainTextCopy.resultArtifact",
  );
  inspectCopyEvidence(
    wordCopyBytes,
    record.microsoftWord.plainTextCopy,
    "$.microsoftWord.plainTextCopy",
  );
  validateGate(record, sourceInspection, googleInspection, wordInspection);
  return record;
}

const runAsCli = process.argv[1]?.endsWith(
  "/scripts/validate-docx-semantic-white-carrier-run.ts",
);

const main = async (): Promise<void> => {
  ensure(process.argv.length === 2, "$", FAILURE_USAGE);
  const runPath = resolve(
    process.cwd(),
    "research/experiments/docx-semantic-white-carrier-qualification-v1/run-001.json",
  );
  let recordText: string;
  try {
    recordText = await readFile(runPath, "utf8");
  } catch {
    throw new Error("Unable to read the semantic-white run record.");
  }
  let value: unknown;
  try {
    value = JSON.parse(recordText) as unknown;
  } catch {
    throw new Error("The semantic-white run record is not valid JSON.");
  }
  const record = await validateSemanticWhiteCarrierRun(value, process.cwd());
  process.stdout.write(
    `${JSON.stringify({
      status: "valid",
      gateDecision: record.gateDecision,
      documentProfile: record.documentProfile,
    })}\n`,
  );
};

if (runAsCli) {
  main().catch((error: unknown) => {
    console.error(
      error instanceof Error
        ? error.message
        : "Unable to validate the semantic-white run record.",
    );
    process.exitCode = 1;
  });
}
