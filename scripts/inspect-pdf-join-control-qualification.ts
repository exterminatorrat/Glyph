import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  qualificationCase,
  type QualificationCaseId,
} from "../research/experiments/docx-join-control-accessibility-qualification-v1/fixture";

const EXPECTED_UV_VERSION = "0.12.9";
const EXPECTED_PYPDF_VERSION = "6.10.0";
const INSPECTOR_PATH = fileURLToPath(
  new URL(
    "../research/experiments/docx-join-control-accessibility-qualification-v1/inspect-qualification-pdf.py",
    import.meta.url,
  ),
);

type MetadataClassification =
  | "absent"
  | "empty"
  | "synthetic_expected"
  | "non_synthetic_redacted";

export type QualificationPdfInspection = Readonly<{
  caseId: QualificationCaseId;
  encrypted: boolean;
  pageCount: number | null;
  visibleTextState: "exact-order" | "mismatch" | "not-inspectable-encrypted";
  carrierOrPlaceholderState:
    | "absent"
    | "present"
    | "not-inspectable-encrypted";
  attachmentCount: number | null;
  annotationCount: number | null;
  javascriptState: "absent" | "present" | "not-inspectable-encrypted";
  launchActionState: "absent" | "present" | "not-inspectable-encrypted";
  uriActionState: "absent" | "present" | "not-inspectable-encrypted";
  unsafeActionState: "absent" | "present" | "not-inspectable-encrypted";
  metadata:
    | Readonly<{
        author: MetadataClassification;
        creator: MetadataClassification;
        producer: MetadataClassification;
        title: MetadataClassification;
        subject: MetadataClassification;
        keywords: MetadataClassification;
        creatorTool: MetadataClassification;
        otherInfo: MetadataClassification;
        otherXmp: MetadataClassification;
      }>
    | "not-inspectable-encrypted";
  safetyState: "safe" | "unsafe" | "not-inspectable-encrypted";
  findings: readonly (
    | "pdf-encrypted"
    | "pdf-page-count-mismatch"
    | "pdf-text-order-mismatch"
    | "pdf-placeholder-present"
    | "pdf-unsafe-content"
  )[];
}>;

const blocked = (): never => {
  throw new Error("PDF inspection blocked");
};

const verifyUvVersion = (): void => {
  const result = spawnSync("uv", ["--version"], {
    encoding: "utf8",
    env: { ...process.env, LC_ALL: "C" },
    shell: false,
    timeout: 5_000,
  });
  if (typeof result.stdout !== "string") blocked();
  const version = result.stdout.match(/^uv ([0-9.]+)/)?.[1];
  if (result.status !== 0 || version !== EXPECTED_UV_VERSION) blocked();
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function assertRecord(value: unknown): asserts value is Record<string, unknown> {
  if (!isRecord(value)) blocked();
}

const exactKeys = (
  value: Record<string, unknown>,
  expected: readonly string[],
): void => {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    blocked();
  }
};

const oneOf = <T extends string>(value: unknown, allowed: readonly T[]): value is T =>
  typeof value === "string" && allowed.includes(value as T);

const nonnegativeInteger = (value: unknown): value is number =>
  Number.isInteger(value) && Number(value) >= 0;

const arrayEquals = (left: readonly string[], right: readonly string[]): boolean =>
  left.length === right.length && left.every((value, index) => value === right[index]);

const INSPECTION_KEYS = [
  "caseId",
  "encrypted",
  "pageCount",
  "visibleTextState",
  "carrierOrPlaceholderState",
  "attachmentCount",
  "annotationCount",
  "javascriptState",
  "launchActionState",
  "uriActionState",
  "unsafeActionState",
  "metadata",
  "safetyState",
  "findings",
] as const;

const METADATA_KEYS = [
  "author",
  "creator",
  "producer",
  "title",
  "subject",
  "keywords",
  "creatorTool",
  "otherInfo",
  "otherXmp",
] as const;

const PDF_FINDINGS = [
  "pdf-encrypted",
  "pdf-page-count-mismatch",
  "pdf-text-order-mismatch",
  "pdf-placeholder-present",
  "pdf-unsafe-content",
] as const;

export const validateQualificationPdfInspection = (
  value: unknown,
  caseId: QualificationCaseId,
): QualificationPdfInspection => {
  assertRecord(value);
  exactKeys(value, INSPECTION_KEYS);
  if (value.caseId !== caseId || typeof value.encrypted !== "boolean") blocked();
  if (
    !Array.isArray(value.findings) ||
    !value.findings.every((finding) => oneOf(finding, PDF_FINDINGS)) ||
    new Set(value.findings).size !== value.findings.length
  ) {
    blocked();
  }
  const findings = value.findings as string[];

  if (value.encrypted) {
    const sentinelFields = [
      value.visibleTextState,
      value.carrierOrPlaceholderState,
      value.javascriptState,
      value.launchActionState,
      value.uriActionState,
      value.unsafeActionState,
      value.metadata,
      value.safetyState,
    ];
    if (
      value.pageCount !== null ||
      value.attachmentCount !== null ||
      value.annotationCount !== null ||
      sentinelFields.some((field) => field !== "not-inspectable-encrypted") ||
      !arrayEquals(findings, ["pdf-encrypted"])
    ) {
      blocked();
    }
    return value as QualificationPdfInspection;
  }

  if (
    !nonnegativeInteger(value.pageCount) ||
    !nonnegativeInteger(value.attachmentCount) ||
    !nonnegativeInteger(value.annotationCount) ||
    !oneOf(value.visibleTextState, ["exact-order", "mismatch"] as const) ||
    !oneOf(value.carrierOrPlaceholderState, ["absent", "present"] as const) ||
    !oneOf(value.javascriptState, ["absent", "present"] as const) ||
    !oneOf(value.launchActionState, ["absent", "present"] as const) ||
    !oneOf(value.uriActionState, ["absent", "present"] as const) ||
    !oneOf(value.unsafeActionState, ["absent", "present"] as const) ||
    !oneOf(value.safetyState, ["safe", "unsafe"] as const)
  ) {
    blocked();
  }
  const attachmentCount = value.attachmentCount as number;
  const annotationCount = value.annotationCount as number;
  assertRecord(value.metadata);
  exactKeys(value.metadata, METADATA_KEYS);
  const metadataClassifications = [
    "absent",
    "empty",
    "synthetic_expected",
    "non_synthetic_redacted",
  ] as const;
  if (
    Object.values(value.metadata).some(
      (classification) => !oneOf(classification, metadataClassifications),
    )
  ) {
    blocked();
  }

  const unsafe =
    attachmentCount > 0 ||
    annotationCount > 0 ||
    [
      value.javascriptState,
      value.launchActionState,
      value.uriActionState,
      value.unsafeActionState,
    ].includes("present");
  if (value.safetyState !== (unsafe ? "unsafe" : "safe")) blocked();
  const expectedFindings: string[] = [];
  if (value.pageCount !== 1) expectedFindings.push("pdf-page-count-mismatch");
  if (value.visibleTextState !== "exact-order") {
    expectedFindings.push("pdf-text-order-mismatch");
  }
  if (value.carrierOrPlaceholderState !== "absent") {
    expectedFindings.push("pdf-placeholder-present");
  }
  if (unsafe) expectedFindings.push("pdf-unsafe-content");
  if (!arrayEquals(findings, expectedFindings)) blocked();
  return value as QualificationPdfInspection;
};

export async function inspectJoinControlQualificationPdf(
  bytes: Uint8Array,
  caseId: QualificationCaseId,
): Promise<QualificationPdfInspection> {
  verifyUvVersion();
  const fixture = qualificationCase(caseId);
  const expectedParagraphs = fixture.rows.map(
    (row) => `${row.prefix}${row.content}`,
  );
  const request = JSON.stringify({
    caseId,
    expectedParagraphs,
    pdfBase64: Buffer.from(bytes).toString("base64"),
  });
  const result = spawnSync(
    "uv",
    ["run", "--no-project", "--script", INSPECTOR_PATH],
    {
      input: request,
      encoding: "utf8",
      env: { ...process.env, LC_ALL: "C" },
      maxBuffer: 1024 * 1024,
      shell: false,
      timeout: 30_000,
    },
  );
  if (result.status !== 0) blocked();

  let envelope: unknown;
  try {
    envelope = JSON.parse(result.stdout);
  } catch {
    blocked();
  }
  assertRecord(envelope);
  if (envelope.pypdfVersion !== EXPECTED_PYPDF_VERSION) blocked();
  return validateQualificationPdfInspection(envelope.inspection, caseId);
}
