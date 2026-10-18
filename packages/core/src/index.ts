export type Layer = {
  id: string;
  carrier: "tag" | "visibleNote";
  canary: string;
};

export type Manifest = {
  assignmentId: string;
  layers: Layer[];
};

export { CANARY_DERIVATION_VERSION, deriveCanary } from "./canary.js";
export {
  decodeTagInstructions,
  encodeTagInstruction,
  stripTagInstructions,
} from "./tag-codec.js";
export {
  deriveEmbeddingPlan,
  embed,
  removeEmbeddedText,
} from "./embedding.js";
export { detect } from "./detection.js";
export type { DetectionResult } from "./detection.js";
export type {
  EmbeddedText,
  EmbeddingPlan,
  EmbeddingReceipt,
} from "./embedding.js";
