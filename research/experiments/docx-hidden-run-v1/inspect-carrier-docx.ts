import { strFromU8, unzipSync, type Unzipped } from "fflate";
import {
  DOMParser,
  type Document as XmlDocument,
  type Element as XmlElement,
  type Node as XmlNode,
} from "@xmldom/xmldom";

const WORDPROCESSINGML_NAMESPACE =
  "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const OFFICE_DOCUMENT_RELATIONSHIPS_NAMESPACE =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

const REQUIRED_ENTRIES = [
  "[Content_Types].xml",
  "_rels/.rels",
  "docProps/core.xml",
  "docProps/app.xml",
  "word/document.xml",
  "word/_rels/document.xml.rels",
  "word/comments.xml",
  "word/_rels/comments.xml.rels",
] as const;

const CANONICAL_ENTRIES = new Set([
  "[Content_Types].xml",
  "_rels/.rels",
  "docProps/app.xml",
  "docProps/core.xml",
  "docProps/custom.xml",
  "word/document.xml",
  "word/styles.xml",
  "word/numbering.xml",
  "word/settings.xml",
  "word/fontTable.xml",
  "word/footnotes.xml",
  "word/endnotes.xml",
  "word/comments.xml",
  "word/_rels/document.xml.rels",
  "word/_rels/comments.xml.rels",
  "word/_rels/fontTable.xml.rels",
  "word/_rels/footnotes.xml.rels",
  "word/_rels/endnotes.xml.rels",
]);

const FIXED_RELATIONSHIPS: Readonly<
  Record<string, readonly (readonly [string, string])[]>
> = {
  "_rels/.rels": [
    [
      `${OFFICE_DOCUMENT_RELATIONSHIPS_NAMESPACE}/officeDocument`,
      "word/document.xml",
    ],
    [
      "http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties",
      "docProps/core.xml",
    ],
    [
      `${OFFICE_DOCUMENT_RELATIONSHIPS_NAMESPACE}/extended-properties`,
      "docProps/app.xml",
    ],
    [
      `${OFFICE_DOCUMENT_RELATIONSHIPS_NAMESPACE}/custom-properties`,
      "docProps/custom.xml",
    ],
  ],
  "word/_rels/document.xml.rels": [
    [`${OFFICE_DOCUMENT_RELATIONSHIPS_NAMESPACE}/styles`, "styles.xml"],
    [
      `${OFFICE_DOCUMENT_RELATIONSHIPS_NAMESPACE}/numbering`,
      "numbering.xml",
    ],
    [`${OFFICE_DOCUMENT_RELATIONSHIPS_NAMESPACE}/settings`, "settings.xml"],
    [
      `${OFFICE_DOCUMENT_RELATIONSHIPS_NAMESPACE}/fontTable`,
      "fontTable.xml",
    ],
    [`${OFFICE_DOCUMENT_RELATIONSHIPS_NAMESPACE}/footnotes`, "footnotes.xml"],
    [`${OFFICE_DOCUMENT_RELATIONSHIPS_NAMESPACE}/endnotes`, "endnotes.xml"],
    [`${OFFICE_DOCUMENT_RELATIONSHIPS_NAMESPACE}/comments`, "comments.xml"],
  ],
};

const COMMENTS_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml";

export type CarrierRunInspection = Readonly<{
  paragraphIndex: number;
  runIndex: number;
  text: string;
  hidden: boolean;
}>;

export type CarrierDocxInspection = Readonly<{
  entries: readonly string[];
  runs: readonly CarrierRunInspection[];
  visibleParagraphs: readonly string[];
  externalRelationships: readonly string[];
  activeContentEntries: readonly string[];
  activeRelationshipTypes: readonly string[];
  macroContentTypes: readonly string[];
  unexpectedEntries: readonly string[];
  unexpectedRelationships: readonly string[];
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
        if (level !== "warning") {
          parserErrors.push(`${level}: ${message}`);
        }
      },
    }).parseFromString(strFromU8(entry), "application/xml");
  } catch (error) {
    throw new Error(`Invalid XML entry ${entryName}: ${String(error)}`);
  }

  if (parserErrors.length > 0 || !document.documentElement) {
    throw new Error(
      `Invalid XML entry ${entryName}: ${parserErrors.join("; ") || "missing document element"}`,
    );
  }
  return document;
};

const hasEnabledVanish = (run: XmlElement): boolean =>
  childElements(run)
    .filter((child) => isElement(child, WORDPROCESSINGML_NAMESPACE, "rPr"))
    .some((runProperties) =>
      childElements(runProperties)
        .filter((child) =>
          isElement(child, WORDPROCESSINGML_NAMESPACE, "vanish"),
        )
        .some((vanish) => {
          if (!vanish.hasAttributeNS(WORDPROCESSINGML_NAMESPACE, "val")) {
            return true;
          }
          return new Set(["1", "true", "on"]).has(
            vanish.getAttributeNS(WORDPROCESSINGML_NAMESPACE, "val") ?? "",
          );
        }),
    );

const relationshipSourcePart = (relationshipEntry: string): string => {
  if (relationshipEntry === "_rels/.rels") {
    return "";
  }
  const match = relationshipEntry.match(/^(.*)\/_rels\/([^/]+)\.rels$/);
  if (!match) {
    return "";
  }
  return `${match[1]}/${match[2]}`;
};

const resolveRelationshipTarget = (
  relationshipEntry: string,
  target: string,
): string => {
  const targetPath = target.startsWith("/")
    ? target.slice(1)
    : `${relationshipSourcePart(relationshipEntry).replace(/[^/]*$/, "")}${target}`;
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

const collectRelationships = (
  documents: ReadonlyMap<string, XmlDocument>,
  fileEntries: ReadonlySet<string>,
): {
  externalRelationships: string[];
  activeRelationshipTypes: string[];
  unexpectedRelationships: string[];
} => {
  const externalRelationships: string[] = [];
  const activeRelationshipTypes: string[] = [];
  const unexpectedRelationships: string[] = [];

  for (const [entryName, document] of documents) {
    if (!entryName.endsWith(".rels")) {
      continue;
    }
    const relationships = descendantsByLocalName(document, "Relationship");
    const expected = FIXED_RELATIONSHIPS[entryName] ?? [];
    const consumedExpected = new Set<number>();

    relationships.forEach((relationship) => {
      const label = relationshipLabel(entryName, relationship);
      const type = relationship.getAttribute("Type") ?? "";
      const target = relationship.getAttribute("Target") ?? "";
      const targetMode = relationship.hasAttribute("TargetMode")
        ? relationship.getAttribute("TargetMode")
        : null;

      if (targetMode?.toLowerCase() === "external") {
        externalRelationships.push(label);
      }
      if (/(?:\/oleObject|\/package|\/control|\/attachedTemplate|\/aFChunk)$/i.test(type)) {
        activeRelationshipTypes.push(type);
      }

      const expectedIndex = expected.findIndex(
        ([expectedType, expectedTarget], index) =>
          !consumedExpected.has(index) &&
          expectedType === type &&
          expectedTarget === target &&
          targetMode === null,
      );
      if (expectedIndex < 0) {
        unexpectedRelationships.push(label);
      } else {
        consumedExpected.add(expectedIndex);
      }

      const resolvedTarget = resolveRelationshipTarget(entryName, target);
      if (!fileEntries.has(resolvedTarget)) {
        unexpectedRelationships.push(
          `${label} [target does not resolve to ${resolvedTarget}]`,
        );
      }
    });

    expected.forEach(([type, target], index) => {
      if (!consumedExpected.has(index)) {
        unexpectedRelationships.push(
          `${entryName}: missing ${type} -> ${target}`,
        );
      }
    });
  }

  return {
    externalRelationships,
    activeRelationshipTypes,
    unexpectedRelationships,
  };
};

const isActiveContentEntry = (entryName: string): boolean =>
  /^word\/(?:vbaProject\.bin|vbaData\.xml)$/i.test(entryName) ||
  /(?:^|\/)activeX(?:\/|$)/i.test(entryName) ||
  /(?:^|\/)embeddings(?:\/|$)/i.test(entryName) ||
  /(?:^|\/)oleObject(?:\/|$)/i.test(entryName) ||
  /(?:^|\/)webextensions(?:\/|$)/i.test(entryName) ||
  /(?:^|\/)customUI(?:\/|$)/i.test(entryName) ||
  /(?:^|\/)customXml(?:\/|$)/i.test(entryName);

const inspectContentTypes = (
  document: XmlDocument,
): { macroContentTypes: string[]; unexpectedComments: string[] } => {
  const macroContentTypes: string[] = [];
  const unexpectedComments: string[] = [];
  for (const element of descendantsByLocalName(document, "Default").concat(
    descendantsByLocalName(document, "Override"),
  )) {
    const contentType = element.getAttribute("ContentType") ?? "";
    if (/(?:macroEnabled|vbaProject|activeX|oleObject)/i.test(contentType)) {
      macroContentTypes.push(contentType);
    }

    const partName = element.getAttribute("PartName") ?? "";
    if (
      /\/word\/(?:comments(?:Extended|Ids)?|people)\.xml$/i.test(partName)
    ) {
      if (
        partName !== "/word/comments.xml" ||
        contentType !== COMMENTS_CONTENT_TYPE
      ) {
        unexpectedComments.push(
          `[Content_Types].xml: ${partName} -> ${contentType}`,
        );
      }
    }
  }

  const commentsOverrides = descendantsByLocalName(document, "Override").filter(
    (element) => element.getAttribute("PartName") === "/word/comments.xml",
  );
  if (
    commentsOverrides.length !== 1 ||
    commentsOverrides[0]?.getAttribute("ContentType") !== COMMENTS_CONTENT_TYPE
  ) {
    unexpectedComments.push(
      "[Content_Types].xml: expected one exact /word/comments.xml override",
    );
  }

  return { macroContentTypes, unexpectedComments };
};

const inspectCommentsContent = (
  commentsDocument: XmlDocument,
  document: XmlDocument,
): string[] => {
  const unexpectedComments: string[] = [];
  const commentsRoot = commentsDocument.documentElement;
  if (commentsRoot) {
    if (childElements(commentsRoot).length > 0) {
      unexpectedComments.push("word/comments.xml: unexpected element content");
    }
    if (commentsRoot.textContent?.trim()) {
      unexpectedComments.push("word/comments.xml: unexpected text content");
    }
    if (
      descendantsByLocalName(commentsDocument, "comment").some(
        (comment) => comment.namespaceURI === WORDPROCESSINGML_NAMESPACE,
      )
    ) {
      unexpectedComments.push("word/comments.xml: unexpected w:comment element");
    }
  }

  for (const localName of [
    "commentRangeStart",
    "commentRangeEnd",
    "commentReference",
  ]) {
    if (
      descendantsByLocalName(document, localName).some(
        (element) => element.namespaceURI === WORDPROCESSINGML_NAMESPACE,
      )
    ) {
      unexpectedComments.push(`word/document.xml: unexpected w:${localName}`);
    }
  }
  return unexpectedComments;
};

export function inspectCarrierDocx(bytes: Uint8Array): CarrierDocxInspection {
  if (bytes.length < 2 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
    throw new Error("Not a ZIP/DOCX package");
  }

  let entries: Unzipped;
  try {
    entries = unzipSync(bytes);
  } catch (error) {
    throw new Error(`Invalid ZIP/DOCX package: ${String(error)}`);
  }

  const allEntries = Object.keys(entries).sort();
  const fileEntries = allEntries.filter((entryName) => !entryName.endsWith("/"));
  for (const requiredEntry of REQUIRED_ENTRIES) {
    if (!fileEntries.includes(requiredEntry)) {
      throw new Error(`Missing required DOCX entry: ${requiredEntry}`);
    }
  }

  const documents = new Map<string, XmlDocument>();
  for (const entryName of fileEntries) {
    if (entryName.endsWith(".xml") || entryName.endsWith(".rels")) {
      documents.set(entryName, parseXml(entries, entryName));
    }
  }

  const document = documents.get("word/document.xml");
  const contentTypes = documents.get("[Content_Types].xml");
  const commentsDocument = documents.get("word/comments.xml");
  if (!document || !contentTypes || !commentsDocument) {
    throw new Error("Missing required parsed DOCX XML entries");
  }

  const runs: CarrierRunInspection[] = [];
  const visibleParagraphs: string[] = [];
  const paragraphs = descendantsByLocalName(document, "p").filter((paragraph) =>
    paragraph.namespaceURI === WORDPROCESSINGML_NAMESPACE,
  );
  paragraphs.forEach((paragraph, paragraphIndex) => {
    const visibleRuns: string[] = [];
    childElements(paragraph)
      .filter((child) => isElement(child, WORDPROCESSINGML_NAMESPACE, "r"))
      .forEach((run, runIndex) => {
        const text = descendantsByLocalName(run, "t")
          .filter((textElement) =>
            textElement.namespaceURI === WORDPROCESSINGML_NAMESPACE,
          )
          .map((textElement) => textElement.textContent ?? "")
          .join("");
        const hidden = hasEnabledVanish(run);
        runs.push({ paragraphIndex, runIndex, text, hidden });
        if (!hidden) {
          visibleRuns.push(text);
        }
      });
    visibleParagraphs.push(visibleRuns.join(""));
  });

  const relationshipInspection = collectRelationships(
    documents,
    new Set(fileEntries),
  );
  const contentTypeInspection = inspectContentTypes(contentTypes);
  const unexpectedEntries = fileEntries.filter(
    (entryName) => !CANONICAL_ENTRIES.has(entryName),
  );
  unexpectedEntries.push(...contentTypeInspection.unexpectedComments);
  unexpectedEntries.push(...inspectCommentsContent(commentsDocument, document));

  return {
    entries: fileEntries,
    runs,
    visibleParagraphs,
    externalRelationships: relationshipInspection.externalRelationships,
    activeContentEntries: allEntries.filter(isActiveContentEntry),
    activeRelationshipTypes: relationshipInspection.activeRelationshipTypes,
    macroContentTypes: contentTypeInspection.macroContentTypes,
    unexpectedEntries,
    unexpectedRelationships: relationshipInspection.unexpectedRelationships,
  };
}
