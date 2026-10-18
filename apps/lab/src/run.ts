import { createHash } from "node:crypto";
import type {
  LabRecord,
  MatrixCase,
  MatrixModel,
  Provider,
  RecordMetadata,
  RunMatrix,
} from "./contracts.js";
import { LabError, safeErrorCode } from "./errors.js";
import { errorRecord, completedRecord } from "./records.js";
import { fetchProviderText } from "./providers.js";

export type RunnerOptions = {
  live?: boolean;
  maxRequests?: number;
  env?: Readonly<Record<string, string | undefined>>;
  fetch?: typeof fetch;
};

const apiKeyName = (provider: Provider): string =>
  provider === "openai" ? "OPENAI_API_KEY" : "ANTHROPIC_API_KEY";

const plannedRequestCount = (matrix: RunMatrix): number =>
  matrix.cases.length * matrix.models.reduce((total, model) => total + model.repeats, 0);

const trialIdFor = (testCase: MatrixCase, modelIndex: number, repeatIndex: number): string => {
  const input = JSON.stringify([testCase.caseId, modelIndex + 1, repeatIndex + 1]);
  const digest = createHash("sha256").update(input).digest("hex").slice(0, 24);
  return `trial-${digest}`;
};

const recordMetadata = (
  matrix: RunMatrix,
  testCase: MatrixCase,
  model: MatrixModel,
  source: "api" | "mock",
  trialId: string,
): RecordMetadata => ({
  schemaVersion: 1,
  inputClass: matrix.inputClass,
  source,
  trialId,
  caseId: testCase.caseId,
  assignmentId: testCase.assignmentId,
  provider: model.provider,
  model: model.model,
  providerVersion: model.providerVersion,
  variant: testCase.variant,
  condition: testCase.condition,
});

const mockResponse = (model: MatrixModel, manifestLayers: RunMatrix["manifests"][number]["layers"]): string => {
  switch (model.mockOutcome ?? "miss") {
    case "both":
      return manifestLayers.map(({ canary }) => canary).join(" ");
    case "tag-only":
      return manifestLayers.find(({ carrier }) => carrier === "tag")?.canary ?? "";
    case "visible-note-only":
      return manifestLayers.find(({ carrier }) => carrier === "visibleNote")?.canary ?? "";
    case "empty":
      return "";
    case "miss":
      return "Synthetic simulated response without a canary.";
    case "error":
      return "";
  }
};

const validateOptions = (matrix: RunMatrix, options: RunnerOptions): Map<Provider, string> => {
  const requests = plannedRequestCount(matrix);
  if (!Number.isSafeInteger(requests) || requests < 1 || requests > 1_000) {
    throw new LabError("INVALID_MATRIX");
  }

  if (options.live !== true) {
    if (options.maxRequests !== undefined) throw new LabError("INVALID_ARGUMENTS");
    return new Map();
  }

  const maxRequests = options.maxRequests;
  if (
    !Number.isSafeInteger(maxRequests) ||
    maxRequests === undefined ||
    maxRequests < requests
  ) {
    throw new LabError("REQUEST_BUDGET_EXCEEDED");
  }
  if (matrix.models.some((model) => model.mockOutcome !== undefined)) {
    throw new LabError("INVALID_MATRIX");
  }

  const environment = options.env ?? process.env;
  const providers = new Set(matrix.models.map(({ provider }) => provider));
  const keys = new Map<Provider, string>();
  for (const provider of providers) {
    const key = environment[apiKeyName(provider)]?.trim();
    if (!key) throw new LabError("API_KEY_MISSING");
    keys.set(provider, key);
  }
  return keys;
};

export const runMatrix = async (
  matrix: RunMatrix,
  options: RunnerOptions = {},
): Promise<LabRecord[]> => {
  const keys = validateOptions(matrix, options);
  const live = options.live === true;
  const fetcher = options.fetch ?? globalThis.fetch;
  const manifests = new Map(matrix.manifests.map((manifest) => [manifest.assignmentId, manifest]));
  const records: LabRecord[] = [];

  for (const testCase of matrix.cases) {
    for (const [modelIndex, model] of matrix.models.entries()) {
      const manifest = manifests.get(testCase.assignmentId);
      if (!manifest) throw new LabError("INVALID_MANIFEST");

      for (let repeatIndex = 0; repeatIndex < model.repeats; repeatIndex += 1) {
        const metadata = recordMetadata(
          matrix,
          testCase,
          model,
          live ? "api" : "mock",
          trialIdFor(testCase, modelIndex, repeatIndex),
        );

        if (!live) {
          if (model.mockOutcome === "error") {
            records.push(errorRecord(metadata, "MOCK_ERROR", true));
          } else {
            records.push(completedRecord(metadata, mockResponse(model, manifest.layers), manifest, true));
          }
          continue;
        }

        try {
          const response = await fetchProviderText(
            model.provider,
            model,
            testCase,
            keys.get(model.provider) ?? "",
            fetcher,
          );
          records.push(completedRecord(metadata, response, manifest, false));
        } catch (error) {
          const code = safeErrorCode(error);
          records.push(
            errorRecord(
              metadata,
              code === "API_TIMEOUT" || code === "INVALID_RESPONSE"
                ? code
                : "API_REQUEST_FAILED",
              false,
            ),
          );
        }
      }
    }
  }

  return records;
};
