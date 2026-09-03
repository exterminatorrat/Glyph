import { spawnSync } from "node:child_process";
import {
  createHash,
} from "node:crypto";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { describe, expect, test } from "vitest";
import {
  CANDIDATE_A,
  VISIBLE_PARAGRAPHS,
  ZERO_WIDTH_CANDIDATES,
  ZERO_WIDTH_FIXTURE,
  type CandidateId,
} from "../../research/experiments/docx-zero-width-carrier-bakeoff-v1/fixture.ts";
import { encodeCarrier } from "../../research/experiments/docx-zero-width-carrier-bakeoff-v1/frame.ts";
import {
  inspectZeroWidthDocx,
} from "../../research/experiments/docx-zero-width-carrier-bakeoff-v1/inspect-zero-width-docx.ts";
import {
  inspectZeroWidthText,
} from "../../research/experiments/docx-zero-width-carrier-bakeoff-v1/inspect-zero-width-text.ts";
import { generateZeroWidthCarrierDocx } from "../../src/documents/docx/docx-zero-width-carrier-bakeoff-v1.ts";
import {
  ACCESSIBILITY_NOT_ASSESSABLE_LIMITATIONS,
  assertValidZeroWidthCarrierRun,
  criteriaSatisfied,
  deriveZeroWidthGate,
  GOOGLE_LIMITATIONS,
  TRANSPORT_LIMITATIONS,
  type CandidateRunEvidence,
  type ZeroWidthBakeOffRunRecord,
  validateZeroWidthCarrierRun,
  WORD_LIMITATIONS,
} from "../../scripts/validate-docx-zero-width-carrier-run.ts";

const artifactDirectory = "research/artifacts/docx-zero-width-carrier-bakeoff-v1";
const validatorScript = fileURLToPath(
  new URL("../../scripts/validate-docx-zero-width-carrier-run.ts", import.meta.url),
);
const sourcePath = (candidateId: CandidateId): string =>
  `${artifactDirectory}/${candidateId}.docx`;
const artifactPath = (candidateId: CandidateId, suffix: string): string =>
  `${artifactDirectory}/${candidateId}-${suffix}`;
const sha256 = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");

const writeArtifact = async (
  root: string,
  path: string,
  bytes: Uint8Array,
): Promise<{ path: string; sha256: string }> => {
  await mkdir(dirname(resolve(root, path)), { recursive: true });
  await writeFile(resolve(root, path), bytes);
  return { path, sha256: sha256(bytes) };
};

const textBytes = (candidateId: CandidateId): Uint8Array =>
  new TextEncoder().encode(
    `${VISIBLE_PARAGRAPHS[0]}${encodeCarrier(candidateId, "alpha")}\n${VISIBLE_PARAGRAPHS[1]}\n${VISIBLE_PARAGRAPHS[2]}${encodeCarrier(candidateId, "beta")}\n`,
  );

const makeView = () => ({
  zoomPercent: 100 as const,
  visibleBody: "preserved" as const,
  carrierPresentation: "not_visible" as const,
  layoutDisturbance: "none_observed" as const,
  notes: [],
});

const makeCandidate = async (
  root: string,
  candidateId: CandidateId,
): Promise<CandidateRunEvidence> => {
  const sourceBytes = await generateZeroWidthCarrierDocx(ZERO_WIDTH_FIXTURE, candidateId);
  const canonicalArtifact = await writeArtifact(root, sourcePath(candidateId), sourceBytes);
  const canonicalInspection = inspectZeroWidthDocx(sourceBytes, candidateId, "source");
  const googleRoundtrip = await writeArtifact(
    root,
    artifactPath(candidateId, "google-docs-roundtrip.docx"),
    sourceBytes,
  );
  const wordRoundtrip = await writeArtifact(
    root,
    artifactPath(candidateId, "microsoft-word-roundtrip.docx"),
    sourceBytes,
  );
  const googleText = textBytes(candidateId);
  const wordText = textBytes(candidateId);
  const googleCopy = await writeArtifact(
    root,
    artifactPath(candidateId, "google-docs-copy-plain-text.txt"),
    googleText,
  );
  const wordCopy = await writeArtifact(
    root,
    artifactPath(candidateId, "microsoft-word-copy-plain-text.txt"),
    wordText,
  );
  const googleInspection = inspectZeroWidthDocx(sourceBytes, candidateId, "transformed");
  const wordInspection = inspectZeroWidthDocx(sourceBytes, candidateId, "transformed");
  const googleTextInspection = inspectZeroWidthText(googleText, candidateId);
  const wordTextInspection = inspectZeroWidthText(wordText, candidateId);
  const definition = ZERO_WIDTH_CANDIDATES.find(({ id }) => id === candidateId);
  if (!definition) throw new Error("Unknown test candidate");
  const candidate = {
    candidateId,
    documentProfile: definition.documentProfile,
    selectable: definition.selectable,
    priority: definition.priority,
    canonicalArtifact: { ...canonicalArtifact, inspection: canonicalInspection },
    googleDocs: {
      application: { name: "Google Docs" as const, version: null },
      browser: { name: "Google Chrome" as const, version: null },
      platform: { name: "macOS", version: "26.2", build: "25C56" },
      documentRule: "one new unshared document" as const,
      sourceArtifactSha256: canonicalArtifact.sha256,
      paginatedWhiteView: makeView(),
      darkView: "not_assessable" as const,
      docxRoundtrip: {
        status: "completed" as const,
        sourceArtifactSha256: canonicalArtifact.sha256,
        resultArtifact: googleRoundtrip,
        inspection: googleInspection,
        protocolDeviation: null,
        distributionLimitations: [],
        notes: [],
      },
      plainTextCopy: {
        status: "completed" as const,
        sourceArtifactSha256: canonicalArtifact.sha256,
        resultArtifact: googleCopy,
        inspection: googleTextInspection,
        protocolDeviation: null,
        notes: [],
      },
      selectionObservation: "carrier_or_placeholder_revealed" as const,
      screenReader: "not_assessable" as const,
      limitations: [...GOOGLE_LIMITATIONS],
    },
    microsoftWord: {
      application: { name: "Microsoft Word" as const, version: null },
      platform: { name: "macOS", version: "26.2", build: "25C56" },
      documentRule: "open canonical source independently" as const,
      sourceArtifactSha256: canonicalArtifact.sha256,
      lightPrintLayout: makeView(),
      darkPageCanvas: makeView(),
      docxRoundtrip: {
        status: "completed" as const,
        sourceArtifactSha256: canonicalArtifact.sha256,
        resultArtifact: wordRoundtrip,
        inspection: wordInspection,
        protocolDeviation: null,
        distributionLimitations: [],
        notes: [],
      },
      plainTextCopy: {
        status: "completed" as const,
        sourceArtifactSha256: canonicalArtifact.sha256,
        resultArtifact: wordCopy,
        inspection: wordTextInspection,
        protocolDeviation: null,
        notes: [],
      },
      selectionObservation: "nothing_observed" as const,
      accessibilityAssistant: { status: "completed" as const, findings: [], limitations: [] },
      screenReader: "not_assessable" as const,
      limitations: [...WORD_LIMITATIONS],
    },
    transportCriteriaSatisfied: true,
    selectableCandidatePasses: definition.selectable,
    limitations: [...TRANSPORT_LIMITATIONS],
  } satisfies CandidateRunEvidence;
  if (!criteriaSatisfied(candidate)) throw new Error(`Invalid test candidate ${candidateId}`);
  return candidate;
};

const makeRecord = async (root: string): Promise<ZeroWidthBakeOffRunRecord> => {
  const candidates = await Promise.all(
    ZERO_WIDTH_CANDIDATES.map(({ id }) => makeCandidate(root, id)),
  );
  return {
    experimentId: "glyph-exp-docx-zero-width-carrier-bakeoff-v1-001",
    experimentSchemaVersion: 1,
    date: "2026-09-03",
    bakeOffProfile: "docx-zero-width-carrier-bakeoff-v1",
    fingerprintStrategy: null,
    fingerprintStrategyVersion: null,
    matchingProfile: null,
    fixedFrames: {
      alphaHex: "475a01a108474c5950484130317d62",
      betaHex: "475a01b208474c595048423031016b",
      crcProfile: "CRC-16/CCITT-FALSE",
    },
    visibleFixture: {
      id: "synthetic-library-hours-v1",
      sourcePath: "research/experiments/docx-hidden-run-v1/fixture.ts",
    },
    sourceGenerator: {
      path: "src/documents/docx/docx-zero-width-carrier-bakeoff-v1.ts",
      gitCommit: "3ffffdf5deb38cbd51a600b9e3a2c19c16040718",
      nodeVersion: "v26.3.0",
      pnpmVersion: "11.19.0",
      docxVersion: "9.7.1",
    },
    candidates: candidates as [CandidateRunEvidence, CandidateRunEvidence, CandidateRunEvidence],
    gateDecision: "SELECT_A",
    gateRationale: ["candidate-a-transport-pass"],
    limitations: [...TRANSPORT_LIMITATIONS],
  };
};

type Mutable<T> = {
  -readonly [Key in keyof T]: T[Key] extends readonly [
    infer First,
    infer Second,
    infer Third,
  ]
    ? [Mutable<First>, Mutable<Second>, Mutable<Third>]
    : T[Key] extends readonly (infer Entry)[]
      ? readonly Mutable<Entry>[]
      : T[Key] extends object
        ? Mutable<T[Key]>
        : T[Key];
};

const cloneRecord = (
  record: ZeroWidthBakeOffRunRecord,
): Mutable<ZeroWidthBakeOffRunRecord> & { extra?: boolean } =>
  structuredClone(record) as unknown as Mutable<ZeroWidthBakeOffRunRecord> & { extra?: boolean };

const rationaleFor = {
  SELECT_A: "candidate-a-transport-pass",
  SELECT_B: "candidate-b-transport-pass",
  REVISE_ZERO_WIDTH_CARRIER: "bounded-transport-evidence-without-selectable-pass",
  ABANDON_ZERO_WIDTH_CARRIER: "no-bounded-transport-evidence",
} as const;

const configureNonAbandonGate = (
  record: Mutable<ZeroWidthBakeOffRunRecord>,
  decision: "SELECT_A" | "SELECT_B" | "REVISE_ZERO_WIDTH_CARRIER",
): void => {
  if (decision !== "SELECT_A") {
    record.candidates[0].googleDocs.paginatedWhiteView.visibleBody = "changed";
    record.candidates[0].transportCriteriaSatisfied = false;
    record.candidates[0].selectableCandidatePasses = false;
  }
  if (decision === "REVISE_ZERO_WIDTH_CARRIER") {
    record.candidates[1].googleDocs.paginatedWhiteView.visibleBody = "changed";
    record.candidates[1].transportCriteriaSatisfied = false;
    record.candidates[1].selectableCandidatePasses = false;
  }
  record.gateDecision = decision;
  record.gateRationale = [rationaleFor[decision]];
};

const removeAllTransformedCarriers = async (
  root: string,
  record: Mutable<ZeroWidthBakeOffRunRecord>,
): Promise<void> => {
  const plainBody = new TextEncoder().encode(`${VISIBLE_PARAGRAPHS.join("\n")}\n`);
  for (const candidate of record.candidates) {
    for (const evidence of [
      candidate.googleDocs.docxRoundtrip,
      candidate.microsoftWord.docxRoundtrip,
    ]) {
      const path = resolve(root, evidence.resultArtifact.path);
      const source = await readFile(path);
      const entries = unzipSync(source);
      const document = entries["word/document.xml"];
      if (!document) throw new Error("Missing test document");
      const stripped = ["alpha", "beta"].reduce(
        (xml, markerId) =>
          xml.split(encodeCarrier(candidate.candidateId, markerId as "alpha" | "beta")).join(""),
        strFromU8(document),
      );
      entries["word/document.xml"] = strToU8(stripped);
      const bytes = zipSync(entries, {
        level: 6,
        mtime: new Date("1980-01-01T00:00:00Z"),
      });
      await writeFile(path, bytes);
      evidence.resultArtifact.sha256 = sha256(bytes);
      evidence.inspection = inspectZeroWidthDocx(
        bytes,
        candidate.candidateId,
        "transformed",
      ) as never;
    }
    for (const evidence of [
      candidate.googleDocs.plainTextCopy,
      candidate.microsoftWord.plainTextCopy,
    ]) {
      await writeFile(resolve(root, evidence.resultArtifact.path), plainBody);
      evidence.resultArtifact.sha256 = sha256(plainBody);
      evidence.inspection = inspectZeroWidthText(
        plainBody,
        candidate.candidateId,
      ) as never;
    }
    candidate.transportCriteriaSatisfied = false;
    candidate.selectableCandidatePasses = false;
  }
  record.gateDecision = "ABANDON_ZERO_WIDTH_CARRIER";
  record.gateRationale = [rationaleFor.ABANDON_ZERO_WIDTH_CARRIER];
};

type PathPart = string | number;
type ObjectNode = Readonly<{ path: readonly PathPart[]; keys: readonly string[] }>;

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const objectNodes = (root: unknown): ObjectNode[] => {
  const nodes: ObjectNode[] = [];
  const visit = (value: unknown, path: PathPart[]): void => {
    if (Array.isArray(value)) {
      value.forEach((entry, index) => visit(entry, [...path, index]));
      return;
    }
    if (!isObject(value)) return;
    const keys = Object.keys(value);
    nodes.push({ path, keys });
    keys.forEach((key) => visit(value[key], [...path, key]));
  };
  visit(root, []);
  return nodes;
};

const leafPaths = (
  root: unknown,
  predicate: (value: unknown) => boolean,
): PathPart[][] => {
  const paths: PathPart[][] = [];
  const visit = (value: unknown, path: PathPart[]): void => {
    if (predicate(value)) paths.push(path);
    if (Array.isArray(value)) {
      value.forEach((entry, index) => visit(entry, [...path, index]));
    } else if (isObject(value)) {
      Object.entries(value).forEach(([key, entry]) => visit(entry, [...path, key]));
    }
  };
  visit(root, []);
  return paths;
};

const valueAtPath = (root: unknown, path: readonly PathPart[]): unknown => {
  let value = root;
  for (const part of path) {
    if (Array.isArray(value)) value = value[part as number];
    else if (isObject(value)) value = value[String(part)];
    else throw new Error(`Invalid test path: ${path.join(".")}`);
  }
  return value;
};

const setAtPath = (
  root: unknown,
  path: readonly PathPart[],
  replacement: unknown,
): void => {
  if (path.length === 0) throw new Error("Cannot replace test root");
  const parent = valueAtPath(root, path.slice(0, -1));
  const part = path.at(-1)!;
  if (Array.isArray(parent)) parent[part as number] = replacement;
  else if (isObject(parent)) parent[String(part)] = replacement;
  else throw new Error(`Invalid test path: ${path.join(".")}`);
};

describe("zero-width carrier run records", () => {
  test("validates exact artifacts, inspections, linkage, and Candidate C non-selectability", async () => {
    const root = await mkdtemp(join(tmpdir(), "glyph-zero-width-record-"));
    try {
      const record = await makeRecord(root);
      await expect(validateZeroWidthCarrierRun(record, root)).resolves.toMatchObject({
        gateDecision: "SELECT_A",
        candidates: [
          { selectableCandidatePasses: true },
          { selectableCandidatePasses: true },
          { selectable: false, priority: 3, selectableCandidatePasses: false },
        ],
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  test("rejects an extra or missing key at every nested object", async () => {
    const root = await mkdtemp(join(tmpdir(), "glyph-zero-width-record-"));
    try {
      const record = await makeRecord(root);
      const nodes = objectNodes(record);
      expect(nodes.length).toBeGreaterThan(40);
      for (const node of nodes) {
        for (const key of node.keys) {
          const missing = structuredClone(record) as unknown;
          const object = valueAtPath(missing, node.path);
          if (!isObject(object)) throw new Error("Expected object test node");
          delete object[key];
          expect(() => assertValidZeroWidthCarrierRun(missing)).toThrow(
            /unexpected or missing fields/,
          );

          const extra = structuredClone(record) as unknown;
          const extraObject = valueAtPath(extra, node.path);
          if (!isObject(extraObject)) throw new Error("Expected object test node");
          extraObject.unexpectedField = true;
          expect(() => assertValidZeroWidthCarrierRun(extra)).toThrow(
            /unexpected or missing fields/,
          );
        }
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }, 60_000);

  test("rejects personal and prohibited claim text in every free-text leaf", async () => {
    const root = await mkdtemp(join(tmpdir(), "glyph-zero-width-record-"));
    const sentinel = "PERSONAL NAME; student response; AI ingestion proves authorship";
    try {
      const record = await makeRecord(root);
      const stringPaths = leafPaths(record, (value) => typeof value === "string");
      const nullablePaths = leafPaths(record, (value) => value === null);
      const stringArrayPaths = leafPaths(
        record,
        (value) =>
          Array.isArray(value) &&
          (value.length === 0 || value.every((entry) => typeof entry === "string")),
      );
      expect(stringPaths.length).toBeGreaterThan(50);
      expect(stringArrayPaths.length).toBeGreaterThan(20);
      for (const path of stringPaths) {
        const mutated = structuredClone(record) as unknown;
        setAtPath(mutated, path, sentinel);
        expect(() => assertValidZeroWidthCarrierRun(mutated)).toThrow();
      }
      for (const path of nullablePaths) {
        const mutated = structuredClone(record) as unknown;
        setAtPath(mutated, path, sentinel);
        expect(() => assertValidZeroWidthCarrierRun(mutated)).toThrow();
      }
      for (const path of stringArrayPaths) {
        const mutated = structuredClone(record) as unknown;
        setAtPath(mutated, path, [sentinel]);
        expect(() => assertValidZeroWidthCarrierRun(mutated)).toThrow();
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }, 60_000);

  test("rejects safe-looking codes in the wrong narrative context", async () => {
    const root = await mkdtemp(join(tmpdir(), "glyph-zero-width-record-"));
    try {
      const record = await makeRecord(root);
      const wrongViewCode = cloneRecord(record);
      wrongViewCode.candidates[0].googleDocs.paginatedWhiteView.notes = [
        "accessibility-assistant-contrast-finding",
      ] as never;
      expect(() => assertValidZeroWidthCarrierRun(wrongViewCode)).toThrow();

      const wrongAccessibilityCode = cloneRecord(record);
      wrongAccessibilityCode.candidates[0].microsoftWord.accessibilityAssistant.findings = [
        "body-preserved",
      ] as never;
      expect(() => assertValidZeroWidthCarrierRun(wrongAccessibilityCode)).toThrow();

      const artifactNarrative = cloneRecord(record);
      artifactNarrative.candidates[0].googleDocs.docxRoundtrip.notes = [
        "body-preserved",
      ] as never;
      expect(() => assertValidZeroWidthCarrierRun(artifactNarrative)).toThrow();

      const personalBuild = cloneRecord(record);
      personalBuild.candidates[0].googleDocs.platform.build = "PersonalName";
      expect(() => assertValidZeroWidthCarrierRun(personalBuild)).toThrow();
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  test.each([
    ["malformed", "not-a-commit"],
    ["nonexistent", "0000000000000000000000000000000000000000"],
    ["different local commit", "7d504ec0380d24418b79d6d0c082879fccc47f58"],
  ] as const)("rejects a %s source-generator checkpoint", async (_label, commit) => {
    const root = await mkdtemp(join(tmpdir(), "glyph-zero-width-record-"));
    try {
      const record = await makeRecord(root);
      const bad = cloneRecord(record);
      bad.sourceGenerator.gitCommit = commit as never;
      expect(() => assertValidZeroWidthCarrierRun(bad)).toThrow(/gitCommit/);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  test.each([
    ["SELECT_A", "SELECT_A"],
    ["SELECT_B", "SELECT_B"],
    ["only diagnostic Candidate C", "REVISE_ZERO_WIDTH_CARRIER"],
    ["no bounded survival", "ABANDON_ZERO_WIDTH_CARRIER"],
  ] as const)("derives the fixed %s gate outcome", async (_label, expected) => {
    const root = await mkdtemp(join(tmpdir(), "glyph-zero-width-record-"));
    try {
      const record = await makeRecord(root);
      const candidates = cloneRecord(record).candidates as unknown as Mutable<CandidateRunEvidence>[];
      if (expected === "SELECT_B") {
        candidates[0] = {
          ...candidates[0],
          googleDocs: {
            ...candidates[0].googleDocs,
            paginatedWhiteView: {
              ...candidates[0].googleDocs.paginatedWhiteView,
              visibleBody: "changed",
            },
          },
        };
      } else if (expected === "REVISE_ZERO_WIDTH_CARRIER") {
        for (const index of [0, 1]) {
          candidates[index] = {
            ...candidates[index],
            googleDocs: {
              ...candidates[index].googleDocs,
              paginatedWhiteView: {
                ...candidates[index].googleDocs.paginatedWhiteView,
                visibleBody: "changed",
              },
            },
          };
        }
      } else if (expected === "ABANDON_ZERO_WIDTH_CARRIER") {
        for (const candidate of candidates) {
          for (const editor of [candidate.googleDocs, candidate.microsoftWord]) {
            editor.docxRoundtrip.inspection = {
              ...editor.docxRoundtrip.inspection,
              markerPresence: { alpha: "absent", beta: "absent" },
            };
            editor.plainTextCopy.inspection = {
              ...editor.plainTextCopy.inspection,
              markerPresence: { alpha: "absent", beta: "absent" },
            };
          }
        }
      }
      expect(deriveZeroWidthGate(candidates)).toBe(expected);
      for (const wrong of [
        "SELECT_A",
        "SELECT_B",
        "REVISE_ZERO_WIDTH_CARRIER",
        "ABANDON_ZERO_WIDTH_CARRIER",
      ] as const) {
        if (wrong !== expected) expect(deriveZeroWidthGate(candidates)).not.toBe(wrong);
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  test.each([
    "SELECT_A",
    "SELECT_B",
    "REVISE_ZERO_WIDTH_CARRIER",
    "ABANDON_ZERO_WIDTH_CARRIER",
  ] as const)("rejects every wrong declared decision for fixed %s evidence", async (expected) => {
    const root = await mkdtemp(join(tmpdir(), "glyph-zero-width-record-"));
    try {
      const record = cloneRecord(await makeRecord(root));
      if (expected === "ABANDON_ZERO_WIDTH_CARRIER") {
        await removeAllTransformedCarriers(root, record);
      } else {
        configureNonAbandonGate(record, expected);
      }
      await expect(validateZeroWidthCarrierRun(record, root)).resolves.toMatchObject({
        gateDecision: expected,
      });
      for (const wrong of [
        "SELECT_A",
        "SELECT_B",
        "REVISE_ZERO_WIDTH_CARRIER",
        "ABANDON_ZERO_WIDTH_CARRIER",
      ] as const) {
        if (wrong === expected) continue;
        const bad = cloneRecord(record);
        bad.gateDecision = wrong;
        bad.gateRationale = [rationaleFor[wrong]];
        await expect(validateZeroWidthCarrierRun(bad, root)).rejects.toThrow(
          /mechanical gate/,
        );
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }, 120_000);

  test.each([
    ["Google Docs white", (candidate: CandidateRunEvidence) => candidate.googleDocs.paginatedWhiteView],
    ["Word light", (candidate: CandidateRunEvidence) => candidate.microsoftWord.lightPrintLayout],
    ["Word dark", (candidate: CandidateRunEvidence) => candidate.microsoftWord.darkPageCanvas],
  ] as const)("treats minor and material %s layout disturbance as a candidate failure", async (_label, viewFor) => {
    for (const disturbance of ["minor", "material"] as const) {
      const root = await mkdtemp(join(tmpdir(), "glyph-zero-width-record-"));
      try {
        const record = await makeRecord(root);
        const bad = cloneRecord(record);
        const candidate = bad.candidates[0];
        const view = viewFor(candidate) as unknown as {
          layoutDisturbance: "none_observed" | "minor" | "material";
        };
        view.layoutDisturbance = disturbance;
        candidate.transportCriteriaSatisfied = false;
        candidate.selectableCandidatePasses = false;
        expect(view.layoutDisturbance).toBe(disturbance);
        expect(candidate.transportCriteriaSatisfied).toBe(false);
        bad.gateDecision = "SELECT_B";
        bad.gateRationale = ["candidate-b-transport-pass"];
        const validated = await validateZeroWidthCarrierRun(bad, root);
        expect(validated.gateDecision).toBe("SELECT_B");
        expect(validated.candidates[0]?.transportCriteriaSatisfied).toBe(false);
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    }
  });

  test("keeps selection and Accessibility Assistant observations non-gating", async () => {
    const root = await mkdtemp(join(tmpdir(), "glyph-zero-width-record-"));
    try {
      const record = await makeRecord(root);
      const observed = cloneRecord(record);
      observed.candidates[0].googleDocs.selectionObservation = "carrier_or_placeholder_revealed";
      observed.candidates[0].microsoftWord.accessibilityAssistant.findings = [
        "accessibility-assistant-contrast-finding",
      ];
      await expect(validateZeroWidthCarrierRun(observed, root)).resolves.toMatchObject({
        gateDecision: "SELECT_A",
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  test("rejects a self-consistent but invalid canonical source before transport gating", async () => {
    const root = await mkdtemp(join(tmpdir(), "glyph-zero-width-record-"));
    try {
      const record = await makeRecord(root);
      const candidate = record.candidates[0];
      const bytes = await readFile(resolve(root, candidate.canonicalArtifact.path));
      const entries = unzipSync(bytes);
      const core = entries["docProps/core.xml"];
      if (!core) throw new Error("Missing test core properties");
      entries["docProps/core.xml"] = strToU8(
        strFromU8(core).replace("Glyph synthetic research fixture", "Private Person Name"),
      );
      const mutated = zipSync(entries, { level: 6, mtime: new Date("1980-01-01T00:00:00Z") });
      await writeFile(resolve(root, candidate.canonicalArtifact.path), mutated);
      const inspection = inspectZeroWidthDocx(mutated, candidate.candidateId, "source");
      const bad = cloneRecord(record);
      bad.candidates[0].canonicalArtifact = {
        ...bad.candidates[0].canonicalArtifact,
        sha256: sha256(mutated),
        inspection,
      };
      for (const editor of [bad.candidates[0].googleDocs, bad.candidates[0].microsoftWord]) {
        editor.sourceArtifactSha256 = sha256(mutated);
        editor.docxRoundtrip.sourceArtifactSha256 = sha256(mutated);
        editor.plainTextCopy.sourceArtifactSha256 = sha256(mutated);
      }
      await expect(validateZeroWidthCarrierRun(bad, root)).rejects.toThrow(
        "exact canonical source contract",
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  test.each([
    ["extra root field", (record: ZeroWidthBakeOffRunRecord) => {
      const bad = cloneRecord(record);
      bad.extra = true;
      return bad;
    }],
    ["artifact hash", (record: ZeroWidthBakeOffRunRecord) => {
      const bad = cloneRecord(record);
      bad.candidates[0].canonicalArtifact.sha256 = "0".repeat(64);
      return bad;
    }],
    ["artifact alias", (record: ZeroWidthBakeOffRunRecord) => {
      const bad = cloneRecord(record);
      bad.candidates[0].canonicalArtifact.path = `${artifactDirectory}/alias.docx`;
      return bad;
    }],
    ["source hash linkage", (record: ZeroWidthBakeOffRunRecord) => {
      const bad = cloneRecord(record);
      bad.candidates[0].googleDocs.sourceArtifactSha256 = "0".repeat(64);
      return bad;
    }],
    ["unsafe URL", (record: ZeroWidthBakeOffRunRecord) => {
      const bad = cloneRecord(record);
      bad.gateRationale = ["https://sentinel.invalid/private-response" as never];
      return bad;
    }],
  ] as const)("rejects %s", async (_label, mutate) => {
    const root = await mkdtemp(join(tmpdir(), "glyph-zero-width-record-"));
    try {
      const record = await makeRecord(root);
      await expect(validateZeroWidthCarrierRun(mutate(record), root)).rejects.toThrow();
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  test("rejects unassessable required views and selections", async () => {
    const root = await mkdtemp(join(tmpdir(), "glyph-zero-width-record-"));
    try {
      const record = await makeRecord(root);
      const badView = cloneRecord(record);
      badView.candidates[0].microsoftWord.darkPageCanvas.visibleBody = "not_assessable";
      await expect(validateZeroWidthCarrierRun(badView, root)).rejects.toThrow();
      const badSelection = cloneRecord(record);
      badSelection.candidates[0].googleDocs.selectionObservation = "not_assessable";
      await expect(validateZeroWidthCarrierRun(badSelection, root)).rejects.toThrow();
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  test("accepts readable negative transformed evidence and derives the next candidate", async () => {
    const root = await mkdtemp(join(tmpdir(), "glyph-zero-width-record-"));
    try {
      const record = await makeRecord(root);
      const negative = cloneRecord(record);
      const evidence = negative.candidates[0].googleDocs.docxRoundtrip;
      const original = await readFile(resolve(root, evidence.resultArtifact.path));
      const entries = unzipSync(original);
      const document = entries["word/document.xml"];
      if (!document) throw new Error("Missing test document");
      const alpha = encodeCarrier(CANDIDATE_A.id, "alpha");
      entries["word/document.xml"] = strToU8(strFromU8(document).replace(alpha, alpha.slice(1)));
      const damaged = zipSync(entries, { level: 6, mtime: new Date("1980-01-01T00:00:00Z") });
      await writeFile(resolve(root, evidence.resultArtifact.path), damaged);
      evidence.resultArtifact = { ...evidence.resultArtifact, sha256: sha256(damaged) };
      evidence.inspection = inspectZeroWidthDocx(damaged, CANDIDATE_A.id, "transformed") as unknown as typeof evidence.inspection;
      negative.candidates[0].transportCriteriaSatisfied = false;
      negative.candidates[0].selectableCandidatePasses = false;
      negative.gateDecision = "SELECT_B";
      negative.gateRationale = ["candidate-b-transport-pass"];
      await expect(validateZeroWidthCarrierRun(negative, root)).resolves.toMatchObject({
        gateDecision: "SELECT_B",
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  test("derives the frozen mechanical gate and keeps selection/accessibility non-gating", async () => {
    const root = await mkdtemp(join(tmpdir(), "glyph-zero-width-record-"));
    try {
      const record = await makeRecord(root);
      const aFail = cloneRecord(record).candidates as unknown as CandidateRunEvidence[];
      aFail[0] = {
        ...aFail[0],
        googleDocs: {
          ...aFail[0].googleDocs,
          paginatedWhiteView: { ...aFail[0].googleDocs.paginatedWhiteView, visibleBody: "changed" },
          selectionObservation: "nothing_observed",
        },
        microsoftWord: {
          ...aFail[0].microsoftWord,
          accessibilityAssistant: { status: "not_assessable", findings: [], limitations: [...ACCESSIBILITY_NOT_ASSESSABLE_LIMITATIONS] },
        },
      };
      expect(deriveZeroWidthGate(aFail)).toBe("SELECT_B");
      const bothFail = aFail.map((candidate) => ({
        ...candidate,
        googleDocs: {
          ...candidate.googleDocs,
          paginatedWhiteView: { ...candidate.googleDocs.paginatedWhiteView, carrierPresentation: "visible_marker_or_codepoint" },
          docxRoundtrip: {
            ...candidate.googleDocs.docxRoundtrip,
            inspection: {
              ...candidate.googleDocs.docxRoundtrip.inspection,
              markerPresence: { alpha: "absent" as const, beta: "absent" as const },
            },
          },
          plainTextCopy: {
            ...candidate.googleDocs.plainTextCopy,
            inspection: {
              ...candidate.googleDocs.plainTextCopy.inspection,
              markerPresence: { alpha: "absent" as const, beta: "absent" as const },
            },
          },
        },
        microsoftWord: {
          ...candidate.microsoftWord,
          docxRoundtrip: {
            ...candidate.microsoftWord.docxRoundtrip,
            inspection: {
              ...candidate.microsoftWord.docxRoundtrip.inspection,
              markerPresence: { alpha: "absent" as const, beta: "absent" as const },
            },
          },
          plainTextCopy: {
            ...candidate.microsoftWord.plainTextCopy,
            inspection: {
              ...candidate.microsoftWord.plainTextCopy.inspection,
              markerPresence: { alpha: "absent" as const, beta: "absent" as const },
            },
          },
        },
      })) as CandidateRunEvidence[];
      expect(deriveZeroWidthGate(bothFail)).toBe("ABANDON_ZERO_WIDTH_CARRIER");
      expect(criteriaSatisfied(aFail[0])).toBe(false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  test("CLI reads the fixed run path and emits only the safe summary", async () => {
    const root = await mkdtemp(join(tmpdir(), "glyph-zero-width-record-"));
    try {
      const record = await makeRecord(root);
      const runPath = resolve(
        root,
        "research/experiments/docx-zero-width-carrier-bakeoff-v1/run-001.json",
      );
      await mkdir(dirname(runPath), { recursive: true });
      await writeFile(runPath, JSON.stringify(record));
      const result = spawnSync(process.execPath, [validatorScript], {
        cwd: root,
        encoding: "utf8",
        env: { ...process.env, GLYPH_REPOSITORY_ROOT: root },
      });
      expect(result.status).toBe(0);
      expect(result.stderr).toBe("");
      expect(JSON.parse(result.stdout)).toEqual({
        status: "valid",
        gateDecision: "SELECT_A",
        selectedDocumentProfile: "docx-zero-width-join-control-v1",
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
