import { createHash } from "node:crypto";
import {
  DOMParser,
  type Document as XmlDocument,
  type Element as XmlElement,
  type Node as XmlNode,
} from "@xmldom/xmldom";
import { strFromU8, unzipSync, type Unzipped } from "fflate";
import {
  codePointLabel,
  decodeCarrier,
  isAnyCandidateCodePoint,
  isCandidateCodePoint,
  type DecodedFrame,
} from "./frame.ts";
import {
  SYNTHETIC_CORE_AUTHOR,
  VISIBLE_PARAGRAPHS,
  type CandidateId,
  type ZeroWidthMarkerId,
} from "./fixture.ts";

const WORDPROCESSINGML_NAMESPACE =
  "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const PACKAGE_RELATIONSHIPS_NAMESPACE =
  "http://schemas.openxmlformats.org/package/2006/relationships";
const CONTENT_TYPES_NAMESPACE =
  "http://schemas.openxmlformats.org/package/2006/content-types";
const DC_NAMESPACE = "http://purl.org/dc/elements/1.1/";
const CORE_PROPERTIES_NAMESPACE =
  "http://schemas.openxmlformats.org/package/2006/metadata/core-properties";
const REQUIRED_ENTRIES = [
  "[Content_Types].xml",
  "_rels/.rels",
  "word/document.xml",
] as const;
const FORBIDDEN_CARRIER_PROPERTIES = [
  "vanish",
  "webHidden",
  "specVanish",
] as const;
const SAFE_ENTRY_NAMES = new Set([
  "[Content_Types].xml",
  "_rels/.rels",
  "word/document.xml",
  "word/styles.xml",
  "word/settings.xml",
  "word/numbering.xml",
  "word/fontTable.xml",
  "word/theme/theme1.xml",
  "word/_rels/document.xml.rels",
  "docProps/core.xml",
  "docProps/app.xml",
  "docProps/custom.xml",
]);
const SAFE_ENUM_VALUES = new Set([
  "auto",
  "clear",
  "continuous",
  "default",
  "double",
  "dotted",
  "dashed",
  "left",
  "right",
  "center",
  "both",
  "none",
  "single",
  "solid",
  "yellow",
]);

export type InspectionMode = "source" | "transformed";
export type CoreMetadataClassification =
  | "absent"
  | "empty"
  | "synthetic_expected"
  | "non_synthetic_redacted";
export type OOXMLTextLocation =
  | "body"
  | "header"
  | "footer"
  | "footnote"
  | "endnote"
  | "comments"
  | "other";
export type PackageCodePointOccurrence = Readonly<{
  codePoint: string;
  partName: string;
  location: OOXMLTextLocation;
  paragraphIndex: number;
  runIndex: number;
  codePointIndex: number;
}>;
export type DocxCarrierOccurrence = Readonly<{
  markerId: ZeroWidthMarkerId;
  partName: string;
  location: OOXMLTextLocation;
  paragraphIndex: number;
  runIndices: readonly number[];
  codePointIndexes: readonly number[];
  codePointCount: number;
  codePoints: readonly string[];
  decodedFrame: DecodedFrame;
}>;
export type ForbiddenRunProperty = Readonly<{
  partName: string;
  paragraphIndex: number;
  runIndex: number;
  property: string;
}>;
export type CarrierRunProperty = Readonly<{
  partName: string;
  paragraphIndex: number;
  runIndex: number;
  property: string;
  valueClassification: "absent_value" | "safe_literal" | "redacted_literal";
  safeValue: string | null;
}>;
export type SafetyInspection = Readonly<{
  externalRelationships: readonly string[];
  unresolvedRelationshipTargets: readonly string[];
  activeContentEntries: readonly string[];
  activeRelationshipTypes: readonly string[];
  macroContentTypes: readonly string[];
}>;
export type ZeroWidthDocxInspection = Readonly<{
  candidateId: CandidateId;
  mode: InspectionMode;
  entries: readonly string[];
  carrierOccurrences: readonly DocxCarrierOccurrence[];
  markerPresence: Readonly<{
    alpha: "present" | "absent";
    beta: "present" | "absent";
  }>;
  frameErrors: readonly string[];
  unexpectedCandidateCodePoints: readonly PackageCodePointOccurrence[];
  visibleBodyParagraphs: readonly string[];
  normalization: Readonly<{
    nfc: "unchanged" | "changed";
    nfkc: "unchanged" | "changed";
  }>;
  carrierRunProperties: readonly CarrierRunProperty[];
  forbiddenRunProperties: readonly ForbiddenRunProperty[];
  coreMetadata: Readonly<{
    creator: CoreMetadataClassification;
    lastModifiedBy: CoreMetadataClassification;
  }>;
  safety: SafetyInspection;
}>;

type TextCodePoint = Readonly<{
  value: string;
  codePoint: number;
  codePointIndex: number;
}>;
type RunInspection = Readonly<{
  element: XmlElement;
  text: string;
  codePoints: readonly TextCodePoint[];
}>;
type ParagraphInspection = Readonly<{
  element: XmlElement;
  paragraphIndex: number;
  runs: readonly RunInspection[];
  codePoints: readonly TextCodePoint[];
  location: OOXMLTextLocation;
  partName: string;
}>;
type CarrierSequence = Readonly<{
  paragraph: ParagraphInspection;
  start: number;
  end: number;
  points: readonly TextCodePoint[];
  runIndices: readonly number[];
  decodedFrame: DecodedFrame | null;
  error: string | null;
}>;
type StyleDefinition = Readonly<{
  id: string;
  basedOn: string | null;
  runProperties: XmlElement | undefined;
  unresolved: boolean;
}>;
type StyleContext = Readonly<{
  definitions: ReadonlyMap<string, StyleDefinition>;
  defaults: XmlElement | undefined;
}>;
type EffectiveStyles = Readonly<{
  properties: ReadonlyMap<string, XmlElement>;
  unresolved: boolean;
}>;

const markerIds = ["alpha", "beta"] as const;

const localNameOf = (element: XmlElement): string =>
  element.localName ?? element.nodeName.split(":").pop() ?? element.nodeName;

const isElement = (
  node: XmlNode | null,
  namespaceURI: string,
  localName: string,
): node is XmlElement =>
  node?.nodeType === 1 &&
  (node as XmlElement).namespaceURI === namespaceURI &&
  localNameOf(node as XmlElement) === localName;

const childElements = (node: XmlNode | null | undefined): XmlElement[] => {
  const elements: XmlElement[] = [];
  if (!node) return elements;
  for (let index = 0; index < node.childNodes.length; index += 1) {
    const child = node.childNodes.item(index);
    if (child?.nodeType === 1) {
      elements.push(child as XmlElement);
    }
  }
  return elements;
};

const descendants = (node: XmlNode): XmlElement[] => {
  const matches: XmlElement[] = [];
  const visit = (current: XmlNode): void => {
    for (let index = 0; index < current.childNodes.length; index += 1) {
      const child = current.childNodes.item(index);
      if (!child || child.nodeType !== 1) {
        continue;
      }
      const element = child as XmlElement;
      matches.push(element);
      visit(element);
    }
  };
  visit(node);
  return matches;
};

const descendantsByLocalName = (
  node: XmlNode,
  localName: string,
  namespaceURI?: string,
): XmlElement[] =>
  descendants(node).filter(
    (element) =>
      localNameOf(element) === localName &&
      (namespaceURI === undefined || element.namespaceURI === namespaceURI),
  );

const directChild = (
  node: XmlNode | null | undefined,
  namespaceURI: string,
  localName: string,
): XmlElement | undefined =>
  childElements(node).find((child) => isElement(child, namespaceURI, localName));

const attributeValue = (
  element: XmlElement | undefined,
  localName: string,
  namespaceURI = WORDPROCESSINGML_NAMESPACE,
): string | null => {
  if (!element) return null;
  const namespaced = element.getAttributeNS(namespaceURI, localName);
  if (namespaced) return namespaced;
  const prefixed = element.getAttribute(`w:${localName}`);
  if (prefixed) return prefixed;
  const plain = element.getAttribute(localName);
  return plain || null;
};

const hasAttribute = (
  element: XmlElement,
  localName: string,
  namespaceURI = WORDPROCESSINGML_NAMESPACE,
): boolean =>
  element.hasAttributeNS(namespaceURI, localName) ||
  element.hasAttribute(`w:${localName}`) ||
  element.hasAttribute(localName);

const safeHash = (value: string): string =>
  createHash("sha256").update(value).digest("hex").slice(0, 16);

const safeEntryName = (entryName: string): string => {
  if (
    SAFE_ENTRY_NAMES.has(entryName) ||
    /^word\/(?:header|footer)\d+\.xml$/i.test(entryName) ||
    /^word\/_rels\/(?:header|footer)\d+\.xml\.rels$/i.test(entryName) ||
    /^word\/(?:footnotes|endnotes|comments)\.xml$/i.test(entryName) ||
    /^word\/_rels\/(?:footnotes|endnotes|comments)\.xml\.rels$/i.test(entryName)
  ) {
    return entryName;
  }
  return `entry-redacted-${safeHash(entryName)}`;
};

const safePartName = safeEntryName;

const parseXml = (entries: Unzipped, entryName: string): XmlDocument => {
  const entry = entries[entryName];
  if (!entry) {
    throw new Error("Invalid DOCX package XML entry");
  }
  const parserErrors: string[] = [];
  let document: XmlDocument;
  try {
    document = new DOMParser({
      onError: (_level, message) => parserErrors.push(message),
    }).parseFromString(strFromU8(entry), "application/xml");
  } catch {
    throw new Error("Invalid XML entry");
  }
  if (parserErrors.length > 0 || !document.documentElement) {
    throw new Error("Invalid XML entry");
  }
  return document;
};

const isXmlEntry = (entryName: string): boolean =>
  /\.xml$/i.test(entryName) || /\.rels$/i.test(entryName);

const unzipDocx = (bytes: Uint8Array): Unzipped => {
  let entries: Unzipped;
  try {
    entries = unzipSync(bytes);
  } catch {
    throw new Error("Invalid DOCX ZIP package");
  }
  if (
    REQUIRED_ENTRIES.some(
      (entryName) => !entries[entryName] || entries[entryName]?.length === 0,
    )
  ) {
    throw new Error("Invalid DOCX ZIP package");
  }
  return entries;
};

const textFromRun = (run: XmlElement): string => {
  const chunks: string[] = [];
  const visit = (node: XmlNode): void => {
    for (let index = 0; index < node.childNodes.length; index += 1) {
      const child = node.childNodes.item(index);
      if (!child || child.nodeType !== 1) continue;
      const element = child as XmlElement;
      if (
        element.namespaceURI === WORDPROCESSINGML_NAMESPACE &&
        localNameOf(element) === "rPr"
      ) continue;
      const localName = localNameOf(element);
      if (localName === "t" || localName === "delText" || localName === "instrText") {
        chunks.push(element.textContent ?? "");
      } else if (localName === "tab") {
        chunks.push("\t");
      } else if (localName === "br" || localName === "cr") {
        chunks.push("\n");
      } else {
        visit(element);
      }
    }
  };
  visit(run);
  return chunks.join("");
};

const codePointEntries = (text: string, offset = 0): TextCodePoint[] =>
  [...text].map((value, index) => ({
    value,
    codePoint: value.codePointAt(0) ?? -1,
    codePointIndex: offset + index,
  }));

const textPartsLocation = (entryName: string): OOXMLTextLocation => {
  if (entryName.toLowerCase() === "word/document.xml") return "body";
  if (/^word\/header\d+\.xml$/i.test(entryName)) return "header";
  if (/^word\/footer\d+\.xml$/i.test(entryName)) return "footer";
  if (entryName.toLowerCase() === "word/footnotes.xml") return "footnote";
  if (entryName.toLowerCase() === "word/endnotes.xml") return "endnote";
  if (entryName.toLowerCase() === "word/comments.xml") return "comments";
  return "other";
};

const isWordTextPart = (entryName: string, document: XmlDocument): boolean =>
  entryName.toLowerCase() === "word/document.xml" ||
  (entryName.toLowerCase().startsWith("word/") &&
    document.documentElement?.namespaceURI === WORDPROCESSINGML_NAMESPACE &&
    ["hdr", "ftr", "footnotes", "endnotes", "comments"].includes(
      localNameOf(document.documentElement),
    ));

const paragraphInspections = (
  document: XmlDocument,
  partName: string,
): ParagraphInspection[] => {
  const location = textPartsLocation(partName);
  return descendantsByLocalName(document, "p", WORDPROCESSINGML_NAMESPACE).map(
    (paragraph, paragraphIndex) => {
      const runs = descendantsByLocalName(paragraph, "r", WORDPROCESSINGML_NAMESPACE).map(
        (run) => {
          const text = textFromRun(run);
          return {
            element: run,
            text,
            codePoints: codePointEntries(text),
          };
        },
      );
      let offset = 0;
      const normalizedRuns = runs.map((run) => {
        const codePoints = codePointEntries(run.text, offset);
        offset += codePoints.length;
        return { ...run, codePoints };
      });
      return {
        element: paragraph,
        paragraphIndex,
        runs: normalizedRuns,
        codePoints: normalizedRuns.flatMap((run) => run.codePoints),
        location,
        partName,
      };
    },
  );
};

const propertyChildren = (runProperties: XmlElement | undefined): XmlElement[] =>
  runProperties
    ? childElements(runProperties).filter(
        (child) => child.namespaceURI === WORDPROCESSINGML_NAMESPACE,
      )
    : [];

const enabledValue = (element: XmlElement): boolean | null => {
  const value = attributeValue(element, "val");
  if (value === null) return true;
  const normalized = value.toLowerCase();
  if (["1", "true", "on"].includes(normalized)) return true;
  if (["0", "false", "off"].includes(normalized)) return false;
  return null;
};

const parseStyles = (styles: XmlDocument | undefined): StyleContext => {
  if (!styles) return { definitions: new Map(), defaults: undefined };
  const definitions = new Map<string, StyleDefinition>();
  for (const style of descendantsByLocalName(styles, "style", WORDPROCESSINGML_NAMESPACE)) {
    const id = attributeValue(style, "styleId");
    if (!id) continue;
    const basedOnElement = directChild(style, WORDPROCESSINGML_NAMESPACE, "basedOn");
    const type = attributeValue(style, "type");
    const linked = directChild(style, WORDPROCESSINGML_NAMESPACE, "link");
    definitions.set(id, {
      id,
      basedOn: attributeValue(basedOnElement, "val"),
      runProperties: directChild(style, WORDPROCESSINGML_NAMESPACE, "rPr"),
      unresolved: linked !== undefined || (type !== null && !["character", "paragraph", "table", "numbering"].includes(type)),
    });
  }
  const defaults = directChild(
    directChild(styles.documentElement, WORDPROCESSINGML_NAMESPACE, "docDefaults") ?? styles.documentElement,
    WORDPROCESSINGML_NAMESPACE,
    "rPrDefault",
  );
  return {
    definitions,
    defaults: defaults ? directChild(defaults, WORDPROCESSINGML_NAMESPACE, "rPr") : undefined,
  };
};

const resolveStyle = (
  context: StyleContext,
  styleId: string,
  stack: readonly string[] = [],
): EffectiveStyles => {
  if (stack.includes(styleId)) {
    return { properties: new Map(), unresolved: true };
  }
  const definition = context.definitions.get(styleId);
  if (!definition) {
    return { properties: new Map(), unresolved: true };
  }
  const properties = new Map<string, XmlElement>();
  let unresolved = definition.unresolved;
  if (definition.basedOn) {
    const inherited = resolveStyle(context, definition.basedOn, [...stack, styleId]);
    inherited.properties.forEach((value, key) => properties.set(key, value));
    unresolved ||= inherited.unresolved;
  }
  propertyChildren(definition.runProperties).forEach((property) =>
    properties.set(localNameOf(property), property),
  );
  return { properties, unresolved };
};

const styleIdFromParagraph = (paragraph: XmlElement): string | null =>
  attributeValue(
    directChild(
      directChild(paragraph, WORDPROCESSINGML_NAMESPACE, "pPr"),
      WORDPROCESSINGML_NAMESPACE,
      "pStyle",
    ),
    "val",
  );

const styleIdsFromRun = (run: XmlElement): string[] => {
  const runProperties = directChild(run, WORDPROCESSINGML_NAMESPACE, "rPr");
  return propertyChildren(runProperties)
    .filter((property) => localNameOf(property) === "rStyle")
    .map((property) => attributeValue(property, "val"))
    .filter((value): value is string => value !== null);
};

const effectiveRunProperties = (
  context: StyleContext,
  paragraph: XmlElement,
  run: XmlElement,
): EffectiveStyles => {
  const properties = new Map<string, XmlElement>();
  let unresolved = false;
  propertyChildren(context.defaults).forEach((property) =>
    properties.set(localNameOf(property), property),
  );
  const paragraphStyleId = styleIdFromParagraph(paragraph);
  if (paragraphStyleId) {
    const inherited = resolveStyle(context, paragraphStyleId);
    inherited.properties.forEach((value, key) => properties.set(key, value));
    unresolved ||= inherited.unresolved;
  }
  for (const styleId of styleIdsFromRun(run)) {
    const inherited = resolveStyle(context, styleId);
    inherited.properties.forEach((value, key) => properties.set(key, value));
    unresolved ||= inherited.unresolved;
  }
  propertyChildren(directChild(run, WORDPROCESSINGML_NAMESPACE, "rPr")).forEach(
    (property) => properties.set(localNameOf(property), property),
  );
  return { properties, unresolved };
};

const propertyValue = (property: XmlElement): string | null => {
  const candidates = ["val", "fill", "color", "themeColor", "themeTint", "themeShade"];
  for (const name of candidates) {
    if (hasAttribute(property, name)) return attributeValue(property, name);
  }
  return null;
};

const safeLiteral = (
  property: XmlElement,
  value: string,
): boolean => {
  const localName = localNameOf(property);
  if (["color", "fill"].includes(localName)) return /^[0-9a-f]{6}$/i.test(value);
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return true;
  if (localName === "lang" && /^(?:[a-z]{2,3})(?:-[A-Za-z0-9]{2,8})*$/.test(value)) return true;
  return SAFE_ENUM_VALUES.has(value.toLowerCase()) ||
    ["0", "1", "true", "false", "on", "off"].includes(value.toLowerCase());
};

const propertyEvidence = (
  partName: string,
  paragraphIndex: number,
  runIndex: number,
  property: XmlElement,
): CarrierRunProperty => {
  const name = localNameOf(property);
  if (!hasAttribute(property, "val") && property.attributes.length === 0) {
    return {
      partName: safePartName(partName),
      paragraphIndex,
      runIndex,
      property: name,
      valueClassification: "absent_value",
      safeValue: null,
    };
  }
  const value = propertyValue(property);
  if (value !== null && safeLiteral(property, value)) {
    return {
      partName: safePartName(partName),
      paragraphIndex,
      runIndex,
      property: name,
      valueClassification: "safe_literal",
      safeValue: value,
    };
  }
  return {
    partName: safePartName(partName),
    paragraphIndex,
    runIndex,
    property: name,
    valueClassification: "redacted_literal",
    safeValue: null,
  };
};

const processSequences = (
  paragraph: ParagraphInspection,
  candidateId: CandidateId,
): CarrierSequence[] => {
  const sequences: CarrierSequence[] = [];
  let index = 0;
  while (index < paragraph.codePoints.length) {
    const point = paragraph.codePoints[index];
    if (!point || !isCandidateCodePoint(candidateId, point.codePoint)) {
      index += 1;
      continue;
    }
    const start = index;
    while (
      index < paragraph.codePoints.length &&
      isCandidateCodePoint(candidateId, paragraph.codePoints[index]?.codePoint ?? -1)
    ) {
      index += 1;
    }
    const points = paragraph.codePoints.slice(start, index);
    const runIndices = paragraph.runs.reduce<number[]>((indices, run, runIndex) => {
      if (run.codePoints.some(({ codePointIndex }) => codePointIndex >= points[0]!.codePointIndex && codePointIndex < points.at(-1)!.codePointIndex + 1)) {
        indices.push(runIndex);
      }
      return indices;
    }, []);
    let decodedFrame: DecodedFrame | null = null;
    let error: string | null = null;
    try {
      decodedFrame = decodeCarrier(candidateId, points.map(({ value }) => value).join(""));
    } catch (caught: unknown) {
      error = caught instanceof Error ? caught.message : `Candidate ${candidateId}: frame decode failed`;
    }
    sequences.push({ paragraph, start, end: index, points, runIndices, decodedFrame, error });
  }
  return sequences;
};

const safetyCode = (code: string, count: number): string[] =>
  Array.from({ length: count }, () => code);

const relationshipSourcePart = (relationshipEntry: string): string => {
  if (relationshipEntry === "_rels/.rels") return "";
  const match = relationshipEntry.match(/^(.*)\/_rels\/([^/]+)\.rels$/);
  return match ? `${match[1]}/${match[2]}` : "";
};

const resolveRelationshipTarget = (
  relationshipEntry: string,
  target: string,
): string => {
  const sourcePart = relationshipSourcePart(relationshipEntry);
  const targetPath = target.startsWith("/")
    ? target.slice(1)
    : `${sourcePart.replace(/[^/]*$/, "")}${target}`;
  const parts: string[] = [];
  for (const part of targetPath.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") parts.pop();
    else parts.push(part);
  }
  return parts.join("/");
};

const collectSafety = (
  entries: Unzipped,
  documents: ReadonlyMap<string, XmlDocument>,
): SafetyInspection => {
  let externalCount = 0;
  let unresolvedCount = 0;
  let activeRelationshipCount = 0;
  let macroCount = 0;
  for (const [entryName, document] of documents) {
    if (!entryName.endsWith(".rels")) continue;
    for (const relationship of descendantsByLocalName(
      document,
      "Relationship",
      PACKAGE_RELATIONSHIPS_NAMESPACE,
    )) {
      const target = relationship.getAttribute("Target") ?? "";
      const targetMode = relationship.getAttribute("TargetMode") ?? "";
      if (targetMode.toLowerCase() === "external") externalCount += 1;
      else if (!entries[resolveRelationshipTarget(entryName, target)]) unresolvedCount += 1;
      const type = relationship.getAttribute("Type") ?? "";
      if (/(?:\/oleObject|\/package|\/control|\/attachedTemplate|\/aFChunk)$/i.test(type)) {
        activeRelationshipCount += 1;
      }
    }
  }
  const contentTypes = documents.get("[Content_Types].xml");
  if (contentTypes) {
    for (const element of descendants(contentTypes)) {
      if (
        (localNameOf(element) === "Default" || localNameOf(element) === "Override") &&
        element.namespaceURI === CONTENT_TYPES_NAMESPACE &&
        /(?:macroEnabled|vbaProject|activeX|oleObject)/i.test(element.getAttribute("ContentType") ?? "")
      ) {
        macroCount += 1;
      }
    }
  }
  const activeContentCount = Object.keys(entries).filter((entryName) =>
    /^word\/(?:vbaProject\.bin|vbaData\.xml)$/i.test(entryName) ||
    /(?:^|\/)(?:activeX|embeddings|oleObject|webextensions|customUI|customXml)(?:\/|(?:\.[^/]*)?$)/i.test(entryName),
  ).length;
  return {
    externalRelationships: safetyCode("external-relationship", externalCount),
    unresolvedRelationshipTargets: safetyCode("unresolved-relationship", unresolvedCount),
    activeContentEntries: safetyCode("active-content-entry", activeContentCount),
    activeRelationshipTypes: safetyCode("active-relationship-type", activeRelationshipCount),
    macroContentTypes: safetyCode("macro-content-type", macroCount),
  };
};

const classifyCoreValue = (
  value: string | null,
): CoreMetadataClassification => {
  if (value === null) return "absent";
  if (value.trim() === "") return "empty";
  if (value === SYNTHETIC_CORE_AUTHOR) return "synthetic_expected";
  return "non_synthetic_redacted";
};

const coreValue = (
  document: XmlDocument | undefined,
  localName: string,
  namespaceURI: string,
): string | null => {
  const element = document
    ? descendantsByLocalName(document, localName, namespaceURI)[0]
    : undefined;
  return element ? element.textContent ?? "" : null;
};

const safeVisibleBodyParagraphs = (
  paragraphs: readonly string[],
): string[] =>
  paragraphs.map((paragraph, index) =>
    paragraph === VISIBLE_PARAGRAPHS[index] && index < VISIBLE_PARAGRAPHS.length
      ? paragraph
      : "redacted-visible-body",
  );

const standaloneSequences = (
  document: XmlDocument,
  partName: string,
  candidateId: CandidateId,
): {
  sequences: CarrierSequence[];
  unexpected: PackageCodePointOccurrence[];
} => {
  const root = document.documentElement;
  if (!root) return { sequences: [], unexpected: [] };
  const text = root.textContent ?? "";
  const points = codePointEntries(text);
  const paragraph = {
    element: root,
    paragraphIndex: 0,
    runs: [],
    codePoints: points,
    location: "other" as const,
    partName,
  };
  const sequences = processSequences(paragraph, candidateId);
  const unexpected = points
    .filter(
      ({ codePoint }) =>
        isAnyCandidateCodePoint(codePoint) && !isCandidateCodePoint(candidateId, codePoint),
    )
    .map(({ codePoint, codePointIndex }) => ({
      codePoint: codePointLabel(codePoint),
      partName: safePartName(partName),
      location: "other" as const,
      paragraphIndex: 0,
      runIndex: -1,
      codePointIndex,
    }));
  return { sequences, unexpected };
};

export function inspectZeroWidthDocx(
  bytes: Uint8Array,
  candidateId: CandidateId,
  mode: InspectionMode,
): ZeroWidthDocxInspection {
  const entries = unzipDocx(bytes);
  const entryNames = Object.keys(entries).sort();
  const documents = new Map<string, XmlDocument>();
  for (const entryName of entryNames.filter(isXmlEntry)) {
    documents.set(entryName, parseXml(entries, entryName));
  }

  const carrierOccurrences: DocxCarrierOccurrence[] = [];
  const frameErrors: string[] = [];
  const unexpectedCandidateCodePoints: PackageCodePointOccurrence[] = [];
  const carrierRunProperties: CarrierRunProperty[] = [];
  const forbiddenRunProperties: ForbiddenRunProperty[] = [];
  const removableBodyIndexes = new Set<string>();
  const markerPresence: {
    alpha: "present" | "absent";
    beta: "present" | "absent";
  } = { alpha: "absent", beta: "absent" };
  const markerSet = new Set<ZeroWidthMarkerId>();
  const bodyParagraphs: string[] = [];
  const allText: string[] = [];
  const styles = parseStyles(documents.get("word/styles.xml"));

  const addSequence = (sequence: CarrierSequence): void => {
    if (sequence.error) frameErrors.push(sequence.error);
    if (!sequence.decodedFrame) return;
    const { decodedFrame, paragraph, points, runIndices } = sequence;
    if (markerSet.has(decodedFrame.markerId)) {
      frameErrors.push(`Candidate ${candidateId}: duplicate ${decodedFrame.markerId} frame`);
    } else {
      markerSet.add(decodedFrame.markerId);
    }
    carrierOccurrences.push({
      markerId: decodedFrame.markerId,
      partName: safePartName(paragraph.partName),
      location: paragraph.location,
      paragraphIndex: paragraph.paragraphIndex,
      runIndices,
      codePointIndexes: points.map(({ codePointIndex }) => codePointIndex),
      codePointCount: points.length,
      codePoints: points.map(({ codePoint }) => codePointLabel(codePoint)),
      decodedFrame,
    });
    if (paragraph.location === "body" && paragraph.partName === "word/document.xml") {
      points.forEach(({ codePointIndex }) =>
        removableBodyIndexes.add(
          `${paragraph.partName}:${paragraph.paragraphIndex}:${codePointIndex}`,
        ),
      );
    }
  };

  for (const [partName, document] of documents) {
    if (!isWordTextPart(partName, document)) {
      if (partName === "[Content_Types].xml" || partName.endsWith(".rels")) continue;
      const standalone = standaloneSequences(document, partName, candidateId);
      standalone.sequences.forEach(addSequence);
      unexpectedCandidateCodePoints.push(...standalone.unexpected);
      allText.push(document.documentElement?.textContent ?? "");
      continue;
    }
    const paragraphs = paragraphInspections(document, partName);
    for (const paragraph of paragraphs) {
      allText.push(paragraph.codePoints.map(({ value }) => value).join(""));
      const sequences = processSequences(paragraph, candidateId);
      sequences.forEach((sequence) => {
        for (const runIndex of sequence.runIndices) {
          const run = paragraph.runs[runIndex];
          if (!run) continue;
          const properties = propertyChildren(directChild(run.element, WORDPROCESSINGML_NAMESPACE, "rPr"));
          properties.forEach((property) =>
            carrierRunProperties.push(propertyEvidence(partName, paragraph.paragraphIndex, runIndex, property)),
          );
          const effective = effectiveRunProperties(styles, paragraph.element, run.element);
          if (effective.unresolved) {
            forbiddenRunProperties.push({
              partName: safePartName(partName),
              paragraphIndex: paragraph.paragraphIndex,
              runIndex,
              property: "unresolved-style-inheritance",
            });
          }
          for (const propertyName of FORBIDDEN_CARRIER_PROPERTIES) {
            const property = effective.properties.get(propertyName);
            if (property && enabledValue(property) !== false) {
              forbiddenRunProperties.push({
                partName: safePartName(partName),
                paragraphIndex: paragraph.paragraphIndex,
                runIndex,
                property: propertyName,
              });
            }
          }
        }
        addSequence(sequence);
      });
      paragraph.codePoints.forEach(({ codePoint, codePointIndex }) => {
        if (
          isAnyCandidateCodePoint(codePoint) &&
          !isCandidateCodePoint(candidateId, codePoint)
        ) {
          unexpectedCandidateCodePoints.push({
            codePoint: codePointLabel(codePoint),
            partName: safePartName(partName),
            location: paragraph.location,
            paragraphIndex: paragraph.paragraphIndex,
            runIndex:
              paragraph.runs.findIndex((run) =>
                run.codePoints.some((point) => point.codePointIndex === codePointIndex),
              ),
            codePointIndex,
          });
        }
      });
      if (paragraph.location === "body" && partName === "word/document.xml") {
        const visible = paragraph.codePoints
          .filter(
            ({ codePointIndex }) =>
              !removableBodyIndexes.has(
                `${partName}:${paragraph.paragraphIndex}:${codePointIndex}`,
              ),
          )
          .map(({ value }) => value)
          .join("");
        bodyParagraphs.push(visible);
      }
    }
  }

  for (const markerId of markerIds) {
    if (markerSet.has(markerId)) markerPresence[markerId] = "present";
  }
  const core = documents.get("docProps/core.xml");
  const bodyText = bodyParagraphs.join("\n");
  const normalizationText = allText.concat(bodyText).join("\n");
  return {
    candidateId,
    mode,
    entries: entryNames.map(safeEntryName),
    carrierOccurrences,
    markerPresence,
    frameErrors,
    unexpectedCandidateCodePoints,
    visibleBodyParagraphs: safeVisibleBodyParagraphs(bodyParagraphs),
    normalization: {
      nfc:
        normalizationText.normalize("NFC") === normalizationText
          ? "unchanged"
          : "changed",
      nfkc:
        normalizationText.normalize("NFKC") === normalizationText
          ? "unchanged"
          : "changed",
    },
    carrierRunProperties,
    forbiddenRunProperties,
    coreMetadata: {
      creator: classifyCoreValue(
        coreValue(core, "creator", DC_NAMESPACE),
      ),
      lastModifiedBy: classifyCoreValue(
        coreValue(core, "lastModifiedBy", CORE_PROPERTIES_NAMESPACE),
      ),
    },
    safety: collectSafety(entries, documents),
  };
}
