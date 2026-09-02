import { Document, Packer, Paragraph, TextRun } from "docx";
import type { SemanticWhiteFixture } from "../../../research/experiments/docx-semantic-white-carrier-qualification-v1/fixture";

export async function generateMatchingColorBodyV2(
  fixture: SemanticWhiteFixture,
): Promise<Uint8Array> {
  const children = fixture.bodyParagraphs.map(
    (runs) =>
      new Paragraph({
        children: runs.map(
          (run) =>
            new TextRun(
              run.marker
                ? { text: run.text, color: "FFFFFF" }
                : { text: run.text },
            ),
        ),
      }),
  );
  return await Packer.toBuffer(new Document({ sections: [{ children }] }));
}
