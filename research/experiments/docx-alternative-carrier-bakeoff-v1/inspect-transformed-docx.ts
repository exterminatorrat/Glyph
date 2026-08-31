import { strFromU8, unzipSync, type Unzipped } from "fflate";
import {
  DOMParser,
  type Document as XmlDocument,
  type Element as XmlElement,
  type Node as XmlNode,
} from "@xmldom/xmldom";
import type { AlternativeCarrierMarkerId } from "./fixture";

const WORDPROCESSINGML_NAMESPACE =
  "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const PACKAGE_RELATIONSHIPS_NAMESPACE =
  "http://schemas.openxmlformats.org/package/2006/relationships";
const CONTENT_TYPES_NAMESPACE =
  "http://schemas.openxmlformats.org/package/2006/content-types";
const REQUIRED_ENTRIES = [
  "[Content_Types].xml",
  "_rels/.rels",
  "word/document.xml",
] as const;

export type OOXMLTextLocation =
  | "body"
  | "header"
  | "footer"
  | "footnote"
  | "endnote"
  | "comments"
  | "other";

export type MarkerPresence = "present" | "absent";

export type MarkerRunFormat = Readonly<{
  hidden: boolean;
  color: string | null;
  sizeHalfPoints: number | null;
  sizeComplexScriptHalfPoints: number | null;
}>;

export type TransformedMarkerOccurrence = Readonly<{
  markerId: AlternativeCarrierMarkerId;
  partName: string;
  location: OOXMLTextLocation;
  paragraphIndex: number;
  runIndices: readonly number[];
  runFormats: readonly MarkerRunFormat[];
}>;

export type TransformedParagraphInspection = Readonly<{
  partName: string;
  location: OOXMLTextLocation;
  paragraphIndex: number;
  text: string;
}>;

export type TransformedDocxInspection = Readonly<{
  entries: readonly string[];
  paragraphs: readonly TransformedParagraphInspection[];
  markerPresence: Readonly<{
    alpha: MarkerPresence;
    beta: MarkerPresence;
  }>;
  markerOccurrences: readonly TransformedMarkerOccurrence[];
  safety: Readonly<{
    externalRelationships: readonly string[];
    unresolvedRelationshipTargets: readonly string[];
    activeContentEntries: readonly string[];
    activeRelationshipTypes: readonly string[];
    macroContentTypes: readonly string[];
  }>;
}>;

const TEXT_PART_ROOT_LOCATIONS: Readonly<
  Record<string, Exclude<OOXMLTextLocation, "body" | "other">>
> = {
  hdr: "header",
  ftr: "footer",
  footnotes: "footnote",
  endnotes: "endnote",
  comments: "comments",
};

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

const parseXml = (entries: Unzipped, entryName: string): XmlDocument => {
  const entry = entries[entryName];
  if (!entry) {
    throw new Error(`Missing XML entry: ${entryName}`);
  }

  const parserErrors: string[] = [];
  let document: XmlDocument;
  try {
    document = new DOMParser({
      onError: (level, message) => {
        parserErrors.push(`${level}: ${message}`);
      },
    }).parseFromString(strFromU8(entry), "application/xml");
  } catch {
    throw new Error(`Invalid XML entry ${entryName}`);
  }

  if (parserErrors.length > 0 || !document.documentElement) {
    throw new Error(`Invalid XML entry ${entryName}`);
  }
  return document;
};

const directChild = (
  node: XmlNode,
  namespaceURI: string,
  localName: string,
): XmlElement | undefined =>
  childElements(node).find((child) => isElement(child, namespaceURI, localName));

const attributeValue = (
  element: XmlElement,
  localName: string,
): string | null => {
  const value =
    element.getAttributeNS(WORDPROCESSINGML_NAMESPACE, localName) ||
    element.getAttribute(`w:${localName}`) ||
    element.getAttribute(localName);
  return value || null;
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

const formatForRun = (run: XmlElement): MarkerRunFormat => {
  const runProperties = directChild(
    run,
    WORDPROCESSINGML_NAMESPACE,
    "rPr",
  );
  const vanish = runProperties
    ? directChild(runProperties, WORDPROCESSINGML_NAMESPACE, "vanish")
    : undefined;
  const vanishValue = vanish ? attributeValue(vanish, "val") : null;

  return {
    hidden:
      vanish !== undefined &&
      (vanishValue === null ||
        new Set(["1", "true", "on"]).has(vanishValue.toLowerCase())),
    color: runProperties
      ? (() => {
          const color = directChild(
            runProperties,
            WORDPROCESSINGML_NAMESPACE,
            "color",
          );
          return color ? attributeValue(color, "val") : null;
        })()
      : null,
    sizeHalfPoints: numericAttributeValue(
      runProperties
        ? directChild(runProperties, WORDPROCESSINGML_NAMESPACE, "sz")
        : undefined,
      "val",
    ),
    sizeComplexScriptHalfPoints: numericAttributeValue(
      runProperties
        ? directChild(runProperties, WORDPROCESSINGML_NAMESPACE, "szCs")
        : undefined,
      "val",
    ),
  };
};

type RunInspection = Readonly<{
  text: string;
  format: MarkerRunFormat;
}>;

const inspectRuns = (paragraph: XmlElement): RunInspection[] =>
  childElements(paragraph)
    .filter((child) => isElement(child, WORDPROCESSINGML_NAMESPACE, "r"))
    .map((run) => ({
      text: descendantsByLocalName(run, "t")
        .filter((textElement) =>
          textElement.namespaceURI === WORDPROCESSINGML_NAMESPACE,
        )
        .map((textElement) => textElement.textContent ?? "")
        .join(""),
      format: formatForRun(run),
    }));

const relationshipSourcePart = (relationshipEntry: string): string => {
  if (relationshipEntry === "_rels/.rels") {
    return "";
  }
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
    if (!part || part === ".") {
      continue;
    }
    if (part === "..") {
      parts.pop();
    } else {
      parts.push(part);
    }
  }
  return parts.join("/");
};

const relationshipLabel = (
  entryName: string,
  relationship: XmlElement,
): string => {
  const type = relationship.getAttribute("Type");
  const target = relationship.getAttribute("Target");
  const targetMode = relationship.getAttribute("TargetMode");
  return `${entryName}: ${type} -> ${target}${targetMode ? ` [${targetMode}]` : ""}`;
};

const collectRelationshipSafety = (
  documents: ReadonlyMap<string, XmlDocument>,
  fileEntries: ReadonlySet<string>,
) => {
  const externalRelationships: string[] = [];
  const unresolvedRelationshipTargets: string[] = [];
  const activeRelationshipTypes: string[] = [];

  for (const [entryName, document] of documents) {
    if (!entryName.endsWith(".rels")) {
      continue;
    }
    for (const relationship of descendantsByLocalName(
      document,
      "Relationship",
    ).filter(
      (element) => element.namespaceURI === PACKAGE_RELATIONSHIPS_NAMESPACE,
    )) {
      const label = relationshipLabel(entryName, relationship);
      const type = relationship.getAttribute("Type") ?? "";
      const target = relationship.getAttribute("Target") ?? "";
      const targetMode = relationship.getAttribute("TargetMode");
      if (targetMode?.toLowerCase() === "external") {
        externalRelationships.push(label);
      } else if (!fileEntries.has(resolveRelationshipTarget(entryName, target))) {
        unresolvedRelationshipTargets.push(
          `${label} [target does not resolve to ${resolveRelationshipTarget(entryName, target)}]`,
        );
      }
      if (
        /(?:\/oleObject|\/package|\/control|\/attachedTemplate|\/aFChunk)$/i.test(
          type,
        )
      ) {
        activeRelationshipTypes.push(type);
      }
    }
  }

  return {
    externalRelationships,
    unresolvedRelationshipTargets,
    activeRelationshipTypes,
  };
};

const isActiveContentEntry = (entryName: string): boolean =>
  /^word\/(?:vbaProject\.bin|vbaData\.xml)$/i.test(entryName) ||
  /(?:^|\/)(?:activeX|embeddings|oleObject|webextensions|customUI|customXml)(?:\/|(?:\.[^/]*)?$)/i.test(
    entryName,
  );

const collectMacroContentTypes = (document: XmlDocument): string[] =>
  descendantsByLocalName(document, "Default")
    .concat(descendantsByLocalName(document, "Override"))
    .filter((element) => element.namespaceURI === CONTENT_TYPES_NAMESPACE)
    .map((element) => element.getAttribute("ContentType") ?? "")
    .filter((contentType) =>
      /(?:macroEnabled|vbaProject|activeX|oleObject)/i.test(contentType),
    );

const standardTextPartLocation = (
  entryName: string,
): OOXMLTextLocation | undefined => {
  if (/^word\/header[^/]*\.xml$/i.test(entryName)) {
    return "header";
  }
  if (/^word\/footer[^/]*\.xml$/i.test(entryName)) {
    return "footer";
  }
  if (entryName.toLowerCase() === "word/footnotes.xml") {
    return "footnote";
  }
  if (entryName.toLowerCase() === "word/endnotes.xml") {
    return "endnote";
  }
  if (entryName.toLowerCase() === "word/comments.xml") {
    return "comments";
  }
  return undefined;
};

const rootTextPartLocation = (
  document: XmlDocument,
): OOXMLTextLocation | undefined => {
  const root = document.documentElement;
  if (!root || root.namespaceURI !== WORDPROCESSINGML_NAMESPACE) {
    return undefined;
  }
  const rootName = localNameOf(root);
  if (rootName === "document") {
    return "body";
  }
  return TEXT_PART_ROOT_LOCATIONS[rootName];
};

const paragraphElements = (document: XmlDocument): XmlElement[] =>
  descendantsByLocalName(document, "p").filter((paragraph) =>
    isElement(paragraph, WORDPROCESSINGML_NAMESPACE, "p"),
  );

const findMarkerOccurrences = (
  partName: string,
  location: OOXMLTextLocation,
  paragraphIndex: number,
  runs: readonly RunInspection[],
  markers: Readonly<{ alpha: string; beta: string }>,
): TransformedMarkerOccurrence[] => {
  const runRanges: readonly (readonly [number, number])[] = (() => {
    let offset = 0;
    return runs.map((run) => {
      const start = offset;
      offset += run.text.length;
      return [start, offset] as const;
    });
  })();
  const occurrences: TransformedMarkerOccurrence[] = [];
  for (const markerId of ["alpha", "beta"] as const) {
    const marker = markers[markerId];
    if (marker.length === 0) {
      continue;
    }
    const paragraphText = runs.map((run) => run.text).join("");
    let markerStart = paragraphText.indexOf(marker);
    while (markerStart >= 0) {
      const markerEnd = markerStart + marker.length;
      const runIndices = runRanges.reduce<number[]>(
        (indices, [runStart, runEnd], runIndex) => {
          if (runStart < markerEnd && runEnd > markerStart) {
            indices.push(runIndex);
          }
          return indices;
        },
        [],
      );
      occurrences.push({
        markerId,
        partName,
        location,
        paragraphIndex,
        runIndices,
        runFormats: runIndices.map((runIndex) => runs[runIndex].format),
      });
      markerStart = paragraphText.indexOf(marker, markerStart + 1);
    }
  }
  return occurrences;
};

export function inspectTransformedDocx(
  bytes: Uint8Array,
  markers: Readonly<{
    alpha: string;
    beta: string;
  }>,
): TransformedDocxInspection {
  if (bytes.length < 2 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
    throw new Error("Not a ZIP/DOCX package");
  }

  let entries: Unzipped;
  try {
    entries = unzipSync(bytes);
  } catch {
    throw new Error("Invalid ZIP/DOCX package");
  }

  const fileEntries = Object.keys(entries)
    .filter((entryName) => !entryName.endsWith("/"))
    .sort();
  for (const requiredEntry of REQUIRED_ENTRIES) {
    if (!fileEntries.includes(requiredEntry)) {
      throw new Error(`Missing required DOCX entry: ${requiredEntry}`);
    }
  }

  const documents = new Map<string, XmlDocument>();
  for (const entryName of fileEntries.filter((name) =>
    /\.(?:xml|rels)$/i.test(name),
  )) {
    documents.set(entryName, parseXml(entries, entryName));
  }

  const document = documents.get("word/document.xml");
  if (
    !document?.documentElement ||
    !isElement(document.documentElement, WORDPROCESSINGML_NAMESPACE, "document")
  ) {
    throw new Error(
      "word/document.xml: expected WordprocessingML document root",
    );
  }

  const referencedPartNames = new Set<string>();
  const documentRelationships = documents.get(
    "word/_rels/document.xml.rels",
  );
  if (documentRelationships) {
    descendantsByLocalName(documentRelationships, "Relationship")
      .filter(
        (relationship) =>
          relationship.namespaceURI === PACKAGE_RELATIONSHIPS_NAMESPACE,
      )
      .forEach((relationship) => {
        const targetMode = relationship.getAttribute("TargetMode");
        const target = relationship.getAttribute("Target") ?? "";
        if (
          targetMode?.toLowerCase() !== "external"
        ) {
          const targetEntry = resolveRelationshipTarget(
            "word/_rels/document.xml.rels",
            target,
          );
          if (fileEntries.includes(targetEntry)) {
            referencedPartNames.add(targetEntry);
          }
        }
      });
  }

  const textPartLocation = (
    entryName: string,
    partDocument: XmlDocument,
  ): OOXMLTextLocation | undefined => {
    const rootLocation = rootTextPartLocation(partDocument);
    const standardLocation = standardTextPartLocation(entryName);

    if (entryName === "word/document.xml" && rootLocation === "body") {
      return "body";
    }
    if (
      standardLocation !== undefined &&
      rootLocation === standardLocation
    ) {
      return standardLocation;
    }
    if (referencedPartNames.has(entryName) && rootLocation !== undefined) {
      return rootLocation === "body" ? "other" : rootLocation;
    }
    return undefined;
  };

  const paragraphs: TransformedParagraphInspection[] = [];
  const markerOccurrences: TransformedMarkerOccurrence[] = [];
  const textParts = fileEntries
    .map((partName) => {
      const partDocument = documents.get(partName);
      if (!partDocument) {
        return undefined;
      }
      const location = textPartLocation(partName, partDocument);
      return location ? { partName, partDocument, location } : undefined;
    })
    .filter(
      (
        part,
      ): part is {
        partName: string;
        partDocument: XmlDocument;
        location: OOXMLTextLocation;
      } => part !== undefined,
    )
    .sort((left, right) => {
      if (left.location === "body") {
        return right.location === "body" ? 0 : -1;
      }
      if (right.location === "body") {
        return 1;
      }
      return left.partName.localeCompare(right.partName);
    });

  for (const { partName, partDocument, location } of textParts) {
    paragraphElements(partDocument).forEach((paragraph, paragraphIndex) => {
      const runs = inspectRuns(paragraph);
      paragraphs.push({
        partName,
        location,
        paragraphIndex,
        text: runs.map((run) => run.text).join(""),
      });
      markerOccurrences.push(
        ...findMarkerOccurrences(
          partName,
          location,
          paragraphIndex,
          runs,
          markers,
        ),
      );
    });
  }

  const relationshipSafety = collectRelationshipSafety(
    documents,
    new Set(fileEntries),
  );
  const contentTypes = documents.get("[Content_Types].xml");
  if (!contentTypes) {
    throw new Error("Missing XML entry: [Content_Types].xml");
  }

  return {
    entries: fileEntries,
    paragraphs,
    markerPresence: {
      alpha: markerOccurrences.some((occurrence) => occurrence.markerId === "alpha")
        ? "present"
        : "absent",
      beta: markerOccurrences.some((occurrence) => occurrence.markerId === "beta")
        ? "present"
        : "absent",
    },
    markerOccurrences,
    safety: {
      externalRelationships: relationshipSafety.externalRelationships,
      unresolvedRelationshipTargets:
        relationshipSafety.unresolvedRelationshipTargets,
      activeContentEntries: fileEntries.filter(isActiveContentEntry),
      activeRelationshipTypes: relationshipSafety.activeRelationshipTypes,
      macroContentTypes: collectMacroContentTypes(contentTypes),
    },
  };
}
