import { createHash } from "node:crypto";
import { lstat, readFile, realpath } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ZERO_WIDTH_CANDIDATES,
  type CandidateId,
} from "../research/experiments/docx-zero-width-carrier-bakeoff-v1/fixture.ts";
import { inspectZeroWidthDocx } from "../research/experiments/docx-zero-width-carrier-bakeoff-v1/inspect-zero-width-docx.ts";
import type { InspectionMode } from "../research/experiments/docx-zero-width-carrier-bakeoff-v1/inspect-zero-width-docx.ts";

const usage =
  "Usage: pnpm research:carrier:zero-width:inspect-docx -- <candidate-id> <source|transformed> <repository-relative-docx-path>";
const defaultRepositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const repositoryRoot = process.env.GLYPH_REPOSITORY_ROOT ?? defaultRepositoryRoot;

const isInside = (root: string, candidate: string): boolean => {
  const child = relative(root, candidate);
  return (
    child !== "" &&
    child !== ".." &&
    !child.startsWith(`..${sep}`) &&
    !isAbsolute(child)
  );
};

const parseArgs = (
  args: readonly string[],
): { candidateId: CandidateId; mode: InspectionMode; inputPath: string } | null => {
  const values = args[0] === "--" ? args.slice(1) : args;
  if (values.length !== 3) return null;
  const [candidate, mode, inputPath] = values;
  if (
    !candidate ||
    !ZERO_WIDTH_CANDIDATES.some(({ id }) => id === candidate) ||
    (mode !== "source" && mode !== "transformed") ||
    !inputPath
  ) {
    return null;
  }
  return {
    candidateId: candidate as CandidateId,
    mode,
    inputPath,
  };
};

const readRepositoryFile = async (inputPath: string): Promise<Uint8Array> => {
  if (isAbsolute(inputPath)) {
    throw new Error("The DOCX path must be a repository-relative path.");
  }
  const canonicalRoot = await realpath(repositoryRoot).catch(() => {
    throw new Error("Unable to resolve repository path.");
  });
  const absolutePath = resolve(canonicalRoot, inputPath);
  if (!isInside(canonicalRoot, absolutePath)) {
    throw new Error("The DOCX path must remain inside the repository.");
  }
  let target;
  try {
    target = await lstat(absolutePath);
  } catch {
    throw new Error("Unable to resolve DOCX path.");
  }
  if (target.isSymbolicLink()) {
    throw new Error("The DOCX path must not be a symbolic link.");
  }
  if (!target.isFile()) {
    throw new Error("The DOCX path must identify a regular file.");
  }
  const canonicalPath = await realpath(absolutePath).catch(() => {
    throw new Error("Unable to resolve DOCX path.");
  });
  if (!isInside(canonicalRoot, canonicalPath)) {
    throw new Error("The DOCX path must remain inside the repository.");
  }
  try {
    return await readFile(canonicalPath);
  } catch {
    throw new Error("Unable to read DOCX.");
  }
};

const main = async (): Promise<void> => {
  const parsed = parseArgs(process.argv.slice(2));
  if (!parsed) {
    console.error(usage);
    process.exitCode = 1;
    return;
  }
  const bytes = await readRepositoryFile(parsed.inputPath);
  const inspection = inspectZeroWidthDocx(bytes, parsed.candidateId, parsed.mode);
  process.stdout.write(
    `${JSON.stringify({
      sha256: createHash("sha256").update(bytes).digest("hex"),
      ...inspection,
    })}\n`,
  );
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Unable to inspect DOCX.");
  process.exitCode = 1;
});
