import { createHash } from "node:crypto";
import { lstat, mkdir, realpath, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { CARRIER_SPIKE_INPUT } from "../research/experiments/docx-hidden-run-v1/fixture.ts";
import { generateDocxHiddenRunV1 } from "../src/documents/docx/docx-hidden-run-v1.ts";

const artifactPath =
  "research/artifacts/docx-hidden-run-v1/glyph-docx-hidden-run-v1-spike.docx";
const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const artifactAbsolutePath = resolve(repositoryRoot, artifactPath);

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

export const assertArtifactDirectoryWithinRepository = async (
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

const main = async (): Promise<void> => {
  const bytes = await generateDocxHiddenRunV1(CARRIER_SPIKE_INPUT);
  await assertArtifactDirectoryWithinRepository(
    repositoryRoot,
    dirname(artifactAbsolutePath),
  );
  await mkdir(dirname(artifactAbsolutePath), { recursive: true });
  await assertArtifactDirectoryWithinRepository(
    repositoryRoot,
    dirname(artifactAbsolutePath),
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
  process.stdout.write(`${JSON.stringify({ artifactPath, sha256 })}\n`);
};

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
