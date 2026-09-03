import { createHash } from "node:crypto";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { lstat, mkdir, realpath, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  candidateDefinition,
  ZERO_WIDTH_CANDIDATES,
  ZERO_WIDTH_FIXTURE,
  type CandidateId,
} from "../research/experiments/docx-zero-width-carrier-bakeoff-v1/fixture.ts";

const usage =
  "Usage: pnpm research:carrier:zero-width:generate -- <candidate-id>";
const defaultRepositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const repositoryRoot = process.env.GLYPH_REPOSITORY_ROOT ?? defaultRepositoryRoot;
const artifactDirectory =
  "research/artifacts/docx-zero-width-carrier-bakeoff-v1";

const isInside = (root: string, candidate: string): boolean => {
  const child = relative(root, candidate);
  return (
    child !== "" &&
    child !== ".." &&
    !child.startsWith(`..${sep}`) &&
    !isAbsolute(child)
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
      if (!isNotFound(error)) throw error;
      const parent = dirname(current);
      if (parent === current) throw error;
      current = parent;
    }
  }
};

const assertInsideRepository = async (
  root: string,
  candidate: string,
  message: string,
): Promise<void> => {
  const canonicalRoot = await realpath(root);
  if (!isInside(canonicalRoot, candidate)) throw new Error(message);
  const canonicalAncestor = await nearestExistingCanonicalPath(candidate);
  if (
    canonicalAncestor !== canonicalRoot &&
    !isInside(canonicalRoot, canonicalAncestor)
  ) {
    throw new Error(message);
  }
};

const parseCandidate = (args: readonly string[]): CandidateId | undefined => {
  const value =
    args[0] === "--"
      ? args.length === 2
        ? args[1]
        : undefined
      : args.length === 1
        ? args[0]
        : undefined;
  if (
    value === undefined ||
    !ZERO_WIDTH_CANDIDATES.some((candidate) => candidate.id === value)
  ) {
    return undefined;
  }
  return value as CandidateId;
};

const main = async (): Promise<void> => {
  const candidateId = parseCandidate(process.argv.slice(2));
  if (!candidateId) {
    console.error(usage);
    process.exitCode = 1;
    return;
  }
  const candidate = candidateDefinition(candidateId);
  const artifactPath = `${artifactDirectory}/${candidateId}.docx`;
  const canonicalRepositoryRoot = await realpath(repositoryRoot);
  const artifactAbsolutePath = resolve(canonicalRepositoryRoot, artifactPath);
  const artifactAbsoluteDirectory = dirname(artifactAbsolutePath);

  await assertInsideRepository(
    repositoryRoot,
    artifactAbsoluteDirectory,
    "The carrier artifact directory must remain inside the repository.",
  );
  await mkdir(artifactAbsoluteDirectory, { recursive: true });
  await assertInsideRepository(
    repositoryRoot,
    artifactAbsoluteDirectory,
    "The carrier artifact directory must remain inside the repository.",
  );

  try {
    const existing = await lstat(artifactAbsolutePath);
    if (existing.isSymbolicLink()) {
      throw new Error(`Refusing to replace symbolic link: ${artifactPath}`);
    }
    throw new Error(
      `Refusing to replace existing artifact: ${artifactPath}`,
    );
  } catch (error: unknown) {
    if (!isNotFound(error)) throw error;
  }

  const { generateZeroWidthCarrierDocx } = await import(
    "../src/documents/docx/docx-zero-width-carrier-bakeoff-v1.ts"
  );
  const bytes = await generateZeroWidthCarrierDocx(ZERO_WIDTH_FIXTURE, candidateId);
  try {
    await writeFile(artifactAbsolutePath, bytes, { flag: "wx" });
  } catch (error: unknown) {
    if (
      error !== null &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "EEXIST"
    ) {
      throw new Error(`Refusing to replace existing artifact: ${artifactPath}`);
    }
    throw error;
  }

  process.stdout.write(
    `${JSON.stringify({
      candidateId,
      documentProfile: candidate.documentProfile,
      artifactPath,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    })}\n`,
  );
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Unable to generate DOCX.");
  process.exitCode = 1;
});
