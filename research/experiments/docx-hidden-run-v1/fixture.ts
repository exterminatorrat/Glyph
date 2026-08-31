import type { DocxHiddenRunV1Input } from "@/documents/docx/docx-hidden-run-v1";

export const EXPERIMENT_ID = "glyph-exp-a-docx-hidden-run-v1-001";
export const EXPERIMENT_SCHEMA_VERSION = 1;
export const DOCUMENT_PROFILE = "docx-hidden-run-v1";
export const VISIBLE_FIXTURE_ID = "synthetic-library-hours-v1";

export const FIXED_MARKER_ALPHA = "GLYPH TEST MARKER ALPHA";
export const FIXED_MARKER_BETA = "GLYPH TEST MARKER BETA";

export const VISIBLE_PARAGRAPHS = [
  "Read the passage below. Then summarize its main idea in two sentences.",
  "A neighborhood library extended its weekend hours so more residents could use its study rooms and book collection.",
  "Explain one possible benefit of the schedule change. Then explain one possible drawback.",
] as const;

export const CARRIER_SPIKE_INPUT: DocxHiddenRunV1Input = {
  paragraphs: [
    {
      runs: [
        { text: "Read the passage below.", hidden: false },
        { text: FIXED_MARKER_ALPHA, hidden: true },
        {
          text: " Then summarize its main idea in two sentences.",
          hidden: false,
        },
      ],
    },
    {
      runs: [
        {
          text: "A neighborhood library extended its weekend hours so more residents could use its study rooms and book collection.",
          hidden: false,
        },
      ],
    },
    {
      runs: [
        {
          text: "Explain one possible benefit of the schedule change.",
          hidden: false,
        },
        { text: FIXED_MARKER_BETA, hidden: true },
        { text: " Then explain one possible drawback.", hidden: false },
      ],
    },
  ],
};
