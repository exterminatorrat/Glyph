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

const main = async (): Promise<void> => {
  const bytes = await generateDocxHiddenRunV1(CARRIER_SPIKE_INPUT);
  await mkdir(dirname(artifactAbsolutePath), { recursive: true });

  const canonicalRepositoryRoot = await realpath(repositoryRoot);
  const canonicalArtifactDirectory = await realpath(
    dirname(artifactAbsolutePath),
  );
  if (
    isOutsideRepository(canonicalRepositoryRoot, canonicalArtifactDirectory)
  ) {
    throw new Error("The carrier artifact directory must remain inside the repository.");
  }

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

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
