import { createHash } from "node:crypto";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import {
  lstat,
  mkdir,
  realpath,
  writeFile,
} from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { AlternativeCarrierCandidateId } from "../research/experiments/docx-alternative-carrier-bakeoff-v1/fixture.ts";

const usage =
  "Usage: pnpm research:carrier:bakeoff:generate -- <candidate-id>";
const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const artifactPaths = {
  "matching-color-body-v1":
    "research/artifacts/docx-alternative-carrier-bakeoff-v1/matching-color-body-v1.docx",
  "sub-legible-body-1pt-v1":
    "research/artifacts/docx-alternative-carrier-bakeoff-v1/sub-legible-body-1pt-v1.docx",
  "docx-header-text-v1":
    "research/artifacts/docx-alternative-carrier-bakeoff-v1/docx-header-text-v1.docx",
} as const satisfies Record<AlternativeCarrierCandidateId, string>;

const isOutsideRepository = (root: string, candidate: string): boolean => {
  const relativePath = relative(root, candidate);
  return (
    !relativePath ||
    relativePath === ".." ||
    relativePath.startsWith(`..${sep}`) ||
    isAbsolute(relativePath)
  );
};

const isNotFound = (error: unknown): boolean =>
  error !== null &&
  typeof error === "object" &&
  "code" in error &&
  error.code === "ENOENT";

const nearestExistingCanonicalPath = async (
  candidate: string,
): Promise<string> => {
  let current = candidate;
  while (true) {
    try {
      return await realpath(current);
    } catch (error: unknown) {
      if (!isNotFound(error)) {
        throw error;
      }
      const parent = dirname(current);
      if (parent === current) {
        throw error;
      }
      current = parent;
    }
  }
};

const assertArtifactDirectoryWithinRepository = async (
  root: string,
  directory: string,
): Promise<void> => {
  const canonicalRoot = await realpath(root);
  const canonicalAncestor = await nearestExistingCanonicalPath(directory);
  if (isOutsideRepository(canonicalRoot, canonicalAncestor)) {
    throw new Error(
      "The carrier artifact directory must remain inside the repository.",
    );
  }
};

const isCandidate = (
  value: string | undefined,
): value is AlternativeCarrierCandidateId =>
  value !== undefined && Object.hasOwn(artifactPaths, value);

const main = async (): Promise<void> => {
  const args = process.argv.slice(2);
  const candidate =
    args[0] === "--"
      ? args.length === 2
        ? args[1]
        : undefined
      : args.length === 1
        ? args[0]
        : undefined;
  if (!isCandidate(candidate)) {
    console.error(usage);
    process.exitCode = 1;
    return;
  }

  const [{ CANDIDATE_FIXTURE }, { generateDocxAlternativeCarrier }] =
    await Promise.all([
      import("../research/experiments/docx-alternative-carrier-bakeoff-v1/fixture.ts"),
      import("../src/documents/docx/docx-alternative-carrier-bakeoff-v1.ts"),
    ]);

  const artifactPath = artifactPaths[candidate];
  const artifactAbsolutePath = resolve(repositoryRoot, artifactPath);
  const artifactDirectory = dirname(artifactAbsolutePath);
  const bytes = await generateDocxAlternativeCarrier(
    candidate,
    CANDIDATE_FIXTURE,
  );

  await assertArtifactDirectoryWithinRepository(
    repositoryRoot,
    artifactDirectory,
  );
  await mkdir(artifactDirectory, { recursive: true });
  await assertArtifactDirectoryWithinRepository(
    repositoryRoot,
    artifactDirectory,
  );

  try {
    if ((await lstat(artifactAbsolutePath)).isSymbolicLink()) {
      throw new Error(`Refusing to overwrite symbolic link: ${artifactPath}`);
    }
  } catch (error: unknown) {
    if (!isNotFound(error)) {
      throw error;
    }
  }

  await writeFile(artifactAbsolutePath, bytes);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  process.stdout.write(`${JSON.stringify({ candidateId: candidate, artifactPath, sha256 })}\n`);
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Unable to generate DOCX.");
  process.exitCode = 1;
});
