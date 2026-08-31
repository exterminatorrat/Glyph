import { strFromU8, strToU8, unzipSync, zipSync, type Unzipped } from "fflate";
import { describe, expect, test } from "vitest";
import { generateDocxAlternativeCarrier } from "../../src/documents/docx/docx-alternative-carrier-bakeoff-v1";
import {
  CANDIDATE_FIXTURE,
  FIXED_MARKER_ALPHA,
} from "../../research/experiments/docx-alternative-carrier-bakeoff-v1/fixture";
import { inspectTransformedDocx } from "../../research/experiments/docx-alternative-carrier-bakeoff-v1/inspect-transformed-docx";

const requiredEntry = (entries: Unzipped, name: string): Unzipped[string] => {
  const entry = entries[name];
  if (!entry) {
    throw new Error(`Missing test entry: ${name}`);
  }
  return entry;
};

const mutateEntry = (
  bytes: Uint8Array,
  name: string,
  mutate: (value: string) => string,
): Uint8Array => {
  const entries = unzipSync(bytes);
  entries[name] = strToU8(mutate(strFromU8(requiredEntry(entries, name))));
  return zipSync(entries);
};

const generatedBodyPackage = async (): Promise<Uint8Array> =>
  generateDocxAlternativeCarrier(
    "matching-color-body-v1",
    CANDIDATE_FIXTURE,
  );

const appendBeforeClosingTag = (
  value: string,
  closingTag: string,
  addition: string,
): string => value.replace(closingTag, `${addition}${closingTag}`);

describe("transformed DOCX inspector", () => {
  test("finds one Alpha occurrence across adjacent runs with each run format", async () => {
    const bytes = await generatedBodyPackage();
    const first = FIXED_MARKER_ALPHA.slice(0, 5);
    const second = FIXED_MARKER_ALPHA.slice(5);
    const split = mutateEntry(bytes, "word/document.xml", (xml) =>
      xml.replace(
        FIXED_MARKER_ALPHA,
        `${first}</w:t></w:r><w:r><w:rPr><w:sz w:val="2"/><w:szCs w:val="2"/></w:rPr><w:t xml:space="preserve">${second}`,
      ),
    );

    const inspection = inspectTransformedDocx(
      split,
      CANDIDATE_FIXTURE.markers,
    );
    const alphaOccurrences = inspection.markerOccurrences.filter(
      (occurrence) => occurrence.markerId === "alpha",
    );

    expect(inspection.markerPresence.alpha).toBe("present");
    expect(alphaOccurrences).toEqual([
      {
        markerId: "alpha",
        partName: "word/document.xml",
        location: "body",
        paragraphIndex: 0,
        runIndices: [1, 2],
        runFormats: [
          {
            hidden: false,
            color: "FFFFFF",
            sizeHalfPoints: null,
            sizeComplexScriptHalfPoints: null,
          },
          {
            hidden: false,
            color: null,
            sizeHalfPoints: 2,
            sizeComplexScriptHalfPoints: 2,
          },
        ],
      },
    ]);
  });

  test("resolves a nonstandard referenced header part by its WordprocessingML root", async () => {
    const bytes = await generateDocxAlternativeCarrier(
      "docx-header-text-v1",
      CANDIDATE_FIXTURE,
    );
    const entries = unzipSync(bytes);
    const header = requiredEntry(entries, "word/header1.xml");
    const headerRelationships = entries["word/_rels/header1.xml.rels"];
    if (headerRelationships) {
      entries["word/_rels/regional-header.xml.rels"] = headerRelationships;
      delete entries["word/_rels/header1.xml.rels"];
    }
    entries["word/regional-header.xml"] = header;
    delete entries["word/header1.xml"];
    entries["[Content_Types].xml"] = strToU8(
      strFromU8(requiredEntry(entries, "[Content_Types].xml")).replace(
        "/word/header1.xml",
        "/word/regional-header.xml",
      ),
    );
    entries["word/_rels/document.xml.rels"] = strToU8(
      strFromU8(
        requiredEntry(entries, "word/_rels/document.xml.rels"),
      ).replace("header1.xml", "regional-header.xml"),
    );

    const inspection = inspectTransformedDocx(
      zipSync(entries),
      CANDIDATE_FIXTURE.markers,
    );

    expect(
      inspection.markerOccurrences.map((occurrence) => [
        occurrence.markerId,
        occurrence.partName,
        occurrence.location,
      ]),
    ).toEqual([
      ["alpha", "word/regional-header.xml", "header"],
      ["beta", "word/regional-header.xml", "header"],
    ]);
  });

  test("recognizes standard WordprocessingML text-part names by root", async () => {
    const bytes = await generatedBodyPackage();
    const entries = unzipSync(bytes);
    const textParts = [
      ["word/footer1.xml", "ftr", "footer"],
      ["word/footnotes.xml", "footnotes", "footnote"],
      ["word/endnotes.xml", "endnotes", "endnote"],
      ["word/comments.xml", "comments", "comments"],
    ] as const;
    const documentRelationships = requiredEntry(
      entries,
      "word/_rels/document.xml.rels",
    );
    const contentTypes = requiredEntry(entries, "[Content_Types].xml");
    const relationships = textParts
      .map(
        ([partName, root], index) => {
          const fileName = partName.slice("word/".length);
          entries[partName] = strToU8(
            `<w:${root} xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:r><w:t>synthetic ${root}</w:t></w:r></w:p></w:${root}>`,
          );
          return `<Relationship Id="rIdText${index}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/${root === "footnotes" ? "footnotes" : root === "endnotes" ? "endnotes" : root === "comments" ? "comments" : "footer"}" Target="${fileName}"/>`;
        },
      )
      .join("");
    entries["word/_rels/document.xml.rels"] = strToU8(
      appendBeforeClosingTag(
        strFromU8(documentRelationships),
        "</Relationships>",
        relationships,
      ),
    );
    entries["[Content_Types].xml"] = strToU8(
      appendBeforeClosingTag(
        strFromU8(contentTypes),
        "</Types>",
        textParts
          .map(
            ([partName, root]) =>
              `<Override PartName="/${partName}" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.${root}+xml"/>`,
          )
          .join(""),
      ),
    );

    const inspection = inspectTransformedDocx(
      zipSync(entries),
      CANDIDATE_FIXTURE.markers,
    );
    expect(
      textParts.map(([partName]) =>
        inspection.paragraphs.find((paragraph) => paragraph.partName === partName),
      ),
    ).toMatchObject(
      textParts.map(([partName, root, location]) => ({
        partName,
        location,
        paragraphIndex: 0,
        text: `synthetic ${root}`,
      })),
    );
  });

  test("reports active content and relationship safety independently of markers", async () => {
    const bytes = await generatedBodyPackage();
    const entries = unzipSync(bytes);
    entries["word/vbaProject.bin"] = new Uint8Array([0x00, 0x01, 0x02]);
    entries["[Content_Types].xml"] = strToU8(
      appendBeforeClosingTag(
        strFromU8(requiredEntry(entries, "[Content_Types].xml")),
        "</Types>",
        '<Override PartName="/word/vbaProject.bin" ContentType="application/vnd.ms-word.document.macroEnabled.main+xml"/>',
      ),
    );
    entries["word/_rels/document.xml.rels"] = strToU8(
      appendBeforeClosingTag(
        strFromU8(
          requiredEntry(entries, "word/_rels/document.xml.rels"),
        ),
        "</Relationships>",
        '<Relationship Id="rIdExternal" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="https://example.invalid/glyph" TargetMode="External"/><Relationship Id="rIdMissing" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/oleObject" Target="missing.xml"/>',
      ),
    );

    const inspection = inspectTransformedDocx(
      zipSync(entries),
      CANDIDATE_FIXTURE.markers,
    );

    expect(inspection.markerPresence).toEqual({
      alpha: "present",
      beta: "present",
    });
    expect(inspection.safety.externalRelationships).toEqual([
      "word/_rels/document.xml.rels: http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink -> https://example.invalid/glyph [External]",
    ]);
    expect(inspection.safety.unresolvedRelationshipTargets).toEqual([
      "word/_rels/document.xml.rels: http://schemas.openxmlformats.org/officeDocument/2006/relationships/oleObject -> missing.xml [target does not resolve to word/missing.xml]",
    ]);
    expect(inspection.safety.activeContentEntries).toEqual([
      "word/vbaProject.bin",
    ]);
    expect(inspection.safety.activeRelationshipTypes).toEqual([
      "http://schemas.openxmlformats.org/officeDocument/2006/relationships/oleObject",
    ]);
    expect(inspection.safety.macroContentTypes).toEqual([
      "application/vnd.ms-word.document.macroEnabled.main+xml",
    ]);
  });

  test("throws stable errors for invalid packages and XML parts", async () => {
    const bytes = await generatedBodyPackage();
    const entries = unzipSync(bytes);
    delete entries["word/document.xml"];

    expect(() =>
      inspectTransformedDocx(new Uint8Array([0x50]), CANDIDATE_FIXTURE.markers),
    ).toThrow("Not a ZIP/DOCX package");
    expect(() =>
      inspectTransformedDocx(new Uint8Array([0x00, 0x00]), CANDIDATE_FIXTURE.markers),
    ).toThrow("Not a ZIP/DOCX package");
    expect(() =>
      inspectTransformedDocx(zipSync(entries), CANDIDATE_FIXTURE.markers),
    ).toThrow("Missing required DOCX entry: word/document.xml");

    const malformedXml = mutateEntry(bytes, "docProps/app.xml", () => "<Properties>");
    expect(() =>
      inspectTransformedDocx(malformedXml, CANDIDATE_FIXTURE.markers),
    ).toThrow("Invalid XML entry docProps/app.xml");

    const malformedRelationships = mutateEntry(
      bytes,
      "word/_rels/document.xml.rels",
      () => "<Relationships>",
    );
    expect(() =>
      inspectTransformedDocx(
        malformedRelationships,
        CANDIDATE_FIXTURE.markers,
      ),
    ).toThrow("Invalid XML entry word/_rels/document.xml.rels");
  });
});
