import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { describe, expect, test } from "vitest";
import { generateMatchingColorBodyV2 } from "../../src/documents/docx/docx-matching-color-body-v2";
import {
  QUALIFICATION_FIXTURE,
  VISIBLE_PARAGRAPHS,
} from "../../research/experiments/docx-semantic-white-carrier-qualification-v1/fixture";
import { inspectSemanticWhiteCarrier } from "../../research/experiments/docx-semantic-white-carrier-qualification-v1/inspect-semantic-white-docx";

const safetyClean = {
  externalRelationships: [],
  unresolvedRelationshipTargets: [],
  activeContentEntries: [],
  activeRelationshipTypes: [],
  macroContentTypes: [],
};

const requiredEntry = (
  entries: Record<string, Uint8Array>,
  name: string,
): Uint8Array => {
  const entry = entries[name];
  if (!entry) {
    throw new Error(`Missing test entry: ${name}`);
  }
  return entry;
};

const mutateDocument = (
  bytes: Uint8Array,
  mutate: (xml: string) => string,
): Uint8Array => {
  const entries = unzipSync(bytes);
  entries["word/document.xml"] = strToU8(
    mutate(strFromU8(requiredEntry(entries, "word/document.xml"))),
  );
  return zipSync(entries);
};

const generatedSource = (): Promise<Uint8Array> =>
  generateMatchingColorBodyV2(QUALIFICATION_FIXTURE);

const sourceWithColor = async (value: string): Promise<Uint8Array> =>
  mutateDocument(await generatedSource(), (xml) => {
    const original = '<w:color w:val="FFFFFF"/>';
    const replacement = `<w:color w:val="${value}"/>`;
    if (!xml.includes(original)) {
      throw new Error("Generated marker color was not found");
    }
    return xml.replaceAll(original, replacement);
  });

const sourceWithRunProperty = async (
  property: string,
): Promise<Uint8Array> =>
  mutateDocument(await generatedSource(), (xml) => {
    const original = '<w:color w:val="FFFFFF"/>';
    const replacement = `<w:color w:val="FFFFFF"/>${property}`;
    if (!xml.includes(original)) {
      throw new Error("Generated marker color was not found");
    }
    return xml.replaceAll(original, replacement);
  });

const markerMechanisms = async (bytes: Uint8Array) =>
  inspectSemanticWhiteCarrier(bytes, QUALIFICATION_FIXTURE.markers)
    .markerMechanisms;

const visibleBodyParagraphs = (
  bytes: Uint8Array,
): string[] => {
  const inspection = inspectSemanticWhiteCarrier(
    bytes,
    QUALIFICATION_FIXTURE.markers,
  );
  return inspection.transformed.paragraphs
    .filter((paragraph) => paragraph.location === "body")
    .map((paragraph) =>
      paragraph.text
        .replaceAll(QUALIFICATION_FIXTURE.markers.alpha, "")
        .replaceAll(QUALIFICATION_FIXTURE.markers.beta, ""),
    );
};

describe("docx-semantic-white-carrier-qualification-v1", () => {
  test("generates only direct semantic-white body marker runs", async () => {
    const bytes = await generatedSource();
    const inspection = inspectSemanticWhiteCarrier(
      bytes,
      QUALIFICATION_FIXTURE.markers,
    );

    expect(inspection.transformed.markerPresence).toEqual({
      alpha: "present",
      beta: "present",
    });
    expect(visibleBodyParagraphs(bytes)).toEqual(VISIBLE_PARAGRAPHS);
    expect(inspection.transformed.safety).toEqual(safetyClean);
    expect(inspection.transformed.markerOccurrences).toEqual([
      expect.objectContaining({
        markerId: "alpha",
        partName: "word/document.xml",
        location: "body",
        paragraphIndex: 0,
        runIndices: [1],
      }),
      expect.objectContaining({
        markerId: "beta",
        partName: "word/document.xml",
        location: "body",
        paragraphIndex: 2,
        runIndices: [1],
      }),
    ]);
    expect(inspection.markerMechanisms).toHaveLength(2);
    expect(inspection.markerMechanisms).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          markerId: "alpha",
          partName: "word/document.xml",
          location: "body",
          paragraphIndex: 0,
          runIndex: 1,
          directColorValue: "FFFFFF",
          themeColor: null,
          themeTint: null,
          themeShade: null,
          hidden: false,
          sizeHalfPoints: null,
          sizeComplexScriptHalfPoints: null,
          shadingFill: null,
          highlight: null,
          semanticDirectWhite: true,
          forbiddenProperties: [],
        }),
        expect.objectContaining({
          markerId: "beta",
          partName: "word/document.xml",
          location: "body",
          paragraphIndex: 2,
          runIndex: 1,
          directColorValue: "FFFFFF",
          themeColor: null,
          themeTint: null,
          themeShade: null,
          hidden: false,
          sizeHalfPoints: null,
          sizeComplexScriptHalfPoints: null,
          shadingFill: null,
          highlight: null,
          semanticDirectWhite: true,
          forbiddenProperties: [],
        }),
      ]),
    );
  });

  test.each([
    ["ffffff", true],
    ["FFFFFF", true],
    ["auto", false],
    ["FFF", false],
    ["#FFFFFF", false],
    ["FFFFFE", false],
  ])("classifies direct color %s", async (value, expected) => {
    const mechanisms = await markerMechanisms(await sourceWithColor(value));

    expect(mechanisms.every((entry) => entry.semanticDirectWhite)).toBe(
      expected,
    );
    if (!expected) {
      expect(
        mechanisms.every((entry) =>
          entry.forbiddenProperties.includes("directColorValue"),
        ),
      ).toBe(true);
    }
  });

  test("rejects marker runs with no direct color element", async () => {
    const bytes = mutateDocument(await generatedSource(), (xml) => {
      const original = '<w:color w:val="FFFFFF"/>';
      if (!xml.includes(original)) {
        throw new Error("Generated marker color was not found");
      }
      return xml.replaceAll(original, "");
    });
    const mechanisms = await markerMechanisms(bytes);

    expect(mechanisms).toHaveLength(2);
    expect(mechanisms.every((entry) => entry.directColorValue === null)).toBe(
      true,
    );
    expect(mechanisms.every((entry) => entry.semanticDirectWhite)).toBe(false);
    expect(
      mechanisms.every((entry) =>
        entry.forbiddenProperties.includes("directColorValue"),
      ),
    ).toBe(true);
  });

  test("requires namespaced w:val for direct color", async () => {
    const bytes = mutateDocument(await generatedSource(), (xml) => {
      const original = '<w:color w:val="FFFFFF"/>';
      if (!xml.includes(original)) {
        throw new Error("Generated marker color was not found");
      }
      return xml.replaceAll(original, '<w:color val="FFFFFF"/>');
    });
    const mechanisms = await markerMechanisms(bytes);

    expect(mechanisms.every((entry) => entry.directColorValue === null)).toBe(
      true,
    );
    expect(mechanisms.every((entry) => entry.semanticDirectWhite)).toBe(false);
    expect(
      mechanisms.every((entry) =>
        entry.forbiddenProperties.includes("directColorValue"),
      ),
    ).toBe(true);
  });

  test("treats vanish without namespaced w:val as enabled", async () => {
    const bytes = mutateDocument(await generatedSource(), (xml) => {
      const original = '<w:color w:val="FFFFFF"/>';
      if (!xml.includes(original)) {
        throw new Error("Generated marker color was not found");
      }
      return xml.replaceAll(
        original,
        `${original}<w:vanish val="false"/>`,
      );
    });
    const mechanisms = await markerMechanisms(bytes);

    expect(mechanisms.every((entry) => entry.hidden)).toBe(true);
    expect(mechanisms.every((entry) => entry.semanticDirectWhite)).toBe(false);
    expect(
      mechanisms.every((entry) => entry.forbiddenProperties.includes("hidden")),
    ).toBe(true);
  });

  test.each([
    ["themeColor", '<w:color w:val="FFFFFF" w:themeColor="accent1"/>'],
    ["themeTint", '<w:color w:val="FFFFFF" w:themeTint="99"/>'],
    ["themeShade", '<w:color w:val="FFFFFF" w:themeShade="99"/>'],
    ["hidden", "<w:vanish/>"],
    ["sizeHalfPoints", '<w:sz w:val="2"/>'],
    ["sizeComplexScriptHalfPoints", '<w:szCs w:val="2"/>'],
    ["shadingFill", '<w:shd w:fill="000000"/>'],
    ["highlight", '<w:highlight w:val="black"/>'],
  ])("rejects forbidden marker property %s", async (property, xml) => {
    const bytes =
      property === "themeColor" ||
      property === "themeTint" ||
      property === "themeShade"
        ? mutateDocument(await generatedSource(), (documentXml) => {
            const original = '<w:color w:val="FFFFFF"/>';
            if (!documentXml.includes(original)) {
              throw new Error("Generated marker color was not found");
            }
            return documentXml.replaceAll(original, xml);
          })
        : await sourceWithRunProperty(xml);
    const mechanisms = await markerMechanisms(bytes);

    expect(mechanisms).toHaveLength(2);
    expect(mechanisms.every((entry) => entry.semanticDirectWhite)).toBe(
      false,
    );
    expect(
      mechanisms.every((entry) => entry.forbiddenProperties.includes(property)),
    ).toBe(true);
  });

  test("accepts a marker split across adjacent direct-white runs", async () => {
    const marker = QUALIFICATION_FIXTURE.markers.alpha;
    const first = marker.slice(0, 5);
    const second = marker.slice(5);
    const split = mutateDocument(await generatedSource(), (xml) => {
      const original = `<w:t xml:space="preserve">${marker}`;
      const replacement =
        `<w:t xml:space="preserve">${first}</w:t></w:r>` +
        '<w:r><w:rPr><w:color w:val="FFFFFF"/></w:rPr>' +
        `<w:t xml:space="preserve">${second}`;
      if (!xml.includes(original)) {
        throw new Error("Generated Alpha marker was not found");
      }
      return xml.replace(original, replacement);
    });
    const inspection = inspectSemanticWhiteCarrier(
      split,
      QUALIFICATION_FIXTURE.markers,
    );
    const alpha = inspection.markerMechanisms.filter(
      (entry) => entry.markerId === "alpha",
    );

    expect(alpha).toHaveLength(2);
    expect(alpha).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          runIndex: 1,
          semanticDirectWhite: true,
          forbiddenProperties: [],
        }),
        expect.objectContaining({
          runIndex: 2,
          semanticDirectWhite: true,
          forbiddenProperties: [],
        }),
      ]),
    );
    expect(inspection.transformed.markerOccurrences).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ markerId: "alpha", runIndices: [1, 2] }),
      ]),
    );
  });

  test("rejects a split marker when either overlapping run is non-white", async () => {
    const marker = QUALIFICATION_FIXTURE.markers.alpha;
    const first = marker.slice(0, 5);
    const second = marker.slice(5);
    const split = mutateDocument(await generatedSource(), (xml) => {
      const original = `<w:t xml:space="preserve">${marker}`;
      const replacement =
        `<w:t xml:space="preserve">${first}</w:t></w:r>` +
        '<w:r><w:rPr><w:color w:val="FFFFFE"/></w:rPr>' +
        `<w:t xml:space="preserve">${second}`;
      if (!xml.includes(original)) {
        throw new Error("Generated Alpha marker was not found");
      }
      return xml.replace(original, replacement);
    });
    const alpha = (await markerMechanisms(split)).filter(
      (entry) => entry.markerId === "alpha",
    );

    expect(alpha).toHaveLength(2);
    expect(alpha[0]?.semanticDirectWhite).toBe(true);
    expect(alpha[1]?.semanticDirectWhite).toBe(false);
    expect(alpha[1]?.forbiddenProperties).toContain("directColorValue");
  });

  test("propagates transformed-package errors", () => {
    expect(() =>
      inspectSemanticWhiteCarrier(
        new Uint8Array([0x00, 0x00]),
        QUALIFICATION_FIXTURE.markers,
      ),
    ).toThrow("Not a ZIP/DOCX package");
  });
});
