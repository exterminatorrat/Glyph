import { DOMParser, type Document as XmlDocument, type Element as XmlElement, type Node as XmlNode } from "@xmldom/xmldom";
import { strFromU8, unzipSync } from "fflate";
import {
  inspectTransformedDocx,
  type OOXMLTextLocation,
  type TransformedDocxInspection,
  type TransformedMarkerOccurrence,
} from "../docx-alternative-carrier-bakeoff-v1/inspect-transformed-docx.ts";

const WORDPROCESSINGML_NAMESPACE =
  "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

export type MarkerMechanismInspection = Readonly<{
  markerId: "alpha" | "beta";
  partName: string;
  location: OOXMLTextLocation;
  paragraphIndex: number;
  runIndex: number;
  directColorValue: string | null;
  themeColor: string | null;
  themeTint: string | null;
  themeShade: string | null;
  hidden: boolean;
  sizeHalfPoints: number | null;
  sizeComplexScriptHalfPoints: number | null;
  shadingFill: string | null;
  highlight: string | null;
  semanticDirectWhite: boolean;
  forbiddenProperties: readonly string[];
}>;

export type SemanticWhiteCarrierInspection = Readonly<{
  transformed: TransformedDocxInspection;
  markerMechanisms: readonly MarkerMechanismInspection[];
}>;

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

const childElements = (node: XmlNode): XmlElement[] => {
  const elements: XmlElement[] = [];
  for (let index = 0; index < node.childNodes.length; index += 1) {
    const child = node.childNodes.item(index);
    if (child?.nodeType === 1) {
      elements.push(child as XmlElement);
    }
  }
  return elements;
};

const descendantsByLocalName = (
  node: XmlNode,
  localName: string,
): XmlElement[] => {
  const matches: XmlElement[] = [];
  const visit = (current: XmlNode): void => {
    for (let index = 0; index < current.childNodes.length; index += 1) {
      const child = current.childNodes.item(index);
      if (!child || child.nodeType !== 1) {
        continue;
      }
      const element = child as XmlElement;
      if (localNameOf(element) === localName) {
        matches.push(element);
      }
      visit(element);
    }
  };
  visit(node);
  return matches;
};

const directChild = (
  node: XmlNode,
  localName: string,
): XmlElement | undefined =>
  childElements(node).find((child) =>
    isElement(child, WORDPROCESSINGML_NAMESPACE, localName),
  );

const attributeValue = (
  element: XmlElement,
  localName: string,
): string | null => {
  const value = element.getAttributeNS(WORDPROCESSINGML_NAMESPACE, localName);
  return value || null;
};

const hasAttribute = (element: XmlElement, localName: string): boolean =>
  element.hasAttributeNS(WORDPROCESSINGML_NAMESPACE, localName);

const attributeOrEmpty = (
  element: XmlElement | undefined,
  localName: string,
): string | null => {
  if (!element || !hasAttribute(element, localName)) {
    return null;
  }
  return attributeValue(element, localName) ?? "";
};

const numericAttributeValue = (
  element: XmlElement | undefined,
  localName: string,
): number | null => {
  const value = element ? attributeValue(element, localName) : null;
  if (value === null || value === "") {
    return null;
  }
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const enabledVanish = (element: XmlElement | undefined): boolean => {
  if (!element) {
    return false;
  }
  const value = attributeValue(element, "val");
  return (
    value === null ||
    new Set(["1", "true", "on"]).has(value.toLowerCase())
  );
};

const parseDocument = (bytes: Uint8Array): XmlDocument => {
  const entries = unzipSync(bytes);
  const entry = entries["word/document.xml"];
  if (!entry) {
    throw new Error("Missing XML entry: word/document.xml");
  }

  const parserErrors: string[] = [];
  const document = new DOMParser({
    onError: (level, message) => {
      parserErrors.push(`${level}: ${message}`);
    },
  }).parseFromString(strFromU8(entry), "application/xml");
  if (parserErrors.length > 0 || !document.documentElement) {
    throw new Error("Invalid XML entry word/document.xml");
  }
  return document;
};

const bodyParagraphs = (document: XmlDocument): XmlElement[] =>
  descendantsByLocalName(document, "p").filter((paragraph) =>
    isElement(paragraph, WORDPROCESSINGML_NAMESPACE, "p"),
  );

const bodyRuns = (paragraph: XmlElement): XmlElement[] =>
  childElements(paragraph).filter((run) =>
    isElement(run, WORDPROCESSINGML_NAMESPACE, "r"),
  );

const mechanismForRun = (
  occurrence: TransformedMarkerOccurrence,
  run: XmlElement,
): MarkerMechanismInspection => {
  const runProperties = directChild(run, "rPr");
  const colorElement = runProperties
    ? directChild(runProperties, "color")
    : undefined;
  const vanishElement = runProperties
    ? directChild(runProperties, "vanish")
    : undefined;
  const sizeElement = runProperties
    ? directChild(runProperties, "sz")
    : undefined;
  const sizeComplexScriptElement = runProperties
    ? directChild(runProperties, "szCs")
    : undefined;
  const shadingElement = runProperties
    ? directChild(runProperties, "shd")
    : undefined;
  const highlightElement = runProperties
    ? directChild(runProperties, "highlight")
    : undefined;

  const directColorValue = colorElement
    ? attributeValue(colorElement, "val")
    : null;
  const themeColor = attributeOrEmpty(colorElement, "themeColor");
  const themeTint = attributeOrEmpty(colorElement, "themeTint");
  const themeShade = attributeOrEmpty(colorElement, "themeShade");
  const hidden = enabledVanish(vanishElement);
  const sizeHalfPoints = numericAttributeValue(sizeElement, "val");
  const sizeComplexScriptHalfPoints = numericAttributeValue(
    sizeComplexScriptElement,
    "val",
  );
  const shadingFill = attributeOrEmpty(shadingElement, "fill");
  const highlight = attributeOrEmpty(highlightElement, "val");
  const forbiddenProperties: string[] = [];

  if (
    directColorValue === null ||
    !/^[0-9a-f]{6}$/i.test(directColorValue) ||
    directColorValue.toUpperCase() !== "FFFFFF"
  ) {
    forbiddenProperties.push("directColorValue");
  }
  if (themeColor !== null) {
    forbiddenProperties.push("themeColor");
  }
  if (themeTint !== null) {
    forbiddenProperties.push("themeTint");
  }
  if (themeShade !== null) {
    forbiddenProperties.push("themeShade");
  }
  if (hidden) {
    forbiddenProperties.push("hidden");
  }
  if (sizeElement !== undefined) {
    forbiddenProperties.push("sizeHalfPoints");
  }
  if (sizeComplexScriptElement !== undefined) {
    forbiddenProperties.push("sizeComplexScriptHalfPoints");
  }
  if (shadingElement !== undefined) {
    forbiddenProperties.push("shadingFill");
  }
  if (highlightElement !== undefined) {
    forbiddenProperties.push("highlight");
  }

  const semanticDirectWhite =
    directColorValue !== null &&
    /^[0-9a-f]{6}$/i.test(directColorValue) &&
    directColorValue.toUpperCase() === "FFFFFF" &&
    themeColor === null &&
    themeTint === null &&
    themeShade === null &&
    !hidden &&
    sizeHalfPoints === null &&
    sizeComplexScriptHalfPoints === null &&
    shadingFill === null &&
    highlight === null &&
    sizeElement === undefined &&
    sizeComplexScriptElement === undefined &&
    shadingElement === undefined &&
    highlightElement === undefined;

  return {
    markerId: occurrence.markerId,
    partName: occurrence.partName,
    location: occurrence.location,
    paragraphIndex: occurrence.paragraphIndex,
    runIndex: occurrence.runIndices[0] ?? -1,
    directColorValue,
    themeColor,
    themeTint,
    themeShade,
    hidden,
    sizeHalfPoints,
    sizeComplexScriptHalfPoints,
    shadingFill,
    highlight,
    semanticDirectWhite,
    forbiddenProperties,
  };
};

const unmappedMechanism = (
  occurrence: TransformedMarkerOccurrence,
  runIndex: number,
): MarkerMechanismInspection => ({
  markerId: occurrence.markerId,
  partName: occurrence.partName,
  location: occurrence.location,
  paragraphIndex: occurrence.paragraphIndex,
  runIndex,
  directColorValue: null,
  themeColor: null,
  themeTint: null,
  themeShade: null,
  hidden: false,
  sizeHalfPoints: null,
  sizeComplexScriptHalfPoints: null,
  shadingFill: null,
  highlight: null,
  semanticDirectWhite: false,
  forbiddenProperties: ["unmappedRun"],
});

const mechanismsForOccurrence = (
  occurrence: TransformedMarkerOccurrence,
  paragraphs: readonly XmlElement[],
): MarkerMechanismInspection[] => {
  const paragraph =
    occurrence.partName === "word/document.xml" && occurrence.location === "body"
      ? paragraphs[occurrence.paragraphIndex]
      : undefined;
  const runs = paragraph ? bodyRuns(paragraph) : [];

  return occurrence.runIndices.map((runIndex) => {
    const run = runs[runIndex];
    return run
      ? mechanismForRun(
          { ...occurrence, runIndices: [runIndex] },
          run,
        )
      : unmappedMechanism(occurrence, runIndex);
  });
};

export function inspectSemanticWhiteCarrier(
  bytes: Uint8Array,
  markers: Readonly<{ alpha: string; beta: string }>,
): SemanticWhiteCarrierInspection {
  const transformed = inspectTransformedDocx(bytes, markers);
  const document = parseDocument(bytes);
  const paragraphs = bodyParagraphs(document);
  const markerMechanisms = transformed.markerOccurrences.flatMap((occurrence) =>
    mechanismsForOccurrence(occurrence, paragraphs),
  );

  return { transformed, markerMechanisms };
}
