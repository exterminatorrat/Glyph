import { inspectJoinControlQualificationDocx } from "../research/experiments/docx-join-control-accessibility-qualification-v1/inspect-qualification-docx.ts";
import {
  commandArguments,
  directExecution,
  failCommand,
  JOIN_CONTROL_QUALIFICATION_ARTIFACT_ROOT,
  parseCaseId,
  parseCheckpointId,
  repositoryRootFor,
  sha256,
} from "./lib/join-control-qualification-command.ts";
import { readRepositoryRegularFile } from "./lib/research-artifact-io.ts";

const USAGE =
  "Usage: pnpm research:carrier:join-control-qualification:inspect-docx -- <case-id> <checkpoint-id> <source|transformed> <repository-relative-docx-path>";

const main = async (): Promise<void> => {
  const args = commandArguments();
  const caseId = args.length === 4 ? parseCaseId(args[0]) : null;
  const checkpointId = args.length === 4 ? parseCheckpointId(args[1]) : null;
  const mode = args[2] === "source" || args[2] === "transformed" ? args[2] : null;
  const artifactPath = args[3];
  const modeMatchesCheckpoint =
    (mode === "source" && checkpointId === "canonical") ||
    (mode === "transformed" && checkpointId !== null && checkpointId !== "canonical");
  if (
    caseId === null ||
    checkpointId === null ||
    mode === null ||
    !modeMatchesCheckpoint ||
    !artifactPath
  ) {
    failCommand(USAGE);
    return;
  }
  try {
    const bytes = await readRepositoryRegularFile({
      repositoryRoot: repositoryRootFor(import.meta.url),
      allowedRoot: JOIN_CONTROL_QUALIFICATION_ARTIFACT_ROOT,
      relativePath: artifactPath,
    });
    const inspection = inspectJoinControlQualificationDocx(
      bytes,
      caseId,
      checkpointId,
      mode,
    );
    process.stdout.write(
      `${JSON.stringify({ artifactPath, sha256: sha256(bytes), ...inspection })}\n`,
    );
  } catch {
    failCommand("Unable to inspect qualification DOCX.");
  }
};

if (directExecution(import.meta.url)) void main();
