import { detect, type Manifest } from "@glyph/core";
import type { LabRecord, RecordMetadata } from "./contracts.js";
import type { TrialErrorCode } from "./errors.js";

export const completedRecord = (
  metadata: RecordMetadata,
  response: string,
  manifest: Manifest,
  simulated: boolean,
): LabRecord => {
  const result = detect(response, manifest);

  return {
    ...metadata,
    status: "completed",
    simulated,
    layers: [
      { carrier: result.layers[0].carrier, detected: result.layers[0].detected },
      { carrier: result.layers[1].carrier, detected: result.layers[1].detected },
    ],
    rawTags: result.rawTags,
    caveat: result.caveat,
  };
};

export const errorRecord = (
  metadata: RecordMetadata,
  errorCode: TrialErrorCode,
  simulated: boolean,
): LabRecord => ({
  ...metadata,
  status: "error",
  simulated,
  errorCode,
});
