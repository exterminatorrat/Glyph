import {
  expectedCaseState,
  qualificationCase,
  type QualificationCaseId,
  type QualificationLanguage,
} from "./fixture.ts";
import type { QualificationSegmentationRow } from "./inspect-qualification-docx.ts";
import {
  decodeCarrier,
  isAnyCandidateCodePoint,
  isCandidateCodePoint,
} from "../docx-zero-width-carrier-bakeoff-v1/frame.ts";
import { CANDIDATE_A } from "../docx-zero-width-carrier-bakeoff-v1/fixture.ts";

const DEFAULT_IGNORABLE = /\p{Default_Ignorable_Code_Point}/u;

export type JoinControlQualificationTextInspection = Readonly<{
  caseId: QualificationCaseId;
  checkpointId: "roundtrip";
  lineEndings: "lf" | "crlf";
  frameState: "exact" | "missing" | "damaged" | "duplicate" | "moved" | "mixed";
  visibleTextState: "exact" | "mismatch";
  defaultIgnorableState: "allowlisted-only" | "unexpected";
  nfcState: "stable" | "mismatch";
  nfkcState: "stable" | "mismatch";
  segmentationState: "expected" | "mismatch";
  segmentation: readonly [
    QualificationSegmentationRow,
    QualificationSegmentationRow,
    QualificationSegmentationRow,
    QualificationSegmentationRow,
  ];
  nodeVersion: string;
  icuVersion: string;
  unicodeVersion: string;
  findings: readonly (
    | "clipboard-mismatch"
    | "unexpected-default-ignorable"
    | "normalization-mismatch"
    | "segmentation-mismatch"
  )[];
}>;

type TextPoint = Readonly<{
  value: string;
  codePoint: number;
  codePointIndex: number;
}>;

type TextFrame = Readonly<{
  markerId: "alpha" | "beta" | null;
  checksumValid: boolean;
  rowIndex: number;
  startCodePointIndex: number;
  pointIndexes: readonly number[];
}>;

const pointsFor = (value: string): TextPoint[] =>
  [...value].map((character, codePointIndex) => ({
    value: character,
    codePoint: character.codePointAt(0) ?? -1,
    codePointIndex,
  }));

const carrierGroups = (points: readonly TextPoint[]): TextPoint[][] => {
  const groups: TextPoint[][] = [];
  let current: TextPoint[] = [];
  for (const point of points) {
    if (isCandidateCodePoint(CANDIDATE_A.id, point.codePoint)) {
      current.push(point);
    } else if (current.length > 0) {
      groups.push(current);
      current = [];
    }
  }
  if (current.length > 0) groups.push(current);
  return groups;
};

const isAllowlisted = (
  caseId: QualificationCaseId,
  rowIndex: number,
  group: readonly TextPoint[],
): boolean =>
  group.every((point) =>
    qualificationCase(caseId).legitimateJoinControls.some(
      (allowed) =>
        allowed.rowIndex === rowIndex &&
        allowed.codePointIndex === point.codePointIndex &&
        allowed.codePoint === point.codePoint,
    ),
  );

const isAllowlistedPoint = (
  caseId: QualificationCaseId,
  rowIndex: number,
  point: TextPoint,
): boolean =>
  qualificationCase(caseId).legitimateJoinControls.some(
    (allowed) =>
      allowed.rowIndex === rowIndex &&
      allowed.codePointIndex === point.codePointIndex &&
      allowed.codePoint === point.codePoint,
  );

const segmentationFor = (
  rows: readonly string[],
  caseId: QualificationCaseId,
): JoinControlQualificationTextInspection["segmentation"] => {
  const fixtureCase = qualificationCase(caseId);
  return fixtureCase.rows.map((row, rowIndex) => {
    const text = rows[rowIndex] ?? "";
    const locale: QualificationLanguage = row.language;
    return {
      rowIndex: rowIndex as 0 | 1 | 2 | 3,
      locale,
      graphemeCount: [
        ...new Intl.Segmenter(locale, { granularity: "grapheme" }).segment(text),
      ].length,
      wordLikeCount: [
        ...new Intl.Segmenter(locale, { granularity: "word" }).segment(text),
      ].filter((segment) => segment.isWordLike).length,
      paragraphCount: 1 as const,
    };
  }) as unknown as JoinControlQualificationTextInspection["segmentation"];
};

const lineEndingAndRows = (
  text: string,
): { lineEndings: "lf" | "crlf"; rows: string[] } => {
  if (text.includes("\r\n")) {
    const withoutCrlf = text.replaceAll("\r\n", "");
    if (withoutCrlf.includes("\r") || withoutCrlf.includes("\n")) {
      throw new Error("Mixed or unsupported qualification line endings");
    }
    return { lineEndings: "crlf", rows: text.split("\r\n") };
  }
  if (text.includes("\r")) {
    throw new Error("Mixed or unsupported qualification line endings");
  }
  return { lineEndings: "lf", rows: text.split("\n") };
};

export function inspectJoinControlQualificationText(
  bytes: Uint8Array,
  caseId: QualificationCaseId,
  checkpointId: "roundtrip",
): JoinControlQualificationTextInspection {
  qualificationCase(caseId);
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error("Invalid UTF-8 qualification text");
  }
  const { lineEndings, rows } = lineEndingAndRows(text);
  const frames: TextFrame[] = [];
  const visibleRows: string[] = [];
  let damaged = false;
  let mixed = false;
  let unexpectedDefaultIgnorable = false;

  rows.forEach((row, rowIndex) => {
    const points = pointsFor(row);
    const removable = new Set<number>();
    for (const group of carrierGroups(points)) {
      if (isAllowlisted(caseId, rowIndex, group)) continue;
      for (let index = 0; index < group.length; index += 120) {
        const chunk = group.slice(index, index + 120);
        let markerId: "alpha" | "beta" | null = null;
        let checksumValid = false;
        if (chunk.length === 120) {
          try {
            markerId = decodeCarrier(
              CANDIDATE_A.id,
              chunk.map(({ value }) => value).join(""),
            ).markerId;
            checksumValid = true;
            chunk.forEach(({ codePointIndex }) => removable.add(codePointIndex));
          } catch {
            damaged = true;
          }
        } else {
          damaged = true;
        }
        if (!checksumValid) unexpectedDefaultIgnorable = true;
        frames.push({
          markerId,
          checksumValid,
          rowIndex,
          startCodePointIndex: chunk[0]?.codePointIndex ?? -1,
          pointIndexes: chunk.map(({ codePointIndex }) => codePointIndex),
        });
      }
    }
    for (const point of points) {
      if (
        isAnyCandidateCodePoint(point.codePoint) &&
        !isCandidateCodePoint(CANDIDATE_A.id, point.codePoint)
      ) {
        mixed = true;
        unexpectedDefaultIgnorable = true;
      }
      if (
        DEFAULT_IGNORABLE.test(point.value) &&
        !removable.has(point.codePointIndex) &&
        !isAllowlistedPoint(caseId, rowIndex, point)
      ) {
        unexpectedDefaultIgnorable = true;
      }
    }
    visibleRows.push(
      points
        .filter(({ codePointIndex }) => !removable.has(codePointIndex))
        .map(({ value }) => value)
        .join(""),
    );
  });

  const expected = expectedCaseState(caseId, checkpointId);
  const counts = {
    alpha: frames.filter(({ markerId }) => markerId === "alpha").length,
    beta: frames.filter(({ markerId }) => markerId === "beta").length,
  };
  const duplicate = counts.alpha > 1 || counts.beta > 1;
  const moved = frames.some(({ markerId, rowIndex, startCodePointIndex }) => {
    if (markerId === null) return false;
    const expectedRowIndex = markerId === "alpha" ? 1 : 3;
    return (
      rowIndex !== expectedRowIndex ||
      startCodePointIndex !== expected.rows[expectedRowIndex].carrierCodePointIndex
    );
  });
  const frameState = mixed
    ? "mixed"
    : duplicate
      ? "duplicate"
      : damaged
        ? "damaged"
        : moved
          ? "moved"
          : counts.alpha === 0 || counts.beta === 0
            ? "missing"
            : "exact";
  const visibleTextState =
    visibleRows.length === 4 &&
    visibleRows.every((row, index) => row === expected.rows[index]?.visibleText)
      ? "exact"
      : "mismatch";
  const defaultIgnorableState = unexpectedDefaultIgnorable
    ? "unexpected"
    : "allowlisted-only";
  const visibleText = visibleRows.join("\n");
  const nfcState = visibleText.normalize("NFC") === visibleText ? "stable" : "mismatch";
  const nfkcState = visibleText.normalize("NFKC") === visibleText ? "stable" : "mismatch";
  const segmentation = segmentationFor(visibleRows, caseId);
  const segmentationState = visibleTextState === "exact" ? "expected" : "mismatch";
  const findings: JoinControlQualificationTextInspection["findings"][number][] = [];
  if (frameState !== "exact" || visibleTextState !== "exact") {
    findings.push("clipboard-mismatch");
  }
  if (defaultIgnorableState !== "allowlisted-only") {
    findings.push("unexpected-default-ignorable");
  }
  if (nfcState !== "stable" || nfkcState !== "stable") {
    findings.push("normalization-mismatch");
  }
  if (segmentationState !== "expected") findings.push("segmentation-mismatch");

  return {
    caseId,
    checkpointId,
    lineEndings,
    frameState,
    visibleTextState,
    defaultIgnorableState,
    nfcState,
    nfkcState,
    segmentationState,
    segmentation,
    nodeVersion: process.versions.node,
    icuVersion: process.versions.icu ?? "",
    unicodeVersion: process.versions.unicode ?? "",
    findings,
  };
}
