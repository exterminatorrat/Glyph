import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  mkdir,
  mkdtemp,
  rm,
  stat,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { describe, expect, test } from "vitest";
import { CARRIER_SPIKE_INPUT } from "../../research/experiments/docx-hidden-run-v1/fixture";
import { generateDocxHiddenRunV1 } from "../../src/documents/docx/docx-hidden-run-v1";
import { assertArtifactDirectoryWithinRepository } from "../../scripts/generate-docx-carrier-spike.ts";

const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url));
const inspectionScript = resolve(
  repositoryRoot,
  "scripts/inspect-docx-carrier-spike.ts",
);

const mutateDocumentRoot = async (): Promise<Uint8Array> => {
  const bytes = await generateDocxHiddenRunV1(CARRIER_SPIKE_INPUT);
  const entries = unzipSync(bytes);
  const document = entries["word/document.xml"];
  if (!document) {
    throw new Error("Missing word/document.xml");
  }

  entries["word/document.xml"] = strToU8(
    strFromU8(document)
      .replace(
        "<w:document",
        '<x:notWordDocument xmlns:x="urn:glyph:wrong-document-root"',
      )
      .replace("</w:document>", "</x:notWordDocument>"),
  );
  return zipSync(entries);
};

describe("carrier command safety", () => {
  test("inspection CLI rejects a non-Word document root", async () => {
    const relativePath = `research/artifacts/docx-hidden-run-v1/task-3-invalid-root-${randomUUID()}.docx`;
    const absolutePath = resolve(repositoryRoot, relativePath);
    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, await mutateDocumentRoot());

    try {
      const result = spawnSync(
        process.execPath,
        [inspectionScript, "--", relativePath],
        { cwd: repositoryRoot, encoding: "utf8" },
      );
      expect(result.status).not.toBe(0);
    } finally {
      await unlink(absolutePath);
    }
  });

  test("generator rejects an escaping artifact ancestor before mkdir", async () => {
    const temporaryRepository = await mkdtemp(join(tmpdir(), "glyph-task3-repo-"));
    const externalDirectory = await mkdtemp(join(tmpdir(), "glyph-task3-outside-"));
    const artifactDirectory = join(
      temporaryRepository,
      "research",
      "artifacts",
      "docx-hidden-run-v1",
    );
    const externalLeaf = join(externalDirectory, "docx-hidden-run-v1");

    await mkdir(join(temporaryRepository, "research"), { recursive: true });
    await symlink(
      externalDirectory,
      join(temporaryRepository, "research", "artifacts"),
      "dir",
    );

    try {
      await expect(
        assertArtifactDirectoryWithinRepository(
          temporaryRepository,
          artifactDirectory,
        ),
      ).rejects.toThrow("inside the repository");
      await expect(stat(externalLeaf)).rejects.toMatchObject({ code: "ENOENT" });
    } finally {
      await rm(temporaryRepository, { recursive: true, force: true });
      await rm(externalDirectory, { recursive: true, force: true });
    }
  });
});
