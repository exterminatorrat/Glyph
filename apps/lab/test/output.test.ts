import fs from "node:fs";
import { mkdir, mkdtemp, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { syncBuiltinESMExports } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { importManualCsv } from "../src/inputs.js";
import { reserveOutputDirectory, writeOutputFiles } from "../src/output.js";
import { summarizeRecords } from "../src/summary.js";
import { bothCanaries, csvRow, manifestSet, requiredCsvHeader } from "./fixtures.js";

const tempDirectories: string[] = [];

const makeTempDirectory = async (): Promise<string> => {
  const path = await mkdtemp(join(tmpdir(), "glyph-lab-output-test-"));
  tempDirectories.push(path);
  return path;
};

afterEach(async () => {
  await Promise.all(tempDirectories.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("safe output files", () => {
  it("writes sanitized JSONL and summary files only in a newly reserved directory", async () => {
    const parent = await makeTempDirectory();
    const output = join(parent, "results");
    const records = importManualCsv(
      `${requiredCsvHeader}\n${csvRow("trial-1", `RAW_RESPONSE_SENTINEL ${bothCanaries}`)}`,
      manifestSet,
      "synthetic",
    );
    const summary = summarizeRecords(records);

    await reserveOutputDirectory(output);
    await writeOutputFiles(output, records, summary);

    const resultText = await readFile(join(output, "results.jsonl"), "utf8");
    const summaryText = await readFile(join(output, "summary.json"), "utf8");
    expect(JSON.parse(resultText)).toMatchObject({ source: "web-ui", status: "completed" });
    expect(JSON.parse(summaryText)).toMatchObject({ schemaVersion: 1, mode: "OBSERVED" });
    expect(resultText).not.toContain("RAW_RESPONSE_SENTINEL");
    expect(resultText).not.toContain(manifestSet[0].layers[0].canary);
    expect(summaryText).not.toContain("RAW_RESPONSE_SENTINEL");
    expect((await stat(join(output, "results.jsonl"))).mode & 0o777).toBe(0o600);
  });

  it("preserves an existing user output directory and its files", async () => {
    const parent = await makeTempDirectory();
    const output = join(parent, "already-exists");
    await mkdir(output);
    await import("node:fs/promises").then(({ writeFile }) =>
      writeFile(join(output, "keep.txt"), "KEEP_SENTINEL"),
    );

    await expect(reserveOutputDirectory(output)).rejects.toMatchObject({ code: "OUTPUT_EXISTS" });
    expect(await readFile(join(output, "keep.txt"), "utf8")).toBe("KEEP_SENTINEL");
    expect(await import("node:fs/promises").then(({ readdir }) => readdir(output))).toEqual([
      "keep.txt",
    ]);
  });

  it("preserves its partial files after a failed output write", async () => {
    const parent = await makeTempDirectory();
    const output = join(parent, "partial");
    const records = importManualCsv(
      `${requiredCsvHeader}\n${csvRow("trial-1", "safe synthetic response")}`,
      manifestSet,
      "synthetic",
    );
    await reserveOutputDirectory(output);
    await mkdir(join(output, "summary.json"));

    await expect(writeOutputFiles(output, records, summarizeRecords(records)))
      .rejects.toMatchObject({ code: "OUTPUT_FAILED" });
    expect(await import("node:fs/promises").then(({ readdir }) => readdir(output))).toEqual([
      "results.jsonl",
      "summary.json",
    ]);
    expect(JSON.parse(await readFile(join(output, "results.jsonl"), "utf8"))).toMatchObject({
      status: "completed",
    });
  });

  it("preserves replacement paths created by another writer during a failed write", async () => {
    const parent = await makeTempDirectory();
    const output = join(parent, "replaced");
    const records = importManualCsv(
      `${requiredCsvHeader}\n${csvRow("trial-1", "safe synthetic response")}`,
      manifestSet,
      "synthetic",
    );
    await reserveOutputDirectory(output);

    const resultsPath = join(output, "results.jsonl");
    const originalResultsPath = join(output, "original-results.jsonl");
    const summaryPath = join(output, "summary.json");
    const originalOpen = fs.promises.open.bind(fs.promises);
    const openSpy = vi.spyOn(fs.promises, "open").mockImplementation(async (path, flags, mode) => {
      if (path.toString() === summaryPath) {
        await rename(resultsPath, originalResultsPath);
        await writeFile(resultsPath, "FOREIGN_FILE_SENTINEL", { flag: "wx", mode: 0o600 });
        await mkdir(summaryPath);
        await writeFile(join(summaryPath, "foreign.txt"), "FOREIGN_SUMMARY_SENTINEL", {
          flag: "wx",
          mode: 0o600,
        });
      }
      return originalOpen(path, flags, mode);
    });
    syncBuiltinESMExports();

    try {
      await expect(writeOutputFiles(output, records, summarizeRecords(records)))
        .rejects.toMatchObject({ code: "OUTPUT_FAILED" });
    } finally {
      openSpy.mockRestore();
      syncBuiltinESMExports();
    }

    expect(await readFile(resultsPath, "utf8")).toBe("FOREIGN_FILE_SENTINEL");
    expect(await readFile(originalResultsPath, "utf8")).toContain('"status":"completed"');
    expect(await readFile(join(summaryPath, "foreign.txt"), "utf8")).toBe(
      "FOREIGN_SUMMARY_SENTINEL",
    );
  });
});
