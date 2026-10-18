import { open, stat } from "node:fs/promises";
import { resolve } from "node:path";
import type { InputClass } from "./contracts.js";
import { LabError, safeErrorCode } from "./errors.js";
import { importManualCsv, parseRunMatrix } from "./inputs.js";
import {
  removeEmptyOutputDirectory,
  reserveOutputDirectory,
  writeOutputFiles,
} from "./output.js";
import { runMatrix } from "./run.js";
import { summarizeRecords } from "./summary.js";

const MAX_INPUT_BYTES = 10 * 1024 * 1024;

type CliCommand =
  | {
      command: "import";
      inputPath: string;
      manifestsPath: string;
      inputClass: InputClass;
      outputPath: string;
    }
  | {
      command: "run";
      inputPath: string;
      outputPath: string;
      live: boolean;
      maxRequests?: number;
    };

const parseCliArguments = (args: string[]): CliCommand => {
  const [command, inputPath, ...flags] = args;
  if ((command !== "import" && command !== "run") || !inputPath || inputPath.startsWith("--")) {
    throw new LabError("INVALID_ARGUMENTS");
  }

  const values = new Map<string, string>();
  let live = false;
  for (let index = 0; index < flags.length; index += 1) {
    const flag = flags[index];
    if (flag === "--live" && command === "run") {
      if (live) throw new LabError("INVALID_ARGUMENTS");
      live = true;
      continue;
    }
    if (
      (flag !== "--out-dir" &&
        flag !== "--manifests" &&
        flag !== "--input-class" &&
        flag !== "--max-requests") ||
      (flag === "--manifests" && command !== "import") ||
      (flag === "--input-class" && command !== "import") ||
      (flag === "--max-requests" && command !== "run") ||
      values.has(flag)
    ) {
      throw new LabError("INVALID_ARGUMENTS");
    }
    const value = flags[index + 1];
    if (!value || value.startsWith("--")) throw new LabError("INVALID_ARGUMENTS");
    values.set(flag, value);
    index += 1;
  }

  const outputPath = values.get("--out-dir");
  if (!outputPath) throw new LabError("INVALID_ARGUMENTS");

  if (command === "import") {
    const manifestsPath = values.get("--manifests");
    const inputClass = values.get("--input-class");
    if (!manifestsPath || inputClass === undefined) {
      throw new LabError("INVALID_ARGUMENTS");
    }
    if (inputClass !== "synthetic" && inputClass !== "consented-research") {
      throw new LabError("INVALID_INPUT_CLASS");
    }
    return {
      command,
      inputPath,
      manifestsPath,
      inputClass,
      outputPath,
    };
  }

  if (values.has("--manifests") || values.has("--input-class")) {
    throw new LabError("INVALID_ARGUMENTS");
  }
  let maxRequests: number | undefined;
  if (values.has("--max-requests")) {
    const value = values.get("--max-requests") ?? "";
    if (!/^[0-9]+$/.test(value)) throw new LabError("INVALID_ARGUMENTS");
    maxRequests = Number(value);
  }
  if (live !== (maxRequests !== undefined)) throw new LabError("INVALID_ARGUMENTS");

  return {
    command,
    inputPath,
    outputPath,
    live,
    ...(maxRequests === undefined ? {} : { maxRequests }),
  };
};

const readInputFile = async (path: string, invalidCode: "INVALID_JSON" | "INVALID_CSV") => {
  let fileStatus: Awaited<ReturnType<typeof stat>>;
  try {
    fileStatus = await stat(path);
  } catch {
    throw new LabError("INPUT_READ_FAILED");
  }
  if (!fileStatus.isFile()) throw new LabError("INPUT_READ_FAILED");
  if (fileStatus.size > MAX_INPUT_BYTES) throw new LabError(invalidCode);

  let handle: Awaited<ReturnType<typeof open>> | undefined;
  try {
    handle = await open(path, "r");
    const openedStatus = await handle.stat();
    if (!openedStatus.isFile()) throw new LabError("INPUT_READ_FAILED");
    if (openedStatus.size > MAX_INPUT_BYTES) throw new LabError(invalidCode);

    const bytes = Buffer.alloc(MAX_INPUT_BYTES + 1);
    let byteLength = 0;
    while (byteLength < bytes.byteLength) {
      const { bytesRead } = await handle.read(bytes, byteLength, bytes.byteLength - byteLength, null);
      if (bytesRead === 0) break;
      byteLength += bytesRead;
    }
    if (byteLength > MAX_INPUT_BYTES) throw new LabError(invalidCode);

    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(0, byteLength));
    } catch {
      throw new LabError(invalidCode);
    }
  } catch (error) {
    if (error instanceof LabError) throw error;
    throw new LabError("INPUT_READ_FAILED");
  } finally {
    await handle?.close().catch(() => undefined);
  }
};

const parseJsonFile = async (path: string): Promise<unknown> => {
  const text = await readInputFile(path, "INVALID_JSON");
  try {
    return JSON.parse(text);
  } catch {
    throw new LabError("INVALID_JSON");
  }
};

const runCommand = async (command: CliCommand): Promise<void> => {
  if (command.command === "import") {
    const [csvText, manifestInput] = await Promise.all([
      readInputFile(command.inputPath, "INVALID_CSV"),
      parseJsonFile(command.manifestsPath),
    ]);
    const records = importManualCsv(csvText, manifestInput, command.inputClass);
    const summary = summarizeRecords(records);
    const outputPath = resolve(command.outputPath);
    await reserveOutputDirectory(outputPath);
    try {
      await writeOutputFiles(outputPath, records, summary);
    } catch (error) {
      await removeEmptyOutputDirectory(outputPath);
      throw error;
    }
    return;
  }

  const matrix = parseRunMatrix(await parseJsonFile(command.inputPath));
  const outputPath = resolve(command.outputPath);
  await reserveOutputDirectory(outputPath);
  try {
    const records = await runMatrix(matrix, {
      live: command.live,
      ...(command.maxRequests === undefined ? {} : { maxRequests: command.maxRequests }),
    });
    await writeOutputFiles(outputPath, records, summarizeRecords(records));
  } catch (error) {
    await removeEmptyOutputDirectory(outputPath);
    throw error;
  }
};

const main = async (): Promise<void> => {
  try {
    await runCommand(parseCliArguments(process.argv.slice(2)));
  } catch (error) {
    process.stderr.write(`${safeErrorCode(error)}\n`);
    process.exitCode = 1;
  }
};

await main();
