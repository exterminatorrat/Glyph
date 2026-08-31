import { generateDocxHiddenRunV1 } from "@/documents/docx/docx-hidden-run-v1";
import { strFromU8, unzipSync } from "fflate";
import { DOMParser } from "@xmldom/xmldom";
import { describe, expect, test } from "vitest";
import {
  CARRIER_SPIKE_INPUT,
  FIXED_MARKER_ALPHA,
  FIXED_MARKER_BETA,
  VISIBLE_PARAGRAPHS,
} from "../../research/experiments/docx-hidden-run-v1/fixture";
import { inspectCarrierDocx } from "../../research/experiments/docx-hidden-run-v1/inspect-carrier-docx";

const WORDPROCESSINGML_NAMESPACE =
  "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const PACKAGE_RELATIONSHIPS_NAMESPACE =
  "http://schemas.openxmlformats.org/package/2006/relationships";
const OFFICE_DOCUMENT_RELATIONSHIP =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments";
const CONTENT_TYPES_NAMESPACE =
  "http://schemas.openxmlformats.org/package/2006/content-types";
const COMMENTS_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml";

const readEntry = (
  entries: Record<string, Uint8Array>,
  name: string,
): Uint8Array => {
  const entry = entries[name];
  if (!entry) {
    throw new Error(`Missing ZIP entry: ${name}`);
  }
  return entry;
};

const parseXml = (entry: Uint8Array) =>
  new DOMParser().parseFromString(strFromU8(entry), "application/xml");

const countOccurrences = (value: string, needle: string): number =>
  value.split(needle).length - 1;

const assertInertCommentsPlumbing = (bytes: Uint8Array): void => {
  const entries = unzipSync(bytes);
  const commentsDocument = parseXml(readEntry(entries, "word/comments.xml"));
  const commentsRoot = commentsDocument.documentElement;
  if (!commentsRoot) {
    throw new Error("Missing comments XML root element");
  }

  expect(
    commentsDocument.getElementsByTagNameNS(
      WORDPROCESSINGML_NAMESPACE,
      "comment",
    ).length,
  ).toBe(0);

  let commentsElementChildren = 0;
  for (
    let child = commentsRoot.firstChild;
    child;
    child = child.nextSibling
  ) {
    if (child.nodeType === 1) {
      commentsElementChildren += 1;
    }
    if (child.nodeType === 3) {
      expect(child.nodeValue?.trim()).toBe("");
    }
  }
  expect(commentsElementChildren).toBe(0);
  expect(commentsRoot.textContent?.trim()).toBe("");

  const commentsRelationships = parseXml(
    readEntry(entries, "word/_rels/comments.xml.rels"),
  );
  expect(
    commentsRelationships.getElementsByTagNameNS(
      PACKAGE_RELATIONSHIPS_NAMESPACE,
      "Relationship",
    ).length,
  ).toBe(0);

  const document = parseXml(readEntry(entries, "word/document.xml"));
  for (const localName of [
    "commentRangeStart",
    "commentRangeEnd",
    "commentReference",
  ]) {
    expect(
      document.getElementsByTagNameNS(WORDPROCESSINGML_NAMESPACE, localName)
        .length,
    ).toBe(0);
  }

  const documentRelationships = parseXml(
    readEntry(entries, "word/_rels/document.xml.rels"),
  );
  const relationships = documentRelationships.getElementsByTagNameNS(
    PACKAGE_RELATIONSHIPS_NAMESPACE,
    "Relationship",
  );
  const commentsRelationship = [];
  for (let index = 0; index < relationships.length; index += 1) {
    const relationship = relationships.item(index);
    if (
      relationship?.getAttribute("Type") === OFFICE_DOCUMENT_RELATIONSHIP
    ) {
      commentsRelationship.push(relationship);
    }
  }
  expect(commentsRelationship).toHaveLength(1);
  expect(commentsRelationship[0]?.getAttribute("Target")).toBe("comments.xml");
  expect(commentsRelationship[0]?.getAttribute("TargetMode")).toBeNull();

  const contentTypes = parseXml(readEntry(entries, "[Content_Types].xml"));
  const overrides = contentTypes.getElementsByTagNameNS(
    CONTENT_TYPES_NAMESPACE,
    "Override",
  );
  const commentsOverrides = [];
  for (let index = 0; index < overrides.length; index += 1) {
    const override = overrides.item(index);
    if (override?.getAttribute("PartName") === "/word/comments.xml") {
      commentsOverrides.push(override);
    }
  }
  expect(commentsOverrides).toHaveLength(1);
  expect(commentsOverrides[0]?.getAttribute("ContentType")).toBe(
    COMMENTS_CONTENT_TYPE,
  );

  for (const forbiddenEntry of [
    "word/commentsExtended.xml",
    "word/commentsIds.xml",
    "word/people.xml",
    "word/_rels/commentsExtended.xml.rels",
    "word/_rels/commentsIds.xml.rels",
    "word/_rels/people.xml.rels",
  ]) {
    expect(entries[forbiddenEntry]).toBeUndefined();
  }

  const textEntries = Object.entries(entries).filter(
    ([name]) =>
      name.endsWith(".xml") || name.endsWith(".rels") || name.endsWith(".txt"),
  );
  for (const marker of [FIXED_MARKER_ALPHA, FIXED_MARKER_BETA]) {
    const markerEntries = textEntries
      .map(([name, entry]) => [name, countOccurrences(strFromU8(entry), marker)] as const)
      .filter(([, count]) => count > 0);
    expect(markerEntries).toEqual([["word/document.xml", 1]]);
  }
};

describe("docx-hidden-run-v1", () => {
  test("creates a parseable DOCX package with required core entries", async () => {
    const bytes = await generateDocxHiddenRunV1(CARRIER_SPIKE_INPUT);
    expect(Array.from(bytes.slice(0, 2))).toEqual([0x50, 0x4b]);

    const inspection = inspectCarrierDocx(bytes);
    for (const requiredEntry of [
      "[Content_Types].xml",
      "_rels/.rels",
      "docProps/core.xml",
      "docProps/app.xml",
      "word/document.xml",
      "word/_rels/document.xml.rels",
    ]) {
      expect(inspection.entries).toContain(requiredEntry);
    }
  });

  test("places exactly two fixed markers in the intended vanished runs", async () => {
    const bytes = await generateDocxHiddenRunV1(CARRIER_SPIKE_INPUT);
    const inspection = inspectCarrierDocx(bytes);
    const hiddenRuns = inspection.runs.filter((run) => run.hidden);

    expect(inspection.visibleParagraphs).toEqual(VISIBLE_PARAGRAPHS);
    expect(hiddenRuns).toHaveLength(2);
    expect(hiddenRuns).toEqual([
      {
        paragraphIndex: 0,
        runIndex: 1,
        text: FIXED_MARKER_ALPHA,
        hidden: true,
      },
      {
        paragraphIndex: 2,
        runIndex: 1,
        text: FIXED_MARKER_BETA,
        hidden: true,
      },
    ]);
    expect(
      inspection.runs
        .filter((run) => !run.hidden)
        .some(
          (run) =>
            run.text.includes(FIXED_MARKER_ALPHA) ||
            run.text.includes(FIXED_MARKER_BETA),
        ),
    ).toBe(false);
  });

  test("contains only the expected inert package structure", async () => {
    const bytes = await generateDocxHiddenRunV1(CARRIER_SPIKE_INPUT);
    const inspection = inspectCarrierDocx(bytes);

    expect(inspection.activeContentEntries).toEqual([]);
    expect(inspection.activeRelationshipTypes).toEqual([]);
    expect(inspection.externalRelationships).toEqual([]);
    expect(inspection.macroContentTypes).toEqual([]);
    expect(inspection.unexpectedEntries).toEqual([]);
    expect(inspection.unexpectedRelationships).toEqual([]);
    assertInertCommentsPlumbing(bytes);
  });

  test("is structurally stable across two generated packages", async () => {
    const first = inspectCarrierDocx(
      await generateDocxHiddenRunV1(CARRIER_SPIKE_INPUT),
    );
    const second = inspectCarrierDocx(
      await generateDocxHiddenRunV1(CARRIER_SPIKE_INPUT),
    );

    expect(second).toEqual(first);
  });
});
