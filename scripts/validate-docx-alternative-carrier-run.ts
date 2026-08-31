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
  BAKEOFF_PROFILE,
  CANDIDATE_ORDER,
  EXPERIMENT_ID,
  EXPERIMENT_SCHEMA_VERSION,
  FIXED_MARKER_ALPHA,
  FIXED_MARKER_BETA,
  VISIBLE_FIXTURE_ID,
} from "../research/experiments/docx-alternative-carrier-bakeoff-v1/fixture.ts";

export type ISODate = `${number}-${number}-${number}`;
export type SHA256 = string;
export type WorkflowStatus = "completed" | "failed" | "not_run";
export type MarkerObservation =
  | "present"
  | "absent"
  | "not_assessable"
  | "not_applicable";
export type VisibleBodyObservation =
  | "preserved"
  | "changed"
  | "lost"
  | "not_assessable"
  | "not_applicable";
export type OrdinaryVisibilityObservation =
  | "not_visible"
  | "visible"
  | "not_assessable"
  | "not_applicable";
export type ConditionalExposure =
  | "hidden_text_setting"
  | "accessibility_tool"
  | "plain_text_extraction"
  | "other_recorded_tool";
export type GateDecision =
  | "SELECT_CANDIDATE"
  | "REVISE_CANDIDATE"
  | "NO_VIABLE_DOCX_CARRIER";
export type AlternativeCarrierCandidateId = (typeof CANDIDATE_ORDER)[number];
export type OOXMLTextLocation =
  | "body"
  | "header"
  | "footer"
  | "footnote"
  | "endnote"
  | "comments"
  | "other";
export type MarkerPresence = "present" | "absent";
export type MarkerRunFormat = Readonly<{
  hidden: boolean;
  color: string | null;
  sizeHalfPoints: number | null;
  sizeComplexScriptHalfPoints: number | null;
}>;
export type ArtifactRef = Readonly<{
  path: string;
  sha256: SHA256;
}>;
export type InspectorSafetySummary = Readonly<{
  externalRelationships: readonly string[];
  unresolvedRelationshipTargets: readonly string[];
  activeContentEntries: readonly string[];
  activeRelationshipTypes: readonly string[];
  macroContentTypes: readonly string[];
}>;
export type MarkerOccurrenceSummary = Readonly<{
  markerId: "alpha" | "beta";
  partName: string;
  location: OOXMLTextLocation;
  paragraphIndex: number;
  runIndices: readonly number[];
  runFormats: readonly MarkerRunFormat[];
}>;
export type TransformedDocxInspectionSummary = Readonly<{
  entries: readonly string[];
  visibleBodyParagraphs: readonly string[];
  markerPresence: Readonly<{
    alpha: MarkerPresence;
    beta: MarkerPresence;
  }>;
  markerOccurrences: readonly MarkerOccurrenceSummary[];
  safety: InspectorSafetySummary;
}>;
export type WorkflowApplication = Readonly<{
  name: string;
  version: string | null;
}>;
export type WorkflowPlatform = Readonly<{
  name: string;
  version: string | null;
}>;
export type RoundtripWorkflow = Readonly<{
  status: "completed";
  failureReason: null;
  application: WorkflowApplication;
  platform: WorkflowPlatform;
  steps: readonly string[];
  sourceArtifactSha256: SHA256;
  resultArtifact: ArtifactRef;
  markerPresence: Readonly<{
    alpha: MarkerObservation;
    beta: MarkerObservation;
  }>;
  visibleBody: VisibleBodyObservation;
  ordinaryVisibility: OrdinaryVisibilityObservation;
  conditionalExposure: readonly ConditionalExposure[];
  transformedInspection: TransformedDocxInspectionSummary;
  protocolDeviation: string | null;
  notes: readonly string[];
}>;
export type CopyWorkflow = Readonly<{
  status: WorkflowStatus;
  failureReason: string | null;
  application: WorkflowApplication;
  platform: WorkflowPlatform;
  steps: readonly string[];
  sourceArtifactSha256: SHA256;
  resultArtifact: ArtifactRef | null;
  markerPresence: Readonly<{
    alpha: MarkerObservation;
    beta: MarkerObservation;
  }>;
  visibleBody: VisibleBodyObservation;
  ordinaryVisibility: "not_applicable";
  conditionalExposure: readonly ConditionalExposure[];
  protocolDeviation: string | null;
  notes: readonly string[];
}>;
export type CandidateRecord = Readonly<{
  candidateId: AlternativeCarrierCandidateId;
  mechanism:
    | "ordinary-body-color-FFFFFF"
    | "ordinary-body-size-1pt"
    | "ordinary-header-text";
  documentProfile:
    | "docx-matching-color-body-v1"
    | "docx-sub-legible-body-1pt-v1"
    | "docx-header-text-v1";
  canonicalArtifact: ArtifactRef;
  canonicalProfileValidation: Readonly<{
    status: "passed";
    testCommand: "pnpm test tests/documents/docx-alternative-carrier-bakeoff.test.ts";
  }>;
  sourceInspection: TransformedDocxInspectionSummary;
  googleDocsRoundtrip: RoundtripWorkflow;
  googleDocsCopyPlainText: CopyWorkflow;
}>;
export type LayoutDisturbanceObservation =
  | "none_observed"
  | "minor"
  | "material"
  | "not_assessable";
export type RevealObservation =
  | "revealed"
  | "not_revealed"
  | "not_run"
  | "not_assessable";
export type AccessibilityExposureObservation =
  | "exposed"
  | "not_exposed"
  | "not_run"
  | "not_assessable";
export type MatrixRow = Readonly<{
  candidateId: AlternativeCarrierCandidateId;
  transport: Readonly<{
    canonicalValid: boolean;
    sourceMarkerPresence: Readonly<{
      alpha: MarkerPresence;
      beta: MarkerPresence;
    }>;
    sourceLocations: readonly MarkerOccurrenceSummary[];
    sourceFormats: readonly MarkerRunFormat[];
    roundtripMarkerPresence: Readonly<{
      alpha: MarkerObservation;
      beta: MarkerObservation;
    }>;
    roundtripLocations: readonly MarkerOccurrenceSummary[];
    roundtripFormats: readonly MarkerRunFormat[];
    roundtripVisibleBody: VisibleBodyObservation;
    copyMarkerPresence: Readonly<{
      alpha: MarkerObservation;
      beta: MarkerObservation;
    }>;
    copyVisibleBody: VisibleBodyObservation;
  }>;
  presentation: Readonly<{
    ordinaryVisibility: OrdinaryVisibilityObservation;
    layoutDisturbance: LayoutDisturbanceObservation;
    selectionReveal: RevealObservation;
    backgroundOrThemeReveal: RevealObservation;
    explicitFormattingReveal: RevealObservation;
  }>;
  accessibilityTrust: Readonly<{
    assistiveExposure: AccessibilityExposureObservation;
    accidentalExposureNotes: readonly string[];
    limitations: readonly string[];
  }>;
  engineering: Readonly<{
    structuralSimplicity:
      | "single-direct-color-property"
      | "single-direct-size-property"
      | "single-default-header-region";
    deterministicGeneration: boolean;
    deterministicInspection: boolean;
    testedEditorScope: "Google Docs import/export only";
    sourceSafetyClean: boolean;
    roundtripSafetyClean: boolean;
  }>;
}>;
export type BakeoffRunRecord = Readonly<{
  experimentId: "glyph-exp-a-docx-alternative-carrier-bakeoff-v1-001";
  experimentSchemaVersion: 1;
  date: ISODate;
  bakeoffProfile: "docx-alternative-carrier-bakeoff-v1";
  fingerprintStrategy: null;
  fingerprintStrategyVersion: null;
  matchingProfile: null;
  fixedMarkers: Readonly<{
    alpha: "GLYPH TEST MARKER ALPHA";
    beta: "GLYPH TEST MARKER BETA";
  }>;
  visibleFixture: Readonly<{
    id: "synthetic-library-hours-v1";
    sourcePath: "research/experiments/docx-hidden-run-v1/fixture.ts";
  }>;
  sourceGenerator: Readonly<{
    path: "src/documents/docx/docx-alternative-carrier-bakeoff-v1.ts";
    gitCommit: string;
    nodeVersion: string;
    pnpmVersion: string;
    docxVersion: string;
  }>;
  googleDocsProtocol: Readonly<{
    application: WorkflowApplication & { name: "Google Docs" };
    platform: WorkflowPlatform;
    candidateOrder: readonly [
      "matching-color-body-v1",
      "sub-legible-body-1pt-v1",
      "docx-header-text-v1",
    ];
    documentRule: "one new unshared document per candidate";
  }>;
  candidates: readonly [CandidateRecord, CandidateRecord, CandidateRecord];
  matrix: readonly [MatrixRow, MatrixRow, MatrixRow];
  gateDecision: GateDecision;
  selectedCandidateId: AlternativeCarrierCandidateId | null;
  gateRationale: readonly string[];
  limitations: readonly string[];
}>;

export type ValidationOptions = Readonly<{
  repositoryRoot?: string;
}>;

type UnknownRecord = Record<string, unknown>;

const ARTIFACT_DIRECTORY =
  "research/artifacts/docx-alternative-carrier-bakeoff-v1";
const REQUIRED_DOCX_ENTRIES = [
  "[Content_Types].xml",
  "_rels/.rels",
  "word/document.xml",
] as const;
const SAFETY_KEYS = [
  "externalRelationships",
  "unresolvedRelationshipTargets",
  "activeContentEntries",
  "activeRelationshipTypes",
  "macroContentTypes",
] as const;
const SOURCE_GENERATOR_PATH =
  "src/documents/docx/docx-alternative-carrier-bakeoff-v1.ts";
const CANONICAL_PROFILE_TEST_COMMAND =
  "pnpm test tests/documents/docx-alternative-carrier-bakeoff.test.ts";
const VISIBLE_PARAGRAPHS = [
  "Read the passage below. Then summarize its main idea in two sentences.",
  "A neighborhood library extended its weekend hours so more residents could use its study rooms and book collection.",
  "Explain one possible benefit of the schedule change. Then explain one possible drawback.",
] as const;

const CANDIDATE_CONTRACT: Readonly<
  Record<
    AlternativeCarrierCandidateId,
    Readonly<{
      mechanism: CandidateRecord["mechanism"];
      documentProfile: CandidateRecord["documentProfile"];
      simplicity: MatrixRow["engineering"]["structuralSimplicity"];
      partName: string;
      location: OOXMLTextLocation;
      alphaParagraphIndex: number;
      betaParagraphIndex: number;
      runIndex: number;
      format: MarkerRunFormat;
    }>
  >
> = {
  "matching-color-body-v1": {
    mechanism: "ordinary-body-color-FFFFFF",
    documentProfile: "docx-matching-color-body-v1",
    simplicity: "single-direct-color-property",
    partName: "word/document.xml",
    location: "body",
    alphaParagraphIndex: 0,
    betaParagraphIndex: 2,
    runIndex: 1,
    format: {
      hidden: false,
      color: "FFFFFF",
      sizeHalfPoints: null,
      sizeComplexScriptHalfPoints: null,
    },
  },
  "sub-legible-body-1pt-v1": {
    mechanism: "ordinary-body-size-1pt",
    documentProfile: "docx-sub-legible-body-1pt-v1",
    simplicity: "single-direct-size-property",
    partName: "word/document.xml",
    location: "body",
    alphaParagraphIndex: 0,
    betaParagraphIndex: 2,
    runIndex: 1,
    format: {
      hidden: false,
      color: null,
      sizeHalfPoints: 2,
      sizeComplexScriptHalfPoints: 2,
    },
  },
  "docx-header-text-v1": {
    mechanism: "ordinary-header-text",
    documentProfile: "docx-header-text-v1",
    simplicity: "single-default-header-region",
    partName: "word/header1.xml",
    location: "header",
    alphaParagraphIndex: 0,
    betaParagraphIndex: 1,
    runIndex: 0,
    format: {
      hidden: false,
      color: null,
      sizeHalfPoints: null,
      sizeComplexScriptHalfPoints: null,
    },
  },
};

const FAILURE_USAGE =
  "Usage: pnpm research:carrier:bakeoff:validate (reads run-001.json)";
const HASH_PATTERN = /^[0-9a-f]{64}$/;
const PATH_ROOT_PATTERN = `${ARTIFACT_DIRECTORY}/`;
const FORBIDDEN_KEY_PATTERN =
  /(?:account|credential|password|secret|token|api[_-]?key|access[_-]?key|refresh[_-]?token|authorization|bearer|email|username|user[_-]?id|student|teacher|school|class|identity|session|cookie|prompt|response|submission|assignment|answer|raw|payload|document[_-]?(?:id|url|uri)|cloud|url|uri|href)/i;
const FORBIDDEN_VALUE_PATTERN =
  /(?:-----BEGIN [^-]+ PRIVATE KEY-----|\bBearer\s+\S+|\b(?:sk|rk|pk|ghp|github_pat|xox[abprs])[-_][A-Za-z0-9_-]+)/i;
const URL_PATTERN = /(?:https?|ftp|gs|s3):\/\//i;

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
  ensure(typeof value === "string" && value.trim().length > 0, path, "expected a non-empty string");
  return value;
};

const nullableStringAt = (value: unknown, path: string): string | null => {
  ensure(value === null || (typeof value === "string" && value.trim().length > 0), path, "expected null or a non-empty string");
  return value;
};

const booleanAt = (value: unknown, path: string): boolean => {
  ensure(typeof value === "boolean", path, "expected a boolean");
  return value;
};

const integerAt = (value: unknown, path: string): number => {
  ensure(typeof value === "number" && Number.isInteger(value) && value >= 0, path, "expected a non-negative integer");
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
  ensure(sameValue(left, right), path, "does not match its source observation");
};

const isInside = (root: string, candidate: string): boolean => {
  const child = relative(root, candidate);
  return child !== "" && child !== ".." && !child.startsWith("../") && !isAbsolute(child);
};

const expectedArtifactPath = (
  candidateId: AlternativeCarrierCandidateId,
  kind: "source" | "roundtrip" | "copy",
): string => {
  if (kind === "source") {
    return `${ARTIFACT_DIRECTORY}/${candidateId}.docx`;
  }
  if (kind === "roundtrip") {
    return `${ARTIFACT_DIRECTORY}/${candidateId}-google-docs-roundtrip.docx`;
  }
  return `${ARTIFACT_DIRECTORY}/${candidateId}-google-docs-copy-plain-text.txt`;
};

const assertSafeRecordContent = (value: unknown, path = "$"): void => {
  if (typeof value === "string") {
    const safetyPath = /\.safety\.(?:externalRelationships|unresolvedRelationshipTargets)(?:\[\d+\])?$/.test(path);
    ensure(
      safetyPath || !URL_PATTERN.test(value),
      path,
      "URL-shaped values are not allowed",
    );
    ensure(
      !FORBIDDEN_VALUE_PATTERN.test(value),
      path,
      "credential-shaped values are not allowed",
    );
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertSafeRecordContent(entry, `${path}[${index}]`));
    return;
  }
  if (!isRecord(value)) {
    return;
  }
  for (const [key, entry] of Object.entries(value)) {
    ensure(!FORBIDDEN_KEY_PATTERN.test(key), path, "prohibited field name");
    assertSafeRecordContent(entry, `${path}.${key}`);
  }
};

const assertHash = (value: unknown, path: string): string => {
  const hash = stringAt(value, path);
  ensure(HASH_PATTERN.test(hash), path, "expected a lowercase SHA-256 hash");
  return hash;
};

const assertArtifactRef = (
  value: unknown,
  path: string,
  candidateId: AlternativeCarrierCandidateId,
  kind: "source" | "roundtrip" | "copy",
): ArtifactRef => {
  const object = exactObject(value, ["path", "sha256"], path);
  const artifactPath = stringAt(object.path, `${path}.path`);
  ensure(
    artifactPath === expectedArtifactPath(candidateId, kind),
    `${path}.path`,
    "must use the frozen bakeoff artifact filename",
  );
  ensure(
    !isAbsolute(artifactPath) &&
      artifactPath.startsWith(PATH_ROOT_PATTERN) &&
      !artifactPath.split(/[\\/]+/).includes("..") &&
      !artifactPath.includes("\0"),
    `${path}.path`,
    "must remain inside the ignored bakeoff artifact directory",
  );
  const sha256 = assertHash(object.sha256, `${path}.sha256`);
  return { path: artifactPath, sha256 };
};

const assertSafety = (value: unknown, path: string): InspectorSafetySummary => {
  const object = exactObject(value, SAFETY_KEYS, path);
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

const assertRunFormat = (value: unknown, path: string): MarkerRunFormat => {
  const object = exactObject(
    value,
    ["hidden", "color", "sizeHalfPoints", "sizeComplexScriptHalfPoints"],
    path,
  );
  ensure(
    typeof object.hidden === "boolean",
    `${path}.hidden`,
    "expected a boolean",
  );
  ensure(
    object.color === null ||
      (typeof object.color === "string" && object.color.trim().length > 0),
    `${path}.color`,
    "expected null or a non-empty string",
  );
  for (const key of ["sizeHalfPoints", "sizeComplexScriptHalfPoints"] as const) {
    ensure(
      object[key] === null ||
        (typeof object[key] === "number" &&
          Number.isInteger(object[key]) &&
          object[key] >= 0),
      `${path}.${key}`,
      "expected null or a non-negative integer",
    );
  }
  return object as MarkerRunFormat;
};

const assertOccurrence = (
  value: unknown,
  path: string,
): MarkerOccurrenceSummary => {
  const object = exactObject(
    value,
    ["markerId", "partName", "location", "paragraphIndex", "runIndices", "runFormats"],
    path,
  );
  const markerId = enumAt(object.markerId, ["alpha", "beta"] as const, `${path}.markerId`);
  const partName = stringAt(object.partName, `${path}.partName`);
  const location = enumAt(
    object.location,
    ["body", "header", "footer", "footnote", "endnote", "comments", "other"] as const,
    `${path}.location`,
  );
  const paragraphIndex = integerAt(object.paragraphIndex, `${path}.paragraphIndex`);
  const runIndices = arrayAt(object.runIndices, `${path}.runIndices`).map((entry, index) =>
    integerAt(entry, `${path}.runIndices[${index}]`),
  );
  ensure(runIndices.length > 0, `${path}.runIndices`, "expected at least one run index");
  const runFormats = arrayAt(object.runFormats, `${path}.runFormats`).map((entry, index) =>
    assertRunFormat(entry, `${path}.runFormats[${index}]`),
  );
  ensure(
    runFormats.length === runIndices.length,
    `${path}.runFormats`,
    "must have one format per overlapping run",
  );
  return {
    markerId,
    partName,
    location,
    paragraphIndex,
    runIndices,
    runFormats,
  };
};

const assertInspection = (
  value: unknown,
  path: string,
  source: boolean,
): TransformedDocxInspectionSummary => {
  const object = exactObject(
    value,
    ["entries", "visibleBodyParagraphs", "markerPresence", "markerOccurrences", "safety"],
    path,
  );
  const entries = stringArrayAt(object.entries, `${path}.entries`, true);
  ensure(new Set(entries).size === entries.length, `${path}.entries`, "must not contain duplicate package entries");
  for (const requiredEntry of REQUIRED_DOCX_ENTRIES) {
    ensure(entries.includes(requiredEntry), `${path}.entries`, "missing required DOCX entry");
  }
  const visibleBodyParagraphs = stringArrayAt(
    object.visibleBodyParagraphs,
    `${path}.visibleBodyParagraphs`,
    false,
  );
  if (source) {
    equalAt(visibleBodyParagraphs, VISIBLE_PARAGRAPHS, `${path}.visibleBodyParagraphs`);
  }
  const markerPresenceObject = exactObject(
    object.markerPresence,
    ["alpha", "beta"],
    `${path}.markerPresence`,
  );
  const markerPresence = {
    alpha: enumAt(markerPresenceObject.alpha, ["present", "absent"] as const, `${path}.markerPresence.alpha`),
    beta: enumAt(markerPresenceObject.beta, ["present", "absent"] as const, `${path}.markerPresence.beta`),
  } as const;
  const markerOccurrences = arrayAt(object.markerOccurrences, `${path}.markerOccurrences`).map((entry, index) =>
    assertOccurrence(entry, `${path}.markerOccurrences[${index}]`),
  );
  for (const markerId of ["alpha", "beta"] as const) {
    const occurrenceCount = markerOccurrences.filter((occurrence) => occurrence.markerId === markerId).length;
    ensure(
      (markerPresence[markerId] === "present") === (occurrenceCount > 0),
      `${path}.markerPresence.${markerId}`,
      "does not match marker occurrences",
    );
  }
  const safety = assertSafety(object.safety, `${path}.safety`);
  if (source) {
    ensure(
      Object.values(safety).every((findings) => findings.length === 0),
      `${path}.safety`,
      "canonical source safety findings must be empty",
    );
  }
  return { entries, visibleBodyParagraphs, markerPresence, markerOccurrences, safety };
};

const assertWorkflowApplication = (
  value: unknown,
  path: string,
): WorkflowApplication => {
  const object = exactObject(value, ["name", "version"], path);
  return {
    name: stringAt(object.name, `${path}.name`),
    version: nullableStringAt(object.version, `${path}.version`),
  };
};

const assertWorkflowPlatform = (
  value: unknown,
  path: string,
): WorkflowPlatform => {
  const object = exactObject(value, ["name", "version"], path);
  return {
    name: stringAt(object.name, `${path}.name`),
    version: nullableStringAt(object.version, `${path}.version`),
  };
};

const assertMarkerObservation = (value: unknown, path: string): MarkerObservation =>
  enumAt(value, ["present", "absent", "not_assessable", "not_applicable"] as const, path);

const assertVisibleBody = (value: unknown, path: string): VisibleBodyObservation =>
  enumAt(value, ["preserved", "changed", "lost", "not_assessable", "not_applicable"] as const, path);

const assertOrdinaryVisibility = (
  value: unknown,
  path: string,
): OrdinaryVisibilityObservation =>
  enumAt(value, ["not_visible", "visible", "not_assessable", "not_applicable"] as const, path);

const assertExposureArray = (value: unknown, path: string): ConditionalExposure[] =>
  arrayAt(value, path).map((entry, index) =>
    enumAt(
      entry,
      ["hidden_text_setting", "accessibility_tool", "plain_text_extraction", "other_recorded_tool"] as const,
      `${path}[${index}]`,
    ),
  );

const assertSourcePlacement = (
  inspection: TransformedDocxInspectionSummary,
  candidateId: AlternativeCarrierCandidateId,
  path: string,
): void => {
  const contract = CANDIDATE_CONTRACT[candidateId];
  ensure(inspection.markerPresence.alpha === "present" && inspection.markerPresence.beta === "present", path, "source must contain both fixed markers");
  for (const [markerId, paragraphIndex] of [
    ["alpha", contract.alphaParagraphIndex],
    ["beta", contract.betaParagraphIndex],
  ] as const) {
    const occurrences = inspection.markerOccurrences.filter((occurrence) => occurrence.markerId === markerId);
    ensure(occurrences.length === 1, `${path}.markerOccurrences.${markerId}`, "source must contain exactly one occurrence");
    const occurrence = occurrences[0];
    ensure(occurrence !== undefined, `${path}.markerOccurrences.${markerId}`, "missing source occurrence");
    equalAt(occurrence.partName, contract.partName, `${path}.markerOccurrences.${markerId}.partName`);
    equalAt(occurrence.location, contract.location, `${path}.markerOccurrences.${markerId}.location`);
    equalAt(occurrence.paragraphIndex, paragraphIndex, `${path}.markerOccurrences.${markerId}.paragraphIndex`);
    equalAt(occurrence.runIndices, [contract.runIndex], `${path}.markerOccurrences.${markerId}.runIndices`);
    equalAt(occurrence.runFormats, [contract.format], `${path}.markerOccurrences.${markerId}.runFormats`);
  }
};

const assertRoundtrip = (
  value: unknown,
  path: string,
  candidateId: AlternativeCarrierCandidateId,
  canonicalHash: string,
): RoundtripWorkflow => {
  const object = exactObject(
    value,
    ["status", "failureReason", "application", "platform", "steps", "sourceArtifactSha256", "resultArtifact", "markerPresence", "visibleBody", "ordinaryVisibility", "conditionalExposure", "transformedInspection", "protocolDeviation", "notes"],
    path,
  );
  ensure(object.status === "completed", `${path}.status`, "round-trip workflow must be completed");
  ensure(object.failureReason === null, `${path}.failureReason`, "completed round-trip must have a null failure reason");
  const application = assertWorkflowApplication(object.application, `${path}.application`);
  ensure(application.name === "Google Docs", `${path}.application.name`, "must be Google Docs");
  const platform = assertWorkflowPlatform(object.platform, `${path}.platform`);
  const steps = stringArrayAt(object.steps, `${path}.steps`, true);
  const sourceArtifactSha256 = assertHash(object.sourceArtifactSha256, `${path}.sourceArtifactSha256`);
  equalAt(sourceArtifactSha256, canonicalHash, `${path}.sourceArtifactSha256`);
  const resultArtifact = assertArtifactRef(object.resultArtifact, `${path}.resultArtifact`, candidateId, "roundtrip");
  const markerPresenceObject = exactObject(object.markerPresence, ["alpha", "beta"], `${path}.markerPresence`);
  const markerPresence = {
    alpha: assertMarkerObservation(markerPresenceObject.alpha, `${path}.markerPresence.alpha`),
    beta: assertMarkerObservation(markerPresenceObject.beta, `${path}.markerPresence.beta`),
  } as const;
  ensure(markerPresence.alpha === "present" || markerPresence.alpha === "absent", `${path}.markerPresence.alpha`, "completed DOCX inspection must assess Alpha");
  ensure(markerPresence.beta === "present" || markerPresence.beta === "absent", `${path}.markerPresence.beta`, "completed DOCX inspection must assess Beta");
  const visibleBody = assertVisibleBody(object.visibleBody, `${path}.visibleBody`);
  const ordinaryVisibility = assertOrdinaryVisibility(object.ordinaryVisibility, `${path}.ordinaryVisibility`);
  const conditionalExposure = assertExposureArray(object.conditionalExposure, `${path}.conditionalExposure`);
  const transformedInspection = assertInspection(object.transformedInspection, `${path}.transformedInspection`, false);
  equalAt(markerPresence, transformedInspection.markerPresence, `${path}.markerPresence`);
  if (visibleBody === "preserved") {
    equalAt(transformedInspection.visibleBodyParagraphs, VISIBLE_PARAGRAPHS, `${path}.transformedInspection.visibleBodyParagraphs`);
  }
  const protocolDeviation = nullableStringAt(object.protocolDeviation, `${path}.protocolDeviation`);
  const notes = stringArrayAt(object.notes, `${path}.notes`, false);
  return {
    status: "completed",
    failureReason: null,
    application,
    platform,
    steps,
    sourceArtifactSha256,
    resultArtifact,
    markerPresence,
    visibleBody,
    ordinaryVisibility,
    conditionalExposure,
    transformedInspection,
    protocolDeviation,
    notes,
  };
};

const assertCopy = (
  value: unknown,
  path: string,
  candidateId: AlternativeCarrierCandidateId,
  canonicalHash: string,
): CopyWorkflow => {
  const object = exactObject(
    value,
    ["status", "failureReason", "application", "platform", "steps", "sourceArtifactSha256", "resultArtifact", "markerPresence", "visibleBody", "ordinaryVisibility", "conditionalExposure", "protocolDeviation", "notes"],
    path,
  );
  const status = enumAt(object.status, ["completed", "failed", "not_run"] as const, `${path}.status`);
  const failureReason = nullableStringAt(object.failureReason, `${path}.failureReason`);
  const application = assertWorkflowApplication(object.application, `${path}.application`);
  const platform = assertWorkflowPlatform(object.platform, `${path}.platform`);
  const steps = stringArrayAt(object.steps, `${path}.steps`, true);
  const sourceArtifactSha256 = assertHash(object.sourceArtifactSha256, `${path}.sourceArtifactSha256`);
  equalAt(sourceArtifactSha256, canonicalHash, `${path}.sourceArtifactSha256`);
  const markerPresenceObject = exactObject(object.markerPresence, ["alpha", "beta"], `${path}.markerPresence`);
  const markerPresence = {
    alpha: assertMarkerObservation(markerPresenceObject.alpha, `${path}.markerPresence.alpha`),
    beta: assertMarkerObservation(markerPresenceObject.beta, `${path}.markerPresence.beta`),
  } as const;
  const visibleBody = assertVisibleBody(object.visibleBody, `${path}.visibleBody`);
  ensure(object.ordinaryVisibility === "not_applicable", `${path}.ordinaryVisibility`, "copy workflow ordinary visibility must be not_applicable");
  const conditionalExposure = assertExposureArray(object.conditionalExposure, `${path}.conditionalExposure`);
  const protocolDeviation = nullableStringAt(object.protocolDeviation, `${path}.protocolDeviation`);
  const notes = stringArrayAt(object.notes, `${path}.notes`, false);
  let resultArtifact: ArtifactRef | null = null;
  if (status === "completed") {
    ensure(failureReason === null, `${path}.failureReason`, "completed copy must have a null failure reason");
    resultArtifact = assertArtifactRef(object.resultArtifact, `${path}.resultArtifact`, candidateId, "copy");
  } else {
    ensure(failureReason !== null && failureReason.trim().length > 0, `${path}.failureReason`, "failed or not-run copy needs a non-empty reason");
    ensure(object.resultArtifact === null, `${path}.resultArtifact`, "failed or not-run copy must not retain an artifact");
    ensure(markerPresence.alpha === "not_assessable" && markerPresence.beta === "not_assessable", `${path}.markerPresence`, "failed or not-run copy markers must be not_assessable");
    ensure(visibleBody === "not_assessable", `${path}.visibleBody`, "failed or not-run copy body must be not_assessable");
  }
  return {
    status,
    failureReason,
    application,
    platform,
    steps,
    sourceArtifactSha256,
    resultArtifact,
    markerPresence,
    visibleBody,
    ordinaryVisibility: "not_applicable",
    conditionalExposure,
    protocolDeviation,
    notes,
  };
};

const assertMatrix = (
  value: unknown,
  path: string,
  candidate: CandidateRecord,
): MatrixRow => {
  const object = exactObject(value, ["candidateId", "transport", "presentation", "accessibilityTrust", "engineering"], path);
  ensure(object.candidateId === candidate.candidateId, `${path}.candidateId`, "must match the candidate row");
  const candidateId = candidate.candidateId;
  const transportObject = exactObject(object.transport, ["canonicalValid", "sourceMarkerPresence", "sourceLocations", "sourceFormats", "roundtripMarkerPresence", "roundtripLocations", "roundtripFormats", "roundtripVisibleBody", "copyMarkerPresence", "copyVisibleBody"], `${path}.transport`);
  ensure(transportObject.canonicalValid === true, `${path}.transport.canonicalValid`, "canonical candidate validation must be true");
  const sourceMarkerObject = exactObject(transportObject.sourceMarkerPresence, ["alpha", "beta"], `${path}.transport.sourceMarkerPresence`);
  const sourceMarkerPresence = {
    alpha: enumAt(sourceMarkerObject.alpha, ["present", "absent"] as const, `${path}.transport.sourceMarkerPresence.alpha`),
    beta: enumAt(sourceMarkerObject.beta, ["present", "absent"] as const, `${path}.transport.sourceMarkerPresence.beta`),
  } as const;
  equalAt(sourceMarkerPresence, candidate.sourceInspection.markerPresence, `${path}.transport.sourceMarkerPresence`);
  const sourceLocations = arrayAt(transportObject.sourceLocations, `${path}.transport.sourceLocations`).map((entry, index) => assertOccurrence(entry, `${path}.transport.sourceLocations[${index}]`));
  equalAt(sourceLocations, candidate.sourceInspection.markerOccurrences, `${path}.transport.sourceLocations`);
  const sourceFormats = arrayAt(transportObject.sourceFormats, `${path}.transport.sourceFormats`).map((entry, index) => assertRunFormat(entry, `${path}.transport.sourceFormats[${index}]`));
  equalAt(sourceFormats, candidate.sourceInspection.markerOccurrences.flatMap((occurrence) => occurrence.runFormats), `${path}.transport.sourceFormats`);
  const roundtripMarkerObject = exactObject(transportObject.roundtripMarkerPresence, ["alpha", "beta"], `${path}.transport.roundtripMarkerPresence`);
  const roundtripMarkerPresence = {
    alpha: assertMarkerObservation(roundtripMarkerObject.alpha, `${path}.transport.roundtripMarkerPresence.alpha`),
    beta: assertMarkerObservation(roundtripMarkerObject.beta, `${path}.transport.roundtripMarkerPresence.beta`),
  } as const;
  equalAt(roundtripMarkerPresence, candidate.googleDocsRoundtrip.markerPresence, `${path}.transport.roundtripMarkerPresence`);
  const roundtripLocations = arrayAt(transportObject.roundtripLocations, `${path}.transport.roundtripLocations`).map((entry, index) => assertOccurrence(entry, `${path}.transport.roundtripLocations[${index}]`));
  equalAt(roundtripLocations, candidate.googleDocsRoundtrip.transformedInspection.markerOccurrences, `${path}.transport.roundtripLocations`);
  const roundtripFormats = arrayAt(transportObject.roundtripFormats, `${path}.transport.roundtripFormats`).map((entry, index) => assertRunFormat(entry, `${path}.transport.roundtripFormats[${index}]`));
  equalAt(roundtripFormats, candidate.googleDocsRoundtrip.transformedInspection.markerOccurrences.flatMap((occurrence) => occurrence.runFormats), `${path}.transport.roundtripFormats`);
  const roundtripVisibleBody = assertVisibleBody(transportObject.roundtripVisibleBody, `${path}.transport.roundtripVisibleBody`);
  equalAt(roundtripVisibleBody, candidate.googleDocsRoundtrip.visibleBody, `${path}.transport.roundtripVisibleBody`);
  const copyMarkerObject = exactObject(transportObject.copyMarkerPresence, ["alpha", "beta"], `${path}.transport.copyMarkerPresence`);
  const copyMarkerPresence = {
    alpha: assertMarkerObservation(copyMarkerObject.alpha, `${path}.transport.copyMarkerPresence.alpha`),
    beta: assertMarkerObservation(copyMarkerObject.beta, `${path}.transport.copyMarkerPresence.beta`),
  } as const;
  equalAt(copyMarkerPresence, candidate.googleDocsCopyPlainText.markerPresence, `${path}.transport.copyMarkerPresence`);
  const copyVisibleBody = assertVisibleBody(transportObject.copyVisibleBody, `${path}.transport.copyVisibleBody`);
  equalAt(copyVisibleBody, candidate.googleDocsCopyPlainText.visibleBody, `${path}.transport.copyVisibleBody`);

  const presentationObject = exactObject(object.presentation, ["ordinaryVisibility", "layoutDisturbance", "selectionReveal", "backgroundOrThemeReveal", "explicitFormattingReveal"], `${path}.presentation`);
  const ordinaryVisibility = assertOrdinaryVisibility(presentationObject.ordinaryVisibility, `${path}.presentation.ordinaryVisibility`);
  equalAt(ordinaryVisibility, candidate.googleDocsRoundtrip.ordinaryVisibility, `${path}.presentation.ordinaryVisibility`);
  const layoutDisturbance = enumAt(presentationObject.layoutDisturbance, ["none_observed", "minor", "material", "not_assessable"] as const, `${path}.presentation.layoutDisturbance`);
  const selectionReveal = enumAt(presentationObject.selectionReveal, ["revealed", "not_revealed", "not_run", "not_assessable"] as const, `${path}.presentation.selectionReveal`);
  const backgroundOrThemeReveal = enumAt(presentationObject.backgroundOrThemeReveal, ["revealed", "not_revealed", "not_run", "not_assessable"] as const, `${path}.presentation.backgroundOrThemeReveal`);
  const explicitFormattingReveal = enumAt(presentationObject.explicitFormattingReveal, ["revealed", "not_revealed", "not_run", "not_assessable"] as const, `${path}.presentation.explicitFormattingReveal`);

  const accessibilityObject = exactObject(object.accessibilityTrust, ["assistiveExposure", "accidentalExposureNotes", "limitations"], `${path}.accessibilityTrust`);
  const assistiveExposure = enumAt(accessibilityObject.assistiveExposure, ["exposed", "not_exposed", "not_run", "not_assessable"] as const, `${path}.accessibilityTrust.assistiveExposure`);
  const accidentalExposureNotes = stringArrayAt(accessibilityObject.accidentalExposureNotes, `${path}.accessibilityTrust.accidentalExposureNotes`, false);
  const limitations = stringArrayAt(accessibilityObject.limitations, `${path}.accessibilityTrust.limitations`, false);

  const engineeringObject = exactObject(object.engineering, ["structuralSimplicity", "deterministicGeneration", "deterministicInspection", "testedEditorScope", "sourceSafetyClean", "roundtripSafetyClean"], `${path}.engineering`);
  const contract = CANDIDATE_CONTRACT[candidateId];
  const structuralSimplicity = enumAt(engineeringObject.structuralSimplicity, ["single-direct-color-property", "single-direct-size-property", "single-default-header-region"] as const, `${path}.engineering.structuralSimplicity`);
  equalAt(structuralSimplicity, contract.simplicity, `${path}.engineering.structuralSimplicity`);
  const deterministicGeneration = booleanAt(engineeringObject.deterministicGeneration, `${path}.engineering.deterministicGeneration`);
  const deterministicInspection = booleanAt(engineeringObject.deterministicInspection, `${path}.engineering.deterministicInspection`);
  ensure(engineeringObject.testedEditorScope === "Google Docs import/export only", `${path}.engineering.testedEditorScope`, "must use the frozen editor scope");
  const sourceSafetyClean = booleanAt(engineeringObject.sourceSafetyClean, `${path}.engineering.sourceSafetyClean`);
  const roundtripSafetyClean = booleanAt(engineeringObject.roundtripSafetyClean, `${path}.engineering.roundtripSafetyClean`);
  const expectedSourceSafetyClean = Object.values(candidate.sourceInspection.safety).every((findings) => findings.length === 0);
  const expectedRoundtripSafetyClean = Object.values(candidate.googleDocsRoundtrip.transformedInspection.safety).every((findings) => findings.length === 0);
  equalAt(sourceSafetyClean, expectedSourceSafetyClean, `${path}.engineering.sourceSafetyClean`);
  equalAt(roundtripSafetyClean, expectedRoundtripSafetyClean, `${path}.engineering.roundtripSafetyClean`);

  return {
    candidateId,
    transport: {
      canonicalValid: true,
      sourceMarkerPresence,
      sourceLocations,
      sourceFormats,
      roundtripMarkerPresence,
      roundtripLocations,
      roundtripFormats,
      roundtripVisibleBody,
      copyMarkerPresence,
      copyVisibleBody,
    },
    presentation: {
      ordinaryVisibility,
      layoutDisturbance,
      selectionReveal,
      backgroundOrThemeReveal,
      explicitFormattingReveal,
    },
    accessibilityTrust: {
      assistiveExposure,
      accidentalExposureNotes,
      limitations,
    },
    engineering: {
      structuralSimplicity,
      deterministicGeneration,
      deterministicInspection,
      testedEditorScope: "Google Docs import/export only",
      sourceSafetyClean,
      roundtripSafetyClean,
    },
  };
};

const formatMatches = (
  format: MarkerRunFormat,
  expected: MarkerRunFormat,
): boolean => sameValue(format, expected);

const markerRetainsMechanism = (
  candidate: CandidateRecord,
  markerId: "alpha" | "beta",
): boolean => {
  const contract = CANDIDATE_CONTRACT[candidate.candidateId];
  const occurrences = candidate.googleDocsRoundtrip.transformedInspection.markerOccurrences.filter(
    (occurrence) => occurrence.markerId === markerId,
  );
  return (
    occurrences.length > 0 &&
    occurrences.every(
      (occurrence) =>
        occurrence.location === "body" &&
        occurrence.runFormats.every((format) => formatMatches(format, contract.format)),
    )
  );
};

const isSelectionEligible = (candidate: CandidateRecord): boolean => {
  if (
    candidate.candidateId === "docx-header-text-v1" ||
    !Object.values(candidate.sourceInspection.safety).every((findings) => findings.length === 0) ||
    !Object.values(candidate.googleDocsRoundtrip.transformedInspection.safety).every((findings) => findings.length === 0)
  ) {
    return false;
  }
  const roundtrip = candidate.googleDocsRoundtrip;
  return (
    roundtrip.markerPresence.alpha === "present" &&
    roundtrip.markerPresence.beta === "present" &&
    markerRetainsMechanism(candidate, "alpha") &&
    markerRetainsMechanism(candidate, "beta") &&
    roundtrip.visibleBody === "preserved" &&
    sameValue(roundtrip.transformedInspection.visibleBodyParagraphs, VISIBLE_PARAGRAPHS) &&
    roundtrip.ordinaryVisibility === "not_visible"
  );
};

const hasRevisionEvidence = (
  candidates: readonly CandidateRecord[],
): boolean => {
  const bodyCandidates = candidates.filter((candidate) => candidate.candidateId !== "docx-header-text-v1");
  if (bodyCandidates.length === 2 && bodyCandidates.every(isSelectionEligible)) {
    return true;
  }
  return candidates.some((candidate) => {
    const roundtrip = candidate.googleDocsRoundtrip;
    const alphaPresent = roundtrip.markerPresence.alpha === "present";
    const betaPresent = roundtrip.markerPresence.beta === "present";
    if (candidate.candidateId === "docx-header-text-v1" && (alphaPresent || betaPresent)) {
      return true;
    }
    if (alphaPresent !== betaPresent) {
      return true;
    }
    if (
      alphaPresent &&
      betaPresent &&
      (roundtrip.visibleBody === "changed" || roundtrip.visibleBody === "lost")
    ) {
      return true;
    }
    if (
      (alphaPresent || betaPresent) &&
      roundtrip.conditionalExposure.length > 0
    ) {
      return true;
    }
    if (
      alphaPresent &&
      betaPresent &&
      (!markerRetainsMechanism(candidate, "alpha") ||
        !markerRetainsMechanism(candidate, "beta"))
    ) {
      return true;
    }
    return false;
  });
};

const assertGate = (
  gateDecision: GateDecision,
  selectedCandidateId: AlternativeCarrierCandidateId | null,
  candidates: readonly CandidateRecord[],
  path: string,
): void => {
  const eligible = candidates.filter(isSelectionEligible);
  if (gateDecision === "SELECT_CANDIDATE") {
    ensure(eligible.length === 1, path, "SELECT_CANDIDATE requires exactly one eligible body candidate");
    ensure(selectedCandidateId === eligible[0]?.candidateId, `${path}.selectedCandidateId`, "must equal the sole eligible body candidate");
    return;
  }
  ensure(selectedCandidateId === null, `${path}.selectedCandidateId`, "must be null for a non-select decision");
  const revision = hasRevisionEvidence(candidates);
  if (gateDecision === "REVISE_CANDIDATE") {
    ensure(eligible.length !== 1, path, "a unique eligible body candidate requires SELECT_CANDIDATE");
    ensure(revision, path, "REVISE_CANDIDATE requires bounded evidence for a retest");
  } else {
    ensure(eligible.length === 0, path, "NO_VIABLE_DOCX_CARRIER cannot retain an eligible candidate");
    ensure(!revision, path, "NO_VIABLE_DOCX_CARRIER cannot discard bounded revision evidence");
  }
};

const assertRecordShape = (value: unknown): BakeoffRunRecord => {
  assertSafeRecordContent(value);
  const object = exactObject(
    value,
    ["experimentId", "experimentSchemaVersion", "date", "bakeoffProfile", "fingerprintStrategy", "fingerprintStrategyVersion", "matchingProfile", "fixedMarkers", "visibleFixture", "sourceGenerator", "googleDocsProtocol", "candidates", "matrix", "gateDecision", "selectedCandidateId", "gateRationale", "limitations"],
    "$",
  );
  ensure(object.experimentId === EXPERIMENT_ID, "$.experimentId", "does not match the frozen experiment ID");
  ensure(object.experimentSchemaVersion === EXPERIMENT_SCHEMA_VERSION, "$.experimentSchemaVersion", "does not match the frozen schema version");
  const date = stringAt(object.date, "$.date");
  ensure(/^\d{4}-\d{2}-\d{2}$/.test(date), "$.date", "must use YYYY-MM-DD");
  ensure(object.bakeoffProfile === BAKEOFF_PROFILE, "$.bakeoffProfile", "does not match the frozen bakeoff profile");
  ensure(object.fingerprintStrategy === null, "$.fingerprintStrategy", "must remain null in the carrier bakeoff");
  ensure(object.fingerprintStrategyVersion === null, "$.fingerprintStrategyVersion", "must remain null in the carrier bakeoff");
  ensure(object.matchingProfile === null, "$.matchingProfile", "must remain null in the carrier bakeoff");
  const fixedMarkers = exactObject(object.fixedMarkers, ["alpha", "beta"], "$.fixedMarkers");
  ensure(fixedMarkers.alpha === FIXED_MARKER_ALPHA, "$.fixedMarkers.alpha", "does not match the frozen Alpha marker");
  ensure(fixedMarkers.beta === FIXED_MARKER_BETA, "$.fixedMarkers.beta", "does not match the frozen Beta marker");
  const visibleFixture = exactObject(object.visibleFixture, ["id", "sourcePath"], "$.visibleFixture");
  ensure(visibleFixture.id === VISIBLE_FIXTURE_ID, "$.visibleFixture.id", "does not match the frozen fixture");
  ensure(visibleFixture.sourcePath === "research/experiments/docx-hidden-run-v1/fixture.ts", "$.visibleFixture.sourcePath", "must use the frozen fixture source path");
  const sourceGenerator = exactObject(object.sourceGenerator, ["path", "gitCommit", "nodeVersion", "pnpmVersion", "docxVersion"], "$.sourceGenerator");
  ensure(sourceGenerator.path === SOURCE_GENERATOR_PATH, "$.sourceGenerator.path", "must use the frozen generator path");
  const gitCommit = stringAt(sourceGenerator.gitCommit, "$.sourceGenerator.gitCommit");
  const nodeVersion = stringAt(sourceGenerator.nodeVersion, "$.sourceGenerator.nodeVersion");
  const pnpmVersion = stringAt(sourceGenerator.pnpmVersion, "$.sourceGenerator.pnpmVersion");
  ensure(sourceGenerator.docxVersion === "9.7.1", "$.sourceGenerator.docxVersion", "must match the frozen docx dependency");
  const protocol = exactObject(object.googleDocsProtocol, ["application", "platform", "candidateOrder", "documentRule"], "$.googleDocsProtocol");
  const protocolApplication = assertWorkflowApplication(protocol.application, "$.googleDocsProtocol.application");
  ensure(protocolApplication.name === "Google Docs", "$.googleDocsProtocol.application.name", "must be Google Docs");
  const protocolPlatform = assertWorkflowPlatform(protocol.platform, "$.googleDocsProtocol.platform");
  const candidateOrder = arrayAt(protocol.candidateOrder, "$.googleDocsProtocol.candidateOrder");
  equalAt(candidateOrder, CANDIDATE_ORDER, "$.googleDocsProtocol.candidateOrder");
  ensure(protocol.documentRule === "one new unshared document per candidate", "$.googleDocsProtocol.documentRule", "does not match the frozen document rule");
  const candidateValues = arrayAt(object.candidates, "$.candidates");
  ensure(candidateValues.length === CANDIDATE_ORDER.length, "$.candidates", "must contain exactly three candidates");
  const candidates = candidateValues.map((entry, index) => {
    const candidateObject = exactObject(entry, ["candidateId", "mechanism", "documentProfile", "canonicalArtifact", "canonicalProfileValidation", "sourceInspection", "googleDocsRoundtrip", "googleDocsCopyPlainText"], `$.candidates[${index}]`);
    const candidateId = enumAt(candidateObject.candidateId, CANDIDATE_ORDER, `$.candidates[${index}].candidateId`);
    ensure(candidateId === CANDIDATE_ORDER[index], `$.candidates[${index}].candidateId`, "must follow the frozen candidate order");
    const contract = CANDIDATE_CONTRACT[candidateId];
    ensure(candidateObject.mechanism === contract.mechanism, `$.candidates[${index}].mechanism`, "does not match the candidate mapping");
    ensure(candidateObject.documentProfile === contract.documentProfile, `$.candidates[${index}].documentProfile`, "does not match the candidate mapping");
    const canonicalArtifact = assertArtifactRef(candidateObject.canonicalArtifact, `$.candidates[${index}].canonicalArtifact`, candidateId, "source");
    const profileValidation = exactObject(candidateObject.canonicalProfileValidation, ["status", "testCommand"], `$.candidates[${index}].canonicalProfileValidation`);
    ensure(profileValidation.status === "passed", `$.candidates[${index}].canonicalProfileValidation.status`, "must be passed");
    ensure(profileValidation.testCommand === CANONICAL_PROFILE_TEST_COMMAND, `$.candidates[${index}].canonicalProfileValidation.testCommand`, "must use the canonical candidate test command");
    const sourceInspection = assertInspection(candidateObject.sourceInspection, `$.candidates[${index}].sourceInspection`, true);
    assertSourcePlacement(sourceInspection, candidateId, `$.candidates[${index}].sourceInspection`);
    const googleDocsRoundtrip = assertRoundtrip(candidateObject.googleDocsRoundtrip, `$.candidates[${index}].googleDocsRoundtrip`, candidateId, canonicalArtifact.sha256);
    const googleDocsCopyPlainText = assertCopy(candidateObject.googleDocsCopyPlainText, `$.candidates[${index}].googleDocsCopyPlainText`, candidateId, canonicalArtifact.sha256);
    return {
      candidateId,
      mechanism: contract.mechanism,
      documentProfile: contract.documentProfile,
      canonicalArtifact,
      canonicalProfileValidation: { status: "passed", testCommand: CANONICAL_PROFILE_TEST_COMMAND },
      sourceInspection,
      googleDocsRoundtrip,
      googleDocsCopyPlainText,
    } satisfies CandidateRecord;
  });
  const matrixValues = arrayAt(object.matrix, "$.matrix");
  ensure(matrixValues.length === CANDIDATE_ORDER.length, "$.matrix", "must contain exactly three rows");
  const matrix = matrixValues.map((entry, index) => assertMatrix(entry, `$.matrix[${index}]`, candidates[index]!));
  const gateDecision = enumAt(object.gateDecision, ["SELECT_CANDIDATE", "REVISE_CANDIDATE", "NO_VIABLE_DOCX_CARRIER"] as const, "$.gateDecision");
  const selectedCandidateId = object.selectedCandidateId === null
    ? null
    : enumAt(object.selectedCandidateId, CANDIDATE_ORDER, "$.selectedCandidateId");
  const gateRationale = stringArrayAt(object.gateRationale, "$.gateRationale", true);
  const limitations = stringArrayAt(object.limitations, "$.limitations", true);
  assertGate(gateDecision, selectedCandidateId, candidates, "$.gateDecision");
  return {
    experimentId: EXPERIMENT_ID,
    experimentSchemaVersion: EXPERIMENT_SCHEMA_VERSION,
    date: date as ISODate,
    bakeoffProfile: BAKEOFF_PROFILE,
    fingerprintStrategy: null,
    fingerprintStrategyVersion: null,
    matchingProfile: null,
    fixedMarkers: { alpha: FIXED_MARKER_ALPHA, beta: FIXED_MARKER_BETA },
    visibleFixture: {
      id: VISIBLE_FIXTURE_ID,
      sourcePath: "research/experiments/docx-hidden-run-v1/fixture.ts",
    },
    sourceGenerator: {
      path: SOURCE_GENERATOR_PATH,
      gitCommit,
      nodeVersion,
      pnpmVersion,
      docxVersion: "9.7.1",
    },
    googleDocsProtocol: {
      application: protocolApplication as WorkflowApplication & { name: "Google Docs" },
      platform: protocolPlatform,
      candidateOrder: CANDIDATE_ORDER,
      documentRule: "one new unshared document per candidate",
    },
    candidates: candidates as [CandidateRecord, CandidateRecord, CandidateRecord],
    matrix: matrix as [MatrixRow, MatrixRow, MatrixRow],
    gateDecision,
    selectedCandidateId,
    gateRationale,
    limitations,
  };
};

export function assertValidBakeoffRunRecord(
  value: unknown,
): asserts value is BakeoffRunRecord {
  assertRecordShape(value);
}

const artifactAbsolutePath = async (
  repositoryRoot: string,
  artifactPath: string,
  path: string,
): Promise<string> => {
  const artifactDirectory = resolve(repositoryRoot, ARTIFACT_DIRECTORY);
  const artifactDirectoryInfo = await lstat(artifactDirectory).catch(() => null);
  ensure(artifactDirectoryInfo?.isDirectory() === true && !artifactDirectoryInfo.isSymbolicLink(), path, "artifact directory must be a real directory");
  const absolutePath = resolve(repositoryRoot, artifactPath);
  ensure(isInside(artifactDirectory, absolutePath), path, "artifact path escaped the bakeoff directory");
  const fileInfo = await lstat(absolutePath).catch(() => null);
  ensure(fileInfo?.isFile() === true && !fileInfo.isSymbolicLink(), path, "artifact must be a regular non-symlink file");
  const canonicalDirectory = await realpath(artifactDirectory).catch(() => null);
  const canonicalFile = await realpath(absolutePath).catch(() => null);
  ensure(canonicalDirectory !== null && canonicalFile !== null, path, "artifact path could not be resolved");
  ensure(isInside(canonicalDirectory, canonicalFile), path, "artifact path escaped the bakeoff directory");
  return canonicalFile;
};

const validateArtifactHash = async (
  repositoryRoot: string,
  artifact: ArtifactRef,
  path: string,
): Promise<void> => {
  const absolutePath = await artifactAbsolutePath(repositoryRoot, artifact.path, path);
  const bytes = await readFile(absolutePath).catch(() => null);
  ensure(bytes !== null, path, "artifact could not be read");
  const actualHash = createHash("sha256").update(bytes).digest("hex");
  ensure(actualHash === artifact.sha256, `${path}.sha256`, "does not match the referenced artifact");
};

export async function validateBakeoffRunRecord(
  value: unknown,
  options: ValidationOptions = {},
): Promise<BakeoffRunRecord> {
  const record = assertRecordShape(value);
  const repositoryRoot = resolve(options.repositoryRoot ?? process.cwd());
  for (const [index, candidate] of record.candidates.entries()) {
    const candidatePath = `$.candidates[${index}]`;
    await validateArtifactHash(repositoryRoot, candidate.canonicalArtifact, `${candidatePath}.canonicalArtifact`);
    await validateArtifactHash(repositoryRoot, candidate.googleDocsRoundtrip.resultArtifact, `${candidatePath}.googleDocsRoundtrip.resultArtifact`);
    if (candidate.googleDocsCopyPlainText.resultArtifact !== null) {
      await validateArtifactHash(repositoryRoot, candidate.googleDocsCopyPlainText.resultArtifact, `${candidatePath}.googleDocsCopyPlainText.resultArtifact`);
    }
  }
  return record;
}

const runAsCli = process.argv[1]?.endsWith(
  "/scripts/validate-docx-alternative-carrier-run.ts",
);

const main = async (): Promise<void> => {
  ensure(process.argv.length === 2, "$", FAILURE_USAGE);
  const runPath = resolve(
    process.cwd(),
    "research/experiments/docx-alternative-carrier-bakeoff-v1/run-001.json",
  );
  let recordText: string;
  try {
    recordText = await readFile(runPath, "utf8");
  } catch {
    throw new Error("Unable to read the bakeoff run record.");
  }
  let value: unknown;
  try {
    value = JSON.parse(recordText) as unknown;
  } catch {
    throw new Error("The bakeoff run record is not valid JSON.");
  }
  const record = await validateBakeoffRunRecord(value);
  process.stdout.write(
    `${JSON.stringify({
      status: "valid",
      gateDecision: record.gateDecision,
      selectedCandidateId: record.selectedCandidateId,
    })}\n`,
  );
};

if (runAsCli) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Unable to validate the bakeoff run record.");
    process.exitCode = 1;
  });
}
