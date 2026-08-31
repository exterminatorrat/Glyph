import { createHash } from "node:crypto";
import {
  mkdir,
  mkdtemp,
  rm,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, test } from "vitest";
import {
  assertValidBakeoffRunRecord,
  type BakeoffRunRecord,
  type CandidateRecord,
  type MarkerOccurrenceSummary,
  type MarkerRunFormat,
  type TransformedDocxInspectionSummary,
  type MatrixRow,
  validateBakeoffRunRecord,
} from "../../scripts/validate-docx-alternative-carrier-run";

const ARTIFACT_DIRECTORY =
  "research/artifacts/docx-alternative-carrier-bakeoff-v1";
const VISIBLE_PARAGRAPHS = [
  "Read the passage below. Then summarize its main idea in two sentences.",
  "A neighborhood library extended its weekend hours so more residents could use its study rooms and book collection.",
  "Explain one possible benefit of the schedule change. Then explain one possible drawback.",
] as const;
const MARKERS = {
  alpha: "GLYPH TEST MARKER ALPHA",
  beta: "GLYPH TEST MARKER BETA",
} as const;
const CANDIDATE_ORDER = [
  "matching-color-body-v1",
  "sub-legible-body-1pt-v1",
  "docx-header-text-v1",
] as const;

type CandidateId = (typeof CANDIDATE_ORDER)[number];

const emptySafety = {
  externalRelationships: [],
  unresolvedRelationshipTargets: [],
  activeContentEntries: [],
  activeRelationshipTypes: [],
  macroContentTypes: [],
} as const;

const runFormatFor = (candidateId: CandidateId): MarkerRunFormat =>
  candidateId === "matching-color-body-v1"
    ? {
        hidden: false,
        color: "FFFFFF",
        sizeHalfPoints: null,
        sizeComplexScriptHalfPoints: null,
      }
    : candidateId === "sub-legible-body-1pt-v1"
      ? {
          hidden: false,
          color: null,
          sizeHalfPoints: 2,
          sizeComplexScriptHalfPoints: 2,
        }
      : {
          hidden: false,
          color: null,
          sizeHalfPoints: null,
          sizeComplexScriptHalfPoints: null,
        };

const sourceOccurrencesFor = (
  candidateId: CandidateId,
): MarkerOccurrenceSummary[] => {
  const header = candidateId === "docx-header-text-v1";
  const partName = header ? "word/header1.xml" : "word/document.xml";
  const location: "body" | "header" = header ? "header" : "body";
  const formats = [runFormatFor(candidateId)];
  return [
    {
      markerId: "alpha" as const,
      partName,
      location,
      paragraphIndex: 0,
      runIndices: [header ? 0 : 1],
      runFormats: formats,
    },
    {
      markerId: "beta" as const,
      partName,
      location,
      paragraphIndex: header ? 1 : 2,
      runIndices: [header ? 0 : 1],
      runFormats: formats,
    },
  ];
};

const inspectionFor = (
  candidateId: CandidateId,
  options: {
    markerPresence?: { alpha: "present" | "absent"; beta: "present" | "absent" };
    occurrences?: ReturnType<typeof sourceOccurrencesFor>;
    visibleBodyParagraphs?: readonly string[];
  } = {},
): TransformedDocxInspectionSummary => ({
  entries: ["[Content_Types].xml", "_rels/.rels", "word/document.xml"],
  visibleBodyParagraphs: options.visibleBodyParagraphs ?? [...VISIBLE_PARAGRAPHS],
  markerPresence: options.markerPresence ?? { alpha: "present", beta: "present" },
  markerOccurrences: options.occurrences ?? sourceOccurrencesFor(candidateId),
  safety: emptySafety,
});

const artifactPath = (
  candidateId: CandidateId,
  kind: "source" | "roundtrip" | "copy",
): string =>
  kind === "source"
    ? `${ARTIFACT_DIRECTORY}/${candidateId}.docx`
    : kind === "roundtrip"
      ? `${ARTIFACT_DIRECTORY}/${candidateId}-google-docs-roundtrip.docx`
      : `${ARTIFACT_DIRECTORY}/${candidateId}-google-docs-copy-plain-text.txt`;

const hash = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");

const copyWorkflowFor = (candidateId: CandidateId) => ({
  status: "completed" as const,
  failureReason: null,
  application: { name: "Google Docs", version: null },
  platform: { name: "macOS", version: "26.0" },
  steps: ["Select all, copy, and paste into a controlled plain-text destination."],
  sourceArtifactSha256: "0".repeat(64),
  resultArtifact: {
    path: artifactPath(candidateId, "copy"),
    sha256: "0".repeat(64),
  },
  markerPresence: { alpha: "absent" as const, beta: "absent" as const },
  visibleBody: "preserved" as const,
  ordinaryVisibility: "not_applicable" as const,
  conditionalExposure: ["plain_text_extraction" as const],
  protocolDeviation: null,
  notes: ["Synthetic copy observation for validator tests."],
});

const roundtripFor = (candidateId: CandidateId) => ({
  status: "completed" as const,
  failureReason: null,
  application: { name: "Google Docs", version: null },
  platform: { name: "macOS", version: "26.0" },
  steps: ["Download the Google Docs document as Microsoft Word DOCX."],
  sourceArtifactSha256: "0".repeat(64),
  resultArtifact: {
    path: artifactPath(candidateId, "roundtrip"),
    sha256: "0".repeat(64),
  },
  markerPresence:
    candidateId === "sub-legible-body-1pt-v1"
      ? { alpha: "absent" as const, beta: "absent" as const }
      : { alpha: "present" as const, beta: "present" as const },
  visibleBody: "preserved" as const,
  ordinaryVisibility: "not_visible" as const,
  conditionalExposure: [],
  transformedInspection:
    candidateId === "sub-legible-body-1pt-v1"
      ? inspectionFor(candidateId, {
          markerPresence: { alpha: "absent", beta: "absent" },
          occurrences: [],
        })
      : inspectionFor(candidateId),
  protocolDeviation: null,
  notes: ["Synthetic round-trip observation for validator tests."],
});

const matrixFor = (
  candidateId: CandidateId,
  candidate: ReturnType<typeof candidateFor>,
): MatrixRow => ({
  candidateId,
  transport: {
    canonicalValid: true,
    sourceMarkerPresence: candidate.sourceInspection.markerPresence,
    sourceLocations: candidate.sourceInspection.markerOccurrences,
    sourceFormats: candidate.sourceInspection.markerOccurrences.flatMap(
      (occurrence) => occurrence.runFormats,
    ),
    roundtripMarkerPresence: {
      alpha: candidate.googleDocsRoundtrip.markerPresence.alpha,
      beta: candidate.googleDocsRoundtrip.markerPresence.beta,
    },
    roundtripLocations:
      candidate.googleDocsRoundtrip.transformedInspection.markerOccurrences,
    roundtripFormats:
      candidate.googleDocsRoundtrip.transformedInspection.markerOccurrences.flatMap(
        (occurrence) => occurrence.runFormats,
      ),
    roundtripVisibleBody: candidate.googleDocsRoundtrip.visibleBody,
    copyMarkerPresence: {
      alpha: candidate.googleDocsCopyPlainText.markerPresence.alpha,
      beta: candidate.googleDocsCopyPlainText.markerPresence.beta,
    },
    copyVisibleBody: candidate.googleDocsCopyPlainText.visibleBody,
  },
  presentation: {
    ordinaryVisibility: candidate.googleDocsRoundtrip.ordinaryVisibility,
    layoutDisturbance: "none_observed",
    selectionReveal: "not_run",
    backgroundOrThemeReveal: "not_run",
    explicitFormattingReveal: "not_run",
  },
  accessibilityTrust: {
    assistiveExposure: "not_run",
    accidentalExposureNotes: ["No accessibility surface was exercised."],
    limitations: ["Synthetic record; no editor observation was performed."],
  },
  engineering: {
    structuralSimplicity:
      candidateId === "matching-color-body-v1"
        ? "single-direct-color-property"
        : candidateId === "sub-legible-body-1pt-v1"
          ? "single-direct-size-property"
          : "single-default-header-region",
    deterministicGeneration: true,
    deterministicInspection: true,
    testedEditorScope: "Google Docs import/export only",
    sourceSafetyClean: true,
    roundtripSafetyClean: true,
  },
});

const candidateFor = (candidateId: CandidateId): CandidateRecord => {
  const sourceInspection = inspectionFor(candidateId);
  const roundtrip = roundtripFor(candidateId);
  const copy = copyWorkflowFor(candidateId);
  return {
    candidateId,
    mechanism:
      candidateId === "matching-color-body-v1"
        ? "ordinary-body-color-FFFFFF"
        : candidateId === "sub-legible-body-1pt-v1"
          ? "ordinary-body-size-1pt"
          : "ordinary-header-text",
    documentProfile:
      candidateId === "matching-color-body-v1"
        ? "docx-matching-color-body-v1"
        : candidateId === "sub-legible-body-1pt-v1"
          ? "docx-sub-legible-body-1pt-v1"
          : "docx-header-text-v1",
    canonicalArtifact: {
      path: artifactPath(candidateId, "source"),
      sha256: "0".repeat(64),
    },
    canonicalProfileValidation: {
      status: "passed" as const,
      testCommand:
        "pnpm test tests/documents/docx-alternative-carrier-bakeoff.test.ts" as const,
    },
    sourceInspection,
    googleDocsRoundtrip: roundtrip,
    googleDocsCopyPlainText: copy,
  };
};

const makeRecord = (): BakeoffRunRecord => {
  const candidates = CANDIDATE_ORDER.map(candidateFor) as [
    CandidateRecord,
    CandidateRecord,
    CandidateRecord,
  ];
  const matrix = candidates.map((candidate) =>
    matrixFor(candidate.candidateId, candidate),
  ) as [MatrixRow, MatrixRow, MatrixRow];
  return {
    experimentId: "glyph-exp-a-docx-alternative-carrier-bakeoff-v1-001",
    experimentSchemaVersion: 1,
    date: "2026-08-31",
    bakeoffProfile: "docx-alternative-carrier-bakeoff-v1",
    fingerprintStrategy: null,
    fingerprintStrategyVersion: null,
    matchingProfile: null,
    fixedMarkers: MARKERS,
    visibleFixture: {
      id: "synthetic-library-hours-v1",
      sourcePath: "research/experiments/docx-hidden-run-v1/fixture.ts",
    },
    sourceGenerator: {
      path: "src/documents/docx/docx-alternative-carrier-bakeoff-v1.ts",
      gitCommit: "a".repeat(40),
      nodeVersion: "v26.0.0",
      pnpmVersion: "11.19.0",
      docxVersion: "9.7.1",
    },
    googleDocsProtocol: {
      application: { name: "Google Docs", version: null },
      platform: { name: "macOS", version: "26.0" },
      candidateOrder: CANDIDATE_ORDER,
      documentRule: "one new unshared document per candidate",
    },
    candidates,
    matrix,
    gateDecision: "SELECT_CANDIDATE",
    selectedCandidateId: "matching-color-body-v1",
    gateRationale: [
      "Synthetic record selects matching-color-body-v1 as the sole body candidate satisfying the frozen conditions.",
    ],
    limitations: [
      "Synthetic record does not establish editor or clipboard behavior.",
    ],
  };
};

const writeRecordArtifacts = async (
  repositoryRoot: string,
  record: BakeoffRunRecord,
): Promise<void> => {
  await mkdir(join(repositoryRoot, ARTIFACT_DIRECTORY), { recursive: true });
  for (const candidate of record.candidates) {
    const refs = [
      candidate.canonicalArtifact,
      candidate.googleDocsRoundtrip.resultArtifact,
      candidate.googleDocsCopyPlainText.resultArtifact,
    ];
    for (const [index, ref] of refs.entries()) {
      if (!ref) {
        continue;
      }
      const bytes = new TextEncoder().encode(
        `synthetic artifact ${candidate.candidateId} ${index}`,
      );
      await writeFile(join(repositoryRoot, ref.path), bytes);
      Object.assign(ref, { sha256: hash(bytes) });
    }
    Object.assign(candidate.googleDocsRoundtrip, {
      sourceArtifactSha256: candidate.canonicalArtifact.sha256,
    });
    Object.assign(candidate.googleDocsCopyPlainText, {
      sourceArtifactSha256: candidate.canonicalArtifact.sha256,
    });
  }
};

const withTempRecord = async (
  mutate?: (record: BakeoffRunRecord) => void,
): Promise<{ repositoryRoot: string; record: BakeoffRunRecord }> => {
  const repositoryRoot = await mkdtemp(join(tmpdir(), "glyph-bakeoff-record-"));
  const record = structuredClone(makeRecord()) as BakeoffRunRecord;
  await writeRecordArtifacts(repositoryRoot, record);
  mutate?.(record);
  return { repositoryRoot, record };
};

const expectInvalidRecord = async (
  mutate: (record: BakeoffRunRecord) => void,
): Promise<void> => {
  const { repositoryRoot, record } = await withTempRecord(mutate);
  try {
    await expect(
      validateBakeoffRunRecord(record, { repositoryRoot }),
    ).rejects.toThrow();
  } finally {
    await rm(repositoryRoot, { recursive: true, force: true });
  }
};

describe("alternative carrier bakeoff record validator", () => {
  test("accepts a complete synthetic schema with one selected body candidate and matching hashes", async () => {
    const { repositoryRoot, record } = await withTempRecord();
    try {
      expect(assertValidBakeoffRunRecord(record)).toBeUndefined();
      await expect(
        validateBakeoffRunRecord(record, { repositoryRoot }),
      ).resolves.toEqual(record);
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
    }
  });

  test("retains URL-shaped OOXML safety findings as assessable evidence", async () => {
    const { repositoryRoot, record } = await withTempRecord();
    try {
      const candidate = record.candidates[1];
      const safety = {
        externalRelationships: ["https://example.invalid/external"],
        unresolvedRelationshipTargets: ["http://example.invalid/missing"],
        activeContentEntries: ["http://example.invalid/active-content"],
        activeRelationshipTypes: [
          "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink",
        ],
        macroContentTypes: ["http://example.invalid/macro-content"],
      };
      Object.assign(candidate.googleDocsRoundtrip, {
        transformedInspection: {
          ...candidate.googleDocsRoundtrip.transformedInspection,
          safety,
        },
      });
      const matrix = matrixFor(candidate.candidateId, candidate);
      Object.assign(matrix.engineering, { roundtripSafetyClean: false });
      Object.assign(record.matrix, { 1: matrix });
      await expect(
        validateBakeoffRunRecord(record, { repositoryRoot }),
      ).resolves.toEqual(record);
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
    }
  });

  test.each([
    ["a fourth candidate", (record: BakeoffRunRecord) => {
      Object.assign(record, {
        candidates: [...record.candidates, record.candidates[0]],
      });
    }],
    ["reordered candidates", (record: BakeoffRunRecord) => {
      Object.assign(record, {
        candidates: [
          record.candidates[1],
          record.candidates[0],
          record.candidates[2],
        ],
      });
    }],
    ["a misspelled gate", (record: BakeoffRunRecord) => {
      Object.assign(record, { gateDecision: "SELECT" });
    }],
    ["a missing clipboard failure reason", (record: BakeoffRunRecord) => {
      Object.assign(record.candidates[1], {
        googleDocsCopyPlainText: {
        ...record.candidates[1].googleDocsCopyPlainText,
        status: "failed",
        failureReason: null,
        resultArtifact: null,
        },
      });
    }],
    ["an uppercase hash", (record: BakeoffRunRecord) => {
      Object.assign(record.candidates[0].canonicalArtifact, {
        sha256: record.candidates[0].canonicalArtifact.sha256.toUpperCase(),
      });
    }],
    ["an artifact path outside the bakeoff directory", (record: BakeoffRunRecord) => {
      Object.assign(record.candidates[0].canonicalArtifact, {
        path: "research/outside.docx",
      });
    }],
    ["a selected ID under NO_VIABLE_DOCX_CARRIER", (record: BakeoffRunRecord) => {
      Object.assign(record, {
        gateDecision: "NO_VIABLE_DOCX_CARRIER",
        selectedCandidateId: "matching-color-body-v1",
      });
    }],
  ])("rejects %s", async (_description, mutate) => {
    await expectInvalidRecord(mutate);
  });

  test("rejects a SELECT_CANDIDATE record when two body candidates satisfy the mandatory conditions", async () => {
    await expectInvalidRecord((record) => {
      const candidate = record.candidates[1];
      const roundtripInspection = inspectionFor("sub-legible-body-1pt-v1");
      Object.assign(candidate, { googleDocsRoundtrip: {
        ...candidate.googleDocsRoundtrip,
        markerPresence: { alpha: "present", beta: "present" },
        transformedInspection: roundtripInspection,
      }});
      Object.assign(record.matrix, { 1: matrixFor(
        "sub-legible-body-1pt-v1",
        candidate,
      ) });
    });
  });

  test("rejects SELECT_CANDIDATE when matching-color Alpha moves to another body paragraph", async () => {
    await expectInvalidRecord((record) => {
      const candidate = record.candidates[0];
      const movedOccurrences = sourceOccurrencesFor(candidate.candidateId).map(
        (occurrence) =>
          occurrence.markerId === "alpha"
            ? { ...occurrence, paragraphIndex: 1 }
            : occurrence,
      );
      Object.assign(candidate, {
        googleDocsRoundtrip: {
          ...candidate.googleDocsRoundtrip,
          transformedInspection: inspectionFor(candidate.candidateId, {
            occurrences: movedOccurrences,
          }),
        },
      });
      Object.assign(record.matrix, {
        0: matrixFor(candidate.candidateId, candidate),
      });
    });
  });

  test("rejects SELECT_CANDIDATE when sub-legible Beta moves to another body paragraph", async () => {
    await expectInvalidRecord((record) => {
      const matchingCandidate = record.candidates[0];
      const absentInspection = inspectionFor(matchingCandidate.candidateId, {
        markerPresence: { alpha: "absent", beta: "absent" },
        occurrences: [],
      });
      Object.assign(matchingCandidate, {
        googleDocsRoundtrip: {
          ...matchingCandidate.googleDocsRoundtrip,
          markerPresence: { alpha: "absent", beta: "absent" },
          transformedInspection: absentInspection,
        },
      });
      Object.assign(record.matrix, {
        0: matrixFor(matchingCandidate.candidateId, matchingCandidate),
      });

      const candidate = record.candidates[1];
      const movedOccurrences = sourceOccurrencesFor(candidate.candidateId).map(
        (occurrence) =>
          occurrence.markerId === "beta"
            ? { ...occurrence, paragraphIndex: 1 }
            : occurrence,
      );
      Object.assign(candidate, {
        googleDocsRoundtrip: {
          ...candidate.googleDocsRoundtrip,
          markerPresence: { alpha: "present", beta: "present" },
          transformedInspection: inspectionFor(candidate.candidateId, {
            occurrences: movedOccurrences,
          }),
        },
      });
      Object.assign(record.matrix, {
        1: matrixFor(candidate.candidateId, candidate),
      });
      Object.assign(record, {
        selectedCandidateId: "sub-legible-body-1pt-v1",
      });
    });
  });

  test("rejects the regional header diagnostic as a selected candidate", async () => {
    await expectInvalidRecord((record) => {
      Object.assign(record, { selectedCandidateId: "docx-header-text-v1" });
    });
  });

  test("accepts REVISE_CANDIDATE when both body candidates tie on all mandatory conditions", async () => {
    const { repositoryRoot, record } = await withTempRecord();
    try {
      const candidate = record.candidates[1];
      Object.assign(candidate, {
        googleDocsRoundtrip: {
          ...candidate.googleDocsRoundtrip,
          markerPresence: { alpha: "present", beta: "present" },
          transformedInspection: inspectionFor("sub-legible-body-1pt-v1"),
        },
      });
      Object.assign(record.matrix, {
        1: matrixFor("sub-legible-body-1pt-v1", candidate),
      });
      Object.assign(record, {
        gateDecision: "REVISE_CANDIDATE",
        selectedCandidateId: null,
      });
      await expect(
        validateBakeoffRunRecord(record, { repositoryRoot }),
      ).resolves.toEqual(record);
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
    }
  });

  test("accepts NO_VIABLE_DOCX_CARRIER only when every completed round-trip has no bounded evidence", async () => {
    const { repositoryRoot, record } = await withTempRecord();
    try {
      for (const index of [0, 2] as const) {
        const candidate = record.candidates[index];
        const inspection = inspectionFor(candidate.candidateId, {
          markerPresence: { alpha: "absent", beta: "absent" },
          occurrences: [],
        });
        Object.assign(candidate, {
          googleDocsRoundtrip: {
            ...candidate.googleDocsRoundtrip,
            markerPresence: { alpha: "absent", beta: "absent" },
            transformedInspection: inspection,
          },
        });
        Object.assign(record.matrix, {
          [index]: matrixFor(candidate.candidateId, candidate),
        });
      }
      Object.assign(record, {
        gateDecision: "NO_VIABLE_DOCX_CARRIER",
        selectedCandidateId: null,
      });
      await expect(
        validateBakeoffRunRecord(record, { repositoryRoot }),
      ).resolves.toEqual(record);
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
    }
  });

  test("does not treat conditional exposure alone as revision evidence when ordinary visibility is visible", async () => {
    const { repositoryRoot, record } = await withTempRecord();
    try {
      const matchingCandidate = record.candidates[0];
      Object.assign(matchingCandidate, {
        googleDocsRoundtrip: {
          ...matchingCandidate.googleDocsRoundtrip,
          ordinaryVisibility: "visible",
          conditionalExposure: ["other_recorded_tool"],
        },
      });
      Object.assign(record.matrix, {
        0: matrixFor(matchingCandidate.candidateId, matchingCandidate),
      });

      const headerCandidate = record.candidates[2];
      const inspection = inspectionFor(headerCandidate.candidateId, {
        markerPresence: { alpha: "absent", beta: "absent" },
        occurrences: [],
      });
      Object.assign(headerCandidate, {
        googleDocsRoundtrip: {
          ...headerCandidate.googleDocsRoundtrip,
          markerPresence: { alpha: "absent", beta: "absent" },
          transformedInspection: inspection,
        },
      });
      Object.assign(record.matrix, {
        2: matrixFor(headerCandidate.candidateId, headerCandidate),
      });
      Object.assign(record, {
        gateDecision: "NO_VIABLE_DOCX_CARRIER",
        selectedCandidateId: null,
      });
      await expect(
        validateBakeoffRunRecord(record, { repositoryRoot }),
      ).resolves.toEqual(record);
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
    }
  });

  test("accepts a failed clipboard workflow with a reason and not-assessable observations", async () => {
    const { repositoryRoot, record } = await withTempRecord();
    try {
      const candidate = record.candidates[2];
      Object.assign(candidate, {
        googleDocsCopyPlainText: {
          ...candidate.googleDocsCopyPlainText,
          status: "failed",
          failureReason: "The synthetic clipboard destination was unavailable.",
          resultArtifact: null,
          markerPresence: { alpha: "not_assessable", beta: "not_assessable" },
          visibleBody: "not_assessable",
        },
      });
      Object.assign(record.matrix, {
        2: matrixFor(candidate.candidateId, candidate),
      });
      await expect(
        validateBakeoffRunRecord(record, { repositoryRoot }),
      ).resolves.toEqual(record);
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
    }
  });

  test("rejects a completed clipboard workflow with unassessed observations", async () => {
    await expectInvalidRecord((record) => {
      const candidate = record.candidates[2];
      Object.assign(candidate, {
        googleDocsCopyPlainText: {
          ...candidate.googleDocsCopyPlainText,
          markerPresence: { alpha: "not_assessable", beta: "not_assessable" },
          visibleBody: "not_assessable",
        },
      });
      Object.assign(record.matrix, {
        2: matrixFor(candidate.candidateId, candidate),
      });
    });
  });

  test("accepts a failed clipboard workflow with a retained artifact and assessed observations", async () => {
    const { repositoryRoot, record } = await withTempRecord();
    try {
      const candidate = record.candidates[2];
      Object.assign(candidate, {
        googleDocsCopyPlainText: {
          ...candidate.googleDocsCopyPlainText,
          status: "failed",
          failureReason: "The synthetic clipboard destination returned partial evidence.",
          markerPresence: { alpha: "absent", beta: "absent" },
          visibleBody: "changed",
        },
      });
      Object.assign(record.matrix, {
        2: matrixFor(candidate.candidateId, candidate),
      });
      await expect(
        validateBakeoffRunRecord(record, { repositoryRoot }),
      ).resolves.toEqual(record);
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
    }
  });

  test("requires Google Docs provenance for a completed clipboard workflow", async () => {
    await expectInvalidRecord((record) => {
      Object.assign(record.candidates[0].googleDocsCopyPlainText.application, {
        name: "TextEdit",
      });
    });
  });

  test("rejects nested extra fields and inconsistent round-trip safety summaries", async () => {
    await expectInvalidRecord((record) => {
      Object.assign(record.candidates[0].googleDocsRoundtrip.transformedInspection, {
        unexpected: true,
      });
    });
    await expectInvalidRecord((record) => {
      Object.assign(record.candidates[0].googleDocsRoundtrip.transformedInspection, {
        safety: {
          ...record.candidates[0].googleDocsRoundtrip.transformedInspection.safety,
          activeContentEntries: ["word/vbaProject.bin"],
        },
      });
    });
    await expectInvalidRecord((record) => {
      Object.assign(record.candidates[0].sourceInspection, {
        safety: {
          ...record.candidates[0].sourceInspection.safety,
          activeContentEntries: ["word/vbaProject.bin"],
        },
      });
    });
  });

  test("rejects a symlinked artifact even when it resolves inside the bakeoff directory", async () => {
    const { repositoryRoot, record } = await withTempRecord();
    const sourcePath = join(repositoryRoot, record.candidates[0].canonicalArtifact.path);
    const outsidePath = join(repositoryRoot, "synthetic-outside.docx");
    try {
      await writeFile(outsidePath, "synthetic outside artifact");
      await unlink(sourcePath);
      await symlink(outsidePath, sourcePath);
      await expect(
        validateBakeoffRunRecord(record, { repositoryRoot }),
      ).rejects.toThrow();
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
    }
  });

  test("rejects an artifact directory that escapes through a symlinked ancestor", async () => {
    const repositoryRoot = await mkdtemp(join(tmpdir(), "glyph-bakeoff-repository-"));
    const externalRoot = await mkdtemp(join(tmpdir(), "glyph-bakeoff-external-"));
    const record = structuredClone(makeRecord()) as BakeoffRunRecord;
    try {
      await writeRecordArtifacts(externalRoot, record);
      await mkdir(join(repositoryRoot, "research", "artifacts"), {
        recursive: true,
      });
      await symlink(
        join(externalRoot, ARTIFACT_DIRECTORY),
        join(repositoryRoot, ARTIFACT_DIRECTORY),
        "dir",
      );
      await expect(
        validateBakeoffRunRecord(record, { repositoryRoot }),
      ).rejects.toThrow();
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
      await rm(externalRoot, { recursive: true, force: true });
    }
  });

  test("rejects an artifact whose bytes no longer match the recorded hash", async () => {
    const { repositoryRoot, record } = await withTempRecord();
    try {
      await writeFile(
        join(repositoryRoot, record.candidates[0].canonicalArtifact.path),
        "tampered synthetic artifact",
      );
      await expect(
        validateBakeoffRunRecord(record, { repositoryRoot }),
      ).rejects.toThrow();
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
    }
  });

  test.each([
    ["not_run", (record: BakeoffRunRecord) => {
      Object.assign(record.candidates[0], { googleDocsRoundtrip: {
        ...record.candidates[0].googleDocsRoundtrip,
        status: "not_run",
        failureReason: "The synthetic workflow was not run.",
        resultArtifact: null,
        transformedInspection: null,
      }});
    }],
    ["failed", (record: BakeoffRunRecord) => {
      Object.assign(record.candidates[0], { googleDocsRoundtrip: {
        ...record.candidates[0].googleDocsRoundtrip,
        status: "failed",
        failureReason: "The synthetic workflow failed.",
        resultArtifact: null,
        transformedInspection: null,
      }});
    }],
    ["a missing artifact", (record: BakeoffRunRecord) => {
      Object.assign(record.candidates[0], { googleDocsRoundtrip: {
        ...record.candidates[0].googleDocsRoundtrip,
        resultArtifact: null,
      }});
    }],
    ["a malformed inspection", (record: BakeoffRunRecord) => {
      Object.assign(record.candidates[0], { googleDocsRoundtrip: {
        ...record.candidates[0].googleDocsRoundtrip,
        transformedInspection: {},
      }});
    }],
    ["an uninspectable marker observation", (record: BakeoffRunRecord) => {
      Object.assign(record.candidates[0], { googleDocsRoundtrip: {
        ...record.candidates[0].googleDocsRoundtrip,
        transformedInspection: {
          ...inspectionFor("matching-color-body-v1"),
          markerPresence: { alpha: "unknown", beta: "unknown" },
        },
      }});
    }],
  ])("rejects an operationally blocked round-trip with %s", async (_description, mutate) => {
    await expectInvalidRecord(mutate);
  });

  test.each([
    ["an invalid enum", (record: BakeoffRunRecord) => {
      Object.assign(record.candidates[0].googleDocsRoundtrip, {
        ordinaryVisibility: "sometimes",
      });
    }],
    ["an extra top-level field", (record: BakeoffRunRecord) => {
      (record as never as Record<string, unknown>).unexpected = true;
    }],
    ["a response-like field", (record: BakeoffRunRecord) => {
      (record as never as Record<string, unknown>).rawResponse = "synthetic";
    }],
    ["an account identifier field", (record: BakeoffRunRecord) => {
      (record as never as Record<string, unknown>).accountId = "synthetic";
    }],
    ["a cloud URL value", (record: BakeoffRunRecord) => {
      Object.assign(record, {
        limitations: ["See https://example.invalid/synthetic"],
      });
    }],
  ])("rejects %s", async (_description, mutate) => {
    await expectInvalidRecord(mutate);
  });

  test("rejects email and account identifiers embedded in prose values", async () => {
    await expectInvalidRecord((record) => {
      Object.assign(record, {
        limitations: [
          "Contact reviewer@example.com after checking account id: acct_123456.",
        ],
      });
    });
  });

  test("allows fixed scientific prose without identifier-shaped values", async () => {
    const { repositoryRoot, record } = await withTempRecord();
    try {
      Object.assign(record, {
        limitations: [
          "The account-safe carrier result remains scoped to the frozen protocol.",
        ],
      });
      await expect(
        validateBakeoffRunRecord(record, { repositoryRoot }),
      ).resolves.toEqual(record);
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
    }
  });
});
