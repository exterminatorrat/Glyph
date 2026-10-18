import { detect, type Manifest } from "@glyph/core";
import { parse } from "csv-parse/sync";
import type {
  Acknowledgment,
  Condition,
  InputClass,
  MatrixCase,
  MatrixModel,
  MockOutcome,
  RecordMetadata,
  RunMatrix,
} from "./contracts.js";
import { LabError } from "./errors.js";
import { completedRecord } from "./records.js";

const REQUIRED_CSV_HEADERS = [
  "trialId",
  "caseId",
  "assignmentId",
  "provider",
  "model",
  "variant",
  "condition",
  "response",
];
const OPTIONAL_CSV_HEADERS = ["providerVersion", "observedAt", "manualAcknowledgment"];
const CONDITIONS = new Set<Condition>([
  "unmarked",
  "tag-only",
  "visible-note-only",
  "both",
]);
const MOCK_OUTCOMES = new Set<MockOutcome>([
  "both",
  "tag-only",
  "visible-note-only",
  "miss",
  "empty",
  "error",
]);
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/;
const LABEL_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/;
const ISO_DATE_OR_DATETIME =
  /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?$/;
const MAX_PROMPT_BYTES = 100_000;

type DataObject = Record<string, unknown>;

const isObject = (value: unknown): value is DataObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasOnlyKeys = (
  value: DataObject,
  required: string[],
  optional: string[] = [],
): boolean => {
  const keys = Object.keys(value);
  return (
    required.every((key) => keys.includes(key)) &&
    keys.every((key) => required.includes(key) || optional.includes(key))
  );
};

const isSafeId = (value: unknown): value is string =>
  typeof value === "string" && ID_PATTERN.test(value);

const isSafeLabel = (value: unknown): value is string =>
  typeof value === "string" && LABEL_PATTERN.test(value);

const isInputClass = (value: unknown): value is InputClass =>
  value === "synthetic" || value === "consented-research";

const isCondition = (value: unknown): value is Condition =>
  typeof value === "string" && CONDITIONS.has(value as Condition);

const isAcknowledgment = (value: unknown): value is Acknowledgment =>
  value === "yes" || value === "no" || value === "unknown";

const isObservedAt = (value: string): boolean => {
  if (!ISO_DATE_OR_DATETIME.test(value) || !Number.isFinite(Date.parse(value))) {
    return false;
  }
  const date = value.slice(0, 10);
  return new Date(`${date}T00:00:00.000Z`).toISOString().slice(0, 10) === date;
};

export const parseManifestSet = (value: unknown): Manifest[] => {
  if (!Array.isArray(value) || value.length === 0) {
    throw new LabError("INVALID_MANIFEST");
  }

  const assignmentIds = new Set<string>();
  const manifests: Manifest[] = [];

  for (const item of value) {
    if (
      !isObject(item) ||
      !hasOnlyKeys(item, ["assignmentId", "layers"]) ||
      !isSafeId(item.assignmentId) ||
      !Array.isArray(item.layers) ||
      assignmentIds.has(item.assignmentId)
    ) {
      throw new LabError("INVALID_MANIFEST");
    }

    const layers: Manifest["layers"] = item.layers.map((layer): Manifest["layers"][number] => {
      if (
        !isObject(layer) ||
        !hasOnlyKeys(layer, ["id", "carrier", "canary"]) ||
        typeof layer.id !== "string" ||
        (layer.carrier !== "tag" && layer.carrier !== "visibleNote") ||
        typeof layer.canary !== "string"
      ) {
        throw new LabError("INVALID_MANIFEST");
      }

      const carrier: "tag" | "visibleNote" = layer.carrier;
      return {
        id: layer.id,
        carrier,
        canary: layer.canary,
      };
    });
    const manifest: Manifest = { assignmentId: item.assignmentId, layers };

    try {
      detect("", manifest);
    } catch {
      throw new LabError("INVALID_MANIFEST");
    }

    assignmentIds.add(item.assignmentId);
    manifests.push(manifest);
  }

  return manifests;
};

const metadataFromCsv = (
  row: Record<string, string>,
  inputClass: InputClass,
): RecordMetadata => {
  if (
    !isSafeId(row.trialId) ||
    !isSafeId(row.caseId) ||
    !isSafeId(row.assignmentId) ||
    !isSafeLabel(row.provider) ||
    !isSafeLabel(row.model) ||
    !isSafeId(row.variant) ||
    !isCondition(row.condition) ||
    typeof row.response !== "string"
  ) {
    throw new LabError("INVALID_CSV");
  }

  const metadata: RecordMetadata = {
    schemaVersion: 1,
    inputClass,
    source: "web-ui",
    trialId: row.trialId,
    caseId: row.caseId,
    assignmentId: row.assignmentId,
    provider: row.provider,
    model: row.model,
    providerVersion: "unknown",
    variant: row.variant,
    condition: row.condition,
  };

  if (row.providerVersion !== undefined && row.providerVersion !== "") {
    if (!isSafeLabel(row.providerVersion)) {
      throw new LabError("INVALID_CSV");
    }
    metadata.providerVersion = row.providerVersion;
  }
  if (row.observedAt !== undefined && row.observedAt !== "") {
    if (!isObservedAt(row.observedAt)) {
      throw new LabError("INVALID_CSV");
    }
    metadata.observedAt = row.observedAt;
  }
  if (row.manualAcknowledgment !== undefined && row.manualAcknowledgment !== "") {
    if (!isAcknowledgment(row.manualAcknowledgment)) {
      throw new LabError("INVALID_CSV");
    }
    metadata.manualAcknowledgment = row.manualAcknowledgment;
  }

  return metadata;
};

export const importManualCsv = (
  csvText: string,
  manifestInput: unknown,
  declaredInputClass: unknown,
) => {
  if (!isInputClass(declaredInputClass)) {
    throw new LabError("INVALID_INPUT_CLASS");
  }

  const manifests = parseManifestSet(manifestInput);
  const manifestByAssignment = new Map(
    manifests.map((manifest) => [manifest.assignmentId, manifest]),
  );
  let headers: string[] = [];
  let rows: Record<string, string>[];

  try {
    rows = parse(csvText, {
      bom: true,
      skip_empty_lines: true,
      columns: (header: string[]) => {
        headers = header;
        const allowedHeaders = [...REQUIRED_CSV_HEADERS, ...OPTIONAL_CSV_HEADERS];
        if (
          header.length === 0 ||
          new Set(header).size !== header.length ||
          !REQUIRED_CSV_HEADERS.every((name) => header.includes(name)) ||
          header.some((name) => !allowedHeaders.includes(name))
        ) {
          throw new LabError("INVALID_CSV");
        }
        return header;
      },
    });
  } catch {
    throw new LabError("INVALID_CSV");
  }

  if (headers.length === 0 || rows.length === 0) {
    throw new LabError("INVALID_CSV");
  }

  const trialIds = new Set<string>();

  return rows.map((row) => {
    const metadata = metadataFromCsv(row, declaredInputClass);
    if (trialIds.has(metadata.trialId)) {
      throw new LabError("DUPLICATE_TRIAL_ID");
    }
    const manifest = manifestByAssignment.get(metadata.assignmentId);
    if (!manifest) {
      throw new LabError("INVALID_MANIFEST");
    }
    trialIds.add(metadata.trialId);
    return completedRecord(metadata, row.response, manifest, false);
  });
};

const parseMatrixCase = (value: unknown): MatrixCase => {
  if (
    !isObject(value) ||
    !hasOnlyKeys(value, ["caseId", "assignmentId", "variant", "condition", "prompt"]) ||
    !isSafeId(value.caseId) ||
    !isSafeId(value.assignmentId) ||
    !isSafeId(value.variant) ||
    !isCondition(value.condition) ||
    typeof value.prompt !== "string" ||
    value.prompt.length === 0 ||
    Buffer.byteLength(value.prompt, "utf8") > MAX_PROMPT_BYTES
  ) {
    throw new LabError("INVALID_MATRIX");
  }

  return {
    caseId: value.caseId,
    assignmentId: value.assignmentId,
    variant: value.variant,
    condition: value.condition,
    prompt: value.prompt,
  };
};

const parseMatrixModel = (value: unknown): MatrixModel => {
  if (
    !isObject(value) ||
    !hasOnlyKeys(
      value,
      ["provider", "model", "repeats"],
      ["providerVersion", "mockOutcome"],
    ) ||
    (value.provider !== "openai" && value.provider !== "anthropic") ||
    !isSafeLabel(value.model) ||
    !Number.isSafeInteger(value.repeats) ||
    (value.repeats as number) < 1 ||
    (value.repeats as number) > 100
  ) {
    throw new LabError("INVALID_MATRIX");
  }

  let providerVersion = "unknown";
  if (value.providerVersion !== undefined) {
    if (!isSafeLabel(value.providerVersion)) {
      throw new LabError("INVALID_MATRIX");
    }
    providerVersion = value.providerVersion;
  }

  let mockOutcome: MockOutcome | undefined;
  if (value.mockOutcome !== undefined) {
    if (typeof value.mockOutcome !== "string" || !MOCK_OUTCOMES.has(value.mockOutcome as MockOutcome)) {
      throw new LabError("INVALID_MATRIX");
    }
    mockOutcome = value.mockOutcome as MockOutcome;
  }

  return {
    provider: value.provider,
    model: value.model,
    providerVersion,
    repeats: value.repeats as number,
    ...(mockOutcome === undefined ? {} : { mockOutcome }),
  };
};

export const parseRunMatrix = (value: unknown): RunMatrix => {
  if (
    !isObject(value) ||
    !hasOnlyKeys(value, ["schemaVersion", "inputClass", "manifests", "cases", "models"]) ||
    value.schemaVersion !== 1
  ) {
    throw new LabError("INVALID_MATRIX");
  }
  if (!isInputClass(value.inputClass)) {
    throw new LabError("INVALID_INPUT_CLASS");
  }

  const manifests = parseManifestSet(value.manifests);
  if (
    !Array.isArray(value.cases) ||
    value.cases.length === 0 ||
    !Array.isArray(value.models) ||
    value.models.length === 0
  ) {
    throw new LabError("INVALID_MATRIX");
  }

  const cases = value.cases.map(parseMatrixCase);
  const caseIds = new Set(cases.map(({ caseId }) => caseId));
  const manifestIds = new Set(manifests.map(({ assignmentId }) => assignmentId));
  if (caseIds.size !== cases.length) throw new LabError("INVALID_MATRIX");
  if (cases.some(({ assignmentId }) => !manifestIds.has(assignmentId))) {
    throw new LabError("INVALID_MANIFEST");
  }

  const models = value.models.map(parseMatrixModel);
  const modelKeys = new Set(
    models.map(({ provider, model, providerVersion }) =>
      JSON.stringify([provider, model, providerVersion]),
    ),
  );
  const plannedTrials = cases.length * models.reduce((total, model) => total + model.repeats, 0);
  if (
    modelKeys.size !== models.length ||
    plannedTrials > 1_000 ||
    cases.length > 1_000 ||
    models.length > 1_000
  ) {
    throw new LabError("INVALID_MATRIX");
  }

  return {
    schemaVersion: 1,
    inputClass: value.inputClass,
    manifests,
    cases,
    models,
  };
};
