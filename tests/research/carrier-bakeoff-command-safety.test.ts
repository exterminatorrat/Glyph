import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { describe, expect, test } from "vitest";
import {
  CANDIDATE_FIXTURE,
  CANDIDATE_ORDER,
  FIXED_MARKER_ALPHA,
  FIXED_MARKER_BETA,
  VISIBLE_PARAGRAPHS,
} from "../../research/experiments/docx-alternative-carrier-bakeoff-v1/fixture";
import { generateDocxAlternativeCarrier } from "../../src/documents/docx/docx-alternative-carrier-bakeoff-v1";
import { CARRIER_SPIKE_INPUT } from "../../research/experiments/docx-hidden-run-v1/fixture";
import { generateDocxHiddenRunV1 } from "../../src/documents/docx/docx-hidden-run-v1";

const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url));
const generationScript = resolve(
  repositoryRoot,
  "scripts/generate-docx-alternative-carrier.ts",
);
const inspectionScript = resolve(
  repositoryRoot,
  "scripts/inspect-docx-alternative-carrier.ts",
);
const strictInspectionScript = resolve(
  repositoryRoot,
  "scripts/inspect-docx-carrier-spike.ts",
);
const generatorUsage =
  "Usage: pnpm research:carrier:bakeoff:generate -- <candidate-id>";
const strictArtifactPath =
  "research/artifacts/docx-hidden-run-v1/glyph-docx-hidden-run-v1-spike.docx";
const emptySafety = {
  externalRelationships: [],
  unresolvedRelationshipTargets: [],
  activeContentEntries: [],
  activeRelationshipTypes: [],
  macroContentTypes: [],
};

const artifactPathFor = (candidateId: string): string =>
  `research/artifacts/docx-alternative-carrier-bakeoff-v1/${candidateId}.docx`;

const runScript = (
  script: string,
  args: readonly string[],
  env: Record<string, string> = {},
) =>
  spawnSync(process.execPath, [script, ...args], {
    cwd: repositoryRoot,
    encoding: "utf8",
    env: { ...process.env, ...env },
  });

const pathExists = async (path: string): Promise<boolean> => {
  try {
    await lstat(path);
    return true;
  } catch {
    return false;
  }
};

const parseJson = (stdout: string): Record<string, unknown> => {
  const value: unknown = JSON.parse(stdout.trim());
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Expected a JSON object");
  }
  return value as Record<string, unknown>;
};

describe("alternative carrier command safety", () => {
  test("generator uses the exact candidate switch and usage boundary", () => {
    const missing = runScript(generationScript, []);
    expect(missing.status).not.toBe(0);
    expect(missing.stderr).toBe(`${generatorUsage}\n`);

    const unknown = runScript(generationScript, ["--", "unknown-candidate"]);
    expect(unknown.status).not.toBe(0);
    expect(unknown.stderr).toBe(`${generatorUsage}\n`);
  });

  test("generator cannot redirect output and refuses to overwrite a symlink", async () => {
    const outsideDirectory = await mkdtemp(join(tmpdir(), "glyph-task4-outside-"));
    const outsidePath = join(outsideDirectory, "redirected.docx");
    const candidatePath = resolve(
      repositoryRoot,
      artifactPathFor("matching-color-body-v1"),
    );

    try {
      const absoluteCandidate = runScript(generationScript, ["--", outsidePath]);
      expect(absoluteCandidate.status).not.toBe(0);
      expect(await pathExists(outsidePath)).toBe(false);

      const redirected = runScript(
        generationScript,
        ["--", "matching-color-body-v1"],
        { GLYPH_ARTIFACT_PATH: outsidePath },
      );
      expect(redirected.status).toBe(0);
      expect(parseJson(redirected.stdout)).toMatchObject({
        candidateId: "matching-color-body-v1",
        artifactPath: artifactPathFor("matching-color-body-v1"),
      });
      expect(await pathExists(outsidePath)).toBe(false);

      await rm(candidatePath, { force: true });
      await symlink(outsidePath, candidatePath, "file");
      const symlinkResult = runScript(generationScript, [
        "--",
        "matching-color-body-v1",
      ]);
      expect(symlinkResult.status).not.toBe(0);
      expect(symlinkResult.stderr).toContain("symbolic link");
      expect(await pathExists(outsidePath)).toBe(false);
    } finally {
      await rm(candidatePath, { force: true });
      await rm(outsideDirectory, { recursive: true, force: true });
    }
  });

  test("inspector rejects escaping, absolute, directory, and external symlink paths", async () => {
    const outsideDirectory = await mkdtemp(join(tmpdir(), "glyph-task4-outside-"));
    const outsidePath = join(outsideDirectory, "sentinel.txt");
    const directoryPath = resolve(
      repositoryRoot,
      `research/artifacts/docx-alternative-carrier-bakeoff-v1/task-4-directory-${randomUUID()}`,
    );
    const symlinkPath = resolve(
      repositoryRoot,
      `research/artifacts/docx-alternative-carrier-bakeoff-v1/task-4-symlink-${randomUUID()}.docx`,
    );
    await writeFile(outsidePath, "sentinel");
    await mkdir(directoryPath, { recursive: true });
    await symlink(outsidePath, symlinkPath, "file");

    try {
      for (const inputPath of [
        `../${outsideDirectory.split("/").pop()}/sentinel.txt`,
        outsidePath,
        directoryPath.slice(repositoryRoot.length + 1),
        symlinkPath.slice(repositoryRoot.length + 1),
      ]) {
        const result = runScript(inspectionScript, ["--", inputPath]);
        expect(result.status).not.toBe(0);
      }

      expect(await readFile(outsidePath, "utf8")).toBe("sentinel");
      expect(await readdir(outsideDirectory)).toEqual(["sentinel.txt"]);
    } finally {
      await rm(directoryPath, { recursive: true, force: true });
      await rm(symlinkPath, { force: true });
      await rm(outsideDirectory, { recursive: true, force: true });
    }
  });

  test.each(CANDIDATE_ORDER)(
    "%s generates one source artifact and read-only inspector JSON",
    async (candidateId) => {
      const candidate = candidateId as (typeof CANDIDATE_ORDER)[number];
      const generation = runScript(generationScript, ["--", candidate]);
      expect(generation.status).toBe(0);
      const generated = parseJson(generation.stdout);
      expect(Object.keys(generated)).toEqual([
        "candidateId",
        "artifactPath",
        "sha256",
      ]);
      expect(generated).toMatchObject({
        candidateId: candidate,
        artifactPath: artifactPathFor(candidate),
      });
      expect(generated.sha256).toMatch(/^[a-f0-9]{64}$/);

      const artifactPath = resolve(repositoryRoot, artifactPathFor(candidate));
      const before = await readFile(artifactPath);
      const inspection = runScript(inspectionScript, [
        "--",
        artifactPathFor(candidate),
      ]);
      expect(inspection.status).toBe(0);
      const summary = parseJson(inspection.stdout);
      expect(Object.keys(summary)).toEqual([
        "sha256",
        "entries",
        "paragraphs",
        "markerPresence",
        "markerOccurrences",
        "safety",
      ]);
      expect(summary.sha256).toBe(
        createHash("sha256").update(before).digest("hex"),
      );
      expect(summary.markerPresence).toEqual({
        alpha: "present",
        beta: "present",
      });
      expect(summary.safety).toEqual(emptySafety);

      const paragraphs = summary.paragraphs as Array<{
        location: string;
        text: string;
      }>;
      expect(
        paragraphs
          .filter((paragraph) => paragraph.location === "body")
          .map((paragraph) => paragraph.text.replaceAll(FIXED_MARKER_ALPHA, "").replaceAll(FIXED_MARKER_BETA, "")),
      ).toEqual(VISIBLE_PARAGRAPHS);

      const expectedPart =
        candidate === "docx-header-text-v1"
          ? "word/header1.xml"
          : "word/document.xml";
      const expectedLocation =
        candidate === "docx-header-text-v1" ? "header" : "body";
      const expectedFormats =
        candidate === "matching-color-body-v1"
          ? {
              hidden: false,
              color: "FFFFFF",
              sizeHalfPoints: null,
              sizeComplexScriptHalfPoints: null,
            }
          : candidate === "sub-legible-body-1pt-v1"
            ? {
                hidden: false,
                color: null,
                sizeHalfPoints: 2,
                sizeComplexScriptHalfPoints: 2,
              }
            : {
                hidden: false,
                color: null,
                sizeHalfPoints: null,
                sizeComplexScriptHalfPoints: null,
              };
      expect(summary.markerOccurrences).toEqual([
        {
          markerId: "alpha",
          partName: expectedPart,
          location: expectedLocation,
          paragraphIndex: candidate === "docx-header-text-v1" ? 0 : 0,
          runIndices: [candidate === "docx-header-text-v1" ? 0 : 1],
          runFormats: [expectedFormats],
        },
        {
          markerId: "beta",
          partName: expectedPart,
          location: expectedLocation,
          paragraphIndex: candidate === "docx-header-text-v1" ? 1 : 2,
          runIndices: [candidate === "docx-header-text-v1" ? 0 : 1],
          runFormats: [expectedFormats],
        },
      ]);
      expect(await readFile(artifactPath)).toEqual(before);
    },
  );

  test("inspector emits JSON safety findings and exits non-zero for external relationships", async () => {
    const relativePath = `research/artifacts/docx-alternative-carrier-bakeoff-v1/task-4-external-${randomUUID()}.docx`;
    const absolutePath = resolve(repositoryRoot, relativePath);
    const bytes = await generateDocxAlternativeCarrier(
      "matching-color-body-v1",
      CANDIDATE_FIXTURE,
    );
    const entries = unzipSync(bytes);
    const relationships = entries["word/_rels/document.xml.rels"];
    if (!relationships) {
      throw new Error("Missing document relationships for test package");
    }
    entries["word/_rels/document.xml.rels"] = strToU8(
      strFromU8(relationships).replace(
        "</Relationships>",
        '<Relationship Id="rIdExternal" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="https://example.invalid/glyph" TargetMode="External"/></Relationships>',
      ),
    );
    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, zipSync(entries));

    try {
      const result = runScript(inspectionScript, ["--", relativePath]);
      expect(result.status).not.toBe(0);
      const summary = parseJson(result.stdout);
      expect(summary.markerPresence).toEqual({
        alpha: "present",
        beta: "present",
      });
      expect(summary.safety).toMatchObject({
        externalRelationships: [
          "word/_rels/document.xml.rels: http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink -> https://example.invalid/glyph [External]",
        ],
      });
    } finally {
      await unlink(absolutePath);
    }
  });

  test("the old carrier command remains the strict command for its artifact", async () => {
    const absolutePath = resolve(repositoryRoot, strictArtifactPath);
    const existed = await pathExists(absolutePath);
    if (!existed) {
      await mkdir(dirname(absolutePath), { recursive: true });
      await writeFile(
        absolutePath,
        await generateDocxHiddenRunV1(CARRIER_SPIKE_INPUT),
      );
    }

    try {
      const result = runScript(strictInspectionScript, ["--", strictArtifactPath]);
      expect(result.status).toBe(0);
      const summary = parseJson(result.stdout);
      expect(summary).toMatchObject({
        markerPresence: { alpha: true, beta: true },
        hiddenRunCount: 2,
        unexpectedEntries: [],
        unexpectedRelationships: [],
      });
    } finally {
      if (!existed) {
        await unlink(absolutePath);
      }
    }
  });
});
