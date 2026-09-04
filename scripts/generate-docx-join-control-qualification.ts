import { qualificationCase } from "../research/experiments/docx-join-control-accessibility-qualification-v1/fixture.ts";
import { generateJoinControlQualificationDocx } from "../src/documents/docx/docx-join-control-accessibility-qualification-v1.ts";
import {
  CANDIDATE_ID,
  commandArguments,
  directExecution,
  DOCUMENT_PROFILE,
  failCommand,
  JOIN_CONTROL_QUALIFICATION_ARTIFACT_ROOT,
  parseCaseId,
  QUALIFICATION_PROFILE,
  repositoryRootFor,
  sha256,
} from "./lib/join-control-qualification-command.ts";
import {
  ensureRepositoryArtifactRoot,
  writeNewRepositoryArtifact,
} from "./lib/research-artifact-io.ts";

const USAGE =
  "Usage: pnpm research:carrier:join-control-qualification:generate -- <case-id>";

const main = async (): Promise<void> => {
  const args = commandArguments();
  const caseId = args.length === 1 ? parseCaseId(args[0]) : null;
  if (caseId === null) {
    failCommand(USAGE);
    return;
  }
  const repositoryRoot = repositoryRootFor(import.meta.url);
  const artifactPath = `${JOIN_CONTROL_QUALIFICATION_ARTIFACT_ROOT}/${caseId}.docx`;
  try {
    await ensureRepositoryArtifactRoot(
      repositoryRoot,
      JOIN_CONTROL_QUALIFICATION_ARTIFACT_ROOT,
    );
    const bytes = await generateJoinControlQualificationDocx(
      qualificationCase(caseId),
    );
    await writeNewRepositoryArtifact({
      repositoryRoot,
      allowedRoot: JOIN_CONTROL_QUALIFICATION_ARTIFACT_ROOT,
      relativePath: artifactPath,
      bytes,
    });
    process.stdout.write(
      `${JSON.stringify({
        qualificationProfile: QUALIFICATION_PROFILE,
        candidateId: CANDIDATE_ID,
        documentProfile: DOCUMENT_PROFILE,
        caseId,
        artifactPath,
        sha256: sha256(bytes),
      })}\n`,
    );
  } catch {
    failCommand("Unable to generate qualification DOCX.");
  }
};

if (directExecution(import.meta.url)) void main();
