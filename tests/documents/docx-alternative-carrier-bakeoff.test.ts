import {
  generateDocxAlternativeCarrier,
  type AlternativeCarrierCandidateId,
} from "@/documents/docx/docx-alternative-carrier-bakeoff-v1";
import { strFromU8, unzipSync, type Unzipped } from "fflate";
import { DOMParser } from "@xmldom/xmldom";
import { describe, expect, test } from "vitest";
import {
  CANDIDATE_FIXTURE,
  CANDIDATE_ORDER,
  type AlternativeCarrierMarkerId,
  VISIBLE_PARAGRAPHS,
} from "../../research/experiments/docx-alternative-carrier-bakeoff-v1/fixture";
import {
  inspectTransformedDocx,
  type TransformedDocxInspection,
} from "../../research/experiments/docx-alternative-carrier-bakeoff-v1/inspect-transformed-docx";

const WORDPROCESSINGML_NAMESPACE =
  "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const PACKAGE_RELATIONSHIPS_NAMESPACE =
  "http://schemas.openxmlformats.org/package/2006/relationships";

const bodyParagraphs = (inspection: TransformedDocxInspection): string[] =>
  inspection.paragraphs
    .filter((paragraph) => paragraph.location === "body")
    .map((paragraph) =>
      paragraph.text
        .replaceAll(CANDIDATE_FIXTURE.markers.alpha, "")
        .replaceAll(CANDIDATE_FIXTURE.markers.beta, ""),
    );

const markerOccurrences = (
  inspection: TransformedDocxInspection,
  markerId: AlternativeCarrierMarkerId,
) => inspection.markerOccurrences.filter((occurrence) => occurrence.markerId === markerId);

const readEntry = (entries: Unzipped, name: string): Uint8Array | undefined =>
  entries[name];

const markerEntryNames = (entries: Unzipped, marker: string): string[] =>
  Object.entries(entries)
    .filter(([, entry]) => strFromU8(entry).includes(marker))
    .map(([name]) => name)
    .sort();

const expectedMarkerPart = (
  candidate: AlternativeCarrierCandidateId,
): string =>
  candidate === "docx-header-text-v1" ? "word/header1.xml" : "word/document.xml";

describe("docx-alternative-carrier-bakeoff-v1", () => {
  test.each(CANDIDATE_ORDER)(
    "%s preserves the frozen visible body and fixed markers",
    async (candidate) => {
      const inspection = inspectTransformedDocx(
        await generateDocxAlternativeCarrier(candidate, CANDIDATE_FIXTURE),
        CANDIDATE_FIXTURE.markers,
      );

      expect(bodyParagraphs(inspection)).toEqual(VISIBLE_PARAGRAPHS);
      expect(inspection.markerPresence).toEqual({
        alpha: "present",
        beta: "present",
      });
    },
  );

  test("rejects an unsupported runtime candidate before generating a package", async () => {
    const unsupported = "unsupported-candidate" as AlternativeCarrierCandidateId;

    await expect(
      generateDocxAlternativeCarrier(unsupported, {
        bodyParagraphs: [],
        markers: CANDIDATE_FIXTURE.markers,
      }),
    ).rejects.toThrow(
      "Unsupported alternative carrier candidate: unsupported-candidate",
    );
  });

  test.each(CANDIDATE_ORDER)(
    "%s places each fixed marker in exactly one intended text part",
    async (candidate) => {
      const bytes = await generateDocxAlternativeCarrier(
        candidate,
        CANDIDATE_FIXTURE,
      );
      const entries = unzipSync(bytes);
      const inspection = inspectTransformedDocx(
        bytes,
        CANDIDATE_FIXTURE.markers,
      );
      const expectedPart = expectedMarkerPart(candidate);

      expect(markerOccurrences(inspection, "alpha")).toHaveLength(1);
      expect(markerOccurrences(inspection, "beta")).toHaveLength(1);
      expect(markerEntryNames(entries, CANDIDATE_FIXTURE.markers.alpha)).toEqual([
        expectedPart,
      ]);
      expect(markerEntryNames(entries, CANDIDATE_FIXTURE.markers.beta)).toEqual([
        expectedPart,
      ]);
      expect(inspection.safety).toEqual({
        externalRelationships: [],
        unresolvedRelationshipTargets: [],
        activeContentEntries: [],
        activeRelationshipTypes: [],
        macroContentTypes: [],
      });
    },
  );

  test("matching-color-body-v1 uses only explicit white color in body marker runs", async () => {
    const inspection = inspectTransformedDocx(
      await generateDocxAlternativeCarrier(
        "matching-color-body-v1",
        CANDIDATE_FIXTURE,
      ),
      CANDIDATE_FIXTURE.markers,
    );

    expect(markerOccurrences(inspection, "alpha")).toMatchObject([
      {
        location: "body",
        partName: "word/document.xml",
        paragraphIndex: 0,
        runIndices: [1],
      },
    ]);
    expect(markerOccurrences(inspection, "alpha")[0]?.runFormats).toEqual([
      {
        hidden: false,
        color: "FFFFFF",
        sizeHalfPoints: null,
        sizeComplexScriptHalfPoints: null,
      },
    ]);
    expect(markerOccurrences(inspection, "beta")[0]?.runFormats).toEqual([
      {
        hidden: false,
        color: "FFFFFF",
        sizeHalfPoints: null,
        sizeComplexScriptHalfPoints: null,
      },
    ]);
  });

  test("sub-legible-body-1pt-v1 uses one half-point value of 2 and no color override", async () => {
    const inspection = inspectTransformedDocx(
      await generateDocxAlternativeCarrier(
        "sub-legible-body-1pt-v1",
        CANDIDATE_FIXTURE,
      ),
      CANDIDATE_FIXTURE.markers,
    );

    expect(markerOccurrences(inspection, "alpha")[0]?.runFormats).toEqual([
      {
        hidden: false,
        color: null,
        sizeHalfPoints: 2,
        sizeComplexScriptHalfPoints: 2,
      },
    ]);
    expect(markerOccurrences(inspection, "beta")[0]?.runFormats).toEqual([
      {
        hidden: false,
        color: null,
        sizeHalfPoints: 2,
        sizeComplexScriptHalfPoints: 2,
      },
    ]);
  });

  test("docx-header-text-v1 puts markers in separate ordinary header paragraphs", async () => {
    const inspection = inspectTransformedDocx(
      await generateDocxAlternativeCarrier(
        "docx-header-text-v1",
        CANDIDATE_FIXTURE,
      ),
      CANDIDATE_FIXTURE.markers,
    );

    expect(markerOccurrences(inspection, "alpha")[0]).toMatchObject({
      location: "header",
      partName: "word/header1.xml",
      paragraphIndex: 0,
    });
    expect(markerOccurrences(inspection, "beta")[0]).toMatchObject({
      location: "header",
      partName: "word/header1.xml",
      paragraphIndex: 1,
    });
    expect(markerOccurrences(inspection, "alpha")[0]?.runFormats).toEqual([
      {
        hidden: false,
        color: null,
        sizeHalfPoints: null,
        sizeComplexScriptHalfPoints: null,
      },
    ]);
  });

  test.each(CANDIDATE_ORDER)(
    "%s contains no comments, active content, footer, or external marker copies",
    async (candidate) => {
      const bytes = await generateDocxAlternativeCarrier(
        candidate,
        CANDIDATE_FIXTURE,
      );
      const entries = unzipSync(bytes);
      const document = readEntry(entries, "word/document.xml");
      const expectedPart = expectedMarkerPart(candidate);

      expect(
        Object.keys(entries).filter((entry) =>
          /comments(?:Extended|Ids)\.xml|people\.xml|footer|vba|activeX|embeddings|oleObject|webextensions|customUI|customXml/i.test(
            entry,
          ),
        ),
      ).toEqual([]);

      expect(
        Object.keys(entries).filter((entry) => entry.endsWith(".rels")),
      ).not.toContain(expectedPart);

      if (document) {
        const documentXml = new DOMParser().parseFromString(
          strFromU8(document),
          "application/xml",
        );
        for (const localName of [
          "commentRangeStart",
          "commentRangeEnd",
          "commentReference",
        ]) {
          expect(
            documentXml.getElementsByTagNameNS(
              WORDPROCESSINGML_NAMESPACE,
              localName,
            ).length,
          ).toBe(0);
        }
      }

      const commentsXml = readEntry(entries, "word/comments.xml");
      if (commentsXml) {
        const comments = new DOMParser().parseFromString(
          strFromU8(commentsXml),
          "application/xml",
        );
        expect(
          comments.getElementsByTagNameNS(
            WORDPROCESSINGML_NAMESPACE,
            "comment",
          ).length,
        ).toBe(0);
      }

      const commentsRelationships = readEntry(
        entries,
        "word/_rels/comments.xml.rels",
      );
      if (commentsRelationships) {
        const relationships = new DOMParser().parseFromString(
          strFromU8(commentsRelationships),
          "application/xml",
        );
        expect(
          relationships.getElementsByTagNameNS(
            PACKAGE_RELATIONSHIPS_NAMESPACE,
            "Relationship",
          ).length,
        ).toBe(0);
      }

      expect(
        Object.keys(entries).some((entry) => entry.endsWith(".rels") &&
          markerEntryNames(entries, CANDIDATE_FIXTURE.markers.alpha).includes(entry)),
      ).toBe(false);
      expect(markerEntryNames(entries, CANDIDATE_FIXTURE.markers.alpha)).toEqual([
        expectedPart,
      ]);
      expect(markerEntryNames(entries, CANDIDATE_FIXTURE.markers.beta)).toEqual([
        expectedPart,
      ]);
    },
  );

  test("generates one independent source DOCX package per frozen candidate", async () => {
    const artifacts = await Promise.all(
      CANDIDATE_ORDER.map((candidate) =>
        generateDocxAlternativeCarrier(candidate, CANDIDATE_FIXTURE),
      ),
    );

    expect(artifacts).toHaveLength(CANDIDATE_ORDER.length);
    expect(artifacts.every((bytes) => bytes[0] === 0x50 && bytes[1] === 0x4b)).toBe(
      true,
    );
    const packages = artifacts.map((bytes) => unzipSync(bytes));
    expect(Object.keys(packages[0]).sort()).toEqual(
      Object.keys(packages[1]).sort(),
    );
    expect(
      Object.keys(packages[2])
        .filter((entry) => !Object.hasOwn(packages[0], entry))
        .sort(),
    ).toEqual(["word/_rels/header1.xml.rels", "word/header1.xml"]);

    const headerRelationshipDocument = new DOMParser().parseFromString(
      strFromU8(packages[2]["word/_rels/document.xml.rels"]),
      "application/xml",
    );
    const headerRelationships = headerRelationshipDocument
      .getElementsByTagNameNS(PACKAGE_RELATIONSHIPS_NAMESPACE, "Relationship");
    expect(
      Array.from(headerRelationships).filter(
        (relationship) =>
          relationship.getAttribute("Type")?.endsWith("/header") &&
          relationship.getAttribute("Target") === "header1.xml",
      ),
    ).toHaveLength(1);

    const contentTypesDocument = new DOMParser().parseFromString(
      strFromU8(packages[2]["[Content_Types].xml"]),
      "application/xml",
    );
    expect(
      Array.from(
        contentTypesDocument.getElementsByTagNameNS(
          "http://schemas.openxmlformats.org/package/2006/content-types",
          "Override",
        ),
      ).filter(
        (override) =>
          override.getAttribute("PartName") === "/word/header1.xml" &&
          override
            .getAttribute("ContentType")
            ?.endsWith(".header+xml"),
      ),
    ).toHaveLength(1);

    expect(
      artifacts.map((bytes, index) =>
        inspectTransformedDocx(bytes, CANDIDATE_FIXTURE.markers).markerOccurrences.map(
          (occurrence) => `${CANDIDATE_ORDER[index]}:${occurrence.markerId}:${occurrence.partName}`,
        ),
      ),
    ).toEqual([
      [
        "matching-color-body-v1:alpha:word/document.xml",
        "matching-color-body-v1:beta:word/document.xml",
      ],
      [
        "sub-legible-body-1pt-v1:alpha:word/document.xml",
        "sub-legible-body-1pt-v1:beta:word/document.xml",
      ],
      [
        "docx-header-text-v1:alpha:word/header1.xml",
        "docx-header-text-v1:beta:word/header1.xml",
      ],
    ]);
  });
});
