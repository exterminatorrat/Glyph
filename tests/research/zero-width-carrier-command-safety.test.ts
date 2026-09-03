import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
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
import {
  ZERO_WIDTH_CANDIDATES,
  ZERO_WIDTH_FIXTURE,
  type CandidateId,
} from "../../research/experiments/docx-zero-width-carrier-bakeoff-v1/fixture.ts";
import { generateZeroWidthCarrierDocx } from "../../src/documents/docx/docx-zero-width-carrier-bakeoff-v1.ts";

const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url));
const generatorScript = resolve(repositoryRoot, "scripts/generate-docx-zero-width-carrier.ts");
const docxInspectorScript = resolve(repositoryRoot, "scripts/inspect-docx-zero-width-carrier.ts");
const textInspectorScript = resolve(repositoryRoot, "scripts/inspect-zero-width-plain-text.ts");
const artifactDirectory = "research/artifacts/docx-zero-width-carrier-bakeoff-v1";
const usageGenerator = "Usage: pnpm research:carrier:zero-width:generate -- <candidate-id>";
const usageDocx = "Usage: pnpm research:carrier:zero-width:inspect-docx -- <candidate-id> <source|transformed> <repository-relative-docx-path>";
const usageText = "Usage: pnpm research:carrier:zero-width:inspect-text -- <candidate-id> <repository-relative-text-path>";

const runScript = (
  script: string,
  repository: string,
  args: readonly string[],
) =>
  spawnSync(process.execPath, [script, ...args], {
    cwd: repository,
    encoding: "utf8",
    env: { ...process.env, GLYPH_REPOSITORY_ROOT: repository },
  });

const parseJsonObject = (stdout: string): Record<string, unknown> => {
  const value: unknown = JSON.parse(stdout.trim());
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Expected a JSON object");
  }
  return value as Record<string, unknown>;
};

const pathFor = (candidateId: CandidateId): string => `${artifactDirectory}/${candidateId}.docx`;

describe("zero-width carrier command safety", () => {
  test("enforces exact generator arguments and candidate IDs", async () => {
    const repository = await mkdtemp(join(tmpdir(), "glyph-zero-width-command-"));
    try {
      const missing = runScript(generatorScript, repository, []);
      expect(missing.status).not.toBe(0);
      expect(missing.stderr).toBe(`${usageGenerator}\n`);
      const extra = runScript(generatorScript, repository, ["--", "join-control-binary-v1", "extra"]);
      expect(extra.status).not.toBe(0);
      expect(extra.stderr).toBe(`${usageGenerator}\n`);
      const unknown = runScript(generatorScript, repository, ["--", "unknown"]);
      expect(unknown.status).not.toBe(0);
      expect(unknown.stderr).toBe(`${usageGenerator}\n`);
    } finally {
      await rm(repository, { recursive: true, force: true });
    }
  });

  test.each(ZERO_WIDTH_CANDIDATES)(
    "generates $id once with exact safe JSON",
    async ({ id, documentProfile }) => {
      const repository = await mkdtemp(join(tmpdir(), "glyph-zero-width-command-"));
      try {
        const first = runScript(generatorScript, repository, ["--", id]);
        expect(first.status).toBe(0);
        const generated = parseJsonObject(first.stdout);
        expect(Object.keys(generated)).toEqual([
          "candidateId",
          "documentProfile",
          "artifactPath",
          "sha256",
        ]);
        expect(generated).toMatchObject({ candidateId: id, documentProfile, artifactPath: pathFor(id) });
        expect(generated.sha256).toMatch(/^[a-f0-9]{64}$/);
        const path = resolve(repository, pathFor(id));
        const before = await readFile(path);
        expect(generated.sha256).toBe(createHash("sha256").update(before).digest("hex"));
        const second = runScript(generatorScript, repository, [id]);
        expect(second.status).not.toBe(0);
        expect(second.stderr).toContain("Refusing to replace existing artifact");
        expect(await readFile(path)).toEqual(before);
      } finally {
        await rm(repository, { recursive: true, force: true });
      }
    },
  );

  test("refuses directory symlink and existing target symlink without writes", async () => {
    const repository = await mkdtemp(join(tmpdir(), "glyph-zero-width-command-"));
    const outside = await mkdtemp(join(tmpdir(), "glyph-zero-width-outside-"));
    try {
      await mkdir(join(repository, "research"), { recursive: true });
      await symlink(outside, join(repository, "research", "artifacts"), "dir");
      const escaped = runScript(generatorScript, repository, ["--", "join-control-binary-v1"]);
      expect(escaped.status).not.toBe(0);
      expect(escaped.stderr).toContain("inside the repository");
    } finally {
      await rm(repository, { recursive: true, force: true });
      await rm(outside, { recursive: true, force: true });
    }

    const secondRepository = await mkdtemp(join(tmpdir(), "glyph-zero-width-command-"));
    const secondOutside = await mkdtemp(join(tmpdir(), "glyph-zero-width-outside-"));
    try {
      await mkdir(join(secondRepository, artifactDirectory), { recursive: true });
      const outsideFile = join(secondOutside, "sentinel.docx");
      await writeFile(outsideFile, "sentinel");
      await symlink(outsideFile, resolve(secondRepository, pathFor("join-control-binary-v1")), "file");
      const result = runScript(generatorScript, secondRepository, ["--", "join-control-binary-v1"]);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("symbolic link");
      expect(await readFile(outsideFile, "utf8")).toBe("sentinel");
    } finally {
      await rm(secondRepository, { recursive: true, force: true });
      await rm(secondOutside, { recursive: true, force: true });
    }
  });

  test("rejects unsafe inspection paths and keeps them read-only", async () => {
    const repository = await mkdtemp(join(tmpdir(), "glyph-zero-width-command-"));
    const outside = await mkdtemp(join(tmpdir(), "glyph-zero-width-outside-"));
    const outsidePath = join(outside, "outside.docx");
    const validPath = "research/fixtures/input.docx";
    const directoryPath = "research/fixtures/directory";
    const symlinkPath = "research/fixtures/escape.docx";
    try {
      await writeFile(outsidePath, "sentinel");
      await mkdir(dirname(resolve(repository, validPath)), { recursive: true });
      await writeFile(resolve(repository, validPath), "not a docx");
      await mkdir(resolve(repository, directoryPath), { recursive: true });
      await symlink(outsidePath, resolve(repository, symlinkPath));
      for (const path of ["", "../outside.docx", outsidePath, directoryPath, symlinkPath]) {
        const result = runScript(docxInspectorScript, repository, ["--", "join-control-binary-v1", "source", path]);
        expect(result.status).not.toBe(0);
      }
      expect(await readFile(outsidePath, "utf8")).toBe("sentinel");
    } finally {
      await rm(repository, { recursive: true, force: true });
      await rm(outside, { recursive: true, force: true });
    }
  });

  test("emits inspectable negative DOCX and text evidence with zero exit", async () => {
    const repository = await mkdtemp(join(tmpdir(), "glyph-zero-width-command-"));
    try {
      const docxPath = "research/fixtures/negative.docx";
      const textPath = "research/fixtures/negative.txt";
      await mkdir(dirname(resolve(repository, docxPath)), { recursive: true });
      const source = await generateZeroWidthCarrierDocx(ZERO_WIDTH_FIXTURE, "join-control-binary-v1");
      const entries = unzipSync(source);
      const document = entries["word/document.xml"];
      if (!document) throw new Error("Missing document XML");
      entries["word/document.xml"] = strToU8(strFromU8(document).replace("Read the passage below.", "Read the altered passage below."));
      await writeFile(resolve(repository, docxPath), zipSync(entries));
      await writeFile(resolve(repository, textPath), "plain text only\n");

      const docxResult = runScript(docxInspectorScript, repository, ["--", "join-control-binary-v1", "transformed", docxPath]);
      expect(docxResult.status).toBe(0);
      const docxInspection = parseJsonObject(docxResult.stdout);
      expect(docxInspection.markerPresence).toEqual({ alpha: "present", beta: "present" });
      expect(docxInspection.visibleBodyParagraphs).not.toEqual([
        "Read the passage below. Then summarize its main idea in two sentences.",
        "A neighborhood library extended its weekend hours so more residents could use its study rooms and book collection.",
        "Explain one possible benefit of the schedule change. Then explain one possible drawback.",
      ]);

      const textResult = runScript(textInspectorScript, repository, ["--", "join-control-binary-v1", textPath]);
      expect(textResult.status).toBe(0);
      const textInspection = parseJsonObject(textResult.stdout);
      expect(textInspection.markerPresence).toEqual({ alpha: "absent", beta: "absent" });

      await writeFile(resolve(repository, textPath), Uint8Array.from([0xc3, 0x28]));
      const invalid = runScript(textInspectorScript, repository, ["--", "join-control-binary-v1", textPath]);
      expect(invalid.status).not.toBe(0);
      expect(invalid.stderr).not.toContain("plain text only");

      await writeFile(resolve(repository, docxPath), Uint8Array.from([1, 2, 3]));
      const malformed = runScript(docxInspectorScript, repository, ["--", "join-control-binary-v1", "source", docxPath]);
      expect(malformed.status).not.toBe(0);
      expect(malformed.stdout).toBe("");
    } finally {
      await rm(repository, { recursive: true, force: true });
    }
  });

  test("requires exact inspector usage boundaries", async () => {
    const repository = await mkdtemp(join(tmpdir(), "glyph-zero-width-command-"));
    try {
      const docxMissing = runScript(docxInspectorScript, repository, []);
      expect(docxMissing.status).not.toBe(0);
      expect(docxMissing.stderr).toBe(`${usageDocx}\n`);
      const docxUnknownMode = runScript(docxInspectorScript, repository, ["--", "join-control-binary-v1", "unknown", "x.docx"]);
      expect(docxUnknownMode.status).not.toBe(0);
      expect(docxUnknownMode.stderr).toBe(`${usageDocx}\n`);
      const textMissing = runScript(textInspectorScript, repository, []);
      expect(textMissing.status).not.toBe(0);
      expect(textMissing.stderr).toBe(`${usageText}\n`);
      const textExtra = runScript(textInspectorScript, repository, ["--", "join-control-binary-v1", "x.txt", "extra"]);
      expect(textExtra.status).not.toBe(0);
      expect(textExtra.stderr).toBe(`${usageText}\n`);
    } finally {
      await rm(repository, { recursive: true, force: true });
    }
  });
});
