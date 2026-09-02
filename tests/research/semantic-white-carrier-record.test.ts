import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { describe, expect, test } from "vitest";
import { generateMatchingColorBodyV2 } from "../../src/documents/docx/docx-matching-color-body-v2";
import {
  CANDIDATE_ID,
  DOCUMENT_PROFILE,
  EXPERIMENT_ID,
  EXPERIMENT_SCHEMA_VERSION,
  FIXED_MARKER_ALPHA,
  FIXED_MARKER_BETA,
  QUALIFICATION_FIXTURE,
  QUALIFICATION_PROFILE,
  VISIBLE_FIXTURE_ID,
  VISIBLE_PARAGRAPHS,
} from "../../research/experiments/docx-semantic-white-carrier-qualification-v1/fixture";
import { inspectSemanticWhiteCarrier } from "../../research/experiments/docx-semantic-white-carrier-qualification-v1/inspect-semantic-white-docx";
import {
  assertValidSemanticWhiteCarrierRun,
  validateSemanticWhiteCarrierRun,
  type QualificationRunRecord,
} from "../../scripts/validate-docx-semantic-white-carrier-run";

const artifactDirectory =
  "research/artifacts/docx-semantic-white-carrier-qualification-v1";
const canonicalPath = `${artifactDirectory}/matching-color-body-v2.docx`;
const googleRoundtripPath =
  `${artifactDirectory}/matching-color-body-v2-google-docs-roundtrip.docx`;
const googleCopyPath =
  `${artifactDirectory}/matching-color-body-v2-google-docs-copy-plain-text.txt`;
const wordRoundtripPath =
  `${artifactDirectory}/matching-color-body-v2-microsoft-word-roundtrip.docx`;
const wordCopyPath =
  `${artifactDirectory}/matching-color-body-v2-microsoft-word-copy-plain-text.txt`;
const validatorPath = fileURLToPath(
  new URL("../../scripts/validate-docx-semantic-white-carrier-run.ts", import.meta.url),
);

const safetyClean = {
  externalRelationships: [],
  unresolvedRelationshipTargets: [],
  activeContentEntries: [],
  activeRelationshipTypes: [],
  macroContentTypes: [],
} as const;

const hash = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");

const visibleBodyFrom = (bytes: Uint8Array): string[] => {
  const inspection = inspectSemanticWhiteCarrier(
    bytes,
    QUALIFICATION_FIXTURE.markers,
  );
  return inspection.transformed.paragraphs
    .filter((paragraph) => paragraph.location === "body")
    .map((paragraph) =>
      paragraph.text
        .replaceAll(FIXED_MARKER_ALPHA, "")
        .replaceAll(FIXED_MARKER_BETA, ""),
    );
};

const copyText = (): string =>
  `${FIXED_MARKER_ALPHA}${VISIBLE_PARAGRAPHS[0]}\n${VISIBLE_PARAGRAPHS[1]}\n${VISIBLE_PARAGRAPHS[2]}${FIXED_MARKER_BETA}\n`;

const copyEvidenceFor = (
  bytes: Uint8Array,
  path: string,
  sourceHash: string,
): QualificationRunRecord["googleDocs"]["plainTextCopy"] => {
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  const paragraphs = text.replace(/\r\n?/g, "\n").split("\n");
  if (paragraphs.at(-1) === "") {
    paragraphs.pop();
  }
  const withoutMarkers = paragraphs.map((paragraph) =>
    paragraph
      .replaceAll(FIXED_MARKER_ALPHA, "")
      .replaceAll(FIXED_MARKER_BETA, ""),
  );
  return {
    status: "completed",
    sourceArtifactSha256: sourceHash,
    resultArtifact: { path, sha256: hash(bytes) },
    markerPresence: {
      alpha: text.includes(FIXED_MARKER_ALPHA) ? "present" : "absent",
      beta: text.includes(FIXED_MARKER_BETA) ? "present" : "absent",
    },
    visibleBody: "preserved",
    visibleBodyParagraphs: withoutMarkers,
    protocolDeviation: null,
    notes: ["Synthetic copy observation for validator tests."],
  };
};

const docxEvidenceFor = (
  bytes: Uint8Array,
  path: string,
  sourceHash: string,
): QualificationRunRecord["googleDocs"]["docxRoundtrip"] => {
  const inspection = inspectSemanticWhiteCarrier(
    bytes,
    QUALIFICATION_FIXTURE.markers,
  );
  return {
    status: "completed",
    sourceArtifactSha256: sourceHash,
    resultArtifact: { path, sha256: hash(bytes) },
    markerPresence: inspection.transformed.markerPresence,
    visibleBody: "preserved",
    visibleBodyParagraphs: visibleBodyFrom(bytes),
    markerMechanisms: inspection.markerMechanisms,
    safety: inspection.transformed.safety,
    protocolDeviation: null,
    notes: ["Synthetic DOCX observation for validator tests."],
  };
};

const viewEvidence = (): QualificationRunRecord["googleDocs"]["defaultView"] => ({
  zoomPercent: 100,
  ordinaryVisibility: "not_visible",
  layoutDisturbance: "none_observed",
  visibleBody: "preserved",
  notes: ["Synthetic 100% view observation for validator tests."],
});

type Fixture = {
  root: string;
  source: Uint8Array;
  googleRoundtrip: Uint8Array;
  wordRoundtrip: Uint8Array;
  googleCopy: Uint8Array;
  wordCopy: Uint8Array;
  record: QualificationRunRecord;
};

const writeArtifact = async (
  root: string,
  path: string,
  bytes: Uint8Array,
): Promise<void> => {
  const absolutePath = resolve(root, path);
  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, bytes);
};

const makeFixture = async (): Promise<Fixture> => {
  const root = await mkdtemp(join(tmpdir(), "glyph-semantic-white-record-"));
  const source = await generateMatchingColorBodyV2(QUALIFICATION_FIXTURE);
  const googleRoundtrip = source;
  const wordRoundtrip = source;
  const googleCopy = new TextEncoder().encode(copyText());
  const wordCopy = new TextEncoder().encode(copyText());
  const sourceHash = hash(source);
  const sourceInspection = inspectSemanticWhiteCarrier(
    source,
    QUALIFICATION_FIXTURE.markers,
  );
  const canonicalArtifact = {
    path: canonicalPath,
    sha256: sourceHash,
    markerPresence: sourceInspection.transformed.markerPresence,
    visibleBodyParagraphs: visibleBodyFrom(source),
    markerMechanisms: sourceInspection.markerMechanisms,
    safety: sourceInspection.transformed.safety,
  };
  const googleDocs = {
    application: { name: "Google Docs" as const, version: "desktop-test" },
    browser: { name: "Google Chrome" as const, version: "test" },
    platform: { name: "macOS", version: "26.2", build: "25C56" },
    documentRule: "one new unshared document" as const,
    sourceArtifactSha256: sourceHash,
    defaultView: viewEvidence(),
    darkView: "not_assessable" as const,
    docxRoundtrip: docxEvidenceFor(
      googleRoundtrip,
      googleRoundtripPath,
      sourceHash,
    ),
    plainTextCopy: copyEvidenceFor(googleCopy, googleCopyPath, sourceHash),
    selectionReveal: "not_revealed" as const,
    screenReader: "not_assessable" as const,
    limitations: [
      "Google Docs desktop dark-page and screen-reader behavior are not_assessable in this environment.",
    ],
  };
  const microsoftWord = {
    application: { name: "Microsoft Word" as const, version: "desktop-test" },
    platform: { name: "macOS", version: "26.2", build: "25C56" },
    documentRule: "open canonical source independently" as const,
    sourceArtifactSha256: sourceHash,
    lightView: viewEvidence(),
    darkView: viewEvidence(),
    docxRoundtrip: docxEvidenceFor(
      wordRoundtrip,
      wordRoundtripPath,
      sourceHash,
    ),
    plainTextCopy: copyEvidenceFor(wordCopy, wordCopyPath, sourceHash),
    selectionReveal: "not_revealed" as const,
    accessibilityAssistant: {
      status: "not_assessable" as const,
      findings: [],
      limitations: [
        "Accessibility Assistant was not assessable in the synthetic validator fixture.",
      ],
    },
    screenReader: "not_assessable" as const,
    limitations: [
      "Screen-reader behavior is not_assessable in this environment.",
    ],
  };
  const record = {
    experimentId: EXPERIMENT_ID,
    experimentSchemaVersion: EXPERIMENT_SCHEMA_VERSION,
    date: "2026-09-03",
    qualificationProfile: QUALIFICATION_PROFILE,
    candidateId: CANDIDATE_ID,
    documentProfile: DOCUMENT_PROFILE,
    fingerprintStrategy: null,
    fingerprintStrategyVersion: null,
    matchingProfile: null,
    fixedMarkers: {
      alpha: FIXED_MARKER_ALPHA,
      beta: FIXED_MARKER_BETA,
    },
    visibleFixture: {
      id: VISIBLE_FIXTURE_ID,
      sourcePath: "research/experiments/docx-hidden-run-v1/fixture.ts",
    },
    sourceGenerator: {
      path: "src/documents/docx/docx-matching-color-body-v2.ts" as const,
      gitCommit: "3e0760f6f195bb7e28bab6f7f286c16220f147ea",
      nodeVersion: "v26.3.0",
      pnpmVersion: "11.19.0",
      docxVersion: "9.7.1" as const,
    },
    canonicalArtifact,
    googleDocs,
    microsoftWord,
    gateDecision: "PROCEED" as const,
    gateRationale: [
      "Synthetic fixture satisfies every frozen transport and ordinary-view gate condition.",
    ],
    limitations: [
      "Synthetic validator evidence does not establish editor behavior or accessibility safety.",
    ],
  } satisfies QualificationRunRecord;
  await writeArtifact(root, canonicalPath, source);
  await writeArtifact(root, googleRoundtripPath, googleRoundtrip);
  await writeArtifact(root, googleCopyPath, googleCopy);
  await writeArtifact(root, wordRoundtripPath, wordRoundtrip);
  await writeArtifact(root, wordCopyPath, wordCopy);
  return {
    root,
    source,
    googleRoundtrip,
    wordRoundtrip,
    googleCopy,
    wordCopy,
    record,
  };
};

const setProperty = (
  target: object,
  key: string,
  value: unknown,
): void => {
  Object.assign(target as Record<string, unknown>, { [key]: value });
};

const replaceDocxColor = (bytes: Uint8Array, color: string): Uint8Array => {
  const entries = unzipSync(bytes);
  const document = entries["word/document.xml"];
  if (!document) {
    throw new Error("Missing word/document.xml in test package");
  }
  const original = '<w:color w:val="FFFFFF"/>';
  const xml = strFromU8(document);
  if (!xml.includes(original)) {
    throw new Error("Generated marker color was not found in test package");
  }
  entries["word/document.xml"] = strToU8(
    xml.replaceAll(original, `<w:color w:val="${color}"/>`),
  );
  return zipSync(entries);
};

const removeMarkerRuns = (bytes: Uint8Array): Uint8Array => {
  const entries = unzipSync(bytes);
  const document = entries["word/document.xml"];
  if (!document) {
    throw new Error("Missing word/document.xml in test package");
  }
  const xml = strFromU8(document);
  entries["word/document.xml"] = strToU8(
    xml.replaceAll(
      /<w:r><w:rPr><w:color w:val="FFFFFF"\/><\/w:rPr><w:t[^>]*>[^<]*<\/w:t><\/w:r>/g,
      "",
    ),
  );
  return zipSync(entries);
};

const updateDocxEvidence = (
  record: QualificationRunRecord,
  editor: "googleDocs" | "microsoftWord",
  bytes: Uint8Array,
  path: string,
  visibleBody: QualificationRunRecord["googleDocs"]["docxRoundtrip"]["visibleBody"] = "preserved",
): void => {
  const evidence = docxEvidenceFor(bytes, path, record.canonicalArtifact.sha256);
  setProperty(evidence, "visibleBody", visibleBody);
  setProperty(record[editor], "docxRoundtrip", evidence);
};

const updateCopyEvidence = (
  record: QualificationRunRecord,
  editor: "googleDocs" | "microsoftWord",
  bytes: Uint8Array,
  path: string,
): void => {
  setProperty(
    record[editor],
    "plainTextCopy",
    copyEvidenceFor(bytes, path, record.canonicalArtifact.sha256),
  );
};

const prepareRevisionFixture = async (fixture: Fixture): Promise<void> => {
  setProperty(
    fixture.record.microsoftWord.darkView,
    "ordinaryVisibility",
    "visible",
  );
  setProperty(fixture.record, "gateDecision", "REVISE_CARRIER");
};

const prepareAbandonFixture = async (fixture: Fixture): Promise<void> => {
  const absent = removeMarkerRuns(fixture.source);
  await writeArtifact(fixture.root, googleRoundtripPath, absent);
  await writeArtifact(fixture.root, wordRoundtripPath, absent);
  updateDocxEvidence(
    fixture.record,
    "googleDocs",
    absent,
    googleRoundtripPath,
    "preserved",
  );
  updateDocxEvidence(
    fixture.record,
    "microsoftWord",
    absent,
    wordRoundtripPath,
    "preserved",
  );
  const absentCopy = new TextEncoder().encode(
    `${VISIBLE_PARAGRAPHS.join("\n")}\n`,
  );
  await writeArtifact(fixture.root, googleCopyPath, absentCopy);
  await writeArtifact(fixture.root, wordCopyPath, absentCopy);
  updateCopyEvidence(fixture.record, "googleDocs", absentCopy, googleCopyPath);
  updateCopyEvidence(fixture.record, "microsoftWord", absentCopy, wordCopyPath);
  setProperty(fixture.record, "gateDecision", "ABANDON_CARRIER");
};

type PathPart = string | number;
type ObjectNode = Readonly<{
  path: readonly PathPart[];
  keys: readonly string[];
}>;

const objectNodes = (
  value: unknown,
  path: readonly PathPart[] = [],
): ObjectNode[] => {
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) =>
      objectNodes(entry, [...path, index]),
    );
  }
  if (value === null || typeof value !== "object") {
    return [];
  }
  const object = value as Record<string, unknown>;
  return [
    { path, keys: Object.keys(object) },
    ...Object.entries(object).flatMap(([key, entry]) =>
      objectNodes(entry, [...path, key]),
    ),
  ];
};

const objectAtPath = (
  root: unknown,
  path: readonly PathPart[],
): Record<string, unknown> => {
  let current: unknown = root;
  for (const part of path) {
    current =
      typeof part === "number"
        ? (current as unknown[])[part]
        : (current as Record<string, unknown>)[part];
  }
  if (current === null || typeof current !== "object" || Array.isArray(current)) {
    throw new Error(`Expected object at ${path.join(".")}`);
  }
  return current as Record<string, unknown>;
};

const expectInvalid = async (
  mutate: (fixture: Fixture) => void | Promise<void>,
): Promise<void> => {
  const fixture = await makeFixture();
  try {
    await mutate(fixture);
    await expect(
      validateSemanticWhiteCarrierRun(fixture.record, fixture.root),
    ).rejects.toThrow();
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
};

describe("semantic-white carrier run-record validator", () => {
  test("accepts the exact frozen schema and matching temporary artifacts", async () => {
    const fixture = await makeFixture();
    try {
      await expect(
        validateSemanticWhiteCarrierRun(fixture.record, fixture.root),
      ).resolves.toEqual(fixture.record);
    } finally {
      await rm(fixture.root, { recursive: true, force: true });
    }
  });

  test.each([
    ["a missing top-level field", (record: QualificationRunRecord) => {
      setProperty(record, "limitations", undefined);
    }],
    ["an extra top-level field", (record: QualificationRunRecord) => {
      setProperty(record, "unexpected", true);
    }],
    ["an extra nested field", (record: QualificationRunRecord) => {
      setProperty(record.googleDocs.application, "accountId", "synthetic");
    }],
    ["a wrong experiment identity", (record: QualificationRunRecord) => {
      setProperty(record, "experimentId", "other-experiment");
    }],
    ["a wrong fixture identity", (record: QualificationRunRecord) => {
      setProperty(record.visibleFixture, "id", "other-fixture");
    }],
    ["a wrong source-generator identity", (record: QualificationRunRecord) => {
      setProperty(record.sourceGenerator, "path", "other-generator.ts");
    }],
    ["an invalid date", (record: QualificationRunRecord) => {
      setProperty(record, "date", "2026-09");
    }],
    ["an invalid gate enum", (record: QualificationRunRecord) => {
      setProperty(record, "gateDecision", "BLOCKED");
    }],
    ["a forbidden account field", (record: QualificationRunRecord) => {
      setProperty(record, "accountId", "synthetic-account");
    }],
  ])("rejects %s", async (_description, mutate) => {
    await expectInvalid(({ record }) => mutate(record));
  });

  test.each([
    ["an uppercase hash", (fixture: Fixture) => {
      setProperty(
        fixture.record.canonicalArtifact,
        "sha256",
        fixture.record.canonicalArtifact.sha256.toUpperCase(),
      );
    }],
    ["a source hash mismatch", (fixture: Fixture) => {
      setProperty(fixture.record.googleDocs, "sourceArtifactSha256", "0".repeat(64));
    }],
    ["a tampered canonical artifact", async (fixture: Fixture) => {
      await writeFile(
        resolve(fixture.root, canonicalPath),
        "tampered canonical artifact",
      );
    }],
    ["a missing Word DOCX artifact", async (fixture: Fixture) => {
      await unlink(resolve(fixture.root, wordRoundtripPath));
    }],
    ["a missing Google clipboard artifact", async (fixture: Fixture) => {
      await unlink(resolve(fixture.root, googleCopyPath));
    }],
    ["a symlinked artifact", async (fixture: Fixture) => {
      const source = resolve(fixture.root, canonicalPath);
      const outside = join(fixture.root, "outside.docx");
      await writeFile(outside, await readFile(source));
      await unlink(source);
      await symlink(outside, source);
    }],
  ])("rejects %s", async (_description, mutate) => {
    await expectInvalid(mutate);
  });

  test.each([
    ["an invalid view enum", (record: QualificationRunRecord) => {
      setProperty(record.googleDocs.defaultView, "ordinaryVisibility", "visible-ish");
    }],
    ["a non-100% view", (record: QualificationRunRecord) => {
      setProperty(record.microsoftWord.darkView, "zoomPercent", 125);
    }],
    ["a missing Google dark limitation", (record: QualificationRunRecord) => {
      setProperty(record.googleDocs, "darkView", "visible");
    }],
    ["a wrong Google screen-reader value", (record: QualificationRunRecord) => {
      setProperty(record.googleDocs, "screenReader", "not_run");
    }],
    ["a wrong Word application", (record: QualificationRunRecord) => {
      setProperty(record.microsoftWord.application, "name", "Google Docs");
    }],
    ["a non-assessable Word light view", (record: QualificationRunRecord) => {
      setProperty(record.microsoftWord.lightView, "ordinaryVisibility", "not_assessable");
    }],
    ["a non-assessable Google default view", (record: QualificationRunRecord) => {
      setProperty(record.googleDocs.defaultView, "visibleBody", "not_assessable");
    }],
    ["an assessable Google dark view", (record: QualificationRunRecord) => {
      setProperty(record.googleDocs, "darkView", "not_visible");
    }],
  ])("rejects %s", async (_description, mutate) => {
    await expectInvalid(({ record }) => mutate(record));
  });

  test.each([
    ["a lowercase semantic-white round trip", async (fixture: Fixture) => {
      const lowercase = replaceDocxColor(fixture.source, "ffffff");
      await writeArtifact(fixture.root, googleRoundtripPath, lowercase);
      await writeArtifact(fixture.root, wordRoundtripPath, lowercase);
      updateDocxEvidence(fixture.record, "googleDocs", lowercase, googleRoundtripPath);
      updateDocxEvidence(fixture.record, "microsoftWord", lowercase, wordRoundtripPath);
    }, "PROCEED"],
    ["a visible Word dark marker", prepareRevisionFixture, "REVISE_CARRIER"],
    ["Google clipboard marker loss", async (fixture: Fixture) => {
      const bytes = new TextEncoder().encode(
        `${VISIBLE_PARAGRAPHS.join("\n")}\n`,
      );
      await writeArtifact(fixture.root, googleCopyPath, bytes);
      updateCopyEvidence(fixture.record, "googleDocs", bytes, googleCopyPath);
      setProperty(fixture.record, "gateDecision", "REVISE_CARRIER");
    }, "REVISE_CARRIER"],
    ["no bounded survival", prepareAbandonFixture, "ABANDON_CARRIER"],
  ])("derives the frozen gate for %s", async (_description, mutate, expected) => {
    const fixture = await makeFixture();
    try {
      await mutate(fixture);
      await expect(
        validateSemanticWhiteCarrierRun(fixture.record, fixture.root),
      ).resolves.toMatchObject({ gateDecision: expected });
    } finally {
      await rm(fixture.root, { recursive: true, force: true });
    }
  });

  test.each(["changed", "lost"] as const)(
    "rejects exact artifact evidence mislabeled as %s",
    async (visibleBody) => {
      await expectInvalid(({ record }) => {
        for (const editor of ["googleDocs", "microsoftWord"] as const) {
          setProperty(record[editor].docxRoundtrip, "visibleBody", visibleBody);
          setProperty(record[editor].plainTextCopy, "visibleBody", visibleBody);
        }
        setProperty(record, "gateDecision", "ABANDON_CARRIER");
      });
    },
  );

  test.each(["googleDocs", "microsoftWord"] as const)(
    "rejects %s selection when it is not assessable",
    async (editor) => {
      await expectInvalid(({ record }) => {
        setProperty(record[editor], "selectionReveal", "not_assessable");
      });
    },
  );

  test.each([
    ["with a terminal newline", copyText()],
    ["without a terminal newline", copyText().replace(/\n$/, "")],
  ] as const)("accepts clipboard UTF-8 %s", async (_description, text) => {
    const fixture = await makeFixture();
    try {
      const bytes = new TextEncoder().encode(text);
      await writeArtifact(fixture.root, googleCopyPath, bytes);
      await writeArtifact(fixture.root, wordCopyPath, bytes);
      updateCopyEvidence(fixture.record, "googleDocs", bytes, googleCopyPath);
      updateCopyEvidence(fixture.record, "microsoftWord", bytes, wordCopyPath);
      await expect(
        validateSemanticWhiteCarrierRun(fixture.record, fixture.root),
      ).resolves.toMatchObject({ gateDecision: "PROCEED" });
    } finally {
      await rm(fixture.root, { recursive: true, force: true });
    }
  });

  test.each(["REVISE_CARRIER", "ABANDON_CARRIER"] as const)(
    "rejects %s when the fixed PROCEED evidence declares the wrong decision",
    async (wrongDecision) => {
      await expectInvalid(({ record }) => {
        setProperty(record, "gateDecision", wrongDecision);
      });
    },
  );

  test.each(["PROCEED", "ABANDON_CARRIER"] as const)(
    "rejects %s when the fixed REVISE_CARRIER evidence declares the wrong decision",
    async (wrongDecision) => {
      const fixture = await makeFixture();
      try {
        await prepareRevisionFixture(fixture);
        setProperty(fixture.record, "gateDecision", wrongDecision);
        await expect(
          validateSemanticWhiteCarrierRun(fixture.record, fixture.root),
        ).rejects.toThrow();
      } finally {
        await rm(fixture.root, { recursive: true, force: true });
      }
    },
  );

  test.each(["PROCEED", "REVISE_CARRIER"] as const)(
    "rejects %s when the fixed ABANDON_CARRIER evidence declares the wrong decision",
    async (wrongDecision) => {
      const fixture = await makeFixture();
      try {
        await prepareAbandonFixture(fixture);
        setProperty(fixture.record, "gateDecision", wrongDecision);
        await expect(
          validateSemanticWhiteCarrierRun(fixture.record, fixture.root),
        ).rejects.toThrow();
      } finally {
        await rm(fixture.root, { recursive: true, force: true });
      }
    },
  );

  test("rejects deleting every record property through exact-shape validation", async () => {
    const fixture = await makeFixture();
    try {
      const nodes = objectNodes(fixture.record);
      const mutationCount = nodes.reduce(
        (count, node) => count + node.keys.length,
        0,
      );
      expect(mutationCount).toBeGreaterThan(40);
      for (const node of nodes) {
        for (const key of node.keys) {
          const mutated = structuredClone(fixture.record) as unknown;
          const object = objectAtPath(mutated, node.path);
          delete object[key];
          expect(() => assertValidSemanticWhiteCarrierRun(mutated)).toThrow(
            /unexpected or missing fields/,
          );
        }
      }
    } finally {
      await rm(fixture.root, { recursive: true, force: true });
    }
  });

  test("rejects adding a benign unexpected key to every nested object", async () => {
    const fixture = await makeFixture();
    try {
      const nodes = objectNodes(fixture.record);
      expect(nodes.some((node) => node.path.includes("markerMechanisms"))).toBe(
        true,
      );
      for (const node of nodes) {
        const mutated = structuredClone(fixture.record) as unknown;
        const object = objectAtPath(mutated, node.path);
        Object.assign(object, { unexpectedField: true });
        expect(() => assertValidSemanticWhiteCarrierRun(mutated)).toThrow(
          /unexpected or missing fields/,
        );
      }
    } finally {
      await rm(fixture.root, { recursive: true, force: true });
    }
  });

  test("selection reveal and Word Accessibility Assistant findings do not change PROCEED", async () => {
    const fixture = await makeFixture();
    try {
      setProperty(fixture.record.googleDocs, "selectionReveal", "revealed");
      setProperty(fixture.record.microsoftWord, "selectionReveal", "revealed");
      setProperty(fixture.record.microsoftWord.accessibilityAssistant, "status", "completed");
      setProperty(fixture.record.microsoftWord.accessibilityAssistant, "findings", [
        "The synthetic document contains a contrast-related finding.",
      ]);
      setProperty(fixture.record.microsoftWord.accessibilityAssistant, "limitations", []);
      await expect(
        validateSemanticWhiteCarrierRun(fixture.record, fixture.root),
      ).resolves.toMatchObject({ gateDecision: "PROCEED" });
    } finally {
      await rm(fixture.root, { recursive: true, force: true });
    }
  });

  test.each([
    ["a missing Word round-trip result", (record: QualificationRunRecord) => {
      setProperty(record.microsoftWord.docxRoundtrip, "resultArtifact", null);
    }],
    ["a missing clipboard result", (record: QualificationRunRecord) => {
      setProperty(record.googleDocs.plainTextCopy, "resultArtifact", null);
    }],
    ["an uninspectable marker mechanism", (record: QualificationRunRecord) => {
      setProperty(record.googleDocs.docxRoundtrip.markerMechanisms[0]!, "semanticDirectWhite", null);
    }],
    ["a mismatched visible body", (record: QualificationRunRecord) => {
      setProperty(record.microsoftWord.docxRoundtrip, "visibleBodyParagraphs", ["not the fixture"]);
    }],
    ["a mismatched safety summary", (record: QualificationRunRecord) => {
      setProperty(record.googleDocs.docxRoundtrip, "safety", {
        ...safetyClean,
        activeContentEntries: ["word/vbaProject.bin"],
      });
    }],
  ])("rejects operationally untrustworthy evidence: %s", async (_description, mutate) => {
    await expectInvalid(({ record }) => mutate(record));
  });

  test("CLI validates only the temporary run record and emits a safe summary", async () => {
    const fixture = await makeFixture();
    try {
      const runPath = join(
        fixture.root,
        "research/experiments/docx-semantic-white-carrier-qualification-v1/run-001.json",
      );
      await mkdir(dirname(runPath), { recursive: true });
      await writeFile(runPath, JSON.stringify(fixture.record));
      const result = spawnSync(process.execPath, [validatorPath], {
        cwd: fixture.root,
        encoding: "utf8",
        env: { ...process.env },
      });
      expect(result.status).toBe(0);
      expect(JSON.parse(result.stdout.trim())).toEqual({
        status: "valid",
        gateDecision: "PROCEED",
        documentProfile: DOCUMENT_PROFILE,
      });
    } finally {
      await rm(fixture.root, { recursive: true, force: true });
    }
  });

  test("does not create a real run record or canonical artifact", async () => {
    expect(
      await readFile(
        resolve(
          fileURLToPath(new URL("../../", import.meta.url)),
          "research/experiments/docx-semantic-white-carrier-qualification-v1/run-001.json",
        ),
      ).catch(() => null),
    ).toBeNull();
  });
});
