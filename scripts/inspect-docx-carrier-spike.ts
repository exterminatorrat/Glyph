import { createHash } from "node:crypto";
import { readFile, realpath, stat } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
  FIXED_MARKER_ALPHA,
  FIXED_MARKER_BETA,
} from "../research/experiments/docx-hidden-run-v1/fixture.ts";
import { inspectCarrierDocx } from "../research/experiments/docx-hidden-run-v1/inspect-carrier-docx.ts";

const usage =
  "Usage: pnpm research:carrier:inspect -- <repository-relative-docx-path>";
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
  const hasSeparator = args[0] === "--";
  if (args.length !== (hasSeparator ? 2 : 1)) {
    fail(usage);
    return;
  }

  const inputPath = hasSeparator ? args[1] : args[0];
  if (!inputPath || isAbsolute(inputPath)) {
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
  } catch (error: unknown) {
    fail(`Unable to resolve DOCX path: ${String(error)}`);
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
  } catch (error: unknown) {
    fail(`Unable to inspect DOCX path: ${String(error)}`);
    return;
  }

  let bytes: Uint8Array;
  try {
    bytes = await readFile(canonicalPath);
  } catch (error: unknown) {
    fail(`Unable to read DOCX: ${String(error)}`);
    return;
  }

  let inspection;
  try {
    inspection = inspectCarrierDocx(bytes);
  } catch (error: unknown) {
    fail(`Unable to inspect DOCX: ${String(error)}`);
    return;
  }

  const summary = {
    sha256: createHash("sha256").update(bytes).digest("hex"),
    entries: inspection.entries,
    visibleParagraphs: inspection.visibleParagraphs,
    markerPresence: {
      alpha: inspection.runs.some((run) => run.text.includes(FIXED_MARKER_ALPHA)),
      beta: inspection.runs.some((run) => run.text.includes(FIXED_MARKER_BETA)),
    },
    hiddenRunCount: inspection.runs.filter((run) => run.hidden).length,
    macroContentTypes: inspection.macroContentTypes,
    activeContentEntries: inspection.activeContentEntries,
    activeRelationshipTypes: inspection.activeRelationshipTypes,
    externalRelationships: inspection.externalRelationships,
    unexpectedEntries: inspection.unexpectedEntries,
    unexpectedRelationships: inspection.unexpectedRelationships,
  };

  process.stdout.write(`${JSON.stringify(summary)}\n`);

  if (
    summary.macroContentTypes.length > 0 ||
    summary.activeContentEntries.length > 0 ||
    summary.activeRelationshipTypes.length > 0 ||
    summary.externalRelationships.length > 0 ||
    summary.unexpectedEntries.length > 0 ||
    summary.unexpectedRelationships.length > 0
  ) {
    process.exitCode = 1;
  }
};

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
