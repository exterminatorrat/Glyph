import { createHash } from "node:crypto";
import { readFile, realpath, stat } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { QUALIFICATION_FIXTURE } from "../research/experiments/docx-semantic-white-carrier-qualification-v1/fixture.ts";
import { inspectSemanticWhiteCarrier } from "../research/experiments/docx-semantic-white-carrier-qualification-v1/inspect-semantic-white-docx.ts";

const usage =
  "Usage: pnpm research:carrier:semantic-white:inspect -- <repository-relative-docx-path>";
const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));

const isOutsideRepository = (root: string, candidate: string): boolean => {
  const relativePath = relative(root, candidate);
  return (
    !relativePath ||
    relativePath === ".." ||
    relativePath.startsWith(`..${sep}`) ||
    isAbsolute(relativePath)
  );
};

const fail = (message: string): void => {
  console.error(message);
  process.exitCode = 1;
};

const main = async (): Promise<void> => {
  const args = process.argv.slice(2);
  const inputPath =
    args[0] === "--"
      ? args.length === 2
        ? args[1]
        : undefined
      : args.length === 1
        ? args[0]
        : undefined;
  if (!inputPath) {
    fail(usage);
    return;
  }

  if (isAbsolute(inputPath)) {
    fail("The DOCX path must be a repository-relative path.");
    return;
  }

  const absolutePath = resolve(repositoryRoot, inputPath);
  if (isOutsideRepository(repositoryRoot, absolutePath)) {
    fail("The DOCX path must remain inside the repository.");
    return;
  }

  let canonicalRepositoryRoot: string;
  let canonicalPath: string;
  try {
    canonicalRepositoryRoot = await realpath(repositoryRoot);
    canonicalPath = await realpath(absolutePath);
  } catch {
    fail("Unable to resolve DOCX path.");
    return;
  }

  if (isOutsideRepository(canonicalRepositoryRoot, canonicalPath)) {
    fail("The DOCX path must remain inside the repository.");
    return;
  }

  try {
    if (!(await stat(canonicalPath)).isFile()) {
      fail("The DOCX path must identify a regular file.");
      return;
    }
  } catch {
    fail("Unable to inspect DOCX path.");
    return;
  }

  let bytes: Uint8Array;
  try {
    bytes = await readFile(canonicalPath);
  } catch {
    fail("Unable to read DOCX.");
    return;
  }

  let inspection;
  try {
    inspection = inspectSemanticWhiteCarrier(
      bytes,
      QUALIFICATION_FIXTURE.markers,
    );
  } catch (error: unknown) {
    fail(error instanceof Error ? error.message : "Unable to inspect DOCX.");
    return;
  }

  const summary = {
    sha256: createHash("sha256").update(bytes).digest("hex"),
    ...inspection,
  };
  process.stdout.write(`${JSON.stringify(summary)}\n`);

  if (
    Object.values(inspection.transformed.safety).some(
      (findings) => findings.length > 0,
    )
  ) {
    process.exitCode = 1;
  }
};

main().catch(() => {
  fail("Unable to inspect DOCX.");
});
