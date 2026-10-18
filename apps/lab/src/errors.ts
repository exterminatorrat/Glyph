export type LabErrorCode =
  | "INVALID_ARGUMENTS"
  | "INPUT_READ_FAILED"
  | "INVALID_JSON"
  | "INVALID_CSV"
  | "INVALID_MATRIX"
  | "INVALID_MANIFEST"
  | "INVALID_INPUT_CLASS"
  | "DUPLICATE_TRIAL_ID"
  | "REQUEST_BUDGET_EXCEEDED"
  | "API_KEY_MISSING"
  | "API_REQUEST_FAILED"
  | "API_TIMEOUT"
  | "INVALID_RESPONSE"
  | "MOCK_ERROR"
  | "OUTPUT_EXISTS"
  | "OUTPUT_FAILED"
  | "INTERNAL_ERROR";

export type TrialErrorCode =
  | "API_REQUEST_FAILED"
  | "API_TIMEOUT"
  | "INVALID_RESPONSE"
  | "MOCK_ERROR";

export class LabError extends Error {
  readonly code: LabErrorCode;

  constructor(code: LabErrorCode) {
    super(code);
    this.name = "LabError";
    this.code = code;
  }
}

export const safeErrorCode = (error: unknown): LabErrorCode =>
  error instanceof LabError ? error.code : "INTERNAL_ERROR";
