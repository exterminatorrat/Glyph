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
  candidateDefinition,
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
const SAFE_PROPERTY_NAMES = new Set([
  "bdr",
  "bidi",
  "caps",
  "color",
  "cs",
  "eastAsianLayout",
  "effect",
  "emboss",
  "fitText",
  "highlight",
  "i",
  "iCs",
  "imprint",
  "kern",
  "lang",
  "noProof",
  "outline",
  "position",
  "rFonts",
  "rStyle",
  "rtl",
  "shadow",
  "shd",
  "smallCaps",
  "snapToGrid",
  "spacing",
  "specVanish",
  "sz",
  "szCs",
  "u",
  "vanish",
  "vertAlign",
  "webHidden",
  "w14:glow",
  "w14:shadow",
  "w14:reflection",
]);
const NON_ORDINARY_TEXT_ANCESTORS = new Set([
  "AlternateContent",
  "customXml",
  "del",
  "delText",
  "drawing",
  "fldChar",
  "fldData",
  "fldSimple",
  "hyperlink",
  "ins",
  "instrText",
  "moveFrom",
  "moveFromRangeEnd",
  "moveFromRangeStart",
  "moveTo",
  "moveToRangeEnd",
  "moveToRangeStart",
  "object",
  "pict",
  "ruby",
  "sdt",
  "sdtContent",
  "smartTag",
  "textbox",
  "txbxContent",
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
export type CarrierContext = "ordinary_body" | "non_ordinary";
export type CarrierAnchor = "alpha_frozen" | "beta_frozen" | "not_frozen";
export type DocxCarrierOccurrence = Readonly<{
  markerId: ZeroWidthMarkerId | null;
  partName: string;
  location: OOXMLTextLocation;
  paragraphIndex: number;
  runIndices: readonly number[];
  codePointIndexes: readonly number[];
  codePointCount: number;
  codePoints: readonly string[];
  decodedFrame: DecodedFrame | null;
  context: CarrierContext;
  anchor: CarrierAnchor;
  decodeError: string | null;
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
  ordinary: boolean;
}>;
type RunInspection = Readonly<{
  element: XmlElement;
  text: string;
  codePoints: readonly TextCodePoint[];
}>;
type UnhandledCodePointGroup = Readonly<{
  points: readonly TextCodePoint[];
  runIndex: number | null;
}>;
type ParagraphInspection = Readonly<{
  element: XmlElement;
  paragraphIndex: number;
  runs: readonly RunInspection[];
  codePoints: readonly TextCodePoint[];
  unhandledCodePointGroups: readonly UnhandledCodePointGroup[];
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
  ordinary: boolean;
}>;
type StyleType = "character" | "paragraph" | "table" | "numbering" | "unknown";
type StyleDefinition = Readonly<{
  id: string;
  type: StyleType;
  basedOn: string | null;
  runProperties: XmlElement | undefined;
  unresolved: boolean;
  isDefault: boolean;
}>;
type StyleContext = Readonly<{
  definitions: ReadonlyMap<string, StyleDefinition>;
  defaults: XmlElement | undefined;
  implicitDefaults: Readonly<{
    paragraph: string | null;
    character: string | null;
    paragraphUnresolved: boolean;
    characterUnresolved: boolean;
  }>;
  defaultsUnresolved: boolean;
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

const nearestAncestor = (
  node: XmlNode,
  namespaceURI: string,
  localName: string,
): XmlElement | null => {
  let current = node.parentNode;
  while (current) {
    if (isElement(current, namespaceURI, localName)) return current;
    current = current.parentNode;
  }
  return null;
};

const hasAncestor = (
  node: XmlNode,
  namespaceURI: string,
  localName: string,
): boolean => nearestAncestor(node, namespaceURI, localName) !== null;

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

type TextFragment = Readonly<{
  text: string;
  ordinary: boolean;
}>;

const isOrdinaryTextElement = (element: XmlElement): boolean => {
  if (
    element.namespaceURI !== WORDPROCESSINGML_NAMESPACE ||
    element.parentNode?.nodeType !== 1 ||
    (element.parentNode as XmlElement).namespaceURI !== WORDPROCESSINGML_NAMESPACE ||
    localNameOf(element.parentNode as XmlElement) !== "r"
  ) {
    return false;
  }
  let current: XmlNode | null = element;
  while (current) {
    if (current.nodeType === 1 && NON_ORDINARY_TEXT_ANCESTORS.has(localNameOf(current as XmlElement))) {
      return false;
    }
    current = current.parentNode;
  }
  return true;
};

const textFragmentsFromRun = (
  run: XmlElement,
  inField: boolean,
): TextFragment[] => {
  const chunks: TextFragment[] = [];
  const visit = (node: XmlNode): void => {
    for (let index = 0; index < node.childNodes.length; index += 1) {
      const child = node.childNodes.item(index);
      if (!child) continue;
      if (child.nodeType === 3) {
        const carrierText = [...(child.nodeValue ?? "")]
          .filter((value) => isAnyCandidateCodePoint(value.codePointAt(0) ?? -1))
          .join("");
        if (carrierText) chunks.push({ text: carrierText, ordinary: false });
        continue;
      }
      if (child.nodeType !== 1) continue;
      const element = child as XmlElement;
      if (
        element.namespaceURI === WORDPROCESSINGML_NAMESPACE &&
        localNameOf(element) === "p"
      ) continue;
      if (
        element.namespaceURI === WORDPROCESSINGML_NAMESPACE &&
        localNameOf(element) === "rPr"
      ) continue;
      const localName = localNameOf(element);
      if (
        element.namespaceURI === WORDPROCESSINGML_NAMESPACE &&
        (localName === "t" || localName === "delText" || localName === "instrText")
      ) {
        chunks.push({
          text: element.textContent ?? "",
          ordinary: !inField && isOrdinaryTextElement(element),
        });
      } else if (element.namespaceURI === WORDPROCESSINGML_NAMESPACE && localName === "tab") {
        chunks.push({
          text: "\t",
          ordinary: !inField && isOrdinaryTextElement(element),
        });
      } else if (
        element.namespaceURI === WORDPROCESSINGML_NAMESPACE &&
        (localName === "br" || localName === "cr")
      ) {
        chunks.push({
          text: "\n",
          ordinary: !inField && isOrdinaryTextElement(element),
        });
      } else {
        visit(element);
      }
    }
  };
  visit(run);
  return chunks;
};

const codePointEntries = (
  fragments: readonly TextFragment[],
  offset = 0,
): TextCodePoint[] => {
  let codePointIndex = offset;
  return fragments.flatMap(({ text, ordinary }) =>
    [...text].map((value) => ({
      value,
      codePoint: value.codePointAt(0) ?? -1,
      codePointIndex: codePointIndex++,
      ordinary,
    })),
  );
};

const unhandledParagraphCodePointGroups = (
  paragraph: XmlElement,
  runs: readonly RunInspection[],
): UnhandledCodePointGroup[] => {
  const groups: UnhandledCodePointGroup[] = [];
  let rawIndex = 0;
  const visit = (
    node: XmlNode,
    runIndex: number | null,
    inRunProperties: boolean,
  ): void => {
    for (let index = 0; index < node.childNodes.length; index += 1) {
      const child = node.childNodes.item(index);
      if (!child) continue;
      if (child.nodeType === 3) {
        const points: TextCodePoint[] = [];
        for (const value of [...(child.nodeValue ?? "")]) {
          const codePoint = value.codePointAt(0) ?? -1;
          if ((runIndex === null || inRunProperties) && isAnyCandidateCodePoint(codePoint)) {
            points.push({ value, codePoint, codePointIndex: rawIndex, ordinary: false });
          }
          rawIndex += 1;
        }
        if (points.length > 0) groups.push({ points, runIndex });
        continue;
      }
      if (child.nodeType !== 1) continue;
      const element = child as XmlElement;
      if (isElement(element, WORDPROCESSINGML_NAMESPACE, "p")) continue;
      const ownedRunIndex = isElement(element, WORDPROCESSINGML_NAMESPACE, "r")
        ? runs.findIndex(({ element: run }) => run === element)
        : -1;
      const nextRunIndex = ownedRunIndex >= 0 ? ownedRunIndex : runIndex;
      const nextInRunProperties =
        inRunProperties ||
        (nextRunIndex !== null && isElement(element, WORDPROCESSINGML_NAMESPACE, "rPr"));
      visit(element, nextRunIndex, nextInRunProperties);
    }
  };
  visit(paragraph, null, false);
  return groups;
};

type UnhandledPartCodePointGroup = Readonly<{
  points: readonly TextCodePoint[];
  location: OOXMLTextLocation;
}>;

const unhandledPartCodePointGroups = (
  document: XmlDocument,
  partName: string,
): UnhandledPartCodePointGroup[] => {
  const root = document.documentElement;
  if (!root) return [];
  const groups: UnhandledPartCodePointGroup[] = [];
  let rawIndex = 0;
  const visit = (node: XmlNode): void => {
    for (let index = 0; index < node.childNodes.length; index += 1) {
      const child = node.childNodes.item(index);
      if (!child) continue;
      if (child.nodeType === 3) {
        const points: TextCodePoint[] = [];
        for (const value of [...(child.nodeValue ?? "")]) {
          const codePoint = value.codePointAt(0) ?? -1;
          if (isAnyCandidateCodePoint(codePoint)) {
            points.push({ value, codePoint, codePointIndex: rawIndex, ordinary: false });
          }
          rawIndex += 1;
        }
        if (points.length > 0) {
          const location = partName.toLowerCase() === "word/document.xml"
            ? (hasAncestor(child, WORDPROCESSINGML_NAMESPACE, "body") ? "body" : "other")
            : textPartsLocation(partName);
          groups.push({ points, location });
        }
        continue;
      }
      if (child.nodeType !== 1) continue;
      const element = child as XmlElement;
      if (isElement(element, WORDPROCESSINGML_NAMESPACE, "p")) continue;
      visit(element);
    }
  };
  visit(root);
  return groups;
};

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
  return descendantsByLocalName(document, "p", WORDPROCESSINGML_NAMESPACE).map(
    (paragraph, paragraphIndex) => {
      let fieldDepth = 0;
      const ownedRunElements = descendantsByLocalName(
        paragraph,
        "r",
        WORDPROCESSINGML_NAMESPACE,
      ).filter(
        (run) => nearestAncestor(run, WORDPROCESSINGML_NAMESPACE, "p") === paragraph,
      );
      const runs = ownedRunElements.map(
        (run) => {
          const fieldChars = descendantsByLocalName(
            run,
            "fldChar",
            WORDPROCESSINGML_NAMESPACE,
          );
          const startsField = fieldChars.some(
            (fieldChar) =>
              attributeValue(fieldChar, "fldCharType")?.toLowerCase() === "begin",
          );
          const endsField = fieldChars.some(
            (fieldChar) =>
              attributeValue(fieldChar, "fldCharType")?.toLowerCase() === "end",
          );
          const fragments = textFragmentsFromRun(
            run,
            fieldDepth > 0 || startsField || endsField,
          );
          const text = fragments.map(({ text: value }) => value).join("");
          if (startsField) fieldDepth += 1;
          if (endsField) fieldDepth = Math.max(0, fieldDepth - 1);
          return {
            element: run,
            text,
            codePoints: codePointEntries(fragments),
          };
        },
      );
      let offset = 0;
      const normalizedRuns = runs.map((run) => {
        const fragments = run.codePoints.reduce<TextFragment[]>((entries, point) => {
          const previous = entries.at(-1);
          if (previous?.ordinary === point.ordinary) {
            entries[entries.length - 1] = {
              ...previous,
              text: `${previous.text}${point.value}`,
            };
          } else {
            entries.push({ text: point.value, ordinary: point.ordinary });
          }
          return entries;
        }, []);
        const codePoints = codePointEntries(fragments, offset);
        offset += codePoints.length;
        return { ...run, codePoints };
      });
      return {
        element: paragraph,
        paragraphIndex,
        runs: normalizedRuns,
        codePoints: normalizedRuns.flatMap((run) => run.codePoints),
        unhandledCodePointGroups: unhandledParagraphCodePointGroups(paragraph, normalizedRuns),
        location: partName.toLowerCase() === "word/document.xml"
          ? (hasAncestor(paragraph, WORDPROCESSINGML_NAMESPACE, "body") ? "body" : "other")
          : textPartsLocation(partName),
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

const styleTypeOf = (style: XmlElement): StyleType => {
  const type = attributeValue(style, "type");
  if (type === "character" || type === "paragraph" || type === "table" || type === "numbering") {
    return type;
  }
  return "unknown";
};

const styleDefaultOf = (style: XmlElement): boolean | null => {
  if (!hasAttribute(style, "default")) return false;
  const value = attributeValue(style, "default");
  if (value === null) return null;
  const normalized = value.toLowerCase();
  if (["1", "true", "on"].includes(normalized)) return true;
  if (["0", "false", "off"].includes(normalized)) return false;
  return null;
};

const parseStyles = (styles: XmlDocument | undefined): StyleContext => {
  if (!styles) {
    return {
      definitions: new Map(),
      defaults: undefined,
      implicitDefaults: {
        paragraph: null,
        character: null,
        paragraphUnresolved: false,
        characterUnresolved: false,
      },
      defaultsUnresolved: false,
    };
  }
  const definitions = new Map<string, StyleDefinition>();
  const defaultIds: Record<"paragraph" | "character", string[]> = {
    paragraph: [],
    character: [],
  };
  let defaultsUnresolved = false;
  for (const style of descendantsByLocalName(styles, "style", WORDPROCESSINGML_NAMESPACE)) {
    const id = attributeValue(style, "styleId");
    if (!id) continue;
    const type = styleTypeOf(style);
    const defaultValue = styleDefaultOf(style);
    const basedOnElement = directChild(style, WORDPROCESSINGML_NAMESPACE, "basedOn");
    const linked = directChild(style, WORDPROCESSINGML_NAMESPACE, "link");
    const definition: StyleDefinition = {
      id,
      type,
      basedOn: attributeValue(basedOnElement, "val"),
      runProperties: directChild(style, WORDPROCESSINGML_NAMESPACE, "rPr"),
      unresolved:
        linked !== undefined ||
        type === "unknown" ||
        defaultValue === null ||
        (basedOnElement !== undefined && attributeValue(basedOnElement, "val") === null),
      isDefault: defaultValue === true,
    };
    if (definitions.has(id)) {
      const previous = definitions.get(id)!;
      definitions.set(id, {
        ...definition,
        unresolved: true,
      });
      definitions.set(previous.id, {
        ...previous,
        unresolved: true,
      });
      defaultsUnresolved = true;
    } else {
      definitions.set(id, definition);
    }
    if (defaultValue === null) defaultsUnresolved = true;
    if (defaultValue === true) {
      if (type === "paragraph" || type === "character") {
        defaultIds[type].push(id);
      } else {
        defaultsUnresolved = true;
      }
    }
  }
  const docDefaultsElements = descendantsByLocalName(
    styles,
    "docDefaults",
    WORDPROCESSINGML_NAMESPACE,
  );
  const docDefaults = docDefaultsElements[0];
  if (docDefaultsElements.length > 1) defaultsUnresolved = true;
  const rPrDefaults = docDefaults
    ? childElements(docDefaults).filter(
        (child) => isElement(child, WORDPROCESSINGML_NAMESPACE, "rPrDefault"),
      )
    : [];
  if (rPrDefaults.length > 1) defaultsUnresolved = true;
  const defaults = rPrDefaults[0];
  const defaultRunProperties = defaults
    ? childElements(defaults).filter(
        (child) => isElement(child, WORDPROCESSINGML_NAMESPACE, "rPr"),
      )
    : [];
  if (defaultRunProperties.length > 1) defaultsUnresolved = true;
  const implicitDefault = (type: "paragraph" | "character") => ({
    id: defaultIds[type].length === 1 ? defaultIds[type][0]! : null,
    unresolved: defaultIds[type].length > 1,
  });
  const paragraphDefault = implicitDefault("paragraph");
  const characterDefault = implicitDefault("character");
  return {
    definitions,
    defaults: defaultRunProperties[0],
    implicitDefaults: {
      paragraph: paragraphDefault.id,
      character: characterDefault.id,
      paragraphUnresolved: paragraphDefault.unresolved,
      characterUnresolved: characterDefault.unresolved,
    },
    defaultsUnresolved,
  };
};

const resolveStyle = (
  context: StyleContext,
  styleId: string,
  expectedType: "paragraph" | "character",
  stack: readonly string[] = [],
): EffectiveStyles => {
  if (stack.includes(styleId)) {
    return { properties: new Map(), unresolved: true };
  }
  const definition = context.definitions.get(styleId);
  if (!definition) {
    return { properties: new Map(), unresolved: true };
  }
  if (definition.type !== expectedType) {
    return { properties: new Map(), unresolved: true };
  }
  const properties = new Map<string, XmlElement>();
  let unresolved = definition.unresolved;
  if (definition.basedOn) {
    const inherited = resolveStyle(
      context,
      definition.basedOn,
      expectedType,
      [...stack, styleId],
    );
    inherited.properties.forEach((value, key) => properties.set(key, value));
    unresolved ||= inherited.unresolved;
  }
  propertyChildren(definition.runProperties).forEach((property) =>
    properties.set(localNameOf(property), property),
  );
  return { properties, unresolved };
};

const styleIdsFromRun = (run: XmlElement): { ids: string[]; unresolved: boolean } => {
  const runProperties = directChild(run, WORDPROCESSINGML_NAMESPACE, "rPr");
  const styles = propertyChildren(runProperties).filter(
    (property) => localNameOf(property) === "rStyle",
  );
  return {
    ids: styles
      .map((property) => attributeValue(property, "val"))
      .filter((value): value is string => value !== null),
    unresolved:
      styles.length > 1 || styles.some((property) => attributeValue(property, "val") === null),
  };
};

const paragraphStyleReference = (
  paragraph: XmlElement,
): { id: string | null; unresolved: boolean } => {
  const pPr = directChild(paragraph, WORDPROCESSINGML_NAMESPACE, "pPr");
  const pStyle = directChild(pPr, WORDPROCESSINGML_NAMESPACE, "pStyle");
  return {
    id: attributeValue(pStyle, "val"),
    unresolved: pStyle !== undefined && attributeValue(pStyle, "val") === null,
  };
};

const effectiveRunProperties = (
  context: StyleContext,
  paragraph: XmlElement,
  run: XmlElement,
): EffectiveStyles => {
  const properties = new Map<string, XmlElement>();
  let unresolved = context.defaultsUnresolved;
  propertyChildren(context.defaults).forEach((property) =>
    properties.set(localNameOf(property), property),
  );
  const paragraphStyle = paragraphStyleReference(paragraph);
  if (paragraphStyle.id) {
    const inherited = resolveStyle(context, paragraphStyle.id, "paragraph");
    inherited.properties.forEach((value, key) => properties.set(key, value));
    unresolved ||= paragraphStyle.unresolved || inherited.unresolved;
  } else {
    unresolved ||= paragraphStyle.unresolved || context.implicitDefaults.paragraphUnresolved;
    if (context.implicitDefaults.paragraph) {
      const inherited = resolveStyle(
        context,
        context.implicitDefaults.paragraph,
        "paragraph",
      );
      inherited.properties.forEach((value, key) => properties.set(key, value));
      unresolved ||= inherited.unresolved;
    }
  }
  const runStyles = styleIdsFromRun(run);
  unresolved ||= runStyles.unresolved;
  if (runStyles.ids.length > 0) {
    for (const styleId of runStyles.ids) {
      const inherited = resolveStyle(context, styleId, "character");
      inherited.properties.forEach((value, key) => properties.set(key, value));
      unresolved ||= inherited.unresolved;
    }
  } else {
    unresolved ||= context.implicitDefaults.characterUnresolved;
    if (context.implicitDefaults.character) {
      const inherited = resolveStyle(
        context,
        context.implicitDefaults.character,
        "character",
      );
      inherited.properties.forEach((value, key) => properties.set(key, value));
      unresolved ||= inherited.unresolved;
    }
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
  const localName = localNameOf(property);
  const name = SAFE_PROPERTY_NAMES.has(localName)
    ? localName
    : `property-redacted-${safeHash(
        `${property.namespaceURI ?? ""}:${property.nodeName}`,
      )}`;
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
    sequences.push({
      paragraph,
      start,
      end: index,
      points,
      runIndices,
      decodedFrame,
      error,
      ordinary:
        paragraph.location === "body" && points.every(({ ordinary }) => ordinary),
    });
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

const coreValues = (
  document: XmlDocument | undefined,
  localName: string,
  namespaceURI: string,
): string[] =>
  document
    ? descendantsByLocalName(document, localName, namespaceURI).map(
        (element) => element.textContent ?? "",
      )
    : [];

const classifyCoreValues = (
  values: readonly string[],
): CoreMetadataClassification => {
  if (values.length === 0) return "absent";
  if (values.length !== 1) return "non_synthetic_redacted";
  return classifyCoreValue(values[0]!);
};

const safeVisibleBodyParagraphs = (
  paragraphs: readonly string[],
): string[] =>
  paragraphs.map((paragraph, index) =>
    paragraph === VISIBLE_PARAGRAPHS[index] && index < VISIBLE_PARAGRAPHS.length
      ? paragraph
      : "redacted-visible-body",
  );

const frozenAnchorParts = (markerId: ZeroWidthMarkerId): {
  paragraphIndex: number;
  prefix: string;
  suffix: string;
} => {
  const paragraphIndex = markerId === "alpha" ? 0 : 2;
  const paragraph = VISIBLE_PARAGRAPHS[paragraphIndex];
  const periodIndex = paragraph.indexOf(".");
  return {
    paragraphIndex,
    prefix: paragraph.slice(0, periodIndex + 1),
    suffix: paragraph.slice(periodIndex + 1),
  };
};

const sequenceRunContainsOnlyCarrier = (
  sequence: CarrierSequence,
): boolean => {
  const sequenceIndexes = new Set(
    sequence.points.map(({ codePointIndex }) => codePointIndex),
  );
  const runHasOnlyText = (run: XmlElement): boolean =>
    descendants(run).every((element) => {
      if (element === run) return true;
      let ancestor = element.parentNode;
      while (ancestor && ancestor !== run) {
        if (
          ancestor.nodeType === 1 &&
          localNameOf(ancestor as XmlElement) === "rPr"
        ) {
          return true;
        }
        ancestor = ancestor.parentNode;
      }
      return ["t", "delText", "instrText", "tab", "br", "cr"].includes(
        localNameOf(element),
      );
    });
  return sequence.runIndices.every((runIndex) => {
    const run = sequence.paragraph.runs[runIndex];
    if (!run || run.codePoints.length === 0) return false;
    return (
      runHasOnlyText(run.element) &&
      run.codePoints.every(({ codePointIndex }) => sequenceIndexes.has(codePointIndex))
    );
  });
};

const frozenAnchorFor = (
  sequence: CarrierSequence,
  candidateId: CandidateId,
  mode: InspectionMode,
): CarrierAnchor => {
  const decoded = sequence.decodedFrame;
  if (
    !decoded ||
    !sequence.ordinary ||
    (mode === "source" && !sequenceRunContainsOnlyCarrier(sequence))
  ) {
    return "not_frozen";
  }
  const anchor = frozenAnchorParts(decoded.markerId);
  if (
    sequence.paragraph.partName !== "word/document.xml" ||
    sequence.paragraph.location !== "body" ||
    sequence.paragraph.paragraphIndex !== anchor.paragraphIndex ||
    sequence.points.length !== candidateDefinition(candidateId).codePointsPerFrame
  ) {
    return "not_frozen";
  }
  const prefix = sequence.paragraph.codePoints
    .slice(0, sequence.start)
    .map(({ value }) => value)
    .join("");
  const suffix = sequence.paragraph.codePoints
    .slice(sequence.end)
    .map(({ value }) => value)
    .join("");
  return prefix === anchor.prefix && suffix === anchor.suffix
    ? `${decoded.markerId}_frozen`
    : "not_frozen";
};

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
  const points = codePointEntries([{ text, ordinary: false }]);
  const paragraph = {
    element: root,
    paragraphIndex: 0,
    runs: [],
    codePoints: points,
    unhandledCodePointGroups: [],
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
    const { paragraph, points, runIndices } = sequence;
    const context: CarrierContext = sequence.ordinary
      ? "ordinary_body"
      : "non_ordinary";
    const carrierOnly = sequenceRunContainsOnlyCarrier(sequence);
    const decodedFrame = sequence.ordinary ? sequence.decodedFrame : null;
    const anchor = frozenAnchorFor(
      { ...sequence, decodedFrame },
      candidateId,
      mode,
    );
    const decodeError = sequence.error ??
      (sequence.decodedFrame && !sequence.ordinary
        ? `Candidate ${candidateId}: non-ordinary carrier context`
        : null);
    if (decodeError) frameErrors.push(decodeError);
    if (decodedFrame) {
      if (markerSet.has(decodedFrame.markerId)) {
        frameErrors.push(`Candidate ${candidateId}: duplicate ${decodedFrame.markerId} frame`);
      } else {
        markerSet.add(decodedFrame.markerId);
      }
      if (mode === "source" && !carrierOnly) {
        frameErrors.push(`Candidate ${candidateId}: mixed carrier run`);
      }
      if (anchor === "not_frozen") {
        frameErrors.push(`Candidate ${candidateId}: carrier anchor is not frozen`);
      }
    }
    carrierOccurrences.push({
      markerId: decodedFrame?.markerId ?? null,
      partName: safePartName(paragraph.partName),
      location: paragraph.location,
      paragraphIndex: paragraph.paragraphIndex,
      runIndices,
      codePointIndexes: points.map(({ codePointIndex }) => codePointIndex),
      codePointCount: points.length,
      codePoints: points.map(({ codePoint }) => codePointLabel(codePoint)),
      decodedFrame,
      context,
      anchor,
      decodeError,
    });
    if (decodedFrame && sequence.ordinary && paragraph.location === "body" && paragraph.partName === "word/document.xml") {
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
      allText.push(
        paragraph.codePoints.map(({ value }) => value).join(""),
        ...paragraph.unhandledCodePointGroups.map(({ points }) =>
          points.map(({ value }) => value).join(""),
        ),
      );
      const sequences = [
        ...processSequences(paragraph, candidateId),
        ...paragraph.unhandledCodePointGroups.flatMap(({ points, runIndex }) =>
          processSequences(
            { ...paragraph, runs: [], codePoints: points, unhandledCodePointGroups: [] },
            candidateId,
          ).map((sequence) => ({
            ...sequence,
            runIndices: runIndex === null ? [] : [runIndex],
          })),
        ),
      ];
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
      paragraph.unhandledCodePointGroups.forEach(({ points, runIndex }) => {
        points.forEach(({ codePoint, codePointIndex }) => {
          if (
            isAnyCandidateCodePoint(codePoint) &&
            !isCandidateCodePoint(candidateId, codePoint)
          ) {
            unexpectedCandidateCodePoints.push({
              codePoint: codePointLabel(codePoint),
              partName: safePartName(partName),
              location: paragraph.location,
              paragraphIndex: paragraph.paragraphIndex,
              runIndex: runIndex ?? -1,
              codePointIndex,
            });
          }
        });
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
    for (const { points, location } of unhandledPartCodePointGroups(document, partName)) {
      const paragraph: ParagraphInspection = {
        element: document.documentElement!,
        paragraphIndex: -1,
        runs: [],
        codePoints: points,
        unhandledCodePointGroups: [],
        location,
        partName,
      };
      allText.push(points.map(({ value }) => value).join(""));
      processSequences(paragraph, candidateId).forEach(addSequence);
      points.forEach(({ codePoint, codePointIndex }) => {
        if (
          isAnyCandidateCodePoint(codePoint) &&
          !isCandidateCodePoint(candidateId, codePoint)
        ) {
          unexpectedCandidateCodePoints.push({
            codePoint: codePointLabel(codePoint),
            partName: safePartName(partName),
            location: paragraph.location,
            paragraphIndex: -1,
            runIndex: -1,
            codePointIndex,
          });
        }
      });
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
      creator: classifyCoreValues(coreValues(core, "creator", DC_NAMESPACE)),
      lastModifiedBy: classifyCoreValues(
        coreValues(core, "lastModifiedBy", CORE_PROPERTIES_NAMESPACE),
      ),
    },
    safety: collectSafety(entries, documents),
  };
}
