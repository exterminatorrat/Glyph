import { describe, expect, it } from "vitest";
import { importManualCsv, parseRunMatrix } from "../src/inputs.js";
import { LabError } from "../src/errors.js";
import {
  bothCanaries,
  csvRow,
  manifestSet,
  matrixInput,
  requiredCsvHeader,
} from "./fixtures.js";

const expectCode = (run: () => unknown, code: string): void => {
  try {
    run();
  } catch (error) {
    expect(error).toBeInstanceOf(LabError);
    expect((error as LabError).code).toBe(code);
    return;
  }
  throw new Error(`Expected ${code}`);
};

describe("manual CSV import", () => {
  it("parses BOM, quoted commas, escaped quotes, multiline answers, and CRLF", () => {
    const response = `Quoted, "synthetic" answer\r\n${bothCanaries}`;
    const csv = `\uFEFF${requiredCsvHeader},providerVersion,observedAt,manualAcknowledgment\r\n${csvRow(
      "trial-1",
      response,
    )},unknown,2026-10-18T10:00:00Z,yes\r\n`;

    const [record] = importManualCsv(csv, manifestSet, "synthetic");

    expect(record).toMatchObject({
      source: "web-ui",
      trialId: "trial-1",
      caseId: "case-1",
      assignmentId: "lesson-42",
      provider: "chatgpt",
      model: "unknown",
      providerVersion: "unknown",
      variant: "baseline",
      condition: "both",
      observedAt: "2026-10-18T10:00:00Z",
      manualAcknowledgment: "yes",
      status: "completed",
      layers: [
        { carrier: "tag", detected: true },
        { carrier: "visibleNote", detected: true },
      ],
    });
    expect(JSON.stringify(record)).not.toContain(response);
    expect(JSON.stringify(record)).not.toContain(manifestSet[0].layers[0].canary);
  });

  it("accepts a present empty response and omits unsupplied optional metadata", () => {
    const [record] = importManualCsv(
      `${requiredCsvHeader}\n${csvRow("trial-1", "")}`,
      manifestSet,
      "consented-research",
    );

    expect(record).toMatchObject({
      status: "completed",
      providerVersion: "unknown",
      layers: [
        { carrier: "tag", detected: false },
        { carrier: "visibleNote", detected: false },
      ],
    });
    expect(record).not.toHaveProperty("observedAt");
    expect(record).not.toHaveProperty("manualAcknowledgment");
  });

  it("rejects malformed CSV without including its answer text in the error", () => {
    const secret = "CSV_RESPONSE_SENTINEL";
    const malformed = `${requiredCsvHeader}\ntrial-1,case-1,lesson-42,chatgpt,unknown,baseline,both,"${secret}`;

    expectCode(() => importManualCsv(malformed, manifestSet, "synthetic"), "INVALID_CSV");
    try {
      importManualCsv(malformed, manifestSet, "synthetic");
      throw new Error("Expected invalid CSV");
    } catch (error) {
      expect((error as Error).message).not.toContain(secret);
    }
  });

  it("rejects missing columns, malformed field counts, and duplicate trial IDs", () => {
    expectCode(
      () => importManualCsv("trialId,caseId\ntrial-1,case-1", manifestSet, "synthetic"),
      "INVALID_CSV",
    );
    expectCode(
      () => importManualCsv(`${requiredCsvHeader}\ntrial-1,case-1`, manifestSet, "synthetic"),
      "INVALID_CSV",
    );
    expectCode(
      () =>
        importManualCsv(
          `${requiredCsvHeader},trialId\n${csvRow("trial-1", "answer")},trial-1`,
          manifestSet,
          "synthetic",
        ),
      "INVALID_CSV",
    );
    expectCode(
      () =>
        importManualCsv(
          `${requiredCsvHeader}\n${csvRow("same-trial", "answer")}\n${csvRow("same-trial", "answer")}`,
          manifestSet,
          "synthetic",
        ),
      "DUPLICATE_TRIAL_ID",
    );
    expect(
      importManualCsv(
        `${requiredCsvHeader}\n${csvRow("trial-1", "answer")}\n${csvRow("trial-2", "answer")}`,
        manifestSet,
        "synthetic",
      ),
    ).toHaveLength(2);
  });

  it("rejects invalid manifests and unrecognized metadata safely", () => {
    expectCode(
      () => importManualCsv(`${requiredCsvHeader}\n${csvRow("trial-1", "")}`, [], "synthetic"),
      "INVALID_MANIFEST",
    );
    const badMetadata = `${requiredCsvHeader}\n${csvRow("trial-1", "")}`.replace(
      "baseline",
      "PRIVATE RESPONSE SENTINEL",
    );
    expectCode(
      () => importManualCsv(badMetadata, manifestSet, "synthetic"),
      "INVALID_CSV",
    );
    expectCode(
      () => importManualCsv(`${requiredCsvHeader}\n${csvRow("trial-1", "")}`, manifestSet, "student-work" as never),
      "INVALID_INPUT_CLASS",
    );
  });
});

describe("run matrix validation", () => {
  it("accepts a prepared prompt matrix and explicit mock outcome", () => {
    const matrix = parseRunMatrix({
      ...matrixInput,
      models: [{ ...matrixInput.models[0], mockOutcome: "tag-only" }],
    });

    expect(matrix.cases[0].prompt).toBe("SYNTHETIC_PROMPT_SENTINEL");
    expect(matrix.models[0].mockOutcome).toBe("tag-only");
  });

  it("rejects unknown fields such as URL and key overrides without echoing them", () => {
    const input = {
      ...matrixInput,
      endpoint: "URL_SENTINEL",
      apiKey: "KEY_SENTINEL",
    };

    expectCode(() => parseRunMatrix(input), "INVALID_MATRIX");
  });

  it("bounds prompt size by UTF-8 bytes", () => {
    expectCode(
      () =>
        parseRunMatrix({
          ...matrixInput,
          cases: [{ ...matrixInput.cases[0], prompt: "🧪".repeat(25_001) }],
        }),
      "INVALID_MATRIX",
    );
  });

  it("rejects duplicate case IDs, duplicate models, missing manifests, and overlarge trial counts", () => {
    expectCode(
      () => parseRunMatrix({ ...matrixInput, cases: [...matrixInput.cases, ...matrixInput.cases] }),
      "INVALID_MATRIX",
    );
    expectCode(
      () => parseRunMatrix({ ...matrixInput, models: [...matrixInput.models, ...matrixInput.models] }),
      "INVALID_MATRIX",
    );
    expectCode(
      () =>
        parseRunMatrix({
          ...matrixInput,
          cases: [{ ...matrixInput.cases[0], assignmentId: "missing-assignment" }],
        }),
      "INVALID_MANIFEST",
    );
    expectCode(
      () =>
        parseRunMatrix({
          ...matrixInput,
          models: [{ ...matrixInput.models[0], repeats: 100 }],
          cases: Array.from({ length: 11 }, (_, index) => ({
            ...matrixInput.cases[0],
            caseId: `case-${index}`,
          })),
        }),
      "INVALID_MATRIX",
    );
  });
});
