import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import {
  QUALIFICATION_CASE_IDS,
  QUALIFICATION_MUTATION_TARGETS,
  type QualificationCaseId,
  type QualificationCheckpointId,
  type QualificationMutationTarget,
} from "../research/experiments/docx-join-control-accessibility-qualification-v1/fixture.ts";
import {
  inspectJoinControlQualificationDocx,
  type JoinControlQualificationDocxInspection,
} from "../research/experiments/docx-join-control-accessibility-qualification-v1/inspect-qualification-docx.ts";
import {
  inspectJoinControlQualificationText,
  type JoinControlQualificationTextInspection,
} from "../research/experiments/docx-join-control-accessibility-qualification-v1/inspect-qualification-text.ts";
import {
  inspectJoinControlQualificationPdf,
  type QualificationPdfInspection,
  validateQualificationPdfInspection,
} from "./inspect-pdf-join-control-qualification.ts";
import {
  CANDIDATE_ID,
  DOCUMENT_PROFILE,
  JOIN_CONTROL_QUALIFICATION_ARTIFACT_ROOT,
  QUALIFICATION_PROFILE,
  repositoryRootFor,
  sha256,
} from "./lib/join-control-qualification-command.ts";
import { readRepositoryRegularFile } from "./lib/research-artifact-io.ts";

export const QUALIFICATION_FAILURE_CODES = [
  "canonical-structure-failed",
  "source-frame-failed",
  "source-anchor-failed",
  "transformed-frame-failed",
  "transformed-anchor-failed",
  "visible-text-mismatch",
  "carrier-presented",
  "shaping-mismatch",
  "grapheme-mismatch",
  "bidi-order-mismatch",
  "layout-mismatch",
  "navigation-mismatch",
  "search-mismatch",
  "spellcheck-mismatch",
  "clipboard-mismatch",
  "insert-visible-mismatch",
  "insert-frame-mismatch",
  "undo-redo-mismatch",
  "backspace-visible-mismatch",
  "backspace-frame-mismatch",
  "forward-delete-visible-mismatch",
  "forward-delete-frame-mismatch",
  "print-preview-mismatch",
  "pdf-encrypted",
  "pdf-page-count-mismatch",
  "pdf-text-order-mismatch",
  "pdf-placeholder-present",
  "pdf-render-failed",
  "pdf-render-mismatch",
  "pdf-unsafe-content",
  "specialized-view-decoded-payload",
  "specialized-view-navigation-trap",
  "specialized-view-residual-layout",
  "hidden-property-present",
  "unexpected-default-ignorable",
  "normalization-mismatch",
  "segmentation-mismatch",
  "package-unsafe",
  "relationship-unsafe",
  "macro-or-active-content",
  "metadata-privacy-unresolved",
  "nvda-spoken-text-mismatch",
  "nvda-reading-order-mismatch",
  "nvda-extra-announcement",
  "nvda-join-control-announcement",
  "nvda-navigation-mismatch",
  "nvda-navigation-trap",
  "nvda-selection-feedback-mismatch",
  "nvda-editing-feedback-mismatch",
  "nvda-speech-viewer-mismatch",
] as const;

export type QualificationFailureCode =
  (typeof QUALIFICATION_FAILURE_CODES)[number];

export type QualificationGate = Readonly<{
  failureCodes: readonly QualificationFailureCode[];
  decision: "QUALIFY_PROFILE" | "REJECT_PROFILE";
  rationale:
    | "all-mandatory-criteria-passed"
    | "mandatory-criteria-failed";
}>;

export const deriveJoinControlQualificationGate = (
  failureCodes: readonly QualificationFailureCode[],
): QualificationGate => {
  const present = new Set(failureCodes);
  const ordered = QUALIFICATION_FAILURE_CODES.filter((code) => present.has(code));
  return ordered.length === 0
    ? {
        failureCodes: ordered,
        decision: "QUALIFY_PROFILE",
        rationale: "all-mandatory-criteria-passed",
      }
    : {
        failureCodes: ordered,
        decision: "REJECT_PROFILE",
        rationale: "mandatory-criteria-failed",
      };
};

export const REQUIRED_QUALIFICATION_LIMITATIONS = [
  "tested-configurations-only",
  "voiceover-not-assessed",
  "other-screen-readers-not-assessed",
  "no-universal-accessibility-claim",
  "no-production-readiness-claim",
  "no-pilot-readiness-claim",
  "no-ai-ingestion-claim",
  "no-model-compliance-claim",
  "no-authorship-claim",
  "no-prompt-reuse-claim",
  "no-intent-claim",
  "no-cheating-claim",
  "no-misconduct-claim",
] as const;

export const QUALIFICATION_DEVIATIONS = [
  "docx-core-metadata-redacted",
  "pdf-metadata-redacted",
  "accessibility-assistant-unavailable",
] as const;

const CONDITIONAL_LIMITATIONS = [
  "docx-core-metadata-requires-privacy-review",
  "pdf-metadata-requires-privacy-review",
] as const;
const EDITOR_IDS = ["google-docs", "microsoft-word"] as const;
const OPERATIONS = ["insert", "backspace", "forward-delete"] as const;
const METADATA_CLASSIFICATIONS = [
  "absent",
  "empty",
  "synthetic_expected",
  "non_synthetic_redacted",
] as const;
const HASH_PATTERN = /^[a-f0-9]{64}$/;
const GIT_REVISION_PATTERN = /^[a-f0-9]{40}$/;
const NUMERIC_VERSION_PATTERN = /^\d{1,6}(?:\.\d{1,6}){0,4}$/;
const MACOS_VERSION_PATTERN =
  /^\d{1,3}(?:\.\d{1,3}){1,3}(?: \(\d{2}[A-Z]\d{1,6}[a-z]?\))?$/;
const OFFICE_VERSION_PATTERN =
  /^\d{1,6}(?:\.\d{1,6}){0,4}(?: \(\d{6,12}\))?$/;
const WINDOWS_VERSION_PATTERN =
  /^(?:\d{2}H[12]|\d{1,6}(?:\.\d{1,6}){0,4})(?: \(\d{4,6}(?:\.\d{1,6}){0,3}\))?$/;
const FORBIDDEN_VALUE_PATTERN =
  /(?:BEGIN [A-Z ]*PRIVATE KEY|\bBearer\s+\S+|\b(?:sk|rk|pk|ghp|github_pat|xox[abprs])[-_][A-Za-z0-9_-]+)/i;
const RUN_RECORD_PATH =
  "research/experiments/docx-join-control-accessibility-qualification-v1/run-001.json";
const PROTOCOL_PATH =
  "research/experiments/docx-join-control-accessibility-qualification-v1/protocol.md";
const FIXTURE_PATH =
  "research/experiments/docx-join-control-accessibility-qualification-v1/fixture.ts";
const GENERATOR_PATH =
  "src/documents/docx/docx-join-control-accessibility-qualification-v1.ts";
const VALIDATOR_PATH = "scripts/validate-docx-join-control-qualification-run.ts";
const QUALIFICATION_BEHAVIOR_PATHS = [
  PROTOCOL_PATH,
  FIXTURE_PATH,
  "research/experiments/docx-join-control-accessibility-qualification-v1/inspect-qualification-docx.ts",
  "research/experiments/docx-join-control-accessibility-qualification-v1/inspect-qualification-text.ts",
  "research/experiments/docx-join-control-accessibility-qualification-v1/inspect-qualification-pdf.py",
  GENERATOR_PATH,
  "scripts/generate-docx-join-control-qualification.ts",
  "scripts/inspect-docx-join-control-qualification.ts",
  "scripts/inspect-text-join-control-qualification.ts",
  "scripts/inspect-pdf-join-control-qualification.ts",
  "scripts/render-pdf-join-control-qualification.ts",
  "scripts/lib/join-control-qualification-command.ts",
  "scripts/lib/research-artifact-io.ts",
  VALIDATOR_PATH,
  "research/experiments/docx-zero-width-carrier-bakeoff-v1/frame.ts",
  "research/experiments/docx-zero-width-carrier-bakeoff-v1/fixture.ts",
  "research/experiments/docx-zero-width-carrier-bakeoff-v1/inspect-zero-width-docx.ts",
  "research/experiments/docx-hidden-run-v1/fixture.ts",
  "package.json",
  "pnpm-lock.yaml",
] as const;
const execFileAsync = promisify(execFile);

type MetadataClassification = (typeof METADATA_CLASSIFICATIONS)[number];
type ProtocolDeviationCode = (typeof QUALIFICATION_DEVIATIONS)[number];
type LimitationCode =
  | (typeof REQUIRED_QUALIFICATION_LIMITATIONS)[number]
  | (typeof CONDITIONAL_LIMITATIONS)[number];

export type DocxArtifactEvidence = Readonly<{
  path: string;
  sha256: string;
  sourceCanonicalSha256: string;
  inspection: JoinControlQualificationDocxInspection;
}>;

export type TextArtifactEvidence = Readonly<{
  path: string;
  sha256: string;
  sourceCanonicalSha256: string;
  inspection: JoinControlQualificationTextInspection;
}>;

export type PdfArtifactEvidence = Readonly<{
  path: string;
  sha256: string;
  sourceCanonicalSha256: string;
  inspection: QualificationPdfInspection;
  rendererVersion: "26.05.0";
  render: "rendered-one-page" | "failed" | "not-run-encrypted";
  visualPage:
    | "parity"
    | "mismatch"
    | "not-observed-render-failed"
    | "not-observed-encrypted";
  visualLayout:
    | "parity"
    | "mismatch"
    | "not-observed-render-failed"
    | "not-observed-encrypted";
  visualTextOrder:
    | "parity"
    | "mismatch"
    | "not-observed-render-failed"
    | "not-observed-encrypted";
  visualPlaceholder:
    | "absent"
    | "present"
    | "not-observed-render-failed"
    | "not-observed-encrypted";
}>;

export type MutationEvidence = Readonly<{
  target: QualificationMutationTarget;
  operation: (typeof OPERATIONS)[number];
  result: DocxArtifactEvidence;
  restored: DocxArtifactEvidence;
  visibleConsequence: "expected" | "mismatch";
  frameConsequence: "exact" | "mismatch";
}>;

type MutationEvidenceTuple = readonly [
  MutationEvidence,
  MutationEvidence,
  MutationEvidence,
  MutationEvidence,
  MutationEvidence,
  MutationEvidence,
  MutationEvidence,
  MutationEvidence,
  MutationEvidence,
  MutationEvidence,
  MutationEvidence,
  MutationEvidence,
];

export type EditorEvidence = Readonly<{
  editorId: (typeof EDITOR_IDS)[number];
  sourceCanonicalSha256: string;
  roundtrip: DocxArtifactEvidence;
  mutations: MutationEvidenceTuple;
  clipboard: TextArtifactEvidence;
  pdf: PdfArtifactEvidence;
  primary: Readonly<{
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
  spellcheck: Readonly<{
    pairFindings: "same" | "different";
    pairSuggestionPresence: "same" | "different";
    latinBetaMisspelling: "same" | "different" | "not-applicable";
  }>;
  specializedView: Readonly<{
    presentation: "none" | "generic-indicator-only" | "decoded-payload";
    navigation: "parity" | "trap";
    residualLayout: "none" | "present";
  }>;
  printPreview: "parity" | "mismatch";
  accessibilityAssistant:
    | "no-carrier-finding"
    | "carrier-related-finding"
    | "unavailable"
    | "not-applicable";
  nvda: Readonly<{
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
}>;

export type WindowsNvdaEnvironment = Readonly<{
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

export type CaseEvidence = Readonly<{
  caseId: QualificationCaseId;
  canonical: DocxArtifactEvidence;
  editors: readonly [EditorEvidence, EditorEvidence];
}>;

export type QualificationRunRecord = Readonly<{
  schemaVersion: 1;
  experimentId: "glyph-exp-docx-zero-width-join-control-qualification-v1-001";
  qualificationProfile: "docx-zero-width-join-control-qualification-v1";
  candidateId: "join-control-binary-v1";
  documentProfile: "docx-zero-width-join-control-v1";
  implementation: Readonly<{
    gitRevision: string;
    protocolPath: typeof PROTOCOL_PATH;
    protocolSha256: string;
    fixturePath: typeof FIXTURE_PATH;
    fixtureSha256: string;
    generatorPath: typeof GENERATOR_PATH;
    generatorSha256: string;
    validatorPath: typeof VALIDATOR_PATH;
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
  environments: Readonly<{
    macos: Readonly<{
      macosVersion: string;
      chromeVersion: string;
      googleDocsVersion: "not-exposed";
      wordForMacVersion: string;
    }>;
    windowsNvda: WindowsNvdaEnvironment;
  }>;
  cases: readonly [CaseEvidence, CaseEvidence, CaseEvidence, CaseEvidence];
  deviations: readonly ProtocolDeviationCode[];
  limitations: readonly LimitationCode[];
  gate: QualificationGate;
}>;

type UnknownRecord = Record<string, unknown>;

function ensure(
  condition: unknown,
  path: string,
  message: string,
): asserts condition {
  assert.ok(condition, `${path}: ${message}`);
}

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const exactObject = (
  value: unknown,
  keys: readonly string[],
  path: string,
): UnknownRecord => {
  ensure(isRecord(value), path, "expected an object");
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  ensure(
    actual.length === expected.length &&
      actual.every((key, index) => key === expected[index]),
    path,
    "unexpected or missing fields",
  );
  return value;
};

const arrayAt = (value: unknown, path: string): unknown[] => {
  ensure(Array.isArray(value), path, "expected an array");
  return value;
};

const enumAt = <T extends string>(
  value: unknown,
  allowed: readonly T[],
  path: string,
): T => {
  ensure(
    typeof value === "string" && allowed.includes(value as T),
    path,
    "unexpected enum value",
  );
  return value as T;
};

const exactValue = <T>(value: unknown, expected: T, path: string): T => {
  ensure(value === expected, path, "does not match the frozen value");
  return expected;
};

const safeVersion = (
  value: unknown,
  path: string,
  pattern: RegExp = NUMERIC_VERSION_PATTERN,
): string => {
  ensure(
    typeof value === "string" &&
      pattern.test(value) &&
      !FORBIDDEN_VALUE_PATTERN.test(value),
    path,
    "expected a safe version string",
  );
  return value;
};

const hashAt = (value: unknown, path: string): string => {
  ensure(
    typeof value === "string" && HASH_PATTERN.test(value),
    path,
    "expected a lowercase SHA-256 hash",
  );
  return value;
};

const integerAt = (value: unknown, path: string, minimum = 0): number => {
  ensure(
    typeof value === "number" && Number.isInteger(value) && value >= minimum,
    path,
    "expected an integer",
  );
  return value;
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

const assertOrderedUniqueCodes = (
  value: unknown,
  path: string,
): QualificationFailureCode[] => {
  const codes = arrayAt(value, path).map((entry, index) =>
    enumAt(entry, QUALIFICATION_FAILURE_CODES, `${path}[${index}]`),
  );
  ensure(
    sameValue(
      codes,
      QUALIFICATION_FAILURE_CODES.filter((code) => codes.includes(code)),
    ),
    path,
    "failure codes must be unique and protocol-ordered",
  );
  return codes;
};

const assertMetadata = (
  value: unknown,
  keys: readonly string[],
  path: string,
): Record<string, MetadataClassification> => {
  const object = exactObject(value, keys, path);
  return Object.fromEntries(
    keys.map((key) => [
      key,
      enumAt(object[key], METADATA_CLASSIFICATIONS, `${path}.${key}`),
    ]),
  );
};

const assertSegmentation = (value: unknown, path: string): void => {
  const rows = arrayAt(value, path);
  ensure(rows.length === 4, path, "expected four segmentation rows");
  rows.forEach((entry, index) => {
    const row = exactObject(
      entry,
      ["rowIndex", "locale", "graphemeCount", "wordLikeCount", "paragraphCount"],
      `${path}[${index}]`,
    );
    exactValue(row.rowIndex, index, `${path}[${index}].rowIndex`);
    enumAt(
      row.locale,
      ["en-US", "ar-SA", "fa-IR", "hi-IN"] as const,
      `${path}[${index}].locale`,
    );
    integerAt(row.graphemeCount, `${path}[${index}].graphemeCount`);
    integerAt(row.wordLikeCount, `${path}[${index}].wordLikeCount`);
    exactValue(row.paragraphCount, 1, `${path}[${index}].paragraphCount`);
  });
};

const assertOccurrence = (value: unknown, path: string): void => {
  const occurrence = exactObject(
    value,
    [
      "markerId",
      "checksumValid",
      "context",
      "part",
      "paragraphIndex",
      "runIndices",
      "startCodePointIndex",
      "codePointCount",
      "anchor",
      "finding",
    ],
    path,
  );
  if (occurrence.markerId !== null) {
    enumAt(occurrence.markerId, ["alpha", "beta"] as const, `${path}.markerId`);
  }
  ensure(typeof occurrence.checksumValid === "boolean", `${path}.checksumValid`, "expected a boolean");
  enumAt(occurrence.context, ["ordinary-body", "non-ordinary"] as const, `${path}.context`);
  enumAt(occurrence.part, ["word/document.xml", "other-redacted"] as const, `${path}.part`);
  integerAt(occurrence.paragraphIndex, `${path}.paragraphIndex`, -1);
  arrayAt(occurrence.runIndices, `${path}.runIndices`).forEach((entry, index) =>
    integerAt(entry, `${path}.runIndices[${index}]`, -1),
  );
  integerAt(occurrence.startCodePointIndex, `${path}.startCodePointIndex`);
  integerAt(occurrence.codePointCount, `${path}.codePointCount`);
  enumAt(
    occurrence.anchor,
    ["expected", "operation-expected", "unexpected"] as const,
    `${path}.anchor`,
  );
  enumAt(
    occurrence.finding,
    ["none", "damaged", "duplicate", "moved", "mixed"] as const,
    `${path}.finding`,
  );
};

const DOCX_INSPECTION_KEYS = [
  "mode",
  "caseId",
  "checkpointId",
  "frameState",
  "occurrences",
  "visibleTextState",
  "hiddenPropertyState",
  "defaultIgnorableState",
  "nfcState",
  "nfkcState",
  "segmentationState",
  "segmentation",
  "nodeVersion",
  "icuVersion",
  "unicodeVersion",
  "packageSafetyState",
  "relationshipSafetyState",
  "macroOrActiveContent",
  "coreMetadata",
  "findings",
] as const;

const assertDocxInspection = (
  value: unknown,
  caseId: QualificationCaseId,
  checkpointId: QualificationCheckpointId,
  mode: "source" | "transformed",
  path: string,
): JoinControlQualificationDocxInspection => {
  const inspection = exactObject(value, DOCX_INSPECTION_KEYS, path);
  exactValue(inspection.mode, mode, `${path}.mode`);
  exactValue(inspection.caseId, caseId, `${path}.caseId`);
  exactValue(inspection.checkpointId, checkpointId, `${path}.checkpointId`);
  enumAt(
    inspection.frameState,
    ["exact", "missing", "damaged", "duplicate", "moved", "mixed"] as const,
    `${path}.frameState`,
  );
  arrayAt(inspection.occurrences, `${path}.occurrences`).forEach((entry, index) =>
    assertOccurrence(entry, `${path}.occurrences[${index}]`),
  );
  enumAt(inspection.visibleTextState, ["exact", "mismatch"] as const, `${path}.visibleTextState`);
  enumAt(inspection.hiddenPropertyState, ["absent", "present", "unresolved"] as const, `${path}.hiddenPropertyState`);
  enumAt(inspection.defaultIgnorableState, ["allowlisted-only", "unexpected"] as const, `${path}.defaultIgnorableState`);
  enumAt(inspection.nfcState, ["stable", "mismatch"] as const, `${path}.nfcState`);
  enumAt(inspection.nfkcState, ["stable", "mismatch"] as const, `${path}.nfkcState`);
  enumAt(inspection.segmentationState, ["expected", "mismatch"] as const, `${path}.segmentationState`);
  assertSegmentation(inspection.segmentation, `${path}.segmentation`);
  safeVersion(inspection.nodeVersion, `${path}.nodeVersion`);
  safeVersion(inspection.icuVersion, `${path}.icuVersion`);
  safeVersion(inspection.unicodeVersion, `${path}.unicodeVersion`);
  enumAt(inspection.packageSafetyState, ["safe", "unsafe"] as const, `${path}.packageSafetyState`);
  enumAt(inspection.relationshipSafetyState, ["safe", "unsafe"] as const, `${path}.relationshipSafetyState`);
  enumAt(inspection.macroOrActiveContent, ["absent", "present"] as const, `${path}.macroOrActiveContent`);
  assertMetadata(
    inspection.coreMetadata,
    ["creator", "lastModifiedBy", "otherCore"],
    `${path}.coreMetadata`,
  );
  assertOrderedUniqueCodes(inspection.findings, `${path}.findings`);
  return value as JoinControlQualificationDocxInspection;
};

const TEXT_INSPECTION_KEYS = [
  "caseId",
  "checkpointId",
  "lineEndings",
  "frameState",
  "visibleTextState",
  "defaultIgnorableState",
  "nfcState",
  "nfkcState",
  "segmentationState",
  "segmentation",
  "nodeVersion",
  "icuVersion",
  "unicodeVersion",
  "findings",
] as const;

const assertTextInspection = (
  value: unknown,
  caseId: QualificationCaseId,
  path: string,
): JoinControlQualificationTextInspection => {
  const inspection = exactObject(value, TEXT_INSPECTION_KEYS, path);
  exactValue(inspection.caseId, caseId, `${path}.caseId`);
  exactValue(inspection.checkpointId, "roundtrip", `${path}.checkpointId`);
  enumAt(inspection.lineEndings, ["lf", "crlf"] as const, `${path}.lineEndings`);
  enumAt(inspection.frameState, ["exact", "missing", "damaged", "duplicate", "moved", "mixed"] as const, `${path}.frameState`);
  enumAt(inspection.visibleTextState, ["exact", "mismatch"] as const, `${path}.visibleTextState`);
  enumAt(inspection.defaultIgnorableState, ["allowlisted-only", "unexpected"] as const, `${path}.defaultIgnorableState`);
  enumAt(inspection.nfcState, ["stable", "mismatch"] as const, `${path}.nfcState`);
  enumAt(inspection.nfkcState, ["stable", "mismatch"] as const, `${path}.nfkcState`);
  enumAt(inspection.segmentationState, ["expected", "mismatch"] as const, `${path}.segmentationState`);
  assertSegmentation(inspection.segmentation, `${path}.segmentation`);
  safeVersion(inspection.nodeVersion, `${path}.nodeVersion`);
  safeVersion(inspection.icuVersion, `${path}.icuVersion`);
  safeVersion(inspection.unicodeVersion, `${path}.unicodeVersion`);
  assertOrderedUniqueCodes(inspection.findings, `${path}.findings`);
  return value as JoinControlQualificationTextInspection;
};

const artifactPath = (
  caseId: QualificationCaseId,
  editorId: (typeof EDITOR_IDS)[number] | null,
  suffix: string,
): string =>
  editorId === null
    ? `${JOIN_CONTROL_QUALIFICATION_ARTIFACT_ROOT}/${caseId}.docx`
    : `${JOIN_CONTROL_QUALIFICATION_ARTIFACT_ROOT}/${caseId}-${editorId}-${suffix}`;

const assertArtifactPath = (
  value: unknown,
  expected: string,
  path: string,
): string => {
  exactValue(value, expected, path);
  ensure(
    expected.startsWith(`${JOIN_CONTROL_QUALIFICATION_ARTIFACT_ROOT}/`) &&
      !expected.includes("\\") &&
      !expected.split("/").includes("..") &&
      !expected.includes("\0"),
    path,
    "artifact path escaped the qualification root",
  );
  return expected;
};

const assertDocxArtifact = (
  value: unknown,
  caseId: QualificationCaseId,
  checkpointId: QualificationCheckpointId,
  mode: "source" | "transformed",
  expectedPath: string,
  canonicalSha256: string | null,
  path: string,
): DocxArtifactEvidence => {
  const artifact = exactObject(
    value,
    ["path", "sha256", "sourceCanonicalSha256", "inspection"],
    path,
  );
  assertArtifactPath(artifact.path, expectedPath, `${path}.path`);
  const artifactHash = hashAt(artifact.sha256, `${path}.sha256`);
  const sourceHash = hashAt(
    artifact.sourceCanonicalSha256,
    `${path}.sourceCanonicalSha256`,
  );
  ensure(
    sourceHash === (canonicalSha256 ?? artifactHash),
    `${path}.sourceCanonicalSha256`,
    "does not match canonical lineage",
  );
  assertDocxInspection(
    artifact.inspection,
    caseId,
    checkpointId,
    mode,
    `${path}.inspection`,
  );
  return value as DocxArtifactEvidence;
};

const assertTextArtifact = (
  value: unknown,
  caseId: QualificationCaseId,
  editorId: (typeof EDITOR_IDS)[number],
  canonicalSha256: string,
  path: string,
): TextArtifactEvidence => {
  const artifact = exactObject(
    value,
    ["path", "sha256", "sourceCanonicalSha256", "inspection"],
    path,
  );
  assertArtifactPath(
    artifact.path,
    artifactPath(caseId, editorId, "copy-plain-text.txt"),
    `${path}.path`,
  );
  hashAt(artifact.sha256, `${path}.sha256`);
  exactValue(
    artifact.sourceCanonicalSha256,
    canonicalSha256,
    `${path}.sourceCanonicalSha256`,
  );
  assertTextInspection(artifact.inspection, caseId, `${path}.inspection`);
  return value as TextArtifactEvidence;
};

const assertPdfArtifact = (
  value: unknown,
  caseId: QualificationCaseId,
  editorId: (typeof EDITOR_IDS)[number],
  canonicalSha256: string,
  path: string,
): PdfArtifactEvidence => {
  const artifact = exactObject(
    value,
    [
      "path",
      "sha256",
      "sourceCanonicalSha256",
      "inspection",
      "rendererVersion",
      "render",
      "visualPage",
      "visualLayout",
      "visualTextOrder",
      "visualPlaceholder",
    ],
    path,
  );
  assertArtifactPath(
    artifact.path,
    artifactPath(caseId, editorId, "print.pdf"),
    `${path}.path`,
  );
  hashAt(artifact.sha256, `${path}.sha256`);
  exactValue(
    artifact.sourceCanonicalSha256,
    canonicalSha256,
    `${path}.sourceCanonicalSha256`,
  );
  const inspection = validateQualificationPdfInspection(
    artifact.inspection,
    caseId,
  );
  exactValue(artifact.rendererVersion, "26.05.0", `${path}.rendererVersion`);
  const render = enumAt(
    artifact.render,
    ["rendered-one-page", "failed", "not-run-encrypted"] as const,
    `${path}.render`,
  );
  const visual = [
    ["visualPage", artifact.visualPage, ["parity", "mismatch"]],
    ["visualLayout", artifact.visualLayout, ["parity", "mismatch"]],
    ["visualTextOrder", artifact.visualTextOrder, ["parity", "mismatch"]],
    ["visualPlaceholder", artifact.visualPlaceholder, ["absent", "present"]],
  ] as const;
  if (inspection.encrypted) {
    exactValue(render, "not-run-encrypted", `${path}.render`);
    visual.forEach(([key, entry]) =>
      exactValue(entry, "not-observed-encrypted", `${path}.${key}`),
    );
  } else if (render === "failed") {
    visual.forEach(([key, entry]) =>
      exactValue(entry, "not-observed-render-failed", `${path}.${key}`),
    );
  } else {
    exactValue(render, "rendered-one-page", `${path}.render`);
    visual.forEach(([key, entry, allowed]) =>
      enumAt(entry, allowed, `${path}.${key}`),
    );
  }
  return value as PdfArtifactEvidence;
};

const mutationCheckpoint = (
  target: QualificationMutationTarget,
  operation: (typeof OPERATIONS)[number],
  kind: "result" | "restored",
): QualificationCheckpointId => {
  const suffix =
    operation === "insert"
      ? kind === "result"
        ? "insert-redone"
        : "insert-restored"
      : operation === "backspace"
        ? kind === "result"
          ? "backspace-result"
          : "backspace-restored"
        : kind === "result"
          ? "forward-delete-result"
          : "forward-delete-restored";
  return `${target}-${suffix}` as QualificationCheckpointId;
};

const assertMutation = (
  value: unknown,
  caseId: QualificationCaseId,
  editorId: (typeof EDITOR_IDS)[number],
  target: QualificationMutationTarget,
  operation: (typeof OPERATIONS)[number],
  canonicalSha256: string,
  path: string,
): MutationEvidence => {
  const mutation = exactObject(
    value,
    [
      "target",
      "operation",
      "result",
      "restored",
      "visibleConsequence",
      "frameConsequence",
    ],
    path,
  );
  exactValue(mutation.target, target, `${path}.target`);
  exactValue(mutation.operation, operation, `${path}.operation`);
  const resultCheckpoint = mutationCheckpoint(target, operation, "result");
  const restoredCheckpoint = mutationCheckpoint(target, operation, "restored");
  assertDocxArtifact(
    mutation.result,
    caseId,
    resultCheckpoint,
    "transformed",
    artifactPath(caseId, editorId, `${resultCheckpoint}.docx`),
    canonicalSha256,
    `${path}.result`,
  );
  assertDocxArtifact(
    mutation.restored,
    caseId,
    restoredCheckpoint,
    "transformed",
    artifactPath(caseId, editorId, `${restoredCheckpoint}.docx`),
    canonicalSha256,
    `${path}.restored`,
  );
  enumAt(mutation.visibleConsequence, ["expected", "mismatch"] as const, `${path}.visibleConsequence`);
  enumAt(mutation.frameConsequence, ["exact", "mismatch"] as const, `${path}.frameConsequence`);
  return value as MutationEvidence;
};

const assertPrimary = (value: unknown, path: string): void => {
  const primary = exactObject(
    value,
    [
      "visibleText",
      "shaping",
      "graphemes",
      "carrierPresentation",
      "layout",
      "bidiOrder",
      "navigation",
      "search",
      "clipboardSelection",
      "selectionPresentation",
    ],
    path,
  );
  for (const key of ["visibleText", "shaping", "graphemes", "layout", "bidiOrder", "navigation"] as const) {
    enumAt(primary[key], ["parity", "mismatch"] as const, `${path}.${key}`);
  }
  enumAt(primary.carrierPresentation, ["absent", "present"] as const, `${path}.carrierPresentation`);
  enumAt(primary.search, ["both-rows-found", "mismatch"] as const, `${path}.search`);
  enumAt(primary.clipboardSelection, ["body-only", "mismatch"] as const, `${path}.clipboardSelection`);
  enumAt(primary.selectionPresentation, ["absent", "present"] as const, `${path}.selectionPresentation`);
};

const assertNvda = (value: unknown, path: string): void => {
  const nvda = exactObject(
    value,
    [
      "spokenText",
      "readingOrder",
      "extraAnnouncements",
      "joinControlAnnouncement",
      "navigation",
      "navigationTrap",
      "selectionFeedback",
      "editingFeedback",
      "speechViewer",
    ],
    path,
  );
  for (const key of ["spokenText", "readingOrder", "navigation", "selectionFeedback", "editingFeedback", "speechViewer"] as const) {
    enumAt(nvda[key], ["parity", "mismatch"] as const, `${path}.${key}`);
  }
  enumAt(nvda.extraAnnouncements, ["none", "present"] as const, `${path}.extraAnnouncements`);
  enumAt(nvda.joinControlAnnouncement, ["absent", "present"] as const, `${path}.joinControlAnnouncement`);
  enumAt(nvda.navigationTrap, ["absent", "present"] as const, `${path}.navigationTrap`);
};

const assertEditor = (
  value: unknown,
  caseId: QualificationCaseId,
  editorId: (typeof EDITOR_IDS)[number],
  canonicalSha256: string,
  path: string,
): EditorEvidence => {
  const editor = exactObject(
    value,
    [
      "editorId",
      "sourceCanonicalSha256",
      "roundtrip",
      "mutations",
      "clipboard",
      "pdf",
      "primary",
      "spellcheck",
      "specializedView",
      "printPreview",
      "accessibilityAssistant",
      "nvda",
    ],
    path,
  );
  exactValue(editor.editorId, editorId, `${path}.editorId`);
  exactValue(
    editor.sourceCanonicalSha256,
    canonicalSha256,
    `${path}.sourceCanonicalSha256`,
  );
  assertDocxArtifact(
    editor.roundtrip,
    caseId,
    "roundtrip",
    "transformed",
    artifactPath(caseId, editorId, "roundtrip.docx"),
    canonicalSha256,
    `${path}.roundtrip`,
  );
  const mutations = arrayAt(editor.mutations, `${path}.mutations`);
  ensure(mutations.length === 12, `${path}.mutations`, "expected twelve ordered mutations");
  let mutationIndex = 0;
  for (const operation of OPERATIONS) {
    for (const target of QUALIFICATION_MUTATION_TARGETS) {
      assertMutation(
        mutations[mutationIndex],
        caseId,
        editorId,
        target,
        operation,
        canonicalSha256,
        `${path}.mutations[${mutationIndex}]`,
      );
      mutationIndex += 1;
    }
  }
  assertTextArtifact(
    editor.clipboard,
    caseId,
    editorId,
    canonicalSha256,
    `${path}.clipboard`,
  );
  assertPdfArtifact(editor.pdf, caseId, editorId, canonicalSha256, `${path}.pdf`);
  assertPrimary(editor.primary, `${path}.primary`);
  const spellcheck = exactObject(
    editor.spellcheck,
    ["pairFindings", "pairSuggestionPresence", "latinBetaMisspelling"],
    `${path}.spellcheck`,
  );
  enumAt(spellcheck.pairFindings, ["same", "different"] as const, `${path}.spellcheck.pairFindings`);
  enumAt(spellcheck.pairSuggestionPresence, ["same", "different"] as const, `${path}.spellcheck.pairSuggestionPresence`);
  if (caseId === "latin-operations-v1") {
    enumAt(
      spellcheck.latinBetaMisspelling,
      ["same", "different"] as const,
      `${path}.spellcheck.latinBetaMisspelling`,
    );
  } else {
    exactValue(
      spellcheck.latinBetaMisspelling,
      "not-applicable",
      `${path}.spellcheck.latinBetaMisspelling`,
    );
  }
  const specialized = exactObject(
    editor.specializedView,
    ["presentation", "navigation", "residualLayout"],
    `${path}.specializedView`,
  );
  enumAt(specialized.presentation, ["none", "generic-indicator-only", "decoded-payload"] as const, `${path}.specializedView.presentation`);
  enumAt(specialized.navigation, ["parity", "trap"] as const, `${path}.specializedView.navigation`);
  enumAt(specialized.residualLayout, ["none", "present"] as const, `${path}.specializedView.residualLayout`);
  enumAt(editor.printPreview, ["parity", "mismatch"] as const, `${path}.printPreview`);
  const assistant = enumAt(
    editor.accessibilityAssistant,
    ["no-carrier-finding", "carrier-related-finding", "unavailable", "not-applicable"] as const,
    `${path}.accessibilityAssistant`,
  );
  if (editorId === "google-docs") {
    exactValue(assistant, "not-applicable", `${path}.accessibilityAssistant`);
  } else {
    ensure(assistant !== "not-applicable", `${path}.accessibilityAssistant`, "Word requires an assessed assistant result or unavailable");
  }
  assertNvda(editor.nvda, `${path}.nvda`);
  return value as EditorEvidence;
};

const assertImplementation = (value: unknown, path: string): void => {
  const implementation = exactObject(
    value,
    [
      "gitRevision",
      "protocolPath",
      "protocolSha256",
      "fixturePath",
      "fixtureSha256",
      "generatorPath",
      "generatorSha256",
      "validatorPath",
      "validatorSha256",
      "nodeVersion",
      "icuVersion",
      "unicodeVersion",
      "uvVersion",
      "pythonVersion",
      "pythonUnicodeVersion",
      "pypdfVersion",
      "pdftoppmVersion",
    ],
    path,
  );
  ensure(
    typeof implementation.gitRevision === "string" &&
      GIT_REVISION_PATTERN.test(implementation.gitRevision),
    `${path}.gitRevision`,
    "expected a lowercase full Git revision",
  );
  exactValue(implementation.protocolPath, PROTOCOL_PATH, `${path}.protocolPath`);
  hashAt(implementation.protocolSha256, `${path}.protocolSha256`);
  exactValue(implementation.fixturePath, FIXTURE_PATH, `${path}.fixturePath`);
  hashAt(implementation.fixtureSha256, `${path}.fixtureSha256`);
  exactValue(implementation.generatorPath, GENERATOR_PATH, `${path}.generatorPath`);
  hashAt(implementation.generatorSha256, `${path}.generatorSha256`);
  exactValue(implementation.validatorPath, VALIDATOR_PATH, `${path}.validatorPath`);
  hashAt(implementation.validatorSha256, `${path}.validatorSha256`);
  safeVersion(implementation.nodeVersion, `${path}.nodeVersion`);
  safeVersion(implementation.icuVersion, `${path}.icuVersion`);
  safeVersion(implementation.unicodeVersion, `${path}.unicodeVersion`);
  exactValue(implementation.uvVersion, "0.12.9", `${path}.uvVersion`);
  exactValue(implementation.pythonVersion, "3.14.7", `${path}.pythonVersion`);
  exactValue(
    implementation.pythonUnicodeVersion,
    "16.0.0",
    `${path}.pythonUnicodeVersion`,
  );
  exactValue(implementation.pypdfVersion, "6.10.0", `${path}.pypdfVersion`);
  exactValue(implementation.pdftoppmVersion, "26.05.0", `${path}.pdftoppmVersion`);
};

const WINDOWS_NVDA_KEYS = [
  "windows11Version",
  "nvdaVersion",
  "espeakNgVersion",
  "chromeVersion",
  "googleDocsVersion",
  "wordMicrosoft365Version",
  "keyboardLayout",
  "settingsProfile",
  "synthesizer",
  "voice",
  "voiceLanguage",
  "variant",
  "rate",
  "pitch",
  "inflection",
  "volume",
  "rateBoost",
  "automaticLanguageSwitching",
  "automaticDialectSwitching",
  "punctuationLevel",
  "speechMode",
  "typedCharacterEcho",
  "typedWordEcho",
  "characterDescriptions",
  "unicodeNormalization",
  "reportNormalized",
  "trustVoiceLanguage",
  "unicodeConsortiumData",
  "reportLanguage",
  "reportSpellingErrors",
  "reportLinks",
  "reportFontStyleFormattingChanges",
  "braille",
  "enabledAddOnCount",
  "googleDocsScreenReaderSupport",
  "googleDocsBrailleSupport",
  "googleDocsCollaboratorAnnouncements",
  "googleDocsMode",
  "wordView",
  "wordTrackChanges",
  "wordShowHide",
  "wordSpecialFormattingDisplay",
] as const;

const assertEnvironments = (value: unknown, path: string): void => {
  const environments = exactObject(value, ["macos", "windowsNvda"], path);
  const macos = exactObject(
    environments.macos,
    ["macosVersion", "chromeVersion", "googleDocsVersion", "wordForMacVersion"],
    `${path}.macos`,
  );
  safeVersion(
    macos.macosVersion,
    `${path}.macos.macosVersion`,
    MACOS_VERSION_PATTERN,
  );
  safeVersion(macos.chromeVersion, `${path}.macos.chromeVersion`);
  exactValue(macos.googleDocsVersion, "not-exposed", `${path}.macos.googleDocsVersion`);
  safeVersion(
    macos.wordForMacVersion,
    `${path}.macos.wordForMacVersion`,
    OFFICE_VERSION_PATTERN,
  );
  const windows = exactObject(environments.windowsNvda, WINDOWS_NVDA_KEYS, `${path}.windowsNvda`);
  safeVersion(
    windows.windows11Version,
    `${path}.windowsNvda.windows11Version`,
    WINDOWS_VERSION_PATTERN,
  );
  safeVersion(windows.espeakNgVersion, `${path}.windowsNvda.espeakNgVersion`);
  safeVersion(windows.chromeVersion, `${path}.windowsNvda.chromeVersion`);
  safeVersion(
    windows.wordMicrosoft365Version,
    `${path}.windowsNvda.wordMicrosoft365Version`,
    OFFICE_VERSION_PATTERN,
  );
  const exactSettings: Readonly<Record<string, string | number | boolean>> = {
    nvdaVersion: "2026.2",
    googleDocsVersion: "not-exposed",
    keyboardLayout: "us-english-desktop",
    settingsProfile: "nvda-join-control-qualification-v1",
    synthesizer: "eSpeak NG",
    voice: "English (America)",
    voiceLanguage: "en-US",
    variant: "none",
    rate: 50,
    pitch: 50,
    inflection: 50,
    volume: 100,
    rateBoost: false,
    automaticLanguageSwitching: true,
    automaticDialectSwitching: false,
    punctuationLevel: "all",
    speechMode: "talk",
    typedCharacterEcho: true,
    typedWordEcho: false,
    characterDescriptions: false,
    unicodeNormalization: true,
    reportNormalized: false,
    trustVoiceLanguage: true,
    unicodeConsortiumData: true,
    reportLanguage: true,
    reportSpellingErrors: true,
    reportLinks: true,
    reportFontStyleFormattingChanges: false,
    braille: false,
    enabledAddOnCount: 0,
    googleDocsScreenReaderSupport: true,
    googleDocsBrailleSupport: false,
    googleDocsCollaboratorAnnouncements: false,
    googleDocsMode: "focus",
    wordView: "print-layout",
    wordTrackChanges: false,
    wordShowHide: false,
    wordSpecialFormattingDisplay: false,
  };
  for (const [key, expected] of Object.entries(exactSettings)) {
    exactValue(windows[key], expected, `${path}.windowsNvda.${key}`);
  }
};

const hasNonSyntheticMetadata = (
  metadata: Record<string, unknown> | string,
): boolean =>
  isRecord(metadata) &&
  Object.values(metadata).includes("non_synthetic_redacted");

const allArtifacts = (record: QualificationRunRecord): readonly (
  | DocxArtifactEvidence
  | TextArtifactEvidence
  | PdfArtifactEvidence
)[] =>
  record.cases.flatMap((caseEvidence) => [
    caseEvidence.canonical,
    ...caseEvidence.editors.flatMap((editor) => [
      editor.roundtrip,
      ...editor.mutations.flatMap((mutation) => [mutation.result, mutation.restored]),
      editor.clipboard,
      editor.pdf,
    ]),
  ]);

export function assertJoinControlQualificationRecordShape(
  value: unknown,
): asserts value is QualificationRunRecord {
  const record = exactObject(
    value,
    [
      "schemaVersion",
      "experimentId",
      "qualificationProfile",
      "candidateId",
      "documentProfile",
      "implementation",
      "environments",
      "cases",
      "deviations",
      "limitations",
      "gate",
    ],
    "$",
  );
  exactValue(record.schemaVersion, 1, "$.schemaVersion");
  exactValue(record.experimentId, "glyph-exp-docx-zero-width-join-control-qualification-v1-001", "$.experimentId");
  exactValue(record.qualificationProfile, QUALIFICATION_PROFILE, "$.qualificationProfile");
  exactValue(record.candidateId, CANDIDATE_ID, "$.candidateId");
  exactValue(record.documentProfile, DOCUMENT_PROFILE, "$.documentProfile");
  assertImplementation(record.implementation, "$.implementation");
  assertEnvironments(record.environments, "$.environments");

  const cases = arrayAt(record.cases, "$.cases");
  ensure(cases.length === 4, "$.cases", "expected four ordered cases");
  cases.forEach((entry, caseIndex) => {
    const caseId = QUALIFICATION_CASE_IDS[caseIndex]!;
    const caseEvidence = exactObject(
      entry,
      ["caseId", "canonical", "editors"],
      `$.cases[${caseIndex}]`,
    );
    exactValue(caseEvidence.caseId, caseId, `$.cases[${caseIndex}].caseId`);
    const canonical = assertDocxArtifact(
      caseEvidence.canonical,
      caseId,
      "canonical",
      "source",
      artifactPath(caseId, null, "canonical"),
      null,
      `$.cases[${caseIndex}].canonical`,
    );
    const editors = arrayAt(caseEvidence.editors, `$.cases[${caseIndex}].editors`);
    ensure(editors.length === 2, `$.cases[${caseIndex}].editors`, "expected Google Docs then Microsoft Word");
    editors.forEach((editor, editorIndex) =>
      assertEditor(
        editor,
        caseId,
        EDITOR_IDS[editorIndex]!,
        canonical.sha256,
        `$.cases[${caseIndex}].editors[${editorIndex}]`,
      ),
    );
  });

  const deviations = arrayAt(record.deviations, "$.deviations").map((entry, index) =>
    enumAt(entry, QUALIFICATION_DEVIATIONS, `$.deviations[${index}]`),
  );
  ensure(
    sameValue(deviations, QUALIFICATION_DEVIATIONS.filter((code) => deviations.includes(code))),
    "$.deviations",
    "deviations must be unique and protocol-ordered",
  );
  const limitations = arrayAt(record.limitations, "$.limitations");
  const limitationCodes = [...REQUIRED_QUALIFICATION_LIMITATIONS, ...CONDITIONAL_LIMITATIONS] as const;
  limitations.forEach((entry, index) =>
    enumAt(entry, limitationCodes, `$.limitations[${index}]`),
  );
  const expectedPrefix = limitations.slice(0, REQUIRED_QUALIFICATION_LIMITATIONS.length);
  ensure(
    sameValue(expectedPrefix, REQUIRED_QUALIFICATION_LIMITATIONS),
    "$.limitations",
    "required limitations are missing or out of order",
  );
  const conditional = limitations.slice(REQUIRED_QUALIFICATION_LIMITATIONS.length);
  ensure(
    sameValue(
      conditional,
      CONDITIONAL_LIMITATIONS.filter((code) => conditional.includes(code)),
    ),
    "$.limitations",
    "conditional limitations must be unique and protocol-ordered",
  );
  const gate = exactObject(record.gate, ["failureCodes", "decision", "rationale"], "$.gate");
  assertOrderedUniqueCodes(gate.failureCodes, "$.gate.failureCodes");
  enumAt(gate.decision, ["QUALIFY_PROFILE", "REJECT_PROFILE"] as const, "$.gate.decision");
  enumAt(gate.rationale, ["all-mandatory-criteria-passed", "mandatory-criteria-failed"] as const, "$.gate.rationale");

  const typed = value as QualificationRunRecord;
  const paths = allArtifacts(typed).map((artifact) => artifact.path);
  ensure(new Set(paths).size === paths.length, "$.cases", "duplicate artifact path");

  const implementation = typed.implementation;
  for (const inspection of allArtifacts(typed).map((artifact) => artifact.inspection)) {
    if ("nodeVersion" in inspection) {
      ensure(
        inspection.nodeVersion === implementation.nodeVersion &&
          inspection.icuVersion === implementation.icuVersion &&
          inspection.unicodeVersion === implementation.unicodeVersion,
        "$.implementation",
        "segmentation provenance does not match artifact evidence",
      );
    }
  }

  const unavailableAssistant = typed.cases.some((caseEvidence) =>
    caseEvidence.editors.some(
      (editor) =>
        editor.editorId === "microsoft-word" &&
        editor.accessibilityAssistant === "unavailable",
    ),
  );
  ensure(
    deviations.includes("accessibility-assistant-unavailable") === unavailableAssistant,
    "$.deviations",
    "Accessibility Assistant deviation linkage mismatch",
  );
  const hasDocxMetadata = allArtifacts(typed).some(
    (artifact) =>
      "coreMetadata" in artifact.inspection &&
      hasNonSyntheticMetadata(artifact.inspection.coreMetadata),
  );
  const hasPdfMetadata = allArtifacts(typed).some(
    (artifact) =>
      "metadata" in artifact.inspection &&
      hasNonSyntheticMetadata(artifact.inspection.metadata),
  );
  ensure(
    hasDocxMetadata ||
      (!deviations.includes("docx-core-metadata-redacted") &&
        !limitations.includes("docx-core-metadata-requires-privacy-review")),
    "$.deviations",
    "DOCX metadata codes are forbidden without redacted metadata",
  );
  ensure(
    hasPdfMetadata ||
      (!deviations.includes("pdf-metadata-redacted") &&
        !limitations.includes("pdf-metadata-requires-privacy-review")),
    "$.deviations",
    "PDF metadata codes are forbidden without redacted metadata",
  );
}

const semanticInspection = (
  inspection: JoinControlQualificationDocxInspection,
): UnknownRecord => {
  const semantic = { ...inspection } as UnknownRecord;
  delete semantic.mode;
  delete semantic.checkpointId;
  delete semantic.coreMetadata;
  return semantic;
};

const add = (
  findings: Set<QualificationFailureCode>,
  condition: boolean,
  code: QualificationFailureCode,
): void => {
  if (condition) findings.add(code);
};

export const deriveJoinControlQualificationFailureCodes = (
  record: QualificationRunRecord,
): readonly QualificationFailureCode[] => {
  const findings = new Set<QualificationFailureCode>();
  const addInspection = (
    inspection: { findings: readonly QualificationFailureCode[] },
    excludeVisibleText = false,
  ): void => {
    for (const code of inspection.findings) {
      if (!excludeVisibleText || code !== "visible-text-mismatch") findings.add(code);
    }
  };
  for (const caseEvidence of record.cases) {
    addInspection(caseEvidence.canonical.inspection);
    for (const editor of caseEvidence.editors) {
      addInspection(editor.roundtrip.inspection);
      addInspection(editor.clipboard.inspection);
      addInspection(editor.pdf.inspection);
      const primary = editor.primary;
      add(findings, primary.visibleText !== "parity", "visible-text-mismatch");
      add(findings, primary.carrierPresentation !== "absent" || primary.selectionPresentation !== "absent", "carrier-presented");
      add(findings, primary.shaping !== "parity", "shaping-mismatch");
      add(findings, primary.graphemes !== "parity", "grapheme-mismatch");
      add(findings, primary.bidiOrder !== "parity", "bidi-order-mismatch");
      add(findings, primary.layout !== "parity", "layout-mismatch");
      add(findings, primary.navigation !== "parity", "navigation-mismatch");
      add(findings, primary.search !== "both-rows-found", "search-mismatch");
      add(
        findings,
        editor.spellcheck.pairFindings !== "same" ||
          editor.spellcheck.pairSuggestionPresence !== "same" ||
          editor.spellcheck.latinBetaMisspelling === "different",
        "spellcheck-mismatch",
      );
      add(findings, primary.clipboardSelection !== "body-only", "clipboard-mismatch");
      for (const mutation of editor.mutations) {
        addInspection(mutation.result.inspection, true);
        addInspection(mutation.restored.inspection, true);
        const prefix = mutation.operation === "forward-delete" ? "forward-delete" : mutation.operation;
        add(
          findings,
          mutation.visibleConsequence !== "expected" ||
            mutation.result.inspection.visibleTextState !== "exact",
          `${prefix}-visible-mismatch` as QualificationFailureCode,
        );
        add(
          findings,
          mutation.frameConsequence !== "exact" ||
            mutation.result.inspection.frameState !== "exact" ||
            mutation.result.inspection.findings.includes(
              "transformed-anchor-failed",
            ),
          `${prefix}-frame-mismatch` as QualificationFailureCode,
        );
        add(
          findings,
          !sameValue(
            semanticInspection(mutation.restored.inspection),
            semanticInspection(editor.roundtrip.inspection),
          ),
          "undo-redo-mismatch",
        );
      }
      add(findings, editor.printPreview !== "parity", "print-preview-mismatch");
      const pdf = editor.pdf;
      add(findings, pdf.render === "failed", "pdf-render-failed");
      add(
        findings,
        pdf.visualPage === "mismatch" ||
          pdf.visualLayout === "mismatch" ||
          pdf.visualTextOrder === "mismatch",
        "pdf-render-mismatch",
      );
      add(findings, pdf.visualPlaceholder === "present", "pdf-placeholder-present");
      add(findings, editor.specializedView.presentation === "decoded-payload", "specialized-view-decoded-payload");
      add(findings, editor.specializedView.navigation === "trap", "specialized-view-navigation-trap");
      add(findings, editor.specializedView.residualLayout === "present", "specialized-view-residual-layout");
      const nvda = editor.nvda;
      add(findings, nvda.spokenText !== "parity", "nvda-spoken-text-mismatch");
      add(findings, nvda.readingOrder !== "parity", "nvda-reading-order-mismatch");
      add(findings, nvda.extraAnnouncements !== "none", "nvda-extra-announcement");
      add(findings, nvda.joinControlAnnouncement !== "absent", "nvda-join-control-announcement");
      add(findings, nvda.navigation !== "parity", "nvda-navigation-mismatch");
      add(findings, nvda.navigationTrap !== "absent", "nvda-navigation-trap");
      add(findings, nvda.selectionFeedback !== "parity", "nvda-selection-feedback-mismatch");
      add(findings, nvda.editingFeedback !== "parity", "nvda-editing-feedback-mismatch");
      add(findings, nvda.speechViewer !== "parity", "nvda-speech-viewer-mismatch");
    }
  }
  const docxMetadata = allArtifacts(record).some(
    (artifact) =>
      "coreMetadata" in artifact.inspection &&
      hasNonSyntheticMetadata(artifact.inspection.coreMetadata),
  );
  const pdfMetadata = allArtifacts(record).some(
    (artifact) =>
      "metadata" in artifact.inspection &&
      hasNonSyntheticMetadata(artifact.inspection.metadata),
  );
  add(
    findings,
    docxMetadata &&
      (!record.deviations.includes("docx-core-metadata-redacted") ||
        !record.limitations.includes("docx-core-metadata-requires-privacy-review")),
    "metadata-privacy-unresolved",
  );
  add(
    findings,
    pdfMetadata &&
      (!record.deviations.includes("pdf-metadata-redacted") ||
        !record.limitations.includes("pdf-metadata-requires-privacy-review")),
    "metadata-privacy-unresolved",
  );
  return QUALIFICATION_FAILURE_CODES.filter((code) => findings.has(code));
};

export type QualificationValidationDependencies = Readonly<{
  readArtifact: (repositoryRoot: string, path: string) => Promise<Uint8Array>;
  readImplementation: (repositoryRoot: string, path: string) => Promise<Uint8Array>;
  inspectDocx: typeof inspectJoinControlQualificationDocx;
  inspectText: typeof inspectJoinControlQualificationText;
  inspectPdf: typeof inspectJoinControlQualificationPdf;
  resolveGitRevision: (repositoryRoot: string, revision: string) => Promise<void>;
  readImplementationAtRevision: (
    repositoryRoot: string,
    revision: string,
    path: string,
  ) => Promise<Uint8Array>;
}>;

const defaultDependencies: QualificationValidationDependencies = {
  readArtifact: (repositoryRoot, path) =>
    readRepositoryRegularFile({
      repositoryRoot,
      allowedRoot: JOIN_CONTROL_QUALIFICATION_ARTIFACT_ROOT,
      relativePath: path,
    }),
  readImplementation: async (repositoryRoot, path) =>
    new Uint8Array(await readFile(resolve(repositoryRoot, path))),
  inspectDocx: inspectJoinControlQualificationDocx,
  inspectText: inspectJoinControlQualificationText,
  inspectPdf: inspectJoinControlQualificationPdf,
  resolveGitRevision: async (repositoryRoot, revision) => {
    await execFileAsync(
      "git",
      ["-C", repositoryRoot, "cat-file", "-e", `${revision}^{commit}`],
      { encoding: "utf8" },
    );
  },
  readImplementationAtRevision: async (repositoryRoot, revision, path) => {
    const result = await execFileAsync(
      "git",
      ["-C", repositoryRoot, "show", `${revision}:${path}`],
      { encoding: "buffer", maxBuffer: 4 * 1024 * 1024 },
    );
    return new Uint8Array(result.stdout);
  },
};

const verifyHash = (
  bytes: Uint8Array,
  expected: string,
  path: string,
): void => ensure(sha256(bytes) === expected, path, "artifact hash mismatch");

const verifyDocxArtifact = async (
  evidence: DocxArtifactEvidence,
  repositoryRoot: string,
  dependencies: QualificationValidationDependencies,
  path: string,
): Promise<void> => {
  const bytes = await dependencies.readArtifact(repositoryRoot, evidence.path);
  verifyHash(bytes, evidence.sha256, `${path}.sha256`);
  const inspection = dependencies.inspectDocx(
    bytes,
    evidence.inspection.caseId,
    evidence.inspection.checkpointId,
    evidence.inspection.mode,
  );
  ensure(sameValue(inspection, evidence.inspection), `${path}.inspection`, "does not match independent DOCX inspection");
};

const verifyTextArtifact = async (
  evidence: TextArtifactEvidence,
  repositoryRoot: string,
  dependencies: QualificationValidationDependencies,
  path: string,
): Promise<void> => {
  const bytes = await dependencies.readArtifact(repositoryRoot, evidence.path);
  verifyHash(bytes, evidence.sha256, `${path}.sha256`);
  const inspection = dependencies.inspectText(
    bytes,
    evidence.inspection.caseId,
    "roundtrip",
  );
  ensure(sameValue(inspection, evidence.inspection), `${path}.inspection`, "does not match independent text inspection");
};

const verifyPdfArtifact = async (
  evidence: PdfArtifactEvidence,
  repositoryRoot: string,
  dependencies: QualificationValidationDependencies,
  path: string,
): Promise<void> => {
  const bytes = await dependencies.readArtifact(repositoryRoot, evidence.path);
  verifyHash(bytes, evidence.sha256, `${path}.sha256`);
  const inspection = await dependencies.inspectPdf(
    bytes,
    evidence.inspection.caseId,
  );
  ensure(sameValue(inspection, evidence.inspection), `${path}.inspection`, "does not match independent PDF inspection");
};

export const validateJoinControlQualificationRun = async (
  value: unknown,
  repositoryRoot = repositoryRootFor(import.meta.url),
  dependencies: QualificationValidationDependencies = defaultDependencies,
): Promise<QualificationRunRecord> => {
  assertJoinControlQualificationRecordShape(value);
  const record = value;
  ensure(record.implementation.nodeVersion === process.versions.node, "$.implementation.nodeVersion", "does not match validator runtime");
  ensure(record.implementation.icuVersion === (process.versions.icu ?? ""), "$.implementation.icuVersion", "does not match validator runtime");
  ensure(record.implementation.unicodeVersion === (process.versions.unicode ?? ""), "$.implementation.unicodeVersion", "does not match validator runtime");
  try {
    await dependencies.resolveGitRevision(
      repositoryRoot,
      record.implementation.gitRevision,
    );
  } catch {
    throw new Error("$.implementation.gitRevision: revision does not resolve locally");
  }

  for (const [path, expectedHash] of [
    [record.implementation.protocolPath, record.implementation.protocolSha256],
    [record.implementation.fixturePath, record.implementation.fixtureSha256],
    [record.implementation.generatorPath, record.implementation.generatorSha256],
    [record.implementation.validatorPath, record.implementation.validatorSha256],
  ] as const) {
    const bytes = await dependencies.readImplementation(repositoryRoot, path);
    verifyHash(bytes, expectedHash, `$.implementation.${path}`);
    const committedBytes = await dependencies.readImplementationAtRevision(
      repositoryRoot,
      record.implementation.gitRevision,
      path,
    );
    verifyHash(
      committedBytes,
      expectedHash,
      `$.implementation.gitRevision:${path}`,
    );
  }

  for (const path of QUALIFICATION_BEHAVIOR_PATHS) {
    const currentBytes = await dependencies.readImplementation(
      repositoryRoot,
      path,
    );
    const committedBytes = await dependencies.readImplementationAtRevision(
      repositoryRoot,
      record.implementation.gitRevision,
      path,
    );
    ensure(
      sha256(currentBytes) === sha256(committedBytes),
      `$.implementation.behaviorFile:${path}`,
      "behavior file differs from the recorded revision",
    );
  }

  for (let caseIndex = 0; caseIndex < record.cases.length; caseIndex += 1) {
    const caseEvidence = record.cases[caseIndex]!;
    await verifyDocxArtifact(caseEvidence.canonical, repositoryRoot, dependencies, `$.cases[${caseIndex}].canonical`);
    for (let editorIndex = 0; editorIndex < caseEvidence.editors.length; editorIndex += 1) {
      const editor = caseEvidence.editors[editorIndex]!;
      const editorPath = `$.cases[${caseIndex}].editors[${editorIndex}]`;
      await verifyDocxArtifact(editor.roundtrip, repositoryRoot, dependencies, `${editorPath}.roundtrip`);
      for (let mutationIndex = 0; mutationIndex < editor.mutations.length; mutationIndex += 1) {
        const mutation = editor.mutations[mutationIndex]!;
        await verifyDocxArtifact(mutation.result, repositoryRoot, dependencies, `${editorPath}.mutations[${mutationIndex}].result`);
        await verifyDocxArtifact(mutation.restored, repositoryRoot, dependencies, `${editorPath}.mutations[${mutationIndex}].restored`);
      }
      await verifyTextArtifact(editor.clipboard, repositoryRoot, dependencies, `${editorPath}.clipboard`);
      await verifyPdfArtifact(editor.pdf, repositoryRoot, dependencies, `${editorPath}.pdf`);
    }
  }
  const derived = deriveJoinControlQualificationGate(
    deriveJoinControlQualificationFailureCodes(record),
  );
  ensure(sameValue(record.gate, derived), "$.gate", "does not match the mechanically derived gate");
  return record;
};

const main = async (): Promise<void> => {
  const args = process.argv.slice(2);
  const normalized = args[0] === "--" ? args.slice(1) : args;
  if (normalized.length !== 0) {
    process.stderr.write("Usage: pnpm research:carrier:join-control-qualification:validate\n");
    process.exitCode = 1;
    return;
  }
  try {
    const repositoryRoot = repositoryRootFor(import.meta.url);
    const serialized = await readRepositoryRegularFile({
      repositoryRoot,
      allowedRoot:
        "research/experiments/docx-join-control-accessibility-qualification-v1",
      relativePath: RUN_RECORD_PATH,
    });
    const record: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(serialized));
    const validated = await validateJoinControlQualificationRun(record, repositoryRoot);
    process.stdout.write(
      `${JSON.stringify({
        experimentId: validated.experimentId,
        qualificationProfile: validated.qualificationProfile,
        decision: validated.gate.decision,
        failureCodes: validated.gate.failureCodes,
      })}\n`,
    );
  } catch {
    process.stderr.write("Qualification run validation blocked.\n");
    process.exitCode = 1;
  }
};

const directExecution = (): boolean =>
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (directExecution()) {
  void main();
}
