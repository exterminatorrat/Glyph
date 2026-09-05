import { inspectJoinControlQualificationText } from "../research/experiments/docx-join-control-accessibility-qualification-v1/inspect-qualification-text.ts";
import {
  commandArguments,
  directExecution,
  failCommand,
  JOIN_CONTROL_QUALIFICATION_ARTIFACT_ROOT,
  parseCaseId,
  repositoryRootFor,
  sha256,
} from "./lib/join-control-qualification-command.ts";
import { readRepositoryRegularFile } from "./lib/research-artifact-io.ts";

const USAGE =
  "Usage: pnpm research:carrier:join-control-qualification:inspect-text -- <case-id> <repository-relative-text-path>";

export const runInspectJoinControlQualificationTextCommand = async (
  repositoryRoot: string,
  args: readonly string[],
): Promise<void> => {
  const caseId = args.length === 2 ? parseCaseId(args[0]) : null;
  const artifactPath = args[1];
  if (caseId === null || !artifactPath) {
    failCommand(USAGE);
    return;
  }
  try {
    const bytes = await readRepositoryRegularFile({
      repositoryRoot,
      allowedRoot: JOIN_CONTROL_QUALIFICATION_ARTIFACT_ROOT,
      relativePath: artifactPath,
    });
    const inspection = inspectJoinControlQualificationText(
      bytes,
      caseId,
      "roundtrip",
    );
    process.stdout.write(
      `${JSON.stringify({ artifactPath, sha256: sha256(bytes), ...inspection })}\n`,
    );
  } catch {
    failCommand("Unable to inspect qualification text.");
  }
};

if (directExecution(import.meta.url)) {
  void runInspectJoinControlQualificationTextCommand(
    repositoryRootFor(import.meta.url),
    commandArguments(),
  );
}
