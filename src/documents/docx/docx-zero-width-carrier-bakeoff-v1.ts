import { Document, Packer, Paragraph, TextRun } from "docx";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { encodeCarrier } from "../../../research/experiments/docx-zero-width-carrier-bakeoff-v1/frame.ts";
import {
  SYNTHETIC_CORE_AUTHOR,
  type CandidateId,
  type ZeroWidthFixture,
} from "../../../research/experiments/docx-zero-width-carrier-bakeoff-v1/fixture.ts";

const SYNTHETIC_TIMESTAMP = "2026-09-03T00:00:00Z";

const replaceCoreTimestamp = (xml: string, tag: string): string =>
  xml.replace(
    new RegExp(`<${tag}[^>]*>[^<]*</${tag}>`),
    `<${tag} xsi:type="dcterms:W3CDTF">${SYNTHETIC_TIMESTAMP}</${tag}>`,
  );

export async function generateZeroWidthCarrierDocx(
  fixture: ZeroWidthFixture,
  candidateId: CandidateId,
): Promise<Uint8Array> {
  const children = fixture.bodyParagraphs.map(
    (runs) =>
      new Paragraph({
        children: runs.map((run) =>
          new TextRun(run.marker ? encodeCarrier(candidateId, run.marker) : run.text),
        ),
      }),
  );
  const packed = await Packer.toBuffer(
    new Document({
      creator: SYNTHETIC_CORE_AUTHOR,
      lastModifiedBy: SYNTHETIC_CORE_AUTHOR,
      sections: [{ children }],
    }),
  );

  const entries = unzipSync(packed);
  const core = entries["docProps/core.xml"];
  if (!core) {
    throw new Error("Missing generated core properties");
  }
  const fixedCore = replaceCoreTimestamp(
    replaceCoreTimestamp(strFromU8(core), "dcterms:created"),
    "dcterms:modified",
  );
  entries["docProps/core.xml"] = strToU8(fixedCore);

  const sortedEntries = Object.fromEntries(
    Object.entries(entries).sort(([left], [right]) => left.localeCompare(right)),
  );
  return zipSync(sortedEntries, {
    level: 6,
    mtime: new Date("1980-01-01T00:00:00Z"),
  });
}
