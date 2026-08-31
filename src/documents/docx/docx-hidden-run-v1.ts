import { Document, Packer, Paragraph, TextRun } from "docx";

export type DocxCarrierRun = Readonly<{ text: string; hidden: boolean }>;
export type DocxCarrierParagraph = Readonly<{
  runs: readonly DocxCarrierRun[];
}>;
export type DocxHiddenRunV1Input = Readonly<{
  paragraphs: readonly DocxCarrierParagraph[];
}>;

export async function generateDocxHiddenRunV1(
  input: DocxHiddenRunV1Input,
): Promise<Uint8Array> {
  const paragraphs = input.paragraphs.map(
    (paragraph) =>
      new Paragraph({
        children: paragraph.runs.map((run) =>
          run.hidden
            ? new TextRun({ text: run.text, vanish: true })
            : new TextRun({ text: run.text }),
        ),
      }),
  );

  const document = new Document({
    sections: [{ children: paragraphs }],
  });
  return Packer.toBuffer(document);
}
