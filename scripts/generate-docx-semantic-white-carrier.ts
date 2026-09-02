import { createHash } from "node:crypto";
import {
  lstat,
  mkdir,
  realpath,
  writeFile,
} from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const usage = "Usage: pnpm research:carrier:semantic-white:generate";
const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const artifactPath =
  "research/artifacts/docx-semantic-white-carrier-qualification-v1/matching-color-body-v2.docx";

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
      "The semantic-white carrier artifact directory must remain inside the repository.",
    );
  }
};

const main = async (): Promise<void> => {
  if (process.argv.length !== 2) {
    console.error(usage);
    process.exitCode = 1;
    return;
  }

  const [
    { CANDIDATE_ID, DOCUMENT_PROFILE, QUALIFICATION_FIXTURE },
    { generateMatchingColorBodyV2 },
  ] = await Promise.all([
    import(
      "../research/experiments/docx-semantic-white-carrier-qualification-v1/fixture.ts"
    ),
    import("../src/documents/docx/docx-matching-color-body-v2.ts"),
  ]);
  const bytes = await generateMatchingColorBodyV2(QUALIFICATION_FIXTURE);
  const artifactAbsolutePath = resolve(repositoryRoot, artifactPath);
  const artifactDirectory = dirname(artifactAbsolutePath);

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
    await lstat(artifactAbsolutePath);
    throw new Error(`Refusing to replace existing artifact: ${artifactPath}`);
  } catch (error: unknown) {
    if (!isNotFound(error)) {
      throw error;
    }
  }

  await writeFile(artifactAbsolutePath, bytes, { flag: "wx" });
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  process.stdout.write(
    `${JSON.stringify({
      candidateId: CANDIDATE_ID,
      documentProfile: DOCUMENT_PROFILE,
      artifactPath,
      sha256,
    })}\n`,
  );
};

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unable to generate semantic-white carrier DOCX.",
  );
  process.exitCode = 1;
});
