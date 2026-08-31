import {
  CARRIER_SPIKE_INPUT,
  FIXED_MARKER_ALPHA,
  FIXED_MARKER_BETA,
  VISIBLE_PARAGRAPHS,
  VISIBLE_FIXTURE_ID,
} from "../docx-hidden-run-v1/fixture";

export const EXPERIMENT_ID =
  "glyph-exp-a-docx-alternative-carrier-bakeoff-v1-001";
export const EXPERIMENT_SCHEMA_VERSION = 1;
export const BAKEOFF_PROFILE = "docx-alternative-carrier-bakeoff-v1";
export const CANDIDATE_ORDER = [
  "matching-color-body-v1",
  "sub-legible-body-1pt-v1",
  "docx-header-text-v1",
] as const;

export type AlternativeCarrierCandidateId = (typeof CANDIDATE_ORDER)[number];
export type AlternativeCarrierMarkerId = "alpha" | "beta";

export type AlternativeCarrierFixtureRun = Readonly<{
  text: string;
  marker?: AlternativeCarrierMarkerId;
}>;

export type AlternativeCarrierFixture = Readonly<{
  bodyParagraphs: readonly (readonly AlternativeCarrierFixtureRun[])[];
  markers: Readonly<{
    alpha: string;
    beta: string;
  }>;
}>;

function markerIdForText(
  text: string,
): AlternativeCarrierMarkerId | undefined {
  if (text === FIXED_MARKER_ALPHA) {
    return "alpha";
  }
  if (text === FIXED_MARKER_BETA) {
    return "beta";
  }
  return undefined;
}

const bodyParagraphs = CARRIER_SPIKE_INPUT.paragraphs.map(({ runs }) =>
  runs.map(({ text }) => {
    const marker = markerIdForText(text);
    return marker === undefined ? { text } : { text, marker };
  }),
);

const nonMarkerBodyParagraphs = bodyParagraphs.map((paragraph) =>
  paragraph
    .filter((run) => run.marker === undefined)
    .map((run) => run.text)
    .join(""),
);

if (
  nonMarkerBodyParagraphs.length !== VISIBLE_PARAGRAPHS.length ||
  nonMarkerBodyParagraphs.some(
    (paragraph, index) => paragraph !== VISIBLE_PARAGRAPHS[index],
  )
) {
  throw new Error("Alternative carrier fixture diverges from the frozen fixture.");
}

export const CANDIDATE_FIXTURE = {
  bodyParagraphs,
  markers: {
    alpha: FIXED_MARKER_ALPHA,
    beta: FIXED_MARKER_BETA,
  },
} as const satisfies AlternativeCarrierFixture;

export {
  FIXED_MARKER_ALPHA,
  FIXED_MARKER_BETA,
  VISIBLE_PARAGRAPHS,
  VISIBLE_FIXTURE_ID,
};
