import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
  cp,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { describe, expect, test } from "vitest";
import { QUALIFICATION_FIXTURE } from "../../research/experiments/docx-semantic-white-carrier-qualification-v1/fixture";
import { inspectSemanticWhiteCarrier } from "../../research/experiments/docx-semantic-white-carrier-qualification-v1/inspect-semantic-white-docx";
import { generateMatchingColorBodyV2 } from "../../src/documents/docx/docx-matching-color-body-v2";

const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url));
const generatorFileName = "generate-docx-semantic-white-carrier.ts";
const inspectorFileName = "inspect-docx-semantic-white-carrier.ts";
const generatorUsage =
  "Usage: pnpm research:carrier:semantic-white:generate";
const inspectorUsage =
  "Usage: pnpm research:carrier:semantic-white:inspect -- <repository-relative-docx-path>";
const artifactPath =
  "research/artifacts/docx-semantic-white-carrier-qualification-v1/matching-color-body-v2.docx";

const copyIfPresent = async (
  sourceRelativePath: string,
  destinationRoot: string,
): Promise<void> => {
  const source = resolve(repositoryRoot, sourceRelativePath);
  try {
    await lstat(source);
  } catch {
    return;
  }
  const destination = join(destinationRoot, sourceRelativePath);
  await mkdir(dirname(destination), { recursive: true });
  await cp(source, destination, { recursive: true });
};

const makeDisposableRepository = async (): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), "glyph-semantic-white-command-"));
  await copyIfPresent("package.json", root);
  await copyIfPresent("scripts", root);
  await copyIfPresent("src", root);
  await copyIfPresent(
    "research/experiments/docx-hidden-run-v1",
    root,
  );
  await copyIfPresent(
    "research/experiments/docx-alternative-carrier-bakeoff-v1",
    root,
  );
  await copyIfPresent(
    "research/experiments/docx-semantic-white-carrier-qualification-v1",
    root,
  );
  await symlink(
    resolve(repositoryRoot, "node_modules"),
    join(root, "node_modules"),
    "dir",
  );
  return root;
};

const runScript = (
  repository: string,
  scriptFileName: string,
  args: readonly string[],
) =>
  spawnSync(
    process.execPath,
    [join(repository, "scripts", scriptFileName), ...args],
    {
      cwd: repository,
      encoding: "utf8",
      env: { ...process.env },
    },
  );

const parseJsonObject = (stdout: string): Record<string, unknown> => {
  const value: unknown = JSON.parse(stdout.trim());
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Expected a JSON object");
  }
  return value as Record<string, unknown>;
};

const writeRelative = async (
  repository: string,
  relativePath: string,
  bytes: Uint8Array,
): Promise<string> => {
  const absolutePath = resolve(repository, relativePath);
  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, bytes);
  return absolutePath;
};

const mutateDocument = (
  bytes: Uint8Array,
  mutate: (xml: string) => string,
): Uint8Array => {
  const entries = unzipSync(bytes);
  const document = entries["word/document.xml"];
  if (!document) {
    throw new Error("Missing word/document.xml");
  }
  entries["word/document.xml"] = strToU8(mutate(strFromU8(document)));
  return zipSync(entries);
};

describe("semantic-white carrier command safety", () => {
  test("accepts no generator arguments and rejects extra arguments", async () => {
    const repository = await makeDisposableRepository();
    try {
      const noArguments = runScript(repository, generatorFileName, []);
      expect(noArguments.status).toBe(0);

      const extraArguments = runScript(repository, generatorFileName, [
        "--",
        "unexpected",
      ]);
      expect(extraArguments.status).not.toBe(0);
      expect(extraArguments.stderr).toBe(`${generatorUsage}\n`);
    } finally {
      await rm(repository, { recursive: true, force: true });
    }
  });

  test("prints exact generation JSON and refuses to replace the artifact", async () => {
    const repository = await makeDisposableRepository();
    try {
      const first = runScript(repository, generatorFileName, []);
      expect(first.status).toBe(0);
      const generated = parseJsonObject(first.stdout);
      expect(Object.keys(generated)).toEqual([
        "candidateId",
        "documentProfile",
        "artifactPath",
        "sha256",
      ]);
      expect(generated).toMatchObject({
        candidateId: "matching-color-body-v2",
        documentProfile: "docx-matching-color-body-v2",
        artifactPath,
      });
      expect(generated.sha256).toMatch(/^[a-f0-9]{64}$/);

      const artifactAbsolutePath = resolve(repository, artifactPath);
      const before = await readFile(artifactAbsolutePath);
      expect(generated.sha256).toBe(
        createHash("sha256").update(before).digest("hex"),
      );

      const second = runScript(repository, generatorFileName, []);
      expect(second.status).not.toBe(0);
      expect(second.stderr).toContain("Refusing to replace existing artifact");
      expect(await readFile(artifactAbsolutePath)).toEqual(before);
    } finally {
      await rm(repository, { recursive: true, force: true });
    }
  });

  test("refuses an existing canonical file or symlink without writing outside", async () => {
    const repository = await makeDisposableRepository();
    const outside = await mkdtemp(join(tmpdir(), "glyph-semantic-white-outside-"));
    const outsidePath = join(outside, "sentinel.docx");
    const canonicalPath = resolve(repository, artifactPath);
    try {
      await writeFile(outsidePath, "sentinel");
      await mkdir(dirname(canonicalPath), { recursive: true });
      await symlink(outsidePath, canonicalPath, "file");

      const result = runScript(repository, generatorFileName, []);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Refusing to replace existing artifact");
      expect(await readFile(outsidePath, "utf8")).toBe("sentinel");
    } finally {
      await rm(repository, { recursive: true, force: true });
      await rm(outside, { recursive: true, force: true });
    }
  });

  test("rejects an artifact directory that escapes through a symlink", async () => {
    const repository = await makeDisposableRepository();
    const outside = await mkdtemp(join(tmpdir(), "glyph-semantic-white-outside-"));
    try {
      await mkdir(join(repository, "research"), { recursive: true });
      await symlink(
        outside,
        join(repository, "research", "artifacts"),
        "dir",
      );

      const result = runScript(repository, generatorFileName, []);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("inside the repository");
      await expect(
        lstat(join(outside, "docx-semantic-white-carrier-qualification-v1")),
      ).rejects.toMatchObject({
        code: "ENOENT",
      });
    } finally {
      await rm(repository, { recursive: true, force: true });
      await rm(outside, { recursive: true, force: true });
    }
  });

  test("enforces inspector argument and repository path boundaries", async () => {
    const repository = await makeDisposableRepository();
    const outside = await mkdtemp(join(tmpdir(), "glyph-semantic-white-outside-"));
    const outsidePath = join(outside, "outside.docx");
    const validRelativePath = `research/fixtures/${randomUUID()}.docx`;
    const directoryRelativePath = `research/fixtures/${randomUUID()}`;
    const symlinkRelativePath = `research/fixtures/${randomUUID()}.docx`;
    try {
      await writeFile(outsidePath, "sentinel");
      await writeRelative(
        repository,
        validRelativePath,
        await generateMatchingColorBodyV2(QUALIFICATION_FIXTURE),
      );
      await mkdir(resolve(repository, directoryRelativePath), {
        recursive: true,
      });
      await mkdir(dirname(resolve(repository, symlinkRelativePath)), {
        recursive: true,
      });
      await symlink(outsidePath, resolve(repository, symlinkRelativePath), "file");

      const missing = runScript(repository, inspectorFileName, []);
      expect(missing.status).not.toBe(0);
      expect(missing.stderr).toBe(`${inspectorUsage}\n`);

      const extra = runScript(repository, inspectorFileName, [
        "--",
        validRelativePath,
        "extra",
      ]);
      expect(extra.status).not.toBe(0);
      expect(extra.stderr).toBe(`${inspectorUsage}\n`);

      const traversal = runScript(repository, inspectorFileName, [
        "--",
        `../${outside.split("/").pop()}/outside.docx`,
      ]);
      expect(traversal.status).not.toBe(0);
      expect(traversal.stderr).toContain("remain inside the repository");

      const absolute = runScript(repository, inspectorFileName, [
        "--",
        outsidePath,
      ]);
      expect(absolute.status).not.toBe(0);
      expect(absolute.stderr).toContain("repository-relative");

      const directory = runScript(repository, inspectorFileName, [
        "--",
        directoryRelativePath,
      ]);
      expect(directory.status).not.toBe(0);
      expect(directory.stderr).toContain("regular file");

      const escapingSymlink = runScript(repository, inspectorFileName, [
        "--",
        symlinkRelativePath,
      ]);
      expect(escapingSymlink.status).not.toBe(0);
      expect(escapingSymlink.stderr).toContain("remain inside the repository");
      expect(await readFile(outsidePath, "utf8")).toBe("sentinel");
    } finally {
      await rm(repository, { recursive: true, force: true });
      await rm(outside, { recursive: true, force: true });
    }
  });

  test("prints complete inspection JSON and keeps semantic failures inspectable", async () => {
    const repository = await makeDisposableRepository();
    const validRelativePath = `research/fixtures/${randomUUID()}.docx`;
    const invalidColorRelativePath = `research/fixtures/${randomUUID()}.docx`;
    try {
      const source = await generateMatchingColorBodyV2(QUALIFICATION_FIXTURE);
      await writeRelative(repository, validRelativePath, source);
      const result = runScript(repository, inspectorFileName, [
        "--",
        validRelativePath,
      ]);
      expect(result.status).toBe(0);
      const summary = parseJsonObject(result.stdout);
      expect(Object.keys(summary)).toEqual([
        "sha256",
        "transformed",
        "markerMechanisms",
      ]);
      expect(summary).toEqual({
        sha256: createHash("sha256").update(source).digest("hex"),
        ...inspectSemanticWhiteCarrier(source, QUALIFICATION_FIXTURE.markers),
      });

      const nonWhite = mutateDocument(source, (xml) =>
        xml.replaceAll(
          '<w:color w:val="FFFFFF"/>',
          '<w:color w:val="FFFFFE"/>',
        ),
      );
      await writeRelative(repository, invalidColorRelativePath, nonWhite);
      const semanticFailure = runScript(repository, inspectorFileName, [
        "--",
        invalidColorRelativePath,
      ]);
      expect(semanticFailure.status).toBe(0);
      const semanticSummary = parseJsonObject(semanticFailure.stdout);
      expect(semanticSummary).toEqual({
        sha256: createHash("sha256").update(nonWhite).digest("hex"),
        ...inspectSemanticWhiteCarrier(nonWhite, QUALIFICATION_FIXTURE.markers),
      });
    } finally {
      await rm(repository, { recursive: true, force: true });
    }
  });

  test("rejects malformed packages and reports unsafe packages with non-zero status", async () => {
    const repository = await makeDisposableRepository();
    const malformedRelativePath = `research/fixtures/${randomUUID()}.docx`;
    const unsafeRelativePath = `research/fixtures/${randomUUID()}.docx`;
    try {
      await writeRelative(
        repository,
        malformedRelativePath,
        new Uint8Array([0x50, 0x4b, 0x03]),
      );
      const malformed = runScript(repository, inspectorFileName, [
        "--",
        malformedRelativePath,
      ]);
      expect(malformed.status).not.toBe(0);
      expect(malformed.stderr).toContain("ZIP/DOCX");

      const source = await generateMatchingColorBodyV2(QUALIFICATION_FIXTURE);
      const unsafe = mutateDocument(source, (xml) => xml);
      const entries = unzipSync(unsafe);
      const relationships = entries["word/_rels/document.xml.rels"];
      if (!relationships) {
        throw new Error("Missing document relationships");
      }
      entries["word/_rels/document.xml.rels"] = strToU8(
        strFromU8(relationships).replace(
          "</Relationships>",
          '<Relationship Id="rIdExternal" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="https://example.invalid/glyph" TargetMode="External"/></Relationships>',
        ),
      );
      await writeRelative(repository, unsafeRelativePath, zipSync(entries));

      const unsafeResult = runScript(repository, inspectorFileName, [
        "--",
        unsafeRelativePath,
      ]);
      expect(unsafeResult.status).not.toBe(0);
      const unsafeSummary = parseJsonObject(unsafeResult.stdout);
      expect(Object.keys(unsafeSummary)).toEqual([
        "sha256",
        "transformed",
        "markerMechanisms",
      ]);
      const unsafeTransformed = unsafeSummary.transformed as Record<
        string,
        unknown
      >;
      const unsafeSafety = unsafeTransformed.safety as Record<string, unknown>;
      expect(
        (unsafeSafety.externalRelationships as unknown[]).length,
      ).toBe(1);
      expect(unsafeTransformed.markerPresence).toEqual({
        alpha: "present",
        beta: "present",
      });
    } finally {
      await rm(repository, { recursive: true, force: true });
    }
  });
});
