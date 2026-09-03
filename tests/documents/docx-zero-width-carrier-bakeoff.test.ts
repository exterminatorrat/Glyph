import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { describe, expect, test } from "vitest";
import {
  CANDIDATE_A,
  CANDIDATE_B,
  CANDIDATE_C,
  ZERO_WIDTH_CANDIDATES,
  ZERO_WIDTH_FIXTURE,
  VISIBLE_PARAGRAPHS,
  type CandidateId,
} from "../../research/experiments/docx-zero-width-carrier-bakeoff-v1/fixture.ts";
import { encodeCarrier } from "../../research/experiments/docx-zero-width-carrier-bakeoff-v1/frame.ts";
import {
  inspectZeroWidthDocx,
  type ZeroWidthDocxInspection,
} from "../../research/experiments/docx-zero-width-carrier-bakeoff-v1/inspect-zero-width-docx.ts";
import { generateZeroWidthCarrierDocx } from "../../src/documents/docx/docx-zero-width-carrier-bakeoff-v1.ts";

const cleanSafety = {
  externalRelationships: [],
  unresolvedRelationshipTargets: [],
  activeContentEntries: [],
  activeRelationshipTypes: [],
  macroContentTypes: [],
} as const;

const mutateEntry = (
  source: Uint8Array,
  entryName: string,
  mutate: (xml: string) => string,
): Uint8Array => {
  const entries = unzipSync(source);
  const entry = entries[entryName];
  if (!entry) throw new Error(`Missing test entry ${entryName}`);
  entries[entryName] = strToU8(mutate(strFromU8(entry)));
  return zipSync(entries, { level: 6, mtime: new Date("1980-01-01T00:00:00Z") });
};

const carrierRunMutation = (
  source: Uint8Array,
  candidateId: CandidateId,
  markerId: "alpha" | "beta",
  mutate: (run: string) => string,
): Uint8Array =>
  mutateEntry(source, "word/document.xml", (xml) => {
    const carrier = encodeCarrier(candidateId, markerId);
    const carrierIndex = xml.indexOf(carrier);
    if (carrierIndex < 0) throw new Error("Carrier not found in test package");
    const start = xml.lastIndexOf("<w:r>", carrierIndex);
    const endMarker = "</w:r>";
    const endIndex = xml.indexOf(endMarker, carrierIndex);
    if (start < 0 || endIndex < 0) throw new Error("Carrier run not found in test package");
    const end = endIndex + endMarker.length;
    return `${xml.slice(0, start)}${mutate(xml.slice(start, end))}${xml.slice(end)}`;
  });

const inspectSource = async (
  candidateId: CandidateId,
): Promise<{ bytes: Uint8Array; inspection: ZeroWidthDocxInspection }> => {
  const bytes = await generateZeroWidthCarrierDocx(ZERO_WIDTH_FIXTURE, candidateId);
  return { bytes, inspection: inspectZeroWidthDocx(bytes, candidateId, "source") };
};

describe("zero-width carrier DOCX generator and inspector", () => {
  test.each(ZERO_WIDTH_CANDIDATES)(
    "generates the exact $id source contract",
    async (candidate) => {
      const { inspection } = await inspectSource(candidate.id);
      expect(inspection.markerPresence).toEqual({ alpha: "present", beta: "present" });
      expect(inspection.visibleBodyParagraphs).toEqual(VISIBLE_PARAGRAPHS);
      expect(inspection.carrierOccurrences).toEqual([
        expect.objectContaining({
          markerId: "alpha",
          partName: "word/document.xml",
          location: "body",
          paragraphIndex: 0,
          runIndices: [1],
          codePointCount: candidate.codePointsPerFrame,
        }),
        expect.objectContaining({
          markerId: "beta",
          partName: "word/document.xml",
          location: "body",
          paragraphIndex: 2,
          runIndices: [1],
          codePointCount: candidate.codePointsPerFrame,
        }),
      ]);
      expect(inspection.frameErrors).toEqual([]);
      expect(inspection.unexpectedCandidateCodePoints).toEqual([]);
      expect(inspection.carrierRunProperties).toEqual([]);
      expect(inspection.forbiddenRunProperties).toEqual([]);
      expect(inspection.safety).toEqual(cleanSafety);
    },
  );

  test.each([CANDIDATE_A, CANDIDATE_B, CANDIDATE_C])(
    "is deterministic for $id",
    async (candidate) => {
      const first = await generateZeroWidthCarrierDocx(ZERO_WIDTH_FIXTURE, candidate.id);
      const second = await generateZeroWidthCarrierDocx(ZERO_WIDTH_FIXTURE, candidate.id);
      expect(second).toEqual(first);
    },
  );

  test("does not carry readable marker values or run properties", async () => {
    const bytes = await generateZeroWidthCarrierDocx(
      ZERO_WIDTH_FIXTURE,
      "join-control-binary-v1",
    );
    const entries = unzipSync(bytes);
    const packageText = Object.values(entries).map((entry) => strFromU8(entry)).join("\n");
    expect(packageText).not.toContain("GLYPH TEST MARKER ALPHA");
    expect(packageText).not.toContain("GLYPH TEST MARKER BETA");
    expect(inspectZeroWidthDocx(bytes, "join-control-binary-v1", "source").coreMetadata).toEqual({
      creator: "synthetic_expected",
      lastModifiedBy: "synthetic_expected",
    });
  });

  test("reports direct enabled and disabled hidden properties", async () => {
    const source = await generateZeroWidthCarrierDocx(ZERO_WIDTH_FIXTURE, CANDIDATE_A.id);
    const enabled = carrierRunMutation(source, CANDIDATE_A.id, "alpha", (run) =>
      run.replace("<w:t", "<w:rPr><w:vanish/></w:rPr><w:t"),
    );
    const enabledInspection = inspectZeroWidthDocx(enabled, CANDIDATE_A.id, "source");
    expect(enabledInspection.forbiddenRunProperties).toEqual([
      expect.objectContaining({ property: "vanish" }),
    ]);

    const disabled = carrierRunMutation(source, CANDIDATE_A.id, "alpha", (run) =>
      run.replace("<w:t", '<w:rPr><w:vanish w:val="0"/></w:rPr><w:t'),
    );
    expect(inspectZeroWidthDocx(disabled, CANDIDATE_A.id, "source").forbiddenRunProperties).toEqual([]);
  });

  test.each([
    ["docDefaults", (source: Uint8Array) => mutateEntry(source, "word/styles.xml", (xml) =>
      xml.replace("<w:rPrDefault/>", "<w:rPrDefault><w:rPr><w:vanish/></w:rPr></w:rPrDefault>"),
    )],
    ["character style", (source: Uint8Array) => {
      const withStyle = mutateEntry(source, "word/styles.xml", (xml) =>
        xml.replace("</w:styles>", '<w:style w:type="character" w:styleId="HiddenChar"><w:rPr><w:vanish/></w:rPr></w:style></w:styles>'),
      );
      return carrierRunMutation(withStyle, CANDIDATE_A.id, "alpha", (run) =>
        run.replace("<w:t", '<w:rPr><w:rStyle w:val="HiddenChar"/></w:rPr><w:t'),
      );
    }],
    ["paragraph style", (source: Uint8Array) => {
      const withStyle = mutateEntry(source, "word/styles.xml", (xml) =>
        xml.replace("</w:styles>", '<w:style w:type="paragraph" w:styleId="HiddenPara"><w:rPr><w:vanish/></w:rPr></w:style></w:styles>'),
      );
      return mutateEntry(withStyle, "word/document.xml", (xml) =>
        xml.replace("<w:p>", '<w:p><w:pPr><w:pStyle w:val="HiddenPara"/></w:pPr>'),
      );
    }],
    ["basedOn chain", (source: Uint8Array) => {
      const withStyle = mutateEntry(source, "word/styles.xml", (xml) =>
        xml.replace("</w:styles>", '<w:style w:type="character" w:styleId="HiddenBase"><w:rPr><w:vanish/></w:rPr></w:style><w:style w:type="character" w:styleId="HiddenChar"><w:basedOn w:val="HiddenBase"/></w:style></w:styles>'),
      );
      return carrierRunMutation(withStyle, CANDIDATE_A.id, "alpha", (run) =>
        run.replace("<w:t", '<w:rPr><w:rStyle w:val="HiddenChar"/></w:rPr><w:t'),
      );
    }],
  ] as const)("resolves effective hidden state through %s", async (_label, makeBytes) => {
    const source = await generateZeroWidthCarrierDocx(ZERO_WIDTH_FIXTURE, CANDIDATE_A.id);
    const mutated = makeBytes(source);
    const inspection = inspectZeroWidthDocx(mutated, CANDIDATE_A.id, "source");
    expect(inspection.forbiddenRunProperties.some(({ property }) => property === "vanish")).toBe(true);
  });

  test.each([
    ["implicit paragraph default", (source: Uint8Array) => mutateEntry(source, "word/styles.xml", (xml) =>
      xml.replace("</w:styles>", '<w:style w:type="paragraph" w:default="1" w:styleId="HiddenDefaultPara"><w:rPr><w:vanish/></w:rPr></w:style></w:styles>'),
    )],
    ["implicit character default", (source: Uint8Array) => mutateEntry(source, "word/styles.xml", (xml) =>
      xml.replace("</w:styles>", '<w:style w:type="character" w:default="1" w:styleId="HiddenDefaultChar"><w:rPr><w:vanish/></w:rPr></w:style></w:styles>'),
    )],
  ] as const)("resolves hidden state through %s when explicit style is absent", async (_label, makeBytes) => {
    const source = await generateZeroWidthCarrierDocx(ZERO_WIDTH_FIXTURE, CANDIDATE_A.id);
    const inspection = inspectZeroWidthDocx(makeBytes(source), CANDIDATE_A.id, "source");
    expect(inspection.forbiddenRunProperties.some(({ property }) => property === "vanish")).toBe(true);
  });

  test("flags ambiguous and incompatible implicit defaults as unresolved", async () => {
    const source = await generateZeroWidthCarrierDocx(ZERO_WIDTH_FIXTURE, CANDIDATE_A.id);
    const ambiguous = mutateEntry(source, "word/styles.xml", (xml) =>
      xml.replace("</w:styles>", '<w:style w:type="character" w:default="1" w:styleId="DefaultOne"><w:rPr/></w:style><w:style w:type="character" w:default="1" w:styleId="DefaultTwo"><w:rPr/></w:style></w:styles>'),
    );
    expect(inspectZeroWidthDocx(ambiguous, CANDIDATE_A.id, "source").forbiddenRunProperties).toEqual([
      expect.objectContaining({ property: "unresolved-style-inheritance" }),
      expect.objectContaining({ property: "unresolved-style-inheritance" }),
    ]);
    const incompatible = mutateEntry(source, "word/styles.xml", (xml) =>
      xml.replace("</w:styles>", '<w:style w:type="character" w:styleId="CharacterBase"><w:rPr><w:vanish/></w:rPr></w:style><w:style w:type="paragraph" w:default="1" w:styleId="ParagraphDefault"><w:basedOn w:val="CharacterBase"/></w:style></w:styles>'),
    );
    expect(inspectZeroWidthDocx(incompatible, CANDIDATE_A.id, "source").forbiddenRunProperties).toEqual([
      expect.objectContaining({ property: "unresolved-style-inheritance" }),
      expect.objectContaining({ property: "unresolved-style-inheritance" }),
    ]);
  });

  test("does not treat explicit-false paragraph or character styles as defaults", async () => {
    const source = await generateZeroWidthCarrierDocx(ZERO_WIDTH_FIXTURE, CANDIDATE_A.id);
    const mutated = mutateEntry(source, "word/styles.xml", (xml) =>
      xml.replace(
        "</w:styles>",
        '<w:style w:type="paragraph" w:default="0" w:styleId="FalseParagraphOne"><w:rPr><w:vanish/></w:rPr></w:style><w:style w:type="paragraph" w:default="false" w:styleId="FalseParagraphTwo"><w:rPr><w:vanish/></w:rPr></w:style><w:style w:type="character" w:default="off" w:styleId="FalseCharacter"><w:rPr><w:vanish/></w:rPr></w:style></w:styles>',
      ),
    );
    const inspection = inspectZeroWidthDocx(mutated, CANDIDATE_A.id, "source");
    expect(inspection.forbiddenRunProperties).toEqual([]);
    expect(inspection.frameErrors).toEqual([]);
  });

  test("reports missing and cyclic style inheritance as unresolved", async () => {
    const source = await generateZeroWidthCarrierDocx(ZERO_WIDTH_FIXTURE, CANDIDATE_A.id);
    const missing = carrierRunMutation(source, CANDIDATE_A.id, "alpha", (run) =>
      run.replace("<w:t", '<w:rPr><w:rStyle w:val="MissingStyle"/></w:rPr><w:t'),
    );
    const missingInspection = inspectZeroWidthDocx(missing, CANDIDATE_A.id, "source");
    expect(missingInspection.forbiddenRunProperties).toEqual([
      expect.objectContaining({ property: "unresolved-style-inheritance" }),
    ]);

    const cyclicStyles = mutateEntry(source, "word/styles.xml", (xml) =>
      xml.replace("</w:styles>", '<w:style w:type="character" w:styleId="CycleA"><w:basedOn w:val="CycleB"/></w:style><w:style w:type="character" w:styleId="CycleB"><w:basedOn w:val="CycleA"/></w:style></w:styles>'),
    );
    const cyclic = carrierRunMutation(cyclicStyles, CANDIDATE_A.id, "alpha", (run) =>
      run.replace("<w:t", '<w:rPr><w:rStyle w:val="CycleA"/></w:rPr><w:t'),
    );
    const cyclicInspection = inspectZeroWidthDocx(cyclic, CANDIDATE_A.id, "source");
    expect(cyclicInspection.forbiddenRunProperties).toEqual([
      expect.objectContaining({ property: "unresolved-style-inheritance" }),
    ]);
  });

  test("retains benign direct properties as safe evidence", async () => {
    const source = await generateZeroWidthCarrierDocx(ZERO_WIDTH_FIXTURE, CANDIDATE_B.id);
    const mutated = carrierRunMutation(source, CANDIDATE_B.id, "beta", (run) =>
      run.replace(
        "<w:t",
        '<w:rPr><w:color w:val="FF00AA"/><w:sz w:val="20"/><w:lang w:val="en-US"/><w:highlight w:val="yellow"/></w:rPr><w:t',
      ),
    );
    const inspection = inspectZeroWidthDocx(mutated, CANDIDATE_B.id, "transformed");
    expect(inspection.carrierRunProperties).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: "color", valueClassification: "safe_literal", safeValue: "FF00AA" }),
        expect.objectContaining({ property: "sz", valueClassification: "safe_literal", safeValue: "20" }),
      ]),
    );
    expect(inspection.forbiddenRunProperties).toEqual([]);
    expect(inspection.frameErrors).toEqual([]);
    expect(inspection.carrierOccurrences[1]?.anchor).toBe("beta_frozen");
    expect(inspection.visibleBodyParagraphs).toEqual(VISIBLE_PARAGRAPHS);
  });

  test("rejects even an empty run-property container in canonical source mode", async () => {
    const source = await generateZeroWidthCarrierDocx(ZERO_WIDTH_FIXTURE, CANDIDATE_A.id);
    const mutated = carrierRunMutation(source, CANDIDATE_A.id, "alpha", (run) =>
      run.replace("<w:t", "<w:rPr/><w:t"),
    );
    const inspection = inspectZeroWidthDocx(mutated, CANDIDATE_A.id, "source");
    expect(inspection.carrierRunProperties).toEqual([]);
    expect(inspection.frameErrors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("mixed carrier run"),
        expect.stringContaining("carrier anchor is not frozen"),
      ]),
    );
  });

  test("accepts editor-split carrier text while retaining all run indexes", async () => {
    const source = await generateZeroWidthCarrierDocx(ZERO_WIDTH_FIXTURE, CANDIDATE_A.id);
    const alpha = encodeCarrier(CANDIDATE_A.id, "alpha");
    const split = mutateEntry(source, "word/document.xml", (xml) =>
      xml.replace(
        alpha,
        `${alpha.slice(0, 60)}</w:t></w:r><w:r><w:t xml:space="preserve">${alpha.slice(60)}`,
      ),
    );
    const inspection = inspectZeroWidthDocx(split, CANDIDATE_A.id, "transformed");
    expect(inspection.frameErrors).toEqual([]);
    expect(inspection.carrierOccurrences[0]?.runIndices).toEqual([1, 2]);
  });

  test("accepts an editor-merged transformed carrier while keeping canonical source runs strict", async () => {
    const source = await generateZeroWidthCarrierDocx(ZERO_WIDTH_FIXTURE, CANDIDATE_A.id);
    const alpha = encodeCarrier(CANDIDATE_A.id, "alpha");
    const merged = mutateEntry(source, "word/document.xml", (xml) =>
      xml.replace(
        `</w:t></w:r><w:r><w:t xml:space="preserve">${alpha}`,
        alpha,
      ),
    );
    const transformed = inspectZeroWidthDocx(merged, CANDIDATE_A.id, "transformed");
    expect(transformed.frameErrors).toEqual([]);
    expect(transformed.carrierOccurrences[0]?.runIndices).toEqual([0]);
    expect(transformed.carrierOccurrences[0]?.anchor).toBe("alpha_frozen");
    expect(transformed.visibleBodyParagraphs).toEqual(VISIBLE_PARAGRAPHS);

    const canonical = inspectZeroWidthDocx(merged, CANDIDATE_A.id, "source");
    expect(canonical.frameErrors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("mixed carrier run"),
        expect.stringContaining("carrier anchor is not frozen"),
      ]),
    );
  });

  test("does not accept foreign-namespace text lookalikes as ordinary carrier text", async () => {
    const source = await generateZeroWidthCarrierDocx(ZERO_WIDTH_FIXTURE, CANDIDATE_A.id);
    const alpha = encodeCarrier(CANDIDATE_A.id, "alpha");
    const foreign = mutateEntry(source, "word/document.xml", (xml) =>
      xml.replace(
        `<w:t xml:space="preserve">${alpha}</w:t>`,
        `<x:t xmlns:x="urn:glyph:foreign-test">${alpha}</x:t>`,
      ),
    );
    const inspection = inspectZeroWidthDocx(foreign, CANDIDATE_A.id, "transformed");
    expect(inspection.markerPresence.alpha).toBe("absent");
    expect(inspection.carrierOccurrences).toHaveLength(2);
    expect(inspection.carrierOccurrences[0]).toMatchObject({
      markerId: null,
      context: "non_ordinary",
      codePointCount: 120,
    });
    expect(inspection.frameErrors).toEqual(
      expect.arrayContaining([expect.stringContaining("non-ordinary carrier context")]),
    );
  });

  test.each([
    [
      "arbitrary foreign element",
      (xml: string, alpha: string) =>
        xml.replace(
          "</w:p>",
          `<w:r><x:carrier xmlns:x="urn:glyph:foreign-test">${alpha}</x:carrier></w:r></w:p>`,
        ),
    ],
    [
      "direct paragraph text",
      (xml: string, alpha: string) => xml.replace("</w:p>", `${alpha}</w:p>`),
    ],
  ] as const)("records an added %s duplicate alongside intact valid frames", async (_label, mutate) => {
    const source = await generateZeroWidthCarrierDocx(ZERO_WIDTH_FIXTURE, CANDIDATE_A.id);
    const alpha = encodeCarrier(CANDIDATE_A.id, "alpha");
    const foreignDuplicate = mutateEntry(source, "word/document.xml", (xml) =>
      mutate(xml, alpha),
    );
    const inspection = inspectZeroWidthDocx(
      foreignDuplicate,
      CANDIDATE_A.id,
      "transformed",
    );
    expect(inspection.carrierOccurrences).toHaveLength(3);
    expect(inspection.carrierOccurrences).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          markerId: null,
          context: "non_ordinary",
          codePointCount: 120,
        }),
      ]),
    );
    expect(inspection.markerPresence).toEqual({ alpha: "present", beta: "present" });
    expect(inspection.frameErrors).toEqual(
      expect.arrayContaining([expect.stringContaining("non-ordinary carrier context")]),
    );
  });

  test("rejects moved, duplicate, non-body, and damaged carrier frames", async () => {
    const source = await generateZeroWidthCarrierDocx(ZERO_WIDTH_FIXTURE, CANDIDATE_A.id);
    const alpha = encodeCarrier(CANDIDATE_A.id, "alpha");
    const beta = encodeCarrier(CANDIDATE_A.id, "beta");
    const moved = mutateEntry(source, "word/document.xml", (xml) =>
      xml.replace(alpha, "PLACEHOLDER").replace(beta, alpha).replace("PLACEHOLDER", beta),
    );
    const movedInspection = inspectZeroWidthDocx(moved, CANDIDATE_A.id, "transformed");
    expect(movedInspection.carrierOccurrences.map(({ paragraphIndex }) => paragraphIndex)).toEqual([0, 2]);
    expect(movedInspection.carrierOccurrences.map(({ markerId }) => markerId)).toEqual(["beta", "alpha"]);

    const duplicate = mutateEntry(source, "word/document.xml", (xml) =>
      xml.replace("</w:p>", `<w:r><w:t xml:space="preserve">${alpha}</w:t></w:r></w:p>`),
    );
    const duplicateInspection = inspectZeroWidthDocx(duplicate, CANDIDATE_A.id, "transformed");
    expect(duplicateInspection.frameErrors.some((error) => error.includes("duplicate alpha"))).toBe(true);

    const nonBody = mutateEntry(source, "word/comments.xml", (xml) =>
      xml.replace(
        /<w:comments([^>]*)\/>$/,
        `<w:comments$1><w:comment w:id="99"><w:p><w:r><w:t>${alpha}</w:t></w:r></w:p></w:comment></w:comments>`,
      ),
    );
    const nonBodyInspection = inspectZeroWidthDocx(nonBody, CANDIDATE_A.id, "transformed");
    expect(nonBodyInspection.carrierOccurrences.some(({ location }) => location !== "body")).toBe(true);

    const damaged = mutateEntry(source, "word/document.xml", (xml) => xml.replace(alpha, alpha.slice(1)));
    const damagedInspection = inspectZeroWidthDocx(damaged, CANDIDATE_A.id, "transformed");
    expect(damagedInspection.frameErrors.length).toBeGreaterThan(0);
    expect(damagedInspection.markerPresence.alpha).toBe("absent");
    expect(damagedInspection.carrierOccurrences).toHaveLength(2);
    expect(damagedInspection.carrierOccurrences[0]?.decodedFrame).toBeNull();
  });

  test("records a relocated or mixed carrier with a non-frozen anchor", async () => {
    const source = await generateZeroWidthCarrierDocx(ZERO_WIDTH_FIXTURE, CANDIDATE_A.id);
    const alpha = encodeCarrier(CANDIDATE_A.id, "alpha");
    const relocated = mutateEntry(source, "word/document.xml", (xml) => {
      const firstParagraphEnd = xml.indexOf("</w:p>");
      const alphaIndex = xml.indexOf(alpha);
      const runStart = xml.lastIndexOf("<w:r>", alphaIndex);
      const runEnd = xml.indexOf("</w:r>", alphaIndex) + "</w:r>".length;
      if (firstParagraphEnd < 0 || runStart < 0 || runEnd < 0) throw new Error("Missing test anchor");
      const run = xml.slice(runStart, runEnd);
      return `${xml.slice(0, runStart)}${xml.slice(runEnd, firstParagraphEnd)}${run}${xml.slice(firstParagraphEnd)}`;
    });
    const relocatedInspection = inspectZeroWidthDocx(relocated, CANDIDATE_A.id, "transformed");
    expect(JSON.stringify(relocatedInspection.carrierOccurrences[0])).toContain("not_frozen");

    const mixed = carrierRunMutation(source, CANDIDATE_A.id, "alpha", (run) =>
      run.replace("</w:t>", "X</w:t>"),
    );
    const mixedInspection = inspectZeroWidthDocx(mixed, CANDIDATE_A.id, "transformed");
    expect(mixedInspection.carrierOccurrences).toHaveLength(2);
    expect(JSON.stringify(mixedInspection.carrierOccurrences[0])).toContain("not_frozen");
    expect(mixedInspection.visibleBodyParagraphs[0]).toBe("redacted-visible-body");
  });

  test.each([
    ["field", (run: string) => `<w:fldSimple w:instr="PAGE">${run}</w:fldSimple>`],
    ["deletion", (run: string) => `<w:del w:id="1">${run}</w:del>`],
    ["text box", (run: string) => `<w:txbxContent>${run}</w:txbxContent>`],
    ["instruction text", (run: string) => run.replace(/<w:t(.*?)>/, "<w:instrText$1>").replace("</w:t>", "</w:instrText>")],
  ] as const)("does not accept %s text as ordinary carrier context", async (_label, wrap) => {
    const source = await generateZeroWidthCarrierDocx(ZERO_WIDTH_FIXTURE, CANDIDATE_A.id);
    const mutated = carrierRunMutation(source, CANDIDATE_A.id, "alpha", wrap);
    const inspection = inspectZeroWidthDocx(mutated, CANDIDATE_A.id, "transformed");
    expect(inspection.markerPresence.alpha).toBe("absent");
    expect(inspection.frameErrors.length).toBeGreaterThan(0);
    expect(inspection.carrierOccurrences).toHaveLength(2);
    expect(inspection.carrierOccurrences[0]?.decodedFrame).toBeNull();
  });

  test("rejects a visible character inserted into a carrier", async () => {
    const source = await generateZeroWidthCarrierDocx(ZERO_WIDTH_FIXTURE, CANDIDATE_C.id);
    const beta = encodeCarrier(CANDIDATE_C.id, "beta");
    const damaged = mutateEntry(source, "word/document.xml", (xml) =>
      xml.replace(beta, `${beta.slice(0, 7)}X${beta.slice(7)}`),
    );
    const inspection = inspectZeroWidthDocx(damaged, CANDIDATE_C.id, "transformed");
    expect(inspection.frameErrors.length).toBeGreaterThan(0);
    expect(inspection.visibleBodyParagraphs[2]).toBe("redacted-visible-body");
  });

  test("records package safety and redacts relationship values", async () => {
    const source = await generateZeroWidthCarrierDocx(ZERO_WIDTH_FIXTURE, CANDIDATE_C.id);
    const unsafe = mutateEntry(source, "_rels/.rels", (xml) =>
      xml.replace(
        "</Relationships>",
        '<Relationship Id="rSentinel" Type="https://sentinel.invalid/private/type" Target="https://sentinel.invalid/private/url" TargetMode="External"/></Relationships>',
      ),
    );
    const inspection = inspectZeroWidthDocx(unsafe, CANDIDATE_C.id, "source");
    expect(inspection.safety.externalRelationships.length).toBeGreaterThan(0);
    const serialized = JSON.stringify(inspection);
    expect(serialized).not.toContain("sentinel.invalid");
    expect(serialized).not.toContain("private/url");
    expect(serialized).not.toContain("private/type");
  });

  test("redacts attacker-chosen OOXML property names", async () => {
    const source = await generateZeroWidthCarrierDocx(ZERO_WIDTH_FIXTURE, CANDIDATE_A.id);
    const mutated = carrierRunMutation(source, CANDIDATE_A.id, "alpha", (run) =>
      run.replace("<w:t", "<w:rPr><w:PersonalNameSentinel/></w:rPr><w:t"),
    );
    const inspection = inspectZeroWidthDocx(mutated, CANDIDATE_A.id, "transformed");
    expect(JSON.stringify(inspection)).not.toContain("PersonalNameSentinel");
    expect(inspection.carrierRunProperties[0]?.property).toMatch(/^property-redacted-/);
  });

  test("classifies active package content without exposing entry names", async () => {
    const source = await generateZeroWidthCarrierDocx(ZERO_WIDTH_FIXTURE, CANDIDATE_A.id);
    const unsafe = mutateEntry(source, "[Content_Types].xml", (xml) =>
      xml.replace(
        "</Types>",
        '<Override PartName="/word/vbaProject.bin" ContentType="application/vnd.ms-office.vbaProject"/></Types>',
      ),
    );
    const entries = unzipSync(unsafe);
    entries["word/vbaProject.bin"] = strToU8("SENSITIVE PACKAGE NAME");
    const inspection = inspectZeroWidthDocx(
      zipSync(entries, { level: 6, mtime: new Date("1980-01-01T00:00:00Z") }),
      CANDIDATE_A.id,
      "source",
    );
    expect(inspection.safety.activeContentEntries.length).toBeGreaterThan(0);
    expect(inspection.safety.macroContentTypes.length).toBeGreaterThan(0);
    expect(JSON.stringify(inspection)).not.toContain("vbaProject.bin");
    expect(JSON.stringify(inspection)).not.toContain("SENSITIVE PACKAGE NAME");
  });

  test.each([
    ["absent", (source: Uint8Array) => mutateEntry(source, "docProps/core.xml", (xml) => xml.replace(/<dc:creator>[\s\S]*?<\/dc:creator>/, ""))],
    ["empty", (source: Uint8Array) => mutateEntry(source, "docProps/core.xml", (xml) => xml.replace(/<dc:creator>[\s\S]*?<\/dc:creator>/, "<dc:creator></dc:creator>"))],
    ["redacted", (source: Uint8Array) => mutateEntry(source, "docProps/core.xml", (xml) => xml.replace(/<dc:creator>[\s\S]*?<\/dc:creator>/, "<dc:creator>PERSONAL SENTINEL</dc:creator>"))],
  ] as const)("classifies core metadata as %s without leaking values", async (expected, mutate) => {
    const source = await generateZeroWidthCarrierDocx(ZERO_WIDTH_FIXTURE, CANDIDATE_A.id);
    const inspection = inspectZeroWidthDocx(mutate(source), CANDIDATE_A.id, "source");
    const expectedClass = expected === "absent" ? "absent" : expected === "empty" ? "empty" : "non_synthetic_redacted";
    expect(inspection.coreMetadata.creator).toBe(expectedClass);
    expect(JSON.stringify(inspection)).not.toContain("PERSONAL SENTINEL");
  });

  test.each([
    ["duplicate first", (source: Uint8Array) => mutateEntry(source, "docProps/core.xml", (xml) =>
      xml.replace(/<dc:creator>[^<]*<\/dc:creator>/, "<dc:creator>PERSONAL FIRST SENTINEL</dc:creator><dc:creator>Glyph synthetic research fixture</dc:creator>"),
    )],
    ["duplicate last", (source: Uint8Array) => mutateEntry(source, "docProps/core.xml", (xml) =>
      xml.replace(/<dc:creator>[^<]*<\/dc:creator>/, "<dc:creator>Glyph synthetic research fixture</dc:creator><dc:creator>PERSONAL LAST SENTINEL</dc:creator>"),
    )],
  ] as const)("classifies %s core metadata conservatively", async (_label, mutate) => {
    const source = await generateZeroWidthCarrierDocx(ZERO_WIDTH_FIXTURE, CANDIDATE_A.id);
    const inspection = inspectZeroWidthDocx(mutate(source), CANDIDATE_A.id, "transformed");
    expect(inspection.coreMetadata.creator).toBe("non_synthetic_redacted");
    expect(JSON.stringify(inspection)).not.toContain("PERSONAL");
  });

  test("rejects malformed ZIP and XML packages", async () => {
    expect(() => inspectZeroWidthDocx(Uint8Array.from([1, 2, 3]), CANDIDATE_A.id, "source")).toThrow(
      /Invalid DOCX ZIP package/,
    );
    const source = await generateZeroWidthCarrierDocx(ZERO_WIDTH_FIXTURE, CANDIDATE_A.id);
    const malformed = mutateEntry(source, "word/document.xml", () => "<w:document");
    expect(() => inspectZeroWidthDocx(malformed, CANDIDATE_A.id, "source")).toThrow(
      /Invalid XML entry/,
    );
  });
});
