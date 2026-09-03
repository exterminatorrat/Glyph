import { TextDecoder } from "node:util";
import {
  codePointLabel,
  decodeCarrier,
  isAnyCandidateCodePoint,
  isCandidateCodePoint,
} from "./frame.ts";
import {
  VISIBLE_PARAGRAPHS,
  type CandidateId,
  type ZeroWidthMarkerId,
} from "./fixture.ts";

export type CodePointOccurrence = Readonly<{
  codePoint: string;
  codePointIndex: number;
}>;

export type CarrierRunInspection = Readonly<{
  startCodePointIndex: number;
  endCodePointIndexExclusive: number;
  codePointCount: number;
  codePoints: readonly string[];
  decodedFrame: ReturnType<typeof decodeCarrier> | null;
  error: string | null;
}>;

export type ZeroWidthTextInspection = Readonly<{
  candidateId: CandidateId;
  validUtf8: true;
  byteLength: number;
  codePointLength: number;
  normalization: Readonly<{
    nfc: "unchanged" | "changed";
    nfkc: "unchanged" | "changed";
  }>;
  candidateCodePoints: readonly CodePointOccurrence[];
  unexpectedCandidateCodePoints: readonly CodePointOccurrence[];
  carrierRuns: readonly CarrierRunInspection[];
  markerPresence: Readonly<{
    alpha: "present" | "absent";
    beta: "present" | "absent";
  }>;
  frameErrors: readonly string[];
  visibleBodyParagraphs: readonly string[];
}>;

type TextCodePoint = Readonly<{
  value: string;
  codePoint: number;
  codePointIndex: number;
}>;

const markerIds = ["alpha", "beta"] as const satisfies readonly ZeroWidthMarkerId[];

const decodeUtf8 = (bytes: Uint8Array): string => {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error("Invalid UTF-8 text");
  }
};

const codePointEntries = (text: string): TextCodePoint[] =>
  [...text].map((value, codePointIndex) => ({
    value,
    codePoint: value.codePointAt(0) ?? -1,
    codePointIndex,
  }));

const paragraphLines = (text: string): string[] => {
  const paragraphs = text.replace(/\r\n?/g, "\n").split("\n");
  if (paragraphs.at(-1) === "") {
    paragraphs.pop();
  }
  return paragraphs;
};

const safeVisibleBodyParagraphs = (
  paragraphs: readonly string[],
): string[] =>
  paragraphs.map((paragraph, index) =>
    paragraph === VISIBLE_PARAGRAPHS[index] && index < VISIBLE_PARAGRAPHS.length
      ? paragraph
      : "redacted-visible-body",
  );

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Carrier frame could not be decoded";

export function inspectZeroWidthText(
  bytes: Uint8Array,
  candidateId: CandidateId,
): ZeroWidthTextInspection {
  const text = decodeUtf8(bytes);
  const entries = codePointEntries(text);
  const candidateCodePoints = entries
    .filter(({ codePoint }) => isCandidateCodePoint(candidateId, codePoint))
    .map(({ codePoint, codePointIndex }) => ({
      codePoint: codePointLabel(codePoint),
      codePointIndex,
    }));
  const unexpectedCandidateCodePoints = entries
    .filter(
      ({ codePoint }) =>
        isAnyCandidateCodePoint(codePoint) &&
        !isCandidateCodePoint(candidateId, codePoint),
    )
    .map(({ codePoint, codePointIndex }) => ({
      codePoint: codePointLabel(codePoint),
      codePointIndex,
    }));

  const carrierRuns: CarrierRunInspection[] = [];
  const frameErrors: string[] = [];
  const removableIndexes = new Set<number>();
  const decodedMarkers = new Set<ZeroWidthMarkerId>();

  let index = 0;
  while (index < entries.length) {
    const entry = entries[index];
    if (!entry || !isCandidateCodePoint(candidateId, entry.codePoint)) {
      index += 1;
      continue;
    }
    const start = index;
    while (
      index < entries.length &&
      isCandidateCodePoint(candidateId, entries[index]?.codePoint ?? -1)
    ) {
      index += 1;
    }
    const runEntries = entries.slice(start, index);
    const carrier = runEntries.map(({ value }) => value).join("");
    let decodedFrame: ReturnType<typeof decodeCarrier> | null = null;
    let error: string | null = null;
    try {
      decodedFrame = decodeCarrier(candidateId, carrier);
      if (decodedMarkers.has(decodedFrame.markerId)) {
        error = `Candidate ${candidateId}: duplicate ${decodedFrame.markerId} frame`;
        frameErrors.push(error);
      } else {
        decodedMarkers.add(decodedFrame.markerId);
      }
      runEntries.forEach(({ codePointIndex }) => removableIndexes.add(codePointIndex));
    } catch (caught: unknown) {
      error = errorMessage(caught);
      frameErrors.push(error);
    }
    carrierRuns.push({
      startCodePointIndex: runEntries[0]?.codePointIndex ?? start,
      endCodePointIndexExclusive:
        (runEntries.at(-1)?.codePointIndex ?? index - 1) + 1,
      codePointCount: runEntries.length,
      codePoints: runEntries.map(({ codePoint }) => codePointLabel(codePoint)),
      decodedFrame,
      error,
    });
  }

  const visibleText = entries
    .filter(({ codePointIndex }) => !removableIndexes.has(codePointIndex))
    .map(({ value }) => value)
    .join("");
  const markerPresence = Object.fromEntries(
    markerIds.map((markerId) => [
      markerId,
      decodedMarkers.has(markerId) ? "present" : "absent",
    ]),
  ) as { alpha: "present" | "absent"; beta: "present" | "absent" };

  return {
    candidateId,
    validUtf8: true,
    byteLength: bytes.length,
    codePointLength: entries.length,
    normalization: {
      nfc: text.normalize("NFC") === text ? "unchanged" : "changed",
      nfkc: text.normalize("NFKC") === text ? "unchanged" : "changed",
    },
    candidateCodePoints,
    unexpectedCandidateCodePoints,
    carrierRuns,
    markerPresence,
    frameErrors,
    visibleBodyParagraphs: safeVisibleBodyParagraphs(paragraphLines(visibleText)),
  };
}
