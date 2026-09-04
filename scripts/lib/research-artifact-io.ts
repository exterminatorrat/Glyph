import { constants } from "node:fs";
import { lstat, open, realpath } from "node:fs/promises";
import { isAbsolute, join, normalize, relative, sep } from "node:path";

type RepositoryPathInput = Readonly<{
  repositoryRoot: string;
  allowedRoot: string;
  relativePath: string;
}>;

type RepositoryWriteInput = RepositoryPathInput &
  Readonly<{ bytes: Uint8Array }>;

const unsafePath = (): never => {
  throw new Error("Unsafe research artifact path");
};

const isNodeError = (error: unknown): error is NodeJS.ErrnoException =>
  error instanceof Error && "code" in error;

const validateRelativePath = (value: string): void => {
  if (
    value.length === 0 ||
    isAbsolute(value) ||
    value.includes("\\") ||
    normalize(value) !== value ||
    value.split("/").some((component) => component === "" || component === "..")
  ) {
    unsafePath();
  }
};

const isContained = (parent: string, candidate: string): boolean => {
  const fromParent = relative(parent, candidate);
  return fromParent === "" || (!fromParent.startsWith(`..${sep}`) && fromParent !== "..");
};

const rejectSymlinkComponents = async (
  repositoryRoot: string,
  relativePath: string,
): Promise<void> => {
  let current = repositoryRoot;
  for (const component of relativePath.split("/")) {
    current = join(current, component);
    const status = await lstat(current).catch(() => unsafePath());
    if (status.isSymbolicLink()) unsafePath();
  }
};

const resolveInput = async (
  input: RepositoryPathInput,
): Promise<{ candidate: string; allowed: string }> => {
  validateRelativePath(input.allowedRoot);
  validateRelativePath(input.relativePath);
  const repository = await realpath(input.repositoryRoot).catch(() => unsafePath());
  const allowedLexical = join(repository, input.allowedRoot);
  const candidate = join(repository, input.relativePath);
  if (!isContained(allowedLexical, candidate)) unsafePath();

  await rejectSymlinkComponents(repository, input.allowedRoot);
  const allowed = await realpath(allowedLexical).catch(() => unsafePath());
  if (!isContained(repository, allowed) || allowed !== allowedLexical) unsafePath();

  const parentRelative = input.relativePath.split("/").slice(0, -1).join("/");
  await rejectSymlinkComponents(repository, parentRelative);
  const parent = await realpath(join(repository, parentRelative)).catch(() => unsafePath());
  if (!isContained(allowed, parent)) unsafePath();
  return { candidate, allowed };
};

export async function readRepositoryRegularFile(
  input: RepositoryPathInput,
): Promise<Uint8Array> {
  const { candidate, allowed } = await resolveInput(input);
  const status = await lstat(candidate).catch(() => unsafePath());
  if (status.isSymbolicLink() || !status.isFile()) unsafePath();
  const resolved = await realpath(candidate).catch(() => unsafePath());
  if (!isContained(allowed, resolved)) unsafePath();

  const handle = await open(candidate, constants.O_RDONLY | constants.O_NOFOLLOW).catch(() =>
    unsafePath(),
  );
  try {
    const openedStatus = await handle.stat();
    if (!openedStatus.isFile()) unsafePath();
    return new Uint8Array(await handle.readFile());
  } finally {
    await handle.close();
  }
}

export async function writeNewRepositoryArtifact(
  input: RepositoryWriteInput,
): Promise<void> {
  const { candidate } = await resolveInput(input);
  try {
    const status = await lstat(candidate);
    if (status.isSymbolicLink()) unsafePath();
    throw new Error("Research artifact already exists");
  } catch (error) {
    if (!isNodeError(error) || error.code !== "ENOENT") throw error;
  }

  const handle = await open(
      candidate,
      constants.O_WRONLY |
        constants.O_CREAT |
        constants.O_EXCL |
        constants.O_NOFOLLOW,
      0o600,
    ).catch((error: unknown) => {
      if (isNodeError(error) && error.code === "EEXIST") {
        throw new Error("Research artifact already exists");
      }
      return unsafePath();
    });
  try {
    await handle.writeFile(input.bytes);
  } finally {
    await handle.close();
  }
}

export async function assertNewRepositoryArtifactPath(
  input: RepositoryPathInput,
): Promise<void> {
  const { candidate } = await resolveInput(input);
  try {
    const status = await lstat(candidate);
    if (status.isSymbolicLink()) unsafePath();
    throw new Error("Research artifact already exists");
  } catch (error) {
    if (!isNodeError(error) || error.code !== "ENOENT") throw error;
  }
}
