import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  assertNewRepositoryArtifactPath,
  readRepositoryRegularFile,
  writeNewRepositoryArtifact,
} from "./lib/research-artifact-io.ts";
import {
  commandArguments,
  directExecution,
  failCommand,
  JOIN_CONTROL_QUALIFICATION_ARTIFACT_ROOT,
  repositoryRootFor,
  sha256,
} from "./lib/join-control-qualification-command.ts";

const ARTIFACT_ROOT =
  "research/artifacts/docx-join-control-accessibility-qualification-v1";
const EXPECTED_PDFTOPPM_VERSION = "26.05.0";

type RenderInput = Readonly<{
  repositoryRoot: string;
  pdfBytes: Uint8Array;
  outputRelativePath: string;
}>;

export type QualificationPdfRenderResult = Readonly<{
  outputRelativePath: string;
  rendererVersion: "26.05.0";
  pageCount: 1;
}>;

const failed = (): never => {
  throw new Error("PDF rendering failed");
};

const verifyRendererVersion = (): void => {
  const result = spawnSync("pdftoppm", ["-v"], {
    encoding: "utf8",
    env: { ...process.env, LC_ALL: "C" },
    shell: false,
    timeout: 5_000,
  });
  const versionOutput = `${result.stdout}${result.stderr}`;
  const version = versionOutput.match(/pdftoppm version ([0-9.]+)/)?.[1];
  if (result.status !== 0 || version !== EXPECTED_PDFTOPPM_VERSION) failed();
};

export async function renderJoinControlQualificationPdf(
  input: RenderInput,
): Promise<QualificationPdfRenderResult> {
  await assertNewRepositoryArtifactPath({
    repositoryRoot: input.repositoryRoot,
    allowedRoot: ARTIFACT_ROOT,
    relativePath: input.outputRelativePath,
  });
  verifyRendererVersion();
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "glyph-m2e-render-"));
  try {
    const pdfPath = join(temporaryDirectory, "source.pdf");
    const outputPrefix = join(temporaryDirectory, "page");
    await writeFile(pdfPath, input.pdfBytes, { flag: "wx", mode: 0o600 });
    const result = spawnSync(
      "pdftoppm",
      ["-png", "-r", "144", pdfPath, outputPrefix],
      {
        env: { ...process.env, LC_ALL: "C" },
        shell: false,
        stdio: "ignore",
        timeout: 60_000,
      },
    );
    if (result.status !== 0) failed();
    const renderedFiles = (await readdir(temporaryDirectory)).filter((name) =>
      /^page-[0-9]+\.png$/.test(name),
    );
    if (renderedFiles.length !== 1 || renderedFiles[0] !== "page-1.png") failed();
    const png = new Uint8Array(
      await readFile(join(temporaryDirectory, renderedFiles[0])),
    );
    if (png.byteLength === 0) failed();
    await writeNewRepositoryArtifact({
      repositoryRoot: input.repositoryRoot,
      allowedRoot: ARTIFACT_ROOT,
      relativePath: input.outputRelativePath,
      bytes: png,
    });
    return {
      outputRelativePath: input.outputRelativePath,
      rendererVersion: EXPECTED_PDFTOPPM_VERSION,
      pageCount: 1,
    };
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

const USAGE =
  "Usage: pnpm research:carrier:join-control-qualification:render-pdf -- <repository-relative-pdf-path> <repository-relative-png-path>";

export const runRenderJoinControlQualificationPdfCommand = async (
  repositoryRoot: string,
  args: readonly string[],
): Promise<void> => {
  const inputPath = args[0];
  const outputPath = args[1];
  if (args.length !== 2 || !inputPath || !outputPath) {
    failCommand(USAGE);
    return;
  }
  try {
    const pdfBytes = await readRepositoryRegularFile({
      repositoryRoot,
      allowedRoot: JOIN_CONTROL_QUALIFICATION_ARTIFACT_ROOT,
      relativePath: inputPath,
    });
    const render = await renderJoinControlQualificationPdf({
      repositoryRoot,
      pdfBytes,
      outputRelativePath: outputPath,
    });
    const pngBytes = await readRepositoryRegularFile({
      repositoryRoot,
      allowedRoot: JOIN_CONTROL_QUALIFICATION_ARTIFACT_ROOT,
      relativePath: outputPath,
    });
    process.stdout.write(
      `${JSON.stringify({
        inputPath,
        inputSha256: sha256(pdfBytes),
        outputPath,
        outputSha256: sha256(pngBytes),
        rendererVersion: render.rendererVersion,
        pageCount: render.pageCount,
      })}\n`,
    );
  } catch {
    failCommand("Unable to render qualification PDF.");
  }
};

if (directExecution(import.meta.url)) {
  void runRenderJoinControlQualificationPdfCommand(
    repositoryRootFor(import.meta.url),
    commandArguments(),
  );
}
