import type { Manifest } from "@glyph/core";

export const manifest: Manifest = {
  assignmentId: "lesson-42",
  layers: [
    {
      id: "hidden",
      carrier: "tag",
      canary: "the kind meadow shapes the familiar pebble beside the calm apple",
    },
    {
      id: "visible",
      carrier: "visibleNote",
      canary: "the bold river traces the calm compass beside the fresh mirror",
    },
  ],
};

export const manifestSet = [manifest];

export const bothCanaries = manifest.layers.map((layer) => layer.canary).join(" ");

export const matrixInput = {
  schemaVersion: 1,
  inputClass: "synthetic",
  manifests: manifestSet,
  cases: [
    {
      caseId: "case-1",
      assignmentId: "lesson-42",
      variant: "baseline",
      condition: "both",
      prompt: "SYNTHETIC_PROMPT_SENTINEL",
    },
  ],
  models: [
    {
      provider: "openai",
      model: "gpt-test-model",
      repeats: 1,
    },
  ],
};

export const requiredCsvHeader =
  "trialId,caseId,assignmentId,provider,model,variant,condition,response";

export const csvRow = (trialId: string, response: string): string =>
  [trialId, "case-1", "lesson-42", "chatgpt", "unknown", "baseline", "both", response]
    .map((value) => `"${value.replaceAll('"', '""')}"`)
    .join(",");
