import {
  DOMParser,
  type Document as XmlDocument,
  type Element as XmlElement,
  type Node as XmlNode,
} from "@xmldom/xmldom";
import { strFromU8, unzipSync } from "fflate";
import {
  expectedCaseState,
  qualificationCase,
  type QualificationCaseId,
  type QualificationCheckpointId,
  type QualificationLanguage,
} from "./fixture.ts";
import {
  decodeCarrier,
  encodeCarrier,
  isAnyCandidateCodePoint,
  isCandidateCodePoint,
} from "../docx-zero-width-carrier-bakeoff-v1/frame.ts";
import { CANDIDATE_A } from "../docx-zero-width-carrier-bakeoff-v1/fixture.ts";
import {
  inspectZeroWidthDocx,
  type CoreMetadataClassification,
  type InspectionMode,
} from "../docx-zero-width-carrier-bakeoff-v1/inspect-zero-width-docx.ts";

const WORDPROCESSINGML_NAMESPACE =
  "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const CORE_PROPERTIES_NAMESPACE =
  "http://schemas.openxmlformats.org/package/2006/metadata/core-properties";
const DC_NAMESPACE = "http://purl.org/dc/elements/1.1/";
const FRAME_CODE_POINT_COUNT = 120;
const DEFAULT_IGNORABLE = /\p{Default_Ignorable_Code_Point}/u;

export type QualificationFailureCode =
  | "canonical-structure-failed"
  | "source-frame-failed"
  | "source-anchor-failed"
  | "transformed-frame-failed"
  | "transformed-anchor-failed"
  | "visible-text-mismatch"
  | "hidden-property-present"
  | "unexpected-default-ignorable"
  | "normalization-mismatch"
  | "segmentation-mismatch"
  | "package-unsafe"
  | "relationship-unsafe"
  | "macro-or-active-content";

export type QualificationFrameOccurrence = Readonly<{
  markerId: "alpha" | "beta" | null;
  checksumValid: boolean;
  context: "ordinary-body" | "non-ordinary";
  part: "word/document.xml" | "other-redacted";
  paragraphIndex: number;
  runIndices: readonly number[];
  startCodePointIndex: number;
  codePointCount: number;
  anchor: "expected" | "operation-expected" | "unexpected";
  finding: "none" | "damaged" | "duplicate" | "moved" | "mixed";
}>;

export type QualificationSegmentationRow = Readonly<{
  rowIndex: 0 | 1 | 2 | 3;
  locale: QualificationLanguage;
  graphemeCount: number;
  wordLikeCount: number;
  paragraphCount: 1;
}>;

export type JoinControlQualificationDocxInspection = Readonly<{
  mode: InspectionMode;
  caseId: QualificationCaseId;
  checkpointId: QualificationCheckpointId;
  frameState: "exact" | "missing" | "damaged" | "duplicate" | "moved" | "mixed";
  occurrences: readonly QualificationFrameOccurrence[];
  visibleTextState: "exact" | "mismatch";
  hiddenPropertyState: "absent" | "present" | "unresolved";
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
  packageSafetyState: "safe" | "unsafe";
  relationshipSafetyState: "safe" | "unsafe";
  macroOrActiveContent: "absent" | "present";
  coreMetadata: Readonly<{
    creator: CoreMetadataClassification;
    lastModifiedBy: CoreMetadataClassification;
    otherCore: CoreMetadataClassification;
  }>;
  findings: readonly QualificationFailureCode[];
}>;

type Point = Readonly<{
  value: string;
  codePoint: number;
  codePointIndex: number;
  runIndex: number;
}>;

type MutableOccurrence = {
  markerId: "alpha" | "beta" | null;
  checksumValid: boolean;
  context: "ordinary-body" | "non-ordinary";
  part: "word/document.xml" | "other-redacted";
  paragraphIndex: number;
  runIndices: number[];
  startCodePointIndex: number;
  codePointCount: number;
  anchor: "expected" | "operation-expected" | "unexpected";
  finding: "none" | "damaged" | "duplicate" | "moved" | "mixed";
};

const childElements = (
  node: XmlNode,
  namespace: string,
  localName: string,
): XmlElement[] => {
  const result: XmlElement[] = [];
  for (let child = node.firstChild; child; child = child.nextSibling) {
    if (
      child.nodeType === 1 &&
      (child as XmlElement).namespaceURI === namespace &&
      (child as XmlElement).localName === localName
    ) {
      result.push(child as XmlElement);
    }
  }
  return result;
};

const descendants = (
  node: XmlNode,
  namespace: string,
  localName: string,
): XmlElement[] => {
  const result: XmlElement[] = [];
  const visit = (candidate: XmlNode): void => {
    if (
      candidate.nodeType === 1 &&
      (candidate as XmlElement).namespaceURI === namespace &&
      (candidate as XmlElement).localName === localName
    ) {
      result.push(candidate as XmlElement);
    }
    for (let child = candidate.firstChild; child; child = child.nextSibling) visit(child);
  };
  visit(node);
  return result;
};

const firstChild = (
  node: XmlNode,
  namespace: string,
  localName: string,
): XmlElement | undefined => childElements(node, namespace, localName)[0];

const attribute = (element: XmlElement | undefined, name: string): string | null =>
  element?.getAttribute(`w:${name}`) ?? element?.getAttribute(name) ?? null;

const enabled = (element: XmlElement | undefined): boolean => {
  if (!element) return false;
  const value = attribute(element, "val")?.toLowerCase();
  return value !== "0" && value !== "false" && value !== "off" && value !== "no";
};

const parseXml = (value: Uint8Array): XmlDocument => {
  const errors: string[] = [];
  let document: XmlDocument;
  try {
    document = new DOMParser({
      onError: () => errors.push("invalid"),
    }).parseFromString(strFromU8(value), "application/xml");
  } catch {
    throw new Error("Malformed DOCX XML entry");
  }
  if (!document?.documentElement || errors.length > 0) {
    throw new Error("Malformed DOCX XML entry");
  }
  return document;
};

const paragraphPoints = (paragraph: XmlElement): Point[] => {
  const result: Point[] = [];
  let codePointIndex = 0;
  const allRuns = descendants(paragraph, WORDPROCESSINGML_NAMESPACE, "r");
  childElements(paragraph, WORDPROCESSINGML_NAMESPACE, "r").forEach(
    (run) => {
      const runIndex = allRuns.indexOf(run);
      const texts = childElements(run, WORDPROCESSINGML_NAMESPACE, "t");
      for (const text of texts) {
        for (const value of [...(text.textContent ?? "")]) {
          result.push({
            value,
            codePoint: value.codePointAt(0) ?? -1,
            codePointIndex,
            runIndex,
          });
          codePointIndex += 1;
        }
      }
    },
  );
  return result;
};

const carrierGroups = (points: readonly Point[]): Point[][] => {
  const result: Point[][] = [];
  let current: Point[] = [];
  for (const point of points) {
    if (isCandidateCodePoint(CANDIDATE_A.id, point.codePoint)) {
      current.push(point);
    } else if (current.length > 0) {
      result.push(current);
      current = [];
    }
  }
  if (current.length > 0) result.push(current);
  return result;
};

const unique = (values: readonly number[]): number[] => [...new Set(values)];

const isRestingCheckpoint = (checkpointId: QualificationCheckpointId): boolean =>
  checkpointId === "canonical" ||
  checkpointId === "roundtrip" ||
  checkpointId.endsWith("-restored");

const expectedAnchor = (
  markerId: "alpha" | "beta",
  paragraphIndex: number,
  startCodePointIndex: number,
  caseId: QualificationCaseId,
  checkpointId: QualificationCheckpointId,
): "expected" | "operation-expected" | "unexpected" => {
  const state = expectedCaseState(caseId, checkpointId);
  const row = state.rows[markerId === "alpha" ? 1 : 3];
  if (
    paragraphIndex !== (markerId === "alpha" ? 1 : 3) ||
    startCodePointIndex !== row.carrierCodePointIndex
  ) {
    return "unexpected";
  }
  return isRestingCheckpoint(checkpointId) ? "expected" : "operation-expected";
};

const sequenceOccurrence = (
  points: readonly Point[],
  paragraphIndex: number,
  context: "ordinary-body" | "non-ordinary",
  caseId: QualificationCaseId,
  checkpointId: QualificationCheckpointId,
): MutableOccurrence => {
  const value = points.map((point) => point.value).join("");
  try {
    const decoded = decodeCarrier(CANDIDATE_A.id, value);
    return {
      markerId: decoded.markerId,
      checksumValid: true,
      context,
      part: context === "ordinary-body" ? "word/document.xml" : "other-redacted",
      paragraphIndex,
      runIndices: unique(points.map((point) => point.runIndex)),
      startCodePointIndex: points[0]?.codePointIndex ?? -1,
      codePointCount: points.length,
      anchor:
        context === "ordinary-body"
          ? expectedAnchor(
              decoded.markerId,
              paragraphIndex,
              points[0]?.codePointIndex ?? -1,
              caseId,
              checkpointId,
            )
          : "unexpected",
      finding: context === "ordinary-body" ? "none" : "moved",
    };
  } catch {
    return {
      markerId: null,
      checksumValid: false,
      context,
      part: context === "ordinary-body" ? "word/document.xml" : "other-redacted",
      paragraphIndex,
      runIndices: unique(points.map((point) => point.runIndex)),
      startCodePointIndex: points[0]?.codePointIndex ?? -1,
      codePointCount: points.length,
      anchor: "unexpected",
      finding: "damaged",
    };
  }
};

const isAllowlistedVisibleGroup = (
  fixtureCase: ReturnType<typeof qualificationCase>,
  paragraphIndex: number,
  points: readonly Point[],
): boolean => {
  const actual = points.map(({ codePointIndex, codePoint }) => ({
    rowIndex: paragraphIndex,
    codePointIndex,
    codePoint,
  }));
  return actual.every((point) =>
    fixtureCase.legitimateJoinControls.some(
      (allowed) =>
        allowed.rowIndex === point.rowIndex &&
        allowed.codePointIndex === point.codePointIndex &&
        allowed.codePoint === point.codePoint,
    ),
  );
};

const isAllowlistedVisiblePoint = (
  fixtureCase: ReturnType<typeof qualificationCase>,
  paragraphIndex: number,
  point: Point,
): boolean =>
  fixtureCase.legitimateJoinControls.some(
    (allowed) =>
      allowed.rowIndex === paragraphIndex &&
      allowed.codePointIndex === point.codePointIndex &&
      allowed.codePoint === point.codePoint,
  );

const inspectBody = (
  document: XmlDocument,
  caseId: QualificationCaseId,
  checkpointId: QualificationCheckpointId,
): {
  occurrences: MutableOccurrence[];
  visibleRows: string[];
  unexpectedDefaultIgnorable: boolean;
  mixedAlphabet: boolean;
  unexpectedVisibleToken: boolean;
} => {
  const body = descendants(document, WORDPROCESSINGML_NAMESPACE, "body")[0];
  if (!body) throw new Error("DOCX is missing word/document.xml body");
  const paragraphs = childElements(body, WORDPROCESSINGML_NAMESPACE, "p");
  const fixtureCase = qualificationCase(caseId);
  const occurrences: MutableOccurrence[] = [];
  const visibleRows: string[] = [];
  let unexpectedDefaultIgnorable = false;
  let mixedAlphabet = false;
  const bodyRuns = descendants(
    body,
    WORDPROCESSINGML_NAMESPACE,
    "r",
  );
  const unexpectedVisibleToken = bodyRuns.some((run) => {
    for (let child = run.firstChild; child; child = child.nextSibling) {
      if (
        child.nodeType === 1 &&
        !(
          (child as XmlElement).namespaceURI === WORDPROCESSINGML_NAMESPACE &&
          ["rPr", "t"].includes((child as XmlElement).localName ?? "")
        )
      ) {
        return true;
      }
    }
    return false;
  });

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const points = paragraphPoints(paragraph);
    const removable = new Set<number>();
    for (const group of carrierGroups(points)) {
      if (isAllowlistedVisibleGroup(fixtureCase, paragraphIndex, group)) continue;
      if (group.length >= FRAME_CODE_POINT_COUNT) {
        for (let index = 0; index < group.length; index += FRAME_CODE_POINT_COUNT) {
          const chunk = group.slice(index, index + FRAME_CODE_POINT_COUNT);
          if (chunk.length === FRAME_CODE_POINT_COUNT) {
            const occurrence = sequenceOccurrence(
              chunk,
              paragraphIndex,
              "ordinary-body",
              caseId,
              checkpointId,
            );
            occurrences.push(occurrence);
            if (occurrence.checksumValid) {
              chunk.forEach((point) => removable.add(point.codePointIndex));
            } else {
              unexpectedDefaultIgnorable = true;
            }
          } else if (chunk.length > 0) {
            occurrences.push(
              sequenceOccurrence(chunk, paragraphIndex, "ordinary-body", caseId, checkpointId),
            );
            unexpectedDefaultIgnorable = true;
          }
        }
      } else {
        occurrences.push(
          sequenceOccurrence(group, paragraphIndex, "ordinary-body", caseId, checkpointId),
        );
        unexpectedDefaultIgnorable = true;
      }
    }

    for (const point of points) {
      if (
        isAnyCandidateCodePoint(point.codePoint) &&
        !isCandidateCodePoint(CANDIDATE_A.id, point.codePoint)
      ) {
        mixedAlphabet = true;
        unexpectedDefaultIgnorable = true;
      }
      if (
        DEFAULT_IGNORABLE.test(point.value) &&
        !removable.has(point.codePointIndex) &&
        !isAllowlistedVisiblePoint(fixtureCase, paragraphIndex, point)
      ) {
        unexpectedDefaultIgnorable = true;
      }
    }
    visibleRows.push(
      points
        .filter((point) => !removable.has(point.codePointIndex))
        .map((point) => point.value)
        .join(""),
    );
  });
  return {
    occurrences,
    visibleRows,
    unexpectedDefaultIgnorable,
    mixedAlphabet,
    unexpectedVisibleToken,
  };
};

const inspectNonOrdinary = (
  documents: ReadonlyMap<string, XmlDocument>,
  caseId: QualificationCaseId,
  checkpointId: QualificationCheckpointId,
): {
  occurrences: MutableOccurrence[];
  mixedAlphabet: boolean;
  unexpectedDefaultIgnorable: boolean;
  documentTextPresent: boolean;
} => {
  const occurrences: MutableOccurrence[] = [];
  let mixedAlphabet = false;
  let unexpectedDefaultIgnorable = false;
  let documentTextPresent = false;
  for (const [entryName, document] of documents) {
    const isDocumentPart = entryName === "word/document.xml";
    const fragments = xmlTextFragments(document, isDocumentPart);
    if (isDocumentPart && fragments.some((fragment) => fragment.length > 0)) {
      documentTextPresent = true;
    }
    for (const fragment of fragments) {
      const points = [...fragment].map((value, codePointIndex) => ({
        value,
        codePoint: value.codePointAt(0) ?? -1,
        codePointIndex,
        runIndex: -1,
      }));
      for (const point of points) {
        if (
          isAnyCandidateCodePoint(point.codePoint) &&
          !isCandidateCodePoint(CANDIDATE_A.id, point.codePoint)
        ) {
          mixedAlphabet = true;
        }
        if (DEFAULT_IGNORABLE.test(point.value)) {
          unexpectedDefaultIgnorable = true;
        }
      }
      for (const group of carrierGroups(points)) {
        for (let index = 0; index < group.length; index += FRAME_CODE_POINT_COUNT) {
          const chunk = group.slice(index, index + FRAME_CODE_POINT_COUNT);
          occurrences.push(
            sequenceOccurrence(chunk, -1, "non-ordinary", caseId, checkpointId),
          );
        }
      }
    }
  }
  return {
    occurrences,
    mixedAlphabet,
    unexpectedDefaultIgnorable,
    documentTextPresent,
  };
};

const isOrdinaryDocumentTextNode = (node: XmlNode): boolean => {
  const text = node.parentNode as XmlElement | null;
  const run = text?.parentNode as XmlElement | null;
  const paragraph = run?.parentNode as XmlElement | null;
  const body = paragraph?.parentNode as XmlElement | null;
  return (
    text?.namespaceURI === WORDPROCESSINGML_NAMESPACE &&
    text.localName === "t" &&
    run?.namespaceURI === WORDPROCESSINGML_NAMESPACE &&
    run.localName === "r" &&
    paragraph?.namespaceURI === WORDPROCESSINGML_NAMESPACE &&
    paragraph.localName === "p" &&
    body?.namespaceURI === WORDPROCESSINGML_NAMESPACE &&
    body.localName === "body"
  );
};

const xmlTextFragments = (
  document: XmlDocument,
  excludeOrdinaryDocumentText: boolean,
): string[] => {
  const paragraphs = descendants(document, WORDPROCESSINGML_NAMESPACE, "p");
  const values = paragraphs.flatMap((paragraph) => {
    const parts: string[] = [];
    const visit = (node: XmlNode): void => {
      if (
        (node.nodeType === 3 || node.nodeType === 4) &&
        (!excludeOrdinaryDocumentText || !isOrdinaryDocumentTextNode(node))
      ) {
        const value = node.nodeValue ?? "";
        if (value.trim().length > 0 || DEFAULT_IGNORABLE.test(value)) {
          parts.push(value);
        }
      }
      for (let child = node.firstChild; child; child = child.nextSibling) visit(child);
    };
    visit(paragraph);
    return parts.length > 0 ? [parts.join("")] : [];
  });

  const hasParagraphAncestor = (node: XmlNode): boolean => {
    for (let ancestor = node.parentNode; ancestor; ancestor = ancestor.parentNode) {
      if (
        ancestor.nodeType === 1 &&
        (ancestor as XmlElement).namespaceURI === WORDPROCESSINGML_NAMESPACE &&
        (ancestor as XmlElement).localName === "p"
      ) {
        return true;
      }
    }
    return false;
  };

  const allElements: XmlElement[] = [];
  const collectElements = (node: XmlNode): void => {
    if (node.nodeType === 1) allElements.push(node as XmlElement);
    for (let child = node.firstChild; child; child = child.nextSibling) {
      collectElements(child);
    }
  };
  collectElements(document);
  for (const element of allElements) {
    if (hasParagraphAncestor(element)) continue;
    const directText: string[] = [];
    for (let child = element.firstChild; child; child = child.nextSibling) {
      if (child.nodeType === 3 || child.nodeType === 4) {
        const value = child.nodeValue ?? "";
        if (value.trim().length > 0 || DEFAULT_IGNORABLE.test(value)) {
          directText.push(value);
        }
      }
    }
    if (directText.length > 0) values.push(directText.join(""));
  }
  return values;
};

const canonicalStructureMatches = (
  document: XmlDocument,
  documents: ReadonlyMap<string, XmlDocument>,
  caseId: QualificationCaseId,
): boolean => {
  const fixtureCase = qualificationCase(caseId);
  const body = descendants(document, WORDPROCESSINGML_NAMESPACE, "body")[0];
  if (!body) return false;
  const paragraphs = childElements(body, WORDPROCESSINGML_NAMESPACE, "p");
  if (paragraphs.length !== 4) return false;
  if (
    [...documents.keys()].some((name) =>
      /^word\/(header|footer)\d*\.xml$/u.test(name),
    )
  ) {
    return false;
  }
  const section = childElements(body, WORDPROCESSINGML_NAMESPACE, "sectPr")[0];
  const pageSize = section
    ? firstChild(section, WORDPROCESSINGML_NAMESPACE, "pgSz")
    : undefined;
  const margins = section
    ? firstChild(section, WORDPROCESSINGML_NAMESPACE, "pgMar")
    : undefined;
  if (
    attribute(pageSize, "w") !== "12240" ||
    attribute(pageSize, "h") !== "15840" ||
    attribute(margins, "top") !== "1440" ||
    attribute(margins, "right") !== "1440" ||
    attribute(margins, "bottom") !== "1440" ||
    attribute(margins, "left") !== "1440"
  ) {
    return false;
  }

  return paragraphs.every((paragraph, rowIndex) => {
    const row = fixtureCase.rows[rowIndex];
    if (!row) return false;
    const properties = firstChild(paragraph, WORDPROCESSINGML_NAMESPACE, "pPr");
    const bidi = properties
      ? firstChild(properties, WORDPROCESSINGML_NAMESPACE, "bidi")
      : undefined;
    if ((row.direction === "rtl") !== enabled(bidi)) return false;
    const runProperties = properties
      ? firstChild(properties, WORDPROCESSINGML_NAMESPACE, "rPr")
      : undefined;
    if (!runProperties) return false;
    const fonts = firstChild(runProperties, WORDPROCESSINGML_NAMESPACE, "rFonts");
    const size = firstChild(runProperties, WORDPROCESSINGML_NAMESPACE, "sz");
    const language = firstChild(runProperties, WORDPROCESSINGML_NAMESPACE, "lang");
    const rtl = firstChild(runProperties, WORDPROCESSINGML_NAMESPACE, "rtl");
    if (
      attribute(fonts, "ascii") !== "Arial" ||
      attribute(fonts, "hAnsi") !== "Arial" ||
      attribute(fonts, "cs") !== "Arial" ||
      attribute(size, "val") !== "22" ||
      attribute(language, "val") !== row.language ||
      (row.direction === "rtl") !== enabled(rtl)
    ) {
      return false;
    }
    if (
      row.direction === "rtl" &&
      attribute(language, "bidi") !== row.language
    ) {
      return false;
    }
    const runs = childElements(paragraph, WORDPROCESSINGML_NAMESPACE, "r");
    if (runs.length !== (row.markerId === null ? 2 : 3)) return false;
    const runText = (run: XmlElement): string =>
      childElements(run, WORDPROCESSINGML_NAMESPACE, "t")
        .map((text) => text.textContent ?? "")
        .join("");
    const expectedRow = expectedCaseState(caseId, "canonical").rows[rowIndex];
    const expectedPoints = [...expectedRow.visibleText];
    const expectedBefore = expectedPoints
      .slice(0, expectedRow.carrierCodePointIndex)
      .join("");
    const expectedAfter = expectedPoints
      .slice(expectedRow.carrierCodePointIndex)
      .join("");
    if (row.markerId === null) {
      return runText(runs[0] as XmlElement) === expectedBefore &&
        runText(runs[1] as XmlElement) === expectedAfter;
    }
    return (
      runText(runs[0] as XmlElement) === expectedBefore &&
      runText(runs[1] as XmlElement) === encodeCarrier(CANDIDATE_A.id, row.markerId) &&
      runText(runs[2] as XmlElement) === expectedAfter &&
      firstChild(runs[1] as XmlElement, WORDPROCESSINGML_NAMESPACE, "rPr") === undefined
    );
  });
};

const segmentationFor = (
  visibleRows: readonly string[],
  caseId: QualificationCaseId,
): JoinControlQualificationDocxInspection["segmentation"] => {
  const fixtureCase = qualificationCase(caseId);
  return fixtureCase.rows.map((row, rowIndex) => {
    const text = visibleRows[rowIndex] ?? "";
    const locale = row.language;
    const graphemes = [...new Intl.Segmenter(locale, { granularity: "grapheme" }).segment(text)];
    const words = [...new Intl.Segmenter(locale, { granularity: "word" }).segment(text)];
    return {
      rowIndex: rowIndex as 0 | 1 | 2 | 3,
      locale,
      graphemeCount: graphemes.length,
      wordLikeCount: words.filter((segment) => segment.isWordLike).length,
      paragraphCount: 1 as const,
    };
  }) as unknown as JoinControlQualificationDocxInspection["segmentation"];
};

const classifyOtherCore = (
  core: XmlDocument | undefined,
): CoreMetadataClassification => {
  if (!core?.documentElement) return "absent";
  const values: string[] = [];
  const visit = (node: XmlNode): void => {
    if (node.nodeType === 1) {
      const element = node as XmlElement;
      const isCreator = element.namespaceURI === DC_NAMESPACE && element.localName === "creator";
      const isLastModifiedBy =
        element.namespaceURI === CORE_PROPERTIES_NAMESPACE &&
        element.localName === "lastModifiedBy";
      if (element !== core.documentElement && !isCreator && !isLastModifiedBy) {
        values.push(element.textContent ?? "");
        return;
      }
    }
    for (let child = node.firstChild; child; child = child.nextSibling) visit(child);
  };
  visit(core.documentElement);
  if (values.length === 0) return "absent";
  return values.some((value) => value.length > 0) ? "non_synthetic_redacted" : "empty";
};

const orderedUnique = (
  values: readonly QualificationFailureCode[],
): QualificationFailureCode[] => {
  const order: readonly QualificationFailureCode[] = [
    "canonical-structure-failed",
    "source-frame-failed",
    "source-anchor-failed",
    "transformed-frame-failed",
    "transformed-anchor-failed",
    "visible-text-mismatch",
    "hidden-property-present",
    "unexpected-default-ignorable",
    "normalization-mismatch",
    "segmentation-mismatch",
    "package-unsafe",
    "relationship-unsafe",
    "macro-or-active-content",
  ];
  const selected = new Set(values);
  return order.filter((value) => selected.has(value));
};

export function inspectJoinControlQualificationDocx(
  bytes: Uint8Array,
  caseId: QualificationCaseId,
  checkpointId: QualificationCheckpointId,
  mode: InspectionMode,
): JoinControlQualificationDocxInspection {
  qualificationCase(caseId);
  const entries = unzipSync(bytes);
  const documents = new Map<string, XmlDocument>();
  for (const [entryName, value] of Object.entries(entries)) {
    if (entryName.endsWith(".xml") || entryName.endsWith(".rels")) {
      documents.set(entryName, parseXml(value));
    }
  }
  const document = documents.get("word/document.xml");
  if (!document) throw new Error("DOCX is missing word/document.xml");

  const body = inspectBody(document, caseId, checkpointId);
  const nonOrdinary = inspectNonOrdinary(documents, caseId, checkpointId);
  const occurrences = [...body.occurrences, ...nonOrdinary.occurrences];
  if (body.mixedAlphabet || nonOrdinary.mixedAlphabet) {
    occurrences.push({
      markerId: null,
      checksumValid: false,
      context: "ordinary-body",
      part: "word/document.xml",
      paragraphIndex: -1,
      runIndices: [],
      startCodePointIndex: -1,
      codePointCount: 1,
      anchor: "unexpected",
      finding: "mixed",
    });
  }

  const markerCounts = {
    alpha: occurrences.filter(({ markerId }) => markerId === "alpha").length,
    beta: occurrences.filter(({ markerId }) => markerId === "beta").length,
  };
  const hasDuplicate = markerCounts.alpha > 1 || markerCounts.beta > 1;
  if (hasDuplicate) {
    occurrences
      .filter(({ markerId }) => markerId !== null)
      .forEach((occurrence) => {
        if (occurrence.markerId && markerCounts[occurrence.markerId] > 1) {
          occurrence.finding = "duplicate";
        }
      });
  }
  const hasDamaged = occurrences.some(({ finding }) => finding === "damaged");
  const hasMoved = occurrences.some(
    ({ markerId, context, paragraphIndex }) =>
      markerId !== null &&
      (context !== "ordinary-body" || paragraphIndex !== (markerId === "alpha" ? 1 : 3)),
  );
  const frameState = body.mixedAlphabet || nonOrdinary.mixedAlphabet
    ? "mixed"
    : hasDuplicate
      ? "duplicate"
      : hasDamaged
        ? "damaged"
        : hasMoved
          ? "moved"
          : markerCounts.alpha === 0 || markerCounts.beta === 0
            ? "missing"
            : "exact";

  const expected = expectedCaseState(caseId, checkpointId);
  const visibleTextState =
    body.visibleRows.length === 4 &&
    !body.unexpectedVisibleToken &&
    !nonOrdinary.documentTextPresent &&
    body.visibleRows.every((row, index) => row === expected.rows[index]?.visibleText)
      ? "exact"
      : "mismatch";
  const old = inspectZeroWidthDocx(bytes, CANDIDATE_A.id, "transformed");
  const validBodyRuns = new Set(
    occurrences
      .filter(
        ({ checksumValid, context, paragraphIndex }) =>
          checksumValid && context === "ordinary-body" && paragraphIndex >= 0,
      )
      .flatMap(({ paragraphIndex, runIndices }) =>
        runIndices.map((runIndex) => `${paragraphIndex}:${runIndex}`),
      ),
  );
  const linkedForbidden = old.forbiddenRunProperties.filter(
    ({ partName, paragraphIndex, runIndex }) =>
      partName === "word/document.xml" &&
      validBodyRuns.has(`${paragraphIndex}:${runIndex}`),
  );
  const hiddenPropertyState = linkedForbidden.some(
    ({ property }) => property === "unresolved-style-inheritance",
  )
    ? "unresolved"
    : linkedForbidden.length > 0
      ? "present"
      : "absent";
  const defaultIgnorableState =
    body.unexpectedDefaultIgnorable ||
    body.mixedAlphabet ||
    nonOrdinary.unexpectedDefaultIgnorable ||
    nonOrdinary.mixedAlphabet
    ? "unexpected"
    : "allowlisted-only";
  const allVisible = body.visibleRows.join("\n");
  const nfcState = allVisible.normalize("NFC") === allVisible ? "stable" : "mismatch";
  const nfkcState = allVisible.normalize("NFKC") === allVisible ? "stable" : "mismatch";
  const segmentation = segmentationFor(body.visibleRows, caseId);
  const segmentationState = visibleTextState === "exact" ? "expected" : "mismatch";
  const packageSafetyState =
    old.safety.activeContentEntries.length === 0 &&
    old.safety.activeRelationshipTypes.length === 0 &&
    old.safety.macroContentTypes.length === 0
      ? "safe"
      : "unsafe";
  const relationshipSafetyState =
    old.safety.externalRelationships.length === 0 &&
    old.safety.unresolvedRelationshipTargets.length === 0
      ? "safe"
      : "unsafe";
  const macroOrActiveContent = packageSafetyState === "safe" ? "absent" : "present";
  const anchorsValid = occurrences
    .filter(({ checksumValid }) => checksumValid)
    .every(({ anchor }) => anchor !== "unexpected");

  const findings: QualificationFailureCode[] = [];
  const sourceStructureMatches =
    mode !== "source" || canonicalStructureMatches(document, documents, caseId);
  if (frameState !== "exact") {
    findings.push(mode === "source" ? "source-frame-failed" : "transformed-frame-failed");
  }
  if (!anchorsValid) {
    findings.push(mode === "source" ? "source-anchor-failed" : "transformed-anchor-failed");
  }
  if (visibleTextState !== "exact") findings.push("visible-text-mismatch");
  if (hiddenPropertyState !== "absent") findings.push("hidden-property-present");
  if (defaultIgnorableState !== "allowlisted-only") {
    findings.push("unexpected-default-ignorable");
  }
  if (nfcState !== "stable" || nfkcState !== "stable") {
    findings.push("normalization-mismatch");
  }
  if (segmentationState !== "expected") findings.push("segmentation-mismatch");
  if (packageSafetyState !== "safe") findings.push("package-unsafe");
  if (relationshipSafetyState !== "safe") findings.push("relationship-unsafe");
  if (macroOrActiveContent !== "absent") findings.push("macro-or-active-content");
  if (mode === "source" && (!sourceStructureMatches || findings.length > 0)) {
    findings.push("canonical-structure-failed");
  }

  return {
    mode,
    caseId,
    checkpointId,
    frameState,
    occurrences,
    visibleTextState,
    hiddenPropertyState,
    defaultIgnorableState,
    nfcState,
    nfkcState,
    segmentationState,
    segmentation,
    nodeVersion: process.versions.node,
    icuVersion: process.versions.icu ?? "",
    unicodeVersion: process.versions.unicode ?? "",
    packageSafetyState,
    relationshipSafetyState,
    macroOrActiveContent,
    coreMetadata: {
      creator: old.coreMetadata.creator,
      lastModifiedBy: old.coreMetadata.lastModifiedBy,
      otherCore: classifyOtherCore(documents.get("docProps/core.xml")),
    },
    findings: orderedUnique(findings),
  };
}
