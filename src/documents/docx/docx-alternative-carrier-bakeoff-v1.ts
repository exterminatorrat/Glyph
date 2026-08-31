import { Document, Header, Packer, Paragraph, TextRun } from "docx";
import type {
  AlternativeCarrierCandidateId,
  AlternativeCarrierFixture,
  AlternativeCarrierFixtureRun,
} from "../../../research/experiments/docx-alternative-carrier-bakeoff-v1/fixture";

export type {
  AlternativeCarrierCandidateId,
  AlternativeCarrierFixture,
  AlternativeCarrierFixtureRun,
  AlternativeCarrierMarkerId,
} from "../../../research/experiments/docx-alternative-carrier-bakeoff-v1/fixture";

const ordinaryRunForCandidate = (
  candidate: AlternativeCarrierCandidateId,
  run: AlternativeCarrierFixtureRun,
): TextRun => {
  if (!run.marker) {
    return new TextRun({ text: run.text });
  }

  switch (candidate) {
    case "matching-color-body-v1":
      return new TextRun({ text: run.text, color: "FFFFFF" });
    case "sub-legible-body-1pt-v1":
      return new TextRun({ text: run.text, size: 2 });
    case "docx-header-text-v1":
      throw new Error("Header marker runs are built in the header branch.");
    default:
      throw new Error(
        `Unsupported alternative carrier candidate: ${String(candidate)}`,
      );
  }
};

export async function generateDocxAlternativeCarrier(
  candidate: AlternativeCarrierCandidateId,
  fixture: AlternativeCarrierFixture,
): Promise<Uint8Array> {
  switch (candidate) {
    case "matching-color-body-v1":
    case "sub-legible-body-1pt-v1":
    case "docx-header-text-v1":
      break;
    default:
      throw new Error(
        `Unsupported alternative carrier candidate: ${String(candidate)}`,
      );
  }

  const bodyParagraphs = fixture.bodyParagraphs.map(
    (paragraph) =>
      new Paragraph({
        children: paragraph
          .filter(
            (run) =>
              candidate !== "docx-header-text-v1" || run.marker === undefined,
          )
          .map((run) => ordinaryRunForCandidate(candidate, run)),
      }),
  );

  const section =
    candidate === "docx-header-text-v1"
      ? {
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: fixture.markers.alpha })],
                }),
                new Paragraph({
                  children: [new TextRun({ text: fixture.markers.beta })],
                }),
              ],
            }),
          },
          children: bodyParagraphs,
        }
      : { children: bodyParagraphs };

  const document = new Document({ sections: [section] });
  return await Packer.toBuffer(document);
}
