import { validateManifest } from "./embedding.js";
import type { Manifest } from "./index.js";

export type DetectionResult = {
  assignmentId: string;
  layers: [
    { id: string; carrier: "tag"; detected: boolean },
    { id: string; carrier: "visibleNote"; detected: boolean },
  ];
  rawTags: { present: boolean; count: number };
  caveat: string;
};

const DETECTION_CAVEAT =
  "Canary matches warrant contextual conversation and corroboration; they are not proof of AI use, direct ingestion, authorship, intent, or misconduct. A result with no detected canary provides no evidence either for or against AI use and is never evidence of innocence. Retyping, OCR, paraphrasing, or a model that never reached the canary can cause misses. Raw tags are a separate text observation, not a canary hit or proof of source.";

const NORMALIZATION_SEPARATORS = /[\p{P}\p{White_Space}\uFEFF]+/gu;
const BLACK_FLAG = 0x1f3f4;
const TAG_CANCEL = 0xe007f;

const normalize = (value: string): string =>
  value.toLowerCase().replace(NORMALIZATION_SEPARATORS, " ").trim();

const isFlagPayloadTag = (codePoint: number): boolean =>
  (codePoint >= 0xe0061 && codePoint <= 0xe007a) ||
  (codePoint >= 0xe0030 && codePoint <= 0xe0039);

const countRawTags = (value: string): number => {
  let count = 0;
  let index = 0;

  while (index < value.length) {
    const codePoint = value.codePointAt(index)!;
    const width = codePoint > 0xffff ? 2 : 1;

    if (codePoint === BLACK_FLAG) {
      let cursor = index + width;
      let payloadCount = 0;
      let completeFlagShape = false;

      while (cursor < value.length) {
        const nextCodePoint = value.codePointAt(cursor)!;
        const nextWidth = nextCodePoint > 0xffff ? 2 : 1;

        if (isFlagPayloadTag(nextCodePoint)) {
          payloadCount += 1;
          cursor += nextWidth;
          continue;
        }

        if (nextCodePoint === TAG_CANCEL && payloadCount > 0) {
          cursor += nextWidth;
          completeFlagShape = true;
        }
        break;
      }

      if (completeFlagShape) {
        index = cursor;
        continue;
      }

      count += payloadCount;
      index = cursor;
      continue;
    }

    if (codePoint >= 0xe0000 && codePoint <= 0xe007f) {
      count += 1;
    }
    index += width;
  }

  return count;
};

export const detect = (
  submission: string,
  manifest: Manifest,
): DetectionResult => {
  if (typeof submission !== "string") {
    throw new TypeError("Submission must be a string.");
  }

  const binding = validateManifest(manifest);
  const [tag, visibleNote] = binding.layers;
  const normalizedSubmission = ` ${normalize(submission)} `;
  const rawTagCount = countRawTags(submission);

  return {
    assignmentId: binding.assignmentId,
    layers: [
      {
        id: tag.id,
        carrier: "tag",
        detected: normalizedSubmission.includes(` ${normalize(tag.canary)} `),
      },
      {
        id: visibleNote.id,
        carrier: "visibleNote",
        detected: normalizedSubmission.includes(
          ` ${normalize(visibleNote.canary)} `,
        ),
      },
    ],
    rawTags: { present: rawTagCount > 0, count: rawTagCount },
    caveat: DETECTION_CAVEAT,
  };
};
