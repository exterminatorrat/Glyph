export const QUALIFICATION_CASE_IDS = [
  "latin-operations-v1",
  "arabic-persian-joining-v1",
  "devanagari-emoji-graphemes-v1",
  "mixed-bidi-v1",
] as const;

export const QUALIFICATION_MUTATION_TARGETS = [
  "control-alpha",
  "marked-alpha",
  "control-beta",
  "marked-beta",
] as const;

export const QUALIFICATION_CHECKPOINT_IDS = [
  "canonical",
  "roundtrip",
  "control-alpha-insert-redone",
  "marked-alpha-insert-redone",
  "control-beta-insert-redone",
  "marked-beta-insert-redone",
  "control-alpha-insert-restored",
  "marked-alpha-insert-restored",
  "control-beta-insert-restored",
  "marked-beta-insert-restored",
  "control-alpha-backspace-result",
  "marked-alpha-backspace-result",
  "control-beta-backspace-result",
  "marked-beta-backspace-result",
  "control-alpha-backspace-restored",
  "marked-alpha-backspace-restored",
  "control-beta-backspace-restored",
  "marked-beta-backspace-restored",
  "control-alpha-forward-delete-result",
  "marked-alpha-forward-delete-result",
  "control-beta-forward-delete-result",
  "marked-beta-forward-delete-result",
  "control-alpha-forward-delete-restored",
  "marked-alpha-forward-delete-restored",
  "control-beta-forward-delete-restored",
  "marked-beta-forward-delete-restored",
] as const;

export type QualificationCaseId = (typeof QUALIFICATION_CASE_IDS)[number];
export type QualificationMutationTarget =
  (typeof QUALIFICATION_MUTATION_TARGETS)[number];
export type QualificationCheckpointId =
  (typeof QUALIFICATION_CHECKPOINT_IDS)[number];
export type QualificationMarkerId = "alpha" | "beta";
export type QualificationLanguage = "en-US" | "ar-SA" | "fa-IR" | "hi-IN";
export type QualificationDirection = "ltr" | "rtl";

export type QualificationFixtureRow = Readonly<{
  target: QualificationMutationTarget;
  markerId: QualificationMarkerId | null;
  prefix: "Alpha sample — " | "Beta sample — ";
  content: string;
  language: QualificationLanguage;
  direction: QualificationDirection;
  search: string;
}>;

export type LegitimateJoinControl = Readonly<{
  rowIndex: 0 | 1 | 2 | 3;
  codePointIndex: number;
  codePoint: 0x200c | 0x200d;
}>;

export type QualificationFixtureCase = Readonly<{
  id: QualificationCaseId;
  rows: readonly [
    QualificationFixtureRow,
    QualificationFixtureRow,
    QualificationFixtureRow,
    QualificationFixtureRow,
  ];
  legitimateJoinControls: readonly LegitimateJoinControl[];
}>;

export const JOIN_CONTROL_QUALIFICATION_CASES = [
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
] as const satisfies readonly QualificationFixtureCase[];

export type QualificationExpectedRow = Readonly<{
  target: QualificationMutationTarget;
  markerId: QualificationMarkerId | null;
  visibleText: string;
  carrierCodePointIndex: number;
  language: QualificationLanguage;
  direction: QualificationDirection;
}>;

export type QualificationExpectedCaseState = Readonly<{
  caseId: QualificationCaseId;
  checkpointId: QualificationCheckpointId;
  rows: readonly [
    QualificationExpectedRow,
    QualificationExpectedRow,
    QualificationExpectedRow,
    QualificationExpectedRow,
  ];
}>;

export function qualificationCase(
  id: QualificationCaseId,
): QualificationFixtureCase {
  const fixtureCase = JOIN_CONTROL_QUALIFICATION_CASES.find(
    (candidate) => candidate.id === id,
  );
  if (!fixtureCase) throw new Error(`Unknown qualification case: ${id}`);
  return fixtureCase;
}

const codePointLength = (value: string): number => [...value].length;

const checkpointTarget = (
  checkpointId: QualificationCheckpointId,
): QualificationMutationTarget | null =>
  QUALIFICATION_MUTATION_TARGETS.find((target) =>
    checkpointId.startsWith(`${target}-`),
  ) ?? null;

const mutateVisibleText = (
  visibleText: string,
  checkpointId: QualificationCheckpointId,
): { visibleText: string; carrierCodePointIndex: number } => {
  const anchor = visibleText.indexOf(". ");
  if (anchor < 0) throw new Error("Qualification row is missing its frozen anchor");
  const carrierCodePointIndex = codePointLength(visibleText.slice(0, anchor + 1));

  if (checkpointId.endsWith("-insert-redone")) {
    return {
      visibleText: `${visibleText.slice(0, anchor + 1)}X${visibleText.slice(anchor + 1)}`,
      carrierCodePointIndex,
    };
  }
  if (checkpointId.endsWith("-backspace-result")) {
    return {
      visibleText: `${visibleText.slice(0, anchor)}${visibleText.slice(anchor + 1)}`,
      carrierCodePointIndex: carrierCodePointIndex - 1,
    };
  }
  if (checkpointId.endsWith("-forward-delete-result")) {
    return {
      visibleText: `${visibleText.slice(0, anchor + 1)}${visibleText.slice(anchor + 2)}`,
      carrierCodePointIndex,
    };
  }
  return { visibleText, carrierCodePointIndex };
};

export function expectedCaseState(
  caseId: QualificationCaseId,
  checkpointId: QualificationCheckpointId,
): QualificationExpectedCaseState {
  const fixtureCase = qualificationCase(caseId);
  const target = checkpointTarget(checkpointId);
  const rows = fixtureCase.rows.map((row) => {
    const visibleText = `${row.prefix}${row.content}`;
    const expected = target === row.target
      ? mutateVisibleText(visibleText, checkpointId)
      : mutateVisibleText(visibleText, "roundtrip");
    return {
      target: row.target,
      markerId: row.markerId,
      visibleText: expected.visibleText,
      carrierCodePointIndex: expected.carrierCodePointIndex,
      language: row.language,
      direction: row.direction,
    };
  });
  return {
    caseId,
    checkpointId,
    rows: rows as unknown as QualificationExpectedCaseState["rows"],
  };
}
