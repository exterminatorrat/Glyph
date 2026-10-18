import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { bothCanaries, manifestSet, matrixInput, requiredCsvHeader } from "./fixtures.js";

const repositoryRoot = fileURLToPath(new URL("../../..", import.meta.url));
const cliPath = join(repositoryRoot, "apps/lab/src/cli.ts");
const tempDirectories: string[] = [];

const makeTempDirectory = async (): Promise<string> => {
  const path = await mkdtemp(join(tmpdir(), "glyph-lab-cli-test-"));
  tempDirectories.push(path);
  return path;
};

const noProviderKeys = (): NodeJS.ProcessEnv => {
  const env = { ...process.env };
  delete env.OPENAI_API_KEY;
  delete env.ANTHROPIC_API_KEY;
  return env;
};

const invoke = (args: string[], cwd = repositoryRoot) =>
  spawnSync(process.execPath, ["--import", "tsx", cliPath, ...args], {
    cwd,
    env: noProviderKeys(),
    encoding: "utf8",
  });

afterEach(async () => {
  await Promise.all(tempDirectories.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("real offline CLI invocations", () => {
  it("runs the default offline mock with no keys and keeps output off stdout", async () => {
    const directory = await makeTempDirectory();
    const matrixPath = join(directory, "matrix.json");
    const outputPath = join(directory, "new-output");
    await writeFile(matrixPath, JSON.stringify(matrixInput));

    const result = invoke(["run", matrixPath, "--out-dir", outputPath]);

    expect(result.status).toBe(0);
    expect(result.stdout).toBe("");
    expect(result.stderr).toBe("");
    expect(result.stderr).not.toContain("SYNTHETIC_PROMPT_SENTINEL");
    const rows = (await readFile(join(outputPath, "results.jsonl"), "utf8"))
      .trim()
      .split("\n");
    expect(JSON.parse(rows[0])).toMatchObject({ source: "mock", status: "completed" });
    const summary = JSON.parse(await readFile(join(outputPath, "summary.json"), "utf8"));
    expect(summary.mode).toBe("SIMULATED");
  });

  it("imports local CSV responses without persisting answer text or canaries", async () => {
    const directory = await makeTempDirectory();
    const csvPath = join(directory, "answers.csv");
    const manifestsPath = join(directory, "manifests.json");
    const outputPath = join(directory, "imported");
    await writeFile(
      csvPath,
      `${requiredCsvHeader}\ntrial-1,case-1,lesson-42,chatgpt,unknown,baseline,both,"ANSWER_SENTINEL ${bothCanaries}"`,
    );
    await writeFile(manifestsPath, JSON.stringify(manifestSet));

    const result = invoke([
      "import",
      csvPath,
      "--manifests",
      manifestsPath,
      "--input-class",
      "synthetic",
      "--out-dir",
      outputPath,
    ]);

    expect(result.status).toBe(0);
    expect(result.stdout).toBe("");
    expect(result.stderr).toBe("");
    const output = await readFile(join(outputPath, "results.jsonl"), "utf8");
    expect(output).not.toContain("ANSWER_SENTINEL");
    expect(output).not.toContain(manifestSet[0].layers[0].canary);
    expect(JSON.parse(output)).toMatchObject({
      source: "web-ui",
      layers: [
        { carrier: "tag", detected: true },
        { carrier: "visibleNote", detected: true },
      ],
    });
  });

  it("rejects malformed JSON without echoing its contents or leaving output", async () => {
    const directory = await makeTempDirectory();
    const matrixPath = join(directory, "malformed.json");
    const outputPath = join(directory, "must-not-exist");
    await writeFile(matrixPath, '{"private":"JSON_SENTINEL"');

    const result = invoke(["run", matrixPath, "--out-dir", outputPath]);

    expect(result.status).not.toBe(0);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("INVALID_JSON");
    expect(result.stderr).not.toContain("JSON_SENTINEL");
    await expect(readFile(join(outputPath, "results.jsonl"))).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("rejects input files above 10 MiB before creating output", async () => {
    const directory = await makeTempDirectory();
    const matrixPath = join(directory, "oversized.json");
    const outputPath = join(directory, "must-not-exist");
    await writeFile(matrixPath, " ".repeat(10 * 1024 * 1024 + 1));

    const result = invoke(["run", matrixPath, "--out-dir", outputPath]);

    expect(result.status).not.toBe(0);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("INVALID_JSON");
    await expect(readFile(join(outputPath, "results.jsonl"))).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("does not overwrite an existing output directory", async () => {
    const directory = await makeTempDirectory();
    const matrixPath = join(directory, "matrix.json");
    const outputPath = join(directory, "already-exists");
    await writeFile(matrixPath, JSON.stringify(matrixInput));
    await import("node:fs/promises").then(({ mkdir }) => mkdir(outputPath));
    await writeFile(join(outputPath, "keep.txt"), "KEEP_SENTINEL");

    const result = invoke(["run", matrixPath, "--out-dir", outputPath]);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("OUTPUT_EXISTS");
    expect(await readFile(join(outputPath, "keep.txt"), "utf8")).toBe("KEEP_SENTINEL");
  });
});
