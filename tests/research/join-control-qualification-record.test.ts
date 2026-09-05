import { createHash } from "node:crypto";
import { describe, expect, test } from "vitest";

import {
  JOIN_CONTROL_QUALIFICATION_CASES,
  QUALIFICATION_MUTATION_TARGETS,
  type QualificationCaseId,
  type QualificationCheckpointId,
} from "../../research/experiments/docx-join-control-accessibility-qualification-v1/fixture.ts";
import type { JoinControlQualificationDocxInspection } from "../../research/experiments/docx-join-control-accessibility-qualification-v1/inspect-qualification-docx.ts";
import type { JoinControlQualificationTextInspection } from "../../research/experiments/docx-join-control-accessibility-qualification-v1/inspect-qualification-text.ts";
import type { QualificationPdfInspection } from "../../scripts/inspect-pdf-join-control-qualification.ts";
import {
  QUALIFICATION_FAILURE_CODES,
  REQUIRED_QUALIFICATION_LIMITATIONS,
  assertJoinControlQualificationRecordShape,
  deriveJoinControlQualificationFailureCodes,
  deriveJoinControlQualificationGate,
  validateJoinControlQualificationRun,
  type QualificationRunRecord,
  type QualificationValidationDependencies,
} from "../../scripts/validate-docx-join-control-qualification-run.ts";

const bytes = new TextEncoder().encode("synthetic qualification artifact");
const hash = createHash("sha256").update(bytes).digest("hex");
const root = "research/artifacts/docx-join-control-accessibility-qualification-v1";

const segmentation = (caseId: QualificationCaseId) =>
  JOIN_CONTROL_QUALIFICATION_CASES.find(({ id }) => id === caseId)!.rows.map(
    (row, rowIndex) => ({
      rowIndex: rowIndex as 0 | 1 | 2 | 3,
      locale: row.language,
      graphemeCount: 1,
      wordLikeCount: 1,
      paragraphCount: 1 as const,
    }),
  ) as unknown as JoinControlQualificationDocxInspection["segmentation"];

const docxInspection = (
  caseId: QualificationCaseId,
  checkpointId: QualificationCheckpointId,
  mode: "source" | "transformed",
): JoinControlQualificationDocxInspection => ({
  mode,
  caseId,
  checkpointId,
  frameState: "exact",
  occurrences: [
    {
      markerId: "alpha",
      checksumValid: true,
      context: "ordinary-body",
      part: "word/document.xml",
      paragraphIndex: 1,
      runIndices: [1],
      startCodePointIndex: 1,
      codePointCount: 120,
      anchor:
        checkpointId !== "canonical" && checkpointId !== "roundtrip" &&
        (checkpointId.endsWith("-redone") || checkpointId.endsWith("-result"))
          ? "operation-expected"
          : "expected",
      finding: "none",
    },
    {
      markerId: "beta",
      checksumValid: true,
      context: "ordinary-body",
      part: "word/document.xml",
      paragraphIndex: 3,
      runIndices: [1],
      startCodePointIndex: 1,
      codePointCount: 120,
      anchor:
        checkpointId !== "canonical" && checkpointId !== "roundtrip" &&
        (checkpointId.endsWith("-redone") || checkpointId.endsWith("-result"))
          ? "operation-expected"
          : "expected",
      finding: "none",
    },
  ],
  visibleTextState: "exact",
  hiddenPropertyState: "absent",
  defaultIgnorableState: "allowlisted-only",
  nfcState: "stable",
  nfkcState: "stable",
  segmentationState: "expected",
  segmentation: segmentation(caseId),
  nodeVersion: process.versions.node,
  icuVersion: process.versions.icu ?? "",
  unicodeVersion: process.versions.unicode ?? "",
  packageSafetyState: "safe",
  relationshipSafetyState: "safe",
  macroOrActiveContent: "absent",
  coreMetadata: { creator: "absent", lastModifiedBy: "absent", otherCore: "absent" },
  findings: [],
});

const textInspection = (
  caseId: QualificationCaseId,
): JoinControlQualificationTextInspection => ({
  caseId,
  checkpointId: "roundtrip",
  lineEndings: "lf",
  frameState: "exact",
  visibleTextState: "exact",
  defaultIgnorableState: "allowlisted-only",
  nfcState: "stable",
  nfkcState: "stable",
  segmentationState: "expected",
  segmentation: segmentation(caseId),
  nodeVersion: process.versions.node,
  icuVersion: process.versions.icu ?? "",
  unicodeVersion: process.versions.unicode ?? "",
  findings: [],
});

const pdfInspection = (caseId: QualificationCaseId): QualificationPdfInspection => ({
  caseId,
  encrypted: false,
  pageCount: 1,
  visibleTextState: "exact-order",
  carrierOrPlaceholderState: "absent",
  attachmentCount: 0,
  annotationCount: 0,
  javascriptState: "absent",
  launchActionState: "absent",
  uriActionState: "absent",
  unsafeActionState: "absent",
  metadata: {
    author: "absent", creator: "absent", producer: "absent", title: "absent",
    subject: "absent", keywords: "absent", creatorTool: "absent",
    otherInfo: "absent", otherXmp: "absent",
  },
  safetyState: "safe",
  findings: [],
});

const docxArtifact = (
  path: string,
  caseId: QualificationCaseId,
  checkpointId: QualificationCheckpointId,
  mode: "source" | "transformed",
) => ({ path, sha256: hash, sourceCanonicalSha256: hash, inspection: docxInspection(caseId, checkpointId, mode) });

const mutationCheckpoint = (
  target: (typeof QUALIFICATION_MUTATION_TARGETS)[number],
  operation: "insert" | "backspace" | "forward-delete",
  restored: boolean,
): QualificationCheckpointId => {
  const suffix = operation === "insert"
    ? restored ? "insert-restored" : "insert-redone"
    : operation === "backspace"
      ? restored ? "backspace-restored" : "backspace-result"
      : restored ? "forward-delete-restored" : "forward-delete-result";
  return `${target}-${suffix}` as QualificationCheckpointId;
};

const makeRecord = (): QualificationRunRecord => ({
  schemaVersion: 1,
  experimentId: "glyph-exp-docx-zero-width-join-control-qualification-v1-001",
  qualificationProfile: "docx-zero-width-join-control-qualification-v1",
  candidateId: "join-control-binary-v1",
  documentProfile: "docx-zero-width-join-control-v1",
  implementation: {
    gitRevision: "a".repeat(40),
    protocolPath: "research/experiments/docx-join-control-accessibility-qualification-v1/protocol.md",
    protocolSha256: hash,
    fixturePath: "research/experiments/docx-join-control-accessibility-qualification-v1/fixture.ts",
    fixtureSha256: hash,
    generatorPath: "src/documents/docx/docx-join-control-accessibility-qualification-v1.ts",
    generatorSha256: hash,
    validatorPath: "scripts/validate-docx-join-control-qualification-run.ts",
    validatorSha256: hash,
    nodeVersion: process.versions.node,
    icuVersion: process.versions.icu ?? "",
    unicodeVersion: process.versions.unicode ?? "",
    uvVersion: "0.12.9",
    pythonVersion: "3.14.7",
    pythonUnicodeVersion: "16.0.0",
    pypdfVersion: "6.10.0",
    pdftoppmVersion: "26.05.0",
  },
  environments: {
    macos: { macosVersion: "26.0", chromeVersion: "140.0", googleDocsVersion: "not-exposed", wordForMacVersion: "16.100" },
    windowsNvda: {
      windows11Version: "24H2", nvdaVersion: "2026.2", espeakNgVersion: "1.52", chromeVersion: "140.0",
      googleDocsVersion: "not-exposed", wordMicrosoft365Version: "2508", keyboardLayout: "us-english-desktop",
      settingsProfile: "nvda-join-control-qualification-v1", synthesizer: "eSpeak NG", voice: "English (America)",
      voiceLanguage: "en-US", variant: "none", rate: 50, pitch: 50, inflection: 50, volume: 100, rateBoost: false,
      automaticLanguageSwitching: true, automaticDialectSwitching: false, punctuationLevel: "all", speechMode: "talk",
      typedCharacterEcho: true, typedWordEcho: false, characterDescriptions: false, unicodeNormalization: true,
      reportNormalized: false, trustVoiceLanguage: true, unicodeConsortiumData: true, reportLanguage: true,
      reportSpellingErrors: true, reportLinks: true, reportFontStyleFormattingChanges: false, braille: false,
      enabledAddOnCount: 0, googleDocsScreenReaderSupport: true, googleDocsBrailleSupport: false,
      googleDocsCollaboratorAnnouncements: false, googleDocsMode: "focus", wordView: "print-layout",
      wordTrackChanges: false, wordShowHide: false, wordSpecialFormattingDisplay: false,
    },
  },
  cases: JOIN_CONTROL_QUALIFICATION_CASES.map(({ id: caseId }) => ({
    caseId,
    canonical: docxArtifact(`${root}/${caseId}.docx`, caseId, "canonical", "source"),
    editors: (["google-docs", "microsoft-word"] as const).map((editorId) => ({
      editorId,
      sourceCanonicalSha256: hash,
      roundtrip: docxArtifact(`${root}/${caseId}-${editorId}-roundtrip.docx`, caseId, "roundtrip", "transformed"),
      mutations: (["insert", "backspace", "forward-delete"] as const).flatMap((operation) =>
        QUALIFICATION_MUTATION_TARGETS.map((target) => {
          const result = mutationCheckpoint(target, operation, false);
          const restored = mutationCheckpoint(target, operation, true);
          return {
            target, operation,
            result: docxArtifact(`${root}/${caseId}-${editorId}-${result}.docx`, caseId, result, "transformed"),
            restored: docxArtifact(`${root}/${caseId}-${editorId}-${restored}.docx`, caseId, restored, "transformed"),
            visibleConsequence: "expected" as const, frameConsequence: "exact" as const,
          };
        }),
      ),
      clipboard: { path: `${root}/${caseId}-${editorId}-copy-plain-text.txt`, sha256: hash, sourceCanonicalSha256: hash, inspection: textInspection(caseId) },
      pdf: {
        path: `${root}/${caseId}-${editorId}-print.pdf`, sha256: hash, sourceCanonicalSha256: hash,
        inspection: pdfInspection(caseId), rendererVersion: "26.05.0" as const, render: "rendered-one-page" as const,
        visualPage: "parity" as const, visualLayout: "parity" as const, visualTextOrder: "parity" as const, visualPlaceholder: "absent" as const,
      },
      primary: {
        visibleText: "parity" as const, shaping: "parity" as const, graphemes: "parity" as const,
        carrierPresentation: "absent" as const, layout: "parity" as const, bidiOrder: "parity" as const,
        navigation: "parity" as const, search: "both-rows-found" as const,
        clipboardSelection: "body-only" as const, selectionPresentation: "absent" as const,
      },
      spellcheck: {
        pairFindings: "same" as const, pairSuggestionPresence: "same" as const,
        latinBetaMisspelling: caseId === "latin-operations-v1" ? "same" as const : "not-applicable" as const,
      },
      specializedView: { presentation: "none" as const, navigation: "parity" as const, residualLayout: "none" as const },
      printPreview: "parity" as const,
      accessibilityAssistant: editorId === "google-docs" ? "not-applicable" as const : "no-carrier-finding" as const,
      nvda: {
        spokenText: "parity" as const, readingOrder: "parity" as const, extraAnnouncements: "none" as const,
        joinControlAnnouncement: "absent" as const, navigation: "parity" as const, navigationTrap: "absent" as const,
        selectionFeedback: "parity" as const, editingFeedback: "parity" as const, speechViewer: "parity" as const,
      },
    })),
  })) as unknown as QualificationRunRecord["cases"],
  deviations: [],
  limitations: [...REQUIRED_QUALIFICATION_LIMITATIONS],
  gate: { failureCodes: [], decision: "QUALIFY_PROFILE", rationale: "all-mandatory-criteria-passed" },
});

type DeepMutable<T> = { -readonly [K in keyof T]: T[K] extends readonly (infer U)[] ? DeepMutable<U>[] : T[K] extends object ? DeepMutable<T[K]> : T[K] };
const mutable = (record = makeRecord()): DeepMutable<QualificationRunRecord> =>
  structuredClone(record) as unknown as DeepMutable<QualificationRunRecord>;

const dependencies: QualificationValidationDependencies = {
  readArtifact: async () => bytes,
  readImplementation: async () => bytes,
  inspectDocx: (_bytes, caseId, checkpointId, mode) => docxInspection(caseId, checkpointId, mode),
  inspectText: (_bytes, caseId) => textInspection(caseId),
  inspectPdf: async (_bytes, caseId) => pdfInspection(caseId),
  resolveGitRevision: async () => undefined,
  readImplementationAtRevision: async () => bytes,
};

describe("join-control qualification record gate", () => {
  test("derives the only two decisions from ordered unique failure codes", () => {
    expect(deriveJoinControlQualificationGate([])).toEqual({ failureCodes: [], decision: "QUALIFY_PROFILE", rationale: "all-mandatory-criteria-passed" });
    expect(deriveJoinControlQualificationGate(["nvda-speech-viewer-mismatch", "visible-text-mismatch", "visible-text-mismatch"])).toEqual({
      failureCodes: ["visible-text-mismatch", "nvda-speech-viewer-mismatch"], decision: "REJECT_PROFILE", rationale: "mandatory-criteria-failed",
    });
    expect(QUALIFICATION_FAILURE_CODES).toHaveLength(50);
  });

  test("accepts the complete minimal passing matrix and independently verifies it", async () => {
    const record = makeRecord();
    assertJoinControlQualificationRecordShape(record);
    expect(deriveJoinControlQualificationFailureCodes(record)).toEqual([]);
    await expect(validateJoinControlQualificationRun(record, "/synthetic", dependencies)).resolves.toBe(record);
  });

  test("rejects schema drift, wrong profiles, unsafe strings, lineage errors, and a third decision", () => {
    const extra = mutable() as DeepMutable<QualificationRunRecord> & { extra?: boolean };
    extra.extra = true;
    expect(() => assertJoinControlQualificationRecordShape(extra)).toThrow(/unexpected or missing fields/);
    const nested = mutable();
    (nested.cases[0]!.editors[0]!.primary as unknown as Record<string, unknown>).rawText = "prohibited";
    expect(() => assertJoinControlQualificationRecordShape(nested)).toThrow(/unexpected or missing fields/);
    const missing = mutable();
    missing.cases.pop();
    expect(() => assertJoinControlQualificationRecordShape(missing)).toThrow(/four ordered cases/);
    const profile = mutable();
    profile.candidateId = "other" as "join-control-binary-v1";
    expect(() => assertJoinControlQualificationRecordShape(profile)).toThrow(/candidateId/);
    const qualificationProfile = mutable();
    qualificationProfile.qualificationProfile = "other" as "docx-zero-width-join-control-qualification-v1";
    expect(() => assertJoinControlQualificationRecordShape(qualificationProfile)).toThrow(/qualificationProfile/);
    const unsafe = mutable();
    unsafe.environments.macos.chromeVersion = "https://private.example";
    expect(() => assertJoinControlQualificationRecordShape(unsafe)).toThrow(/safe version/);
    const proseVersion = mutable();
    proseVersion.environments.macos.chromeVersion = "Harry Jin private workstation";
    expect(() => assertJoinControlQualificationRecordShape(proseVersion)).toThrow(/safe version/);
    for (const identityBearingVersion of [
      "1.0 (Harry-Jin)",
      "1.0 (private-subject)",
      "1.0 (call-me)",
    ]) {
      const prefixedProse = mutable();
      prefixedProse.environments.macos.chromeVersion = identityBearingVersion;
      expect(() => assertJoinControlQualificationRecordShape(prefixedProse)).toThrow(/safe version/);
    }
    const lineage = mutable();
    lineage.cases[0]!.editors[0]!.sourceCanonicalSha256 = "b".repeat(64);
    expect(() => assertJoinControlQualificationRecordShape(lineage)).toThrow(/sourceCanonicalSha256/);
    const artifactLineage = mutable();
    artifactLineage.cases[0]!.editors[0]!.roundtrip.sourceCanonicalSha256 = "b".repeat(64);
    expect(() => assertJoinControlQualificationRecordShape(artifactLineage)).toThrow(/canonical lineage/);
    const decision = mutable();
    decision.gate.decision = "BLOCKED" as "QUALIFY_PROFILE";
    expect(() => assertJoinControlQualificationRecordShape(decision)).toThrow(/decision/);
  });

  test("requires the frozen Python and Unicode-data runtime provenance", () => {
    const missing = mutable();
    delete (missing.implementation as unknown as Record<string, unknown>)
      .pythonUnicodeVersion;
    expect(() =>
      assertJoinControlQualificationRecordShape(
        missing as unknown as QualificationRunRecord,
      )
    ).toThrow(/implementation/);

    const record = mutable();
    (record.implementation as unknown as Record<string, unknown>).pythonVersion =
      "3.14.6";
    expect(() =>
      assertJoinControlQualificationRecordShape(
        record as unknown as QualificationRunRecord,
      )
    ).toThrow(/pythonVersion/);
  });

  test("accepts a Latin spellcheck difference so the frozen gate can reject it", async () => {
    const record = mutable();
    record.cases[0]!.editors[0]!.spellcheck.latinBetaMisspelling = "different";
    const gate = deriveJoinControlQualificationGate(
      deriveJoinControlQualificationFailureCodes(
        record as unknown as QualificationRunRecord,
      ),
    );
    expect(gate).toEqual({
      failureCodes: ["spellcheck-mismatch"],
      decision: "REJECT_PROFILE",
      rationale: "mandatory-criteria-failed",
    });
    record.gate.failureCodes = [...gate.failureCodes];
    record.gate.decision = gate.decision;
    record.gate.rationale = gate.rationale;
    await expect(
      validateJoinControlQualificationRun(
        record as unknown as QualificationRunRecord,
        "/synthetic",
        dependencies,
      ),
    ).resolves.toBe(record);
  });

  test("accepts redacted non-ordinary occurrence coordinates", () => {
    const record = mutable();
    record.cases[0]!.canonical.inspection.occurrences[0] = {
      markerId: "alpha",
      checksumValid: true,
      context: "non-ordinary",
      part: "other-redacted",
      paragraphIndex: -1,
      runIndices: [-1],
      startCodePointIndex: 0,
      codePointCount: 120,
      anchor: "unexpected",
      finding: "moved",
    };
    expect(() =>
      assertJoinControlQualificationRecordShape(
        record as unknown as QualificationRunRecord,
      )
    ).not.toThrow();
  });

  test("blocks hash and independent-inspection mismatches", async () => {
    await expect(validateJoinControlQualificationRun(makeRecord(), "/synthetic", {
      ...dependencies, readArtifact: async () => new TextEncoder().encode("different"),
    })).rejects.toThrow(/hash mismatch/);
    await expect(validateJoinControlQualificationRun(makeRecord(), "/synthetic", {
      ...dependencies, inspectText: (_bytes, caseId) => ({ ...textInspection(caseId), lineEndings: "crlf" }),
    })).rejects.toThrow(/independent text inspection/);
  });

  test("blocks a claimed gate or committed provenance that differs from evidence", async () => {
    const record = mutable();
    record.cases[0]!.editors[0]!.primary.shaping = "mismatch";
    await expect(
      validateJoinControlQualificationRun(record, "/synthetic", dependencies),
    ).rejects.toThrow(/mechanically derived gate/);
    await expect(
      validateJoinControlQualificationRun(makeRecord(), "/synthetic", {
        ...dependencies,
        readImplementationAtRevision: async () =>
          new TextEncoder().encode("different committed source"),
      }),
    ).rejects.toThrow(/hash mismatch/);
  });

  test("blocks drift in an executable behavior file outside the four recorded pins", async () => {
    await expect(
      validateJoinControlQualificationRun(makeRecord(), "/synthetic", {
        ...dependencies,
        readImplementationAtRevision: async (_root, _revision, path) =>
          path.endsWith("inspect-qualification-text.ts")
            ? new TextEncoder().encode("different committed behavior")
            : bytes,
      }),
    ).rejects.toThrow(/behavior file/i);
  });

  test("blocks drift in the reused carrier fixture's transitive dependency", async () => {
    await expect(
      validateJoinControlQualificationRun(makeRecord(), "/synthetic", {
        ...dependencies,
        readImplementationAtRevision: async (_root, _revision, path) =>
          path === "research/experiments/docx-hidden-run-v1/fixture.ts"
            ? new TextEncoder().encode("different transitive fixture")
            : bytes,
      }),
    ).rejects.toThrow(/behavior file/i);
  });

  test("derives PDF visual and unresolved metadata failures without inventing a blocked state", () => {
    const record = mutable();
    record.cases[0]!.editors[0]!.pdf.visualPage = "mismatch";
    record.cases[0]!.canonical.inspection.coreMetadata.creator =
      "non_synthetic_redacted";
    expect(
      deriveJoinControlQualificationFailureCodes(
        record as unknown as QualificationRunRecord,
      ),
    ).toEqual(["pdf-render-mismatch", "metadata-privacy-unresolved"]);
  });

  test("derives representative failures from every mandatory evidence family in fixed order", () => {
    const record = mutable();
    const editor = record.cases[0]!.editors[0]!;
    record.cases[0]!.canonical.inspection.findings = ["canonical-structure-failed", "source-frame-failed", "source-anchor-failed"];
    editor.roundtrip.inspection.findings = [
      "transformed-frame-failed", "transformed-anchor-failed", "visible-text-mismatch", "hidden-property-present",
      "unexpected-default-ignorable", "normalization-mismatch", "segmentation-mismatch", "package-unsafe",
      "relationship-unsafe", "macro-or-active-content",
    ];
    editor.primary.carrierPresentation = "present";
    editor.primary.shaping = "mismatch";
    editor.primary.graphemes = "mismatch";
    editor.primary.bidiOrder = "mismatch";
    editor.primary.layout = "mismatch";
    editor.primary.navigation = "mismatch";
    editor.primary.search = "mismatch";
    editor.spellcheck.pairFindings = "different";
    editor.primary.clipboardSelection = "mismatch";
    editor.mutations[0]!.visibleConsequence = "mismatch";
    editor.mutations[0]!.frameConsequence = "mismatch";
    editor.mutations[4]!.visibleConsequence = "mismatch";
    editor.mutations[4]!.frameConsequence = "mismatch";
    editor.mutations[8]!.visibleConsequence = "mismatch";
    editor.mutations[8]!.frameConsequence = "mismatch";
    editor.mutations[0]!.restored.inspection.visibleTextState = "mismatch";
    editor.printPreview = "mismatch";
    editor.pdf.inspection.findings = ["pdf-encrypted", "pdf-page-count-mismatch", "pdf-text-order-mismatch", "pdf-placeholder-present", "pdf-unsafe-content"];
    editor.pdf.render = "failed";
    editor.pdf.visualPage = "not-observed-render-failed";
    editor.pdf.visualLayout = "not-observed-render-failed";
    editor.pdf.visualTextOrder = "not-observed-render-failed";
    editor.pdf.visualPlaceholder = "not-observed-render-failed";
    editor.specializedView.presentation = "decoded-payload";
    editor.specializedView.navigation = "trap";
    editor.specializedView.residualLayout = "present";
    editor.nvda.spokenText = "mismatch";
    editor.nvda.readingOrder = "mismatch";
    editor.nvda.extraAnnouncements = "present";
    editor.nvda.joinControlAnnouncement = "present";
    editor.nvda.navigation = "mismatch";
    editor.nvda.navigationTrap = "present";
    editor.nvda.selectionFeedback = "mismatch";
    editor.nvda.editingFeedback = "mismatch";
    editor.nvda.speechViewer = "mismatch";
    expect(deriveJoinControlQualificationFailureCodes(record as unknown as QualificationRunRecord)).toEqual(
      QUALIFICATION_FAILURE_CODES.filter((code) => code !== "pdf-render-mismatch" && code !== "metadata-privacy-unresolved"),
    );
  });
});
