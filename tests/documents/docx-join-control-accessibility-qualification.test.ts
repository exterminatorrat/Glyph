import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  DOMParser,
  type Element as XmlElement,
  type Node as XmlNode,
} from "@xmldom/xmldom";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { afterEach, describe, expect, test } from "vitest";
import {
  JOIN_CONTROL_QUALIFICATION_CASES,
  QUALIFICATION_CHECKPOINT_IDS,
  QUALIFICATION_MUTATION_TARGETS,
  expectedCaseState,
  qualificationCase,
} from "../../research/experiments/docx-join-control-accessibility-qualification-v1/fixture.ts";
import { inspectJoinControlQualificationDocx } from "../../research/experiments/docx-join-control-accessibility-qualification-v1/inspect-qualification-docx.ts";
import { inspectJoinControlQualificationText } from "../../research/experiments/docx-join-control-accessibility-qualification-v1/inspect-qualification-text.ts";
import { encodeCarrier } from "../../research/experiments/docx-zero-width-carrier-bakeoff-v1/frame.ts";
import { inspectZeroWidthDocx } from "../../research/experiments/docx-zero-width-carrier-bakeoff-v1/inspect-zero-width-docx.ts";
import { generateJoinControlQualificationDocx } from "../../src/documents/docx/docx-join-control-accessibility-qualification-v1.ts";
import {
  readRepositoryRegularFile,
  writeNewRepositoryArtifact,
} from "../../scripts/lib/research-artifact-io.ts";

const codePoints = (value: string): number[] =>
  [...value].map((character) => character.codePointAt(0) ?? -1);

const documentXml = (bytes: Uint8Array): string => {
  const entry = unzipSync(bytes)["word/document.xml"];
  if (!entry) throw new Error("Missing word/document.xml in test package");
  return strFromU8(entry);
};

const elements = (root: XmlNode, localName: string): XmlElement[] => {
  const matches: XmlElement[] = [];
  const visit = (node: XmlNode): void => {
    if (node.nodeType === 1 && (node as XmlElement).localName === localName) {
      matches.push(node as XmlElement);
    }
    for (let child = node.firstChild; child; child = child.nextSibling) visit(child);
  };
  visit(root);
  return matches;
};

const childElements = (root: XmlNode, localName: string): XmlElement[] => {
  const matches: XmlElement[] = [];
  for (let child = root.firstChild; child; child = child.nextSibling) {
    if (child.nodeType === 1 && (child as XmlElement).localName === localName) {
      matches.push(child as XmlElement);
    }
  }
  return matches;
};

const mutateEntry = (
  source: Uint8Array,
  entryName: string,
  mutate: (value: string) => string,
): Uint8Array => {
  const entries = unzipSync(source);
  const entry = entries[entryName];
  if (!entry) throw new Error(`Missing test entry ${entryName}`);
  entries[entryName] = strToU8(mutate(strFromU8(entry)));
  return zipSync(entries, { level: 6, mtime: new Date("1980-01-01T00:00:00Z") });
};

const addEntry = (
  source: Uint8Array,
  entryName: string,
  value: Uint8Array,
): Uint8Array => {
  const entries = unzipSync(source);
  entries[entryName] = Uint8Array.from(value);
  return zipSync(entries, { level: 6, mtime: new Date("1980-01-01T00:00:00Z") });
};

describe("join-control qualification fixture", () => {
  test("freezes the exact case and row matrix", () => {
    expect(JOIN_CONTROL_QUALIFICATION_CASES).toEqual([
      {
        id: "latin-operations-v1",
        rows: [
          { target: "control-alpha", markerId: null, prefix: "Alpha sample — ", content: "The archive opens at nine. Staff review the daily log.", language: "en-US", direction: "ltr", search: "nine. Staff" },
          { target: "marked-alpha", markerId: "alpha", prefix: "Alpha sample — ", content: "The archive opens at nine. Staff review the daily log.", language: "en-US", direction: "ltr", search: "nine. Staff" },
          { target: "control-beta", markerId: null, prefix: "Beta sample — ", content: "The receeve desk closes at five. Visitors sign the blue ledger.", language: "en-US", direction: "ltr", search: "five. Visitors" },
          { target: "marked-beta", markerId: "beta", prefix: "Beta sample — ", content: "The receeve desk closes at five. Visitors sign the blue ledger.", language: "en-US", direction: "ltr", search: "five. Visitors" },
        ],
        legitimateJoinControls: [],
      },
      {
        id: "arabic-persian-joining-v1",
        rows: [
          { target: "control-alpha", markerId: null, prefix: "Alpha sample — ", content: "هذه جملة عربية. ثم تأتي جملة قصيرة.", language: "ar-SA", direction: "rtl", search: "عربية. ثم" },
          { target: "marked-alpha", markerId: "alpha", prefix: "Alpha sample — ", content: "هذه جملة عربية. ثم تأتي جملة قصيرة.", language: "ar-SA", direction: "rtl", search: "عربية. ثم" },
          { target: "control-beta", markerId: null, prefix: "Beta sample — ", content: "کتاب‌ها روی میز هستند. سپس جمله ادامه دارد.", language: "fa-IR", direction: "rtl", search: "هستند. سپس" },
          { target: "marked-beta", markerId: "beta", prefix: "Beta sample — ", content: "کتاب‌ها روی میز هستند. سپس جمله ادامه دارد.", language: "fa-IR", direction: "rtl", search: "هستند. سپس" },
        ],
        legitimateJoinControls: [
          { rowIndex: 2, codePointIndex: 18, codePoint: 0x200c },
          { rowIndex: 3, codePointIndex: 18, codePoint: 0x200c },
        ],
      },
      {
        id: "devanagari-emoji-graphemes-v1",
        rows: [
          { target: "control-alpha", markerId: null, prefix: "Alpha sample — ", content: "यह क्षेत्र का सरल प्रश्न है. फिर अगला वाक्य आता है.", language: "hi-IN", direction: "ltr", search: "है. फिर" },
          { target: "marked-alpha", markerId: "alpha", prefix: "Alpha sample — ", content: "यह क्षेत्र का सरल प्रश्न है. फिर अगला वाक्य आता है.", language: "hi-IN", direction: "ltr", search: "है. फिर" },
          { target: "control-beta", markerId: null, prefix: "Beta sample — ", content: "The family emoji 👨‍👩‍👧‍👦 stays intact. Then the line continues.", language: "en-US", direction: "ltr", search: "intact. Then" },
          { target: "marked-beta", markerId: "beta", prefix: "Beta sample — ", content: "The family emoji 👨‍👩‍👧‍👦 stays intact. Then the line continues.", language: "en-US", direction: "ltr", search: "intact. Then" },
        ],
        legitimateJoinControls: [
          { rowIndex: 2, codePointIndex: 32, codePoint: 0x200d },
          { rowIndex: 2, codePointIndex: 34, codePoint: 0x200d },
          { rowIndex: 2, codePointIndex: 36, codePoint: 0x200d },
          { rowIndex: 3, codePointIndex: 32, codePoint: 0x200d },
          { rowIndex: 3, codePointIndex: 34, codePoint: 0x200d },
          { rowIndex: 3, codePointIndex: 36, codePoint: 0x200d },
        ],
      },
      {
        id: "mixed-bidi-v1",
        rows: [
          { target: "control-alpha", markerId: null, prefix: "Alpha sample — ", content: "The token GLYPH42 precedes العربية 123. Then the line ends.", language: "en-US", direction: "ltr", search: "123. Then" },
          { target: "marked-alpha", markerId: "alpha", prefix: "Alpha sample — ", content: "The token GLYPH42 precedes العربية 123. Then the line ends.", language: "en-US", direction: "ltr", search: "123. Then" },
          { target: "control-beta", markerId: null, prefix: "Beta sample — ", content: "يتضمن النص GLYPH42 والرقم 123. ثم يستمر السطر.", language: "ar-SA", direction: "rtl", search: "123. ثم" },
          { target: "marked-beta", markerId: "beta", prefix: "Beta sample — ", content: "يتضمن النص GLYPH42 والرقم 123. ثم يستمر السطر.", language: "ar-SA", direction: "rtl", search: "123. ثم" },
        ],
        legitimateJoinControls: [],
      },
    ]);
  });

  test("freezes the closed mutation targets and checkpoint order", () => {
    expect(QUALIFICATION_MUTATION_TARGETS).toEqual([
      "control-alpha",
      "marked-alpha",
      "control-beta",
      "marked-beta",
    ]);
    expect(QUALIFICATION_CHECKPOINT_IDS).toHaveLength(26);
    expect(QUALIFICATION_CHECKPOINT_IDS.slice(0, 2)).toEqual([
      "canonical",
      "roundtrip",
    ]);
    expect(QUALIFICATION_CHECKPOINT_IDS.slice(2)).toEqual(
      ["insert-redone", "insert-restored", "backspace-result", "backspace-restored", "forward-delete-result", "forward-delete-restored"].flatMap((suffix) =>
        QUALIFICATION_MUTATION_TARGETS.map((target) => `${target}-${suffix}`),
      ),
    );
  });

  test("resolves only frozen case identifiers", () => {
    expect(qualificationCase("mixed-bidi-v1")).toBe(
      JOIN_CONTROL_QUALIFICATION_CASES[3],
    );
    expect(() => qualificationCase("unknown" as never)).toThrow(
      "Unknown qualification case: unknown",
    );
  });

  test("keeps control and marked rows visibly identical at rest", () => {
    for (const fixtureCase of JOIN_CONTROL_QUALIFICATION_CASES) {
      const state = expectedCaseState(fixtureCase.id, "canonical");
      expect(state.rows[0].visibleText).toBe(state.rows[1].visibleText);
      expect(state.rows[2].visibleText).toBe(state.rows[3].visibleText);
      expect(state.rows.map(({ markerId }) => markerId)).toEqual([
        null,
        "alpha",
        null,
        "beta",
      ]);
    }
  });

  test("places frames after the first full stop and before the ordinary space", () => {
    for (const fixtureCase of JOIN_CONTROL_QUALIFICATION_CASES) {
      const state = expectedCaseState(fixtureCase.id, "canonical");
      for (const row of state.rows.filter(({ markerId }) => markerId !== null)) {
        const points = [...row.visibleText];
        expect(points[row.carrierCodePointIndex - 1]).toBe(".");
        expect(points[row.carrierCodePointIndex]).toBe(" ");
      }
    }
  });

  test("derives the exact target-specific mutation states", () => {
    const base = expectedCaseState("latin-operations-v1", "roundtrip");
    const inserted = expectedCaseState(
      "latin-operations-v1",
      "marked-alpha-insert-redone",
    );
    const backspaced = expectedCaseState(
      "latin-operations-v1",
      "marked-alpha-backspace-result",
    );
    const forwardDeleted = expectedCaseState(
      "latin-operations-v1",
      "marked-alpha-forward-delete-result",
    );

    expect(inserted.rows[1].visibleText).toBe(
      "Alpha sample — The archive opens at nine.X Staff review the daily log.",
    );
    expect(backspaced.rows[1].visibleText).toBe(
      "Alpha sample — The archive opens at nine Staff review the daily log.",
    );
    expect(forwardDeleted.rows[1].visibleText).toBe(
      "Alpha sample — The archive opens at nine.Staff review the daily log.",
    );
    expect(inserted.rows[0]).toEqual(base.rows[0]);
    expect(inserted.rows[2]).toEqual(base.rows[2]);
    expect(inserted.rows[3]).toEqual(base.rows[3]);
    expect(
      expectedCaseState("latin-operations-v1", "marked-alpha-insert-restored"),
    ).toMatchObject({ rows: base.rows });
  });

  test("allowlists only the frozen visible join controls", () => {
    for (const fixtureCase of JOIN_CONTROL_QUALIFICATION_CASES) {
      const actual = fixtureCase.rows.flatMap((row, rowIndex) =>
        codePoints(`${row.prefix}${row.content}`).flatMap((codePoint, codePointIndex) =>
          codePoint === 0x200c || codePoint === 0x200d
            ? [{ rowIndex, codePointIndex, codePoint }]
            : [],
        ),
      );
      expect(actual).toEqual(fixtureCase.legitimateJoinControls);
    }
  });

  test("contains no bidi controls or other default ignorables in visible text", () => {
    const allowed = new Set([0x200c, 0x200d]);
    const forbidden = /[\u00ad\u034f\u061c\u115f\u1160\u17b4\u17b5\u180b-\u180f\u200b\u200e-\u200f\u202a-\u202e\u2060-\u206f\ufeff\ufe00-\ufe0f]/u;
    for (const fixtureCase of JOIN_CONTROL_QUALIFICATION_CASES) {
      for (const row of fixtureCase.rows) {
        const visibleText = `${row.prefix}${row.content}`;
        expect(
          [...visibleText].filter((character) =>
            allowed.has(character.codePointAt(0) ?? -1),
          ).join(""),
        ).toBe(
          fixtureCase.id === "arabic-persian-joining-v1" && row.target.includes("beta")
            ? "\u200c"
            : fixtureCase.id === "devanagari-emoji-graphemes-v1" && row.target.includes("beta")
              ? "\u200d\u200d\u200d"
              : "",
        );
        expect(visibleText.replace(/[\u200c\u200d]/gu, "")).not.toMatch(forbidden);
      }
    }
  });
});

describe("join-control qualification DOCX generator", () => {
  test.each(JOIN_CONTROL_QUALIFICATION_CASES)(
    "generates the exact ordinary-body source contract for $id",
    async (fixtureCase) => {
      const bytes = await generateJoinControlQualificationDocx(fixtureCase);
      const xml = documentXml(bytes);
      const document = new DOMParser().parseFromString(xml, "application/xml");
      const body = elements(document, "body")[0];
      if (!body) throw new Error("Missing document body in test package");
      const paragraphs = childElements(body, "p");
      expect(paragraphs).toHaveLength(4);

      paragraphs.forEach((paragraph, rowIndex) => {
        const fixtureRow = fixtureCase.rows[rowIndex];
        const runs = childElements(paragraph, "r");
        expect(runs).toHaveLength(fixtureRow?.markerId === null ? 2 : 3);
        const runTexts = runs.map((run) =>
          elements(run, "t").map((text) => text.textContent ?? "").join(""),
        );
        const expectedVisible = `${fixtureRow?.prefix}${fixtureRow?.content}`;
        expect(runTexts.join("").replace(/[\u200c\u200d]{120}/u, "")).toBe(
          expectedVisible,
        );

        if (fixtureRow?.markerId) {
          expect(runTexts[1]).toBe(
            encodeCarrier("join-control-binary-v1", fixtureRow.markerId),
          );
          expect(codePoints(runTexts[1] ?? "")).toHaveLength(120);
          expect(elements(runs[1] as XmlElement, "rPr")).toEqual([]);
        }
      });

      const inspection = inspectZeroWidthDocx(
        bytes,
        "join-control-binary-v1",
        "transformed",
      );
      expect(inspection.safety).toEqual({
        externalRelationships: [],
        unresolvedRelationshipTargets: [],
        activeContentEntries: [],
        activeRelationshipTypes: [],
        macroContentTypes: [],
      });
    },
  );

  test("sets Letter pages, one-inch margins, Arial 11, and row language/direction", async () => {
    const bytes = await generateJoinControlQualificationDocx(
      qualificationCase("arabic-persian-joining-v1"),
    );
    const document = new DOMParser().parseFromString(
      documentXml(bytes),
      "application/xml",
    );
    const pageSize = elements(document, "pgSz")[0];
    const margins = elements(document, "pgMar")[0];
    expect(pageSize?.getAttribute("w:w")).toBe("12240");
    expect(pageSize?.getAttribute("w:h")).toBe("15840");
    expect(margins?.getAttribute("w:top")).toBe("1440");
    expect(margins?.getAttribute("w:right")).toBe("1440");
    expect(margins?.getAttribute("w:bottom")).toBe("1440");
    expect(margins?.getAttribute("w:left")).toBe("1440");

    const paragraphs = elements(elements(document, "body")[0] as XmlElement, "p");
    expect(paragraphs.map((paragraph) => elements(paragraph, "bidi").length)).toEqual([
      1,
      1,
      1,
      1,
    ]);
    expect(paragraphs.map((paragraph) => elements(paragraph, "rFonts")[0]?.getAttribute("w:ascii"))).toEqual([
      "Arial",
      "Arial",
      "Arial",
      "Arial",
    ]);
    expect(paragraphs.map((paragraph) => elements(paragraph, "sz")[0]?.getAttribute("w:val"))).toEqual([
      "22",
      "22",
      "22",
      "22",
    ]);
    expect(paragraphs.map((paragraph) => elements(paragraph, "lang")[0]?.getAttribute("w:val"))).toEqual([
      "ar-SA",
      "ar-SA",
      "fa-IR",
      "fa-IR",
    ]);
  });

  test("uses identical visible run XML within each control/marked pair", async () => {
    const bytes = await generateJoinControlQualificationDocx(
      qualificationCase("mixed-bidi-v1"),
    );
    const document = new DOMParser().parseFromString(
      documentXml(bytes),
      "application/xml",
    );
    const paragraphs = elements(elements(document, "body")[0] as XmlElement, "p");
    const withoutCarrierRun = (paragraph: XmlElement): string[] =>
      childElements(paragraph, "r")
        .filter((run) => {
          const text = elements(run, "t").map((node) => node.textContent ?? "").join("");
          return codePoints(text).length !== 120;
        })
        .map((run) => run.toString());
    expect(withoutCarrierRun(paragraphs[0] as XmlElement)).toEqual(
      withoutCarrierRun(paragraphs[1] as XmlElement),
    );
    expect(withoutCarrierRun(paragraphs[2] as XmlElement)).toEqual(
      withoutCarrierRun(paragraphs[3] as XmlElement),
    );
  });

  test.each(JOIN_CONTROL_QUALIFICATION_CASES)(
    "is deterministic for $id",
    async (fixtureCase) => {
      const first = await generateJoinControlQualificationDocx(fixtureCase);
      const second = await generateJoinControlQualificationDocx(fixtureCase);
      expect(second).toEqual(first);
    },
  );
});

describe("join-control qualification DOCX inspector", () => {
  test.each(JOIN_CONTROL_QUALIFICATION_CASES)(
    "accepts the exact $id canonical structure",
    async (fixtureCase) => {
      const bytes = await generateJoinControlQualificationDocx(fixtureCase);
      const inspection = inspectJoinControlQualificationDocx(
        bytes,
        fixtureCase.id,
        "canonical",
        "source",
      );
      expect(inspection).toMatchObject({
        mode: "source",
        caseId: fixtureCase.id,
        checkpointId: "canonical",
        frameState: "exact",
        visibleTextState: "exact",
        hiddenPropertyState: "absent",
        defaultIgnorableState: "allowlisted-only",
        nfcState: "stable",
        nfkcState: "stable",
        segmentationState: "expected",
        packageSafetyState: "safe",
        relationshipSafetyState: "safe",
        macroOrActiveContent: "absent",
        findings: [],
      });
      expect(inspection.occurrences).toEqual([
        expect.objectContaining({ markerId: "alpha", checksumValid: true, context: "ordinary-body", part: "word/document.xml", paragraphIndex: 1, runIndices: [1], codePointCount: 120, anchor: "expected", finding: "none" }),
        expect.objectContaining({ markerId: "beta", checksumValid: true, context: "ordinary-body", part: "word/document.xml", paragraphIndex: 3, runIndices: [1], codePointCount: 120, anchor: "expected", finding: "none" }),
      ]);
      expect(inspection.segmentation).toHaveLength(4);
      expect(inspection.nodeVersion).toBe(process.versions.node);
      expect(inspection.icuVersion).toBe(process.versions.icu);
      expect(inspection.unicodeVersion).toBe(process.versions.unicode);
    },
  );

  test("accepts editor-split and editor-merged transformed frames", async () => {
    const source = await generateJoinControlQualificationDocx(
      qualificationCase("latin-operations-v1"),
    );
    const alpha = encodeCarrier("join-control-binary-v1", "alpha");
    const split = mutateEntry(source, "word/document.xml", (xml) =>
      xml.replace(
        alpha,
        `${alpha.slice(0, 60)}</w:t></w:r><w:r><w:t xml:space="preserve">${alpha.slice(60)}`,
      ),
    );
    expect(
      inspectJoinControlQualificationDocx(
        split,
        "latin-operations-v1",
        "roundtrip",
        "transformed",
      ).occurrences[0]?.runIndices,
    ).toEqual([1, 2]);

    const merged = mutateEntry(source, "word/document.xml", (xml) =>
      xml.replace(
        `</w:t></w:r><w:r><w:t xml:space="preserve">${alpha}`,
        alpha,
      ),
    );
    const mergedInspection = inspectJoinControlQualificationDocx(
      merged,
      "latin-operations-v1",
      "roundtrip",
      "transformed",
    );
    expect(mergedInspection.frameState).toBe("exact");
    expect(mergedInspection.occurrences[0]?.runIndices).toEqual([0]);
    expect(mergedInspection.findings).toEqual([]);
  });

  test("ignores every old M2D fixture and anchor conclusion", async () => {
    const bytes = await generateJoinControlQualificationDocx(
      qualificationCase("latin-operations-v1"),
    );
    expect(
      inspectZeroWidthDocx(bytes, "join-control-binary-v1", "transformed")
        .frameErrors.length,
    ).toBeGreaterThan(0);
    expect(
      inspectJoinControlQualificationDocx(
        bytes,
        "latin-operations-v1",
        "canonical",
        "source",
      ).findings,
    ).toEqual([]);
  });

  test.each([
    "arabic-persian-joining-v1",
    "devanagari-emoji-graphemes-v1",
  ] as const)("allowlists the legitimate visible controls in %s", async (caseId) => {
    const bytes = await generateJoinControlQualificationDocx(qualificationCase(caseId));
    const inspection = inspectJoinControlQualificationDocx(
      bytes,
      caseId,
      "canonical",
      "source",
    );
    expect(inspection.frameState).toBe("exact");
    expect(inspection.defaultIgnorableState).toBe("allowlisted-only");
    expect(inspection.occurrences).toHaveLength(2);
  });

  test("classifies missing, damaged, duplicate, moved, and mixed frames", async () => {
    const source = await generateJoinControlQualificationDocx(
      qualificationCase("latin-operations-v1"),
    );
    const alpha = encodeCarrier("join-control-binary-v1", "alpha");
    const missing = mutateEntry(source, "word/document.xml", (xml) => xml.replace(alpha, ""));
    expect(inspectJoinControlQualificationDocx(missing, "latin-operations-v1", "roundtrip", "transformed").frameState).toBe("missing");

    const damaged = mutateEntry(source, "word/document.xml", (xml) =>
      xml.replace(alpha, alpha.slice(0, -1)),
    );
    expect(inspectJoinControlQualificationDocx(damaged, "latin-operations-v1", "roundtrip", "transformed").frameState).toBe("damaged");

    const duplicate = mutateEntry(source, "word/document.xml", (xml) =>
      xml.replace(alpha, `${alpha}${alpha}`),
    );
    expect(inspectJoinControlQualificationDocx(duplicate, "latin-operations-v1", "roundtrip", "transformed").frameState).toBe("duplicate");

    const moved = mutateEntry(
      mutateEntry(source, "word/document.xml", (xml) => xml.replace(alpha, "")),
      "docProps/app.xml",
      (xml) =>
        xml.replace(
          /\/>$/u,
          `><Carrier>${alpha}</Carrier></Properties>`,
        ),
    );
    expect(inspectJoinControlQualificationDocx(moved, "latin-operations-v1", "roundtrip", "transformed").frameState).toBe("moved");

    const mixed = mutateEntry(source, "word/document.xml", (xml) =>
      xml.replace(alpha, `${alpha}\u2062`),
    );
    const mixedInspection = inspectJoinControlQualificationDocx(
      mixed,
      "latin-operations-v1",
      "roundtrip",
      "transformed",
    );
    expect(mixedInspection.frameState).toBe("mixed");
    expect(mixedInspection.occurrences).toContainEqual(
      expect.objectContaining({
        markerId: null,
        context: "ordinary-body",
        part: "word/document.xml",
        paragraphIndex: 1,
        runIndices: [1],
        startCodePointIndex: expect.any(Number),
        codePointCount: 1,
        finding: "mixed",
      }),
    );
  });

  test("measures segmentation on the raw carrier-bearing rows", async () => {
    const source = await generateJoinControlQualificationDocx(
      qualificationCase("latin-operations-v1"),
    );
    const alpha = encodeCarrier("join-control-binary-v1", "alpha");
    const movedWithinDocument = mutateEntry(source, "word/document.xml", (xml) => {
      const withoutAlpha = xml.replace(alpha, "");
      const rowStart = "Alpha sample — The archive opens at nine.";
      const controlIndex = withoutAlpha.indexOf(rowStart);
      const markedIndex = withoutAlpha.indexOf(rowStart, controlIndex + rowStart.length);
      return `${withoutAlpha.slice(0, markedIndex)}${alpha}${withoutAlpha.slice(markedIndex)}`;
    });
    const inspection = inspectJoinControlQualificationDocx(
      movedWithinDocument,
      "latin-operations-v1",
      "roundtrip",
      "transformed",
    );
    expect(inspection.visibleTextState).toBe("exact");
    expect(inspection.segmentationState).toBe("mismatch");
    expect(inspection.findings).toContain("segmentation-mismatch");
  });

  test("detects direct and inherited hidden properties only on validated frames", async () => {
    const source = await generateJoinControlQualificationDocx(
      qualificationCase("latin-operations-v1"),
    );
    const alpha = encodeCarrier("join-control-binary-v1", "alpha");
    const direct = mutateEntry(source, "word/document.xml", (xml) =>
      xml.replace(
        `<w:r><w:t xml:space="preserve">${alpha}</w:t></w:r>`,
        `<w:r><w:rPr><w:vanish/></w:rPr><w:t xml:space="preserve">${alpha}</w:t></w:r>`,
      ),
    );
    expect(inspectJoinControlQualificationDocx(direct, "latin-operations-v1", "roundtrip", "transformed").hiddenPropertyState).toBe("present");

    const inherited = mutateEntry(source, "word/styles.xml", (xml) =>
      xml.replace(
        "<w:rPrDefault/>",
        "<w:rPrDefault><w:rPr><w:vanish/></w:rPr></w:rPrDefault>",
      ),
    );
    expect(inspectJoinControlQualificationDocx(inherited, "latin-operations-v1", "roundtrip", "transformed").hiddenPropertyState).toBe("present");
  });

  test("maps package and relationship safety without exposing targets", async () => {
    const source = await generateJoinControlQualificationDocx(
      qualificationCase("latin-operations-v1"),
    );
    const unsafe = mutateEntry(source, "word/_rels/document.xml.rels", (xml) =>
      xml.replace(
        "</Relationships>",
        '<Relationship Id="unsafe" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="https://private.invalid/secret" TargetMode="External"/></Relationships>',
      ),
    );
    const inspection = inspectJoinControlQualificationDocx(
      unsafe,
      "latin-operations-v1",
      "roundtrip",
      "transformed",
    );
    expect(inspection.relationshipSafetyState).toBe("unsafe");
    expect(inspection.findings).toContain("relationship-unsafe");
    expect(JSON.stringify(inspection)).not.toContain("private.invalid");
  });

  test("rejects unexpected bidi/default-ignorable controls in body and mixed alphabets elsewhere", async () => {
    const source = await generateJoinControlQualificationDocx(
      qualificationCase("latin-operations-v1"),
    );
    const bidi = mutateEntry(source, "word/document.xml", (xml) =>
      xml.replace("The archive", "The\u202E archive"),
    );
    expect(inspectJoinControlQualificationDocx(
      bidi,
      "latin-operations-v1",
      "roundtrip",
      "transformed",
    )).toMatchObject({
      defaultIgnorableState: "unexpected",
      findings: expect.arrayContaining(["unexpected-default-ignorable"]),
    });

    const mixedElsewhere = mutateEntry(source, "docProps/app.xml", (xml) =>
      xml.replace(/\/>$/u, ">\u2062</Properties>"),
    );
    const inspection = inspectJoinControlQualificationDocx(
      mixedElsewhere,
      "latin-operations-v1",
      "roundtrip",
      "transformed",
    );
    expect(inspection.frameState).toBe("mixed");
    expect(inspection.occurrences).toContainEqual(
      expect.objectContaining({
        markerId: null,
        context: "non-ordinary",
        part: "other-redacted",
        paragraphIndex: -1,
        runIndices: [-1],
        startCodePointIndex: expect.any(Number),
        codePointCount: 1,
        finding: "mixed",
      }),
    );
  });

  test("classifies core metadata and macro content without leaking raw values", async () => {
    const source = await generateJoinControlQualificationDocx(
      qualificationCase("latin-operations-v1"),
    );
    const metadata = mutateEntry(source, "docProps/core.xml", (xml) =>
      xml.replace("</cp:coreProperties>", "<cp:keywords>private-person-name</cp:keywords></cp:coreProperties>"),
    );
    const metadataInspection = inspectJoinControlQualificationDocx(
      metadata,
      "latin-operations-v1",
      "roundtrip",
      "transformed",
    );
    expect(metadataInspection.coreMetadata).toEqual({
      creator: "synthetic_expected",
      lastModifiedBy: "synthetic_expected",
      otherCore: "non_synthetic_redacted",
    });
    expect(JSON.stringify(metadataInspection)).not.toContain("private-person-name");

    const withMacroEntry = addEntry(
      source,
      "word/vbaProject.bin",
      Uint8Array.from([0, 1, 2]),
    );
    const macro = mutateEntry(withMacroEntry, "[Content_Types].xml", (xml) =>
      xml.replace(
        "</Types>",
        '<Override PartName="/word/vbaProject.bin" ContentType="application/vnd.ms-office.vbaProject"/></Types>',
      ),
    );
    expect(inspectJoinControlQualificationDocx(
      macro,
      "latin-operations-v1",
      "roundtrip",
      "transformed",
    )).toMatchObject({
      packageSafetyState: "unsafe",
      macroOrActiveContent: "present",
      findings: expect.arrayContaining(["package-unsafe", "macro-or-active-content"]),
    });
  });

  test("treats frames in nested body structures as non-ordinary evidence", async () => {
    const source = await generateJoinControlQualificationDocx(
      qualificationCase("latin-operations-v1"),
    );
    const alpha = encodeCarrier("join-control-binary-v1", "alpha");
    const nested = mutateEntry(source, "word/document.xml", (xml) =>
      xml.replace(
        "<w:sectPr>",
        `<w:sdt><w:sdtContent><w:p><w:r><w:t>${alpha}</w:t></w:r></w:p></w:sdtContent></w:sdt><w:sectPr>`,
      ),
    );
    const inspection = inspectJoinControlQualificationDocx(
      nested,
      "latin-operations-v1",
      "roundtrip",
      "transformed",
    );
    expect(inspection.frameState).toBe("duplicate");
    expect(inspection.occurrences).toContainEqual(
      expect.objectContaining({
        markerId: "alpha",
        context: "non-ordinary",
        part: "other-redacted",
        finding: "duplicate",
      }),
    );
  });

  test("enforces frozen canonical page, margin, language, and direction structure", async () => {
    const source = await generateJoinControlQualificationDocx(
      qualificationCase("latin-operations-v1"),
    );
    const inspectSource = (bytes: Uint8Array) =>
      inspectJoinControlQualificationDocx(
        bytes,
        "latin-operations-v1",
        "canonical",
        "source",
      );
    const wrongPage = mutateEntry(source, "word/document.xml", (xml) =>
      xml.replace('w:w="12240"', 'w:w="12241"'),
    );
    expect(inspectSource(wrongPage).findings).toContain("canonical-structure-failed");

    const wrongLanguage = mutateEntry(source, "word/document.xml", (xml) =>
      xml.replace('w:val="en-US"', 'w:val="fr-FR"'),
    );
    expect(inspectSource(wrongLanguage).findings).toContain("canonical-structure-failed");

    const wrongDirection = mutateEntry(source, "word/document.xml", (xml) =>
      xml.replace("<w:pPr>", "<w:pPr><w:bidi/>")
    );
    expect(inspectSource(wrongDirection).findings).toContain("canonical-structure-failed");

    const wrongMargin = mutateEntry(source, "word/document.xml", (xml) =>
      xml.replace('w:top="1440"', 'w:top="1439"'),
    );
    expect(inspectSource(wrongMargin).findings).toContain("canonical-structure-failed");
  });

  test("does not ignore nested visible body text or a mixed source carrier run", async () => {
    const source = await generateJoinControlQualificationDocx(
      qualificationCase("latin-operations-v1"),
    );
    const nestedText = mutateEntry(source, "word/document.xml", (xml) =>
      xml.replace(
        "<w:sectPr>",
        "<w:sdt><w:sdtContent><w:p><w:r><w:t>EXTRA</w:t></w:r></w:p></w:sdtContent></w:sdt><w:sectPr>",
      ),
    );
    expect(inspectJoinControlQualificationDocx(
      nestedText,
      "latin-operations-v1",
      "roundtrip",
      "transformed",
    ).visibleTextState).toBe("mismatch");

    const alpha = encodeCarrier("join-control-binary-v1", "alpha");
    const mixedRun = mutateEntry(source, "word/document.xml", (xml) =>
      xml.replace(
        `</w:t></w:r><w:r><w:t xml:space="preserve">${alpha}</w:t></w:r>`,
        `${alpha}</w:t></w:r><w:r><w:t xml:space="preserve"></w:t></w:r>`,
      ),
    );
    expect(inspectJoinControlQualificationDocx(
      mixedRun,
      "latin-operations-v1",
      "canonical",
      "source",
    ).findings).toContain("canonical-structure-failed");
  });

  test("links hidden-property evidence using descendant-run coordinates", async () => {
    const source = await generateJoinControlQualificationDocx(
      qualificationCase("latin-operations-v1"),
    );
    const alpha = encodeCarrier("join-control-binary-v1", "alpha");
    const shifted = mutateEntry(source, "word/document.xml", (xml) =>
      xml.replace(
        `<w:r><w:t xml:space="preserve">${alpha}</w:t></w:r>`,
        `<w:hyperlink><w:r><w:t></w:t></w:r></w:hyperlink><w:r><w:rPr><w:vanish/></w:rPr><w:t xml:space="preserve">${alpha}</w:t></w:r>`,
      ),
    );
    expect(inspectJoinControlQualificationDocx(
      shifted,
      "latin-operations-v1",
      "roundtrip",
      "transformed",
    ).hiddenPropertyState).toBe("present");
  });

  test("sanitizes malformed XML errors and preserves non-ordinary sequence boundaries", async () => {
    const source = await generateJoinControlQualificationDocx(
      qualificationCase("latin-operations-v1"),
    );
    const malformed = addEntry(
      source,
      "private-person-name.xml",
      new TextEncoder().encode("<private-person-name>"),
    );
    expect(() => inspectJoinControlQualificationDocx(
      malformed,
      "latin-operations-v1",
      "roundtrip",
      "transformed",
    )).toThrowError(/^Malformed DOCX XML entry$/u);

    const alpha = encodeCarrier("join-control-binary-v1", "alpha");
    const splitElsewhere = mutateEntry(source, "docProps/app.xml", (xml) =>
      xml.replace(
        /\/>$/u,
        `><First>${alpha.slice(0, 60)}</First><Second>${alpha.slice(60)}</Second></Properties>`,
      ),
    );
    const inspection = inspectJoinControlQualificationDocx(
      splitElsewhere,
      "latin-operations-v1",
      "roundtrip",
      "transformed",
    );
    expect(inspection.frameState).toBe("damaged");
    expect(inspection.occurrences.filter(({ context }) => context === "non-ordinary")).toHaveLength(2);
  });

  test("ignores XML formatting whitespace and joins carrier runs only within one non-ordinary paragraph", async () => {
    const source = await generateJoinControlQualificationDocx(
      qualificationCase("latin-operations-v1"),
    );
    const formatted = mutateEntry(source, "word/document.xml", (xml) =>
      xml.replace("</w:p><w:p>", "</w:p>\n  <w:p>"),
    );
    expect(inspectJoinControlQualificationDocx(
      formatted,
      "latin-operations-v1",
      "roundtrip",
      "transformed",
    ).findings).toEqual([]);

    const alpha = encodeCarrier("join-control-binary-v1", "alpha");
    const withoutBodyAlpha = mutateEntry(source, "word/document.xml", (xml) =>
      xml.replace(alpha, ""),
    );
    const header = new TextEncoder().encode(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:r><w:t>${alpha.slice(0, 60)}</w:t></w:r><w:r><w:t>${alpha.slice(60)}</w:t></w:r></w:p></w:hdr>`,
    );
    const headerMoved = addEntry(withoutBodyAlpha, "word/header1.xml", header);
    const inspection = inspectJoinControlQualificationDocx(
      headerMoved,
      "latin-operations-v1",
      "roundtrip",
      "transformed",
    );
    expect(inspection.frameState).toBe("moved");
    expect(inspection.occurrences).toContainEqual(
      expect.objectContaining({
        markerId: "alpha",
        context: "non-ordinary",
        codePointCount: 120,
      }),
    );
  });

  test.each(["tab", "br", "cr"])(
    "rejects visible w:%s tokens that cannot appear in the frozen rows",
    async (token) => {
      const source = await generateJoinControlQualificationDocx(
        qualificationCase("latin-operations-v1"),
      );
      const mutated = mutateEntry(source, "word/document.xml", (xml) =>
        xml.replace(
          "The archive",
          `</w:t><w:${token}/><w:t xml:space="preserve">The archive`,
        ),
      );
      const inspection = inspectJoinControlQualificationDocx(
        mutated,
        "latin-operations-v1",
        "roundtrip",
        "transformed",
      );
      expect(inspection.visibleTextState).toBe("mismatch");
      expect(inspection.findings).toContain("visible-text-mismatch");
    },
  );

  test("rejects visible tokens inside nested body structures", async () => {
    const source = await generateJoinControlQualificationDocx(
      qualificationCase("latin-operations-v1"),
    );
    const nested = mutateEntry(source, "word/document.xml", (xml) =>
      xml.replace(
        "<w:sectPr>",
        "<w:sdt><w:sdtContent><w:p><w:r><w:tab/></w:r></w:p></w:sdtContent></w:sdt><w:sectPr>",
      ),
    );
    expect(inspectJoinControlQualificationDocx(
      nested,
      "latin-operations-v1",
      "roundtrip",
      "transformed",
    ).visibleTextState).toBe("mismatch");
  });

  test("does not treat a paragraph tab-stop definition as visible content", async () => {
    const source = await generateJoinControlQualificationDocx(
      qualificationCase("latin-operations-v1"),
    );
    const tabStop = mutateEntry(source, "word/document.xml", (xml) =>
      xml.replace(
        "<w:pPr>",
        '<w:pPr><w:tabs><w:tab w:val="left" w:pos="720"/></w:tabs>',
      ),
    );
    expect(inspectJoinControlQualificationDocx(
      tabStop,
      "latin-operations-v1",
      "roundtrip",
      "transformed",
    ).findings).toEqual([]);
  });

  test.each(["sym", "noBreakHyphen", "softHyphen"])(
    "rejects nested body-run w:%s content",
    async (token) => {
      const source = await generateJoinControlQualificationDocx(
        qualificationCase("latin-operations-v1"),
      );
      const nested = mutateEntry(source, "word/document.xml", (xml) =>
        xml.replace(
          "<w:sectPr>",
          `<w:sdt><w:sdtContent><w:p><w:r><w:${token}/></w:r></w:p></w:sdtContent></w:sdt><w:sectPr>`,
        ),
      );
      expect(inspectJoinControlQualificationDocx(
        nested,
        "latin-operations-v1",
        "roundtrip",
        "transformed",
      ).visibleTextState).toBe("mismatch");
    },
  );
});

const qualificationText = (
  caseId: (typeof JOIN_CONTROL_QUALIFICATION_CASES)[number]["id"],
  lineEnding: "\n" | "\r\n" = "\n",
): string =>
  expectedCaseState(caseId, "roundtrip").rows
    .map((row) => {
      if (row.markerId === null) return row.visibleText;
      const points = [...row.visibleText];
      points.splice(
        row.carrierCodePointIndex,
        0,
        encodeCarrier("join-control-binary-v1", row.markerId),
      );
      return points.join("");
    })
    .join(lineEnding);

describe("join-control qualification plain-text inspector", () => {
  test.each(JOIN_CONTROL_QUALIFICATION_CASES)(
    "accepts exact LF and CRLF copies for $id",
    (fixtureCase) => {
      for (const lineEnding of ["\n", "\r\n"] as const) {
        const inspection = inspectJoinControlQualificationText(
          new TextEncoder().encode(qualificationText(fixtureCase.id, lineEnding)),
          fixtureCase.id,
          "roundtrip",
        );
        expect(inspection).toMatchObject({
          caseId: fixtureCase.id,
          checkpointId: "roundtrip",
          lineEndings: lineEnding === "\n" ? "lf" : "crlf",
          frameState: "exact",
          visibleTextState: "exact",
          defaultIgnorableState: "allowlisted-only",
          nfcState: "stable",
          nfkcState: "stable",
          segmentationState: "expected",
          nodeVersion: process.versions.node,
          icuVersion: process.versions.icu,
          unicodeVersion: process.versions.unicode,
          findings: [],
        });
        expect(inspection.segmentation).toHaveLength(4);
      }
    },
  );

  test("measures clipboard segmentation before removing valid frames", () => {
    const alpha = encodeCarrier("join-control-binary-v1", "alpha");
    const rows = qualificationText("latin-operations-v1").split("\n");
    const markedAlpha = rows[1];
    if (markedAlpha === undefined) throw new Error("Missing marked Alpha row");
    rows[1] = `${alpha}${markedAlpha.replace(alpha, "")}`;
    const moved = rows.join("\n");
    const inspection = inspectJoinControlQualificationText(
      new TextEncoder().encode(moved),
      "latin-operations-v1",
      "roundtrip",
    );
    expect(inspection.visibleTextState).toBe("exact");
    expect(inspection.segmentationState).toBe("mismatch");
    expect(inspection.findings).toContain("segmentation-mismatch");
  });

  test("rejects invalid UTF-8 without returning source bytes", () => {
    expect(() =>
      inspectJoinControlQualificationText(
        Uint8Array.from([0x66, 0x6f, 0x80, 0x6f]),
        "latin-operations-v1",
        "roundtrip",
      ),
    ).toThrow("Invalid UTF-8 qualification text");
  });

  test("classifies missing, damaged, duplicate, moved, and mixed frames", () => {
    const source = qualificationText("latin-operations-v1");
    const alpha = encodeCarrier("join-control-binary-v1", "alpha");
    const inspect = (text: string) =>
      inspectJoinControlQualificationText(
        new TextEncoder().encode(text),
        "latin-operations-v1",
        "roundtrip",
      );
    expect(inspect(source.replace(alpha, "")).frameState).toBe("missing");
    expect(inspect(source.replace(alpha, alpha.slice(0, -1))).frameState).toBe("damaged");
    expect(inspect(source.replace(alpha, `${alpha}${alpha}`)).frameState).toBe("duplicate");
    const rows = source.split("\n");
    rows[1] = rows[1]?.replace(alpha, "") ?? "";
    rows[0] = `${rows[0]}${alpha}`;
    expect(inspect(rows.join("\n")).frameState).toBe("moved");
    expect(inspect(source.replace(alpha, `${alpha}\u2062`)).frameState).toBe("mixed");
  });

  test("reports visible order, normalization, and segmentation mismatches without repair", () => {
    const source = qualificationText("latin-operations-v1");
    const reordered = source.split("\n").reverse().join("\n");
    expect(inspectJoinControlQualificationText(
      new TextEncoder().encode(reordered),
      "latin-operations-v1",
      "roundtrip",
    )).toMatchObject({
      visibleTextState: "mismatch",
      segmentationState: "mismatch",
      findings: expect.arrayContaining(["clipboard-mismatch", "segmentation-mismatch"]),
    });

    const decomposed = source.replace("archive", "archive\u0301");
    const inspection = inspectJoinControlQualificationText(
      new TextEncoder().encode(decomposed),
      "latin-operations-v1",
      "roundtrip",
    );
    expect(inspection.nfcState).toBe("mismatch");
    expect(inspection.findings).toContain("normalization-mismatch");
  });

  test("rejects mixed or bare-CR line endings as operationally uninspectable", () => {
    const source = qualificationText("latin-operations-v1");
    expect(() => inspectJoinControlQualificationText(
      new TextEncoder().encode(source.replace("\n", "\r\n")),
      "latin-operations-v1",
      "roundtrip",
    )).toThrow("Mixed or unsupported qualification line endings");
    expect(() => inspectJoinControlQualificationText(
      new TextEncoder().encode(source.replaceAll("\n", "\r")),
      "latin-operations-v1",
      "roundtrip",
    )).toThrow("Mixed or unsupported qualification line endings");
  });

  test("rejects an unexpected bidi/default-ignorable control", () => {
    const source = qualificationText("latin-operations-v1").replace(
      "The archive",
      "The\u202E archive",
    );
    expect(inspectJoinControlQualificationText(
      new TextEncoder().encode(source),
      "latin-operations-v1",
      "roundtrip",
    )).toMatchObject({
      defaultIgnorableState: "unexpected",
      findings: expect.arrayContaining(["unexpected-default-ignorable"]),
    });
  });

  test("always returns exactly four segmentation slots for parseable row-count mismatches", () => {
    const source = qualificationText("latin-operations-v1");
    for (const text of [
      source.split("\n").slice(0, 3).join("\n"),
      `${source}\nEXTRA`,
    ]) {
      const inspection = inspectJoinControlQualificationText(
        new TextEncoder().encode(text),
        "latin-operations-v1",
        "roundtrip",
      );
      expect(inspection.visibleTextState).toBe("mismatch");
      expect(inspection.segmentation).toHaveLength(4);
    }
  });
});

describe("qualification artifact I/O", () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
    );
  });

  const workspace = async (): Promise<{ repositoryRoot: string; allowedRoot: string }> => {
    const repositoryRoot = await mkdtemp(join(tmpdir(), "glyph-m2e-io-"));
    temporaryRoots.push(repositoryRoot);
    const allowedRoot = "research/artifacts/docx-join-control-accessibility-qualification-v1";
    await mkdir(join(repositoryRoot, allowedRoot), { recursive: true });
    return { repositoryRoot, allowedRoot };
  };

  test("reads only non-symlink regular files inside the allowed root", async () => {
    const context = await workspace();
    const relativePath = `${context.allowedRoot}/input.docx`;
    await writeFile(join(context.repositoryRoot, relativePath), Uint8Array.from([1, 2, 3]));
    await expect(readRepositoryRegularFile({ ...context, relativePath })).resolves.toEqual(
      Uint8Array.from([1, 2, 3]),
    );

    const outside = join(context.repositoryRoot, "outside.docx");
    await writeFile(outside, Uint8Array.from([9]));
    await symlink(outside, join(context.repositoryRoot, context.allowedRoot, "link.docx"));
    await expect(readRepositoryRegularFile({
      ...context,
      relativePath: `${context.allowedRoot}/link.docx`,
    })).rejects.toThrow("Unsafe research artifact path");
  });

  test("creates a new artifact exactly once and refuses traversal or absolute paths", async () => {
    const context = await workspace();
    const relativePath = `${context.allowedRoot}/output.docx`;
    await writeNewRepositoryArtifact({
      ...context,
      relativePath,
      bytes: Uint8Array.from([4, 5, 6]),
    });
    await expect(readFile(join(context.repositoryRoot, relativePath))).resolves.toEqual(
      Buffer.from([4, 5, 6]),
    );
    await expect(writeNewRepositoryArtifact({
      ...context,
      relativePath,
      bytes: Uint8Array.from([7]),
    })).rejects.toThrow("Research artifact already exists");
    await expect(writeNewRepositoryArtifact({
      ...context,
      relativePath: "../escape.docx",
      bytes: Uint8Array.from([7]),
    })).rejects.toThrow("Unsafe research artifact path");
    await expect(readRepositoryRegularFile({
      ...context,
      relativePath: join(context.repositoryRoot, relativePath),
    })).rejects.toThrow("Unsafe research artifact path");

    const symlinkPath = `${context.allowedRoot}/write-link.docx`;
    const outside = join(context.repositoryRoot, "write-link-target.docx");
    await writeFile(outside, Uint8Array.from([9]));
    await symlink(outside, join(context.repositoryRoot, symlinkPath));
    await expect(writeNewRepositoryArtifact({
      ...context,
      relativePath: symlinkPath,
      bytes: Uint8Array.from([7]),
    })).rejects.toThrow("Unsafe research artifact path");
  });

  test("refuses a symlinked artifact root", async () => {
    const repositoryRoot = await mkdtemp(join(tmpdir(), "glyph-m2e-io-"));
    temporaryRoots.push(repositoryRoot);
    await mkdir(join(repositoryRoot, "real-artifacts"));
    await mkdir(join(repositoryRoot, "research"));
    await symlink(
      join(repositoryRoot, "real-artifacts"),
      join(repositoryRoot, "research", "artifacts"),
    );
    const allowedRoot = "research/artifacts/docx-join-control-accessibility-qualification-v1";
    await mkdir(join(repositoryRoot, "real-artifacts", "docx-join-control-accessibility-qualification-v1"));
    await expect(writeNewRepositoryArtifact({
      repositoryRoot,
      allowedRoot,
      relativePath: `${allowedRoot}/output.docx`,
      bytes: Uint8Array.from([1]),
    })).rejects.toThrow("Unsafe research artifact path");
  });
});
