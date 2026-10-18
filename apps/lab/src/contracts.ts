import type { Manifest } from "@glyph/core";
import type { TrialErrorCode } from "./errors.js";

export type InputClass = "synthetic" | "consented-research";
export type Condition = "unmarked" | "tag-only" | "visible-note-only" | "both";
export type Provider = "openai" | "anthropic";
export type Source = "web-ui" | "api" | "mock";
export type Acknowledgment = "yes" | "no" | "unknown";
export type MockOutcome =
  | "both"
  | "tag-only"
  | "visible-note-only"
  | "miss"
  | "empty"
  | "error";

export type MatrixCase = {
  caseId: string;
  assignmentId: string;
  variant: string;
  condition: Condition;
  prompt: string;
};

export type MatrixModel = {
  provider: Provider;
  model: string;
  providerVersion: string;
  repeats: number;
  mockOutcome?: MockOutcome;
};

export type RunMatrix = {
  schemaVersion: 1;
  inputClass: InputClass;
  manifests: Manifest[];
  cases: MatrixCase[];
  models: MatrixModel[];
};

export type RecordMetadata = {
  schemaVersion: 1;
  inputClass: InputClass;
  source: Source;
  trialId: string;
  caseId: string;
  assignmentId: string;
  provider: string;
  model: string;
  providerVersion: string;
  variant: string;
  condition: Condition;
  observedAt?: string;
  manualAcknowledgment?: Acknowledgment;
};

export type LayerOutcome = {
  carrier: "tag" | "visibleNote";
  detected: boolean;
};

export type LabRecord =
  | (RecordMetadata & {
      status: "completed";
      simulated: boolean;
      layers: [LayerOutcome, LayerOutcome];
      rawTags: { present: boolean; count: number };
      caveat: string;
    })
  | (RecordMetadata & {
      status: "error";
      simulated: boolean;
      errorCode: TrialErrorCode;
    });

export type LayerSummary = {
  hits: number;
  denominator: number;
  observedFraction: string | null;
  note: string;
};

export type SummaryCell = {
  source: Source;
  inputClass: InputClass;
  provider: string;
  model: string;
  providerVersion: string;
  assignmentId: string;
  caseId: string;
  variant: string;
  condition: Condition;
  manualAcknowledgment?: Acknowledgment;
  validResponses: number;
  technicalErrors: number;
  layers: {
    tag: LayerSummary;
    visibleNote: LayerSummary;
  };
};

export type LabSummary = {
  schemaVersion: 1;
  mode: "OBSERVED" | "SIMULATED" | "MIXED";
  note: string;
  cells: SummaryCell[];
};
