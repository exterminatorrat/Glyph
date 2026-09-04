import { Document, Packer, Paragraph, TextRun } from "docx";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import type { QualificationFixtureCase } from "../../../research/experiments/docx-join-control-accessibility-qualification-v1/fixture.ts";
import { encodeCarrier } from "../../../research/experiments/docx-zero-width-carrier-bakeoff-v1/frame.ts";
import {
  CANDIDATE_A,
  SYNTHETIC_CORE_AUTHOR,
} from "../../../research/experiments/docx-zero-width-carrier-bakeoff-v1/fixture.ts";

const SYNTHETIC_TIMESTAMP = "2026-09-04T00:00:00Z";

const replaceCoreTimestamp = (xml: string, tag: string): string =>
  xml.replace(
    new RegExp(`<${tag}[^>]*>[^<]*</${tag}>`),
    `<${tag} xsi:type="dcterms:W3CDTF">${SYNTHETIC_TIMESTAMP}</${tag}>`,
  );

const visibleRuns = (prefix: string, content: string): readonly [string, string] => {
  const anchor = content.indexOf(". ");
  if (anchor < 0) throw new Error("Qualification row is missing its frozen anchor");
  return [
    `${prefix}${content.slice(0, anchor + 1)}`,
    content.slice(anchor + 1),
  ];
};

export async function generateJoinControlQualificationDocx(
  fixture: QualificationFixtureCase,
): Promise<Uint8Array> {
  const children = fixture.rows.map((row) => {
    const [beforeCarrier, afterCarrier] = visibleRuns(row.prefix, row.content);
    return new Paragraph({
      bidirectional: row.direction === "rtl",
      run: {
        font: "Arial",
        size: 22,
        language: {
          value: row.language,
          bidirectional: row.direction === "rtl" ? row.language : undefined,
        },
        rightToLeft: row.direction === "rtl",
      },
      children: [
        new TextRun(beforeCarrier),
        ...(row.markerId === null
          ? []
          : [new TextRun(encodeCarrier(CANDIDATE_A.id, row.markerId))]),
        new TextRun(afterCarrier),
      ],
    });
  });

  const packed = await Packer.toBuffer(
    new Document({
      creator: SYNTHETIC_CORE_AUTHOR,
      lastModifiedBy: SYNTHETIC_CORE_AUTHOR,
      sections: [
        {
          properties: {
            page: {
              size: { width: 12_240, height: 15_840 },
              margin: { top: 1_440, right: 1_440, bottom: 1_440, left: 1_440 },
            },
          },
          children,
        },
      ],
    }),
  );

  const entries = unzipSync(packed);
  const core = entries["docProps/core.xml"];
  if (!core) throw new Error("Missing generated core properties");
  entries["docProps/core.xml"] = strToU8(
    replaceCoreTimestamp(
      replaceCoreTimestamp(strFromU8(core), "dcterms:created"),
      "dcterms:modified",
    ),
  );

  const sortedEntries = Object.fromEntries(
    Object.entries(entries).sort(([left], [right]) => left.localeCompare(right)),
  );
  return zipSync(sortedEntries, {
    level: 6,
    mtime: new Date("1980-01-01T00:00:00Z"),
  });
}
