import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, test, vi } from "vitest";

import {
  QUALIFICATION_CASE_IDS,
  qualificationCase,
} from "../../research/experiments/docx-join-control-accessibility-qualification-v1/fixture";
import { encodeCarrier } from "../../research/experiments/docx-zero-width-carrier-bakeoff-v1/frame";
import { CANDIDATE_A } from "../../research/experiments/docx-zero-width-carrier-bakeoff-v1/fixture";
import { repositoryRootFor } from "../../scripts/lib/join-control-qualification-command";

const sourceRoot = fileURLToPath(new URL("../../", import.meta.url));
const artifactRoot =
  "research/artifacts/docx-join-control-accessibility-qualification-v1";
const scripts = {
  generate: resolve(sourceRoot, "scripts/generate-docx-join-control-qualification.ts"),
  inspectDocx: resolve(sourceRoot, "scripts/inspect-docx-join-control-qualification.ts"),
  inspectText: resolve(sourceRoot, "scripts/inspect-text-join-control-qualification.ts"),
  inspectPdf: resolve(sourceRoot, "scripts/inspect-pdf-join-control-qualification.ts"),
  renderPdf: resolve(sourceRoot, "scripts/render-pdf-join-control-qualification.ts"),
} as const;

const usages = {
  generate:
    "Usage: pnpm research:carrier:join-control-qualification:generate -- <case-id>",
  inspectDocx:
    "Usage: pnpm research:carrier:join-control-qualification:inspect-docx -- <case-id> <checkpoint-id> <source|transformed> <repository-relative-docx-path>",
  inspectText:
    "Usage: pnpm research:carrier:join-control-qualification:inspect-text -- <case-id> <repository-relative-text-path>",
  inspectPdf:
    "Usage: pnpm research:carrier:join-control-qualification:inspect-pdf -- <case-id> <repository-relative-pdf-path>",
  renderPdf:
    "Usage: pnpm research:carrier:join-control-qualification:render-pdf -- <repository-relative-pdf-path> <repository-relative-png-path>",
} as const;

const run = (
  script: string,
  repositoryRoot: string,
  args: readonly string[],
) => {
  const exportName = new Map([
    [scripts.generate, "runGenerateJoinControlQualificationCommand"],
    [scripts.inspectDocx, "runInspectJoinControlQualificationDocxCommand"],
    [scripts.inspectText, "runInspectJoinControlQualificationTextCommand"],
    [scripts.inspectPdf, "runInspectJoinControlQualificationPdfCommand"],
    [scripts.renderPdf, "runRenderJoinControlQualificationPdfCommand"],
  ]).get(script);
  if (exportName === undefined) throw new Error("Unknown qualification command");
  const normalized = args[0] === "--" ? args.slice(1) : args;
  const harness = [
    `const command = await import(${JSON.stringify(pathToFileURL(script).href)});`,
    `await command[${JSON.stringify(exportName)}](process.argv[1], process.argv.slice(2));`,
  ].join("");
  return spawnSync(process.execPath, ["--input-type=module", "--eval", harness, repositoryRoot, ...normalized], {
    cwd: repositoryRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      NODE_NO_WARNINGS: "1",
    },
    shell: false,
    timeout: 60_000,
  });
};

const json = (stdout: string): Record<string, unknown> => {
  const parsed: unknown = JSON.parse(stdout);
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Expected a JSON object");
  }
  return parsed as Record<string, unknown>;
};

const clipboardBytes = (caseId: (typeof QUALIFICATION_CASE_IDS)[number]): Uint8Array => {
  const fixture = qualificationCase(caseId);
  const text = fixture.rows
    .map((row) => {
      const anchor = row.content.indexOf(". ");
      const visible = `${row.prefix}${row.content}`;
      if (row.markerId === null) return visible;
      const carrierIndex = [...`${row.prefix}${row.content.slice(0, anchor + 1)}`].length;
      const points = [...visible];
      points.splice(
        carrierIndex,
        0,
        encodeCarrier(CANDIDATE_A.id, row.markerId),
      );
      return points.join("");
    })
    .join("\n");
  return new TextEncoder().encode(text);
};

describe("join-control qualification command safety", () => {
  test("derives the repository root solely from the entrypoint location", () => {
    try {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("GLYPH_REPOSITORY_ROOT", "/tmp/private-redirect");
      const scriptUrl = new URL("../../scripts/example.ts", import.meta.url).href;
      expect(repositoryRootFor(scriptUrl)).toBe(sourceRoot);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  test("direct production entry points never honor a repository-root environment override", async () => {
    const repositoryRoot = await mkdtemp(join(tmpdir(), "glyph-m2e-command-"));
    try {
      const textPath = `${artifactRoot}/latin-operations-v1-google-docs-copy-plain-text.txt`;
      await mkdir(dirname(resolve(repositoryRoot, textPath)), { recursive: true });
      await writeFile(resolve(repositoryRoot, textPath), clipboardBytes("latin-operations-v1"));
      const result = spawnSync(
        process.execPath,
        [scripts.inspectText, "latin-operations-v1", textPath],
        {
          cwd: sourceRoot,
          encoding: "utf8",
          env: {
            ...process.env,
            NODE_ENV: "test",
            GLYPH_REPOSITORY_ROOT: repositoryRoot,
            NODE_NO_WARNINGS: "1",
          },
          shell: false,
          timeout: 60_000,
        },
      );
      expect(result.status).not.toBe(0);
      expect(result.stdout).toBe("");
      expect(result.stderr).toBe("Unable to inspect qualification text.\n");
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
    }
  });

  test("enforces exact argument counts and closed enums", async () => {
    const repositoryRoot = await mkdtemp(join(tmpdir(), "glyph-m2e-command-"));
    try {
      const cases = [
        [scripts.generate, usages.generate, []],
        [scripts.generate, usages.generate, ["--", "unknown-case"]],
        [scripts.inspectDocx, usages.inspectDocx, []],
        [
          scripts.inspectDocx,
          usages.inspectDocx,
          ["--", "latin-operations-v1", "unknown-checkpoint", "source", "x.docx"],
        ],
        [
          scripts.inspectDocx,
          usages.inspectDocx,
          ["--", "latin-operations-v1", "canonical", "unknown-mode", "x.docx"],
        ],
        [
          scripts.inspectDocx,
          usages.inspectDocx,
          ["--", "latin-operations-v1", "roundtrip", "source", "x.docx"],
        ],
        [
          scripts.inspectDocx,
          usages.inspectDocx,
          ["--", "latin-operations-v1", "canonical", "transformed", "x.docx"],
        ],
        [scripts.inspectText, usages.inspectText, []],
        [scripts.inspectPdf, usages.inspectPdf, []],
        [scripts.renderPdf, usages.renderPdf, []],
      ] as const;
      for (const [script, usage, args] of cases) {
        const result = run(script, repositoryRoot, args);
        expect(result.status).not.toBe(0);
        expect(result.stdout).toBe("");
        expect(result.stderr).toBe(`${usage}\n`);
      }
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
    }
  });

  test.each(QUALIFICATION_CASE_IDS)(
    "generates $caseId exactly once with fixed safe JSON",
    async (caseId) => {
      const repositoryRoot = await mkdtemp(join(tmpdir(), "glyph-m2e-command-"));
      try {
        const result = run(scripts.generate, repositoryRoot, ["--", caseId]);
        expect(result.status).toBe(0);
        const output = json(result.stdout);
        const artifactPath = `${artifactRoot}/${caseId}.docx`;
        expect(Object.keys(output)).toEqual([
          "qualificationProfile",
          "candidateId",
          "documentProfile",
          "caseId",
          "artifactPath",
          "sha256",
        ]);
        expect(output).toMatchObject({
          qualificationProfile: "docx-zero-width-join-control-qualification-v1",
          candidateId: "join-control-binary-v1",
          documentProfile: "docx-zero-width-join-control-v1",
          caseId,
          artifactPath,
        });
        const bytes = await readFile(resolve(repositoryRoot, artifactPath));
        expect(output.sha256).toBe(
          createHash("sha256").update(bytes).digest("hex"),
        );

        const second = run(scripts.generate, repositoryRoot, [caseId]);
        expect(second.status).not.toBe(0);
        expect(second.stdout).toBe("");
        expect(second.stderr).toBe("Unable to generate qualification DOCX.\n");
        expect(await readFile(resolve(repositoryRoot, artifactPath))).toEqual(bytes);
      } finally {
        await rm(repositoryRoot, { recursive: true, force: true });
      }
    },
  );

  test("emits safe DOCX and text inspection JSON without raw content", async () => {
    const repositoryRoot = await mkdtemp(join(tmpdir(), "glyph-m2e-command-"));
    try {
      const generated = run(scripts.generate, repositoryRoot, ["latin-operations-v1"]);
      expect(generated.status).toBe(0);
      const docxPath = `${artifactRoot}/latin-operations-v1.docx`;
      const textPath = `${artifactRoot}/latin-operations-v1-google-docs-copy-plain-text.txt`;
      await writeFile(resolve(repositoryRoot, textPath), clipboardBytes("latin-operations-v1"));

      const docx = run(scripts.inspectDocx, repositoryRoot, [
        "--",
        "latin-operations-v1",
        "canonical",
        "source",
        docxPath,
      ]);
      const text = run(scripts.inspectText, repositoryRoot, [
        "--",
        "latin-operations-v1",
        textPath,
      ]);
      expect(docx.status).toBe(0);
      expect(text.status).toBe(0);
      expect(json(docx.stdout)).toMatchObject({
        artifactPath: docxPath,
        frameState: "exact",
        visibleTextState: "exact",
      });
      expect(json(text.stdout)).toMatchObject({
        artifactPath: textPath,
        frameState: "exact",
        visibleTextState: "exact",
      });
      expect(`${docx.stdout}${text.stdout}`).not.toMatch(
        /archive opens|receeve|[\u200c\u200d]/u,
      );
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
    }
  });

  test("rejects absolute, traversal, symlink, non-regular, and injection paths", async () => {
    const repositoryRoot = await mkdtemp(join(tmpdir(), "glyph-m2e-command-"));
    const outsideRoot = await mkdtemp(join(tmpdir(), "glyph-m2e-outside-"));
    try {
      await mkdir(resolve(repositoryRoot, artifactRoot), { recursive: true });
      const outsidePath = resolve(outsideRoot, "outside.pdf");
      await writeFile(outsidePath, "private outside value");
      await symlink(outsidePath, resolve(repositoryRoot, artifactRoot, "linked.pdf"));
      await mkdir(resolve(repositoryRoot, artifactRoot, "directory.pdf"));
      const injection = `${artifactRoot}/$(touch injected).pdf`;

      for (const unsafe of [
        outsidePath,
        "../outside.pdf",
        `${artifactRoot}/linked.pdf`,
        `${artifactRoot}/directory.pdf`,
        injection,
      ]) {
        const result = run(scripts.inspectPdf, repositoryRoot, [
          "--",
          "latin-operations-v1",
          unsafe,
        ]);
        expect(result.status).not.toBe(0);
        expect(result.stdout).toBe("");
        expect(result.stderr).toBe("Unable to inspect qualification PDF.\n");
      }
      expect(await readFile(outsidePath, "utf8")).toBe("private outside value");
      await expect(readFile(resolve(repositoryRoot, "injected"))).rejects.toThrow();
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
      await rm(outsideRoot, { recursive: true, force: true });
    }
  });

  test("rejects a symlinked artifact root and does not mutate source files", async () => {
    const repositoryRoot = await mkdtemp(join(tmpdir(), "glyph-m2e-command-"));
    const outsideRoot = await mkdtemp(join(tmpdir(), "glyph-m2e-outside-"));
    try {
      await mkdir(resolve(repositoryRoot, "research"), { recursive: true });
      await symlink(outsideRoot, resolve(repositoryRoot, "research/artifacts"));
      const result = run(scripts.generate, repositoryRoot, ["latin-operations-v1"]);
      expect(result.status).not.toBe(0);
      expect(result.stdout).toBe("");
      expect(result.stderr).toBe("Unable to generate qualification DOCX.\n");
      expect(await readdir(outsideRoot)).toEqual([]);
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
      await rm(outsideRoot, { recursive: true, force: true });
    }
  });

  test("redacts malformed input and rejects unsafe renderer paths before execution", async () => {
    const repositoryRoot = await mkdtemp(join(tmpdir(), "glyph-m2e-command-"));
    try {
      const pdfPath = `${artifactRoot}/private-secret.pdf`;
      await mkdir(dirname(resolve(repositoryRoot, pdfPath)), { recursive: true });
      await writeFile(resolve(repositoryRoot, pdfPath), "private-secret-pdf-content");

      const inspect = run(scripts.inspectPdf, repositoryRoot, [
        "latin-operations-v1",
        pdfPath,
      ]);
      expect(inspect.status).not.toBe(0);
      expect(inspect.stdout).toBe("");
      expect(inspect.stderr).toBe("Unable to inspect qualification PDF.\n");

      const render = run(scripts.renderPdf, repositoryRoot, [
        "--",
        pdfPath,
        "../escaped.png",
      ]);
      expect(render.status).not.toBe(0);
      expect(render.stdout).toBe("");
      expect(render.stderr).toBe("Unable to render qualification PDF.\n");
      expect(`${inspect.stderr}${render.stderr}`).not.toContain("private-secret");
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
    }
  });
});
