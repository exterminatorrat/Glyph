import {
  CARRIER_SPIKE_INPUT,
  FIXED_MARKER_ALPHA,
  FIXED_MARKER_BETA,
  VISIBLE_PARAGRAPHS,
  VISIBLE_FIXTURE_ID,
} from "../docx-hidden-run-v1/fixture.ts";

export const BAKE_OFF_PROFILE = "docx-zero-width-carrier-bakeoff-v1";
export const EXPERIMENT_ID =
  "glyph-exp-docx-zero-width-carrier-bakeoff-v1-001";
export const EXPERIMENT_SCHEMA_VERSION = 1;
export const SYNTHETIC_CORE_AUTHOR = "Glyph synthetic research fixture";
// The clean implementation checkpoint immediately before any canonical
// artifact generation. Future run records remain bound to this reviewed tree.
export const ZERO_WIDTH_GENERATION_CHECKPOINT =
  "3ffffdf5deb38cbd51a600b9e3a2c19c16040718" as const;

export const CANDIDATE_A = {
  id: "join-control-binary-v1",
  documentProfile: "docx-zero-width-join-control-v1",
  selectable: true,
  priority: 1,
  codePointsPerFrame: 120,
} as const;

export const CANDIDATE_B = {
  id: "invisible-operator-binary-v1",
  documentProfile: "docx-zero-width-invisible-operator-v1",
  selectable: true,
  priority: 2,
  codePointsPerFrame: 120,
} as const;

export const CANDIDATE_C = {
  id: "variation-selector-byte-v1",
  documentProfile: "docx-zero-width-variation-selector-v1",
  selectable: false,
  priority: 3,
  codePointsPerFrame: 15,
} as const;

export const ZERO_WIDTH_CANDIDATES = [
  CANDIDATE_A,
  CANDIDATE_B,
  CANDIDATE_C,
] as const;

export type CandidateDefinition = (typeof ZERO_WIDTH_CANDIDATES)[number];
export type CandidateId = CandidateDefinition["id"];
export type DocumentProfile = CandidateDefinition["documentProfile"];
export type ZeroWidthMarkerId = "alpha" | "beta";

export function candidateDefinition(id: CandidateId): CandidateDefinition {
  switch (id) {
    case "join-control-binary-v1":
      return CANDIDATE_A;
    case "invisible-operator-binary-v1":
      return CANDIDATE_B;
    case "variation-selector-byte-v1":
      return CANDIDATE_C;
  }
}

export type ZeroWidthFixtureRun = Readonly<{
  text: string;
  marker?: ZeroWidthMarkerId;
}>;

export type ZeroWidthFixture = Readonly<{
  bodyParagraphs: readonly (readonly ZeroWidthFixtureRun[])[];
}>;

const markerIdForOldText = (text: string): ZeroWidthMarkerId | undefined =>
  text === FIXED_MARKER_ALPHA
    ? "alpha"
    : text === FIXED_MARKER_BETA
      ? "beta"
      : undefined;

export const ZERO_WIDTH_FIXTURE = {
  bodyParagraphs: CARRIER_SPIKE_INPUT.paragraphs.map(({ runs }) =>
    runs.map(({ text }) => {
      const marker = markerIdForOldText(text);
      return marker === undefined ? { text } : { text: "", marker };
    }),
  ),
} as const satisfies ZeroWidthFixture;

export { VISIBLE_PARAGRAPHS, VISIBLE_FIXTURE_ID };
