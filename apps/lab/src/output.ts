import { mkdir, open, rmdir, rm } from "node:fs/promises";
import { join } from "node:path";
import type { LabRecord, LabSummary } from "./contracts.js";
import { LabError } from "./errors.js";

const errorCode = (error: unknown): string | undefined =>
  typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
    ? error.code
    : undefined;

export const reserveOutputDirectory = async (path: string): Promise<void> => {
  try {
    await mkdir(path, { mode: 0o700 });
  } catch (error) {
    throw new LabError(errorCode(error) === "EEXIST" ? "OUTPUT_EXISTS" : "OUTPUT_FAILED");
  }
};

export const removeEmptyOutputDirectory = async (path: string): Promise<void> => {
  try {
    await rmdir(path);
  } catch {
    return;
  }
};

const writePrivateFile = async (
  path: string,
  content: string,
  created: string[],
): Promise<void> => {
  const handle = await open(path, "wx", 0o600);
  created.push(path);
  try {
    await handle.writeFile(content, "utf8");
  } finally {
    await handle.close();
  }
};

export const writeOutputFiles = async (
  directory: string,
  records: LabRecord[],
  summary: LabSummary,
): Promise<void> => {
  const created: string[] = [];
  try {
    const resultsPath = join(directory, "results.jsonl");
    await writePrivateFile(
      resultsPath,
      records.map((record) => JSON.stringify(record)).join("\n") + (records.length === 0 ? "" : "\n"),
      created,
    );

    const summaryPath = join(directory, "summary.json");
    await writePrivateFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, created);
  } catch {
    await Promise.all(created.map((path) => rm(path, { force: true }).catch(() => undefined)));
    throw new LabError("OUTPUT_FAILED");
  }
};
