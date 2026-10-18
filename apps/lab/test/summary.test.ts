import { describe, expect, it } from "vitest";
import type { LabRecord } from "../src/contracts.js";
import { summarizeRecords } from "../src/summary.js";
import { manifest } from "./fixtures.js";

type CompletedOverrides = Partial<
  Pick<
    Extract<LabRecord, { status: "completed" }>,
    | "source"
    | "inputClass"
    | "provider"
    | "model"
    | "providerVersion"
    | "assignmentId"
    | "caseId"
    | "variant"
    | "condition"
    | "manualAcknowledgment"
    | "simulated"
  >
>;

const completed = (
  trialId: string,
  detected: [boolean, boolean],
  overrides: CompletedOverrides = {},
): LabRecord => ({
  schemaVersion: 1,
  source: "api",
  trialId,
  caseId: "case-1",
  assignmentId: manifest.assignmentId,
  provider: "openai",
  model: "gpt-test-model",
  providerVersion: "unknown",
  variant: "baseline",
  condition: "both",
  status: "completed",
  simulated: false,
  layers: [
    { carrier: "tag", detected: detected[0] },
    { carrier: "visibleNote", detected: detected[1] },
  ],
  rawTags: { present: false, count: 0 },
  caveat: "Synthetic fixture caveat.",
  ...overrides,
  inputClass: overrides.inputClass ?? "synthetic",
});

const failed = (
  trialId: string,
  overrides: CompletedOverrides = {},
): LabRecord => ({
  schemaVersion: 1,
  source: "api",
  trialId,
  caseId: "case-1",
  assignmentId: manifest.assignmentId,
  provider: "openai",
  model: "gpt-test-model",
  providerVersion: "unknown",
  variant: "baseline",
  condition: "both",
  status: "error",
  simulated: false,
  errorCode: "API_REQUEST_FAILED",
  ...overrides,
  inputClass: overrides.inputClass ?? "synthetic",
});

describe("per-cell summaries", () => {
  it("uses only completed responses in each per-layer denominator", () => {
    const summary = summarizeRecords([
      completed("trial-1", [true, false]),
      completed("trial-2", [false, true]),
      failed("trial-3"),
    ]);

    expect(summary.mode).toBe("OBSERVED");
    expect(summary.cells).toHaveLength(1);
    expect(summary.cells[0]).toMatchObject({ validResponses: 2, technicalErrors: 1 });
    expect(summary.cells[0].layers.tag).toMatchObject({
      hits: 1,
      denominator: 2,
      observedFraction: "1/2",
    });
    expect(summary.cells[0].layers.visibleNote).toMatchObject({
      hits: 1,
      denominator: 2,
      observedFraction: "1/2",
    });
  });

  it("reports zero denominators as N/A and one trial as counts without a rate", () => {
    const noResponses = summarizeRecords([failed("error-1")]).cells[0];
    const singleTrial = summarizeRecords([completed("trial-1", [true, false])]).cells[0];

    expect(noResponses.layers.tag).toMatchObject({ denominator: 0, observedFraction: "N/A" });
    expect(singleTrial.layers.tag).toMatchObject({
      hits: 1,
      denominator: 1,
      observedFraction: null,
    });
    expect(singleTrial.layers.tag.note.toLowerCase()).toContain("single trial");
  });

  it("keeps every required grouping dimension distinct", () => {
    const records = [
      completed("t1", [true, false]),
      completed("t2", [true, false], { source: "web-ui" }),
      completed("t3", [true, false], { provider: "anthropic" }),
      completed("t4", [true, false], { model: "other-model" }),
      completed("t5", [true, false], { providerVersion: "2026-01" }),
      completed("t6", [true, false], { assignmentId: "lesson-43" }),
      completed("t7", [true, false], { caseId: "case-2" }),
      completed("t8", [true, false], { variant: "rewrite" }),
      completed("t9", [true, false], { condition: "unmarked" }),
      completed("t10", [true, false], { manualAcknowledgment: "yes" }),
      completed("t11", [true, false], { inputClass: "consented-research" }),
    ];

    expect(summarizeRecords(records).cells).toHaveLength(records.length);
  });

  it("labels simulated summaries and never reports mock fractions", () => {
    const records = [
      completed("mock-1", [true, false], { source: "mock", simulated: true }),
      completed("mock-2", [false, false], { source: "mock", simulated: true }),
    ];
    const summary = summarizeRecords(records);

    expect(summary.mode).toBe("SIMULATED");
    expect(summary.note).toContain("SIMULATED");
    expect(summary.cells[0].layers.tag.observedFraction).toBeNull();
    expect(summary.cells[0].layers.tag.note.toLowerCase()).toContain("simulated");

    const simulatedErrors = summarizeRecords([
      failed("mock-error", { source: "mock", simulated: true }),
    ]);
    expect(simulatedErrors.cells[0].layers.tag).toMatchObject({
      denominator: 0,
      observedFraction: "N/A",
    });
  });

  it("keeps mock and observed records separate when given mixed sources", () => {
    const summary = summarizeRecords([
      completed("api-1", [true, false]),
      completed("api-2", [true, false]),
      completed("mock-1", [false, false], { source: "mock", simulated: true }),
    ]);

    expect(summary.mode).toBe("MIXED");
    expect(summary.cells).toHaveLength(2);
    expect(summary.cells.find((cell) => cell.source === "mock")?.layers.tag.observedFraction)
      .toBeNull();
    expect(summary.cells.find((cell) => cell.source === "api")?.layers.tag.observedFraction)
      .toBe("2/2");
  });
});
