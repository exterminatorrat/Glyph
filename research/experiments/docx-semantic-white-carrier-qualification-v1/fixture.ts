import {
  CARRIER_SPIKE_INPUT,
  FIXED_MARKER_ALPHA,
  FIXED_MARKER_BETA,
  VISIBLE_PARAGRAPHS,
  VISIBLE_FIXTURE_ID,
} from "../docx-hidden-run-v1/fixture.ts";

export const EXPERIMENT_ID =
  "glyph-exp-a-docx-semantic-white-carrier-qualification-v1-001";
export const EXPERIMENT_SCHEMA_VERSION = 1;
export const QUALIFICATION_PROFILE =
  "docx-semantic-white-carrier-qualification-v1";
export const CANDIDATE_ID = "matching-color-body-v2";
export const DOCUMENT_PROFILE = "docx-matching-color-body-v2";

export type SemanticWhiteMarkerId = "alpha" | "beta";
export type SemanticWhiteFixtureRun = Readonly<{
  text: string;
  marker?: SemanticWhiteMarkerId;
}>;
export type SemanticWhiteFixture = Readonly<{
  bodyParagraphs: readonly (readonly SemanticWhiteFixtureRun[])[];
  markers: Readonly<{ alpha: string; beta: string }>;
}>;

const markerIdForText = (text: string): SemanticWhiteMarkerId | undefined =>
  text === FIXED_MARKER_ALPHA
    ? "alpha"
    : text === FIXED_MARKER_BETA
      ? "beta"
      : undefined;

export const QUALIFICATION_FIXTURE = {
  bodyParagraphs: CARRIER_SPIKE_INPUT.paragraphs.map(({ runs }) =>
    runs.map(({ text }) => {
      const marker = markerIdForText(text);
      return marker === undefined ? { text } : { text, marker };
    }),
  ),
  markers: { alpha: FIXED_MARKER_ALPHA, beta: FIXED_MARKER_BETA },
} as const satisfies SemanticWhiteFixture;

export {
  FIXED_MARKER_ALPHA,
  FIXED_MARKER_BETA,
  VISIBLE_PARAGRAPHS,
  VISIBLE_FIXTURE_ID,
};
